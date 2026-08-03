'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Zap, CreditCard, Lock, ArrowRight, CheckCircle2, Sparkles, Smartphone, Search } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (query.length > 20) {
      // Direct order ID search
      router.push(`/pay/hub/${query}`);
    } else {
      // Host userTag search
      const cleanTag = query.replace(/^\$/, '');
      router.push(`/pay/${cleanTag}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white selection:bg-emerald-500 selection:text-black relative overflow-hidden">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-emerald-600/20 via-indigo-600/20 to-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="border-b border-gray-800/60 bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0B0F1A] rounded-[14px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-emerald-400">
              RopeWallet
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="px-5 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-xs font-bold transition-all hover:scale-105"
            >
              Host / Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-32 relative z-10 text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4" />
          <span>Next-Gen Instant P2P Payment Gateway Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-6">
          Ultra-Secure Instant P2P Deposits &{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
            Real-Time Auto Verification
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Empowering gaming platforms and merchants with instant Chime, Cash App, Venmo, and Apple Pay payment processing with 100% verified settlement audit logs.
        </p>

        {/* Quick Portal Search Bar */}
        <div className="max-w-xl mx-auto mb-16">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition duration-500" />
            <div className="relative bg-[#111827] border border-[#1F2937] rounded-2xl p-2 flex items-center shadow-2xl">
              <Search className="w-5 h-5 text-gray-400 ml-4 mr-2" />
              <input
                type="text"
                placeholder="Enter Host Tag (e.g. mamaji) or Order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-2 py-3 text-sm text-white placeholder-gray-500 focus:outline-none font-medium"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold text-xs rounded-xl hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                Go to Pay Portal
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Live Brands Bar */}
        <div className="flex flex-wrap items-center justify-center gap-8 py-6 px-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] max-w-3xl mx-auto mb-24">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Supported Gateways:</span>
          <div className="flex items-center gap-6">
            <img src="https://img.icons8.com/color/96/chime.png" alt="Chime" className="h-6 object-contain" />
            <img src="https://img.icons8.com/color/96/cash-app.png" alt="Cash App" className="h-6 object-contain" />
            <img src="https://img.icons8.com/color/96/venmo.png" alt="Venmo" className="h-6 object-contain" />
            <img src="https://img.icons8.com/color/96/apple-pay.png" alt="Apple Pay" className="h-6 object-contain" />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-[#111827]/80 border border-[#1F2937] p-8 rounded-3xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">20-Min Live Countdown</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Every P2P deposit session is locked with a precise 20-minute countdown timer and 3-second live auto-polling engine.
            </p>
          </div>

          <div className="bg-[#111827]/80 border border-[#1F2937] p-8 rounded-3xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">100% Security Verification</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Zero pre-crediting risk. Wallet balances and transaction receipts are only loaded after IMAP receipt confirmation.
            </p>
          </div>

          <div className="bg-[#111827]/80 border border-[#1F2937] p-8 rounded-3xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Automatic Host Split</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Instant 20% platform commission fee deduction and 80% net host account credit calculation built right in.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/60 py-8 text-center text-xs text-gray-500">
        <p>© 2026 RopeWallet Payment Gateway Engine. All rights reserved.</p>
      </footer>
    </div>
  );
}
