import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Lock,
  CreditCard,
  Bell,
  HelpCircle,
} from "lucide-react";
import FloatingNavbar from "@/components/FloatingNavbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Download RopeWallet App for Android | Direct APK Download",
  description:
    "Download the official RopeWallet Android app (APK). Instant card deposits, biometric security, and 256-bit encrypted digital wallet.",
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-400 selection:text-slate-950">
      {/* Floating White Glass Navbar */}
      <FloatingNavbar
        accentColor="emerald"
        ctaLabel="Get APK"
        ctaHref="/ropewallet.apk"
        navItems={[
          { label: 'Become a Host', href: '/#become-host' },
          { label: 'Mobile App', href: '/#mobile-app' },
          { label: 'Features', href: '/#features' },
          { label: 'How It Works', href: '/#how-it-works' },
          { label: 'Download APK', href: '/download', badge: 'APK' },
        ]}
      />

      {/* SECTION 1 (WHITE): Hero Section with Mobile Mockup and Green Download Button */}
      <section className="bg-white text-slate-900 pt-16 pb-24 relative overflow-hidden">
        {/* Subtle Background Pattern & Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[30rem] h-[30rem] bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black tracking-wide shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>OFFICIAL ANDROID RELEASE &bull; VERIFIED & SIGNED</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-none">
                Download{" "}
                <span className="text-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  RopeWallet
                </span>{" "}
                for Android
              </h1>

              {/* Description */}
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Take full control of your digital finances. Instant card deposits,
                biometric fingerprint authentication, and real-time transaction alerts in one ultra-fast app.
              </p>

              {/* Action Buttons (Vibrant Green Download Button) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="/ropewallet.apk"
                  download="RopeWallet.apk"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-lg shadow-xl shadow-emerald-700/30 transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer border border-emerald-600"
                >
                  <Download className="w-6 h-6 text-white group-hover:bounce" />
                  <span className="text-white font-black">Download APK Now</span>
                  <span className="text-xs px-2.5 py-1 bg-white/20 text-white font-black rounded-lg ml-1 backdrop-blur-sm">
                    42 MB
                  </span>
                </a>
              </div>

              {/* Technical Specifications Specs Bar */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left max-w-xl mx-auto lg:mx-0">
                <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl shadow-xs">
                  <div className="text-xs text-slate-500 font-bold">Version</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    v1.0.0
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl shadow-xs">
                  <div className="text-xs text-slate-500 font-bold">File Size</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    42.0 MB
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl shadow-xs">
                  <div className="text-xs text-slate-500 font-bold">Requirement</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    Android 8.0+
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl shadow-xs">
                  <div className="text-xs text-slate-500 font-bold">Security</div>
                  <div className="text-sm font-black text-emerald-700 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Scanned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Mobile Phone Device Mockup Column */}
            <div className="lg:col-span-5 relative flex justify-center items-center mt-10 lg:mt-0">
              <div className="relative animate-float">
                {/* Background Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-200/50 via-teal-200/30 to-emerald-300/40 rounded-[60px] blur-2xl pointer-events-none" />

                {/* Floating Badge 1 (Top Left) */}
                <div className="absolute -left-6 top-8 bg-white/95 backdrop-blur-2xl border border-slate-200/90 px-4 py-2.5 rounded-2xl shadow-2xl z-20 hidden sm:flex items-center gap-2.5 text-xs font-black text-slate-950">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    ⚡
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 font-bold uppercase">Verification</span>
                    <span className="text-xs text-slate-950 font-black">Instant &lt;3s Settlement</span>
                  </div>
                </div>

                {/* Floating Badge 2 (Bottom Right) */}
                <div className="absolute -right-6 bottom-10 bg-white/95 backdrop-blur-2xl border border-slate-200/90 px-4 py-2.5 rounded-2xl shadow-2xl z-20 hidden sm:flex items-center gap-2.5 text-xs font-black text-slate-950">
                  <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    🛡️
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 font-bold uppercase">Security Split</span>
                    <span className="text-xs text-slate-950 font-black">80% Host / 20% Fee</span>
                  </div>
                </div>

                {/* Android Smartphone Frame */}
                <div className="w-[215px] sm:w-[260px] lg:w-[290px] bg-slate-950 border-[7px] sm:border-[8px] border-slate-900 rounded-[40px] sm:rounded-[44px] shadow-2xl shadow-slate-950/25 overflow-hidden relative border-t-[9px] border-b-[9px]">
                  {/* Android Camera Punch Hole */}
                  <div className="w-3 h-3 bg-[#0B0F1A] border border-slate-800 rounded-full mx-auto absolute top-1.5 left-1/2 -translate-x-1/2 z-30 shadow-inner" />

                  {/* Phone Screen Display with App Screenshot */}
                  <div className="bg-[#0B0F1A] rounded-[32px] sm:rounded-[36px] overflow-hidden">
                    <Image
                      src="/app_hero_mockup.png"
                      alt="RopeWallet Android Mobile App UI"
                      width={290}
                      height={600}
                      priority
                      className="w-full h-auto object-cover rounded-[32px] sm:rounded-[36px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 (WHITE): Quick Setup Guide */}
      <section className="py-24 bg-slate-50/60 text-slate-900 border-t border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest block mb-3">
              Quick Setup Guide
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-4">
              How to Install the APK on Android
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-medium">
              Follow these 3 easy steps to install RopeWallet on your phone in less than 30 seconds:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-emerald-600/20">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">
                Download APK
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Tap the <strong>"Download APK Now"</strong> button above to save the <code>RopeWallet.apk</code> installer file directly to your device.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-emerald-600/20">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">
                Allow Permission
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Open your phone downloads and tap the APK file. If Android prompts, tap <em>Settings</em> and toggle <strong>"Allow from this source"</strong>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-emerald-600/20">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">
                Install &amp; Open
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Tap <strong>Install</strong>. Once completed, open RopeWallet, log in or create your new account, and enjoy instant digital wallet settlements!
              </p>
            </div>
          </div>

          {/* Play Protect Tip Note Banner */}
          <div className="mt-10 bg-emerald-50/80 border border-emerald-200 p-6 sm:p-8 rounded-3xl flex items-start gap-5 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-700/20 mt-0.5">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h4 className="text-base font-black text-slate-950">
                  Google Play Protect Prompt?
                </h4>
                <span className="text-[10px] uppercase tracking-wider font-black px-2.5 py-0.5 bg-emerald-700 text-white rounded-full">
                  Safe &amp; Verified
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                If Android displays a <em>"Google Play Protect"</em> notice when opening the APK, tap <strong>"Install anyway"</strong>. RopeWallet is 100% virus-scanned, 256-bit encrypted, and completely safe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 (GREEN - ONLY THIS SECTION IS GREEN): Key App Features */}
      <section className="py-24 bg-gradient-to-b from-[#065F46] via-[#047857] to-[#064E3B] text-white border-t border-emerald-600/50 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/3 w-[30rem] h-[30rem] bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black text-emerald-200 uppercase tracking-widest block mb-3">
              Built For Speed &amp; Security
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-sm">
              Why Choose RopeWallet?
            </h2>
            <p className="text-emerald-100 text-base sm:text-lg font-medium">
              Engineered for instantaneous transaction speed, robust digital security, and seamless financial control.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl hover:bg-white/15 hover:border-emerald-300 transition-all duration-300 shadow-2xl group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center mb-6 border border-emerald-400/30 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                Instant Card Deposits
              </h3>
              <p className="text-emerald-100/90 text-xs leading-relaxed font-medium">
                Deposit funds instantly using Debit, Credit, or Virtual Cards with zero transaction delays.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl hover:bg-white/15 hover:border-emerald-300 transition-all duration-300 shadow-2xl group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-teal-400/20 text-teal-300 flex items-center justify-center mb-6 border border-teal-400/30 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                Verified Card Gateways
              </h3>
              <p className="text-emerald-100/90 text-xs leading-relaxed font-medium">
                Supports all major Debit &amp; Credit Cards, Apple Pay, and linked accounts with bank-grade security.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl hover:bg-white/15 hover:border-emerald-300 transition-all duration-300 shadow-2xl group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center mb-6 border border-emerald-400/30 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                Biometric Protection
              </h3>
              <p className="text-emerald-100/90 text-xs leading-relaxed font-medium">
                Lock wallet access and sensitive actions securely with Fingerprint ID or Face Recognition.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl hover:bg-white/15 hover:border-emerald-300 transition-all duration-300 shadow-2xl group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-teal-400/20 text-teal-300 flex items-center justify-center mb-6 border border-teal-400/30 group-hover:scale-110 transition-transform">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                Real-Time Alerts
              </h3>
              <p className="text-emerald-100/90 text-xs leading-relaxed font-medium">
                Receive instant push notifications for every deposit, transfer, and payout settlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 (WHITE): Bottom Callout Banner */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-14 text-center shadow-xl">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-4">
              Ready to experience modern digital banking?
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto text-base sm:text-lg font-medium mb-8">
              Download the official RopeWallet APK right now and set up your account in under 60 seconds.
            </p>
            <div className="flex justify-center">
              <a
                href="/ropewallet.apk"
                download="RopeWallet.apk"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg shadow-xl shadow-emerald-700/25 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                <Download className="w-6 h-6 text-white" />
                <span className="text-white font-bold">Download APK (42 MB)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 (FOOTER) */}
      <Footer reveal={false} />
    </div>
  );
}
