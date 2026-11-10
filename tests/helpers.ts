import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { HydratedDocument } from 'mongoose';
import { User } from '../src/models/User.js';
import { Column } from '../src/models/Column.js';
import type { IColumn } from '../src/models/Column.js';
import { OF } from '../src/models/OF.js';

/**
 * Test helper utilities.
 * 
 * Provides functions to create test data and authenticate requests.
 * 
 * @example
 * ```typescript
 * import { createTestUser, getAuthToken, createTestColumn } from './helpers';
 * 
 * const user = await createTestUser();
 * const token = getAuthToken(user);
 * ```
 */

/**
 * Creates a test user in the database.
 * 
 * @param email - User email (default: 'test@example.com')
 * @param password - User password (default: 'password123')
 * @returns Created user document
 * 
 * @example
 * ```typescript
 * const user = await createTestUser('user@test.com', 'mypassword');
 * ```
 */
export async function createTestUser(
  email = 'test@example.com',
  password = 'password123'
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    email,
    password: hashedPassword,
  });
  await user.save();
  return user;
}

/**
 * Generates a JWT token for a user.
 * 
 * @param user - User document or user ID
 * @param secret - JWT secret (default: from env or test secret)
 * @returns JWT token string
 * 
 * @example
 * ```typescript
 * const user = await createTestUser();
 * const token = getAuthToken(user);
 * ```
 */
export function getAuthToken(
  user: { _id: any; email: string },
  secret = process.env.JWT_SECRET || 'test-secret-key-at-least-32-characters'
): string {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * Creates a test column in the database.
 * 
 * @param name - Column name (default: 'Test Column')
 * @param position - Column position (default: 0)
 * @returns Created column document
 * 
 * @example
 * ```typescript
 * const column = await createTestColumn('To Do', 0);
 * ```
 */
export async function createTestColumn(
  name = 'Test Column',
  position = 0
): Promise<HydratedDocument<IColumn>> {
  const column = new Column({
    name,
    position,
  });
  await column.save();
  return column;
}

/**
 * Creates a test OF in the database.
 * 
 * @param columnId - Column ID
 * @param title - OF title (default: 'Test OF')
 * @param description - OF description (optional)
 * @param position - OF position (default: 0)
 * @returns Created OF document
 * 
 * @example
 * ```typescript
 * const column = await createTestColumn();
 * const of = await createTestOF(column._id.toString(), 'My Task');
 * ```
 */
export async function createTestOF(
  columnId: string,
  title = 'Test OF',
  description?: string,
  position = 0
) {
  const of = new OF({
    title,
    description,
    columnId,
    position,
  });
  await of.save();
  return of;
}

