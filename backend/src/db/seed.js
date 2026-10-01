import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

async function seed() {
  console.log('🌱 Seeding initial sample data for CricketConnect...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Seed Users
    const userRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES 
        ('Rajesh Sharma (Owner)', 'owner@cricketconnect.com', $1, 'ground_owner'),
        ('Virat Kumar (Captain)', 'captain@cricketconnect.com', $1, 'captain'),
        ('Rohit Verma (Player)', 'player@cricketconnect.com', $1, 'player'),
        ('Admin User', 'admin@cricketconnect.com', $1, 'admin')
      ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, role;
    `, [hashedPassword]);

    const owner = userRes.rows.find(u => u.role === 'ground_owner') || { id: 1 };
    const captain = userRes.rows.find(u => u.role === 'captain') || { id: 2 };
    const player = userRes.rows.find(u => u.role === 'player') || { id: 3 };

    // 2. Seed Grounds
    const groundRes = await client.query(`
      INSERT INTO grounds (owner_id, name, city, latitude, longitude, cover_image_url, amenities)
      VALUES 
        (
          $1, 
          'Wankhede Turf Arena', 
          'Mumbai', 
          18.9389, 
          72.8258, 
          'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
          ARRAY['Floodlights', 'Pavilion', 'Changing Rooms', 'Drinking Water', 'Parking', 'Grass Pitch']
        ),
        (
          $1, 
          'Chinnaswamy Green Turf Ground', 
          'Bengaluru', 
          12.9788, 
          77.5996, 
          'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80',
          ARRAY['Floodlights', 'AstroTurf', 'Scoreboard', 'Cafeteria', 'First Aid']
        ),
        (
          $1, 
          'Feroz Shah Sports Complex', 
          'Delhi', 
          28.6378, 
          77.2432, 
          'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80',
          ARRAY['Floodlights', 'Natural Turf', 'Pavilion', 'Dugouts']
        )
      RETURNING id, name;
    `, [owner.id]);

    const ground1 = groundRes.rows[0];
    const ground2 = groundRes.rows[1];

    // 3. Seed Slots for today and tomorrow
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const slotRes = await client.query(`
      INSERT INTO ground_slots (ground_id, slot_date, start_time, end_time, price, status)
      VALUES 
        ($1, $3, '06:00:00', '09:00:00', 3500.00, 'available'),
        ($1, $3, '09:30:00', '12:30:00', 4000.00, 'available'),
        ($1, $3, '16:00:00', '19:00:00', 4500.00, 'booked'),
        ($1, $3, '19:30:00', '22:30:00', 5000.00, 'available'),
        ($2, $3, '07:00:00', '10:00:00', 3200.00, 'available'),
        ($2, $3, '16:00:00', '19:00:00', 4200.00, 'available'),
        ($1, $4, '06:00:00', '09:00:00', 3500.00, 'available'),
        ($1, $4, '16:00:00', '19:00:00', 4500.00, 'available')
      ON CONFLICT (ground_id, slot_date, start_time) DO NOTHING
      RETURNING id, status;
    `, [ground1.id, ground2.id, today, tomorrow]);

    const bookedSlot = slotRes.rows.find(s => s.status === 'booked') || slotRes.rows[0];

    // 4. Seed Booking
    if (bookedSlot) {
      const bookingRes = await client.query(`
        INSERT INTO bookings (slot_id, captain_id, status, amount_paid)
        VALUES ($1, $2, 'confirmed', 4500.00)
        RETURNING id;
      `, [bookedSlot.id, captain.id]);

      const booking = bookingRes.rows[0];

      // 5. Seed Match
      const matchRes = await client.query(`
        INSERT INTO matches (title, host_team_id, guest_team, ground_id, slot_id, status, format, current_score)
        VALUES (
          'Mumbai Mavericks vs Bangalore Blasters', 
          $1, 
          'Bangalore Blasters', 
          $2, 
          $3, 
          'live', 
          'T20', 
          '{"runs": 142, "wickets": 3, "overs": "16.4", "target": null, "innings": 1, "run_rate": "8.52"}'::jsonb
        )
        RETURNING id;
      `, [captain.id, ground1.id, bookedSlot.id]);

      const match = matchRes.rows[0];

      // Update booking with match_id
      await client.query('UPDATE bookings SET match_id = $1 WHERE id = $2', [match.id, booking.id]);

      // 6. Seed Match Participant
      await client.query(`
        INSERT INTO match_participants (match_id, player_id, team)
        VALUES ($1, $2, 'host')
        ON CONFLICT (match_id, player_id) DO NOTHING;
      `, [match.id, player.id]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
