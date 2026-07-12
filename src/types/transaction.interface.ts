import { Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  sender?: Types.ObjectId;      // null for deposits
  receiver: Types.ObjectId;     // recipient user
  type: 'deposit' | 'transfer';
  amount: number;               // gross amount
  fee: number;                  // 15% for transfers, 0 for deposits
  netAmount: number;            // amount - fee
  stripePaymentIntentId?: string; // for deposits
  remarks?: string;              // optional message
  createdAt: Date;
  updatedAt: Date;
}
