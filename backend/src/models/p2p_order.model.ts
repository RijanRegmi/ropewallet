import { Schema, model, Document } from 'mongoose';

export interface IP2POrder extends Document {
  orderNo: string;
  hostId: Schema.Types.ObjectId;
  gameUserId?: string;
  payerTag?: string;
  payerName?: string;
  paymentMethod: 'chime' | 'cashapp' | 'venmo' | 'applepay' | 'googlepay';
  amount: number;
  assignedHandle: string;
  assignedP2PAccountId?: Schema.Types.ObjectId;
  status: 'pending' | 'completed' | 'expired' | 'declined' | 'flagged_pending_manual';
  expiresAt: Date;
  completedAt?: Date;
  proofOfPayment?: {
    emailUid?: number;
    fromAddress?: string;
    subject?: string;
    verifiedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const p2pOrderSchema = new Schema<IP2POrder>(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gameUserId: {
      type: String,
      trim: true,
    },
    payerTag: {
      type: String,
      trim: true,
    },
    payerName: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['chime', 'cashapp', 'venmo', 'applepay', 'googlepay'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least $1'],
    },
    assignedHandle: {
      type: String,
      required: true,
    },
    assignedP2PAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'P2PAccount',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired', 'declined', 'flagged_pending_manual'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    proofOfPayment: {
      emailUid: Number,
      fromAddress: String,
      subject: String,
      verifiedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const P2POrder = model<IP2POrder>('P2POrder', p2pOrderSchema);
