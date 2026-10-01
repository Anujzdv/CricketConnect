import http from 'http';
import { app, server } from '../src/server.js';

const TEST_PORT = 5002;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting API Verification Suite on port', TEST_PORT);

  const testServer = server.listen(TEST_PORT, async () => {
    try {
      let passed = 0;
      let total = 0;

      function assert(condition, name, details = '') {
        total++;
        if (condition) {
          passed++;
          console.log(`  ✅ [PASS] ${name}`);
        } else {
          console.error(`  ❌ [FAIL] ${name} ${details}`);
        }
      }

      console.log('\n--- 1. HEALTH CHECK ---');
      const health = await request('GET', '/health');
      assert(health.status === 200 && health.data?.success, 'GET /api/health');

      console.log('\n--- 2. AUTHENTICATION ---');
      const ownerLogin = await request('POST', '/auth/login', {
        email: 'owner@cricketconnect.com',
        password: 'password123'
      });
      assert(ownerLogin.status === 200 && ownerLogin.data?.data?.token, 'Login as Ground Owner');
      const ownerToken = ownerLogin.data?.data?.token;

      const captainLogin = await request('POST', '/auth/login', {
        email: 'captain@cricketconnect.com',
        password: 'password123'
      });
      assert(captainLogin.status === 200 && captainLogin.data?.data?.token, 'Login as Captain');
      const captainToken = captainLogin.data?.data?.token;

      const playerLogin = await request('POST', '/auth/login', {
        email: 'player@cricketconnect.com',
        password: 'password123'
      });
      assert(playerLogin.status === 200 && playerLogin.data?.data?.token, 'Login as Player');
      const playerToken = playerLogin.data?.data?.token;

      const uniqueEmail = `captain_${Date.now()}@cricketconnect.com`;
      const registerRes = await request('POST', '/auth/register', {
        name: 'New Test Captain',
        email: uniqueEmail,
        password: 'password123',
        role: 'captain'
      });
      assert(registerRes.status === 201 && registerRes.data?.data?.token, 'Register new captain');
      const newCaptainToken = registerRes.data?.data?.token;

      console.log('\n--- 3. USER PROFILE ---');
      const profile = await request('GET', '/users/me', null, captainToken);
      assert(profile.status === 200 && profile.data?.data?.name?.includes('Virat'), 'GET /api/users/me (captain profile + stats)');

      const updateProfile = await request('PUT', '/users/me', { name: 'Virat Kumar (Updated Captain)' }, captainToken);
      assert(updateProfile.status === 200 && updateProfile.data?.data?.name?.includes('Updated'), 'PUT /api/users/me (update name)');

      console.log('\n--- 4. GROUNDS & SLOTS ---');
      const grounds = await request('GET', '/grounds');
      assert(grounds.status === 200 && Array.isArray(grounds.data?.data?.grounds), 'GET /api/grounds');
      const ground1 = grounds.data?.data?.grounds[0];

      const groundDetail = await request('GET', `/grounds/${ground1.id}`);
      assert(groundDetail.status === 200 && Array.isArray(groundDetail.data?.data?.slots), 'GET /api/grounds/:id with slots');

      const slots = await request('GET', `/grounds/${ground1.id}/slots`);
      assert(slots.status === 200 && Array.isArray(slots.data?.data), 'GET /api/grounds/:id/slots');

      const newGround = await request('POST', '/grounds', {
        name: 'Eden Gardens Arena',
        city: 'Kolkata',
        amenities: ['Floodlights', 'Pavilion', 'Grass Pitch']
      }, ownerToken);
      assert(newGround.status === 201 && newGround.data?.data?.id, 'POST /api/grounds (create ground as owner)');

      const createdGroundId = newGround.data?.data?.id;
      const addSlots = await request('POST', `/grounds/${createdGroundId}/slots`, {
        slots: [
          { slot_date: '2026-10-15', start_time: '07:00:00', end_time: '10:00:00', price: 3000 },
          { slot_date: '2026-10-15', start_time: '10:30:00', end_time: '13:30:00', price: 3500 }
        ]
      }, ownerToken);
      assert(addSlots.status === 201 && addSlots.data?.data?.slots?.length === 2, 'POST /api/grounds/:id/slots (bulk add slots)', JSON.stringify(addSlots.data));

      console.log('\n--- 5. BOOKING ENGINE ---');
      const availableSlotId = addSlots.data?.data?.slots[0]?.id;
      const bookingRes = await request('POST', '/booking/reserve', {
        slot_id: availableSlotId,
        amount_paid: 3000
      }, captainToken);
      assert(bookingRes.status === 201 && bookingRes.data?.data?.bookings?.length > 0, 'POST /api/booking/reserve (book ground slot)', JSON.stringify(bookingRes.data));
      const bookedId = bookingRes.data?.data?.bookings[0]?.id;

      // Double booking conflict test
      const conflictRes = await request('POST', '/booking/reserve', {
        slot_id: availableSlotId,
        amount_paid: 3000
      }, newCaptainToken);
      assert(conflictRes.status === 409, 'Conflict check: Prevent double booking slot (returns 409)', JSON.stringify(conflictRes.data));

      // Booking history
      const history = await request('GET', '/booking/history', null, captainToken);
      assert(history.status === 200 && history.data?.data?.bookings?.length > 0, 'GET /api/booking/history');

      // Cancel booking
      const cancelRes = await request('DELETE', `/booking/${bookedId}`, null, captainToken);
      assert(cancelRes.status === 200 && cancelRes.data?.data?.status === 'cancelled', 'DELETE /api/booking/:id (cancel booking & release slot)', JSON.stringify(cancelRes.data));

      // Verify slot is now available again
      const rebookRes = await request('POST', '/booking/reserve', {
        slot_id: availableSlotId,
        amount_paid: 3000
      }, newCaptainToken);
      assert(rebookRes.status === 201, 'Re-book previously released slot after cancellation', JSON.stringify(rebookRes.data));

      console.log('\n--- 6. MATCHES & SQUADS (CREATE NEW TEAM / MATCH & JOIN TEAM) ---');
      const matchCreate = await request('POST', '/matches', {
        title: 'Kolkata Knights vs Delhi Dynamos',
        guest_team: 'Delhi Dynamos',
        format: 'T20',
        ground_id: createdGroundId
      }, captainToken);
      assert(matchCreate.status === 201 && matchCreate.data?.data?.id, 'POST /api/matches (create match / new team fixture)');
      const createdMatchId = matchCreate.data?.data?.id;

      const matchDetail = await request('GET', `/matches/${createdMatchId}`);
      assert(matchDetail.status === 200 && matchDetail.data?.data?.participants?.length >= 1, 'GET /api/matches/:id with squad roster');

      // Join team squad
      const joinRes = await request('POST', `/matches/${createdMatchId}/join`, {
        team: 'host'
      }, playerToken);
      assert(joinRes.status === 201 && joinRes.data?.data?.id, 'POST /api/matches/:id/join (join team squad)');

      // Duplicate join prevention
      const dupJoinRes = await request('POST', `/matches/${createdMatchId}/join`, {
        team: 'host'
      }, playerToken);
      assert(dupJoinRes.status === 409, 'Duplicate join prevention: Cannot join team squad twice (returns 409)');

      // Update live score
      const scoreRes = await request('PATCH', `/matches/${createdMatchId}/score`, {
        runs: 54,
        wickets: 1,
        overs: '6.2'
      }, captainToken);
      assert(scoreRes.status === 200 && scoreRes.data?.data?.current_score?.runs === 54, 'PATCH /api/matches/:id/score (update score & live status)');

      console.log(`\n========================================`);
      console.log(`  RESULT: ${passed}/${total} TESTS PASSED (${Math.round(passed/total*100)}%)`);
      console.log(`========================================\n`);

      testServer.close(() => {
        process.exit(passed === total ? 0 : 1);
      });
    } catch (e) {
      console.error('Unhandled test failure:', e);
      testServer.close(() => process.exit(1));
    }
  });
}

runTests();
