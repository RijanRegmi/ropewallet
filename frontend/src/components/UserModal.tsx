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
      setFirstName('');
      setLastName('');
      setMiddleName('');
      setEmail('');
      setPhone('');
      setUserTag('');
      setRole('customer');
      setWalletBalance(0);
      setPassword('');
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

    const body: any = {
      firstName,
      lastName,
      middleName,
      email,
      phoneNumber: phone,
      userTag,
      role,
    };

    if (!user) {
      body.password = password;
    } else {
      body.walletBalance = walletBalance;
    }

    const endpoint = user ? `/admin/users/${user._id}` : '/admin/users';
    const method = user ? 'PUT' : 'POST';

    const res = await apiRequest(endpoint, method, body);
    setLoading(false);

    if (res.success) {
      onSuccess(user ? 'User updated successfully' : 'User created successfully');
      onClose();
    } else {
      setError(res.error || 'Operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-modal-in">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#1F2937]">
          <h3 className="text-lg font-bold text-white">
            {user ? 'Edit User Account' : 'Create New User'}
          </h3>
          <button onClick={onClose} title="Close" className="cursor-pointer text-gray-400 hover:text-white text-2xl font-semibold transition-colors">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => handleNameChange(e.target.value, lastName)}
                className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => handleNameChange(firstName, e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Middle Name</label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Phone Number *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">User Tag ($username) *</label>
            <input
              type="text"
              required
              value={userTag}
              onChange={(e) => setUserTag(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Account Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="customer">Customer</option>
              <option value="host">Host</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          {!user ? (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Wallet Balance ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={walletBalance}
                onChange={(e) => setWalletBalance(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

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
              {loading ? 'Saving...' : user ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
