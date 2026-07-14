'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect to dashboard if cookie is already present
  useEffect(() => {
    const checkSession = async () => {
      // In Next.js client component we can check if we can fetch dashboard data
      const res = await ApiClient.get('/admin/dashboard-data');
      if (res.success) {
        router.push('/admin/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await ApiClient.post<any>('/admin/login', { email, password });
    
    if (res.success) {
      // Save token to document cookie so client API wrapper can send it
      if (res.data?.token) {
        document.cookie = `admin_token=${res.data.token}; path=/; max-age=86400; SameSite=Lax;`;
      }
      router.push('/admin/dashboard');
    } else {
      setError(res.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-dark-surface border border-dark-border rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              🔐 RopeWallet
            </h1>
            <p className="text-dark-text-secondary text-sm mt-1.5 font-medium">
              Admin Portal
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-sm font-semibold p-3.5 rounded-xl text-center mb-5">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-dark-text-secondary uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ropewallet.com"
                required
                className="w-full px-4 py-3.5 bg-dark-surface-2 border border-dark-border rounded-xl text-dark-text text-sm font-medium outline-none focus:border-primary transition-colors"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-dark-text-secondary uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3.5 bg-dark-surface-2 border border-dark-border rounded-xl text-dark-text text-sm font-medium outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-dark-text-secondary font-medium">
          &copy; {new Date().getFullYear()} RopeWallet. All rights reserved.
        </div>
      </div>
    </div>
  );
}
