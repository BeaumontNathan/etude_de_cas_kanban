import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

/**
 * Global error handling middleware.
 * 
 * Catches all errors thrown in routes/controllers and returns appropriate HTTP responses.
 * Handles different error types:
 * - Zod validation errors: returns 400 with validation details
 * - Mongoose errors: returns 400 with error message
 * - JWT errors: returns 401
 * - Generic errors: returns 500 with error message in development
 * 
 * Should be the last middleware in the Express app.
 * 
 * @example
 * ```typescript
 * import { errorHandler } from './middlewares/error.middleware';
 * 
 * app.use(routes);
 * app.use(errorHandler); // Must be last
 * ```
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error({ err, url: req.url, method: req.method }, 'Request error');

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation error',
      message: err.message,
    });
    return;
  }

  // Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    res.status(400).json({
      error: 'Duplicate entry',
      message: 'This resource already exists',
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Authentication error',
      message: err.message,
    });
    return;
  }

  // Generic errors
  const statusCode = (err as any).statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    error: 'Internal server error',
    message,
  });
}

