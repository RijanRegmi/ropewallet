'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Layers,
  Globe,
  Clock,
  Activity,
  Smartphone,
  Download,
  Apple,
  Play,
  CheckCircle2,
  UserPlus,
  X,
  Send,
  MessageSquare,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function ProfessionalWhiteLandingPage() {
  // Become a Host Form State
  const [hostForm, setHostForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    telegramOrWhatsapp: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    const res = await apiRequest<any>('/pay/become-host-request', 'POST', hostForm);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitSuccess(true);
    } else {
      setSubmitError(res.error || 'Failed to send request to Super Admin');
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
        <a
          href="#become-host"
          onClick={(e) => handleSmoothScroll(e, 'become-host')}
          className="underline hover:text-emerald-400 font-bold ml-1 flex items-center gap-0.5 text-xs text-white"
        >
          Become a Host Inquiry <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-white shadow-md shadow-emerald-600/10 border border-slate-100">
              <img src="/ropewallet.png" alt="RopeWallet Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                RopeWallet
              </span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                ENTERPRISE WALLET
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#gateways" onClick={(e) => handleSmoothScroll(e, 'gateways')} className="hover:text-slate-900 transition-colors">
              Supported Gateways
            </a>
            <a href="#become-host" onClick={(e) => handleSmoothScroll(e, 'become-host')} className="hover:text-slate-900 transition-colors">
              Become a Host
            </a>
            <a href="#mobile-app" onClick={(e) => handleSmoothScroll(e, 'mobile-app')} className="hover:text-slate-900 transition-colors">
              Mobile App
            </a>
            <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className="hover:text-slate-900 transition-colors">
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#become-host"
              onClick={(e) => handleSmoothScroll(e, 'become-host')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Become a Host
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-white">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-8 shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Ultra-Secure Enterprise P2P Payment Gateway Engine</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08] mb-6">
                The Ultra-Secure Enterprise P2P Payment Gateway &{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600">
                  Digital Wallet Engine
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed font-normal">
                Accept instant Chime, Cash App, Venmo, and Apple Pay deposits with 100% automated IMAP receipt verification, real-time wallet balance settlement, and complete audit security.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-12">
                <a
                  href="#become-host"
                  onClick={(e) => handleSmoothScroll(e, 'become-host')}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center gap-3 cursor-pointer"
                >
                  <UserPlus className="w-5 h-5" />
                  Become a Host (Submit Inquiry)
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#mobile-app"
                  onClick={(e) => handleSmoothScroll(e, 'mobile-app')}
                  className="px-8 py-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Download Mobile App
                </a>
              </div>

              {/* Supported Brands Bar */}
              <div id="gateways" className="pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Supported Gateway Platforms
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-500/40 transition-all">
                    <img src="https://img.icons8.com/color/96/chime.png" alt="Chime" className="h-6 object-contain" />
                    <span className="font-extrabold text-xs text-slate-800">Chime</span>
                  </div>

                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-500/40 transition-all">
                    <img src="https://img.icons8.com/color/96/cash-app.png" alt="Cash App" className="h-6 object-contain" />
                    <span className="font-extrabold text-xs text-slate-800">Cash App</span>
                  </div>

                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-500/40 transition-all">
                    <div className="bg-[#008CFF]/15 px-2 py-0.5 rounded border border-[#008CFF]/30">
                      <span className="font-extrabold text-[#008CFF] text-[10px]">venmo</span>
                    </div>
                    <span className="font-extrabold text-xs text-slate-800">Venmo</span>
                  </div>

                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-purple-500/40 transition-all">
                    <img src="https://img.icons8.com/color/96/apple-pay.png" alt="Apple Pay" className="h-6 object-contain" />
                    <span className="font-extrabold text-xs text-slate-800">Apple Pay</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Mobile Phone Device Mockup Column (Below text on Mobile, Right on Desktop) */}
            <div className="lg:col-span-5 relative flex justify-center items-center mt-10 lg:mt-0">
              <div className="relative animate-float">
                {/* Background Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-500/20 rounded-[60px] blur-2xl pointer-events-none" />

                {/* Floating Badge 1 (Top Left) */}
                <div className="absolute -left-6 top-8 bg-white/95 backdrop-blur-md border border-slate-200 px-3.5 py-2 rounded-2xl shadow-xl z-20 hidden sm:flex items-center gap-2.5 text-xs font-extrabold text-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    ⚡
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-semibold uppercase">Verification</span>
                    <span className="text-xs">Instant &lt;3s Settlement</span>
                  </div>
                </div>

                {/* Floating Badge 2 (Bottom Right) */}
                <div className="absolute -right-6 bottom-10 bg-white/95 backdrop-blur-md border border-slate-200 px-3.5 py-2 rounded-2xl shadow-xl z-20 hidden sm:flex items-center gap-2.5 text-xs font-extrabold text-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    🛡️
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-semibold uppercase">Revenue Split</span>
                    <span className="text-xs">80% Host / 20% Royalty</span>
                  </div>
                </div>

                {/* Android Smartphone Frame (Compact & Sleek) */}
                <div className="w-[215px] sm:w-[260px] lg:w-[290px] bg-slate-950 border-[7px] sm:border-[8px] border-slate-900 rounded-[40px] sm:rounded-[44px] shadow-2xl shadow-slate-950/60 overflow-hidden relative border-t-[9px] border-b-[9px]">
                  {/* Android Camera Punch Hole */}
                  <div className="w-3 h-3 bg-[#0B0F1A] border border-slate-800 rounded-full mx-auto absolute top-1.5 left-1/2 -translate-x-1/2 z-30 shadow-inner" />

                  {/* Phone Screen Display with App Screenshot */}
                  <div className="bg-[#0B0F1A] rounded-[32px] sm:rounded-[36px] overflow-hidden pt-4 sm:pt-5">
                    <img
                      src="/app_hero_mockup.png"
                      alt="RopeWallet Android Mobile App UI"
                      className="w-full h-auto object-cover rounded-b-[30px] sm:rounded-b-[34px] shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become a Host Connection Section (Matches User's UI Screenshot) */}
      <section id="become-host" className="py-20 bg-slate-50/70 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest block mb-3">
              Partner With Us
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              Become an Authorized Host
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Submit your inquiry directly to Super Admin to receive host credentials and manage P2P deposit flows.
            </p>
          </div>

          {/* 2-Column Inquiry Card Container */}
          <div className="bg-white border border-slate-200/80 rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-w-6xl mx-auto">
            {/* Left Side Beautiful Image Container */}
            <div className="lg:col-span-5 relative min-h-[350px] lg:min-h-[500px] overflow-hidden bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80"
                alt="Fintech Host Security Engine"
                className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-8 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold w-fit mb-3">
                  <ShieldCheck className="w-4 h-4" /> 100% Bank Verification Audit
                </div>
                <h3 className="text-2xl font-black text-white leading-tight mb-2">
                  Enterprise Host Infrastructure
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Automated 80% host credit settlement, live IMAP receipt engine, and zero chargeback protection.
                </p>
              </div>
            </div>

            {/* Right Side Inquiry Form (Matching Screenshot Layout) */}
            <div className="lg:col-span-7 p-8 sm:p-12 text-left bg-white flex flex-col justify-center">
              {submitSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900">Inquiry Received!</h3>
                  <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
                    Your Become a Host connection request has been securely delivered to Super Admin. Our team will contact you via email or phone shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setHostForm({ fullName: '', email: '', phone: '', telegramOrWhatsapp: '', notes: '' });
                    }}
                    className="px-6 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleHostSubmit} className="space-y-6">
                  {submitError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
                      {submitError}
                    </div>
                  )}

                  {/* 2-Column Grid Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter full name"
                        value={hostForm.fullName}
                        onChange={(e) => setHostForm({ ...hostForm, fullName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="98XXXXXXXX"
                        value={hostForm.phone}
                        onChange={(e) => setHostForm({ ...hostForm, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="example@mail.com"
                        value={hostForm.email}
                        onChange={(e) => setHostForm({ ...hostForm, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                      />
                    </div>

                    {/* Telegram / WhatsApp / Address */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Telegram / WhatsApp / Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="@handle or Residential address"
                        value={hostForm.telegramOrWhatsapp}
                        onChange={(e) => setHostForm({ ...hostForm, telegramOrWhatsapp: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Your Message */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Your Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="How can we help you?"
                      value={hostForm.notes}
                      onChange={(e) => setHostForm({ ...hostForm, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  {/* Vibrant Green Submit Button (Matching User's Screenshot) */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#00B050] hover:bg-[#009A46] text-white font-extrabold text-base rounded-full shadow-lg shadow-[#00B050]/30 transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>{isSubmitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}</span>
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Access Section */}
      <section id="mobile-app" className="py-20 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6">
                <Smartphone className="w-4 h-4" />
                <span>RopeWallet Mobile Ecosystem</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
                Access System via the Official Mobile App
              </h2>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
                Hosts and customers access system features directly inside the official RopeWallet Mobile Application. Generate P2P deposit links, track live status, manage balances, and send payouts seamlessly.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Instant Link Customization</h4>
                    <p className="text-xs text-slate-400">Specify request amounts and customer tags with 1-tap clipboard sharing.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Live 3-Second Receipt Verification</h4>
                    <p className="text-xs text-slate-400">Receive real-time push notifications the exact second cash arrives.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Biometric Face ID & PIN Security</h4>
                    <p className="text-xs text-slate-400">Bank-grade security with encrypted local auth and secure hardware storage.</p>
                  </div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#"
                  className="px-6 py-3.5 bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-3 cursor-pointer"
                >
                  <Apple className="w-5 h-5" />
                  <div className="text-left leading-tight">
                    <span className="text-[10px] font-semibold text-slate-500 block uppercase">Download for</span>
                    <span className="text-sm font-black">iOS App Store</span>
                  </div>
                </a>

                <a
                  href="#"
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-3 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <div className="text-left leading-tight">
                    <span className="text-[10px] font-semibold text-emerald-200 block uppercase">Download for</span>
                    <span className="text-sm font-black">Android APK</span>
                  </div>
                </a>
              </div>
            </div>

            {/* App Preview Showcase Box */}
            <div className="bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
              <div className="bg-[#0B0F1A] border border-slate-700/60 rounded-2xl p-6 text-left space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">RopeWallet Mobile</h4>
                      <p className="text-xs text-slate-400">Host & Customer Access System</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    Connected
                  </span>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Host Balance</span>
                  <div className="text-3xl font-black text-emerald-400">$1,450.00</div>
                  <span className="text-xs text-slate-400 block">+ $80.00 Net Credit from latest deposit</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Gateways</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Chime Active
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Cash App Active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900 text-white border-b border-slate-800">
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
              Engineered For Enterprise Wallet Security & Speed
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Everything you need to automate peer-to-peer deposits, manage host balances, and scale revenue cleanly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">20-Min Live Countdown</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every payment session is locked with a precise 20-minute expiry timer and 3-second live auto-polling engine for instantaneous verification.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">100% Security Verification</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Zero pre-crediting risk. Host wallet balances are credited ONLY after IMAP verifies actual cash receipt in your official bank emails.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Automated 20% Host Split</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Built-in accounting automatically deducts 20% platform commission fee ($20 per $100) and credits 80% net balance ($80) to the host.
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
              <p className="text-xs text-slate-600">Host enters requested deposit amount and customer tag in mobile app.</p>
            </div>

            <div className="relative text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Customer Pays</h4>
              <p className="text-xs text-slate-600">Customer opens gateway link and sends payment via Chime/Cash App/Venmo.</p>
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

      {/* Footer with RopeWallet Logo */}
      <footer className="border-t border-slate-200 bg-white py-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white shadow border border-slate-100">
              <img src="/ropewallet.png" alt="RopeWallet Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">RopeWallet</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Developed by</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 shadow-xs flex items-center justify-center overflow-hidden p-0.5">
              <img src="/RJN.png" alt="RJN Logo" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          <p>© 2026 RopeWallet Payment Gateway Engine. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
