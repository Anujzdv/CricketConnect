import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, isDbConnected } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { IN_MEMORY_STORE } from '../../db/inMemoryData.js';

export const authService = {
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  },

  async register(data) {
    const { name, email, password, role = 'player' } = data;
    const normalizedEmail = email.toLowerCase().trim();

    if (!isDbConnected()) {
      return this.registerInMemory(name, normalizedEmail, password, role);
    }

    try {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (existing.rows.length > 0) {
        throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const insertSql = `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, is_active, created_at;
      `;

      const res = await pool.query(insertSql, [name.trim(), normalizedEmail, passwordHash, role]);
      const user = res.rows[0];
      const token = this.generateToken(user);

      return { user, token };
    } catch (err) {
      if (err instanceof AppError) throw err;
      return this.registerInMemory(name, normalizedEmail, password, role);
    }
  },

  async registerInMemory(name, normalizedEmail, password, role) {
    const existing = IN_MEMORY_STORE.users.find(u => u.email === normalizedEmail);
    if (existing) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: IN_MEMORY_STORE.users.length + 1,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role,
      is_active: true,
      created_at: new Date().toISOString()
    };

    IN_MEMORY_STORE.users.push(newUser);

    const safeUser = { ...newUser };
    delete safeUser.password_hash;
    const token = this.generateToken(safeUser);

    return { user: safeUser, token };
  },

  async login(data) {
    const { email, password } = data;
    const normalizedEmail = email.toLowerCase().trim();

    if (!isDbConnected()) {
      return this.loginInMemory(normalizedEmail, password);
    }

    try {
      const res = await pool.query(`
        SELECT id, name, email, password_hash, role, is_active, created_at
        FROM users
        WHERE email = $1;
      `, [normalizedEmail]);

      if (res.rows.length === 0) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const user = res.rows[0];

      if (!user.is_active) {
        throw new AppError('Account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const token = this.generateToken(user);
      delete user.password_hash;

      return { user, token };
    } catch (err) {
      if (err instanceof AppError) throw err;
      return this.loginInMemory(normalizedEmail, password);
    }
  },

  async loginInMemory(normalizedEmail, password) {
    const user = IN_MEMORY_STORE.users.find(u => u.email === normalizedEmail);
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new AppError('Account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const safeUser = { ...user };
    delete safeUser.password_hash;
    const token = this.generateToken(safeUser);

    return { user: safeUser, token };
  }
};
