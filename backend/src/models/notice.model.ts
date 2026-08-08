import { Schema, model, Document, Types } from 'mongoose';

export interface INotice extends Document {
  title: string;
  content: string;
  category: 'info' | 'alert' | 'urgent' | 'promo';
  targetType: 'all' | 'customers' | 'hosts' | 'specific';
  targetUsers?: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['info', 'alert', 'urgent', 'promo'],
      default: 'info',
    },
    targetType: {
      type: String,
      enum: ['all', 'customers', 'hosts', 'specific'],
      default: 'all',
    },
    targetUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

noticeSchema.index({ targetType: 1, createdAt: -1 });
noticeSchema.index({ targetUsers: 1, createdAt: -1 });

export const Notice = model<INotice>('Notice', noticeSchema);
