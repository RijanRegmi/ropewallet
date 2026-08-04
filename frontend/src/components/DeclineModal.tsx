'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';

interface DeclineModalProps {
  isOpen: boolean;
  depositId: string | null;
  endpoint?: string;
  title?: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function DeclineModal({ isOpen, depositId, endpoint, title, onClose, onSuccess }: DeclineModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !depositId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const targetUrl = endpoint || `/admin/deposits/${depositId}/decline`;
    const res = await apiRequest(targetUrl, 'PUT', { reason });
    setLoading(false);

    if (res.success) {
      onSuccess(res.message || 'Transaction declined successfully');
      setReason('');
      onClose();
    } else {
      setError(res.error || 'Decline operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-modal-in">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1F2937]">
          <h3 className="text-lg font-bold text-white">Decline Deposit</h3>
          <button onClick={onClose} title="Close" className="cursor-pointer text-gray-400 hover:text-white text-2xl font-semibold transition-colors">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Reason (Optional)</label>
            <input
              type="text"
              placeholder="Why is this deposit being declined?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-sm font-semibold transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Declining...' : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
