'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Toast, { ToastMessage } from '@/components/Toast';
import { ApiClient } from '@/lib/api';

interface Deposit {
  _id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  receiver?: {
    fullName?: string;
    userTag?: string;
  };
  payerInfo?: {
    name?: string;
    email?: string;
    platform?: string;
  };
}

export default function PendingDeposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const router = useRouter();

  // Decline modal states
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineTargetId, setDeclineTargetId] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchDeposits = async () => {
    setLoading(true);
    const res = await ApiClient.get<{ deposits: Deposit[] }>(
      `/admin/deposits?status=${statusFilter}`
    );
    if (res.success && res.data) {
      setDeposits(res.data.deposits);
    } else {
      addToast(res.error || 'Failed to fetch deposits queue', 'error');
      if (res.error?.includes('session') || res.error?.includes('auth')) {
        router.push('/');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this P2P deposit? The recipient's wallet will be credited (minus the 15% platform fee).")) return;
    const res = await ApiClient.put<any>(`/admin/deposits/${id}/approve`);
    if (res.success) {
      addToast(res.message || 'Deposit approved and credited', 'success');
      fetchDeposits();
    } else {
      addToast(res.error || 'Failed to approve deposit', 'error');
    }
  };

  const openDeclineModal = (id: string) => {
    setDeclineTargetId(id);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await ApiClient.put<any>(`/admin/deposits/${declineTargetId}/decline`, {
      reason: declineReason,
    });
    if (res.success) {
      addToast('Deposit request declined successfully', 'success');
      setShowDeclineModal(false);
      fetchDeposits();
    } else {
      addToast(res.error || 'Failed to decline deposit', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-dark-text">Pending Deposits</h2>
            <p className="text-sm text-dark-text-secondary mt-1">
              Approve or decline manual P2P deposits (Chime, Venmo)
            </p>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark-surface border border-dark-border text-dark-text px-4 py-2.5 rounded-xl text-sm font-semibold outline-none cursor-pointer focus:border-primary"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
              <option value="all">All Deposits</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2" />
          </div>
        )}

        {!loading && (
          <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-surface-2/40 text-[11px] font-bold text-dark-text-secondary uppercase tracking-wider border-b border-dark-border">
                    <th className="py-4.5 px-6">Date Registered</th>
                    <th className="py-4.5 px-6">Payer Name</th>
                    <th className="py-4.5 px-6">Platform</th>
                    <th className="py-4.5 px-6">Amount</th>
                    <th className="py-4.5 px-6">Recipient User</th>
                    <th className="py-4.5 px-6">Status</th>
                    {statusFilter === 'pending' && <th className="py-4.5 px-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {deposits.map((d) => {
                    const payerName = d.payerInfo?.name || d.payerInfo?.email || 'Unknown Payer';
                    const platform = d.paymentMethod || d.payerInfo?.platform || 'chime';
                    const recipient = d.receiver?.fullName || d.receiver?.userTag || '-';

                    return (
                      <tr key={d._id} className="hover:bg-primary/2 transition-colors">
                        <td className="py-4 px-6 text-sm text-dark-text">
                          {new Date(d.createdAt).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-dark-text">
                          {payerName}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className="inline-block px-2.5 py-1 text-xs font-bold bg-info/10 text-info rounded-lg uppercase">
                            {platform}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-dark-text">
                          ${Number(d.amount).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-sm text-dark-text font-medium">
                          {recipient}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${
                              d.status === 'completed'
                                ? 'bg-success/15 text-success'
                                : d.status === 'pending'
                                ? 'bg-warning/15 text-warning'
                                : 'bg-danger/15 text-danger'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        {statusFilter === 'pending' && (
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(d._id)}
                                className="px-3 py-1.5 bg-success hover:bg-success-hover text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => openDeclineModal(d._id)}
                                className="px-3 py-1.5 bg-danger hover:bg-danger/80 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                              >
                                ✗ Decline
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {deposits.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-dark-text-secondary text-sm">
                        No pending deposit confirmations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-[400px] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-dark-border">
              <h3 className="font-extrabold text-lg text-dark-text">Decline Deposit</h3>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="text-dark-text-secondary hover:text-dark-text text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDecline} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-text-secondary uppercase">
                  Decline Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Why is this deposit request being declined?"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(false)}
                  className="px-5 py-2.5 bg-dark-bg border border-dark-border hover:bg-dark-surface-2 text-dark-text text-sm font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-danger hover:bg-danger/80 text-white text-sm font-bold rounded-xl cursor-pointer"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </div>
  );
}
