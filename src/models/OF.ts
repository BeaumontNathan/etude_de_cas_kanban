import { Schema, model, Document } from 'mongoose';

/**
 * OF (Ordre de Fabrication) document interface.
 */
export interface IOF extends Document {
  title: string;
  description?: string;
  columnId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OF schema definition.
 * 
 * Represents a work item in the Kanban board.
 * Each OF belongs to a column and has a position within that column.
 */
const OFSchema = new Schema<IOF>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    columnId: {
      type: String,
      required: true,
      index: true,
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const OF = model<IOF>('OF', OFSchema);

