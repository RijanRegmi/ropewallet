'use client';

import { AlertTriangle, LogOut, Trash2, Lock, Unlock, CheckCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'logout';
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onClose,
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'logout':
        return <LogOut className="w-7 h-7 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-7 h-7 text-amber-400" />;
      case 'info':
        return <CheckCircle className="w-7 h-7 text-emerald-400" />;
      case 'danger':
      default:
        return <Trash2 className="w-7 h-7 text-red-400" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'logout':
        return 'bg-red-500/10 border-red-500/30 shadow-red-500/10 shadow-lg';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 shadow-amber-500/10 shadow-lg';
      case 'info':
        return 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10 shadow-lg';
      case 'danger':
      default:
        return 'bg-red-500/10 border-red-500/30 shadow-red-500/10 shadow-lg';
    }
  };

  const getAccentLine = () => {
    switch (type) {
      case 'logout':
      case 'danger':
        return 'from-red-600 via-rose-500 to-red-500';
      case 'warning':
        return 'from-amber-500 via-yellow-500 to-amber-500';
      case 'info':
        return 'from-emerald-500 via-teal-500 to-emerald-500';
      default:
        return 'from-indigo-500 via-purple-500 to-pink-500';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'logout':
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-lg shadow-red-600/30 border border-red-500/30';
      case 'warning':
        return 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold shadow-lg shadow-amber-500/20 border border-amber-500/30';
      case 'info':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 border border-emerald-500/30';
      default:
        return 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-[#1F2937] rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative overflow-hidden">
        {/* Type Accent Top Border */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getAccentLine()}`} />

        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3.5 rounded-2xl border ${getHeaderBg()} flex-shrink-0`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold text-white leading-snug">{title}</h3>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="cursor-pointer text-gray-400 hover:text-white text-xl font-bold transition-colors p-1"
          >
            &times;
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#1F2937] mt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-xs font-semibold transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${getButtonClass()}`}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
