/**
 * Standardized error handling middleware.
 * Adheres to CricketConnect API envelope:
 * { "success": false, "error": { "code": "...", "message": "..." } }
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred';

  if (process.env.NODE_ENV !== 'test' && statusCode >= 500) {
    console.error('💥 Unhandled Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
