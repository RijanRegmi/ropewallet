'use client';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose?: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed top-6 right-6 z-[2000] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl transition-all animate-slide-in">
      <div
        className={`px-4 py-3 rounded-xl font-medium text-sm text-white shadow-lg ${
          type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
