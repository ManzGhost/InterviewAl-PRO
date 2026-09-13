import mongoose, { Schema, Document } from 'mongoose';

export interface IXpTransaction extends Document {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  type: string;
  action: 'DEDUCTION' | 'ADDITION';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
  description: string;
  status: string;
  createdAt: string;
}

const XpTransactionSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, index: true },
    userName: { type: String },
    userRole: { type: String, default: 'USER' },
    type: { type: String, default: 'XP_TRANSACTION' },
    action: { type: String, enum: ['DEDUCTION', 'ADDITION'], required: true },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceId: { type: String },
    description: { type: String },
    status: { type: String, default: 'COMPLETED' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { collection: 'xp_transactions', timestamps: false }
);

export const XpTransactionModel = mongoose.model<IXpTransaction>('XpTransaction', XpTransactionSchema);