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

const glassInput = {
  background: 'rgba(31, 73, 89, 0.30)',
  border: '1px solid rgba(92, 124, 137, 0.30)',
  color: '#ffffff',
};

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
      <div
        className="w-full max-w-sm p-6 rounded-2xl animate-fade-in"
        style={{
          background: 'rgba(13, 32, 48, 0.90)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(92, 124, 137, 0.25)',
          boxShadow: '0 24px 60px rgba(1, 20, 37, 0.80), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid rgba(92,124,137,0.18)' }}>
          <h3 className="text-base font-bold text-white">{title || 'Decline Deposit'}</h3>
          <button
            onClick={onClose}
            title="Close"
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-lg font-semibold transition-all"
            style={{ background: 'rgba(92,124,137,0.12)', color: '#5C7C89', border: '1px solid rgba(92,124,137,0.22)' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(239,68,68,0.15)';
              el.style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(92,124,137,0.12)';
              el.style.color = '#5C7C89';
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            className="mb-4 p-3 text-sm rounded-xl text-center"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(168,196,204,0.80)' }}>
              Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="Why is this being declined?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-all"
              style={glassInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(92,124,137,0.60)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,124,137,0.10)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(92,124,137,0.30)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ background: 'rgba(92,124,137,0.10)', border: '1px solid rgba(92,124,137,0.22)', color: 'rgba(208,232,239,0.70)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #7f1d1d, #dc2626)',
                border: '1px solid rgba(239,68,68,0.40)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(220,38,38,0.30)',
              }}
            >
              {loading ? 'Declining...' : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
