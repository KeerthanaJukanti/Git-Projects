import mongoose, { Schema } from 'mongoose';

export interface IUser extends mongoose.Document {
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, index: true, required: true, lowercase: true, trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
