import { Express } from 'express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/db.js';

/**
 * Starts the Express server.
 * 
 * Connects to MongoDB, then starts listening on configured PORT.
 * Handles graceful shutdown on SIGTERM/SIGINT.
 * 
 * @param app - Express application instance
 * 
 * @example
 * ```typescript
 * import { createApp } from './app';
 * import { startServer } from './server';
 * 
 * const app = createApp();
 * startServer(app);
 * ```
 */
export async function startServer(app: Express): Promise<void> {
  try {
    // Connect to database
    await connectDB();

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        `🚀 Server running on port ${env.PORT}`
      );
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

