import { Schema, model, Document } from 'mongoose';

export interface IHostRequest extends Document {
  fullName: string;
  email: string;
  phone?: string;
  telegramOrWhatsapp?: string;
  notes?: string;
  status: 'pending' | 'contacted' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const hostRequestSchema = new Schema<IHostRequest>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    telegramOrWhatsapp: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

export const HostRequest = model<IHostRequest>('HostRequest', hostRequestSchema);
