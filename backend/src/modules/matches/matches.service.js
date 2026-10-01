import { pool, isDbConnected } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { io } from '../../server.js';
import { IN_MEMORY_STORE } from '../../db/inMemoryData.js';

export const matchesService = {
  /**
   * List matches with optional status/ground filtering and pagination
   */
  async listMatches(filters = {}) {
    const { status, ground_id, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    if (!isDbConnected()) {
      let matches = [...IN_MEMORY_STORE.matches];
      if (status) {
        matches = matches.filter(m => m.status === status);
      }
      if (ground_id) {
        matches = matches.filter(m => m.ground_id === parseInt(ground_id, 10));
      }

      // Populate dynamic squad count from match_participants
      const enriched = matches.map(m => {
        const squadCount = IN_MEMORY_STORE.match_participants.filter(p => p.match_id === m.id).length;
        return {
          ...m,
          squad_count: squadCount || m.squad_count || 1
        };
      });

      const paginated = enriched.slice(offset, offset + limit);
      return {
        matches: paginated,
        pagination: {
          total: enriched.length,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(enriched.length / limit) || 1
        }
      };
    }

    try {
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`m.status = $${paramIndex++}`);
        params.push(status);
      }

      if (ground_id) {
        conditions.push(`m.ground_id = $${paramIndex++}`);
        params.push(ground_id);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countSql = `SELECT COUNT(*) AS total FROM matches m ${whereClause};`;
      const countRes = await pool.query(countSql, params);
      const total = parseInt(countRes.rows[0]?.total || '0', 10);

      const listParams = [...params, limit, offset];
      const listSql = `
        SELECT 
          m.id,
          m.title,
          m.host_team_id,
          u.name AS host_captain_name,
          m.guest_team,
          m.ground_id,
          g.name AS ground_name,
          g.city AS ground_city,
          m.slot_id,
          gs.slot_date,
          gs.start_time,
          gs.end_time,
          m.status,
          m.format,
          m.current_score,
          m.created_at,
          COUNT(DISTINCT mp.id) AS squad_count
        FROM matches m
        JOIN users u ON u.id = m.host_team_id
        JOIN grounds g ON g.id = m.ground_id
        LEFT JOIN ground_slots gs ON gs.id = m.slot_id
        LEFT JOIN match_participants mp ON mp.match_id = m.id
        ${whereClause}
        GROUP BY m.id, u.name, g.name, g.city, gs.slot_date, gs.start_time, gs.end_time
        ORDER BY 
          CASE WHEN m.status = 'live' THEN 1 WHEN m.status = 'scheduled' THEN 2 ELSE 3 END,
          m.id DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++};
      `;

      const listRes = await pool.query(listSql, listParams);

      return {
        matches: listRes.rows,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch {
      let matches = [...IN_MEMORY_STORE.matches];
      if (status) matches = matches.filter(m => m.status === status);
      return {
        matches,
        pagination: { total: matches.length, page: 1, limit, totalPages: 1 }
      };
    }
  },

  /**
   * Fetch match details by ID with participants
   */
  async getMatchById(id) {
    const matchId = parseInt(id, 10);

    if (!isDbConnected()) {
      const match = IN_MEMORY_STORE.matches.find(m => m.id === matchId);
      if (!match) {
        throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
      }

      const ground = IN_MEMORY_STORE.grounds.find(g => g.id === match.ground_id) || {};
      const slot = IN_MEMORY_STORE.slots.find(s => s.id === match.slot_id) || {};

      const participants = IN_MEMORY_STORE.match_participants
        .filter(p => p.match_id === matchId)
        .map(p => {
          const user = IN_MEMORY_STORE.users.find(u => u.id === p.player_id) || {};
          return {
            id: p.id,
            player_id: p.player_id,
            player_name: user.name || p.player_name || 'Player',
            player_email: user.email || 'player@cricketconnect.com',
            team: p.team || 'host',
            joined_at: p.joined_at || new Date().toISOString()
          };
        });

      return {
        ...match,
        ground_cover_url: ground.cover_image_url || null,
        slot_date: slot.slot_date || null,
        start_time: slot.start_time || null,
        end_time: slot.end_time || null,
        participants
      };
    }

    try {
      const matchRes = await pool.query(`
        SELECT 
          m.id,
          m.title,
          m.host_team_id,
          u.name AS host_captain_name,
          u.email AS host_captain_email,
          m.guest_team,
          m.ground_id,
          g.name AS ground_name,
          g.city AS ground_city,
          g.cover_image_url AS ground_cover_url,
          m.slot_id,
          gs.slot_date,
          gs.start_time,
          gs.end_time,
          m.status,
          m.format,
          m.current_score,
          m.created_at
        FROM matches m
        JOIN users u ON u.id = m.host_team_id
        JOIN grounds g ON g.id = m.ground_id
        LEFT JOIN ground_slots gs ON gs.id = m.slot_id
        WHERE m.id = $1;
      `, [matchId]);

      if (matchRes.rows.length === 0) {
        throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
      }

      const match = matchRes.rows[0];

      const participantsRes = await pool.query(`
        SELECT 
          mp.id,
          mp.player_id,
          u.name AS player_name,
          u.email AS player_email,
          mp.team,
          mp.joined_at
        FROM match_participants mp
        JOIN users u ON u.id = mp.player_id
        WHERE mp.match_id = $1
        ORDER BY mp.joined_at ASC;
      `, [matchId]);

      match.participants = participantsRes.rows;
      return match;
    } catch (err) {
      if (err instanceof AppError) throw err;
      return this.getMatchByIdFallback(matchId);
    }
  },

  getMatchByIdFallback(matchId) {
    const match = IN_MEMORY_STORE.matches.find(m => m.id === matchId);
    if (!match) throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
    const ground = IN_MEMORY_STORE.grounds.find(g => g.id === match.ground_id) || {};
    const participants = IN_MEMORY_STORE.match_participants
      .filter(p => p.match_id === matchId)
      .map(p => {
        const u = IN_MEMORY_STORE.users.find(usr => usr.id === p.player_id) || {};
        return {
          id: p.id,
          player_id: p.player_id,
          player_name: u.name || 'Player',
          team: p.team || 'host',
          joined_at: p.joined_at
        };
      });
    return {
      ...match,
      ground_cover_url: ground.cover_image_url || null,
      participants
    };
  },

  /**
   * Create match and enroll host as first squad participant
   */
  async createMatch(data) {
    const { title, host_team_id, guest_team = 'Opponent Squad', ground_id, slot_id, format = 'T20' } = data;

    if (!isDbConnected()) {
      const user = IN_MEMORY_STORE.users.find(u => u.id === host_team_id);
      if (!user) {
        throw new AppError('Host captain user not found', 404, 'USER_NOT_FOUND');
      }

      const ground = IN_MEMORY_STORE.grounds.find(g => g.id === parseInt(ground_id, 10));
      if (!ground) {
        throw new AppError('Ground not found', 404, 'GROUND_NOT_FOUND');
      }

      const initialScore = {
        runs: 0,
        wickets: 0,
        overs: "0.0",
        target: null,
        innings: 1,
        run_rate: "0.00"
      };

      const newMatchId = IN_MEMORY_STORE.matches.length + 1;
      const createdMatch = {
        id: newMatchId,
        title,
        host_team_id,
        host_captain_name: user.name,
        guest_team,
        ground_id: parseInt(ground_id, 10),
        ground_name: ground.name,
        ground_city: ground.city,
        slot_id: slot_id ? parseInt(slot_id, 10) : null,
        status: 'scheduled',
        format,
        current_score: initialScore,
        squad_count: 1,
        created_at: new Date().toISOString()
      };

      IN_MEMORY_STORE.matches.push(createdMatch);

      // Auto-enroll host captain in participants
      IN_MEMORY_STORE.match_participants.push({
        id: IN_MEMORY_STORE.match_participants.length + 1,
        match_id: newMatchId,
        player_id: host_team_id,
        player_name: user.name,
        team: 'host',
        joined_at: new Date().toISOString()
      });

      return createdMatch;
    }

    try {
      const userRes = await pool.query('SELECT id, role FROM users WHERE id = $1', [host_team_id]);
      if (userRes.rows.length === 0) {
        throw new AppError('Host captain user not found', 404, 'USER_NOT_FOUND');
      }

      const groundRes = await pool.query('SELECT id FROM grounds WHERE id = $1', [ground_id]);
      if (groundRes.rows.length === 0) {
        throw new AppError('Ground not found', 404, 'GROUND_NOT_FOUND');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const initialScore = {
          runs: 0,
          wickets: 0,
          overs: "0.0",
          target: null,
          innings: 1,
          run_rate: "0.00"
        };

        const matchRes = await client.query(`
          INSERT INTO matches (title, host_team_id, guest_team, ground_id, slot_id, status, format, current_score)
          VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7)
          RETURNING *;
        `, [title, host_team_id, guest_team, ground_id, slot_id || null, format, JSON.stringify(initialScore)]);

        const createdMatch = matchRes.rows[0];

        await client.query(`
          INSERT INTO match_participants (match_id, player_id, team)
          VALUES ($1, $2, 'host')
          ON CONFLICT (match_id, player_id) DO NOTHING;
        `, [createdMatch.id, host_team_id]);

        await client.query('COMMIT');
        return createdMatch;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Fallback
      return this.createMatchFallback(data);
    }
  },

  createMatchFallback(data) {
    const { title, host_team_id, guest_team = 'Opponent Squad', ground_id, slot_id, format = 'T20' } = data;
    const user = IN_MEMORY_STORE.users.find(u => u.id === host_team_id) || IN_MEMORY_STORE.users[1];
    const ground = IN_MEMORY_STORE.grounds.find(g => g.id === parseInt(ground_id, 10)) || IN_MEMORY_STORE.grounds[0];

    const initialScore = { runs: 0, wickets: 0, overs: "0.0", target: null, innings: 1, run_rate: "0.00" };
    const newMatchId = IN_MEMORY_STORE.matches.length + 1;
    const createdMatch = {
      id: newMatchId,
      title,
      host_team_id,
      host_captain_name: user.name,
      guest_team,
      ground_id: ground.id,
      ground_name: ground.name,
      ground_city: ground.city,
      slot_id: slot_id ? parseInt(slot_id, 10) : null,
      status: 'scheduled',
      format,
      current_score: initialScore,
      squad_count: 1,
      created_at: new Date().toISOString()
    };
    IN_MEMORY_STORE.matches.push(createdMatch);
    IN_MEMORY_STORE.match_participants.push({
      id: IN_MEMORY_STORE.match_participants.length + 1,
      match_id: newMatchId,
      player_id: host_team_id,
      player_name: user.name,
      team: 'host',
      joined_at: new Date().toISOString()
    });
    return createdMatch;
  },

  /**
   * Join a match's squad
   */
  async joinMatch(matchId, playerId, team = 'host') {
    const numMatchId = parseInt(matchId, 10);
    const numPlayerId = parseInt(playerId, 10);

    if (!isDbConnected()) {
      const match = IN_MEMORY_STORE.matches.find(m => m.id === numMatchId);
      if (!match) {
        throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
      }

      if (match.status === 'completed' || match.status === 'abandoned') {
        throw new AppError('Cannot join a completed or abandoned match', 400, 'MATCH_INACTIVE');
      }

      const player = IN_MEMORY_STORE.users.find(u => u.id === numPlayerId);
      if (!player) {
        throw new AppError('Player not found', 404, 'USER_NOT_FOUND');
      }

      // Check if already joined
      const already = IN_MEMORY_STORE.match_participants.find(
        p => p.match_id === numMatchId && p.player_id === numPlayerId
      );
      if (already) {
        throw new AppError('Player has already joined this match squad', 409, 'ALREADY_JOINED');
      }

      const newParticipant = {
        id: IN_MEMORY_STORE.match_participants.length + 1,
        match_id: numMatchId,
        player_id: numPlayerId,
        player_name: player.name,
        team,
        joined_at: new Date().toISOString()
      };

      IN_MEMORY_STORE.match_participants.push(newParticipant);
      match.squad_count = (match.squad_count || 1) + 1;

      return newParticipant;
    }

    try {
      const matchRes = await pool.query('SELECT id, status FROM matches WHERE id = $1', [numMatchId]);
      if (matchRes.rows.length === 0) {
        throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
      }

      if (matchRes.rows[0].status === 'completed' || matchRes.rows[0].status === 'abandoned') {
        throw new AppError('Cannot join a completed or abandoned match', 400, 'MATCH_INACTIVE');
      }

      const userRes = await pool.query('SELECT id, name FROM users WHERE id = $1', [numPlayerId]);
      if (userRes.rows.length === 0) {
        throw new AppError('Player not found', 404, 'USER_NOT_FOUND');
      }

      const res = await pool.query(`
        INSERT INTO match_participants (match_id, player_id, team)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [numMatchId, numPlayerId, team]);

      return res.rows[0];
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err.code === '23505') {
        throw new AppError('Player has already joined this match squad', 409, 'ALREADY_JOINED');
      }
      // Fallback
      return this.joinMatchFallback(numMatchId, numPlayerId, team);
    }
  },

  joinMatchFallback(matchId, playerId, team) {
    const match = IN_MEMORY_STORE.matches.find(m => m.id === matchId);
    if (!match) throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
    const player = IN_MEMORY_STORE.users.find(u => u.id === playerId) || { name: 'Player' };
    const already = IN_MEMORY_STORE.match_participants.find(p => p.match_id === matchId && p.player_id === playerId);
    if (already) throw new AppError('Player has already joined this match squad', 409, 'ALREADY_JOINED');

    const participant = {
      id: IN_MEMORY_STORE.match_participants.length + 1,
      match_id: matchId,
      player_id: playerId,
      player_name: player.name,
      team,
      joined_at: new Date().toISOString()
    };
    IN_MEMORY_STORE.match_participants.push(participant);
    match.squad_count = (match.squad_count || 1) + 1;
    return participant;
  },

  /**
   * Update live score and emit Socket.io event to match room
   */
  async updateScore(matchId, scoreData) {
    const numMatchId = parseInt(matchId, 10);
    const { runs, wickets, overs, target, innings, run_rate, status } = scoreData;

    if (!isDbConnected()) {
      const match = IN_MEMORY_STORE.matches.find(m => m.id === numMatchId);
      if (!match) {
        throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
      }

      const currentScore = match.current_score || {};
      const updatedScore = {
        ...currentScore,
        runs: runs !== undefined ? runs : currentScore.runs,
        wickets: wickets !== undefined ? wickets : currentScore.wickets,
        overs: overs !== undefined ? overs : currentScore.overs,
        target: target !== undefined ? target : currentScore.target,
        innings: innings !== undefined ? innings : currentScore.innings,
        run_rate: run_rate || (overs && overs !== '0.0' ? (runs / (parseFloat(overs) || 1)).toFixed(2) : currentScore.run_rate || "0.00")
      };

      match.current_score = updatedScore;
      if (status) {
        match.status = status;
      } else if (match.status === 'scheduled') {
        match.status = 'live';
      }

      // Real-time broadcast via Socket.io
      const room = `match_${numMatchId}`;
      io.to(room).emit('score_update', {
        matchId: numMatchId,
        status: match.status,
        current_score: match.current_score,
        timestamp: new Date().toISOString()
      });

      return match;
    }

    try {
      const matchRes = await pool.query('SELECT id, current_score, status FROM matches WHERE id = $1', [numMatchId]);
      if (matchRes.rows.length === 0) {
        throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
      }

      const currentScore = matchRes.rows[0].current_score || {};
      const updatedScore = {
        ...currentScore,
        runs,
        wickets,
        overs,
        target: target !== undefined ? target : currentScore.target,
        innings: innings !== undefined ? innings : currentScore.innings,
        run_rate: run_rate || (overs && overs !== '0.0' ? (runs / (parseFloat(overs) || 1)).toFixed(2) : "0.00")
      };

      const newStatus = status || (matchRes.rows[0].status === 'scheduled' ? 'live' : matchRes.rows[0].status);

      const updateRes = await pool.query(`
        UPDATE matches
        SET current_score = $1, status = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *;
      `, [JSON.stringify(updatedScore), newStatus, numMatchId]);

      const updatedMatch = updateRes.rows[0];

      const room = `match_${numMatchId}`;
      io.to(room).emit('score_update', {
        matchId: numMatchId,
        status: updatedMatch.status,
        current_score: updatedMatch.current_score,
        timestamp: new Date().toISOString()
      });

      return updatedMatch;
    } catch (err) {
      if (err instanceof AppError) throw err;
      return this.updateScoreFallback(numMatchId, scoreData);
    }
  },

  updateScoreFallback(matchId, scoreData) {
    const match = IN_MEMORY_STORE.matches.find(m => m.id === matchId);
    if (!match) throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
    const { runs, wickets, overs, target, innings, run_rate, status } = scoreData;
    const currentScore = match.current_score || {};
    match.current_score = {
      ...currentScore,
      runs: runs !== undefined ? runs : currentScore.runs,
      wickets: wickets !== undefined ? wickets : currentScore.wickets,
      overs: overs !== undefined ? overs : currentScore.overs,
      target: target !== undefined ? target : currentScore.target,
      innings: innings !== undefined ? innings : currentScore.innings,
      run_rate: run_rate || (overs && overs !== '0.0' ? (runs / (parseFloat(overs) || 1)).toFixed(2) : currentScore.run_rate || "0.00")
    };
    if (status) match.status = status;
    else if (match.status === 'scheduled') match.status = 'live';

    const room = `match_${matchId}`;
    io.to(room).emit('score_update', {
      matchId,
      status: match.status,
      current_score: match.current_score,
      timestamp: new Date().toISOString()
    });
    return match;
  }
};
