import { AppError } from './errorHandler.js';

/**
 * Middleware factory to validate request body, query, or params with Zod schemas.
 * Formats errors into a user-friendly API error envelope.
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // replace with validated and parsed data
      next();
    } catch (err) {
      if (err.errors) {
        const errorDetails = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new AppError(`Validation failed: ${errorDetails}`, 400, 'VALIDATION_ERROR'));
      }
      next(err);
    }
  };
};
