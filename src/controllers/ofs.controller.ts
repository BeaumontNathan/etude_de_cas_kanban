import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { OF } from '../models/OF.js';
import { logger } from '../config/logger.js';

/**
 * Create a new OF (Ordre de Fabrication).
 * 
 * Creates a new work item in a column of the Kanban board.
 * Position is automatically set to the end of the column.
 * 
 * @example
 * ```typescript
 * POST /api/ofs
 * {
 *   "title": "New task",
 *   "description": "Task description",
 *   "columnId": "column123"
 * }
 * ```
 */
export async function createOF(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, columnId } = req.body;

    // Find max position in the column
    const maxPosition = await OF.findOne({ columnId })
      .sort({ position: -1 })
      .select('position')
      .lean();

    const position = maxPosition ? maxPosition.position + 1 : 0;

    const of = new OF({
      title,
      description,
      columnId,
      position,
    });

    await of.save();

    logger.info({ ofId: of._id, columnId }, 'OF created');

    res.status(201).json({
      message: 'OF created successfully',
      data: of,
    });
  } catch (error) {
    logger.error({ error }, 'Error creating OF');
    throw error;
  }
}

/**
 * Get all OFs, optionally filtered by column.
 * 
 * Returns all work items, optionally filtered by columnId query parameter.
 * 
 * @example
 * ```typescript
 * GET /api/ofs
 * GET /api/ofs?columnId=column123
 * ```
 */
export async function getOFs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { columnId } = req.query;

    const filter = columnId ? { columnId } : {};

    const ofs = await OF.find(filter).sort({ position: 1 });

    res.status(200).json({
      message: 'OFs retrieved successfully',
      data: ofs,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching OFs');
    throw error;
  }
}

/**
 * Get a single OF by ID.
 * 
 * @example
 * ```typescript
 * GET /api/ofs/:id
 * ```
 */
export async function getOF(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const of = await OF.findById(id);

    if (!of) {
      res.status(404).json({ error: 'OF not found' });
      return;
    }

    res.status(200).json({
      message: 'OF retrieved successfully',
      data: of,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching OF');
    throw error;
  }
}

/**
 * Update an OF.
 * 
 * Updates OF properties (title, description, columnId, position).
 * 
 * @example
 * ```typescript
 * PUT /api/ofs/:id
 * {
 *   "title": "Updated title",
 *   "columnId": "newColumn123"
 * }
 * ```
 */
export async function updateOF(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const of = await OF.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!of) {
      res.status(404).json({ error: 'OF not found' });
      return;
    }

    logger.info({ ofId: id }, 'OF updated');

    res.status(200).json({
      message: 'OF updated successfully',
      data: of,
    });
  } catch (error) {
    logger.error({ error }, 'Error updating OF');
    throw error;
  }
}

/**
 * Delete an OF.
 * 
 * @example
 * ```typescript
 * DELETE /api/ofs/:id
 * ```
 */
export async function deleteOF(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const of = await OF.findByIdAndDelete(id);

    if (!of) {
      res.status(404).json({ error: 'OF not found' });
      return;
    }

    logger.info({ ofId: id }, 'OF deleted');

    res.status(200).json({
      message: 'OF deleted successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error deleting OF');
    throw error;
  }
}

/**
 * Move an OF to a different column or position.
 * 
 * Updates the OF's columnId and/or position.
 * Can also update positions of other OFs in the same column if needed.
 * 
 * @example
 * ```typescript
 * PATCH /api/ofs/:id/move
 * {
 *   "columnId": "targetColumn123",
 *   "position": 2
 * }
 * ```
 */
export async function moveOF(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { columnId, position } = req.body;

    const of = await OF.findById(id);

    if (!of) {
      res.status(404).json({ error: 'OF not found' });
      return;
    }

    // If moving to a different column, update columnId
    if (columnId && columnId !== of.columnId.toString()) {
      of.columnId = columnId;
    }

    // If position is provided, update it
    if (typeof position === 'number') {
      const oldPosition = of.position;
      const oldColumnId = of.columnId.toString();

      // Shift other OFs in the same column
      if (position < oldPosition) {
        await OF.updateMany(
          {
            columnId: oldColumnId,
            position: { $gte: position, $lt: oldPosition },
          },
          { $inc: { position: 1 } }
        );
      } else if (position > oldPosition) {
        await OF.updateMany(
          {
            columnId: oldColumnId,
            position: { $gt: oldPosition, $lte: position },
          },
          { $inc: { position: -1 } }
        );
      }

      of.position = position;
    }

    await of.save();

    logger.info({ ofId: id, columnId: of.columnId, position: of.position }, 'OF moved');

    res.status(200).json({
      message: 'OF moved successfully',
      data: of,
    });
  } catch (error) {
    logger.error({ error }, 'Error moving OF');
    throw error;
  }
}

