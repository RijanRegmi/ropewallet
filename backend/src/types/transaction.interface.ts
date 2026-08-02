import { Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  sender?: Types.ObjectId;      // null for deposits
  receiver: Types.ObjectId;     // recipient user
  type: 'deposit' | 'transfer' | 'p2p_deposit' | 'withdrawal';
  amount: number;               // gross amount
  fee: number;                  // platform fee amount (15%)
  netAmount: number;            // amount credited to user (amount - fee)
  platformFee: number;          // 15% platform fee
  stripeFee: number;            // Stripe's processing fee (2.9% + $0.30)
  netProfit: number;            // platformFee - stripeFee
  status: 'completed' | 'pending' | 'declined';
  paymentMethod?: 'stripe' | 'card' | 'chime' | 'venmo' | 'cashapp' | 'applepay' | 'googlepay' | 'bank' | 'wallet';
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  paymentRequestToken?: string; // link to PaymentRequest
  remarks?: string;
  approvedBy?: Types.ObjectId;  // admin who approved P2P deposit
  approvedAt?: Date;
  declinedReason?: string;
  payerInfo?: {                 // info about the guest payer (for P2P)
    name?: string;
    email?: string;
    platform?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
