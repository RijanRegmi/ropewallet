'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { Bell, Send, Trash2, Users, User, Info, AlertTriangle, AlertCircle, Sparkles, Search, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NoticeItem {
  _id: string;
  title: string;
  content: string;
  category: 'info' | 'alert' | 'urgent' | 'promo';
  targetType: 'all' | 'specific';
  targetUsers?: Array<{ _id: string; fullName?: string; userTag?: string; email?: string }>;
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

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'info' | 'alert' | 'urgent' | 'promo'>('info');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUserObjects, setSelectedUserObjects] = useState<UserOption[]>([]);

  // User Picker Modal State
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userList, setUserList] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Toast & Delete Modal
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' as 'success' | 'error' });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const res = await apiRequest<NoticeItem[]>('/admin/notices');
    if (res.success && res.data) {
      setNotices(res.data);
    }
    setLoading(false);
  };

  const fetchUsers = async (search: string) => {
    setLoadingUsers(true);
    const res = await apiRequest<{ users: UserOption[] }>(`/admin/users?limit=30&search=${encodeURIComponent(search)}`);
    if (res.success && res.data) {
      setUserList(res.data.users || []);
    }
    setLoadingUsers(false);
  };

  const handleOpenUserPicker = () => {
    setIsUserPickerOpen(true);
    fetchUsers(userSearch);
  };

  const toggleSelectUser = (u: UserOption) => {
    if (selectedUserIds.includes(u._id)) {
      setSelectedUserIds((prev) => prev.filter((id) => id !== u._id));
      setSelectedUserObjects((prev) => prev.filter((item) => item._id !== u._id));
    } else {
      setSelectedUserIds((prev) => [...prev, u._id]);
      setSelectedUserObjects((prev) => [...prev, u]);
    }
  };

  const handleSubmitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setToastMsg({ text: 'Please fill in both title and message content', type: 'error' });
      return;
    }

    if (targetType === 'specific' && selectedUserIds.length === 0) {
      setToastMsg({ text: 'Please select at least one target user for specific notice', type: 'error' });
      return;
    }

    setSubmitting(true);
    const res = await apiRequest('/admin/notices', 'POST', {
      title,
      content,
      category,
      targetType,
      targetUserIds: selectedUserIds,
    });

    setSubmitting(false);

    if (res.success) {
      setToastMsg({ text: 'Notice published successfully!', type: 'success' });
      setTitle('');
      setContent('');
      setCategory('info');
      setTargetType('all');
      setSelectedUserIds([]);
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
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><Info className="w-3.5 h-3.5" /> Info</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Toast Notification */}
      {toastMsg.text && (
        <Toast
          message={toastMsg.text}
          type={toastMsg.type}
          onClose={() => setToastMsg({ text: '', type: 'success' })}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="w-7 h-7 text-emerald-400" /> Notice & Notification Center
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Broadcast announcement alerts or target specific users directly with custom push notices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Notice Form */}
        <div className="lg:col-span-1 bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-6 shadow-xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" /> Create New Notice
          </h3>

          <form onSubmit={handleSubmitNotice} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Notice Title</label>
              <input
                type="text"
                placeholder="e.g. System Maintenance Notice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Category Type</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="info">General Info (Emerald)</option>
                <option value="alert">Security Alert (Amber)</option>
                <option value="urgent">Urgent Announcement (Red)</option>
                <option value="promo">Promotional Offer (Teal)</option>
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Target Audience</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('all');
                    setSelectedUserIds([]);
                    setSelectedUserObjects([]);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    targetType === 'all'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-bold shadow-sm shadow-emerald-500/10'
                      : 'bg-[#1F2937] border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" /> All Users
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('specific')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    targetType === 'specific'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-bold shadow-sm shadow-emerald-500/10'
                      : 'bg-[#1F2937] border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" /> Specific Users
                </button>
              </div>
            </div>

            {/* Specific User Selector Trigger */}
            {targetType === 'specific' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleOpenUserPicker}
                  className="w-full flex items-center justify-between bg-[#1F2937] border border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl px-4 py-3 text-xs font-semibold text-emerald-400 transition-all cursor-pointer"
                >
                  <span>Select Target Users ({selectedUserIds.length} selected)</span>
                  <Search className="w-4 h-4" />
                </button>

                {selectedUserObjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-[#1F2937]/50 rounded-xl border border-gray-800">
                    {selectedUserObjects.map((u) => (
                      <span key={u._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                        @{u.userTag || u.fullName}
                        <button
                          type="button"
                          onClick={() => toggleSelectUser(u)}
                          className="hover:text-red-400 ml-1 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Message Content</label>
              <textarea
                rows={4}
                placeholder="Write the notification message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              {submitting ? 'Publishing...' : 'Post Notice'}
            </button>
          </form>
        </div>

        {/* Existing Notices List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center justify-between">
            <span>Posted System Notices</span>
            <span className="text-xs text-gray-500 font-semibold">{notices.length} total</span>
          </h3>

          {loading ? (
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-12 text-center text-gray-400 animate-pulse">
              Loading notices...
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-12 text-center text-gray-400">
              <Bell className="w-10 h-10 mx-auto text-gray-600 mb-3" />
              No notices published yet. Create your first announcement above.
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((n) => (
                <div
                  key={n._id}
                  className="bg-[#111827] border border-[#1F2937] hover:border-gray-700 rounded-2xl p-6 space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCategoryBadge(n.category)}
                        <span className="text-xs font-mono text-gray-500">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white">{n.title}</h4>
                    </div>

                    <button
                      onClick={() => setDeleteModal({ isOpen: true, id: n._id })}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{n.content}</p>

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      Target:{' '}
                      <strong className="text-gray-200">
                        {n.targetType === 'all'
                          ? 'All Users (Broadcast)'
                          : `${n.targetUsers?.length || 0} Specific User(s)`}
                      </strong>
                    </span>

                    {n.targetType === 'specific' && n.targetUsers && n.targetUsers.length > 0 && (
                      <div className="flex items-center gap-1 truncate max-w-xs text-gray-500">
                        {n.targetUsers.map((u) => `@${u.userTag || u.fullName}`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Search & Selection Modal */}
      {isUserPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-[#1F2937] w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Select Target Users
              </h3>
              <button
                onClick={() => setIsUserPickerOpen(false)}
                className="text-gray-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search user by name, tag, or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  fetchUsers(e.target.value);
                }}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {loadingUsers ? (
                <div className="p-6 text-center text-sm text-gray-400">Searching users...</div>
              ) : userList.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">No users found.</div>
              ) : (
                userList.map((u) => {
                  const isSelected = selectedUserIds.includes(u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => toggleSelectUser(u)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-medium'
                          : 'bg-[#1F2937]/50 border-gray-800 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{u.fullName || u.userTag}</p>
                        <p className="text-xs text-gray-400">@{u.userTag} • {u.email}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsUserPickerOpen(false)}
                className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20"
              >
                Done ({selectedUserIds.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? It will no longer be visible to users."
        confirmText="Delete"
        onConfirm={handleDeleteNotice}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
      />
    </div>
  );
}
