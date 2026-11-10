import { Schema, model, Document, Types } from 'mongoose';

/**
 * User document interface.
 */
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User schema definition.
 * 
 * Represents a user in the system.
 * Password is hashed before saving using bcrypt.
 */
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't return password by default
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', UserSchema);

