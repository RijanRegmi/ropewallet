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
  const [flaggedOrders, setFlaggedOrders] = useState<any[]>([]);
  const [manualTransferTags, setManualTransferTags] = useState<Record<string, string>>({});
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'declined' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' as 'success' | 'error' });

  const [approveConfirmState, setApproveConfirmState] = useState<{
    isOpen: boolean;
    depositId: string | null;
    amount: number;
    userName: string;
    loading: boolean;
  }>({
    isOpen: false, depositId: null, amount: 0, userName: '', loading: false,
  });

  useEffect(() => {
    fetchDeposits(page, statusFilter);
    fetchFlaggedOrders();
  }, [page, statusFilter]);

  const fetchFlaggedOrders = async () => {
    const res = await apiRequest<any[]>('/pay/flagged-orders');
    if (res.success && Array.isArray(res.data)) setFlaggedOrders(res.data);
  };

  const handleManualApprove = async (orderId: string) => {
    const targetTag = manualTransferTags[orderId]?.trim();
    if (!targetTag) {
      showToast('Please enter host userTag for transfer (e.g. mamaji)', 'error');
      return;
    }
    setProcessingOrder(orderId);
    const res = await apiRequest<any>(`/pay/manual-approve/${orderId}`, 'POST', { targetHostUserTag: targetTag });
    setProcessingOrder(null);
    if (res.success) {
      showToast(res.message || 'Successfully credited host wallet balance!');
      fetchFlaggedOrders();
      fetchDeposits(page, statusFilter);
    } else {
      showToast(res.error || 'Manual transfer failed', 'error');
    }
  };

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
      isOpen: true, depositId: d._id, amount: d.amount,
      userName: d.receiver?.fullName || d.receiver?.userTag || 'User', loading: false,
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
          <p className="text-sm mt-1" style={{ color: '#5C7C89' }}>Review, approve, or decline P2P user deposit submissions</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(168,196,204,0.70)' }}>Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="px-3.5 py-2 rounded-xl text-sm font-medium text-white focus:outline-none cursor-pointer"
            style={{ background: 'rgba(31,73,89,0.35)', border: '1px solid rgba(92,124,137,0.30)' }}
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
            <option value="all">All Deposits</option>
          </select>
        </div>
      </div>

      {/* Flagged orders banner */}
      {flaggedOrders.length > 0 && (
        <div
          className="rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden"
          style={{ background: 'rgba(13,32,48,0.80)', border: '1px solid rgba(245,158,11,0.35)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)', color: '#fbbf24' }}>
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Verified Unmatched Payments Needing Manual Host Transfer ({flaggedOrders.length})</h3>
                <p className="text-xs" style={{ color: '#5C7C89' }}>Money has been received and verified via email receipt. Enter target host userTag to complete 80% host credit / 20% platform split.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flaggedOrders.map((fo) => (
              <div key={fo._id} className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(31,73,89,0.30)', border: '1px solid rgba(92,124,137,0.25)' }}>
                <div className="flex items-center justify-between text-xs" style={{ color: '#5C7C89' }}>
                  <span className="font-mono font-bold text-amber-400">#{fo.orderNo}</span>
                  <span>{new Date(fo.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider block" style={{ color: 'rgba(168,196,204,0.60)' }}>Payer Tag / Name</span>
                    <span className="font-bold text-white text-sm">{fo.payerName || fo.payerTag || 'Verified Payer'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-wider block" style={{ color: 'rgba(168,196,204,0.60)' }}>Amount Received</span>
                    <span className="text-lg font-black text-emerald-400">${Number(fo.amount).toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-xs p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'rgba(1,20,37,0.60)', border: '1px solid rgba(92,124,137,0.18)', color: '#d0e8ef' }}>
                  <span><strong>Received At Account:</strong> {fo.assignedHandle || fo.paymentMethod?.toUpperCase()}</span>
                  <span style={{ color: '#5C7C89' }}>Email UID #{fo.proofOfPayment?.emailUid}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Host userTag (e.g. mamaji)..."
                    value={manualTransferTags[fo._id] || ''}
                    onChange={(e) => setManualTransferTags({ ...manualTransferTags, [fo._id]: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none"
                    style={{ background: 'rgba(31,73,89,0.40)', border: '1px solid rgba(92,124,137,0.30)' }}
                  />
                  <button
                    onClick={() => handleManualApprove(fo._id)}
                    disabled={processingOrder === fo._id}
                    className="px-4 py-2 text-white text-xs font-black rounded-lg shrink-0 cursor-pointer transition-all"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: '1px solid rgba(16,185,129,0.40)' }}
                  >
                    {processingOrder === fo._id ? 'Transferring...' : 'Transfer 80% to Host'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div
        className="rounded-2xl overflow-hidden shadow-lg"
        style={{ background: 'rgba(13,32,48,0.70)', backdropFilter: 'blur(20px)', border: '1px solid rgba(92,124,137,0.20)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ color: 'rgba(208,232,239,0.80)' }}>
            <thead className="text-xs uppercase font-semibold" style={{ background: 'rgba(92,124,137,0.08)', color: 'rgba(92,124,137,0.80)' }}>
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
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: 'rgba(92,124,137,0.20)', borderTopColor: '#5C7C89' }} />
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
                  <tr key={d._id} className="transition-all" style={{ borderBottom: '1px solid rgba(92,124,137,0.10)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(92,124,137,0.06)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td className="px-6 py-4 text-xs" style={{ color: '#5C7C89' }}>
                      {new Date(d.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {d.payerInfo?.name || d.payerInfo?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg capitalize" style={{ background: 'rgba(92,124,137,0.15)', border: '1px solid rgba(92,124,137,0.28)', color: '#a8c4cc' }}>
                        {d.paymentMethod || d.payerInfo?.platform || 'P2P'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-white text-base">
                      ${Number(d.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-medium" style={{ color: '#a8c4cc' }}>
                      {d.receiver?.fullName || d.receiver?.userTag || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg capitalize"
                        style={
                          d.status === 'completed'
                            ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }
                            : d.status === 'pending'
                            ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }
                            : { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }
                        }
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
                            className="cursor-pointer flex items-center gap-1 px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-all active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: '1px solid rgba(16,185,129,0.40)', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => { setDeclineTargetId(d._id); setIsDeclineOpen(true); }}
                            title="Decline this deposit"
                            className="cursor-pointer flex items-center gap-1 px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-all active:scale-95"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171' }}
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs italic" style={{ color: '#5C7C89' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4" style={{ borderTop: '1px solid rgba(92,124,137,0.15)' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                style={p === page
                  ? { background: 'linear-gradient(135deg,#1F4959,#5C7C89)', color: '#fff', border: '1px solid rgba(92,124,137,0.50)' }
                  : { background: 'rgba(31,73,89,0.25)', color: 'rgba(168,196,204,0.70)', border: '1px solid rgba(92,124,137,0.22)' }}
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
        onSuccess={(msg) => { showToast(msg); fetchDeposits(page, statusFilter); }}
      />

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
