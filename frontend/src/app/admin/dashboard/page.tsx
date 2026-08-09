'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { DashboardStatsModel } from '@/models/dashboard.model';
import { DollarSign, Users, UserX, Clock, TrendingUp, CreditCard, Sparkles, Wallet, Landmark } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await apiRequest<DashboardStatsModel>('/admin/dashboard-data');
    setLoading(false);
    if (res.success && res.data) setStats(res.data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-12 h-12 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(92,124,137,0.20)', borderTopColor: '#5C7C89', boxShadow: '0 0 20px rgba(92,124,137,0.25)' }}
        />
      </div>
    );
  }

  const cards = [
    { label: 'Total Cash Flow',      value: `$${Number(stats?.totalCashFlow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,      icon: TrendingUp,  accent: '#7ba5b5' },
    { label: 'Stripe Total Money',   value: `$${Number(stats?.stripeBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,       icon: Wallet,      accent: '#10B981' },
    { label: 'User Wallet Balances', value: `$${Number(stats?.totalUserBalances || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: Landmark,    accent: '#3B82F6' },
    { label: 'Platform Revenue',     value: `$${Number(stats?.totalPlatformFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,  icon: DollarSign,  accent: '#5C7C89' },
    { label: 'Stripe Fees Paid',     value: `$${Number(stats?.totalStripeFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,   icon: CreditCard,  accent: '#a8c4cc' },
    { label: 'Net Profit',           value: `$${Number(stats?.totalNetProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,   icon: Sparkles,    accent: '#d0e8ef' },
    { label: 'Total Users',          value: stats?.totalUsers || 0,           icon: Users,       accent: '#7ba5b5' },
    { label: 'Active Users',         value: stats?.activeUsers || 0,          icon: Users,       accent: '#10B981' },
    { label: 'Pending Deposits',     value: stats?.pendingDeposits || 0,      icon: Clock,       accent: '#F59E0B' },
    { label: 'Frozen Accounts',      value: stats?.frozenUsers || 0,          icon: UserX,       accent: '#EF4444' },
  ];

  const glassCard = {
    background: 'linear-gradient(135deg, rgba(28, 62, 82, 0.65) 0%, rgba(13, 35, 52, 0.85) 100%)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(92, 124, 137, 0.38)',
    boxShadow: '0 10px 36px rgba(0, 10, 20, 0.60), inset 0 1px 0 rgba(255,255,255,0.12)',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <p className="text-sm mt-1" style={{ color: '#5C7C89' }}>Real-time stats, cash flow volume, and active performance metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl transition-all duration-300 cursor-default"
              style={glassCard}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = 'rgba(92,124,137,0.65)';
                el.style.transform = 'translateY(-3px)';
                el.style.boxShadow = `0 18px 48px rgba(0,10,20,0.75), 0 0 28px rgba(92,124,137,0.20), inset 0 1px 0 rgba(255,255,255,0.18)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = 'rgba(92,124,137,0.38)';
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 10px 36px rgba(0, 10, 20, 0.60), inset 0 1px 0 rgba(255,255,255,0.12)';
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#a8c4cc' }}>{card.label}</span>
                {/* Glass icon bubble */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'rgba(92,124,137,0.20)',
                    border: '1px solid rgba(92,124,137,0.35)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.accent }} />
                </div>
              </div>
              <div className="text-2xl font-extrabold" style={{ color: card.accent }}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 54, 72, 0.65) 0%, rgba(10, 28, 42, 0.88) 100%)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(92, 124, 137, 0.35)',
          boxShadow: '0 12px 40px rgba(0, 10, 20, 0.65), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        <div className="p-5" style={{ borderBottom: '1px solid rgba(92,124,137,0.15)' }}>
          <h3 className="text-base font-bold text-white">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead style={{ background: 'rgba(92,124,137,0.06)' }}>
              <tr>
                {['Date', 'Type', 'Status', 'Amount', 'Fee', 'Recipient'].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(92,124,137,0.70)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats?.recentTransactions || []).map((t) => (
                <tr
                  key={t._id}
                  style={{ borderBottom: '1px solid rgba(92,124,137,0.08)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(92,124,137,0.06)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td className="px-6 py-4 text-sm" style={{ color: 'rgba(168,196,204,0.60)' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg capitalize"
                      style={{ background: 'rgba(92,124,137,0.15)', border: '1px solid rgba(92,124,137,0.28)', color: '#a8c4cc', backdropFilter: 'blur(6px)' }}
                    >
                      {(t.type || '').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg capitalize"
                      style={
                        t.status === 'completed'
                          ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }
                          : t.status === 'pending'
                          ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }
                          : { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }
                      }
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">${Number(t.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4" style={{ color: 'rgba(92,124,137,0.70)' }}>${Number(t.fee || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 font-medium" style={{ color: '#a8c4cc' }}>
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
