-- CricketConnect Initial Database Schema
-- Migration 001: Initial Schema (6 Core Tables + Constraints + Indexes)

-- Enable UUID or necessary extensions if needed in future
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('player', 'captain', 'ground_owner', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hot-path indexes for Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. GROUNDS TABLE
CREATE TABLE IF NOT EXISTS grounds (
    id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    cover_image_url TEXT,
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hot-path indexes for Grounds
CREATE INDEX IF NOT EXISTS idx_grounds_city ON grounds(city);
CREATE INDEX IF NOT EXISTS idx_grounds_owner ON grounds(owner_id);
CREATE INDEX IF NOT EXISTS idx_grounds_active ON grounds(is_active);

-- 3. GROUND_SLOTS TABLE
-- The critical row locked via SELECT ... FOR UPDATE during booking
CREATE TABLE IF NOT EXISTS ground_slots (
    id SERIAL PRIMARY KEY,
    ground_id INT NOT NULL REFERENCES grounds(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'booked', 'maintenance', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ground_slot UNIQUE (ground_id, slot_date, start_time)
);

-- Hot-path indexes for Ground Slots
CREATE INDEX IF NOT EXISTS idx_ground_slots_status ON ground_slots(status);
CREATE INDEX IF NOT EXISTS idx_ground_slots_ground_date ON ground_slots(ground_id, slot_date);

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    slot_id INT NOT NULL REFERENCES ground_slots(id) ON DELETE RESTRICT,
    captain_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    match_id INT, -- Cross-referenced with matches table
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Hot-path indexes for Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_captain_id ON bookings(captain_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 5. MATCHES TABLE
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    host_team_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guest_team VARCHAR(150) DEFAULT 'Opponent Squad',
    ground_id INT NOT NULL REFERENCES grounds(id) ON DELETE RESTRICT,
    slot_id INT REFERENCES ground_slots(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'abandoned')),
    format VARCHAR(50) NOT NULL DEFAULT 'T20' CHECK (format IN ('T10', 'T20', 'ODI', 'Custom')),
    current_score JSONB NOT NULL DEFAULT '{"runs": 0, "wickets": 0, "overs": "0.0", "target": null, "innings": 1}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hot-path indexes for Matches
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_host_team_id ON matches(host_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_ground_id ON matches(ground_id);

-- Add foreign key constraint from bookings.match_id -> matches.id
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_match
    FOREIGN KEY (match_id) REFERENCES matches(id)
    ON DELETE SET NULL;

-- 6. MATCH_PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS match_participants (
    id SERIAL PRIMARY KEY,
    match_id INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team VARCHAR(100) NOT NULL DEFAULT 'host',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_match_player UNIQUE (match_id, player_id)
);

-- Hot-path indexes for Match Participants
CREATE INDEX IF NOT EXISTS idx_match_participants_match ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_player ON match_participants(player_id);
