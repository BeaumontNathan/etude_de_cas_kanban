import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { logger } from '../config/logger.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();
const jwtSecret = env.JWT_SECRET as Secret;
const jwtOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
};

/**
 * Register schema validation.
 */
const registerSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Login schema validation.
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Register a new user.
 * 
 * Creates a new user account with email and hashed password.
 * Returns JWT token for authentication.
 * 
 * @example
 * ```typescript
 * POST /api/auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * ```
 */
router.post(
  '/register',
  validate(registerSchema, 'body'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
      });

      await user.save();

      // Generate JWT token
      const userId = user.id;
      const token = jwt.sign({ id: userId, email: user.email }, jwtSecret, jwtOptions);

      logger.info({ userId, email }, 'User registered');

      res.status(201).json({
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: userId,
            email: user.email,
          },
        },
      });
    } catch (error) {
      logger.error({ error }, 'Error registering user');
      throw error;
    }
  }
);

/**
 * Login user.
 * 
 * Authenticates user with email and password.
 * Returns JWT token for authentication.
 * 
 * @example
 * ```typescript
 * POST /api/auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * ```
 */
router.post(
  '/login',
  validate(loginSchema, 'body'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user and include password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT token
      const userId = user.id;
      const token = jwt.sign({ id: userId, email: user.email }, jwtSecret, jwtOptions);

      logger.info({ userId, email }, 'User logged in');

      res.status(200).json({
        message: 'Login successful',
        data: {
          token,
          user: {
            id: userId,
            email: user.email,
          },
        },
      });
    } catch (error) {
      logger.error({ error }, 'Error logging in user');
      throw error;
    }
  }
);

export default router;

