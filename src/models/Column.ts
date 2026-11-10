import { Schema, model, Document } from 'mongoose';

/**
 * Column document interface.
 */
export interface IColumn extends Document {
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Column schema definition.
 * 
 * Represents a column in the Kanban board (e.g., "To Do", "In Progress", "Done").
 * Each column has a position to maintain order.
 */
const ColumnSchema = new Schema<IColumn>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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

export const Column = model<IColumn>('Column', ColumnSchema);

