'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { TransactionModel } from '@/models/transaction.model';
import DeclineModal from '@/components/DeclineModal';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { Check, X, ArrowUpRight, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function HostPayoutsPage() {
  const [payouts, setPayouts] = useState<TransactionModel[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'declined' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Decline modal & toast
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' as 'success' | 'error' });

  // Approval Confirmation Modal state
  const [approveConfirmState, setApproveConfirmState] = useState<{
    isOpen: boolean;
    payoutId: string | null;
    amount: number;
    userName: string;
    loading: boolean;
  }>({
    isOpen: false,
    payoutId: null,
    amount: 0,
    userName: '',
    loading: false,
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
      isOpen: true,
      payoutId: p._id,
      amount: p.amount,
      userName: sender?.fullName || sender?.userTag || 'Host User',
      loading: false,
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

  const handleDeclineConfirm = async (reason: string) => {
    if (!declineTargetId) return;
    const res = await apiRequest(`/admin/payouts/${declineTargetId}/decline`, 'PUT', { reason });
    setIsDeclineOpen(false);
    setDeclineTargetId(null);

    if (res.success) {
      showToast('Payout declined & funds refunded back to host available balance!');
      fetchPayouts(page, statusFilter);
    } else {
      showToast(res.error || 'Failed to decline payout', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast message={toastMsg.text} type={toastMsg.type} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-7 h-7 text-indigo-400" />
            Host Payout Requests
          </h2>
          <p className="text-sm text-gray-400 mt-1">Review, approve, or decline cashout requests from Host accounts</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-400">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-[#1F2937] border border-gray-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="pending">Pending Requests</option>
            <option value="completed">Completed Payouts</option>
            <option value="declined">Declined Requests</option>
            <option value="all">All Payouts</option>
          </select>
        </div>
      </div>

      {/* Main Payout Requests Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] bg-[#1F2937]/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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

            <tbody className="divide-y divide-[#1F2937] text-sm text-gray-300">
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
                    <tr key={p._id} className="hover:bg-gray-800/40 transition-colors">
                      {/* Host Info */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{hostName}</div>
                        <div className="text-xs text-indigo-400 font-mono mt-0.5">{hostTag}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[160px]">{sender?.email || ''}</div>
                      </td>

                      {/* Cashout Amount */}
                      <td className="py-4 px-6 font-bold text-white text-base">
                        ${Number(p.amount).toFixed(2)}
                      </td>

                      {/* 3% Fee */}
                      <td className="py-4 px-6 text-xs font-semibold text-amber-400">
                        ${Number(fee).toFixed(2)}
                      </td>

                      {/* Net Payout */}
                      <td className="py-4 px-6 font-bold text-emerald-400 text-base">
                        ${Number(netPayout).toFixed(2)}
                      </td>

                      {/* Card / Remarks Details */}
                      <td className="py-4 px-6 text-xs text-gray-300 max-w-[240px]">
                        <div className="font-mono text-gray-200 truncate">{p.remarks || 'Card Withdrawal'}</div>
                        {sender?.savedCard && (
                          <div className="text-[11px] text-gray-500 mt-1">
                            {sender.savedCard.cardBrand} •••• {sender.savedCard.last4} ({sender.savedCard.zipCode})
                          </div>
                        )}
                      </td>

                      {/* Requested Date */}
                      <td className="py-4 px-6 text-xs text-gray-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                        <div className="text-[11px] text-gray-500">{new Date(p.createdAt).toLocaleTimeString()}</div>
                      </td>

                      {/* Status */}
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

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {p.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => promptApprove(p)}
                              className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black rounded-lg transition-all shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve
                            </button>
                            <button
                              onClick={() => promptDecline(p._id)}
                              className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 transition-all"
                            >
                              <X className="w-3.5 h-3.5" /> Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 font-mono">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#1F2937] flex items-center justify-between text-xs text-gray-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 bg-[#1F2937] hover:bg-gray-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 bg-[#1F2937] hover:bg-gray-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Approval */}
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

      {/* Decline Reason Modal */}
      <DeclineModal
        isOpen={isDeclineOpen}
        depositId={declineTargetId}
        endpoint={declineTargetId ? `/admin/payouts/${declineTargetId}/decline` : undefined}
        title="Decline Host Payout Request"
        onClose={() => {
          setIsDeclineOpen(false);
          setDeclineTargetId(null);
        }}
        onSuccess={(msg) => {
          showToast(msg || 'Payout request declined. Funds refunded back to host available balance!');
          fetchPayouts(page, statusFilter);
        }}
      />
    </div>
  );
}
