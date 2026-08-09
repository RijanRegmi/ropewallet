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
  pendingCashoutBalance?: number;
  qrCodeData: string;
  isFrozen: boolean;
  freezeReason?: string;
  frozenAt?: Date;
  frozenBy?: string;  // admin ID who froze the account
  createdBy?: string; // admin ID who created this account
  usedCardFingerprints?: string[]; // Array of unique card fingerprints used on this account
  fcmToken?: string;
  stripeCustomerId?: string; // Stripe Customer ID for tokenized payment flows
  activeDeviceId?: string;
  activeSessionToken?: string;
  newDeviceOtp?: {
    code: string;
    expiresAt?: Date;
    tempToken: string;
    deviceId?: string;
  };
  role: 'customer' | 'user' | 'host' | 'admin' | 'superadmin';
  createdAt: Date;
  updatedAt: Date;
  savedCard?: {
    cardholderName: string;
    stripePaymentMethodId: string; // Stripe PaymentMethod ID (pm_xxx) — replaces raw card number
    expMonth: string;   // Display only (from Stripe PM response)
    expYear: string;    // Display only (from Stripe PM response)
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
