import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiRateLimiter, loginRateLimiter } from './middlewares/rateLimit.middleware.js';

/**
 * Creates and configures the Express application.
 * 
 * Sets up middleware (CORS, JSON parsing) and routes.
 * Error handler must be the last middleware.
 * Exported for use in server.ts and testing.
 * 
 * @returns Configured Express application
 * 
 * @example
 * ```typescript
 * import { createApp } from './app';
 * const app = createApp();
 * ```
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming request');
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api', apiRateLimiter());
  app.use('/api/auth/login', loginRateLimiter());
  app.use('/api', routes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

