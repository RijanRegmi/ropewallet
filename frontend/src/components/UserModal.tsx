'use client';

import { useState, useEffect } from 'react';
import { UserModel } from '@/models/user.model';
import { apiRequest } from '@/lib/api';

interface UserModalProps {
  isOpen: boolean;
  user: UserModel | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const glassInput = {
  background: 'rgba(31, 73, 89, 0.30)',
  border: '1px solid rgba(92, 124, 137, 0.30)',
  color: '#ffffff',
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.15s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'rgba(168,196,204,0.80)',
  marginBottom: '6px',
};

export default function UserModal({ isOpen, user, onClose, onSuccess }: UserModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userTag, setUserTag] = useState('');
  const [role, setRole] = useState<'customer' | 'host' | 'superadmin'>('customer');
  const [password, setPassword] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setMiddleName(user.middleName || '');
      setEmail(user.email || '');
      setPhone(user.phoneNumber || '');
      setUserTag(user.userTag || '');
      setRole((user.role === 'user' || user.role === 'customer') ? 'customer' : (user.role === 'admin' || user.role === 'host') ? 'host' : 'superadmin');
      setWalletBalance(user.walletBalance || 0);
      setPassword('');
    } else {
      setFirstName(''); setLastName(''); setMiddleName('');
      setEmail(''); setPhone(''); setUserTag('');
      setRole('customer'); setWalletBalance(0); setPassword('');
    }
    setError('');
  }, [user, isOpen]);

  const handleNameChange = (fn: string, ln: string) => {
    setFirstName(fn);
    setLastName(ln);
    if (!user) {
      const base = (fn + ln).toLowerCase().replace(/[^a-z0-9]/g, '');
      const rand = Math.floor(100 + Math.random() * 900);
      setUserTag('$' + (base || 'user') + rand);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const body: any = { firstName, lastName, middleName, email, phoneNumber: phone, userTag, role };
    if (!user) body.password = password;
    else body.walletBalance = walletBalance;
    const endpoint = user ? `/admin/users/${user._id}` : '/admin/users';
    const method = user ? 'PUT' : 'POST';
    const res = await apiRequest(endpoint, method, body);
    setLoading(false);
    if (res.success) { onSuccess(user ? 'User updated successfully' : 'User created successfully'); onClose(); }
    else setError(res.error || 'Operation failed');
  };

  const inputFocusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'rgba(92,124,137,0.70)';
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(92,124,137,0.12)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'rgba(92,124,137,0.30)';
      e.currentTarget.style.boxShadow = 'none';
    },
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex items-center justify-center min-h-screen">
      <div
        className="w-full max-w-lg p-6 sm:p-7 rounded-3xl animate-fade-in relative text-left my-auto max-h-[90vh] overflow-y-auto"
        style={{
          background: 'rgba(10, 26, 40, 0.92)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(92, 124, 137, 0.28)',
          boxShadow: '0 24px 60px rgba(1, 20, 37, 0.85), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5 pb-3" style={{ borderBottom: '1px solid rgba(92,124,137,0.18)' }}>
          <h3 className="text-lg font-bold text-white">
            {user ? 'Edit User Account' : 'Create New User'}
          </h3>
          <button
            onClick={onClose}
            title="Close"
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-lg font-semibold transition-all"
            style={{ background: 'rgba(92,124,137,0.12)', color: '#5C7C89', border: '1px solid rgba(92,124,137,0.22)' }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'rgba(239,68,68,0.15)'; el.style.color = '#f87171'; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'rgba(92,124,137,0.12)'; el.style.color = '#5C7C89'; }}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>First Name *</label>
              <input type="text" required value={firstName} onChange={(e) => handleNameChange(e.target.value, lastName)}
                style={glassInput} {...inputFocusHandlers} placeholder="John" />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input type="text" required value={lastName} onChange={(e) => handleNameChange(firstName, e.target.value)}
                style={glassInput} {...inputFocusHandlers} placeholder="Doe" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Middle Name</label>
            <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)}
              style={glassInput} {...inputFocusHandlers} placeholder="(optional)" />
          </div>

          <div>
            <label style={labelStyle}>Email Address *</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              style={glassInput} {...inputFocusHandlers} placeholder="user@example.com" />
          </div>

          <div>
            <label style={labelStyle}>Phone Number *</label>
            <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
              style={glassInput} {...inputFocusHandlers} placeholder="+1 234 567 8900" />
          </div>

          <div>
            <label style={labelStyle}>User Tag ($username) *</label>
            <input type="text" required value={userTag} onChange={(e) => setUserTag(e.target.value)}
              style={{ ...glassInput, fontFamily: 'monospace' }} {...inputFocusHandlers} placeholder="$username123" />
          </div>

          <div>
            <label style={labelStyle}>Account Role *</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)}
              style={glassInput} {...inputFocusHandlers as any}
            >
              <option value="customer">Customer</option>
              <option value="host">Host</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          {!user ? (
            <div>
              <label style={labelStyle}>Password *</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                style={glassInput} {...inputFocusHandlers} placeholder="••••••••" />
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Wallet Balance ($)</label>
              <input type="number" step="0.01" min="0" value={walletBalance}
                onChange={(e) => setWalletBalance(parseFloat(e.target.value) || 0)}
                style={glassInput} {...inputFocusHandlers} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid rgba(92,124,137,0.15)' }}>
            <button type="button" onClick={onClose}
              className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ background: 'rgba(92,124,137,0.10)', border: '1px solid rgba(92,124,137,0.22)', color: 'rgba(208,232,239,0.70)' }}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="cursor-pointer px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #1F4959, #5C7C89)',
                border: '1px solid rgba(92,124,137,0.45)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(31,73,89,0.45)',
              }}
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Saving...' : user ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
