export interface UserModel {
  _id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  userTag?: string;
  role: 'customer' | 'host' | 'superadmin' | 'user' | 'admin';
  walletBalance: number;
  isFrozen: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: UserModel[];
    admins?: UserModel[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  error?: string;
}
