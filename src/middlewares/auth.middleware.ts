import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Extended Express Request interface to include user information.
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * JWT authentication middleware.
 * 
 * Verifies JWT token from Authorization header and attaches user info to request.
 * Token format: "Bearer <token>"
 * On success, adds user object to request with id and email.
 * On failure, returns 401 Unauthorized.
 * 
 * @example
 * ```typescript
 * import { authenticate } from './middlewares/auth.middleware';
 * 
 * router.get('/protected', authenticate, (req, res) => {
 *   const userId = req.user?.id;
 *   // ... handle request
 * });
 * ```
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
      };

      req.user = {
        id: decoded.id,
        email: decoded.email,
      };

      next();
    } catch (error) {
      logger.warn({ error }, 'Invalid JWT token');
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error({ error }, 'Authentication middleware error');
    res.status(500).json({ error: 'Authentication failed' });
  }
}

