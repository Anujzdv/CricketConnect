# CricketConnect 🏏

A high-concurrency cricket ground booking, match management, and real-time live-scoring platform.

Built with **Node.js/Express, PostgreSQL, Redis, Socket.io**, and **React + Vite**.

---

## 🏗️ Architecture & Stack

| Layer | Technology | Details |
|---|---|---|
| **Backend** | Node.js + Express (ES6 Modules) | RESTful API + Socket.io gateway |
| **Database** | PostgreSQL | ACID transactions with row-level locks (`SELECT FOR UPDATE`) |
| **DB Client** | `pg` (node-postgres) | Raw SQL pool with zero ORM abstraction overhead |
| **Cache & Realtime** | Redis (`ioredis`) + In-memory fallback | Cache-aside query acceleration & fast failover |
| **Realtime** | Socket.io | Room-based live scoring broadcasts (`match_<id>`) |
| **Auth** | JWT + bcryptjs | Role-Based Access Control (`player`, `captain`, `ground_owner`, `admin`) |
| **Frontend** | React 18 + Vite | Tailwind CSS, Lucide icons, responsive layout with mobile bottom navigation |
| **Containers** | Docker Compose | Local PostgreSQL & Redis services |

---

## 🗄️ Database Schema (6 Core Tables)

1. **`users`**: Profiles, role (`player`, `captain`, `ground_owner`, `admin`), password hash, active status.
2. **`grounds`**: Cricket venues with GPS coordinates, cover photos, city, and amenities array.
3. **`ground_slots`**: Individual time slots per ground with status (`available`, `reserved`, `booked`).  
   *Enforces `UNIQUE(ground_id, slot_date, start_time)` and is the row locked during concurrent reservations.*
4. **`bookings`**: Booking ledgers tied to a slot and captain, with status and transaction amount.
5. **`matches`**: Cricket fixtures with host team, guest team, format (T10, T20, ODI), status, and `current_score` (JSONB).
6. **`match_participants`**: Squad members with team assignment. Enforces `UNIQUE(match_id, player_id)`.

---

## 🚀 Getting Started

### 1. Start Services via Docker Compose
To spin up local PostgreSQL (port 5432) and Redis (port 6379):
```bash
docker compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run migrate   # Runs 001_initial_schema.sql
npm run seed      # Populates sample grounds, slots, and matches
npm run dev       # Starts server at http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server at http://localhost:5173
```

---

## 🧪 Testing & Linting

```bash
# Backend lint & tests
cd backend
npm run lint
npm test

# Frontend lint & build
cd frontend
npm run lint
npm run build
```
