import { Document } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  password?: string;
  fullName: string;
  role: 'superadmin' | 'admin';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}
