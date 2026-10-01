import { AppError } from './errorHandler.js';

/**
 * Middleware factory for Role-Based Access Control (RBAC).
 * Expects verifyToken to have already populated req.user.
 * 
 * @param {string[]} allowedRoles Array of allowed roles (e.g. ['captain', 'admin'])
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User authentication required before role verification', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`, 
        403, 
        'FORBIDDEN'
      ));
    }

    next();
  };
};
