'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Clock, Copy, CheckCircle2, ExternalLink, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';

export default function OrderGatewayHubPage() {
  const params = useParams();
  const orderId = (params?.orderId as string) || '';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timerText, setTimerText] = useState('20:00');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      const interval = setInterval(fetchOrderDetails, 3000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  useEffect(() => {
    if (order?.remainingSeconds !== undefined) {
      let seconds = order.remainingSeconds;
      const timerInterval = setInterval(() => {
        if (seconds <= 0) {
          clearInterval(timerInterval);
          setTimerText('00:00');
        } else {
          seconds--;
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          setTimerText(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [order?.remainingSeconds]);

  const fetchOrderDetails = async () => {
    const res = await apiRequest<any>(`/pay/order/${orderId}`);
    setLoading(false);
    if (res.success && res.data) {
      setOrder(res.data);
    }
  };

  const handleCopyHandle = () => {
    if (order?.assignedHandle) {
      navigator.clipboard.writeText(order.assignedHandle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-400">Initializing gateway session...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-4">
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Order Gateway Expired or Not Found</h2>
          <p className="text-sm text-gray-400">Please generate a new payment link from the host portal.</p>
        </div>
      </div>
    );
  }

  // Payment Success Screen
  if (order.status === 'completed') {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-4">
        <div className="bg-[#111827] border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl shadow-emerald-500/10 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Payment Received!</h2>
            <p className="text-sm text-emerald-400 font-semibold">Your payment of ${Number(order.amount).toFixed(2)} has been verified</p>
            <p className="text-xs text-gray-400">Balance credited successfully to {order.hostName}.</p>
          </div>
          <div className="p-4 bg-[#1F2937]/60 rounded-2xl border border-gray-800 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-gray-400">
              <span>Order No:</span>
              <span className="text-white font-bold">{order.orderNo}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Amount Paid:</span>
              <span className="text-emerald-400 font-bold">${Number(order.amount).toFixed(2)}</span>
            </div>
            {order.gameUserId && (
              <div className="flex justify-between text-gray-400">
                <span>Account ID:</span>
                <span className="text-white font-bold">{order.gameUserId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Order Expired Screen
  if (order.status === 'expired' || timerText === '00:00') {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-4">
        <div className="bg-[#111827] border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Order Expired</h2>
          <p className="text-sm text-gray-400">The 20-minute payment window for Order #{order.orderNo} has lapsed. Please generate a new payment link.</p>
        </div>
      </div>
    );
  }

  const handleLaunchApp = (e: React.MouseEvent) => {
    if (!order?.directPayUrl) return;

    e.preventDefault();
    const method = (order.paymentMethod || '').toLowerCase();
    const handleStr = (order.assignedHandle || '').trim();
    const cleanTag = handleStr.replace(/^[$@]/, '');

    let targetUrl = order.directPayUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (method === 'chime') {
        targetUrl = `https://app.chime.com/link/qr?handle=${encodeURIComponent(handleStr)}`;
      } else if (method === 'cashapp') {
        targetUrl = `https://cash.app/$${cleanTag}/${order.amount}`;
      } else if (method === 'venmo') {
        targetUrl = `https://venmo.com/${cleanTag}?txn=pay&amount=${order.amount}`;
      }
    }

    window.location.href = targetUrl;
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative w-full max-w-xl py-8">
        {/* Main Gateway Card */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl overflow-hidden shadow-2xl divide-y divide-[#1F2937]">
          {/* Top Bar: Order & Timer */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1F2937]/30">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order No</span>
              <p className="text-sm font-mono font-bold text-white tracking-wider mt-0.5">{order.orderNo}</p>
            </div>

            {/* Countdown Box */}
            <div className="flex items-center gap-3 bg-[#1F2937] border border-gray-700 px-4 py-2.5 rounded-2xl">
              <Clock className="w-4 h-4 text-red-400 animate-pulse" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">Remaining payment time</span>
                <span className="text-lg font-extrabold text-red-400 font-mono tracking-widest">{timerText}</span>
              </div>
            </div>
          </div>

          {/* Amount Hero Box */}
          <div className="p-8 text-center bg-gradient-to-b from-indigo-950/20 to-transparent">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recharge Amount</span>
            <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 mt-1.5 font-mono">
              ${Number(order.amount).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total Amount to Pay to {order.hostName}</p>
          </div>

          {/* Recipient Handle & Launch Button */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white capitalize">Send money with {order.paymentMethod}</h3>
              <p className="text-xs text-gray-400">Use your {order.paymentMethod} app to complete payment</p>
            </div>

            {/* Handle Display Box */}
            <div className="bg-[#1F2937] border border-gray-700 rounded-2xl p-4 sm:p-5 text-center space-y-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                {order.paymentMethod.toLowerCase() === 'chime'
                  ? 'Recipient $ChimeSign Tag *'
                  : order.paymentMethod.toLowerCase() === 'cashapp'
                  ? 'Recipient $cashtag *'
                  : 'Recipient Handle *'}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono tracking-wider break-all select-all py-1">
                {order.paymentMethod.toLowerCase() === 'chime' && !order.assignedHandle.startsWith('$')
                  ? `$${order.assignedHandle}`
                  : order.assignedHandle}
              </div>

              <button
                type="button"
                onClick={handleCopyHandle}
                className="w-full py-3.5 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white text-emerald-400 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md shadow-emerald-500/10"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Copied {order.paymentMethod.toLowerCase() === 'chime' ? '$Tag' : 'Handle'} to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy {order.paymentMethod.toLowerCase() === 'chime' ? `$ChimeSign Tag` : 'Handle'}
                  </>
                )}
              </button>
            </div>

            {/* Simple Step-by-Step Payment Instructions */}
            <div className="bg-[#192233] border border-[#2D3748] rounded-2xl p-4 sm:p-5 space-y-3">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Easy 3-Step Payment Guide
              </span>
              
              <div className="space-y-2 text-xs text-gray-200">
                <div className="flex items-center gap-3 bg-[#111827] p-2.5 rounded-xl border border-gray-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-xs border border-emerald-500/30">
                    1
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold text-white block">Copy Recipient Tag</span>
                    <span className="text-gray-400">Tap the green <strong>&quot;Copy Tag&quot;</strong> button above to copy <strong>{order.assignedHandle.startsWith('$') ? order.assignedHandle : `$${order.assignedHandle}`}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#111827] p-2.5 rounded-xl border border-gray-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-xs border border-emerald-500/30">
                    2
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold text-white block">Open {order.paymentMethod.toUpperCase()} App</span>
                    <span className="text-gray-400">Tap <strong>&quot;Launch App&quot;</strong> below to open your payment app</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#111827] p-2.5 rounded-xl border border-gray-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-xs border border-emerald-500/30">
                    3
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold text-white block">Paste &amp; Send ${Number(order.amount).toFixed(2)}</span>
                    <span className="text-gray-400">Tap <strong>Pay / Send</strong> in your app, paste the tag, and complete payment!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Direct App Button */}
            {order.directPayUrl && (
              <a
                href={order.directPayUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleLaunchApp}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
              >
                <ExternalLink className="w-5 h-5" />
                Launch {order.paymentMethod.toUpperCase()} App
              </a>
            )}

            {/* Notice Box */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Important Payment Notice:
              </div>
              <ul className="text-gray-300 space-y-1 pl-4 list-disc text-[11px] leading-relaxed">
                <li>Please pay the exact amount <strong>${Number(order.amount).toFixed(2)}</strong>.</li>
                <li>Complete payment within the 20-minute order validity period.</li>
                <li>Avoid duplicate transfers and keep your transfer receipt.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Real-Time Automated Verification Active</span>
        </div>
      </div>
    </div>
  );
}
