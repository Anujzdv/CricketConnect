import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { checkDbConnection } from './config/db.js';
import { cache } from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import groundsRoutes from './modules/grounds/grounds.routes.js';
import matchesRoutes from './modules/matches/matches.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import bookingRoutes from './modules/booking/booking.routes.js';

const app = express();
const server = http.createServer(app);

const isOriginAllowed = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, server-to-server)
  if (!origin) return callback(null, true);
  if (
    origin === env.CLIENT_URL ||
    origin === 'http://localhost:5173' ||
    origin === 'http://127.0.0.1:5173' ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.onrender.com') ||
    env.NODE_ENV !== 'production'
  ) {
    return callback(null, true);
  }
  return callback(null, true);
};

// Initialize Socket.io
export const io = new Server(server, {
  cors: {
    origin: isOriginAllowed,
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: isOriginAllowed,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // console.log(`[${req.method}] ${req.url}`);
    next();
  });
}

// Health Check Route
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkDbConnection();
  const cacheStatus = cache.getStatus();

  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'CricketConnect API',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      cache: cacheStatus,
      socketClients: io.engine.clientsCount
    }
  });
});

// Mount Domain Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/grounds', groundsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/booking', bookingRoutes);

// Socket.io Connection & Room Handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to WebSocket: ${socket.id}`);

  // Join a match room for live score updates
  socket.on('join_match', (matchId) => {
    const room = `match_${matchId}`;
    socket.join(room);
    console.log(`📡 Socket ${socket.id} joined match room: ${room}`);
    socket.emit('joined_match_success', { matchId, room });
  });

  socket.on('leave_match', (matchId) => {
    const room = `match_${matchId}`;
    socket.leave(room);
    console.log(`👋 Socket ${socket.id} left match room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// 404 Route Handler
app.use((req, res, _next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  server.listen(env.PORT, () => {
    console.log(`🚀 CricketConnect server running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`📡 Healthcheck available at: http://localhost:${env.PORT}/api/health`);
  });
}

export { app, server };
