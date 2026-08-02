export interface P2PAccountModel {
  _id: string;
  platform: 'chime' | 'venmo' | 'cashapp';
  handle: string;
  displayName: string;
  directPayUrl?: string;
  email?: string;
  appPassword?: string;
  isActive: boolean;
  isAutoVerifyEnabled: boolean;
  createdAt?: string;
}

export interface P2PListResponse {
  success: boolean;
  data: {
    accounts: P2PAccountModel[];
  };
  error?: string;
}
