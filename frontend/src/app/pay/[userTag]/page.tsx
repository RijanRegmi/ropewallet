'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Shield, Sparkles, CreditCard, ArrowRight, Smartphone, AlertCircle } from 'lucide-react';

export default function HostPayPage() {
  const params = useParams();
  const router = useRouter();
  const userTag = (params?.userTag as string) || '';

  const [hostInfo, setHostInfo] = useState<{ id: string; name: string; userTag: string; activePlatforms?: string[] } | null>(null);
  const [loadingHost, setLoadingHost] = useState(true);
  const [hostError, setHostError] = useState('');

  // Form states
  const [paymentMethod, setPaymentMethod] = useState<string>('chime');
  const [gameUserId, setGameUserId] = useState('');
  const [payerTag, setPayerTag] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const presetAmounts = [20, 25, 30, 31, 40, 50, 80, 100, 125, 130, 150, 200, 300, 400, 500];

  const methodLogos: Record<string, { name: string; logo: string; color: string }> = {
    chime: { name: 'Chime', logo: 'https://img.icons8.com/color/96/chime.png', color: 'emerald' },
    cashapp: { name: 'Cash App', logo: 'https://img.icons8.com/color/96/cash-app.png', color: 'emerald' },
    venmo: { name: 'Venmo', logo: '', color: 'blue' },
    applepay: { name: 'Apple Pay', logo: 'https://img.icons8.com/color/96/apple-pay.png', color: 'purple' },
  };

  useEffect(() => {
    if (userTag) {
      fetchHostInfo(userTag);
    }
  }, [userTag]);

  const fetchHostInfo = async (tag: string) => {
    setLoadingHost(true);
    setHostError('');
    const res = await apiRequest<any>(`/pay/host/${tag}`);
    setLoadingHost(false);

    if (res.success && res.data) {
      setHostInfo(res.data);
      if (res.data.activePlatforms && res.data.activePlatforms.length > 0) {
        setPaymentMethod(res.data.activePlatforms[0]);
      }
    } else {
      setHostError(res.error || 'Host account not found');
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (isNaN(finalAmount) || finalAmount < 1) {
      setErrorMsg('Please enter a valid amount of at least $1.00');
      return;
    }

    setCreatingOrder(true);
    const res = await apiRequest<any>('/pay/create-order', 'POST', {
      userTag,
      gameUserId,
      payerTag,
      paymentMethod,
      amount: finalAmount,
    });
    setCreatingOrder(false);

    if (res.success && res.data?.orderId) {
      router.push(`/pay/hub/${res.data.orderId}`);
    } else {
      setErrorMsg(res.error || 'Failed to generate payment link. Please try again.');
    }
  };

  if (loadingHost) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-400">Loading payment gateway portal...</p>
        </div>
      </div>
    );
  }

  if (hostError) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-4">
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Payment Portal Unavailable</h2>
          <p className="text-sm text-gray-400">{hostError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Verified Host Payment Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent capitalize">
            {hostInfo?.name} Payment Page
          </h1>
          <p className="text-sm text-gray-400 mt-2 font-medium">
            Securely pay to <span className="text-indigo-400 font-semibold">{hostInfo?.name}</span> ({hostInfo?.userTag})
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleGenerateLink} className="space-y-6">
            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Payment Method <span className="text-indigo-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(hostInfo?.activePlatforms || ['chime', 'cashapp', 'venmo']).map((mKey) => {
                  const m = methodLogos[mKey] || { name: mKey.toUpperCase(), logo: '', color: 'emerald' };
                  const isSelected = paymentMethod === mKey;
                  return (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => setPaymentMethod(mKey)}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/20'
                          : 'bg-[#1F2937]/50 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/10 p-1.5 flex items-center justify-center">
                        {m.logo ? (
                          <img src={m.logo} alt={m.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="font-bold text-xs">{mKey[0].toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-xs font-bold">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Game User ID & Customer Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Game User ID / Account ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12345"
                  value={gameUserId}
                  onChange={(e) => setGameUserId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Your {paymentMethod === 'chime' ? 'Chime' : paymentMethod === 'cashapp' ? 'Cash App' : 'P2P'} Tag / Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. $alice99 or Alice Smith"
                  value={payerTag}
                  onChange={(e) => setPayerTag(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Select Amount Grid */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Select Amount (USD) <span className="text-indigo-400">*</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 mb-3">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2.5 rounded-xl font-extrabold text-sm border transition-all cursor-pointer ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-[#1F2937]/60 border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                <input
                  type="number"
                  placeholder="Enter custom amount..."
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                  }}
                  className="w-full pl-8 pr-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={creatingOrder}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-[0.99] text-white font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {creatingOrder ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Payment Link...
                </>
              ) : (
                <>
                  Generate Payment Link
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-6">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Protected by 256-bit Encrypted P2P Payment Gateway</span>
        </div>
      </div>
    </div>
  );
}
