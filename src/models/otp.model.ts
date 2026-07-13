import { Schema, model } from 'mongoose';

export interface IOtp {
  email: string;
  code: string;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      unique: true, // Only one active OTP per email at any time
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // Automatic expiry after 5 minutes (300 seconds)
    },
  },
  {
    timestamps: true,
  }
);

export const Otp = model<IOtp>('Otp', otpSchema);
