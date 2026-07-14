'use client';

import { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      className={`px-5 py-3.5 rounded-xl text-sm font-semibold text-white shadow-2xl transition-all duration-300 min-w-[300px] border border-white/10 ${
        toast.type === 'success' ? 'bg-success/95' : 'bg-danger/95'
      }`}
    >
      <div className="flex justify-between items-center gap-4">
        <span>{toast.message}</span>
        <button
          onClick={() => onClose(toast.id)}
          className="text-white/60 hover:text-white text-lg font-bold cursor-pointer"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
