import { Router } from 'express';
import { z } from 'zod';
import {
  createColumn,
  getColumns,
  getColumn,
  updateColumn,
  deleteColumn,
} from '../controllers/columns.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

/**
 * Create column schema validation.
 */
const createColumnSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

/**
 * Update column schema validation.
 */
const updateColumnSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.number().int().optional(),
});

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/columns - Get all columns
 */
router.get('/', getColumns);

/**
 * GET /api/columns/:id - Get a single column
 */
router.get('/:id', getColumn);

/**
 * POST /api/columns - Create a new column
 */
router.post('/', validate(createColumnSchema, 'body'), createColumn);

/**
 * PUT /api/columns/:id - Update a column
 */
router.put('/:id', validate(updateColumnSchema, 'body'), updateColumn);

/**
 * DELETE /api/columns/:id - Delete a column
 */
router.delete('/:id', deleteColumn);

export default router;

