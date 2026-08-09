export interface RegisterDTO {
  firstName: string;
  middleName?: string;
  lastName: string;
  userTag: string;
  email: string;
  password: string;
  phoneNumber: string;
  otpCode: string;
  transactionPin: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    userTag: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    walletBalance: number;
    pendingCashoutBalance?: number;
    qrCodeData: string;
    role: 'customer' | 'user' | 'host' | 'admin' | 'superadmin';
    createdAt: Date;
    hasPin?: boolean;
    profileImage?: string;
    savedCard?: {
      cardholderName: string;
      stripePaymentMethodId?: string;
      expMonth: string;
      expYear: string;
      zipCode: string;
      country: string;
      cardBrand: string;
      last4: string;
      addressLine1?: string;
      differentInvoiceName?: boolean;
      invoiceName?: string;
      taxId?: string;
    };
  };
}
