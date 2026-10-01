import { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../src/modules/auth/auth.schemas.js';
import { requireRole } from '../src/middleware/requireRole.js';
import { verifyToken } from '../src/middleware/verifyToken.js';
import { env } from '../src/config/env.js';

describe('Phase 5 Authentication & RBAC Tests', () => {
  describe('Auth Schemas Validation', () => {
    it('validates a valid registration payload for a captain', () => {
      const payload = {
        name: 'Rohit Sharma',
        email: 'rohit@cricket.com',
        password: 'password123',
        role: 'captain'
      };
      const parsed = registerSchema.parse(payload);
      assert.strictEqual(parsed.name, 'Rohit Sharma');
      assert.strictEqual(parsed.role, 'captain');
    });

    it('rejects registration with invalid email', () => {
      assert.throws(() => {
        registerSchema.parse({
          name: 'Player',
          email: 'not-an-email',
          password: 'password123',
          role: 'player'
        });
      }, /valid email address/);
    });

    it('rejects registration with short password (< 6 chars)', () => {
      assert.throws(() => {
        registerSchema.parse({
          name: 'Player',
          email: 'player@cricket.com',
          password: '123',
          role: 'player'
        });
      }, /at least 6 characters/);
    });

    it('rejects registration with unknown role', () => {
      assert.throws(() => {
        registerSchema.parse({
          name: 'Cheater',
          email: 'cheat@cricket.com',
          password: 'password123',
          role: 'umpire_super_role'
        });
      }, /Role must be one of/);
    });

    it('validates login schema', () => {
      const payload = {
        email: 'captain@cricket.com',
        password: 'secret_password'
      };
      const parsed = loginSchema.parse(payload);
      assert.strictEqual(parsed.email, 'captain@cricket.com');
    });
  });

  describe('JWT Verification Middleware', () => {
    it('successfully extracts user info from a valid bearer token', () => {
      const token = jwt.sign(
        { id: 42, email: 'user@cricket.com', role: 'ground_owner', name: 'Rajesh' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      let nextCalledWith = null;

      verifyToken(req, res, (err) => {
        nextCalledWith = err;
      });

      assert.strictEqual(nextCalledWith, undefined);
      assert.ok(req.user);
      assert.strictEqual(req.user.id, 42);
      assert.strictEqual(req.user.role, 'ground_owner');
    });

    it('returns 401 when Authorization header is missing', () => {
      const req = { headers: {} };
      const res = {};
      let nextError = null;

      verifyToken(req, res, (err) => {
        nextError = err;
      });

      assert.ok(nextError);
      assert.strictEqual(nextError.statusCode, 401);
      assert.strictEqual(nextError.code, 'UNAUTHORIZED');
    });

    it('returns 401 on tampered/invalid token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid.token.payload'
        }
      };
      const res = {};
      let nextError = null;

      verifyToken(req, res, (err) => {
        nextError = err;
      });

      assert.ok(nextError);
      assert.strictEqual(nextError.statusCode, 401);
      assert.strictEqual(nextError.code, 'INVALID_TOKEN');
    });
  });

  describe('requireRole RBAC Middleware', () => {
    it('allows access when user role matches allowed roles', () => {
      const req = { user: { id: 1, role: 'captain' } };
      const res = {};
      let nextCalledWith = null;

      const middleware = requireRole(['captain', 'admin']);
      middleware(req, res, (err) => {
        nextCalledWith = err;
      });

      assert.strictEqual(nextCalledWith, undefined);
    });

    it('denies access with 403 FORBIDDEN when user role is not authorized', () => {
      const req = { user: { id: 1, role: 'player' } };
      const res = {};
      let nextError = null;

      const middleware = requireRole(['ground_owner', 'admin']);
      middleware(req, res, (err) => {
        nextError = err;
      });

      assert.ok(nextError);
      assert.strictEqual(nextError.statusCode, 403);
      assert.strictEqual(nextError.code, 'FORBIDDEN');
    });

    it('denies access with 401 UNAUTHORIZED if req.user is absent', () => {
      const req = {};
      const res = {};
      let nextError = null;

      const middleware = requireRole(['captain']);
      middleware(req, res, (err) => {
        nextError = err;
      });

      assert.ok(nextError);
      assert.strictEqual(nextError.statusCode, 401);
      assert.strictEqual(nextError.code, 'UNAUTHORIZED');
    });
  });
});
