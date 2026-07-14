import { Schema, model } from 'mongoose';
import { ITransaction } from '../types/transaction.interface.js';

const transactionSchema = new Schema<ITransaction>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'transfer', 'p2p_deposit', 'withdrawal'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    stripeFee: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'declined'],
      default: 'completed',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'card', 'chime', 'venmo', 'cashapp', 'applepay', 'googlepay', 'bank', 'wallet'],
      required: false,
    },
    stripePaymentIntentId: {
      type: String,
      required: false,
    },
    stripeSessionId: {
      type: String,
      required: false,
    },
    paymentRequestToken: {
      type: String,
      required: false,
    },
    remarks: {
      type: String,
      required: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: false,
    },
    approvedAt: {
      type: Date,
      required: false,
    },
    declinedReason: {
      type: String,
      required: false,
    },
    payerInfo: {
      name: { type: String },
      email: { type: String },
      platform: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for admin dashboard queries
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
