'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Avatar from '@/components/Avatar';
import { ApiClient } from '@/lib/api';

interface PaymentRequestDetails {
  _id: string;
  amount?: number;
  note?: string;
  status: string;
  expiresAt: string;
  receiver: {
    _id: string;
    fullName?: string;
    firstName: string;
    lastName: string;
    userTag: string;
    profileImage?: string;
  };
  p2pAccounts: Array<{
    platform: 'chime' | 'venmo' | 'cashapp';
    handle: string;
    displayName: string;
  }>;
}

function PayContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token');
  const toParam = searchParams.get('to');
  const amountParam = searchParams.get('amount');
  const methodParam = searchParams.get('method');
  const cancelled = searchParams.get('cancelled');

  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<PaymentRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  
  // Payment states
  const [amountInput, setAmountInput] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentFinished, setPaymentFinished] = useState(false);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      setLoading(true);
      setError(null);

      if (tokenParam) {
        setToken(tokenParam);
        const res = await ApiClient.get<PaymentRequestDetails>(`/p2p/request/${tokenParam}`);
        if (res.success && res.data) {
          setData(res.data);
          if (res.data.amount) {
            setAmountInput(res.data.amount.toString());
          }
        } else {
          setError(res.error || 'This payment link has expired or is invalid.');
        }
      } else if (toParam) {
        // Fetch receiver details and create a dynamic token
        const cleanTag = toParam.startsWith('$') ? toParam.substring(1) : toParam;
        const queryParams = new URLSearchParams();
        if (amountParam) queryParams.set('amount', amountParam);
        queryParams.set('note', 'Direct payment link');

        const res = await ApiClient.get<any>(`/p2p/receiver/${cleanTag}?${queryParams.toString()}`);
        if (res.success && res.data) {
          setToken(res.data.paymentRequest.token);
          
          const requestDetails: PaymentRequestDetails = {
            _id: res.data.paymentRequest._id,
            amount: res.data.paymentRequest.amount,
            note: res.data.paymentRequest.note,
            status: res.data.paymentRequest.status,
            expiresAt: res.data.paymentRequest.expiresAt,
            receiver: {
              _id: res.data.receiver._id,
              fullName: res.data.receiver.fullName,
              firstName: res.data.receiver.fullName?.split(' ')[0] || '',
              lastName: res.data.receiver.fullName?.split(' ')[1] || '',
              userTag: res.data.receiver.userTag,
              profileImage: res.data.receiver.profileImage,
            },
            p2pAccounts: res.data.p2pAccounts,
          };
          setData(requestDetails);
          
          if (amountParam) {
            setAmountInput(amountParam);
          } else if (res.data.paymentRequest.amount) {
            setAmountInput(res.data.paymentRequest.amount.toString());
          }

          if (methodParam) {
            setSelectedMethod(methodParam.toLowerCase());
          }
        } else {
          setError(res.error || 'Recipient not found.');
        }
      } else {
        setError('Invalid or missing payment link token.');
      }
      setLoading(false);
    };

    fetchRequestDetails();
  }, [tokenParam, toParam, amountParam, methodParam]);

  // Countdown timer effect
  useEffect(() => {
    if (!data?.expiresAt || !tokenParam) return;

    const timer = setInterval(() => {
      const expiry = new Date(data.expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('❌ This link has expired');
        clearInterval(timer);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`⏳ Link expires in ${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [data?.expiresAt, tokenParam]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-dark-bg items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-dark-bg items-center justify-center p-4">
        <div className="bg-dark-surface border border-dark-border rounded-3xl p-8 max-w-[420px] text-center shadow-2xl">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-danger mb-2">Payment Request Error</h2>
          <p className="text-sm text-dark-text-secondary leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (paymentFinished) {
    return (
      <div className="flex min-h-screen bg-dark-bg items-center justify-center p-4">
        <div className="bg-dark-surface border border-dark-border rounded-3xl p-10 max-w-[420px] text-center shadow-2xl space-y-4">
          <div className="text-5xl">⏳</div>
          <h2 className="text-2xl font-bold text-dark-text">Payment Sent!</h2>
          <p className="text-sm text-dark-text-secondary leading-relaxed">
            Thank you! Your manual deposit confirmation has been submitted to the admin for verification. The recipient will be credited once verified.
          </p>
        </div>
      </div>
    );
  }

  const finalAmount = parseFloat(amountInput) || 0;
  const platformFee = finalAmount * 0.15;
  const netAmount = finalAmount - platformFee;

  const currentP2PHandle = data.p2pAccounts.find((a) => a.platform === selectedMethod);

  const handleCopy = () => {
    if (currentP2PHandle) {
      navigator.clipboard.writeText(currentP2PHandle.handle);
      alert('Handle copied to clipboard!');
    }
  };

  const handlePay = async () => {
    if (finalAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setSubmitting(true);

    if (selectedMethod === 'chime' || selectedMethod === 'venmo') {
      // Manual confirmation
      const res = await ApiClient.post('/p2p/confirm', {
        token,
        amount: finalAmount,
        platform: selectedMethod,
        payerName: payerName || 'Anonymous',
        payerEmail: payerEmail,
      });

      if (res.success) {
        setPaymentFinished(true);
      } else {
        alert(res.error || 'Failed to submit payment confirmation.');
      }
    } else {
      // Stripe checkout redirect
      const res = await ApiClient.post<any>('/p2p/stripe-checkout', {
        token,
        amount: finalAmount,
        platform: selectedMethod,
      });

      if (res.success && res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert(res.error || 'Failed to initialize Stripe payment.');
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-dark-bg items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-dark-surface border border-dark-border rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Receiver Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Avatar
            profileImage={data.receiver.profileImage}
            fullName={data.receiver.fullName || `${data.receiver.firstName} ${data.receiver.lastName}`}
            size={60}
          />
          <h2 className="text-xl font-bold text-dark-text mt-3">
            Pay {data.receiver.fullName || `${data.receiver.firstName} ${data.receiver.lastName}`}
          </h2>
          <span className="text-xs text-primary font-bold mt-0.5">
            @{data.receiver.userTag}
          </span>
          {data.note && (
            <p className="text-xs text-dark-text-secondary italic mt-3 bg-dark-bg/60 border border-dark-border/40 px-4 py-2.5 rounded-xl max-w-full">
              &ldquo;{data.note}&rdquo;
            </p>
          )}
        </div>

        {/* Expiry Timer */}
        <div className="bg-dark-bg/80 border border-dark-border/60 text-xs font-bold text-center py-2.5 rounded-xl mb-6 text-dark-text-secondary tracking-wide">
          {timeLeft || '⏳ Calculating expiry timer...'}
        </div>

        {/* Cancelled Alert */}
        {cancelled && (
          <div className="bg-danger/10 border border-danger/25 text-danger text-xs font-semibold p-3.5 rounded-xl text-center mb-5">
            Checkout was cancelled. Please try again.
          </div>
        )}

        {/* Amount Section */}
        <div className="space-y-4 mb-6">
          <label className="block text-xs font-bold text-dark-text-secondary uppercase tracking-wider">
            Amount to Send
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-extrabold text-dark-text-secondary">
              $
            </span>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0.00"
              disabled={!!data.amount}
              className="w-full pl-10 pr-4 py-3.5 bg-dark-bg border border-dark-border rounded-xl text-2xl font-extrabold text-dark-text outline-none focus:border-primary transition-colors disabled:opacity-60"
            />
          </div>

          {!data.amount && (
            <div className="grid grid-cols-3 gap-2">
              {[10, 20, 25, 50, 100, 200].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountInput(val.toString())}
                  className="py-2 text-xs font-semibold bg-dark-bg border border-dark-border hover:bg-dark-surface-2 rounded-lg cursor-pointer transition-colors text-dark-text"
                >
                  ${val}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fee Breakdown */}
        {finalAmount > 0 && (
          <div className="bg-dark-bg/60 border border-dark-border/40 rounded-xl p-4 space-y-2 mb-6 text-xs">
            <div className="flex justify-between">
              <span className="text-dark-text-secondary">You send:</span>
              <span className="font-semibold">${finalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-danger">
              <span>Service fee (15%):</span>
              <span>-${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-dark-border/50 pt-2 text-success font-bold text-sm">
              <span>Recipient receives:</span>
              <span>${netAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-4 mb-6">
          <label className="block text-xs font-bold text-dark-text-secondary uppercase tracking-wider">
            Select Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'applepay', name: 'Apple Pay', icon: '🍎' },
              { id: 'googlepay', name: 'Google Pay', icon: '🟢' },
              { id: 'cashapp', name: 'Cash App', icon: '💚' },
              { id: 'chime', name: 'Chime', icon: '🏦' },
              { id: 'venmo', name: 'Venmo', icon: '💜' },
              { id: 'card', name: 'Debit/Credit', icon: '💳' },
            ].filter((m) => {
              if (methodParam) {
                return m.id === methodParam.toLowerCase();
              }
              return true;
            }).map((method) => {
              // Hide Chime/Venmo if they are not configured for this receiver
              const isP2P = method.id === 'chime' || method.id === 'venmo';
              if (isP2P && !data.p2pAccounts.some((a) => a.platform === method.id)) {
                return null;
              }

              const isSelected = selectedMethod === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center gap-2 border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary-hover shadow-lg shadow-primary/5'
                      : 'bg-dark-bg border-dark-border text-dark-text-secondary hover:text-dark-text hover:bg-dark-surface-2'
                  }`}
                >
                  <span>{method.icon}</span>
                  {method.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chime / Venmo Instructions */}
        {currentP2PHandle && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="font-extrabold text-sm text-primary-hover">
              Send via {selectedMethod === 'chime' ? 'Chime' : 'Venmo'}
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white font-bold shrink-0">1</span>
                <span className="text-dark-text-secondary leading-relaxed">
                  Open your <strong>{selectedMethod === 'chime' ? 'Chime' : 'Venmo'}</strong> app and send <strong>${finalAmount.toFixed(2)}</strong> to:
                </span>
              </div>

              <div className="flex justify-between items-center bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5">
                <span className="font-bold text-primary-hover text-sm">{currentP2PHandle.handle}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1 bg-primary hover:opacity-90 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-opacity"
                >
                  📋 Copy
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white font-bold shrink-0">2</span>
                <span className="text-dark-text-secondary leading-relaxed">
                  After sending, enter your details below and click &ldquo;Confirm Payment&rdquo;
                </span>
              </div>
            </div>

            <div className="space-y-3.5 pt-2 border-t border-dark-border/40">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-dark-text-secondary uppercase">Your Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-xs text-dark-text outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-dark-text-secondary uppercase">Your Email (for receipt)</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-xs text-dark-text outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Pay Button */}
        <button
          onClick={handlePay}
          disabled={submitting || !selectedMethod || finalAmount <= 0}
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl font-bold text-sm hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary/10"
        >
          {submitting
            ? 'Processing payment...'
            : !selectedMethod
            ? 'Select a payment method'
            : finalAmount <= 0
            ? 'Enter payment amount'
            : selectedMethod === 'chime' || selectedMethod === 'venmo'
            ? '✓ I Have Sent the Payment'
            : `Pay $${finalAmount.toFixed(2)}`}
        </button>

        <div className="text-center text-[10px] text-dark-text-secondary font-medium mt-5 tracking-wide uppercase">
          🔒 Secured by RopeWallet &bull; 256-bit Encryption
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-dark-bg items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2" />
      </div>
    }>
      <PayContent />
    </Suspense>
  );
}
