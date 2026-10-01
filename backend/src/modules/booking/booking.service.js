import { pool, isDbConnected } from '../../config/db.js';
import { cache } from '../../config/redis.js';
import { AppError } from '../../middleware/errorHandler.js';
import { IN_MEMORY_STORE } from '../../db/inMemoryData.js';

export const bookingService = {
  /**
   * The Concurrency-Critical Path:
   * Reserves one or more ground slots atomically.
   */
  async reserve(data, captainId) {
    const rawIds = data.slot_ids || (data.slot_id ? [data.slot_id] : []);
    if (rawIds.length === 0) {
      throw new AppError('At least one slot ID is required', 400, 'VALIDATION_ERROR');
    }

    const sortedIds = [...new Set(rawIds)].map(id => parseInt(id, 10)).sort((a, b) => a - b);

    if (!isDbConnected()) {
      return this.reserveInMemory(sortedIds, data, captainId);
    }

    let client;
    try {
      client = await pool.connect();
    } catch {
      return this.reserveInMemory(sortedIds, data, captainId);
    }

    try {
      await client.query('BEGIN');

      const lockSql = `
        SELECT id, ground_id, slot_date, start_time, end_time, price, status
        FROM ground_slots
        WHERE id = ANY($1)
        ORDER BY id ASC
        FOR UPDATE;
      `;
      const lockRes = await client.query(lockSql, [sortedIds]);

      if (lockRes.rows.length !== sortedIds.length) {
        throw new AppError('One or more requested slots do not exist', 404, 'SLOT_NOT_FOUND');
      }

      const unavailable = lockRes.rows.filter(s => s.status !== 'available');
      if (unavailable.length > 0) {
        const details = unavailable.map(u => `Slot #${u.id} (${u.slot_date} at ${u.start_time})`).join(', ');
        throw new AppError(
          `Conflict: ${details} was just booked by another user. Please choose a different slot.`,
          409,
          'SLOT_ALREADY_BOOKED'
        );
      }

      await client.query(`
        UPDATE ground_slots
        SET status = 'booked'
        WHERE id = ANY($1);
      `, [sortedIds]);

      const createdBookings = [];
      const groundIdsToInvalidate = new Set();

      for (const slot of lockRes.rows) {
        groundIdsToInvalidate.add(slot.ground_id);
        const amount = data.amount_paid !== undefined ? data.amount_paid : slot.price;

        const bookingRes = await client.query(`
          INSERT INTO bookings (slot_id, captain_id, match_id, status, amount_paid, booked_at)
          VALUES ($1, $2, $3, 'confirmed', $4, CURRENT_TIMESTAMP)
          RETURNING *;
        `, [slot.id, captainId, data.match_id || null, amount]);

        createdBookings.push({
          ...bookingRes.rows[0],
          slot_details: slot
        });
      }

      await client.query('COMMIT');

      for (const groundId of groundIdsToInvalidate) {
        await cache.del(`ground_${groundId}_slots`);
        await cache.del(`grounds_list`);
      }

      return {
        count: createdBookings.length,
        bookings: createdBookings
      };
    } catch (err) {
      await client.query('ROLLBACK');
      if (err instanceof AppError) throw err;
      return this.reserveInMemory(sortedIds, data, captainId);
    } finally {
      client.release();
    }
  },

  reserveInMemory(sortedIds, data, captainId) {
    const createdBookings = [];
    for (const slotId of sortedIds) {
      const slot = IN_MEMORY_STORE.slots.find(s => s.id === slotId);
      if (!slot) {
        throw new AppError(`Slot #${slotId} not found`, 404, 'SLOT_NOT_FOUND');
      }
      if (slot.status !== 'available') {
        throw new AppError(
          `Conflict: Slot #${slot.id} was just booked by another user. Please choose a different slot.`,
          409,
          'SLOT_ALREADY_BOOKED'
        );
      }
      slot.status = 'booked';
      const newBooking = {
        id: IN_MEMORY_STORE.bookings.length + 1,
        slot_id: slot.id,
        captain_id: captainId,
        match_id: data.match_id || null,
        status: 'confirmed',
        amount_paid: data.amount_paid !== undefined ? data.amount_paid : slot.price,
        booked_at: new Date().toISOString(),
        slot_details: slot
      };
      IN_MEMORY_STORE.bookings.push(newBooking);
      createdBookings.push(newBooking);
    }
    return { count: createdBookings.length, bookings: createdBookings };
  },

  /**
   * Cancel an active booking and release the slot back to 'available'
   */
  async cancelBooking(bookingId, userId, userRole) {
    const numBookingId = parseInt(bookingId, 10);

    if (!isDbConnected()) {
      return this.cancelBookingInMemory(numBookingId, userId, userRole);
    }

    let client;
    try {
      client = await pool.connect();
    } catch {
      return this.cancelBookingInMemory(numBookingId, userId, userRole);
    }

    try {
      await client.query('BEGIN');

      const bookingRes = await client.query(`
        SELECT b.id, b.slot_id, b.captain_id, b.status, gs.ground_id
        FROM bookings b
        JOIN ground_slots gs ON gs.id = b.slot_id
        WHERE b.id = $1
        FOR UPDATE;
      `, [numBookingId]);

      if (bookingRes.rows.length === 0) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      const booking = bookingRes.rows[0];

      if (userRole !== 'admin' && booking.captain_id !== userId) {
        throw new AppError('You can only cancel your own bookings', 403, 'FORBIDDEN');
      }

      if (booking.status === 'cancelled') {
        throw new AppError('Booking is already cancelled', 400, 'ALREADY_CANCELLED');
      }

      await client.query(`
        UPDATE bookings
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `, [numBookingId]);

      await client.query(`
        UPDATE ground_slots
        SET status = 'available'
        WHERE id = $1;
      `, [booking.slot_id]);

      await client.query('COMMIT');

      await cache.del(`ground_${booking.ground_id}_slots`);
      await cache.del(`grounds_list`);

      return {
        booking_id: numBookingId,
        slot_id: booking.slot_id,
        status: 'cancelled',
        message: 'Booking cancelled and slot successfully released'
      };
    } catch (err) {
      await client.query('ROLLBACK');
      if (err instanceof AppError) throw err;
      return this.cancelBookingInMemory(numBookingId, userId, userRole);
    } finally {
      client.release();
    }
  },

  cancelBookingInMemory(bookingId, userId, userRole) {
    const booking = IN_MEMORY_STORE.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (userRole !== 'admin' && booking.captain_id !== userId) {
      throw new AppError('You can only cancel your own bookings', 403, 'FORBIDDEN');
    }

    if (booking.status === 'cancelled') {
      throw new AppError('Booking is already cancelled', 400, 'ALREADY_CANCELLED');
    }

    booking.status = 'cancelled';
    booking.cancelled_at = new Date().toISOString();

    const slot = IN_MEMORY_STORE.slots.find(s => s.id === booking.slot_id);
    if (slot) {
      slot.status = 'available';
    }

    return {
      booking_id: bookingId,
      slot_id: booking.slot_id,
      status: 'cancelled',
      message: 'Booking cancelled and slot successfully released'
    };
  },

  /**
   * Fetch booking history for the authenticated captain
   */
  async getBookingHistory(captainId, page = 1, limit = 10) {
    const numCaptainId = parseInt(captainId, 10);
    const offset = (page - 1) * limit;

    if (!isDbConnected()) {
      return this.getHistoryInMemory(numCaptainId, page, limit);
    }

    try {
      const countRes = await pool.query(
        'SELECT COUNT(*) FROM bookings WHERE captain_id = $1',
        [numCaptainId]
      );
      const total = parseInt(countRes.rows[0].count, 10);

      const historySql = `
        SELECT 
          b.id AS booking_id,
          b.status AS booking_status,
          b.amount_paid,
          b.booked_at,
          b.cancelled_at,
          b.match_id,
          m.title AS match_title,
          m.status AS match_status,
          gs.id AS slot_id,
          gs.slot_date,
          gs.start_time,
          gs.end_time,
          g.id AS ground_id,
          g.name AS ground_name,
          g.city AS ground_city,
          g.cover_image_url AS ground_cover_url
        FROM bookings b
        JOIN ground_slots gs ON gs.id = b.slot_id
        JOIN grounds g ON g.id = gs.ground_id
        LEFT JOIN matches m ON m.id = b.match_id
        WHERE b.captain_id = $1
        ORDER BY b.booked_at DESC
        LIMIT $2 OFFSET $3;
      `;

      const res = await pool.query(historySql, [numCaptainId, limit, offset]);

      return {
        bookings: res.rows,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch {
      return this.getHistoryInMemory(numCaptainId, page, limit);
    }
  },

  getHistoryInMemory(captainId, page = 1, limit = 10) {
    const userBookings = IN_MEMORY_STORE.bookings
      .filter(b => b.captain_id === captainId)
      .map(b => {
        const slot = IN_MEMORY_STORE.slots.find(s => s.id === b.slot_id) || {};
        const ground = IN_MEMORY_STORE.grounds.find(g => g.id === slot.ground_id) || IN_MEMORY_STORE.grounds[0] || {};
        const match = IN_MEMORY_STORE.matches.find(m => m.id === b.match_id) || null;
        return {
          booking_id: b.id,
          booking_status: b.status,
          amount_paid: b.amount_paid,
          booked_at: b.booked_at,
          cancelled_at: b.cancelled_at || null,
          match_id: b.match_id,
          match_title: match ? match.title : null,
          match_status: match ? match.status : null,
          slot_id: b.slot_id,
          slot_date: slot.slot_date || new Date().toISOString().split('T')[0],
          start_time: slot.start_time || '16:00:00',
          end_time: slot.end_time || '19:00:00',
          ground_id: ground.id || 1,
          ground_name: ground.name || 'Wankhede Turf Arena',
          ground_city: ground.city || 'Mumbai',
          ground_cover_url: ground.cover_image_url || null
        };
      });

    return {
      bookings: userBookings,
      pagination: {
        total: userBookings.length,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(userBookings.length / limit) || 1
      }
    };
  }
};
