'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { DashboardStatsModel } from '@/models/dashboard.model';
import { DollarSign, Users, UserX, Clock, TrendingUp, CreditCard, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await apiRequest<DashboardStatsModel>('/admin/dashboard-data');
    setLoading(false);
    if (res.success && res.data) {
      setStats(res.data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Cash Flow', value: `$${Number(stats?.totalCashFlow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-indigo-400' },
    { label: 'Platform Revenue (15%)', value: `$${Number(stats?.totalPlatformFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Stripe Fees Paid', value: `$${Number(stats?.totalStripeFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: CreditCard, color: 'text-red-400' },
    { label: 'Net Profit', value: `$${Number(stats?.totalNetProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: Sparkles, color: 'text-blue-400' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-gray-300' },
    { label: 'Active Users', value: stats?.activeUsers || 0, icon: Users, color: 'text-emerald-400' },
    { label: 'Pending Deposits', value: stats?.pendingDeposits || 0, icon: Clock, color: 'text-amber-400' },
    { label: 'Frozen Accounts', value: stats?.frozenUsers || 0, icon: UserX, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <p className="text-sm text-gray-400 mt-1">Real-time stats, cash flow volume, and active performance metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
                <span>{card.label}</span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className={`text-2xl font-extrabold ${card.color}`}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-[#1F2937]">
          <h3 className="text-base font-bold text-white">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1F2937]/50 text-xs uppercase text-gray-400 font-semibold">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Fee</th>
                <th className="px-6 py-3">Recipient</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {(stats?.recentTransactions || []).map((t) => (
                <tr key={t._id} className="hover:bg-gray-800/30 transition-all">
                  <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                      {(t.type || '').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border capitalize ${
                        t.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : t.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">${Number(t.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-400">${Number(t.fee || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 font-medium text-gray-200">
                    {t.receiver?.fullName || t.receiver?.userTag || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
