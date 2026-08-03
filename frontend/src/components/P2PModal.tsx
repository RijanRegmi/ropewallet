'use client';

import { useState, useEffect } from 'react';
import { P2PAccountModel } from '@/models/p2p-account.model';
import { apiRequest } from '@/lib/api';
import { Link2, Sparkles, X, Check, Mail, Lock, User, ShieldCheck } from 'lucide-react';

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

  // Auto-generate payment link based on entered handle and selected platform
  const handleAutoGenerateLink = () => {
    if (!handle.trim()) return;
    const clean = handle.trim();
    const cleanTag = clean.replace(/^[$@]/, '');

    if (platform === 'chime') {
      if (clean.startsWith('$')) {
        setDirectPayUrl(`https://chime.me/${clean}`);
      } else if (clean.includes('@')) {
        setDirectPayUrl(`https://member.chime.com/pay/${encodeURIComponent(clean)}`);
      } else {
        setDirectPayUrl(`https://chime.me/$${cleanTag}`);
      }
    } else if (platform === 'cashapp') {
      setDirectPayUrl(`https://cash.app/$${cleanTag}`);
    } else if (platform === 'venmo') {
      setDirectPayUrl(`https://venmo.com/u/${cleanTag}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let finalPayUrl = directPayUrl.trim();
    if (platform === 'chime') {
      finalPayUrl = finalPayUrl.replace(/chime\.com\/\$/i, 'chime.me/$');
      if (!finalPayUrl && handle.trim()) {
        const cleanTag = handle.trim().replace(/^[$@]/, '');
        finalPayUrl = `https://chime.me/$${cleanTag}`;
      }
    }

    const body = {
      platform,
      handle: handle.trim(),
      displayName: displayName.trim(),
      directPayUrl: finalPayUrl,
      email: email.trim(),
      appPassword: appPassword.trim(),
      isAutoVerifyEnabled,
    };

    const endpoint = account ? `/admin/p2p-accounts/${account._id}` : '/admin/p2p-accounts';
    const method = account ? 'PUT' : 'POST';

    const res = await apiRequest(endpoint, method, body);
    setLoading(false);

    if (res.success) {
      onSuccess(account ? 'P2P payment account updated' : 'P2P payment account added');
      onClose();
    } else {
      setError(res.error || 'Operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex items-center justify-center min-h-screen">
      <div className="bg-[#111827] border border-[#1F2937] rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl animate-fade-in relative text-left my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          title="Close"
          className="absolute top-6 right-6 text-gray-400 hover:text-white p-1 rounded-full bg-gray-800 hover:bg-gray-700 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pb-4 border-b border-[#1F2937]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-md">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">
                {account ? 'Edit P2P Gateway Account' : 'Add P2P Gateway Account'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Configure payment handles, custom direct pay links, and IMAP verification
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Payment Gateway Platform *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPlatform('chime')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  platform === 'chime'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-[#1F2937] border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <img src="https://img.icons8.com/color/96/chime.png" alt="Chime" className="h-4 object-contain" />
                Chime
              </button>

              <button
                type="button"
                onClick={() => setPlatform('cashapp')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  platform === 'cashapp'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-[#1F2937] border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <img src="https://img.icons8.com/color/96/cash-app.png" alt="Cash App" className="h-4 object-contain" />
                Cash App
              </button>

              <button
                type="button"
                onClick={() => setPlatform('venmo')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  platform === 'venmo'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm'
                    : 'bg-[#1F2937] border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-[10px] font-black text-[#008CFF] bg-white/10 px-1 rounded">V</span>
                Venmo
              </button>
            </div>
          </div>

          {/* Handle / Username */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Handle / Username / {platform === 'chime' ? 'ChimeSign ($tag)' : 'Tag'} *
            </label>
            <input
              type="text"
              required
              placeholder={
                platform === 'chime'
                  ? '$ChimeSign or email (e.g. $JasmineHoward or Jasmine@gmail.com)'
                  : platform === 'cashapp'
                  ? '$cashtag (e.g. $JohnDoe)'
                  : '@username (e.g. @JaneDoe)'
              }
              value={handle}
              onChange={(e) => {
                const val = e.target.value;
                setHandle(val);
                // Auto sync email if handle looks like a gmail address
                if (val.includes('@gmail.com') && !email) {
                  setEmail(val);
                }
              }}
              className="w-full px-4 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition-all"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Display Name *
            </label>
            <input
              type="text"
              required
              placeholder="Friendly name shown to payers (e.g. Chime Official)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Direct Pay Link / URL with Auto-Generate Helper */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                Direct Payment URL (Chime / Gateway Link)
              </label>
              <button
                type="button"
                onClick={handleAutoGenerateLink}
                className="text-[10px] font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 rounded-lg border border-emerald-500/40 transition-all active:scale-95"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Auto-Fill Pay Link
              </button>
            </div>
            <input
              type="text"
              placeholder={
                platform === 'chime'
                  ? 'https://chime.me/$yourtag or https://member.chime.com/pay/$yourtag'
                  : platform === 'cashapp'
                  ? 'https://cash.app/$yourtag'
                  : 'https://venmo.com/u/yourtag'
              }
              value={directPayUrl}
              onChange={(e) => setDirectPayUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono"
            />
            <p className="text-[11px] text-emerald-400/90 mt-1.5 leading-relaxed bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
              👉 <strong>Where to add your Chime Tag:</strong> Enter your <strong>$ChimeSign</strong> (e.g. <code>$JasmineHoward</code>) or <strong>https://chime.me/$yourtag</strong> in the box above or click <strong>Auto-Fill Pay Link</strong>. When payers click &quot;Launch Chime App&quot;, they will land directly on your Chime payment screen!
            </p>
          </div>

          {/* Automation Email & App Password */}
          <div className="pt-2 border-t border-[#1F2937] space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Automated IMAP Verification Settings
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Automation Gmail</label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Gmail App Password</label>
                <input
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoVerifyCheck"
                checked={isAutoVerifyEnabled}
                onChange={(e) => setIsAutoVerifyEnabled(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700 text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="autoVerifyCheck" className="text-xs text-gray-300 cursor-pointer select-none font-medium">
                Enable Automatic IMAP Email Payment Settlement
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-5 border-t border-[#1F2937]">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-xs font-bold transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : account ? 'Save Account' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
