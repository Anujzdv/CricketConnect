import { pool, isDbConnected } from '../../config/db.js';
import { cache } from '../../config/redis.js';
import { AppError } from '../../middleware/errorHandler.js';
import { IN_MEMORY_STORE } from '../../db/inMemoryData.js';

export const groundsService = {
  /**
   * Search and filter grounds with pagination (Cache-aside reads)
   */
  async listGrounds(filters = {}) {
    const cacheKey = `grounds_list_${JSON.stringify(filters)}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { city, amenity, date, minPrice, maxPrice, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    if (!isDbConnected()) {
      let list = [...IN_MEMORY_STORE.grounds].filter(g => g.is_active);
      if (city) {
        list = list.filter(g => g.city.toLowerCase() === city.trim().toLowerCase());
      }
      if (amenity) {
        list = list.filter(g => g.amenities?.some(a => a.toLowerCase().includes(amenity.trim().toLowerCase())));
      }
      if (minPrice !== undefined) {
        list = list.filter(g => (g.starting_price || 0) >= parseFloat(minPrice));
      }
      if (maxPrice !== undefined) {
        list = list.filter(g => (g.starting_price || 0) <= parseFloat(maxPrice));
      }

      // Attach available slots count
      const enriched = list.map(g => {
        const availableSlots = IN_MEMORY_STORE.slots.filter(s => s.ground_id === g.id && s.status === 'available');
        return {
          ...g,
          available_slots_count: availableSlots.length
        };
      });

      const paginated = enriched.slice(offset, offset + limit);
      const resData = {
        grounds: paginated,
        pagination: {
          total: enriched.length,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(enriched.length / limit) || 1
        }
      };
      await cache.set(cacheKey, resData, 60);
      return resData;
    }

    const conditions = ['g.is_active = TRUE'];
    const params = [];
    let paramIndex = 1;

    if (city) {
      conditions.push(`LOWER(g.city) = LOWER($${paramIndex++})`);
      params.push(city.trim());
    }

    if (amenity) {
      conditions.push(`$${paramIndex++} = ANY(g.amenities)`);
      params.push(amenity.trim());
    }

    let slotJoin = '';
    if (date || minPrice !== undefined || maxPrice !== undefined) {
      slotJoin = `JOIN ground_slots gs ON gs.ground_id = g.id`;
      
      if (date) {
        conditions.push(`gs.slot_date = $${paramIndex++}`);
        params.push(date);
        conditions.push(`gs.status = 'available'`);
      }

      if (minPrice !== undefined) {
        conditions.push(`gs.price >= $${paramIndex++}`);
        params.push(minPrice);
      }

      if (maxPrice !== undefined) {
        conditions.push(`gs.price <= $${paramIndex++}`);
        params.push(maxPrice);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(DISTINCT g.id) AS total
      FROM grounds g
      ${slotJoin}
      ${whereClause};
    `;

    const listParams = [...params, limit, offset];
    const listSql = `
      SELECT 
        g.id,
        g.owner_id,
        g.name,
        g.city,
        g.latitude,
        g.longitude,
        g.cover_image_url,
        g.amenities,
        g.created_at,
        u.name AS owner_name,
        COALESCE(MIN(gs_all.price), 0) AS starting_price,
        COUNT(DISTINCT CASE WHEN gs_all.status = 'available' AND gs_all.slot_date >= CURRENT_DATE THEN gs_all.id END) AS available_slots_count
      FROM grounds g
      LEFT JOIN users u ON u.id = g.owner_id
      LEFT JOIN ground_slots gs_all ON gs_all.ground_id = g.id
      ${slotJoin}
      ${whereClause}
      GROUP BY g.id, u.name
      ORDER BY g.id DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    try {
      const countRes = await pool.query(countSql, params);
      const total = parseInt(countRes.rows[0]?.total || '0', 10);
      const listRes = await pool.query(listSql, listParams);

      const result = {
        grounds: listRes.rows,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / limit)
        }
      };

      await cache.set(cacheKey, result, 60);
      return result;
    } catch {
      let fallbackList = [...IN_MEMORY_STORE.grounds];
      if (city) fallbackList = fallbackList.filter(g => g.city.toLowerCase() === city.toLowerCase());
      return {
        grounds: fallbackList,
        pagination: { total: fallbackList.length, page: 1, limit, totalPages: 1 }
      };
    }
  },

  /**
   * Fetch ground details by ID including available slots (Cache-aside reads)
   */
  async getGroundById(id, dateFilter = null) {
    const groundId = parseInt(id, 10);
    const cacheKey = `ground_${groundId}_${dateFilter || 'all'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!isDbConnected()) {
      const ground = IN_MEMORY_STORE.grounds.find(g => g.id === groundId);
      if (!ground || !ground.is_active) {
        throw new AppError('Ground not found or inactive', 404, 'GROUND_NOT_FOUND');
      }

      let slots = IN_MEMORY_STORE.slots.filter(s => s.ground_id === groundId);
      if (dateFilter) {
        slots = slots.filter(s => s.slot_date === dateFilter);
      }
      const owner = IN_MEMORY_STORE.users.find(u => u.id === ground.owner_id) || {};

      const resGround = {
        ...ground,
        owner_name: owner.name || ground.owner_name || 'Ground Owner',
        owner_email: owner.email || 'owner@cricketconnect.com',
        slots
      };

      await cache.set(cacheKey, resGround, 60);
      return resGround;
    }

    try {
      const groundRes = await pool.query(`
        SELECT 
          g.id,
          g.owner_id,
          g.name,
          g.city,
          g.latitude,
          g.longitude,
          g.cover_image_url,
          g.amenities,
          g.is_active,
          g.created_at,
          u.name AS owner_name,
          u.email AS owner_email
        FROM grounds g
        LEFT JOIN users u ON u.id = g.owner_id
        WHERE g.id = $1 AND g.is_active = TRUE;
      `, [groundId]);

      if (groundRes.rows.length === 0) {
        throw new AppError('Ground not found or inactive', 404, 'GROUND_NOT_FOUND');
      }

      const ground = groundRes.rows[0];

      let slotParams = [groundId];
      let slotSql = `
        SELECT id, ground_id, slot_date, start_time, end_time, price, status
        FROM ground_slots
        WHERE ground_id = $1
      `;

      if (dateFilter) {
        slotSql += ` AND slot_date = $2`;
        slotParams.push(dateFilter);
      } else {
        slotSql += ` AND slot_date >= CURRENT_DATE`;
      }

      slotSql += ` ORDER BY slot_date ASC, start_time ASC;`;

      const slotRes = await pool.query(slotSql, slotParams);
      ground.slots = slotRes.rows;

      await cache.set(cacheKey, ground, 60);
      return ground;
    } catch (err) {
      if (err instanceof AppError) throw err;
      const ground = IN_MEMORY_STORE.grounds.find(g => g.id === groundId);
      if (!ground) throw new AppError('Ground not found', 404, 'GROUND_NOT_FOUND');
      const resGround = { ...ground };
      resGround.slots = IN_MEMORY_STORE.slots.filter(s => s.ground_id === groundId);
      return resGround;
    }
  },

  /**
   * Create a new ground
   */
  async createGround(data) {
    const { owner_id, name, city, latitude, longitude, cover_image_url, amenities = [] } = data;

    if (!isDbConnected()) {
      const user = IN_MEMORY_STORE.users.find(u => u.id === owner_id);
      if (!user) {
        throw new AppError('Owner does not exist', 404, 'USER_NOT_FOUND');
      }

      const newGround = {
        id: IN_MEMORY_STORE.grounds.length + 1,
        owner_id,
        name: name.trim(),
        city: city.trim(),
        latitude: latitude ? parseFloat(latitude) : 19.0760,
        longitude: longitude ? parseFloat(longitude) : 72.8777,
        cover_image_url: cover_image_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
        amenities: amenities || ['Floodlights', 'Pavilion'],
        is_active: true,
        owner_name: user.name,
        starting_price: 3000,
        available_slots_count: 0,
        created_at: new Date().toISOString()
      };

      IN_MEMORY_STORE.grounds.push(newGround);
      await cache.flush();
      return newGround;
    }

    try {
      const userRes = await pool.query('SELECT id, role FROM users WHERE id = $1', [owner_id]);
      if (userRes.rows.length === 0) {
        throw new AppError('Owner does not exist', 404, 'USER_NOT_FOUND');
      }

      const insertSql = `
        INSERT INTO grounds (owner_id, name, city, latitude, longitude, cover_image_url, amenities)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;

      const res = await pool.query(insertSql, [
        owner_id,
        name,
        city,
        latitude || null,
        longitude || null,
        cover_image_url || null,
        amenities
      ]);

      await cache.flush();
      return res.rows[0];
    } catch (err) {
      if (err instanceof AppError) throw err;
      return this.createGroundInMemory(data);
    }
  },

  createGroundInMemory(data) {
    const { owner_id, name, city, latitude, longitude, cover_image_url, amenities = [] } = data;
    const user = IN_MEMORY_STORE.users.find(u => u.id === owner_id) || { name: 'Ground Owner' };
    const newGround = {
      id: IN_MEMORY_STORE.grounds.length + 1,
      owner_id,
      name: name.trim(),
      city: city.trim(),
      latitude: latitude ? parseFloat(latitude) : 19.0760,
      longitude: longitude ? parseFloat(longitude) : 72.8777,
      cover_image_url: cover_image_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
      amenities,
      is_active: true,
      owner_name: user.name,
      starting_price: 3000,
      available_slots_count: 0,
      created_at: new Date().toISOString()
    };
    IN_MEMORY_STORE.grounds.push(newGround);
    return newGround;
  },

  /**
   * Bulk-add slots to a ground
   */
  async bulkAddSlots(groundId, slots = []) {
    const numGroundId = parseInt(groundId, 10);

    if (!isDbConnected()) {
      const ground = IN_MEMORY_STORE.grounds.find(g => g.id === numGroundId);
      if (!ground) {
        throw new AppError('Ground not found', 404, 'GROUND_NOT_FOUND');
      }

      const createdSlots = [];
      for (const slot of slots) {
        const newSlot = {
          id: IN_MEMORY_STORE.slots.length + 1,
          ground_id: numGroundId,
          slot_date: slot.slot_date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          price: parseFloat(slot.price),
          status: 'available'
        };
        IN_MEMORY_STORE.slots.push(newSlot);
        createdSlots.push(newSlot);
      }

      await cache.flush();
      return createdSlots;
    }

    try {
      const groundRes = await pool.query('SELECT id FROM grounds WHERE id = $1', [numGroundId]);
      if (groundRes.rows.length === 0) {
        throw new AppError('Ground not found', 404, 'GROUND_NOT_FOUND');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const createdSlots = [];
        for (const slot of slots) {
          const { slot_date, start_time, end_time, price } = slot;
          const insertRes = await client.query(`
            INSERT INTO ground_slots (ground_id, slot_date, start_time, end_time, price, status)
            VALUES ($1, $2, $3, $4, $5, 'available')
            ON CONFLICT (ground_id, slot_date, start_time) DO NOTHING
            RETURNING *;
          `, [numGroundId, slot_date, start_time, end_time, price]);

          if (insertRes.rows.length > 0) {
            createdSlots.push(insertRes.rows[0]);
          }
        }

        await client.query('COMMIT');
        await cache.flush();
        return createdSlots;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      return this.bulkAddSlotsInMemory(numGroundId, slots);
    }
  },

  bulkAddSlotsInMemory(groundId, slots) {
    const createdSlots = [];
    for (const slot of slots) {
      const newSlot = {
        id: IN_MEMORY_STORE.slots.length + 1,
        ground_id: groundId,
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        price: parseFloat(slot.price),
        status: 'available'
      };
      IN_MEMORY_STORE.slots.push(newSlot);
      createdSlots.push(newSlot);
    }
    return createdSlots;
  },

  /**
   * Get slots for a specific ground
   */
  async getSlots(groundId, date = null) {
    const numGroundId = parseInt(groundId, 10);

    if (!isDbConnected()) {
      let slots = IN_MEMORY_STORE.slots.filter(s => s.ground_id === numGroundId);
      if (date) {
        slots = slots.filter(s => s.slot_date === date);
      }
      return slots;
    }

    try {
      let sql = `
        SELECT id, ground_id, slot_date, start_time, end_time, price, status
        FROM ground_slots
        WHERE ground_id = $1
      `;
      const params = [numGroundId];

      if (date) {
        sql += ` AND slot_date = $2`;
        params.push(date);
      } else {
        sql += ` AND slot_date >= CURRENT_DATE`;
      }

      sql += ` ORDER BY slot_date ASC, start_time ASC;`;
      const res = await pool.query(sql, params);
      return res.rows;
    } catch {
      let slots = IN_MEMORY_STORE.slots.filter(s => s.ground_id === numGroundId);
      if (date) slots = slots.filter(s => s.slot_date === date);
      return slots;
    }
  }
};
