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
    qrCodeData: string;
    createdAt: Date;
    hasPin?: boolean;
    profileImage?: string;
    savedCard?: {
      cardholderName: string;
      cardNumber?: string;
      expMonth: string;
      expYear: string;
      cvc?: string;
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
