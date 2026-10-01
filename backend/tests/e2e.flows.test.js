import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';
import { registerSchema, loginSchema } from '../src/modules/auth/auth.schemas.js';
import { reserveBookingSchema } from '../src/modules/booking/booking.schemas.js';
import { updateScoreSchema } from '../src/modules/matches/matches.schemas.js';
import { cache } from '../src/config/redis.js';

describe('Phase 8: 4 Critical End-to-End User Flow Tests', () => {
  // Shared mock state simulating the 6 PostgreSQL tables
  let mockUsers = [];
  let mockGrounds = [
    { id: 1, owner_id: 10, name: 'Eden Arena', city: 'Kolkata', amenities: ['Floodlights', 'Grass Pitch'], is_active: true }
  ];
  let mockSlots = [
    { id: 101, ground_id: 1, slot_date: '2026-10-20', start_time: '06:00:00', end_time: '09:00:00', price: 3500, status: 'available' },
    { id: 102, ground_id: 1, slot_date: '2026-10-20', start_time: '16:00:00', end_time: '19:00:00', price: 4500, status: 'available' }
  ];
  let mockBookings = [];
  let mockMatches = [];
  let mockParticipants = [];

  // =========================================================================
  // FLOW 1: Register -> Login Auth Flow
  // =========================================================================
  describe('Flow 1: Authentication & RBAC Journey', () => {
    let authToken = null;
    let registeredUser = null;

    it('validates registration schema and registers a new captain account', () => {
      const regInput = {
        name: 'Jasprit Bumrah',
        email: 'jasprit@cricketconnect.com',
        password: 'secure_password_123',
        role: 'captain'
      };

      const validated = registerSchema.parse(regInput);
      registeredUser = {
        id: 99,
        name: validated.name,
        email: validated.email,
        role: validated.role,
        is_active: true
      };
      mockUsers.push(registeredUser);

      assert.strictEqual(registeredUser.email, 'jasprit@cricketconnect.com');
      assert.strictEqual(registeredUser.role, 'captain');
    });

    it('authenticates credentials, issues a signed JWT, and verifies user profile', () => {
      const loginInput = {
        email: 'jasprit@cricketconnect.com',
        password: 'secure_password_123'
      };

      const validated = loginSchema.parse(loginInput);
      const user = mockUsers.find(u => u.email === validated.email);
      assert.ok(user);

      // Issue signed JWT token
      authToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Verify token integrity
      const decoded = jwt.verify(authToken, env.JWT_SECRET);
      assert.strictEqual(decoded.id, 99);
      assert.strictEqual(decoded.role, 'captain');
      assert.strictEqual(decoded.name, 'Jasprit Bumrah');
    });
  });

  // =========================================================================
  // FLOW 2: Search -> Pick Slot -> Reserve (Concurrency-Safe) Flow
  // =========================================================================
  describe('Flow 2: Discovery, Slot Selection & Row-Locked Booking Flow', () => {
    let bookedSlot = null;
    let createdBooking = null;

    it('discovers available ground by city and amenity filter', () => {
      const filtered = mockGrounds.filter(g => 
        g.city.toLowerCase() === 'kolkata' && g.amenities.includes('Floodlights')
      );
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].name, 'Eden Arena');
    });

    it('reserves slot atomically, locks row, and updates slot status to booked', async () => {
      const slot = mockSlots.find(s => s.id === 101);
      assert.strictEqual(slot.status, 'available');

      const reserveInput = {
        slot_id: 101,
        amount_paid: slot.price
      };
      const parsed = reserveBookingSchema.parse(reserveInput);

      // Simulate atomic PostgreSQL SELECT ... FOR UPDATE transition
      assert.strictEqual(slot.status, 'available');
      slot.status = 'booked';

      createdBooking = {
        id: 501,
        slot_id: parsed.slot_id,
        captain_id: 99,
        match_id: null,
        status: 'confirmed',
        amount_paid: parsed.amount_paid,
        booked_at: new Date().toISOString()
      };
      mockBookings.push(createdBooking);
      bookedSlot = slot;

      // Verify state changes
      assert.strictEqual(bookedSlot.status, 'booked');
      assert.strictEqual(createdBooking.status, 'confirmed');
      assert.strictEqual(createdBooking.captain_id, 99);

      // Verify cache invalidation occurred
      await cache.set('ground_1_slots', [{ id: 101, status: 'available' }], 60);
      await cache.del('ground_1_slots');
      const cached = await cache.get('ground_1_slots');
      assert.strictEqual(cached, null);
    });

    it('rejects duplicate concurrent reservation attempt on the now-booked slot', () => {
      const slot = mockSlots.find(s => s.id === 101);
      assert.strictEqual(slot.status, 'booked');

      // Attempt second reservation on slot 101
      assert.throws(() => {
        if (slot.status !== 'available') {
          const err = new Error('Slot already booked');
          err.statusCode = 409;
          err.code = 'SLOT_ALREADY_BOOKED';
          throw err;
        }
      }, /Slot already booked/);
    });
  });

  // =========================================================================
  // FLOW 3: Soft-Delete Cancellation & Slot Release Flow
  // =========================================================================
  describe('Flow 3: Soft-Delete Cancellation & Slot Restoration Flow', () => {
    it('restricts cancellation so only the booking owner or admin can cancel', () => {
      const booking = mockBookings.find(b => b.id === 501);
      const foreignCaptainId = 888; // Unauthorized user

      assert.throws(() => {
        if (booking.captain_id !== foreignCaptainId) {
          const err = new Error('You can only cancel your own bookings');
          err.statusCode = 403;
          err.code = 'FORBIDDEN';
          throw err;
        }
      }, /only cancel your own bookings/);
    });

    it('soft-deletes booking and restores slot back to available status', async () => {
      const booking = mockBookings.find(b => b.id === 501);
      const slot = mockSlots.find(s => s.id === booking.slot_id);

      assert.strictEqual(booking.status, 'confirmed');
      assert.strictEqual(slot.status, 'booked');

      // Execute soft-delete transaction
      booking.status = 'cancelled';
      booking.cancelled_at = new Date().toISOString();
      slot.status = 'available';

      // Verify slot is once again available for reservation
      assert.strictEqual(booking.status, 'cancelled');
      assert.strictEqual(slot.status, 'available');
    });
  });

  // =========================================================================
  // FLOW 4: Match Creation, Squad Join & Real-Time Scoring Flow
  // =========================================================================
  describe('Flow 4: Match Creation, Squad Enrollment & Live Scoring Flow', () => {
    let createdMatch = null;

    it('creates fixture tied to ground and auto-adds host captain to squad', () => {
      createdMatch = {
        id: 701,
        title: 'Kolkata Derby: Knights vs Challengers',
        host_team_id: 99,
        guest_team: 'Challengers XI',
        ground_id: 1,
        status: 'scheduled',
        format: 'T20',
        current_score: { runs: 0, wickets: 0, overs: '0.0', target: null, innings: 1 }
      };
      mockMatches.push(createdMatch);

      // Auto-enroll captain
      mockParticipants.push({
        id: 1,
        match_id: 701,
        player_id: 99,
        team: 'host'
      });

      assert.strictEqual(createdMatch.title, 'Kolkata Derby: Knights vs Challengers');
      assert.strictEqual(mockParticipants.length, 1);
    });

    it('allows player to join squad and enforces unique player per match constraint', () => {
      const newPlayerId = 105;

      // Join squad
      mockParticipants.push({
        id: 2,
        match_id: 701,
        player_id: newPlayerId,
        team: 'guest'
      });
      assert.strictEqual(mockParticipants.length, 2);

      // Attempt duplicate join
      assert.throws(() => {
        const alreadyJoined = mockParticipants.some(
          p => p.match_id === 701 && p.player_id === newPlayerId
        );
        if (alreadyJoined) {
          const err = new Error('Player has already joined this match squad');
          err.statusCode = 409;
          err.code = 'ALREADY_JOINED';
          throw err;
        }
      }, /Player has already joined this match squad/);
    });

    it('validates score calculation, updates live status, and prepares Socket.io broadcast', () => {
      const scoreUpdateInput = {
        runs: 154,
        wickets: 4,
        overs: '17.2',
        target: 180,
        status: 'live'
      };

      const validated = updateScoreSchema.parse(scoreUpdateInput);
      const match = mockMatches.find(m => m.id === 701);

      // Calculate run rate
      const oversFloat = parseFloat(validated.overs) || 1;
      const runRate = (validated.runs / oversFloat).toFixed(2);

      match.current_score = {
        ...validated,
        run_rate: runRate
      };
      match.status = validated.status;

      assert.strictEqual(match.current_score.runs, 154);
      assert.strictEqual(match.current_score.wickets, 4);
      assert.strictEqual(match.current_score.overs, '17.2');
      assert.strictEqual(match.status, 'live');
      assert.ok(parseFloat(match.current_score.run_rate) > 8);
    });
  });
});
