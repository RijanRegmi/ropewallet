'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { P2PAccountModel, P2PListResponse } from '@/models/p2p-account.model';
import P2PModal from '@/components/P2PModal';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { Plus, Edit, Trash2, Link as LinkIcon, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

export default function P2PAccountsPage() {
  if (!FEATURE_FLAGS.ENABLE_P2P) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">P2P Payment Accounts</h2>
            <p className="text-sm text-gray-400 mt-1">P2P features are currently disabled in feature flags configuration.</p>
          </div>
        </div>
        <div className="bg-[#1F2937]/50 border border-[#374151] rounded-2xl p-8 text-center text-gray-400">
          To re-enable P2P deposit accounts, turn on <code className="text-indigo-400 font-mono">ENABLE_P2P = true</code> in <code className="text-indigo-400 font-mono">frontend/src/lib/featureFlags.ts</code>.
        </div>
      </div>
    );
  }

  const [accounts, setAccounts] = useState<P2PAccountModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Toast states
  const [selectedAccount, setSelectedAccount] = useState<P2PAccountModel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' as 'success' | 'error' });

  // Confirmation Modal State
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    accountId: string | null;
    accountHandle: string;
    loading: boolean;
  }>({
    isOpen: false,
    accountId: null,
    accountHandle: '',
    loading: false,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    const res = await apiRequest<P2PListResponse['data']>('/admin/p2p-accounts');
    setLoading(false);

    if (res.success && res.data) {
      setAccounts(res.data.accounts || []);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 4000);
  };

  const promptDeleteAccount = (acc: P2PAccountModel) => {
    setDeleteConfirmState({
      isOpen: true,
      accountId: acc._id,
      accountHandle: acc.handle,
      loading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmState.accountId) return;
    setDeleteConfirmState((prev) => ({ ...prev, loading: true }));
    const res = await apiRequest(`/admin/p2p-accounts/${deleteConfirmState.accountId}`, 'DELETE');
    setDeleteConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));

    if (res.success) {
      showToast('P2P Account deleted');
      fetchAccounts();
    } else {
      showToast(res.error || 'Failed to delete account', 'error');
    }
  };

  const platformColors: Record<string, string> = {
    chime: 'border-emerald-500 text-emerald-400',
    venmo: 'border-blue-500 text-blue-400',
    cashapp: 'border-green-500 text-green-400',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast message={toastMsg.text} type={toastMsg.type} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">P2P Payment Accounts</h2>
          <p className="text-sm text-gray-400 mt-1">Configure handles & automation rules for Chime, Venmo, and Cash App</p>
        </div>

        <button
          onClick={() => {
            setSelectedAccount(null);
            setIsModalOpen(true);
          }}
          title="Add a new P2P payment account"
          className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-12 text-center text-gray-400">
          <LinkIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-200">No P2P Accounts Configured</h3>
          <p className="text-xs text-gray-400 mt-1">Add your first Chime, Venmo, or Cash App payment account to start receiving guest payments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            const colorClass = platformColors[acc.platform] || 'border-indigo-500 text-indigo-400';
            return (
              <div
                key={acc._id}
                className={`bg-[#111827] border-l-4 border-t border-r border-b border-[#1F2937] p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-all ${colorClass}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-300">
                      {acc.platform}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {acc.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xl font-extrabold text-white font-mono">{acc.handle}</div>
                  <div className="text-sm font-medium text-gray-300 mt-1">{acc.displayName}</div>

                  {acc.directPayUrl && (
                    <div className="text-xs text-indigo-400 mt-2 truncate font-mono">
                      🔗 {acc.directPayUrl}
                    </div>
                  )}

                  {acc.isAutoVerifyEnabled && (
                    <div className="mt-3 inline-block px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg">
                      ⚡ Auto Email Verification
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-5 border-t border-[#1F2937] mt-5">
                  <button
                    onClick={() => {
                      setSelectedAccount(acc);
                      setIsModalOpen(true);
                    }}
                    title="Edit this account"
                    className="cursor-pointer flex-1 flex items-center justify-center gap-1 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white active:scale-95 text-xs font-bold rounded-xl transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => promptDeleteAccount(acc)}
                    title="Delete this account"
                    className="cursor-pointer flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white active:scale-95 text-xs font-bold rounded-xl transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <P2PModal
        isOpen={isModalOpen}
        account={selectedAccount}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          fetchAccounts();
        }}
      />

      {/* Delete P2P Account UI Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        type="danger"
        title="Delete P2P Payment Account"
        message={`Are you sure you want to delete the P2P account "${deleteConfirmState.accountHandle}"? Guest payments will no longer route to this account.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        loading={deleteConfirmState.loading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
