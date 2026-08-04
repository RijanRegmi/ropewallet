export interface TransactionModel {
  _id: string;
  type: string;
  amount: number;
  fee?: number;
  netAmount?: number;
  platformFee?: number;
  stripeFee?: number;
  netProfit?: number;
  status: 'pending' | 'completed' | 'declined' | 'failed';
  paymentMethod?: string;
  payerInfo?: {
    name?: string;
    email?: string;
    platform?: string;
    handle?: string;
  };
  sender?: {
    _id?: string;
    fullName?: string;
    userTag?: string;
    email?: string;
  };
  receiver?: {
    _id?: string;
    fullName?: string;
    userTag?: string;
    email?: string;
  };
  remarks?: string;
  createdAt: string;
}

export interface DepositListResponse {
  success: boolean;
  data: {
    deposits: TransactionModel[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  error?: string;
}
