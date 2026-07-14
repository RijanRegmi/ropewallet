'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import Toast, { ToastMessage } from '@/components/Toast';
import { ApiClient } from '@/lib/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  userTag: string;
  phoneNumber: string;
  walletBalance: number;
  isFrozen: boolean;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: string;
  profileImage?: string;
}

export default function UsersManagement() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const router = useRouter();

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  
  // Selected user for editing/balance adjusting
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form fields
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formBalance, setFormBalance] = useState('');
  
  // Balance adjustment fields
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    const res = await ApiClient.get<{ admins: User[]; users: User[]; pagination: { page: number; totalPages: number } }>(
      `/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}`
    );
    if (res.success && res.data) {
      setAdmins(res.data.admins);
      setPlayers(res.data.users);
      setPagination({
        page: res.data.pagination.page,
        totalPages: res.data.pagination.totalPages,
      });
    } else {
      addToast(res.error || 'Failed to load users list', 'error');
      if (res.error?.includes('session') || res.error?.includes('auth')) {
        router.push('/');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers(1);
  }, [search]);

  // Open modal for creating new user
  const openCreateModal = () => {
    setSelectedUser(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormTag('');
    setFormPhone('');
    setFormPassword('');
    setFormBalance('0');
    setShowUserModal(true);
  };

  // Open modal for editing user
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormFirstName(user.firstName || '');
    setFormLastName(user.lastName || '');
    setFormEmail(user.email || '');
    setFormTag(user.userTag || '');
    setFormPhone(user.phoneNumber || '');
    setFormPassword('');
    setFormBalance(user.walletBalance.toString());
    setShowUserModal(true);
  };

  // Open modal for balance adjustments
  const openBalanceModal = (user: User) => {
    setSelectedUser(user);
    setAdjustAmount('');
    setAdjustType('add');
    setShowBalanceModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = {
      firstName: formFirstName,
      lastName: formLastName,
      email: formEmail,
      userTag: formTag,
      phoneNumber: formPhone,
    };

    if (selectedUser) {
      body.walletBalance = parseFloat(formBalance) || 0;
      const res = await ApiClient.put(`/admin/users/${selectedUser._id}`, body);
      if (res.success) {
        addToast('User updated successfully', 'success');
        setShowUserModal(false);
        fetchUsers(pagination.page);
      } else {
        addToast(res.error || 'Failed to update user', 'error');
      }
    } else {
      body.password = formPassword;
      body.walletBalance = parseFloat(formBalance) || 0;
      const res = await ApiClient.post('/admin/users', body);
      if (res.success) {
        addToast('User created successfully', 'success');
        setShowUserModal(false);
        fetchUsers(1);
      } else {
        addToast(res.error || 'Failed to create user', 'error');
      }
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast('Please enter a valid positive number', 'error');
      return;
    }

    const currentBalance = selectedUser.walletBalance;
    const delta = adjustType === 'add' ? amount : -amount;
    const nextBalance = Math.max(0, currentBalance + delta);

    // Call update API
    const res = await ApiClient.put(`/admin/users/${selectedUser._id}`, {
      walletBalance: nextBalance,
    });

    if (res.success) {
      addToast(`Wallet adjusted by $${delta.toFixed(2)}. New balance: $${nextBalance.toFixed(2)}`, 'success');
      setShowBalanceModal(false);
      fetchUsers(pagination.page);
    } else {
      addToast(res.error || 'Failed to adjust balance', 'error');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change system role of this account to ${newRole}?`)) {
      fetchUsers(pagination.page);
      return;
    }
    const res = await ApiClient.put(`/admin/users/${userId}/role`, { role: newRole });
    if (res.success) {
      addToast(res.message || 'System role updated', 'success');
      fetchUsers(pagination.page);
    } else {
      addToast(res.error || 'Failed to change role', 'error');
    }
  };

  const handleToggleFreeze = async (userId: string, isFrozen: boolean) => {
    const url = isFrozen ? `/admin/users/${userId}/freeze` : `/admin/users/${userId}/unfreeze`;
    const res = await ApiClient.put<any>(url);
    if (res.success) {
      addToast(res.message || 'Account status updated', 'success');
      fetchUsers(pagination.page);
    } else {
      addToast(res.error || 'Failed to freeze/unfreeze user', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this account? This action is permanent.')) return;
    const res = await ApiClient.delete(`/admin/users/${userId}`);
    if (res.success) {
      addToast('User account deleted', 'success');
      fetchUsers(pagination.page);
    } else {
      addToast(res.error || 'Failed to delete user', 'error');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const getExpirationDateString = (user: User) => {
    if (user.role === 'superadmin') return 'N/A (Super Admin)';
    
    // Calculate 1 year from creation date
    const d = new Date(user.createdAt);
    d.setFullYear(d.getFullYear() + 1);
    
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const expStr = `Expires: ${months[d.getMonth()]}/${d.getDate()}/${d.getFullYear()}`;
    
    return (
      <div className="flex flex-col text-xs mt-1">
        <span className={`${user.isFrozen ? 'text-danger font-bold' : 'text-success font-semibold'}`}>
          {user.isFrozen ? 'FROZEN' : 'ACTIVE'}
        </span>
        <span className="text-dark-text-secondary text-[11px] mt-0.5">{expStr}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-dark-text">User Management</h2>
            <p className="text-sm text-dark-text-secondary mt-1">
              Create, edit, freeze, and adjust settings for platform user accounts
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-dark-text-secondary text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-64 bg-dark-surface border border-dark-border rounded-xl text-sm font-medium outline-none focus:border-primary transition-colors text-dark-text"
              />
            </div>
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer"
            >
              + New User
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2" />
          </div>
        )}

        {!loading && (
          <div className="space-y-10">
            {/* Table 1: Admins & Staff Accounts */}
            <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
              <div className="p-6 border-b border-dark-border">
                <h3 className="font-bold text-lg text-dark-text">Admin & Staff Accounts</h3>
                <p className="text-xs text-dark-text-secondary mt-1">
                  Manage administrative roles, support staff, and platform permissions
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-surface-2/40 text-[11px] font-bold text-dark-text-secondary uppercase tracking-wider border-b border-dark-border">
                      <th className="py-4.5 px-6 w-80">Profile Name / Email</th>
                      <th className="py-4.5 px-6">Phone Number</th>
                      <th className="py-4.5 px-6">Status / Expiry</th>
                      <th className="py-4.5 px-6">System Role</th>
                      <th className="py-4.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {admins.map((u) => {
                      const name = u.fullName || `${u.firstName} ${u.lastName || ''}`.trim();
                      return (
                        <tr key={u._id} className="hover:bg-primary/2 transition-colors">
                          <td className="py-4 px-6 w-80">
                            <div className="flex items-center gap-3">
                              <Avatar profileImage={u.profileImage} fullName={name} />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-dark-text text-sm">{name}</span>
                                  <span className="text-[10px] font-bold bg-primary/10 text-primary-hover px-2 py-0.5 rounded-lg border border-primary/20">
                                    @{u.userTag}
                                  </span>
                                </div>
                                <span className="text-xs text-dark-text-secondary mt-1">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-dark-text font-medium">
                            {u.phoneNumber || '-'}
                          </td>
                          <td className="py-4 px-6 text-sm">
                            {getExpirationDateString(u)}
                          </td>
                          <td className="py-4 px-6">
                            {u.role === 'superadmin' ? (
                              <span className="inline-block px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary-hover rounded-xl border border-primary/25">
                                SUPER ADMIN (YOU)
                              </span>
                            ) : (
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                className="bg-dark-bg border border-dark-border text-dark-text px-3 py-1.5 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-primary"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                              </select>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit details */}
                              <button
                                onClick={() => openEditModal(u)}
                                title="Edit Details"
                                className="w-8 h-8 rounded-lg border border-dark-border bg-dark-bg flex items-center justify-center hover:bg-dark-surface-2 hover:border-primary/40 cursor-pointer"
                              >
                                ✏️
                              </button>

                              {/* Adjust balance */}
                              <button
                                onClick={() => openBalanceModal(u)}
                                title="Adjust Balance"
                                className="w-8 h-8 rounded-lg border border-dark-border bg-dark-bg flex items-center justify-center hover:bg-dark-surface-2 hover:border-warning/40 text-warning cursor-pointer font-bold text-sm"
                              >
                                %
                              </button>

                              {/* Delete account */}
                              {u.role !== 'superadmin' && (
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  title="Delete User"
                                  className="w-8 h-8 rounded-lg border border-dark-border bg-dark-bg flex items-center justify-center hover:bg-danger/10 hover:border-danger/40 text-danger cursor-pointer text-sm"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Standard User Accounts (Players) */}
            <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
              <div className="p-6 border-b border-dark-border">
                <h3 className="font-bold text-lg text-dark-text">Standard User Accounts (Players)</h3>
                <p className="text-xs text-dark-text-secondary mt-1">
                  Manage game lobby players, customer records, and active account locks
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-surface-2/40 text-[11px] font-bold text-dark-text-secondary uppercase tracking-wider border-b border-dark-border">
                      <th className="py-4.5 px-6 w-80">Profile Name / Email</th>
                      <th className="py-4.5 px-6">Phone Number</th>
                      <th className="py-4.5 px-6">Date Registered</th>
                      <th className="py-4.5 px-6">System Role</th>
                      <th className="py-4.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {players.map((u) => {
                      const name = u.fullName || `${u.firstName} ${u.lastName || ''}`.trim();
                      return (
                        <tr key={u._id} className="hover:bg-primary/2 transition-colors">
                          <td className="py-4 px-6 w-80">
                            <div className="flex items-center gap-3">
                              <Avatar profileImage={u.profileImage} fullName={name} />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-dark-text text-sm">{name}</span>
                                  {u.isFrozen && (
                                    <span className="text-[9px] font-bold bg-danger/10 text-danger border border-danger/25 px-1.5 py-0.5 rounded uppercase">
                                      Frozen
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-dark-text-secondary mt-1">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-dark-text font-medium">
                            {u.phoneNumber || '-'}
                          </td>
                          <td className="py-4 px-6 text-sm text-dark-text-secondary">
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="py-4 px-6">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="bg-dark-bg border border-dark-border text-dark-text px-3 py-1.5 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-primary"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Super Admin</option>
                            </select>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit details */}
                              <button
                                onClick={() => openEditModal(u)}
                                title="Edit Details"
                                className="w-8 h-8 rounded-lg border border-dark-border bg-dark-bg flex items-center justify-center hover:bg-dark-surface-2 hover:border-primary/40 cursor-pointer"
                              >
                                ✏️
                              </button>

                              {/* Adjust balance */}
                              <button
                                onClick={() => openBalanceModal(u)}
                                title="Adjust Balance"
                                className="w-8 h-8 rounded-lg border border-dark-border bg-dark-bg flex items-center justify-center hover:bg-dark-surface-2 hover:border-warning/40 text-warning cursor-pointer font-bold text-sm"
                              >
                                %
                              </button>

                              {/* Freeze / Unfreeze */}
                              <button
                                onClick={() => handleToggleFreeze(u._id, !u.isFrozen)}
                                title={u.isFrozen ? 'Unfreeze' : 'Freeze'}
                                className={`w-8 h-8 rounded-lg border border-dark-border bg-dark-bg flex items-center justify-center cursor-pointer text-sm ${
                                  u.isFrozen
                                    ? 'hover:bg-success/10 hover:border-success/40 text-success'
                                    : 'hover:bg-warning/10 hover:border-warning/40 text-warning'
                                }`}
                              >
                                {u.isFrozen ? '🔓' : '🔒'}
                              </button>

                              {/* Delete account */}
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                title="Delete User"
                                className="w-8 h-8 rounded-lg border border-dark-border bg-dark-bg flex items-center justify-center hover:bg-danger/10 hover:border-danger/40 text-danger cursor-pointer text-sm"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {players.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-dark-text-secondary text-sm">
                          No players match your search filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-6 border-t border-dark-border flex justify-center gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => fetchUsers(p)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        p === pagination.page
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-dark-bg border border-dark-border text-dark-text-secondary hover:text-dark-text'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Create/Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-[480px] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-dark-border">
              <h3 className="font-extrabold text-lg text-dark-text">
                {selectedUser ? 'Edit User Details' : 'Create New User'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-dark-text-secondary hover:text-dark-text text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-dark-text-secondary uppercase">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-dark-text-secondary uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-text-secondary uppercase">
                  User Tag
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-text-secondary text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-text-secondary uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-text-secondary uppercase">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary"
                />
              </div>

              {!selectedUser && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-dark-text-secondary uppercase">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-text-secondary uppercase">
                  Wallet Balance ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formBalance}
                  onChange={(e) => setFormBalance(e.target.value)}
                  required
                  disabled={!!selectedUser} // edit balance using standalone adjust balance modal
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-5 py-2.5 bg-dark-bg border border-dark-border hover:bg-dark-surface-2 text-dark-text text-sm font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl cursor-pointer"
                >
                  {selectedUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {showBalanceModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-[420px] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-dark-border">
              <h3 className="font-extrabold text-lg text-dark-text">Adjust Cash Balance</h3>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="text-dark-text-secondary hover:text-dark-text text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="mb-5 bg-dark-bg border border-dark-border rounded-xl p-4 text-center">
              <span className="text-xs font-bold text-dark-text-secondary uppercase">Current Balance</span>
              <div className="text-2xl font-extrabold text-dark-text mt-1">
                ${Number(selectedUser.walletBalance).toFixed(2)}
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-dark-text-secondary uppercase">
                  Adjustment Action
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all border ${
                      adjustType === 'add'
                        ? 'bg-success/15 border-success text-success'
                        : 'bg-dark-bg border-dark-border text-dark-text-secondary hover:text-dark-text'
                    }`}
                  >
                    Add Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('deduct')}
                    className={`py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all border ${
                      adjustType === 'deduct'
                        ? 'bg-danger/15 border-danger text-danger'
                        : 'bg-dark-bg border-dark-border text-dark-text-secondary hover:text-dark-text'
                    }`}
                  >
                    Deduct Cash
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-text-secondary uppercase">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="px-5 py-2.5 bg-dark-bg border border-dark-border hover:bg-dark-surface-2 text-dark-text text-sm font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Wrapper */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </div>
  );
}
