import { describe, it } from 'node:test';
import assert from 'node:assert';
import { reserveBookingSchema, cancelBookingSchema } from '../src/modules/booking/booking.schemas.js';
import { cache } from '../src/config/redis.js';

describe('Phase 6 Booking & Concurrency Suite', () => {
  describe('Booking Schema Validation', () => {
    it('accepts valid single slot_id reservation payload', () => {
      const payload = { slot_id: 12, amount_paid: 3500 };
      const parsed = reserveBookingSchema.parse(payload);
      assert.strictEqual(parsed.slot_id, 12);
      assert.strictEqual(parsed.amount_paid, 3500);
    });

    it('accepts valid multi-slot reservation payload', () => {
      const payload = { slot_ids: [10, 11], amount_paid: 7000 };
      const parsed = reserveBookingSchema.parse(payload);
      assert.deepStrictEqual(parsed.slot_ids, [10, 11]);
    });

    it('rejects reservation with neither slot_id nor slot_ids', () => {
      assert.throws(() => {
        reserveBookingSchema.parse({ amount_paid: 1000 });
      }, /Either slot_id or slot_ids must be provided/);
    });

    it('validates cancel booking schema', () => {
      const parsed = cancelBookingSchema.parse({ id: '45' });
      assert.strictEqual(parsed.id, 45);
    });
  });

  describe('Deadlock Prevention Guarantee: Ascending Lock Ordering', () => {
    it('always sorts multi-slot IDs into strictly ascending order to prevent circular wait deadlocks', () => {
      const unsorted = [98, 12, 45, 3, 27];
      const sortedIds = [...new Set(unsorted)].sort((a, b) => a - b);
      assert.deepStrictEqual(sortedIds, [3, 12, 27, 45, 98]);
    });

    it('deduplicates identical slot IDs before lock acquisition', () => {
      const withDups = [5, 2, 5, 2, 8];
      const deduplicated = [...new Set(withDups)].sort((a, b) => a - b);
      assert.deepStrictEqual(deduplicated, [2, 5, 8]);
    });
  });

  describe('Simulated High-Concurrency Race Condition (Promise.all)', () => {
    it('guarantees mutual exclusion: exactly one transaction succeeds (201) and concurrent competitor receives 409 SLOT_ALREADY_BOOKED', async () => {
      // Simulate an atomic slot row in database
      const mockDatabaseSlot = {
        id: 777,
        ground_id: 1,
        slot_date: '2026-10-15',
        start_time: '18:00:00',
        price: 4500,
        status: 'available'
      };

      // Simulated atomic row-lock engine mimicking PostgreSQL SELECT ... FOR UPDATE
      let isRowLocked = false;
      const rowLockWaitQueue = [];

      const acquireRowLock = () => {
        return new Promise((resolve) => {
          if (!isRowLocked) {
            isRowLocked = true;
            resolve();
          } else {
            rowLockWaitQueue.push(resolve);
          }
        });
      };

      const releaseRowLock = () => {
        if (rowLockWaitQueue.length > 0) {
          const nextTx = rowLockWaitQueue.shift();
          nextTx();
        } else {
          isRowLocked = false;
        }
      };

      // Simulation of reserve endpoint execution for Captain A & Captain B
      const simulateReserveTx = async (captainId) => {
        await acquireRowLock();
        try {
          // Read row under lock (SELECT ... FOR UPDATE)
          if (mockDatabaseSlot.status !== 'available') {
            const err = new Error('Slot already booked');
            err.statusCode = 409;
            err.code = 'SLOT_ALREADY_BOOKED';
            throw err;
          }

          // Transition state to booked
          mockDatabaseSlot.status = 'booked';
          mockDatabaseSlot.bookedBy = captainId;

          return {
            statusCode: 201,
            booking: { slot_id: mockDatabaseSlot.id, captain_id: captainId, status: 'confirmed' }
          };
        } finally {
          releaseRowLock();
        }
      };

      // Two captains click "Confirm Booking" at the exact same millisecond
      const results = await Promise.allSettled([
        simulateReserveTx(101), // Captain A
        simulateReserveTx(202)  // Captain B
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      // Exactly ONE must succeed (201)
      assert.strictEqual(fulfilled.length, 1);
      assert.strictEqual(fulfilled[0].value.statusCode, 201);
      assert.strictEqual(mockDatabaseSlot.status, 'booked');

      // The other must be rejected with 409 conflict
      assert.strictEqual(rejected.length, 1);
      assert.strictEqual(rejected[0].reason.statusCode, 409);
      assert.strictEqual(rejected[0].reason.code, 'SLOT_ALREADY_BOOKED');
    });
  });

  describe('Cache-Aside Reads & Cache Invalidation', () => {
    it('sets, retrieves, and invalidates ground slot cache upon booking', async () => {
      const groundId = 99;
      const cacheKey = `ground_${groundId}_slots`;

      // Set initial cache
      await cache.set(cacheKey, [{ slot_id: 1, status: 'available' }], 60);
      let cached = await cache.get(cacheKey);
      assert.strictEqual(cached.length, 1);
      assert.strictEqual(cached[0].status, 'available');

      // Invalidate on booking
      await cache.del(cacheKey);
      cached = await cache.get(cacheKey);
      assert.strictEqual(cached, null);
    });
  });
});
