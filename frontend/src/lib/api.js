import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
});

// Attach Authorization Bearer token to all outgoing requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cricketconnect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Initial mock fallback seed data for zero-friction demoing if backend DB is not yet running
export const FALLBACK_GROUNDS = [
  {
    id: 1,
    name: 'Wankhede Turf Arena',
    city: 'Mumbai',
    latitude: 18.9389,
    longitude: 72.8258,
    cover_image_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Floodlights', 'Pavilion', 'Changing Rooms', 'Drinking Water', 'Parking', 'Grass Pitch'],
    owner_name: 'Rajesh Sharma (Owner)',
    owner_id: 1,
    starting_price: 3500,
    available_slots_count: 3
  },
  {
    id: 2,
    name: 'Chinnaswamy Green Turf Ground',
    city: 'Bengaluru',
    latitude: 12.9788,
    longitude: 77.5996,
    cover_image_url: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Floodlights', 'AstroTurf', 'Scoreboard', 'Cafeteria', 'First Aid'],
    owner_name: 'Rajesh Sharma (Owner)',
    owner_id: 1,
    starting_price: 3200,
    available_slots_count: 2
  },
  {
    id: 3,
    name: 'Feroz Shah Sports Complex',
    city: 'Delhi',
    latitude: 28.6378,
    longitude: 77.2432,
    cover_image_url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Floodlights', 'Natural Turf', 'Pavilion', 'Dugouts'],
    owner_name: 'Rajesh Sharma (Owner)',
    owner_id: 1,
    starting_price: 4000,
    available_slots_count: 4
  },
  {
    id: 4,
    name: 'Bandra Bandstand Turf Arena',
    city: 'Mumbai',
    latitude: 19.0544,
    longitude: 72.8197,
    cover_image_url: 'https://images.unsplash.com/photo-1512719355432-e3894e3d636b?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Floodlights', 'AstroTurf', 'Changing Rooms', 'Drinking Water', 'Cafeteria'],
    owner_name: 'Rajesh Sharma (Owner)',
    owner_id: 1,
    starting_price: 3800,
    available_slots_count: 5
  },
  {
    id: 5,
    name: 'Koramangala Cricket Hub',
    city: 'Bengaluru',
    latitude: 12.9352,
    longitude: 77.6245,
    cover_image_url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Floodlights', 'Scoreboard', 'Parking', 'First Aid'],
    owner_name: 'Rajesh Sharma (Owner)',
    owner_id: 1,
    starting_price: 2900,
    available_slots_count: 4
  },
  {
    id: 6,
    name: 'Noida Premier Cricket Ground',
    city: 'Delhi',
    latitude: 28.5721,
    longitude: 77.3524,
    cover_image_url: 'https://images.unsplash.com/photo-1562077772-3b12686ca1b6?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Floodlights', 'Grass Pitch', 'Pavilion', 'Parking'],
    owner_name: 'Rajesh Sharma (Owner)',
    owner_id: 1,
    starting_price: 3600,
    available_slots_count: 3
  }
];

export const FALLBACK_MATCHES = [
  {
    id: 1,
    title: 'Mumbai Mavericks vs Bangalore Blasters',
    host_team_id: 2,
    host_captain_name: 'Virat Kumar (Captain)',
    guest_team: 'Bangalore Blasters',
    ground_id: 1,
    ground_name: 'Wankhede Turf Arena',
    ground_city: 'Mumbai',
    status: 'live',
    format: 'T20',
    current_score: {
      runs: 146,
      wickets: 3,
      overs: '16.4',
      target: null,
      innings: 1,
      run_rate: '8.76'
    },
    squad_count: 8,
    participants: [
      { id: 1, player_name: 'Virat Kumar (Captain)', team: 'host' },
      { id: 2, player_name: 'Rohit Verma (Player)', team: 'host' },
      { id: 3, player_name: 'KL Rahul', team: 'guest' }
    ]
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
    squad_count: 4,
    participants: [
      { id: 4, player_name: 'Virat Kumar (Captain)', team: 'host' }
    ]
  }
];
