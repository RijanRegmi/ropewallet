'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ApiClient } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  frozenUsers: number;
  activeUsers: number;
  pendingDeposits: number;
  completedTransactions: number;
  totalCashFlow: number;
  totalPlatformFee: number;
  totalStripeFee: number;
  totalNetProfit: number;
  recentTransactions: Array<{
    _id: string;
    type: string;
    status: string;
    amount: number;
    fee: number;
    createdAt: string;
    receiver?: { fullName?: string; userTag?: string };
    sender?: { fullName?: string; userTag?: string };
  }>;
  monthlyRevenue: Array<{
    _id: string;
    revenue: number;
    volume: number;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const res = await ApiClient.get<DashboardStats>('/admin/dashboard-data');
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to fetch dashboard data');
        if (res.error?.includes('session') || res.error?.includes('auth')) {
          router.push('/');
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-dark-bg items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-2" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-dark-bg items-center justify-center text-center p-4">
        <div>
          <h2 className="text-xl font-bold text-danger mb-2">Error Loading Dashboard</h2>
          <p className="text-dark-text-secondary mb-4">{error || 'Unknown error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate max volume for chart scaling
  const maxVolume = Math.max(...data.monthlyRevenue.map((m) => m.volume), 1);

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-dark-text">Dashboard</h2>
          <p className="text-sm text-dark-text-secondary mt-1">
            Overview of your platform performance
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all">
            <div className="text-xs font-bold text-dark-text-secondary mb-2 flex items-center gap-1.5">
              📈 Total Cash Flow
            </div>
            <div className="text-2xl font-extrabold text-dark-text">
              ${Number(data.totalCashFlow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all">
            <div className="text-xs font-bold text-dark-text-secondary mb-2 flex items-center gap-1.5">
              💵 Platform Revenue (15%)
            </div>
            <div className="text-2xl font-extrabold text-success">
              ${Number(data.totalPlatformFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all">
            <div className="text-xs font-bold text-dark-text-secondary mb-2 flex items-center gap-1.5">
              💳 Stripe Fees Paid
            </div>
            <div className="text-2xl font-extrabold text-danger">
              ${Number(data.totalStripeFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all">
            <div className="text-xs font-bold text-dark-text-secondary mb-2 flex items-center gap-1.5">
              ✨ Net Profit
            </div>
            <div className="text-2xl font-extrabold text-info">
              ${Number(data.totalNetProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
            <div className="text-xs font-bold text-dark-text-secondary mb-2">👥 Total Users</div>
            <div className="text-2xl font-extrabold">{data.totalUsers}</div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
            <div className="text-xs font-bold text-dark-text-secondary mb-2">✅ Active Users</div>
            <div className="text-2xl font-extrabold">{data.activeUsers}</div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
            <div className="text-xs font-bold text-dark-text-secondary mb-2 text-warning">⏳ Pending Deposits</div>
            <div className="text-2xl font-extrabold text-warning">{data.pendingDeposits}</div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
            <div className="text-xs font-bold text-dark-text-secondary mb-2 text-danger">🔒 Frozen Accounts</div>
            <div className="text-2xl font-extrabold text-danger">{data.frozenUsers}</div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="space-y-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
            <h3 className="font-bold text-lg text-dark-text mb-6">Monthly Volume & Revenue</h3>
            {data.monthlyRevenue.length > 0 ? (
              <div className="h-64 flex items-end gap-6 pt-4 border-b border-dark-border/40 pb-2">
                {data.monthlyRevenue.map((month) => {
                  const volHeight = (month.volume / maxVolume) * 100;
                  const revHeight = (month.revenue / maxVolume) * 100;

                  return (
                    <div key={month._id} className="flex-1 flex flex-col items-center h-full group relative">
                      {/* Hover stats tooltips */}
                      <div className="absolute bottom-full mb-2 bg-dark-surface-3 border border-dark-border px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <div className="text-dark-text">Vol: ${month.volume.toFixed(2)}</div>
                        <div className="text-success mt-0.5">Rev: ${month.revenue.toFixed(2)}</div>
                      </div>

                      {/* Bars Wrapper */}
                      <div className="w-full flex gap-1.5 h-full items-end justify-center">
                        <div
                          className="w-4 bg-primary/30 border-t border-primary rounded-t-sm transition-all duration-350 hover:bg-primary/50"
                          style={{ height: `${Math.max(volHeight, 4)}%` }}
                        />
                        <div
                          className="w-4 bg-success/30 border-t border-success rounded-t-sm transition-all duration-350 hover:bg-success/50"
                          style={{ height: `${Math.max(revHeight, 4)}%` }}
                        />
                      </div>

                      {/* Label */}
                      <span className="text-[11px] text-dark-text-secondary font-bold mt-2">
                        {month._id}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-dark-text-secondary text-sm">
                No monthly data accumulated yet.
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-dark-border">
              <h3 className="font-bold text-lg text-dark-text">Recent Activity Log</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-surface-2/50 text-[11px] font-bold text-dark-text-secondary uppercase tracking-wider border-b border-dark-border">
                    <th className="py-4.5 px-6">Date</th>
                    <th className="py-4.5 px-6">Type</th>
                    <th className="py-4.5 px-6">Status</th>
                    <th className="py-4.5 px-6">Amount</th>
                    <th className="py-4.5 px-6">Fee</th>
                    <th className="py-4.5 px-6">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {data.recentTransactions.map((tx) => {
                    const typeLabel = tx.type
                      .replace('_', ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                    const recipient = tx.receiver?.fullName || tx.receiver?.userTag || '-';

                    return (
                      <tr key={tx._id} className="hover:bg-primary/2 transition-colors">
                        <td className="py-4 px-6 text-sm">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-info/10 text-info rounded-lg">
                            {typeLabel}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${
                              tx.status === 'completed'
                                ? 'bg-success/15 text-success'
                                : tx.status === 'pending'
                                ? 'bg-warning/15 text-warning'
                                : 'bg-danger/15 text-danger'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold">
                          ${Number(tx.amount).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-sm text-dark-text-secondary">
                          ${Number(tx.fee || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold">{recipient}</td>
                      </tr>
                    );
                  })}
                  {data.recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-dark-text-secondary text-sm">
                        No transactions registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
