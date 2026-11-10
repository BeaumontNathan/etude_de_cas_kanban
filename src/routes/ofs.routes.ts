import { Router } from 'express';
import { z } from 'zod';
import {
  createOF,
  getOFs,
  getOF,
  updateOF,
  deleteOF,
  moveOF,
} from '../controllers/ofs.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

/**
 * Create OF schema validation.
 */
const createOFSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  columnId: z.string().min(1, 'Column ID is required'),
});

/**
 * Update OF schema validation.
 */
const updateOFSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  columnId: z.string().min(1).optional(),
  position: z.number().int().optional(),
});

/**
 * Move OF schema validation.
 */
const moveOFSchema = z.object({
  columnId: z.string().min(1).optional(),
  position: z.number().int().min(0).optional(),
});

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/ofs - Get all OFs
 * GET /api/ofs?columnId=xxx - Get OFs filtered by column
 */
router.get('/', getOFs);

/**
 * GET /api/ofs/:id - Get a single OF
 */
router.get('/:id', getOF);

/**
 * POST /api/ofs - Create a new OF
 */
router.post('/', validate(createOFSchema, 'body'), createOF);

/**
 * PUT /api/ofs/:id - Update an OF
 */
router.put('/:id', validate(updateOFSchema, 'body'), updateOF);

/**
 * PATCH /api/ofs/:id/move - Move an OF to a different column/position
 */
router.patch('/:id/move', validate(moveOFSchema, 'body'), moveOF);

/**
 * DELETE /api/ofs/:id - Delete an OF
 */
router.delete('/:id', deleteOF);

export default router;

