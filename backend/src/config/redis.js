import Redis from 'ioredis';
import { env } from './env.js';

let redisClient = null;
let isRedisAvailable = false;

// Fallback in-memory map if Redis is not running locally
const memoryCache = new Map();

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true
  });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    console.log('⚡ Redis client connected successfully');
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
    // Suppress spammy connection logs if redis is not running locally
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️ Redis not available, using in-memory cache fallback:', err.message);
    }
  });

  // Attempt initial connection without blocking boot
  if (process.env.NODE_ENV !== 'test') {
    redisClient.connect().catch(() => {
      isRedisAvailable = false;
    });
  }
} catch (err) {
  console.warn('⚠️ Failed to initialize Redis client, falling back to memory cache:', err.message);
}

export const cache = {
  async get(key) {
    if (isRedisAvailable && redisClient) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch {
        // Fall back to memory
      }
    }
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key, value, ttlSeconds = 60) {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch {
        // Fall back to memory
      }
    }
    memoryCache.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    });
  },

  async del(key) {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.del(key);
      } catch {
        // Fall back to memory
      }
    }
    memoryCache.delete(key);
  },

  async flush() {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.flushall();
      } catch {
        // Fall back
      }
    }
    memoryCache.clear();
  },

  getStatus() {
    return {
      type: isRedisAvailable ? 'redis' : 'in-memory-fallback',
      connected: isRedisAvailable,
      memoryEntriesCount: memoryCache.size
    };
  }
};

export { redisClient };
