import { Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  middleName?: string;
  lastName: string;
  userTag: string;
  fullName: string; // Maintain this as virtual or saved string for backward compatibility
  email: string;
  password?: string;
  phoneNumber: string;
  transactionPin?: string;
  profileImage?: string;
  walletBalance: number;
  qrCodeData: string;
  isFrozen: boolean;
  frozenAt?: Date;
  frozenBy?: string;  // admin ID who froze the account
  createdAt: Date;
  updatedAt: Date;
  savedCard?: {
    cardholderName: string;
    cardNumber: string;
    expMonth: string;
    expYear: string;
    cvc: string;
    zipCode: string;
    country: string;
    cardBrand: string;
    last4: string;
    addressLine1?: string;
    differentInvoiceName?: boolean;
    invoiceName?: string;
    taxId?: string;
  };
  comparePassword(password: string): Promise<boolean>;
  comparePin(pin: string): Promise<boolean>;
}
