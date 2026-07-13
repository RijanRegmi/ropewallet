import { Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  fullName: string; // Maintain this as virtual or saved string for backward compatibility
  email: string;
  password?: string;
  phoneNumber: string;
  transactionPin?: string;
  profileImage?: string;
  walletBalance: number;
  qrCodeData: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  comparePin(pin: string): Promise<boolean>;
}
