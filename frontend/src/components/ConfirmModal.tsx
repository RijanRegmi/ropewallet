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
  isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel',
  type = 'danger', onConfirm, onClose, loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'logout':  return <LogOut className="w-7 h-7 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-7 h-7 text-amber-400" />;
      case 'info':    return <CheckCircle className="w-7 h-7 text-cyan-400" />;
      default:        return <Trash2 className="w-7 h-7 text-red-400" />;
    }
  };

  // Icon bubble style
  const getIconBubble = (): React.CSSProperties => {
    switch (type) {
      case 'logout':
      case 'danger':  return { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)' };
      case 'warning': return { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)' };
      case 'info':    return { background: 'rgba(92,124,137,0.20)', border: '1px solid rgba(92,124,137,0.35)' };
      default:        return { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)' };
    }
  };

  // Top accent bar gradient
  const getAccentGradient = () => {
    switch (type) {
      case 'logout':
      case 'danger':  return 'linear-gradient(90deg, #7f1d1d, #dc2626, #ef4444)';
      case 'warning': return 'linear-gradient(90deg, #92400e, #d97706, #f59e0b)';
      case 'info':    return 'linear-gradient(90deg, #1F4959, #5C7C89, #7ba5b5)';
      default:        return 'linear-gradient(90deg, #7f1d1d, #dc2626)';
    }
  };

  // Confirm button style
  const getConfirmBtn = (): React.CSSProperties => {
    switch (type) {
      case 'logout':
      case 'danger':  return { background: 'linear-gradient(135deg, #7f1d1d, #dc2626)', border: '1px solid rgba(239,68,68,0.40)', boxShadow: '0 4px 16px rgba(220,38,38,0.35)', color: '#fff' };
      case 'warning': return { background: 'linear-gradient(135deg, #92400e, #d97706)', border: '1px solid rgba(245,158,11,0.40)', boxShadow: '0 4px 16px rgba(217,119,6,0.35)', color: '#fff' };
      case 'info':    return { background: 'linear-gradient(135deg, #1F4959, #5C7C89)', border: '1px solid rgba(92,124,137,0.45)', boxShadow: '0 4px 16px rgba(31,73,89,0.45)', color: '#fff' };
      default:        return { background: 'linear-gradient(135deg, #7f1d1d, #dc2626)', border: '1px solid rgba(239,68,68,0.40)', boxShadow: '0 4px 16px rgba(220,38,38,0.35)', color: '#fff' };
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-md p-6 rounded-3xl animate-fade-in relative overflow-hidden"
        style={{
          background: 'rgba(10, 26, 40, 0.92)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(92, 124, 137, 0.28)',
          boxShadow: '0 24px 60px rgba(1, 20, 37, 0.85), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Accent top bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: getAccentGradient() }}
        />

        {/* Icon + Title + Message */}
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3.5 rounded-2xl flex-shrink-0" style={getIconBubble()}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold text-white leading-snug">{title}</h3>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(168,196,204,0.75)' }}>{message}</p>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="cursor-pointer text-xl font-bold p-1 transition-colors"
            style={{ color: '#5C7C89' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#5C7C89'; }}
          >
            &times;
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 mt-4" style={{ borderTop: '1px solid rgba(92,124,137,0.18)' }}>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(92,124,137,0.10)', border: '1px solid rgba(92,124,137,0.22)', color: 'rgba(208,232,239,0.70)' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={getConfirmBtn()}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
