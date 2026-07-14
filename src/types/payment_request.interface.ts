import { Document, Types } from 'mongoose';

export interface IPaymentRequest extends Document {
  token: string;                // unique UUID for the link
  receiver: Types.ObjectId;     // RopeWallet user who will receive funds
  amount?: number;              // optional preset amount (guest can also enter manually)
  note?: string;                // optional note from receiver
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
