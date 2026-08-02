'use client';

import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { UserModel, UserListResponse } from '@/models/user.model';
import UserModal from '@/components/UserModal';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { Search, Plus, Edit, Lock, Unlock, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal & Toast states
  const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' as 'success' | 'error' });

  // Confirmation Modal state (Replaces native window.confirm)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
    loading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    type: 'danger',
    onConfirm: () => {},
    loading: false,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchUsers(page, searchQuery);
  }, [page]);

  const filterList = (list: UserModel[], query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return list;
    return list.filter((u) => {
      const name = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
      const email = (u.email || '').toLowerCase();
      const tag = (u.userTag || '').toLowerCase();
      return name.includes(q) || email.includes(q) || tag.includes(q);
    });
  };

  const fetchUsers = async (p: number, q: string) => {
    setLoading(true);
    const res = await apiRequest<UserListResponse['data']>(`/admin/users?page=${p}&limit=15&search=${encodeURIComponent(q)}`);
    setLoading(false);

    if (res.success && res.data) {
      const all = [...(res.data.admins || []), ...(res.data.users || [])];
      setUsers(all);
      setFilteredUsers(filterList(all, q));
      setTotalPages(res.data.pagination?.totalPages || 1);
    }
  };

  // Instant real-time local search on keyup + debounced API search
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setFilteredUsers(filterList(users, val));

    // Debounced API request after 250ms
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchUsers(1, val);
    }, 250);
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 4000);
  };

  // UI Confirmation trigger for Freeze / Unfreeze
  const promptToggleFreeze = (u: UserModel, freeze: boolean) => {
    const action = freeze ? 'freeze' : 'unfreeze';
    setConfirmState({
      isOpen: true,
      title: `${freeze ? 'Freeze' : 'Unfreeze'} User Account`,
      message: `Are you sure you want to ${action} the account for "${u.fullName || u.email}"? ${
        freeze ? 'The user will be blocked from accessing their account and submitting transactions.' : 'Access will be restored immediately.'
      }`,
      confirmText: freeze ? 'Freeze Account' : 'Unfreeze Account',
      type: freeze ? 'warning' : 'info' as any,
      loading: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        const res = await apiRequest(`/admin/users/${u._id}/${action}`, 'PUT');
        setConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));
        if (res.success) {
          showToast(`Account ${action}d successfully`);
          fetchUsers(page, searchQuery);
        } else {
          showToast(res.error || 'Operation failed', 'error');
        }
      },
    });
  };

  // UI Confirmation trigger for User Deletion
  const promptDeleteUser = (u: UserModel) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete "${u.fullName || u.email}" (${u.userTag || 'Customer'})? All associated data will be permanently removed. This action CANNOT be undone.`,
      confirmText: 'Permanently Delete',
      type: 'danger',
      loading: false,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, loading: true }));
        const res = await apiRequest(`/admin/users/${u._id}`, 'DELETE');
        setConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));
        if (res.success) {
          showToast('User deleted successfully');
          fetchUsers(page, searchQuery);
        } else {
          showToast(res.error || 'Failed to delete user', 'error');
        }
      },
    });
  };

  const handleRoleChange = async (id: string, role: string) => {
    const res = await apiRequest(`/admin/users/${id}/role`, 'PUT', { role });
    if (res.success) {
      showToast('User role updated');
      fetchUsers(page, searchQuery);
    } else {
      showToast(res.error || 'Failed to update role', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast message={toastMsg.text} type={toastMsg.type} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-sm text-gray-400 mt-1">Real-time filtering, creation, role editing, and account status</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or $tag..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1F2937] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            onClick={() => {
              setSelectedUser(null);
              setIsModalOpen(true);
            }}
            title="Create a new user account"
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1F2937]/50 text-xs uppercase text-gray-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Tag</th>
                <th className="px-6 py-3.5">Balance</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Joined</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-800/30 transition-all">
                    <td className="px-6 py-4 font-bold text-white">
                      {u.fullName || `${u.firstName || ''} ${u.lastName || ''}`}
                    </td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 font-mono text-indigo-400 font-medium">
                      {u.userTag ? (u.userTag.startsWith('$') ? u.userTag : `$${u.userTag}`) : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      ${Number(u.walletBalance || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                          u.isFrozen
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {u.isFrozen ? 'Frozen' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={(u.role === 'user' || u.role === 'customer') ? 'customer' : (u.role === 'admin' || u.role === 'host') ? 'host' : 'superadmin'}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="customer">Customer</option>
                        <option value="host">Host</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsModalOpen(true);
                          }}
                          className="cursor-pointer p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white active:scale-95 transition-all"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => promptToggleFreeze(u, !u.isFrozen)}
                          className={`cursor-pointer p-2 rounded-lg active:scale-95 transition-all ${
                            u.isFrozen
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                              : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white'
                          }`}
                          title={u.isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
                        >
                          {u.isFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => promptDeleteUser(u)}
                          className="cursor-pointer p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white active:scale-95 transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-[#1F2937]">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                  p === page
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <UserModal
        isOpen={isModalOpen}
        user={selectedUser}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          fetchUsers(page, searchQuery);
        }}
      />

      {/* Modern UI Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        type={confirmState.type}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
