'use client';

import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'yellow' | 'info';
  onClose?: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  if (!message) return null;

  const isYellow = type === 'yellow' || type === 'warning';
  const isError = type === 'error';

  return (
    <div className="fixed top-24 sm:top-28 right-4 sm:right-8 z-[9999] flex items-center gap-3 transition-all duration-300 animate-slide-in max-w-sm sm:max-w-md">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm shadow-2xl border backdrop-blur-md ${
          isYellow
            ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 text-slate-950 border-amber-400/80 shadow-amber-500/25 ring-2 ring-amber-400/40'
            : isError
            ? 'bg-red-600 text-white border-red-500 shadow-red-600/30'
            : 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
        }`}
      >
        {/* Leading Indicator Icon */}
        {isYellow ? (
          <div className="w-6 h-6 rounded-full bg-slate-950 text-amber-300 flex items-center justify-center shrink-0 font-black text-xs shadow-xs">
            ⚡
          </div>
        ) : isError ? (
          <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 text-xs font-black">
            ✕
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 text-xs font-black">
            ✓
          </div>
        )}

        <span className="leading-snug font-extrabold">{message}</span>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className={`ml-2 p-1 rounded-lg transition-colors shrink-0 text-xs font-black ${
              isYellow
                ? 'text-slate-800 hover:bg-slate-950/10'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
