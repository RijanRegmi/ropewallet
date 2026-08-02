'use client';

import { useState, useEffect } from 'react';
import { P2PAccountModel } from '@/models/p2p-account.model';
import { apiRequest } from '@/lib/api';

interface P2PModalProps {
  isOpen: boolean;
  account: P2PAccountModel | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function P2PModal({ isOpen, account, onClose, onSuccess }: P2PModalProps) {
  const [platform, setPlatform] = useState<'chime' | 'venmo' | 'cashapp'>('chime');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [directPayUrl, setDirectPayUrl] = useState('');
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isAutoVerifyEnabled, setIsAutoVerifyEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setPlatform(account.platform || 'chime');
      setHandle(account.handle || '');
      setDisplayName(account.displayName || '');
      setDirectPayUrl(account.directPayUrl || '');
      setEmail(account.email || '');
      setAppPassword(account.appPassword || '');
      setIsAutoVerifyEnabled(account.isAutoVerifyEnabled || false);
    } else {
      setPlatform('chime');
      setHandle('');
      setDisplayName('');
      setDirectPayUrl('');
      setEmail('');
      setAppPassword('');
      setIsAutoVerifyEnabled(false);
    }
    setError('');
  }, [account, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const body = {
      platform,
      handle,
      displayName,
      directPayUrl,
      email,
      appPassword,
      isAutoVerifyEnabled,
    };

    const endpoint = account ? `/admin/p2p-accounts/${account._id}` : '/admin/p2p-accounts';
    const method = account ? 'PUT' : 'POST';

    const res = await apiRequest(endpoint, method, body);
    setLoading(false);

    if (res.success) {
      onSuccess(account ? 'P2P account updated' : 'P2P account added');
      onClose();
    } else {
      setError(res.error || 'Operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-modal-in">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#1F2937]">
          <h3 className="text-lg font-bold text-white">
            {account ? 'Edit P2P Account' : 'Add P2P Account'}
          </h3>
          <button onClick={onClose} title="Close" className="cursor-pointer text-gray-400 hover:text-white text-2xl font-semibold transition-colors">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Platform *</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="chime">Chime</option>
              <option value="venmo">Venmo</option>
              <option value="cashapp">Cash App</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Handle / Username *</label>
            <input
              type="text"
              required
              placeholder="@username or email"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Display Name *</label>
            <input
              type="text"
              required
              placeholder="Friendly name shown to payers"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Direct Pay Link / URL</label>
            <input
              type="text"
              placeholder="https://venmo.com/username"
              value={directPayUrl}
              onChange={(e) => setDirectPayUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Automation Gmail</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Gmail App Password</label>
            <input
              type="password"
              placeholder="xxxx xxxx xxxx xxxx"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="autoVerifyCheck"
              checked={isAutoVerifyEnabled}
              onChange={(e) => setIsAutoVerifyEnabled(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="autoVerifyCheck" className="text-sm text-gray-300 cursor-pointer">
              Enable Automatic Email Verification
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-sm font-semibold transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : account ? 'Save Account' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
