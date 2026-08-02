import { Schema, model } from 'mongoose';
import { IP2PAccount } from '../types/p2p_account.interface.js';

const p2pAccountSchema = new Schema<IP2PAccount>(
  {
    platform: {
      type: String,
      enum: ['chime', 'venmo', 'cashapp'],
      required: [true, 'Platform is required'],
    },
    handle: {
      type: String,
      required: [true, 'Handle is required'],
      trim: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      trim: true,
    },
    appPassword: {
      type: String,
      trim: true,
    },
    directPayUrl: {
      type: String,
      trim: true,
    },
    isAutoVerifyEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const P2PAccount = model<IP2PAccount>('P2PAccount', p2pAccountSchema);
