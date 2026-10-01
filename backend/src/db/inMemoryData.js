// In-Memory store for development and demo mode when PostgreSQL is not running locally

export const IN_MEMORY_STORE = {
  users: [
    {
      id: 1,
      name: 'Rajesh Sharma (Owner)',
      email: 'owner@cricketconnect.com',
      password_hash: '$2a$10$.FIfd.w6du/UKeDQqVz.x.GauheEf3z1UxLKpbuSAT6XPMRe6mGAi',
      role: 'ground_owner',
      is_active: true,
      created_at: new Date('2026-01-01').toISOString()
    },
    {
      id: 2,
      name: 'Virat Kumar (Captain)',
      email: 'captain@cricketconnect.com',
      password_hash: '$2a$10$.FIfd.w6du/UKeDQqVz.x.GauheEf3z1UxLKpbuSAT6XPMRe6mGAi',
      role: 'captain',
      is_active: true,
      created_at: new Date('2026-01-02').toISOString()
    },
    {
      id: 3,
      name: 'Rohit Verma (Player)',
      email: 'player@cricketconnect.com',
      password_hash: '$2a$10$.FIfd.w6du/UKeDQqVz.x.GauheEf3z1UxLKpbuSAT6XPMRe6mGAi',
      role: 'player',
      is_active: true,
      created_at: new Date('2026-01-03').toISOString()
    }
  ],
  grounds: [
    {
      id: 1,
      owner_id: 1,
      name: 'Wankhede Turf Arena',
      city: 'Mumbai',
      latitude: 18.9389,
      longitude: 72.8258,
      cover_image_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
      amenities: ['Floodlights', 'Pavilion', 'Changing Rooms', 'Drinking Water', 'Parking', 'Grass Pitch'],
      is_active: true,
      owner_name: 'Rajesh Sharma (Owner)',
      starting_price: 3500,
      available_slots_count: 3,
      created_at: new Date('2026-01-01').toISOString()
    },
    {
      id: 2,
      owner_id: 1,
      name: 'Chinnaswamy Green Turf Ground',
      city: 'Bengaluru',
      latitude: 12.9788,
      longitude: 77.5996,
      cover_image_url: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80',
      amenities: ['Floodlights', 'AstroTurf', 'Scoreboard', 'Cafeteria', 'First Aid'],
      is_active: true,
      owner_name: 'Rajesh Sharma (Owner)',
      starting_price: 3200,
      available_slots_count: 2,
      created_at: new Date('2026-01-02').toISOString()
    },
    {
      id: 3,
      owner_id: 1,
      name: 'Feroz Shah Sports Complex',
      city: 'Delhi',
      latitude: 28.6378,
      longitude: 77.2432,
      cover_image_url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80',
      amenities: ['Floodlights', 'Natural Turf', 'Pavilion', 'Dugouts'],
      is_active: true,
      owner_name: 'Rajesh Sharma (Owner)',
      starting_price: 4000,
      available_slots_count: 4,
      created_at: new Date('2026-01-03').toISOString()
    },
    {
      id: 4,
      owner_id: 1,
      name: 'Bandra Bandstand Turf Arena',
      city: 'Mumbai',
      latitude: 19.0544,
      longitude: 72.8197,
      cover_image_url: 'https://images.unsplash.com/photo-1512719355432-e3894e3d636b?auto=format&fit=crop&w=1200&q=80',
      amenities: ['Floodlights', 'AstroTurf', 'Changing Rooms', 'Drinking Water', 'Cafeteria'],
      is_active: true,
      owner_name: 'Rajesh Sharma (Owner)',
      starting_price: 3800,
      available_slots_count: 5,
      created_at: new Date('2026-01-04').toISOString()
    },
    {
      id: 5,
      owner_id: 1,
      name: 'Koramangala Cricket Hub',
      city: 'Bengaluru',
      latitude: 12.9352,
      longitude: 77.6245,
      cover_image_url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80',
      amenities: ['Floodlights', 'Scoreboard', 'Parking', 'First Aid'],
      is_active: true,
      owner_name: 'Rajesh Sharma (Owner)',
      starting_price: 2900,
      available_slots_count: 4,
      created_at: new Date('2026-01-05').toISOString()
    },
    {
      id: 6,
      owner_id: 1,
      name: 'Noida Premier Cricket Ground',
      city: 'Delhi',
      latitude: 28.5721,
      longitude: 77.3524,
      cover_image_url: 'https://images.unsplash.com/photo-1562077772-3b12686ca1b6?auto=format&fit=crop&w=1200&q=80',
      amenities: ['Floodlights', 'Grass Pitch', 'Pavilion', 'Parking'],
      is_active: true,
      owner_name: 'Rajesh Sharma (Owner)',
      starting_price: 3600,
      available_slots_count: 3,
      created_at: new Date('2026-01-06').toISOString()
    }
  ],

  slots: [
    { id: 1, ground_id: 1, slot_date: new Date().toISOString().split('T')[0], start_time: '06:00:00', end_time: '09:00:00', price: 3500, status: 'available' },
    { id: 2, ground_id: 1, slot_date: new Date().toISOString().split('T')[0], start_time: '09:30:00', end_time: '12:30:00', price: 4000, status: 'available' },
    { id: 3, ground_id: 1, slot_date: new Date().toISOString().split('T')[0], start_time: '16:00:00', end_time: '19:00:00', price: 4500, status: 'booked' },
    { id: 4, ground_id: 1, slot_date: new Date().toISOString().split('T')[0], start_time: '19:30:00', end_time: '22:30:00', price: 5000, status: 'available' },
    { id: 5, ground_id: 2, slot_date: new Date().toISOString().split('T')[0], start_time: '07:00:00', end_time: '10:00:00', price: 3200, status: 'available' },
    { id: 6, ground_id: 2, slot_date: new Date().toISOString().split('T')[0], start_time: '16:00:00', end_time: '19:00:00', price: 4200, status: 'available' },
    { id: 7, ground_id: 3, slot_date: new Date().toISOString().split('T')[0], start_time: '06:00:00', end_time: '09:00:00', price: 4000, status: 'available' },
    { id: 8, ground_id: 3, slot_date: new Date().toISOString().split('T')[0], start_time: '10:00:00', end_time: '13:00:00', price: 4200, status: 'available' },
    { id: 9, ground_id: 3, slot_date: new Date().toISOString().split('T')[0], start_time: '16:00:00', end_time: '19:00:00', price: 4500, status: 'available' },
    { id: 10, ground_id: 4, slot_date: new Date().toISOString().split('T')[0], start_time: '07:00:00', end_time: '10:00:00', price: 3800, status: 'available' }
  ],

  matches: [
    {
      id: 1,
      title: 'Mumbai Mavericks vs Bangalore Blasters',
      host_team_id: 2,
      host_captain_name: 'Virat Kumar (Captain)',
      guest_team: 'Bangalore Blasters',
      ground_id: 1,
      ground_name: 'Wankhede Turf Arena',
      ground_city: 'Mumbai',
      slot_id: 3,
      status: 'live',
      format: 'T20',
      current_score: {
        runs: 142,
        wickets: 3,
        overs: '16.4',
        target: null,
        innings: 1,
        run_rate: '8.52'
      },
      squad_count: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Delhi Daredevils vs Kolkata Champions',
      host_team_id: 2,
      host_captain_name: 'Virat Kumar (Captain)',
      guest_team: 'Kolkata Champions',
      ground_id: 3,
      ground_name: 'Feroz Shah Sports Complex',
      ground_city: 'Delhi',
      slot_id: null,
      status: 'scheduled',
      format: 'T20',
      current_score: {
        runs: 0,
        wickets: 0,
        overs: '0.0',
        target: null,
        innings: 1,
        run_rate: '0.00'
      },
      squad_count: 1,
      created_at: new Date().toISOString()
    }
  ],

  match_participants: [
    { id: 1, match_id: 1, player_id: 2, team: 'host', joined_at: new Date().toISOString() },
    { id: 2, match_id: 1, player_id: 3, team: 'host', joined_at: new Date().toISOString() },
    { id: 3, match_id: 2, player_id: 2, team: 'host', joined_at: new Date().toISOString() }
  ],

  bookings: [
    {
      id: 1,
      slot_id: 3,
      captain_id: 2,
      match_id: 1,
      status: 'confirmed',
      amount_paid: 4500.00,
      booked_at: new Date().toISOString()
    }
  ]
};
