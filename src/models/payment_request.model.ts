import { Schema, model } from 'mongoose';
import { IPaymentRequest } from '../types/payment_request.interface.js';

const paymentRequestSchema = new Schema<IPaymentRequest>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: false,
    },
    note: {
      type: String,
      required: false,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired', 'cancelled'],
      default: 'active',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: auto-delete expired requests after 24 hours
paymentRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export const PaymentRequest = model<IPaymentRequest>('PaymentRequest', paymentRequestSchema);
