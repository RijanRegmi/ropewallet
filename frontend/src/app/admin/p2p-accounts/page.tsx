'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Toast, { ToastMessage } from '@/components/Toast';
import { ApiClient } from '@/lib/api';

interface P2PAccount {
  _id: string;
  platform: 'chime' | 'venmo' | 'cashapp';
  handle: string;
  displayName: string;
  isActive: boolean;
}

export default function P2PAccounts() {
  const [accounts, setAccounts] = useState<P2PAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const router = useRouter();

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState('');
  const [platform, setPlatform] = useState<'chime' | 'venmo' | 'cashapp'>('chime');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isActive, setIsActive] = useState(true);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchAccounts = async () => {
    setLoading(true);
    const res = await ApiClient.get<{ accounts: P2PAccount[] }>('/admin/p2p-accounts');
    if (res.success && res.data) {
      setAccounts(res.data.accounts);
    } else {
      addToast(res.error || 'Failed to load P2P accounts list', 'error');
      if (res.error?.includes('session') || res.error?.includes('auth')) {
        router.push('/');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openAddModal = () => {
    setEditId('');
    setPlatform('chime');
    setHandle('');
    setDisplayName('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (account: P2PAccount) => {
    setEditId(account._id);
    setPlatform(account.platform);
    setHandle(account.handle);
    setDisplayName(account.displayName);
    setIsActive(account.isActive);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { platform, handle, displayName, isActive };

    if (editId) {
      const res = await ApiClient.put(`/admin/p2p-accounts/${editId}`, body);
      if (res.success) {
        addToast('P2P Account configuration saved', 'success');
        setShowModal(false);
        fetchAccounts();
      } else {
        addToast(res.error || 'Failed to save account config', 'error');
      }
    } else {
      const res = await ApiClient.post('/admin/p2p-accounts', body);
      if (res.success) {
        addToast('New P2P Account configured successfully', 'success');
        setShowModal(false);
        fetchAccounts();
      } else {
        addToast(res.error || 'Failed to create P2P account', 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this P2P Account configuration? Payers will no longer see it.')) return;
    const res = await ApiClient.delete(`/admin/p2p-accounts/${id}`);
    if (res.success) {
      addToast('P2P Account configuration deleted', 'success');
      fetchAccounts();
    } else {
      addToast(res.error || 'Failed to delete account configuration', 'error');
    }
  };

  const platformIcons = { chime: '🏦', venmo: '💜', cashapp: '💚' };
  const platformColors = { chime: '#00D54B', venmo: '#3D95CE', cashapp: '#00D632' };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-dark-text">P2P Accounts</h2>
            <p className="text-sm text-dark-text-secondary mt-1">
              Configure copyable handles (Chime, Venmo, Cash App) for manual P2P deposits
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer"
          >
            + Add Account
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2" />
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((a) => {
              const icon = platformIcons[a.platform] || '💳';
              const color = platformColors[a.platform] || '#6366F1';

              return (
                <div
                  key={a._id}
                  className="bg-dark-surface border border-dark-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-dark-text-secondary flex items-center gap-1.5">
                      {icon} {a.platform.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        a.isActive
                          ? 'bg-success/15 text-success border border-success/20'
                          : 'bg-danger/15 text-danger border border-danger/20'
                      }`}
                    >
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="text-xl font-extrabold mb-1" style={{ color }}>
                    {a.handle}
                  </div>
                  <div className="text-xs text-dark-text-secondary font-medium">
                    Name: {a.displayName}
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => openEditModal(a)}
                      className="px-3.5 py-1.5 bg-dark-bg hover:bg-dark-surface-2 border border-dark-border text-dark-text text-xs font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="px-3.5 py-1.5 bg-dark-bg hover:bg-danger/10 border border-dark-border hover:border-danger/30 text-danger text-xs font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {accounts.length === 0 && (
              <div className="col-span-full bg-dark-surface border border-dark-border rounded-2xl p-12 text-center text-dark-text-secondary text-sm">
                No handles configured yet. Add Chime/Venmo details to support manual deposits.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit P2P Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-[420px] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-dark-border">
              <h3 className="font-extrabold text-lg text-dark-text">
                {editId ? 'Edit P2P Account' : 'Add P2P Account'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-dark-text-secondary hover:text-dark-text text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-text-secondary uppercase">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm font-semibold outline-none cursor-pointer focus:border-primary"
                >
                  <option value="chime">Chime</option>
                  <option value="venmo">Venmo</option>
                  <option value="cashapp">Cash App</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-text-secondary uppercase">
                  Handle / Username
                </label>
                <input
                  type="text"
                  placeholder="@username or email"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-text-secondary uppercase">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. RopeWallet Inc."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-primary border-dark-border bg-dark-bg outline-none cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-dark-text-secondary uppercase cursor-pointer">
                  Activate this account handle
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-dark-bg border border-dark-border hover:bg-dark-surface-2 text-dark-text text-sm font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl cursor-pointer"
                >
                  {editId ? 'Save Changes' : 'Configure Account'}
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
