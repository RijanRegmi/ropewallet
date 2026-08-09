import { TransactionModel } from './transaction.model';

export interface MonthlyRevenueData {
  _id: string;
  revenue: number;
  volume: number;
  count: number;
}

export interface DashboardStatsModel {
  totalUsers: number;
  frozenUsers: number;
  activeUsers: number;
  pendingDeposits: number;
  completedTransactions: number;
  totalCashFlow: number;
  totalPlatformFee: number;
  totalStripeFee: number;
  totalNetProfit: number;
  stripeBalance?: number;
  stripeAvailable?: number;
  stripePending?: number;
  totalUserBalances?: number;
  recentTransactions: TransactionModel[];
  monthlyRevenue: MonthlyRevenueData[];
}
