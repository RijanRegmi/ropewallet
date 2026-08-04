'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { TransactionModel } from '@/models/transaction.model';
import DeclineModal from '@/components/DeclineModal';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { Check, X, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';

export default function HostPayoutsPage() {
  const [payouts, setPayouts] = useState<TransactionModel[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'declined' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' as 'success' | 'error' });

  const [approveConfirmState, setApproveConfirmState] = useState<{
    isOpen: boolean;
    payoutId: string | null;
    amount: number;
    userName: string;
    loading: boolean;
  }>({
    isOpen: false, payoutId: null, amount: 0, userName: '', loading: false,
  });

  useEffect(() => {
    fetchPayouts(page, statusFilter);
  }, [page, statusFilter]);

  const fetchPayouts = async (p: number, s: string) => {
    setLoading(true);
    const res = await apiRequest<any>(`/admin/payouts?page=${p}&status=${s}`);
    setLoading(false);
    if (res.success && res.data) {
      setPayouts(res.data.payouts || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 4000);
  };

  const promptApprove = (p: TransactionModel) => {
    const sender = p.sender as any;
    setApproveConfirmState({
      isOpen: true, payoutId: p._id, amount: p.amount,
      userName: sender?.fullName || sender?.userTag || 'Host User', loading: false,
    });
  };

  const handleApproveConfirm = async () => {
    if (!approveConfirmState.payoutId) return;
    setApproveConfirmState((prev) => ({ ...prev, loading: true }));
    const res = await apiRequest(`/admin/payouts/${approveConfirmState.payoutId}/approve`, 'PUT');
    setApproveConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));

    if (res.success) {
      showToast('Host payout request approved successfully!');
      fetchPayouts(page, statusFilter);
    } else {
      showToast(res.error || 'Failed to approve payout request', 'error');
    }
  };

  const promptDecline = (id: string) => {
    setDeclineTargetId(id);
    setIsDeclineOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast message={toastMsg.text} type={toastMsg.type} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-7 h-7" style={{ color: '#7ba5b5' }} />
            Host Payout Requests
          </h2>
          <p className="text-sm mt-1" style={{ color: '#5C7C89' }}>Review, approve, or decline cashout requests from Host accounts</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(168,196,204,0.70)' }}>Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="px-3.5 py-2 rounded-xl text-sm font-medium text-white focus:outline-none cursor-pointer"
            style={{ background: 'rgba(31,73,89,0.35)', border: '1px solid rgba(92,124,137,0.30)' }}
          >
            <option value="pending">Pending Requests</option>
            <option value="completed">Completed Payouts</option>
            <option value="declined">Declined Requests</option>
            <option value="all">All Payouts</option>
          </select>
        </div>
      </div>

      {/* Main Payout Requests Table */}
      <div
        className="rounded-2xl overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, rgba(22, 54, 72, 0.65) 0%, rgba(10, 28, 42, 0.88) 100%)', backdropFilter: 'blur(28px) saturate(180%)', border: '1px solid rgba(92,124,137,0.35)', boxShadow: '0 12px 40px rgba(0,10,20,0.65), inset 0 1px 0 rgba(255,255,255,0.10)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ color: 'rgba(208,232,239,0.80)' }}>
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(92,124,137,0.08)', color: 'rgba(92,124,137,0.80)', borderBottom: '1px solid rgba(92,124,137,0.15)' }}>
                <th className="py-4 px-6">Host / User</th>
                <th className="py-4 px-6">Requested Amount</th>
                <th className="py-4 px-6">3% Fee</th>
                <th className="py-4 px-6">Net Payout</th>
                <th className="py-4 px-6">Card / Destination Details</th>
                <th className="py-4 px-6">Requested Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 font-medium">
                    Loading payout requests...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 font-medium">
                    No {statusFilter !== 'all' ? statusFilter : ''} host payout requests found.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => {
                  const sender = p.sender as any;
                  const hostName = sender?.fullName || sender?.userTag || 'Unknown Host';
                  const hostTag = sender?.userTag ? (sender.userTag.startsWith('$') ? sender.userTag : `$${sender.userTag}`) : '-';
                  const fee = p.fee || Number((p.amount * 0.03).toFixed(2));
                  const netPayout = p.netAmount || (p.amount - fee);

                  return (
                    <tr key={p._id} className="transition-colors" style={{ borderBottom: '1px solid rgba(92,124,137,0.10)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(92,124,137,0.06)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{hostName}</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: '#7ba5b5' }}>{hostTag}</div>
                        <div className="text-xs truncate max-w-[160px]" style={{ color: '#5C7C89' }}>{sender?.email || ''}</div>
                      </td>

                      <td className="py-4 px-6 font-bold text-white text-base">
                        ${Number(p.amount).toFixed(2)}
                      </td>

                      <td className="py-4 px-6 text-xs font-semibold text-amber-400">
                        ${Number(fee).toFixed(2)}
                      </td>

                      <td className="py-4 px-6 font-bold text-emerald-400 text-base">
                        ${Number(netPayout).toFixed(2)}
                      </td>

                      <td className="py-4 px-6 text-xs max-w-[240px]" style={{ color: 'rgba(208,232,239,0.80)' }}>
                        <div className="font-mono text-gray-200 truncate">{p.remarks || 'Card Withdrawal'}</div>
                        {sender?.savedCard && (
                          <div className="text-[11px] mt-1" style={{ color: '#5C7C89' }}>
                            {sender.savedCard.cardBrand} •••• {sender.savedCard.last4} ({sender.savedCard.zipCode})
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs" style={{ color: '#5C7C89' }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                        <div className="text-[11px]" style={{ color: 'rgba(92,124,137,0.60)' }}>{new Date(p.createdAt).toLocaleTimeString()}</div>
                      </td>

                      <td className="py-4 px-6">
                        {p.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" /> Pending Approval
                          </span>
                        )}
                        {p.status === 'completed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3.5 h-3.5" /> Approved
                          </span>
                        )}
                        {p.status === 'declined' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            <X className="w-3.5 h-3.5" /> Declined
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {p.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => promptApprove(p)}
                              className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-white text-xs font-black rounded-lg transition-all active:scale-95"
                              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: '1px solid rgba(16,185,129,0.40)', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve
                            </button>
                            <button
                              onClick={() => promptDecline(p._id)}
                              className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95"
                              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171' }}
                            >
                              <X className="w-3.5 h-3.5" /> Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-mono" style={{ color: '#5C7C89' }}>No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-between text-xs" style={{ borderTop: '1px solid rgba(92,124,137,0.15)', color: '#5C7C89' }}>
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(31,73,89,0.30)', border: '1px solid rgba(92,124,137,0.25)', color: '#fff' }}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(31,73,89,0.30)', border: '1px solid rgba(92,124,137,0.25)', color: '#fff' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={approveConfirmState.isOpen}
        title="Approve Host Payout Request"
        message={`Are you sure you want to approve $${approveConfirmState.amount.toFixed(2)} cashout for ${approveConfirmState.userName}? This will finalize the payout and permanently deduct $${approveConfirmState.amount.toFixed(2)} from total balance.`}
        confirmText="Approve Payout"
        type="info"
        loading={approveConfirmState.loading}
        onConfirm={handleApproveConfirm}
        onClose={() => setApproveConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      <DeclineModal
        isOpen={isDeclineOpen}
        depositId={declineTargetId}
        endpoint={declineTargetId ? `/admin/payouts/${declineTargetId}/decline` : undefined}
        title="Decline Host Payout Request"
        onClose={() => { setIsDeclineOpen(false); setDeclineTargetId(null); }}
        onSuccess={(msg) => {
          showToast(msg || 'Payout request declined. Funds refunded back to host available balance!');
          fetchPayouts(page, statusFilter);
        }}
      />
    </div>
  );
}
