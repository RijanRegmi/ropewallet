'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { 
  Bell, 
  Send, 
  Trash2, 
  Users, 
  UserCheck, 
  Info, 
  AlertCircle, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  ShieldAlert, 
  Filter, 
  Building2, 
  X, 
  Check 
} from 'lucide-react';

interface NoticeItem {
  _id: string;
  title: string;
  content: string;
  category: 'info' | 'alert' | 'urgent' | 'promo';
  targetType: 'all' | 'customers' | 'hosts' | 'specific';
  targetUsers?: Array<{ _id: string; fullName?: string; userTag?: string; email?: string; role?: string }>;
  createdAt: string;
}

interface UserOption {
  _id: string;
  fullName?: string;
  userTag: string;
  email: string;
  role: string;
}

export default function NoticeAdminPage() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'info' | 'alert' | 'urgent' | 'promo'>('info');
  const [targetType, setTargetType] = useState<'all' | 'customers' | 'hosts' | 'specific'>('all');
  
  // Specific Users Picker State
  const [selectedUserObjects, setSelectedUserObjects] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [userList, setUserList] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' as 'success' | 'error' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    fetchNotices();
    fetchUsers('');
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const res = await apiRequest<NoticeItem[]>('/admin/notices');
    if (res.success && res.data) setNotices(res.data);
    setLoading(false);
  };

  const fetchUsers = async (search: string) => {
    setLoadingUsers(true);
    const res = await apiRequest<{ users: UserOption[]; admins?: UserOption[] }>(`/admin/users?limit=100&search=${encodeURIComponent(search)}`);
    if (res.success && res.data) {
      const all = [...(res.data.users || []), ...(res.data.admins || [])];
      setUserList(all);
    }
    setLoadingUsers(false);
  };

  const handleSearchChange = (val: string) => {
    setUserSearch(val);
    fetchUsers(val);
  };

  const toggleSelectUser = (u: UserOption) => {
    const exists = selectedUserObjects.some((item) => item._id === u._id);
    if (exists) {
      setSelectedUserObjects((prev) => prev.filter((item) => item._id !== u._id));
    } else {
      setSelectedUserObjects((prev) => [...prev, u]);
    }
  };

  const removeUser = (userId: string) => {
    setSelectedUserObjects((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleSubmitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setToastMsg({ text: 'Please fill in title and message content', type: 'error' });
      return;
    }
    if (targetType === 'specific' && selectedUserObjects.length === 0) {
      setToastMsg({ text: 'Please select at least one target user', type: 'error' });
      return;
    }

    setSubmitting(true);
    const selectedUserIds = selectedUserObjects.map((u) => u._id);

    const res = await apiRequest<any>('/admin/notices', 'POST', {
      title,
      content,
      category,
      targetType,
      targetUserIds: selectedUserIds,
    });
    setSubmitting(false);

    if (res.success) {
      setToastMsg({ text: 'Push Notice broadcasted successfully!', type: 'success' });
      setTitle('');
      setContent('');
      setCategory('info');
      setTargetType('all');
      setSelectedUserObjects([]);
      fetchNotices();
    } else {
      setToastMsg({ text: res.error || 'Failed to publish notice', type: 'error' });
    }
  };

  const handleDeleteNotice = async () => {
    if (!deleteModal.id) return;
    const res = await apiRequest(`/admin/notices/${deleteModal.id}`, 'DELETE');
    setDeleteModal({ isOpen: false, id: null });
    if (res.success) {
      setToastMsg({ text: 'Notice deleted', type: 'success' });
      fetchNotices();
    } else {
      setToastMsg({ text: res.error || 'Failed to delete notice', type: 'error' });
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'urgent':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle className="w-3.5 h-3.5" /> Urgent</span>;
      case 'alert':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><ShieldAlert className="w-3.5 h-3.5" /> Alert</span>;
      case 'promo':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20"><Sparkles className="w-3.5 h-3.5" /> Promo</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Info className="w-3.5 h-3.5" /> Info</span>;
    }
  };

  const getTargetBadge = (type: string, users?: any[]) => {
    switch (type) {
      case 'customers':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">👥 Customers Only</span>;
      case 'hosts':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">🏢 Hosts & Admins Only</span>;
      case 'specific':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">🎯 {users?.length || 0} Targeted User(s)</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20">🌐 All Users (Broadcast)</span>;
    }
  };

  const filteredUserList = userList.filter((u) => {
    if (roleFilter === 'customers' && (u.role === 'host' || u.role === 'admin' || u.role === 'superadmin')) return false;
    if (roleFilter === 'hosts' && u.role !== 'host' && u.role !== 'admin' && u.role !== 'superadmin') return false;
    return true;
  });

  return (
    <div className="space-y-6 w-full min-h-screen">
      {toastMsg.text && (
        <Toast message={toastMsg.text} type={toastMsg.type} onClose={() => setToastMsg({ text: '', type: 'success' })} />
      )}

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-7 h-7 text-[#5C7C89]" />
            Notice & Push Notification Broadcast Center
          </h1>
          <p className="text-sm text-gray-400">
            Send real-time high-priority push notifications directly to user status bars and in-app notice centers.
          </p>
        </div>
      </div>

      {/* Full Page 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* Left Column: Create Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-6 self-start">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
            <Send className="w-5 h-5 text-indigo-400" />
            Create & Broadcast Push Notice
          </h2>

          <form onSubmit={handleSubmitNotice} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Notice Title
              </label>
              <input
                type="text"
                placeholder="e.g. System Upgrade & Scheduled Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm bg-slate-800/80 border border-slate-700/80 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Notification Type / Color Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-xl px-4 py-3 text-sm bg-slate-800/80 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="info">General Info (Blue)</option>
                <option value="alert">Security Alert (Amber)</option>
                <option value="urgent">Urgent System Notice (Red)</option>
                <option value="promo">Promotional / Special (Purple)</option>
              </select>
            </div>

            {/* Target Audience Tabs */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Target Audience Filter
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    targetType === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-800/60 text-gray-400 border-slate-700/60 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> All Users
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('customers')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    targetType === 'customers'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-800/60 text-gray-400 border-slate-700/60 hover:text-white'
                  }`}
                >
                  👥 Customers
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('hosts')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    targetType === 'hosts'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                      : 'bg-slate-800/60 text-gray-400 border-slate-700/60 hover:text-white'
                  }`}
                >
                  🏢 Hosts Only
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('specific')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    targetType === 'specific'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-slate-800/60 text-gray-400 border-slate-700/60 hover:text-white'
                  }`}
                >
                  🎯 Specific Users
                </button>
              </div>
            </div>

            {/* Specific Users Multiselect Dropdown + Search */}
            {targetType === 'specific' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-300">
                    Select Target Users ({selectedUserObjects.length} selected)
                  </span>
                  {selectedUserObjects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedUserObjects([])}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Selected User Pills */}
                {selectedUserObjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    {selectedUserObjects.map((u) => (
                      <span
                        key={u._id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                      >
                        {u.fullName || u.userTag} ({u.role || 'user'})
                        <X
                          className="w-3 h-3 cursor-pointer text-indigo-400 hover:text-white"
                          onClick={() => removeUser(u._id)}
                        />
                      </span>
                    ))}
                  </div>
                )}

                {/* Filter + Search Bar for User Selection */}
                <div className="space-y-2 relative">
                  <div className="flex items-center gap-2">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-2.5 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="customers">Customers Only</option>
                      <option value="hosts">Hosts Only</option>
                    </select>

                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search user tag or email..."
                        value={userSearch}
                        onFocus={() => setIsDropdownOpen(true)}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      <div className="p-2 border-b border-slate-700/60 flex justify-between items-center text-xs text-gray-400">
                        <span>Click to toggle recipient selection</span>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          Done
                        </button>
                      </div>
                      {loadingUsers ? (
                        <div className="p-4 text-center text-xs text-gray-400">Searching users...</div>
                      ) : filteredUserList.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400">No users found.</div>
                      ) : (
                        filteredUserList.map((u) => {
                          const isSelected = selectedUserObjects.some((item) => item._id === u._id);
                          return (
                            <div
                              key={u._id}
                              onClick={() => toggleSelectUser(u)}
                              className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-700/60 transition-colors ${
                                isSelected ? 'bg-indigo-600/20 text-indigo-200' : 'text-gray-200'
                              }`}
                            >
                              <div>
                                <p className="font-semibold text-white">{u.fullName}</p>
                                <p className="text-[11px] text-gray-400">{u.userTag} • {u.email}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                u.role === 'host' || u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-gray-300'
                              }`}>
                                {isSelected ? <Check className="w-3 h-3 inline text-emerald-400" /> : u.role}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message Content */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Push Message Body
              </label>
              <textarea
                rows={4}
                placeholder="Write the push notification message body here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm bg-slate-800/80 border border-slate-700/80 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Broadcasting Notice...' : 'Broadcast Push Notice'}
            </button>
          </form>
        </div>

        {/* Right Column: Feed of Posted Notices (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              Published Notice Stream ({notices.length})
            </h2>
            <button
              onClick={fetchNotices}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              Refresh Feed
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400">Loading published notice history...</div>
          ) : notices.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-3">
              <Bell className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-base font-semibold">No notices published yet.</p>
              <p className="text-xs text-gray-500">Create your first broadcast using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-2">
              {notices.map((notice) => (
                <div
                  key={notice._id}
                  className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCategoryBadge(notice.category)}
                        {getTargetBadge(notice.targetType, notice.targetUsers)}
                        <span className="text-xs text-gray-400">
                          {new Date(notice.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{notice.title}</h3>
                    </div>

                    <button
                      onClick={() => setDeleteModal({ isOpen: true, id: notice._id })}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{notice.content}</p>

                  {notice.targetType === 'specific' && notice.targetUsers && notice.targetUsers.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/40">
                      <span className="text-xs font-semibold text-gray-400 block mb-1">Targeted Recipients:</span>
                      <div className="flex flex-wrap gap-1">
                        {notice.targetUsers.map((u) => (
                          <span key={u._id} className="text-[11px] px-2 py-0.5 rounded bg-slate-700/80 text-gray-300">
                            {u.fullName || u.userTag} ({u.role || 'user'})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Notice Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        type="danger"
        title="Delete Notice"
        message="Are you sure you want to delete this notice broadcast? It will be removed from all user feeds."
        confirmText="Delete Notice"
        cancelText="Cancel"
        onConfirm={handleDeleteNotice}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
      />
    </div>
  );
}
