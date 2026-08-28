'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Menu,
  Send,
  MessageSquare,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import FloatingNavbar from '@/components/FloatingNavbar';

export default function ProfessionalWhiteLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Trigger smooth initial load split-out animation after 150ms mount delay
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    if (targetId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
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
      <div className="bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#064E3B] text-white py-2.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 border-b border-emerald-600/40">
        <span className="inline-flex items-center gap-1.5 bg-white text-emerald-950 font-black px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-xs">
          New
        </span>
        <span>RopeWallet is now live!</span>
        <a
          href="#become-host"
          onClick={(e) => handleSmoothScroll(e, 'become-host')}
          className="underline hover:text-emerald-200 font-bold ml-1 flex items-center gap-0.5 text-xs text-white"
        >
          Become a Host <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      {/* Main Floating Pill Navigation Bar */}
      <FloatingNavbar
        brandNameFirst="Rope"
        brandNameSecond="Wallet"
        subTitle="ENTERPRISE WALLET"
        logoImg="/ropewallet.png"
        accentColor="emerald"
        ctaLabel="Become a Host"
        ctaHref="#become-host"
        navItems={[
          { label: 'Become a Host', href: '#become-host' },
          { label: 'Mobile App', href: '#mobile-app' },
          { label: 'Features', href: '#features' },
          { label: 'How It Works', href: '#how-it-works' },
          { label: 'Download App', href: '/download', badge: 'APK' },
        ]}
      />

      {/* Main Content Landmark for 100% Accessibility */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-white">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Content Column */}
              <div className="lg:col-span-7 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-8 shadow-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Ultra-Secure Enterprise Payment Gateway Engine</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08] mb-6">
                  The Ultra-Secure Enterprise Payment Gateway &{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600">
                    Digital Wallet Engine
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed font-normal">
                  As an <strong>Ultra-Secure Enterprise Payment Gateway</strong> and <strong>Digital Wallet Engine</strong>, RopeWallet processes instant Chime, Cash App, Venmo, and Apple Pay deposits with 100% automated receipt verification, real-time balance settlement, and 256-bit encrypted audit security.
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-12">
                  <a
                    href="#become-host"
                    onClick={(e) => handleSmoothScroll(e, 'become-host')}
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center gap-3 cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5" />
                    Become a Host
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="/ropewallet.apk"
                    download="RopeWallet.apk"
                    className="px-8 py-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Download APK File
                  </a>
                </div>

                {/* Supported Brands Bar */}
                <div id="gateways" className="pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Supported Gateway Platforms
                  </p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-500/40 transition-all">
                      <img src="https://img.icons8.com/color/96/chime.png" alt="Chime" width={24} height={24} loading="lazy" decoding="async" className="h-6 w-auto object-contain" />
                      <span className="font-extrabold text-xs text-slate-800">Chime</span>
                    </div>

                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-500/40 transition-all">
                      <img src="https://img.icons8.com/color/96/cash-app.png" alt="Cash App" width={24} height={24} loading="lazy" decoding="async" className="h-6 w-auto object-contain" />
                      <span className="font-extrabold text-xs text-slate-800">Cash App</span>
                    </div>

                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-500/40 transition-all">
                      <div className="bg-[#008CFF]/15 px-3 py-1 rounded-lg border border-[#008CFF]/30">
                        <span className="font-extrabold text-[#008CFF] text-xs">venmo</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-purple-500/40 transition-all">
                      <img src="https://img.icons8.com/color/96/apple-pay.png" alt="Apple Pay" width={24} height={24} loading="lazy" decoding="async" className="h-6 w-auto object-contain" />
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
                    <div className="bg-[#0B0F1A] rounded-[32px] sm:rounded-[36px] overflow-hidden">
                      <img
                        src="/app_hero_mockup.png"
                        alt="RopeWallet Android Mobile App UI"
                        width={290}
                        height={600}
                        loading="eager"
                        decoding="async"
                        className="w-full h-auto object-cover rounded-[32px] sm:rounded-[36px]"
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
                Submit your inquiry directly to Super Admin to receive host credentials and manage deposit flows.
              </p>
            </div>

            {/* 2-Column Inquiry Card Container */}
            <div className="bg-white border border-slate-200/80 rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-w-6xl mx-auto">
              {/* Left Side Beautiful Image Container */}
              <div className="lg:col-span-5 relative min-h-[350px] lg:min-h-[500px] overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80"
                  alt="Fintech Host Security Engine"
                  width={600}
                  height={500}
                  loading="lazy"
                  decoding="async"
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
                    Automated 80% host profit settlement, real-time receipt verification, and complete chargeback protection.
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
        <section id="mobile-app" className="py-24 bg-gradient-to-b from-[#059669] via-[#047857] to-[#065F46] text-white relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[28rem] h-[28rem] bg-teal-300/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold mb-6 backdrop-blur-sm shadow-xs">
                  <Smartphone className="w-4 h-4 text-emerald-200" />
                  <span>RopeWallet Mobile Ecosystem</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-6 text-white drop-shadow-sm">
                  Access System via the Official Mobile App
                </h2>
                <p className="text-emerald-100 text-base sm:text-lg leading-relaxed mb-8 font-medium">
                  Hosts and customers access system features directly inside the official RopeWallet Mobile Application. Generate deposit links, track live status, manage balances, and send payouts seamlessly.
                </p>

                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5 border border-white/30">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">Instant Link Customization</h4>
                      <p className="text-xs text-emerald-100/90">Specify request amounts and customer tags with 1-tap clipboard sharing.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5 border border-white/30">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">Live 3-Second Receipt Verification</h4>
                      <p className="text-xs text-emerald-100/90">Receive real-time push notifications the exact second cash arrives.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5 border border-white/30">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">Biometric Face ID & PIN Security</h4>
                      <p className="text-xs text-emerald-100/90">Bank-grade security with encrypted local auth and secure hardware storage.</p>
                    </div>
                  </div>
                </div>

                {/* Download Buttons with Official Logos & Authoritative External Links */}
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="https://www.apple.com/app-store/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download RopeWallet on the Apple App Store"
                    className="w-[210px] h-[60px] bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3.5 cursor-pointer border border-white/40 shrink-0"
                  >
                    {/* Authentic Apple Logo */}
                    <svg className="w-6 h-6 fill-slate-950 shrink-0" viewBox="0 0 384 512">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-92.1zm-57.6-150.3c23.2-28.6 37.8-68.4 33-107.4-32.9 2.5-73.4 23.4-96.1 50-20.9 24.3-38.3 64.7-32.8 102.7 36.7 2.8 72.7-16.7 95.9-45.3z" />
                    </svg>
                    <div className="text-left leading-tight">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Download on the</span>
                      <span className="text-sm font-black text-slate-950">App Store</span>
                    </div>
                  </a>

                  <a
                    href="/ropewallet.apk"
                    download="RopeWallet.apk"
                    aria-label="Download RopeWallet Android APK"
                    className="w-[210px] h-[60px] bg-slate-950 hover:bg-slate-900 text-white border border-white/20 font-extrabold text-xs rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3.5 cursor-pointer shrink-0"
                  >
                    {/* Official Google Play Store Icon */}
                    <svg className="w-6 h-6 shrink-0 drop-shadow-xs" viewBox="0 0 512 512" fill="none">
                      <path d="M99.617 8.057a32.062 32.062 0 0 0-14.739 5.863C76.993 19.349 72 29.832 72 41.528v428.944c0 11.696 4.993 22.179 12.878 27.608a32.062 32.062 0 0 0 14.739 5.863L314.07 256 99.617 8.057z" fill="#00A0FF" />
                      <path d="M380.05 190.05l-65.98 65.95 65.98 65.95 72.82-41.97c14.28-8.24 22.86-23.01 22.86-39.93s-8.58-31.69-22.86-39.93l-72.82-41.97z" fill="#FFC800" />
                      <path d="M99.617 8.057L314.07 256l65.98-65.95L120.3 12.162c-6.19-3.57-13.37-5.07-20.683-4.105z" fill="#00F076" />
                      <path d="M99.617 503.943c7.313.965 14.493-.535 20.683-4.105l259.75-149.943L314.07 256 99.617 503.943z" fill="#FF3A44" />
                    </svg>
                    <div className="text-left leading-tight">
                      <span className="text-[10px] font-bold text-emerald-300 block uppercase tracking-wider">GET IT ON</span>
                      <span className="text-sm font-black text-white">Google Play</span>
                    </div>
                  </a>
                </div>
              </div>

              {/* App Preview Showcase Box */}
              <div className="bg-emerald-950/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-emerald-950/60 relative backdrop-blur-xl">
                <div className="bg-[#022c22]/90 border border-emerald-400/30 rounded-2xl p-6 text-left space-y-6">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center font-bold shadow-md">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm">RopeWallet Mobile</h4>
                        <p className="text-xs text-emerald-200 font-medium">Host & Customer Access System</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-300/40 text-[10px] font-extrabold">
                      Connected
                    </span>
                  </div>

                  <div className="bg-emerald-950/90 p-4 rounded-xl border border-emerald-500/30 shadow-inner space-y-2">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Available Host Balance</span>
                    <div className="text-3xl font-black text-white">$1,450.00</div>
                    <span className="text-xs text-emerald-300/90 block">+ $80.00 Net Credit from latest deposit</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Active Card Gateways</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-950/80 p-3 rounded-lg border border-emerald-500/30 text-xs font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Debit Card Active
                      </div>
                      <div className="bg-emerald-950/80 p-3 rounded-lg border border-emerald-500/30 text-xs font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Credit Card Active
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Infinite Rotating Stats Marquee Section */}
        <section className="py-8 bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#064E3B] text-white border-t border-b border-emerald-600/40 relative overflow-hidden">
          {/* Subtle Side Fade Overlays for seamless infinite appearance */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#064E3B] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#064E3B] to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee flex items-center gap-6">
            {[
              { value: "$10M+", label: "Processed Volume", tag: "FINANCIALS" },
              { value: "99.99%", label: "System Uptime", tag: "RELIABILITY" },
              { value: "< 3 Sec", label: "Verification Speed", tag: "LATENCY" },
              { value: "100%", label: "Audit Trail Guarantee", tag: "COMPLIANCE" },
              { value: "50,000+", label: "Active Hosts & Users", tag: "SCALE" },
              { value: "100%", label: "Safe & Encrypted", tag: "SECURITY" },
              { value: "0%", label: "Pre-Crediting Risk", tag: "FRAUD SHIELD" },
              { value: "12+", label: "Integrated Gateways", tag: "P2P CHANNELS" },
              { value: "24/7/365", label: "Instant Auto-Settlement", tag: "REAL-TIME" },
              { value: "4.9 / 5.0", label: "Customer Trust Score", tag: "RATING" },
              // Duplicate set for seamless continuous infinite scroll
              { value: "$10M+", label: "Processed Volume", tag: "FINANCIALS" },
              { value: "99.99%", label: "System Uptime", tag: "RELIABILITY" },
              { value: "< 3 Sec", label: "Verification Speed", tag: "LATENCY" },
              { value: "100%", label: "Audit Trail Guarantee", tag: "COMPLIANCE" },
              { value: "50,000+", label: "Active Hosts & Users", tag: "SCALE" },
              { value: "100%", label: "Safe & Encrypted", tag: "SECURITY" },
              { value: "0%", label: "Pre-Crediting Risk", tag: "FRAUD SHIELD" },
              { value: "12+", label: "Integrated Gateways", tag: "P2P CHANNELS" },
              { value: "24/7/365", label: "Instant Auto-Settlement", tag: "REAL-TIME" },
              { value: "4.9 / 5.0", label: "Customer Trust Score", tag: "RATING" },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-all shrink-0 shadow-lg group cursor-pointer"
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white group-hover:text-emerald-200 transition-colors tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                      {stat.tag}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-100/90 font-bold uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
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
                  Every payment session is protected with a precise 20-minute expiry timer and live instant auto-polling for rapid transaction verification.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">100% Verified Transactions</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Zero pre-crediting risk. Host wallet balances are credited automatically only after official payment confirmation is fully verified.
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
                <h3 className="font-bold text-slate-900 mb-2">Host Generates Link</h3>
                <p className="text-xs text-slate-600">Host enters requested deposit amount and customer tag in mobile app.</p>
              </div>

              <div className="relative text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Customer Pays</h3>
                <p className="text-xs text-slate-600">Customer opens gateway link and completes payment using Debit, Credit, or Virtual Cards.</p>
              </div>

              <div className="relative text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Auto-Verification</h3>
                <p className="text-xs text-slate-600">System instantly verifies the payment confirmation and credits balances in under 3 seconds.</p>
              </div>

              <div className="relative text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">
                  4
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Instant Settlement</h3>
                <p className="text-xs text-slate-600">Host receives $80 net balance while system retains 20% platform profit.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise-Grade Protection & User Benefits Section */}
        <section id="security" className="py-24 bg-gradient-to-b from-[#065F46] via-[#047857] to-[#064E3B] text-white relative border-t border-emerald-600/50 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/3 w-[30rem] h-[30rem] bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-black text-emerald-200 uppercase tracking-widest block mb-3">
                Enterprise-Grade Protection
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-sm">
                Built For Complete Peace of Mind & Safety
              </h2>
              <p className="text-emerald-100 text-base sm:text-lg font-medium">
                RopeWallet delivers bank-grade safety, guaranteed fraud protection, and instant settlements for every transaction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: 100% Zero-Fraud Guarantee */}
              <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 hover:border-emerald-300 hover:bg-white/15 transition-all duration-300 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-5 border border-white/20 shadow-md">
                    <Image
                      src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
                      alt="Secure Contactless Mobile Payment in Real Life"
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950/85 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                      100% Safe
                    </span>
                  </div>
                  <h3 className="font-black text-white text-lg mb-2">Instant Fraud Shield</h3>
                  <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                    Every transaction is protected with end-to-end encryption and real-time fraud monitoring so your money is always 100% safe.
                  </p>
                </div>
              </div>

              {/* Card 2: Lightning-Fast Auto-Verification */}
              <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 hover:border-emerald-300 hover:bg-white/15 transition-all duration-300 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-5 border border-white/20 shadow-md">
                    <Image
                      src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80"
                      alt="Instant Digital Payment Confirmation on Smartphone"
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950/85 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                      &lt; 3s Speed
                    </span>
                  </div>
                  <h3 className="font-black text-white text-lg mb-2">Instant Receipt Confirmation</h3>
                  <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                    No waiting or manual approvals. Payments and receipts are automatically matched and credited directly to your balance in under 3 seconds.
                  </p>
                </div>
              </div>

              {/* Card 3: Universal Payment Hub */}
              <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 hover:border-emerald-300 hover:bg-white/15 transition-all duration-300 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-5 border border-white/20 shadow-md">
                    <Image
                      src="https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=800&q=80"
                      alt="Multi-Channel Card and Wallet Payment Gateway"
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950/85 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                      Card Gateways
                    </span>
                  </div>
                  <h3 className="font-black text-white text-lg mb-2">All-in-One Card Hub</h3>
                  <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                    Deposit and manage funds effortlessly using Debit, Credit, and Virtual Cards with instant verification and zero transaction delays.
                  </p>
                </div>
              </div>

              {/* Card 4: Automated 24/7 Host Earnings */}
              <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 hover:border-emerald-300 hover:bg-white/15 transition-all duration-300 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-5 border border-white/20 shadow-md">
                    <Image
                      src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=800&q=80"
                      alt="Happy Entrepreneur Managing Financial Growth and Payouts"
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950/85 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                      24/7 Payouts
                    </span>
                  </div>
                  <h3 className="font-black text-white text-lg mb-2">Automated Host Settlements</h3>
                  <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                    Transparent 80/20 earnings split with zero hidden fees. Withdraw your funds instantly to your linked bank account anytime, day or night.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions (FAQ) Section */}
        <section className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest block mb-3">
                Knowledge Base
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-600 text-base sm:text-lg">
                Find answers to common questions about host onboarding, deposit verifications, and digital wallet settlements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  How does automated receipt verification work for instant deposit settlements?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  When a customer completes a card deposit via Debit, Credit, or Virtual Card, the transaction is verified automatically in under 3 seconds to trigger real-time balance settlement.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  What security measures protect user funds and balance updates?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  RopeWallet utilizes bank-grade encryption, biometric Face/Fingerprint authentication, and advanced fraud shields. Funds are credited instantly upon verified payment receipt.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  How do hosts apply for access credentials and royalty split management?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Hosts submit an inquiry using the online request form. Once reviewed by Super Admin, credentials are issued to access the admin portal and mobile application for managing deposit links and receiving 80% net balances.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  What payment methods and card gateways are currently supported?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  RopeWallet supports Debit Cards, Credit Cards, Virtual Cards, Apple Pay, and secure card deposits with real-time receipt verification and automated settlement.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Logo, Social Sharing Options & External Standards Links */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
            {/* Logo & Tagline */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center bg-white shadow-md border border-slate-100">
                <img src="/ropewallet.png" alt="RopeWallet Logo" width={40} height={40} loading="lazy" decoding="async" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-base block">RopeWallet</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Enterprise Wallet Engine</span>
              </div>
            </div>

            {/* Social Sharing Options & Links */}
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Share & Follow:</span>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow RopeWallet on X"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-700 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow RopeWallet on Facebook"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 hover:text-blue-600 text-slate-700 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow RopeWallet on Instagram"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 hover:text-pink-600 text-slate-700 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Engineered by</span>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 shadow-xs flex items-center justify-center overflow-hidden p-0.5">
                <img src="/RJN.png" alt="RJN Logo" width={32} height={32} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="font-bold text-slate-800">RJN Tech Solutions</span>
            </div>

            <p>© 2026 RopeWallet Digital Wallet & Payment Gateway Engine. All rights reserved.</p>
          </div>

          {/* Legal Links */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-200 mt-2">
            <a
              href="/terms"
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              Terms & Conditions
            </a>
            <span className="text-slate-200">•</span>
            <a
              href="/privacy"
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-slate-200">•</span>
            <a
              href="mailto:support@ropewallet.com"
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
