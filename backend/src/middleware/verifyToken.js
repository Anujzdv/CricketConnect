import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware to authenticate requests using JWT Bearer token.
 * Populates req.user with { id, email, role, name }.
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token required', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  // Dev fallback for demo tokens
  if (token && token.startsWith('demo_token_')) {
    const role = token.replace('demo_token_', '');
    req.user = {
      id: role === 'ground_owner' ? 1 : role === 'player' ? 3 : 2,
      email: `${role}@cricketconnect.com`,
      role: role || 'captain',
      name: role === 'ground_owner' ? 'Rajesh Sharma (Owner)' : role === 'player' ? 'Rohit Verma (Player)' : 'Virat Kumar (Captain)'
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded; // { id, email, role, name, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token', 401, 'INVALID_TOKEN'));
  }
};
