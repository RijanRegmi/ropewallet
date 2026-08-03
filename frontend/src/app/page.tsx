'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  CreditCard,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Search,
  Check,
  ChevronRight,
  TrendingUp,
  Layers,
  Globe,
  Clock,
  Shield,
  Activity,
} from 'lucide-react';

export default function ProfessionalWhiteLandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (query.length > 20) {
      // Order ID search
      router.push(`/pay/hub/${query}`);
    } else {
      // Host userTag search
      const cleanTag = query.replace(/^\$/, '');
      router.push(`/pay/${cleanTag}`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500 selection:text-white relative">
      {/* Subtle Grid Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-white py-2.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
          New
        </span>
        <span>RopeWallet 2.0 Instant P2P Settlement Engine is now live!</span>
        <Link href="/admin/login" className="underline hover:text-emerald-400 font-bold ml-1 flex items-center gap-0.5">
          Host Portal Login <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-600/20">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                RopeWallet
              </span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                PAYMENT GATEWAY
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Security</a>
            <a href="#gateways" className="hover:text-slate-900 transition-colors">Supported Gateways</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs"
            >
              Sign In
            </Link>
            <Link
              href="/admin/login"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Host Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-white">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-8 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Next-Gen Automated P2P Settlement Engine</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.08] mb-6">
            The Most Secure P2P Payment Gateway For{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600">
              Gaming & Digital Platforms
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Accept Chime, Cash App, Venmo, and Apple Pay deposits with 100% automated IMAP receipt verification, instant host wallet credit, and zero fraud risk.
          </p>

          {/* Interactive Portal Search Bar */}
          <div className="max-w-2xl mx-auto mb-14">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur-md opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative bg-white border border-slate-300 rounded-2xl p-2.5 flex items-center shadow-xl">
                <Search className="w-5 h-5 text-slate-400 ml-4 mr-2" />
                <input
                  type="text"
                  placeholder="Enter Host Tag (e.g. mamaji) or Order ID to open portal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-2 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  Go to Pay Portal
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
            <p className="text-xs text-slate-500 mt-3 font-medium">
              Try typing <span className="font-bold text-slate-700">mamaji</span> or an active order link to test.
            </p>
          </div>

          {/* Supported Brands Bar */}
          <div id="gateways" className="pt-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              Supported Gateway Platforms
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500/40 transition-all">
                <img src="https://img.icons8.com/color/96/chime.png" alt="Chime" className="h-7 object-contain" />
                <span className="font-extrabold text-sm text-slate-800">Chime</span>
              </div>

              <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500/40 transition-all">
                <img src="https://img.icons8.com/color/96/cash-app.png" alt="Cash App" className="h-7 object-contain" />
                <span className="font-extrabold text-sm text-slate-800">Cash App</span>
              </div>

              <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-500/40 transition-all">
                <div className="bg-[#008CFF]/15 px-3 py-1 rounded-md border border-[#008CFF]/30">
                  <span className="font-extrabold text-[#008CFF] text-xs">venmo</span>
                </div>
                <span className="font-extrabold text-sm text-slate-800">Venmo</span>
              </div>

              <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-purple-500/40 transition-all">
                <img src="https://img.icons8.com/color/96/apple-pay.png" alt="Apple Pay" className="h-7 object-contain" />
                <span className="font-extrabold text-sm text-slate-800">Apple Pay</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">$10M+</div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Processed Volume</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">99.99%</div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">System Uptime</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">&lt; 3 Sec</div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Verification Speed</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">100%</div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Audit Trail Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest block mb-3">
              Why RopeWallet?
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              Engineered For Maximum Fraud Prevention & Speed
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Everything you need to automate peer-to-peer deposits, manage host balances, and scale revenue cleanly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">20-Min Live Countdown</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every payment session is locked with a precise 20-minute expiry timer and 3-second live auto-polling engine for instantaneous verification.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">100% Security Verification</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Zero pre-crediting risk. Host wallet balances are credited ONLY after IMAP verifies actual cash receipt in your official bank emails.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Automated 20% Host Split</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Built-in accounting automatically deducts 20% platform commission fee ($20 per $100) and credits 80% net balance ($80) to the host.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Dynamic Admin Filtering</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Only show payment methods active in the system. Super Admin retains 100% control over active Chime, Cash App, and Venmo handles.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 font-bold">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Manual Review Fallback</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Money received after order expiration is automatically stored in Flagged Deposits so Super Admin can manually transfer 80% to host.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 font-bold">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Cross-Platform Sync</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seamless real-time synchronization across Next.js Web Portals, iOS App, and Android Flutter mobile applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest block mb-3">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              How RopeWallet Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Host Generates Link</h4>
              <p className="text-xs text-slate-600">Host enters requested deposit amount and customer tag in app.</p>
            </div>

            <div className="relative text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Customer Pays</h4>
              <p className="text-xs text-slate-600">Customer opens gateway hub and sends payment via Chime/Cash App/Venmo.</p>
            </div>

            <div className="relative text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 mb-2">IMAP Verification</h4>
              <p className="text-xs text-slate-600">Engine automatically matches official bank email receipt in under 3 seconds.</p>
            </div>

            <div className="relative text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">
                4
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Instant Settlement</h4>
              <p className="text-xs text-slate-600">Host receives $80 net balance while system retains 20% platform profit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">
            Ready to Automate Your P2P Payment Gateway?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10">
            Join leading platforms utilizing RopeWallet for zero-fraud instant deposit settlement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/admin/login"
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
            >
              Access Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer with Developed by RJN Branding */}
      <footer className="border-t border-slate-200 bg-white py-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              R
            </div>
            <span className="font-extrabold text-slate-900 text-sm">RopeWallet</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Developed by</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-300 shadow-xs">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-[10px] font-black text-white">
                RJN
              </div>
              <span className="font-extrabold text-xs tracking-wider text-slate-800">
                RJN DEVELOPER
              </span>
            </div>
          </div>

          <p>© 2026 RopeWallet Payment Gateway Engine. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
