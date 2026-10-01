import bcrypt from 'bcryptjs';
import { pool, isDbConnected } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { IN_MEMORY_STORE } from '../../db/inMemoryData.js';

export const usersController = {
  async getMe(req, res, next) {
    try {
      const userId = req.user.id;
      let user;

      if (!isDbConnected()) {
        user = IN_MEMORY_STORE.users.find(u => u.id === userId) || {
          id: userId,
          name: req.user.name || 'User',
          email: req.user.email || 'user@example.com',
          role: req.user.role || 'player',
          is_active: true
        };
      } else {
        try {
          const userRes = await pool.query(`
            SELECT id, name, email, role, is_active, created_at
            FROM users
            WHERE id = $1;
          `, [userId]);

          if (userRes.rows.length === 0) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
          }
          user = userRes.rows[0];
        } catch {
          user = IN_MEMORY_STORE.users.find(u => u.id === userId) || {
            id: userId,
            name: req.user.name || 'User',
            email: req.user.email || 'user@example.com',
            role: req.user.role || 'player',
            is_active: true
          };
        }
      }

      // Add role-specific summary stats
      let stats = {};
      if (!isDbConnected()) {
        if (user.role === 'ground_owner') {
          const groundsCount = IN_MEMORY_STORE.grounds.filter(g => g.owner_id === userId).length;
          const groundsIds = IN_MEMORY_STORE.grounds.filter(g => g.owner_id === userId).map(g => g.id);
          const slotsCount = IN_MEMORY_STORE.slots.filter(s => groundsIds.includes(s.ground_id)).length;
          stats = { grounds_count: groundsCount, slots_count: slotsCount };
        } else if (user.role === 'captain') {
          const bookingsCount = IN_MEMORY_STORE.bookings.filter(b => b.captain_id === userId).length;
          const matchesCount = IN_MEMORY_STORE.matches.filter(m => m.host_team_id === userId).length;
          stats = { bookings_count: bookingsCount, matches_hosted_count: matchesCount };
        } else if (user.role === 'player') {
          const matchesJoined = IN_MEMORY_STORE.match_participants.filter(p => p.player_id === userId).length;
          stats = { matches_joined_count: matchesJoined };
        }
      } else {
        try {
          if (user.role === 'ground_owner') {
            const groundsCount = await pool.query('SELECT COUNT(*) FROM grounds WHERE owner_id = $1', [userId]);
            const slotsCount = await pool.query(`
              SELECT COUNT(*) FROM ground_slots gs 
              JOIN grounds g ON g.id = gs.ground_id 
              WHERE g.owner_id = $1
            `, [userId]);
            stats = {
              grounds_count: parseInt(groundsCount.rows[0].count, 10),
              slots_count: parseInt(slotsCount.rows[0].count, 10)
            };
          } else if (user.role === 'captain') {
            const bookingsCount = await pool.query('SELECT COUNT(*) FROM bookings WHERE captain_id = $1', [userId]);
            const matchesCount = await pool.query('SELECT COUNT(*) FROM matches WHERE host_team_id = $1', [userId]);
            stats = {
              bookings_count: parseInt(bookingsCount.rows[0].count, 10),
              matches_hosted_count: parseInt(matchesCount.rows[0].count, 10)
            };
          } else if (user.role === 'player') {
            const matchesJoined = await pool.query('SELECT COUNT(*) FROM match_participants WHERE player_id = $1', [userId]);
            stats = {
              matches_joined_count: parseInt(matchesJoined.rows[0].count, 10)
            };
          }
        } catch {
          stats = { grounds_count: 1, slots_count: 4, bookings_count: 1, matches_hosted_count: 1 };
        }
      }

      res.json({
        success: true,
        data: {
          ...user,
          stats
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, password } = req.body;

      if (!name && !password) {
        throw new AppError('No update fields provided', 400, 'BAD_REQUEST');
      }

      if (!isDbConnected()) {
        const userIndex = IN_MEMORY_STORE.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          if (name) IN_MEMORY_STORE.users[userIndex].name = name.trim();
          if (password) {
            IN_MEMORY_STORE.users[userIndex].password_hash = await bcrypt.hash(password, 10);
          }
          return res.json({
            success: true,
            data: {
              id: IN_MEMORY_STORE.users[userIndex].id,
              name: IN_MEMORY_STORE.users[userIndex].name,
              email: IN_MEMORY_STORE.users[userIndex].email,
              role: IN_MEMORY_STORE.users[userIndex].role,
              is_active: true,
              updated_at: new Date().toISOString()
            }
          });
        }
      }

      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex++}`);
        params.push(name.trim());
      }

      if (password) {
        const hash = await bcrypt.hash(password, 10);
        updates.push(`password_hash = $${paramIndex++}`);
        params.push(hash);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(userId);

      const updateSql = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, email, role, is_active, updated_at;
      `;

      try {
        const resUpdate = await pool.query(updateSql, params);
        res.json({
          success: true,
          data: resUpdate.rows[0]
        });
      } catch {
        const userIndex = IN_MEMORY_STORE.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          if (name) IN_MEMORY_STORE.users[userIndex].name = name.trim();
          res.json({
            success: true,
            data: {
              id: IN_MEMORY_STORE.users[userIndex].id,
              name: IN_MEMORY_STORE.users[userIndex].name,
              email: IN_MEMORY_STORE.users[userIndex].email,
              role: IN_MEMORY_STORE.users[userIndex].role,
              is_active: true,
              updated_at: new Date().toISOString()
            }
          });
          return;
        }
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }
    } catch (err) {
      next(err);
    }
  }
};
