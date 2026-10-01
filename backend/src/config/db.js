import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 1500,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let isDbAvailable = false;

pool.on('connect', () => {
  isDbAvailable = true;
});

pool.on('error', () => {
  isDbAvailable = false;
});

export const isDbConnected = () => isDbAvailable;

export const checkDbConnection = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as current_time');
    client.release();
    isDbAvailable = true;
    return { connected: true, time: res.rows[0].current_time };
  } catch (err) {
    isDbAvailable = false;
    return { connected: false, error: err.message, mode: 'in-memory-fallback' };
  }
};

// Check DB connection on initialization (non-blocking)
if (process.env.NODE_ENV !== 'test') {
  checkDbConnection().then(res => {
    if (res.connected) {
      console.log('📦 PostgreSQL client connected to pool');
    } else {
      console.log('⚡ PostgreSQL offline. Seamless In-Memory database store active.');
    }
  }).catch(() => {
    isDbAvailable = false;
  });
}
