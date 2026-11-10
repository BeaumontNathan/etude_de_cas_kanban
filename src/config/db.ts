import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Database connection handler using Mongoose.
 * 
 * Establishes and manages connection to MongoDB database.
 * Handles connection events (connected, error, disconnected) with appropriate logging.
 * 
 * @example
 * ```typescript
 * import { connectDB, disconnectDB } from './config/db';
 * 
 * // Connect to database
 * await connectDB();
 * 
 * // Disconnect when shutting down
 * await disconnectDB();
 * ```
 */
export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info({ uri: env.MONGODB_URI }, '✅ MongoDB connected successfully');
  } catch (error) {
    logger.error({ error }, '❌ MongoDB connection error');
    throw error;
  }
}

/**
 * Gracefully disconnects from MongoDB.
 * 
 * @example
 * ```typescript
 * await disconnectDB();
 * ```
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting from MongoDB');
    throw error;
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
  logger.error({ error }, 'Mongoose connection error');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

