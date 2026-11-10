import pino from 'pino';
import { env } from './env.js';

/**
 * Pino logger instance configuration.
 * 
 * Provides structured logging with different levels (info, error, warn, debug).
 * In development mode, uses pretty printing for better readability.
 * In production, outputs JSON for log aggregation tools.
 * 
 * @example
 * ```typescript
 * import { logger } from './config/logger';
 * 
 * logger.info({ userId: 123 }, 'User logged in');
 * logger.error({ error }, 'Failed to process request');
 * ```
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

