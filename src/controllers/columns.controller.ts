import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { Column } from '../models/Column.js';
import { logger } from '../config/logger.js';

/**
 * Create a new column.
 * 
 * Creates a new column in the Kanban board.
 * Position is automatically set to the end.
 * 
 * @example
 * ```typescript
 * POST /api/columns
 * {
 *   "name": "In Progress"
 * }
 * ```
 */
export async function createColumn(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name } = req.body;

    // Find max position
    const maxPosition = await Column.findOne()
      .sort({ position: -1 })
      .select('position')
      .lean();

    const position = maxPosition ? maxPosition.position + 1 : 0;

    const column = new Column({
      name,
      position,
    });

    await column.save();

    logger.info({ columnId: column._id, name }, 'Column created');

    res.status(201).json({
      message: 'Column created successfully',
      data: column,
    });
  } catch (error) {
    logger.error({ error }, 'Error creating column');
    throw error;
  }
}

/**
 * Get all columns.
 * 
 * Returns all columns ordered by position.
 * 
 * @example
 * ```typescript
 * GET /api/columns
 * ```
 */
export async function getColumns(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const columns = await Column.find().sort({ position: 1 });

    res.status(200).json({
      message: 'Columns retrieved successfully',
      data: columns,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching columns');
    throw error;
  }
}

/**
 * Get a single column by ID.
 * 
 * @example
 * ```typescript
 * GET /api/columns/:id
 * ```
 */
export async function getColumn(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const column = await Column.findById(id);

    if (!column) {
      res.status(404).json({ error: 'Column not found' });
      return;
    }

    res.status(200).json({
      message: 'Column retrieved successfully',
      data: column,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching column');
    throw error;
  }
}

/**
 * Update a column.
 * 
 * Updates column properties (name, position).
 * 
 * @example
 * ```typescript
 * PUT /api/columns/:id
 * {
 *   "name": "Updated name",
 *   "position": 2
 * }
 * ```
 */
export async function updateColumn(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const column = await Column.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!column) {
      res.status(404).json({ error: 'Column not found' });
      return;
    }

    logger.info({ columnId: id }, 'Column updated');

    res.status(200).json({
      message: 'Column updated successfully',
      data: column,
    });
  } catch (error) {
    logger.error({ error }, 'Error updating column');
    throw error;
  }
}

/**
 * Delete a column.
 * 
 * @example
 * ```typescript
 * DELETE /api/columns/:id
 * ```
 */
export async function deleteColumn(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const column = await Column.findByIdAndDelete(id);

    if (!column) {
      res.status(404).json({ error: 'Column not found' });
      return;
    }

    logger.info({ columnId: id }, 'Column deleted');

    res.status(200).json({
      message: 'Column deleted successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error deleting column');
    throw error;
  }
}

