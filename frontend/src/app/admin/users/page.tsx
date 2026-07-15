'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import Toast, { ToastMessage } from '@/components/Toast';
import { ApiClient } from '@/lib/api';

// SVG Icons
const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const PercentIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19"></line>
    <circle cx="6.5" cy="6.5" r="2.5"></circle>
    <circle cx="17.5" cy="17.5" r="2.5"></circle>
  </svg>
);

const SyncIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"></path>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnlockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

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
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
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

  const fetchCurrentAdmin = async () => {
    const res = await ApiClient.get<{ admin: any }>('/admin/me');
    if (res.success && res.data) {
      setCurrentAdmin(res.data.admin);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') || 'dark';
    setIsDarkMode(savedTheme === 'dark');
    fetchCurrentAdmin();
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [search]);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem('admin-theme', nextDark ? 'dark' : 'light');
    window.dispatchEvent(new Event('theme-change'));
  };

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

  const handleRenewExpiry = async (user: User) => {
    if (!confirm(`Extend expiration date for ${user.firstName} ${user.lastName || ''} by 1 year?`)) return;
    const res = await ApiClient.put(`/admin/users/${user._id}`, {
      createdAt: new Date().toISOString()
    });
    if (res.success) {
      addToast('Account expiration renewed successfully', 'success');
      fetchUsers(pagination.page);
    } else {
      addToast(res.error || 'Failed to renew expiration', 'error');
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
        <span className={`font-bold uppercase tracking-wider text-[11px] ${user.isFrozen ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
          {user.isFrozen ? 'FROZEN' : 'ACTIVE'}
        </span>
        <span className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{expStr}</span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDarkMode ? 'bg-[#000000] text-white' : 'bg-[#FFFFFF] text-black'
    }`}>
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              Create, edit, freeze, and adjust settings for platform user accounts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 text-sm ${
                isDarkMode ? 'text-zinc-500' : 'text-slate-400'
              }`}>
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-10 pr-4 py-2.5 w-64 border rounded-xl text-sm font-medium outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-zinc-950 border-zinc-900 text-white focus:border-primary'
                    : 'bg-slate-50 border-slate-200 text-black focus:border-primary'
                }`}
              />
            </div>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              className={`p-2.5 rounded-xl border cursor-pointer active:scale-95 transition-all ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-900 text-yellow-400 hover:bg-zinc-900'
                  : 'bg-slate-50 border-slate-200 text-indigo-600 hover:bg-slate-100'
              }`}
            >
              {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/25"
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
            <div className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
              isDarkMode
                ? 'bg-[#000000] border-zinc-900'
                : 'bg-[#FFFFFF] border-slate-200'
            }`}>
              <div className={`p-6 border-b ${isDarkMode ? 'border-zinc-900' : 'border-slate-200'}`}>
                <h3 className="font-bold text-lg">Admin & Staff Accounts</h3>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Manage administrative roles, support staff, and platform permissions
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[11px] font-bold uppercase tracking-wider border-b transition-colors duration-200 ${
                      isDarkMode
                        ? 'bg-zinc-950/40 text-zinc-500 border-zinc-900'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      <th className="py-4.5 px-6 w-80">Profile Name / Email</th>
                      <th className="py-4.5 px-6">Phone Number</th>
                      <th className="py-4.5 px-6">Status / Expiry</th>
                      <th className="py-4.5 px-6">System Role</th>
                      <th className="py-4.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-900' : 'divide-slate-200'}`}>
                    {admins.map((u) => {
                      const name = u.fullName || `${u.firstName} ${u.lastName || ''}`.trim();
                      const isMe = currentAdmin && currentAdmin.email === u.email;
                      return (
                        <tr key={u._id} className={`transition-colors duration-200 ${
                          isDarkMode ? 'hover:bg-zinc-950/50' : 'hover:bg-slate-50/50'
                        }`}>
                          <td className="py-4 px-6 w-80">
                            <div className="flex items-center gap-3">
                              <Avatar profileImage={u.profileImage} fullName={name} />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm">{name}</span>
                                  {u.userTag && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                      {u.userTag.startsWith('$') ? u.userTag.replace('$', '/') : u.userTag.startsWith('/') ? u.userTag : `/${u.userTag}`}
                                    </span>
                                  )}
                                  {u.isFrozen && (
                                    <span className="text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded uppercase">
                                      Frozen
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm font-medium">
                            {u.phoneNumber || '-'}
                          </td>
                          <td className="py-4 px-6 text-sm">
                            {getExpirationDateString(u)}
                          </td>
                          <td className="py-4 px-6">
                            {isMe ? (
                              <span className="inline-block px-3 py-1.5 text-xs font-bold bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                                SUPER ADMIN (YOU)
                              </span>
                            ) : (
                              <select
                                value={u.role || 'user'}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                className={`border text-xs font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer transition-colors ${
                                  isDarkMode
                                    ? 'bg-[#000000] border-zinc-800 text-white focus:border-primary'
                                    : 'bg-[#FFFFFF] border-slate-200 text-black focus:border-primary'
                                }`}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                              </select>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-3.5">
                              {/* Edit Details */}
                              <button
                                onClick={() => openEditModal(u)}
                                title="Edit Details"
                                className="text-[#38BDF8] hover:text-[#7DD3FC] cursor-pointer transition-colors p-1"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>

                              {/* Adjust Balance */}
                              <button
                                onClick={() => openBalanceModal(u)}
                                title="Adjust Balance"
                                className="text-[#F59E0B] hover:text-[#FBBF24] cursor-pointer transition-colors p-1"
                              >
                                <PercentIcon className="w-5 h-5" />
                              </button>

                              {/* Renew Account */}
                              {!isMe && u.role !== 'superadmin' && (
                                <button
                                  onClick={() => handleRenewExpiry(u)}
                                  title="Renew Account"
                                  className="text-[#10B981] hover:text-[#34D399] cursor-pointer transition-colors p-1"
                                >
                                  <SyncIcon className="w-5 h-5" />
                                </button>
                              )}

                              {/* Freeze / Unfreeze */}
                              {!isMe && u.role !== 'superadmin' && (
                                <button
                                  onClick={() => handleToggleFreeze(u._id, !u.isFrozen)}
                                  title={u.isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
                                  className={`cursor-pointer transition-colors p-1 ${
                                    u.isFrozen ? 'text-[#EF4444] hover:text-[#F87171]' : 'text-[#10B981] hover:text-[#34D399]'
                                  }`}
                                >
                                  {u.isFrozen ? <UnlockIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
                                </button>
                              )}

                              {/* Delete User */}
                              {!isMe && u.role !== 'superadmin' && (
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  title="Delete User"
                                  className="text-[#EF4444] hover:text-[#F87171] cursor-pointer transition-colors p-1"
                                >
                                  <TrashIcon className="w-5 h-5" />
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
            <div className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
              isDarkMode
                ? 'bg-[#000000] border-zinc-900'
                : 'bg-[#FFFFFF] border-slate-200'
            }`}>
              <div className={`p-6 border-b ${isDarkMode ? 'border-zinc-900' : 'border-slate-200'}`}>
                <h3 className="font-bold text-lg">Standard User Accounts (Players)</h3>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Manage game lobby players, customer records, and active account locks
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[11px] font-bold uppercase tracking-wider border-b transition-colors duration-200 ${
                      isDarkMode
                        ? 'bg-zinc-950/40 text-zinc-500 border-zinc-900'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      <th className="py-4.5 px-6 w-80">Profile Name / Email</th>
                      <th className="py-4.5 px-6">Phone Number</th>
                      <th className="py-4.5 px-6">Date Registered</th>
                      <th className="py-4.5 px-6">System Role</th>
                      <th className="py-4.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-900' : 'divide-slate-200'}`}>
                    {players.map((u) => {
                      const name = u.fullName || `${u.firstName} ${u.lastName || ''}`.trim();
                      return (
                        <tr key={u._id} className={`transition-colors duration-200 ${
                          isDarkMode ? 'hover:bg-zinc-950/50' : 'hover:bg-slate-50/50'
                        }`}>
                          <td className="py-4 px-6 w-80">
                            <div className="flex items-center gap-3">
                              <Avatar profileImage={u.profileImage} fullName={name} />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm">{name}</span>
                                  {u.userTag && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                      {u.userTag.startsWith('$') ? u.userTag.replace('$', '/') : u.userTag.startsWith('/') ? u.userTag : `/${u.userTag}`}
                                    </span>
                                  )}
                                  {u.isFrozen && (
                                    <span className="text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded uppercase">
                                      Frozen
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm font-medium">
                            {u.phoneNumber || '-'}
                          </td>
                          <td className={`py-4 px-6 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="py-4 px-6">
                            <select
                              value={u.role || 'user'}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className={`border text-xs font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer transition-colors ${
                                isDarkMode
                                  ? 'bg-[#000000] border-zinc-800 text-white focus:border-primary'
                                  : 'bg-[#FFFFFF] border-slate-200 text-black focus:border-primary'
                              }`}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Super Admin</option>
                            </select>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-3.5">
                              {/* Edit Details */}
                              <button
                                onClick={() => openEditModal(u)}
                                title="Edit Details"
                                className="text-[#38BDF8] hover:text-[#7DD3FC] cursor-pointer transition-colors p-1"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>

                              {/* Adjust Balance */}
                              <button
                                onClick={() => openBalanceModal(u)}
                                title="Adjust Balance"
                                className="text-[#F59E0B] hover:text-[#FBBF24] cursor-pointer transition-colors p-1"
                              >
                                <PercentIcon className="w-5 h-5" />
                              </button>

                              {/* Freeze / Unfreeze */}
                              <button
                                onClick={() => handleToggleFreeze(u._id, !u.isFrozen)}
                                title={u.isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
                                className={`cursor-pointer transition-colors p-1 ${
                                  u.isFrozen ? 'text-[#EF4444] hover:text-[#F87171]' : 'text-[#10B981] hover:text-[#34D399]'
                                }`}
                              >
                                {u.isFrozen ? <UnlockIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                title="Delete User"
                                className="text-[#EF4444] hover:text-[#F87171] cursor-pointer transition-colors p-1"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {players.length === 0 && (
                      <tr>
                        <td colSpan={5} className={`py-8 text-center text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                          No players match your search filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className={`p-6 border-t flex justify-center gap-2 ${isDarkMode ? 'border-zinc-900' : 'border-slate-200'}`}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => fetchUsers(p)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        p === pagination.page
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : isDarkMode
                            ? 'bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white'
                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-black'
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-150">
          <div className={`border rounded-2xl w-full max-w-[480px] p-6 shadow-2xl animate-in zoom-in-95 duration-150 transition-colors duration-200 ${
            isDarkMode
              ? 'bg-zinc-950 border-zinc-900 text-white'
              : 'bg-white border-slate-200 text-black'
          }`}>
            <div className={`flex justify-between items-center mb-6 pb-4 border-b ${isDarkMode ? 'border-zinc-900' : 'border-slate-200'}`}>
              <h3 className="font-extrabold text-lg">
                {selectedUser ? 'Edit User Details' : 'Create New User'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className={`text-xl font-bold cursor-pointer hover:opacity-70 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#000000] border-zinc-800 text-white focus:border-primary'
                        : 'bg-[#FFFFFF] border-slate-200 text-black focus:border-primary'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#000000] border-zinc-800 text-white focus:border-primary'
                        : 'bg-[#FFFFFF] border-slate-200 text-black focus:border-primary'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  User Tag
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    @
                  </span>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    required
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#000000] border-zinc-800 text-white focus:border-primary'
                        : 'bg-[#FFFFFF] border-slate-200 text-black focus:border-primary'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                    isDarkMode
                      ? 'bg-[#000000] border-zinc-800 text-white focus:border-primary'
                      : 'bg-[#FFFFFF] border-slate-200 text-black focus:border-primary'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  required
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                    isDarkMode
                      ? 'bg-[#000000] border-zinc-800 text-white focus:border-primary'
                      : 'bg-[#FFFFFF] border-slate-200 text-black focus:border-primary'
                  }`}
                />
              </div>

              {!selectedUser && (
                <div className="space-y-1">
                  <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#000000] border-zinc-800 text-white focus:border-primary'
                        : 'bg-[#FFFFFF] border-slate-200 text-black focus:border-primary'
                    }`}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Wallet Balance ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formBalance}
                  onChange={(e) => setFormBalance(e.target.value)}
                  required
                  disabled={!!selectedUser}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors disabled:opacity-50 ${
                    isDarkMode
                      ? 'bg-[#000000] border-zinc-800 text-white focus:border-primary'
                      : 'bg-[#FFFFFF] border-slate-200 text-black focus:border-primary'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${isDarkMode ? 'border-zinc-900' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className={`px-5 py-2.5 border rounded-xl text-sm font-bold cursor-pointer transition-colors ${
                    isDarkMode
                      ? 'bg-zinc-950 border-zinc-900 text-white hover:bg-zinc-900'
                      : 'bg-slate-50 border-slate-200 text-black hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl cursor-pointer active:scale-95 transition-all"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-150">
          <div className={`border rounded-2xl w-full max-w-[420px] p-6 shadow-2xl animate-in zoom-in-95 duration-150 transition-colors duration-200 ${
            isDarkMode
              ? 'bg-zinc-950 border-zinc-900 text-white'
              : 'bg-white border-slate-200 text-black'
          }`}>
            <div className={`flex justify-between items-center mb-6 pb-4 border-b ${isDarkMode ? 'border-zinc-900' : 'border-slate-200'}`}>
              <h3 className="font-extrabold text-lg">Adjust Cash Balance</h3>
              <button
                onClick={() => setShowBalanceModal(false)}
                className={`text-xl font-bold cursor-pointer hover:opacity-70 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}
              >
                &times;
              </button>
            </div>

            <div className={`mb-5 border rounded-xl p-4 text-center transition-colors ${
              isDarkMode ? 'bg-[#000000] border-zinc-900' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-xs font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Current Balance</span>
              <div className="text-2xl font-extrabold mt-1">
                ${Number(selectedUser.walletBalance).toFixed(2)}
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Adjustment Action
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all border ${
                      adjustType === 'add'
                        ? 'bg-success/15 border-success text-success'
                        : isDarkMode
                          ? 'bg-[#000000] border-zinc-800 text-zinc-400 hover:text-white'
                          : 'bg-[#FFFFFF] border-slate-200 text-slate-600 hover:text-black'
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
                        : isDarkMode
                          ? 'bg-[#000000] border-zinc-800 text-zinc-400 hover:text-white'
                          : 'bg-[#FFFFFF] border-slate-200 text-slate-600 hover:text-black'
                    }`}
                  >
                    Deduct Cash
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
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
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                    isDarkMode
                      ? 'bg-[#000000] border-zinc-800 text-white focus:border-primary'
                      : 'bg-[#FFFFFF] border-slate-200 text-black focus:border-primary'
                  }`}
                  autoFocus
                />
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${isDarkMode ? 'border-zinc-900' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className={`px-5 py-2.5 border rounded-xl text-sm font-bold cursor-pointer transition-colors ${
                    isDarkMode
                      ? 'bg-zinc-950 border-zinc-900 text-white hover:bg-zinc-900'
                      : 'bg-slate-50 border-slate-200 text-black hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl cursor-pointer active:scale-95 transition-all"
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
