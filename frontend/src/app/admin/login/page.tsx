'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

// Shared inline style helpers
const glassInput = {
  background: 'rgba(21, 44, 66, 0.70)',
  border: '1px solid rgba(92, 124, 137, 0.40)',
  color: '#ffffff',
};
const glassInputFocus = {
  borderColor: 'rgba(168, 196, 204, 0.90)',
  boxShadow: '0 0 0 3px rgba(92, 124, 137, 0.25)',
};

export default function LoginPage() {
  const { login } = useAuth();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [forgotMsg, setForgotMsg] = useState({ text: '', isError: false });
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(loginInput, password);
    setLoading(false);
    if (!result.success) setError(result.error || 'Authentication failed');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg({ text: '', isError: false });
    const res = await apiRequest('/auth/forgot-password', 'POST', { email: forgotEmail });
    setForgotLoading(false);
    if (res.success) { setForgotMsg({ text: 'OTP sent to your email!', isError: false }); setStep(2); }
    else setForgotMsg({ text: (res as any).error || 'Failed to send OTP', isError: true });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg({ text: '', isError: false });
    const res = await apiRequest('/auth/reset-password', 'POST', { email: forgotEmail, otpCode, newPassword });
    setForgotLoading(false);
    if (res.success) {
      setForgotMsg({ text: 'Password reset! You can now log in.', isError: false });
      setTimeout(() => { setIsForgotOpen(false); setStep(1); }, 2000);
    } else setForgotMsg({ text: (res as any).error || 'Failed to reset password', isError: true });
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(31,73,89,0.55) 0%, #011425 55%, #010e1a 100%)',
      }}
    >
      {/* Background decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
          style={{ background: 'rgba(31, 73, 89, 0.20)' }} />
        <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] rounded-full blur-3xl"
          style={{ background: 'rgba(92, 124, 137, 0.12)' }} />
        {/* Arch-like gradient at top (inspired by the image) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-b-full opacity-30"
          style={{ background: 'radial-gradient(ellipse at top, #1F4959 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          {/* Glass logo badge */}
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 p-2.5 overflow-hidden"
            style={{
              background: 'rgba(31, 73, 89, 0.45)',
              border: '1px solid rgba(92, 124, 137, 0.45)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(1, 20, 37, 0.50), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <img src="/ropewallet.png" alt="RopeWallet Logo" className="w-full h-full object-contain" />
          </div>
          <h1
            className="text-3xl font-extrabold"
            style={{
              background: 'linear-gradient(90deg, #ffffff 0%, #a8c4cc 60%, #5C7C89 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            RopeWallet
          </h1>
          <p className="text-sm mt-1.5 font-medium" style={{ color: '#5C7C89' }}>Admin Portal — Secure Access</p>
        </div>

        {/* High-contrast Glass card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(15, 34, 52, 0.88)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            border: '1px solid rgba(92, 124, 137, 0.45)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.80), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 40px rgba(31, 73, 89, 0.35)',
          }}
        >
          {error && (
            <div
              className="mb-6 p-3.5 text-sm rounded-xl text-center font-medium flex items-center gap-2 justify-center"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171' }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(168,196,204,0.80)' }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#5C7C89' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="admin-email"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="admin@ropewallet.com"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder-[#5C7C89] transition-all"
                  style={glassInput}
                  onFocus={(e) => Object.assign(e.currentTarget.style, glassInputFocus)}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(92,124,137,0.30)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(168,196,204,0.80)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setIsForgotOpen(true); setStep(1); setForgotMsg({ text: '', isError: false }); }}
                  className="text-xs font-medium transition-colors cursor-pointer"
                  style={{ color: '#5C7C89' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a8c4cc'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#5C7C89'; }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#5C7C89' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm placeholder-[#5C7C89] transition-all"
                  style={glassInput}
                  onFocus={(e) => Object.assign(e.currentTarget.style, glassInputFocus)}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(92,124,137,0.30)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  style={{ color: '#5C7C89' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a8c4cc'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#5C7C89'; }}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Glass CTA button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 font-extrabold text-sm rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, #1F4959 0%, #2a5f72 50%, #5C7C89 100%)',
                border: '1px solid rgba(92, 124, 137, 0.50)',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(31, 73, 89, 0.50), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.boxShadow = '0 12px 32px rgba(31, 73, 89, 0.70), inset 0 1px 0 rgba(255,255,255,0.20)';
                el.style.filter = 'brightness(1.12)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.boxShadow = '0 8px 24px rgba(31, 73, 89, 0.50), inset 0 1px 0 rgba(255,255,255,0.15)';
                el.style.filter = '';
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm p-6 rounded-2xl"
            style={{
              background: 'rgba(13, 32, 48, 0.90)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(92, 124, 137, 0.28)',
              boxShadow: '0 24px 60px rgba(1, 20, 37, 0.80)',
            }}
          >
            <div className="flex justify-between items-center mb-5 pb-3" style={{ borderBottom: '1px solid rgba(92,124,137,0.18)' }}>
              <h3 className="text-base font-bold text-white">Reset Admin Password</h3>
              <button
                onClick={() => setIsForgotOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold cursor-pointer transition-all"
                style={{ background: 'rgba(92,124,137,0.12)', color: '#5C7C89', border: '1px solid rgba(92,124,137,0.22)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(92,124,137,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#5C7C89'; }}
              >
                ×
              </button>
            </div>

            {forgotMsg.text && (
              <div
                className="mb-4 p-3 text-xs rounded-xl text-center font-medium"
                style={forgotMsg.isError
                  ? { background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }
                  : { background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.28)', color: '#34d399' }}
              >
                {forgotMsg.text}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(168,196,204,0.80)' }}>Email Address</label>
                  <input
                    type="email" required placeholder="admin@ropewallet.com" value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm transition-all"
                    style={glassInput}
                    onFocus={(e) => Object.assign(e.currentTarget.style, glassInputFocus)}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(92,124,137,0.30)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <button type="submit" disabled={forgotLoading}
                  className="w-full py-3 font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #1F4959, #5C7C89)', border: '1px solid rgba(92,124,137,0.40)', color: '#fff', boxShadow: '0 4px 16px rgba(31,73,89,0.40)' }}
                >
                  {forgotLoading ? 'Sending...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(168,196,204,0.80)' }}>6-Digit OTP Code</label>
                  <input
                    type="text" required maxLength={6} placeholder="123456" value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm font-mono tracking-widest text-center text-lg transition-all"
                    style={glassInput}
                    onFocus={(e) => Object.assign(e.currentTarget.style, glassInputFocus)}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(92,124,137,0.30)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(168,196,204,0.80)' }}>New Password</label>
                  <input
                    type="password" required minLength={6} placeholder="••••••••" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm transition-all"
                    style={glassInput}
                    onFocus={(e) => Object.assign(e.currentTarget.style, glassInputFocus)}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(92,124,137,0.30)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <button type="submit" disabled={forgotLoading}
                  className="w-full py-3 font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #1F4959, #5C7C89)', border: '1px solid rgba(92,124,137,0.40)', color: '#fff', boxShadow: '0 4px 16px rgba(31,73,89,0.40)' }}
                >
                  {forgotLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
