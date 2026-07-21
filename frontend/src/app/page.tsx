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

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Redirect to dashboard if cookie is already present
  useEffect(() => {
    const checkSession = async () => {
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
      if (res.data?.token) {
        document.cookie = `admin_token=${res.data.token}; path=/; max-age=86400; SameSite=Lax;`;
      }
      router.push('/admin/dashboard');
    } else {
      setError(res.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    const res = await ApiClient.post('/auth/forgot-password', { email: forgotEmail });
    if (res.success) {
      setForgotSuccess('OTP verification code sent to your email!');
      setForgotStep(2);
    } else {
      setForgotError(res.error || 'Failed to send OTP code.');
    }
    setForgotLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    const res = await ApiClient.post('/auth/reset-password', {
      email: forgotEmail,
      otpCode,
      newPassword,
    });

    if (res.success) {
      setForgotSuccess('Password updated successfully! You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setOtpCode('');
        setNewPassword('');
      }, 2000);
    } else {
      setForgotError(res.error || 'Failed to reset password.');
    }
    setForgotLoading(false);
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
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-dark-text-secondary uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotError(null);
                    setForgotSuccess(null);
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-dark-surface border border-dark-border rounded-3xl p-8 max-w-[400px] w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-dark-text-secondary hover:text-dark-text text-xl font-bold cursor-pointer"
            >
              &times;
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-extrabold text-dark-text">🔑 Reset Password</h3>
              <p className="text-xs text-dark-text-secondary mt-1">
                {forgotStep === 1
                  ? 'Enter your email to receive a verification OTP'
                  : 'Enter the 6-digit OTP code sent to your email'}
              </p>
            </div>

            {forgotError && (
              <div className="bg-danger/10 border border-danger/20 text-danger text-xs font-semibold p-3 rounded-xl text-center mb-4">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="bg-success/10 border border-success/20 text-success text-xs font-semibold p-3 rounded-xl text-center mb-4">
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-dark-text-secondary uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    required
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm font-medium outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {forgotLoading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-dark-text-secondary uppercase">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    required
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-lg font-bold outline-none focus:border-primary text-center tracking-[4px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-dark-text-secondary uppercase">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text text-sm font-medium outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {forgotLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
