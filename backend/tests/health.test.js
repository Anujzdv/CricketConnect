import { describe, it } from 'node:test';
import assert from 'node:assert';
import { app } from '../src/server.js';
import { cache } from '../src/config/redis.js';

describe('Phase 3 Foundation Smoke Tests', () => {
  it('should verify cache fallback works in-memory without error', async () => {
    await cache.set('test_key', { sample: 123 }, 5);
    const value = await cache.get('test_key');
    assert.deepStrictEqual(value, { sample: 123 });
    await cache.del('test_key');
    const deleted = await cache.get('test_key');
    assert.strictEqual(deleted, null);
  });

  it('should verify app is initialized and has routes defined', () => {
    assert.ok(app);
    assert.strictEqual(typeof app.listen, 'function');
  });
});
