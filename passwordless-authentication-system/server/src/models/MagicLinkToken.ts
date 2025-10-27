import mongoose, { Schema } from 'mongoose';

/** One-time magic link token (hashed), 15m expiry */
export interface IMagicLinkToken extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const MagicLinkTokenSchema = new Schema<IMagicLinkToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export const MagicLinkToken = mongoose.model<IMagicLinkToken>('MagicLinkToken', MagicLinkTokenSchema);
