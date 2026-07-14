import { Document } from 'mongoose';

export interface IP2PAccount extends Document {
  platform: 'chime' | 'venmo' | 'cashapp';
  handle: string;       // email, username, or $cashtag
  displayName: string;  // friendly name shown on checkout page
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
