'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { TransactionModel, DepositListResponse } from '@/models/transaction.model';
import DeclineModal from '@/components/DeclineModal';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { Check, X } from 'lucide-react';

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<TransactionModel[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'declined' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Decline modal & toast
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' as 'success' | 'error' });

  // Confirmation Modal state
  const [approveConfirmState, setApproveConfirmState] = useState<{
    isOpen: boolean;
    depositId: string | null;
    amount: number;
    userName: string;
    loading: boolean;
  }>({
    isOpen: false,
    depositId: null,
    amount: 0,
    userName: '',
    loading: false,
  });

  useEffect(() => {
    fetchDeposits(page, statusFilter);
  }, [page, statusFilter]);

  const fetchDeposits = async (p: number, s: string) => {
    setLoading(true);
    const res = await apiRequest<DepositListResponse['data']>(`/admin/deposits?page=${p}&status=${s}`);
    setLoading(false);

    if (res.success && res.data) {
      setDeposits(res.data.deposits || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 4000);
  };

  const promptApprove = (d: TransactionModel) => {
    setApproveConfirmState({
      isOpen: true,
      depositId: d._id,
      amount: d.amount,
      userName: d.receiver?.fullName || d.receiver?.userTag || 'User',
      loading: false,
    });
  };

  const handleApproveConfirm = async () => {
    if (!approveConfirmState.depositId) return;
    setApproveConfirmState((prev) => ({ ...prev, loading: true }));
    const res = await apiRequest(`/admin/deposits/${approveConfirmState.depositId}/approve`, 'PUT');
    setApproveConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));

    if (res.success) {
      showToast('Deposit approved successfully');
      fetchDeposits(page, statusFilter);
    } else {
      showToast(res.error || 'Failed to approve deposit', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast message={toastMsg.text} type={toastMsg.type} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Pending Deposits</h2>
          <p className="text-sm text-gray-400 mt-1">Review, approve, or decline P2P user deposit submissions</p>
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
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
            <option value="all">All Deposits</option>
          </select>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1F2937]/50 text-xs uppercase text-gray-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Payer Info</th>
                <th className="px-6 py-3.5">Platform</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Recipient User</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading deposits...
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No deposits found for this status.
                  </td>
                </tr>
              ) : (
                deposits.map((d) => (
                  <tr key={d._id} className="hover:bg-gray-800/30 transition-all">
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(d.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {d.payerInfo?.name || d.payerInfo?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                        {d.paymentMethod || d.payerInfo?.platform || 'P2P'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-white text-base">
                      ${Number(d.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-200">
                      {d.receiver?.fullName || d.receiver?.userTag || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border capitalize ${
                          d.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : d.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {d.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => promptApprove(d)}
                            title="Approve this deposit"
                            className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-lg shadow transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setDeclineTargetId(d._id);
                              setIsDeclineOpen(true);
                            }}
                            title="Decline this deposit"
                            className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold rounded-lg shadow transition-all"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-[#1F2937]">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                  p === page
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <DeclineModal
        isOpen={isDeclineOpen}
        depositId={declineTargetId}
        onClose={() => setIsDeclineOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          fetchDeposits(page, statusFilter);
        }}
      />

      {/* UI Confirmation Modal for Approve Deposit */}
      <ConfirmModal
        isOpen={approveConfirmState.isOpen}
        type="info"
        title="Approve Deposit Confirmation"
        message={`Are you sure you want to approve the $${Number(approveConfirmState.amount).toFixed(2)} deposit for ${approveConfirmState.userName}? $${Number(approveConfirmState.amount).toFixed(2)} will be credited to their wallet balance immediately.`}
        confirmText="Approve Deposit"
        cancelText="Cancel"
        loading={approveConfirmState.loading}
        onConfirm={handleApproveConfirm}
        onClose={() => setApproveConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
