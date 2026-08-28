import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Zap,
  Lock,
  CreditCard,
  QrCode,
  Bell,
  HelpCircle,
} from "lucide-react";
import FloatingNavbar from "@/components/FloatingNavbar";

export const metadata = {
  title: "Download RopeWallet App for Android | Direct APK Download",
  description:
    "Download the official RopeWallet Android app (APK). Instant P2P money transfers, card deposits, biometric security, and 256-bit encrypted digital wallet.",
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#059669] via-[#047857] to-[#064E3B] text-white font-sans selection:bg-emerald-400 selection:text-slate-950 relative">
      {/* Background Ambient Glows (Isolated in fixed overflow container) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-300/25 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-teal-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[32rem] h-[32rem] bg-emerald-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Modern Floating White Glass Navbar */}
      <FloatingNavbar
        accentColor="emerald"
        ctaLabel="Get APK"
        ctaHref="/ropewallet.apk"
        navItems={[
          { label: 'Gateways', href: '/#gateways' },
          { label: 'Become a Host', href: '/#become-host' },
          { label: 'Mobile App', href: '/#mobile-app' },
          { label: 'Features', href: '/#features' },
          { label: 'How It Works', href: '/#how-it-works' },
          { label: 'Download APK', href: '/download', badge: 'APK' },
        ]}
      />

      {/* Main Hero Section */}
      <main className="relative z-10 pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black tracking-wide shadow-md backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>OFFICIAL ANDROID RELEASE &bull; VERIFIED & SIGNED</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none drop-shadow-md">
                Download{" "}
                <span className="bg-gradient-to-r from-emerald-100 via-teal-100 to-white bg-clip-text text-transparent">
                  RopeWallet
                </span>{" "}
                for Android
              </h1>

              {/* Description */}
              <p className="text-lg text-emerald-50 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed drop-shadow-xs">
                Take full control of your digital finances. Instant P2P money
                transfers, card deposits, biometric fingerprint authentication,
                and real-time notifications in one ultra-fast app.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                {/* Direct APK Download Button */}
                <a
                  href="/ropewallet.apk"
                  download="RopeWallet.apk"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-50 font-black text-lg shadow-2xl hover:shadow-white/30 transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer border border-white"
                >
                  <Download className="w-6 h-6 text-emerald-700 group-hover:bounce" />
                  <span className="text-slate-950 font-black">Download APK Now</span>
                  <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-950 font-black rounded-lg ml-1">
                    42 MB
                  </span>
                </a>
              </div>

              {/* Technical Specifications Specs Bar (Transparent White Glass Boxes with Dark Text) */}
              <div className="pt-6 border-t border-white/25 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left max-w-xl mx-auto lg:mx-0">
                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-3.5 rounded-2xl shadow-xl">
                  <div className="text-xs text-slate-700 font-extrabold">Version</div>
                  <div className="text-sm font-black text-slate-950 mt-0.5">
                    v1.0.0 (Build 2)
                  </div>
                </div>
                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-3.5 rounded-2xl shadow-xl">
                  <div className="text-xs text-slate-700 font-extrabold">File Size</div>
                  <div className="text-sm font-black text-slate-950 mt-0.5">
                    42.0 MB
                  </div>
                </div>
                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-3.5 rounded-2xl shadow-xl">
                  <div className="text-xs text-slate-700 font-extrabold">Requirement</div>
                  <div className="text-sm font-black text-slate-950 mt-0.5">
                    Android 8.0+
                  </div>
                </div>
                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-3.5 rounded-2xl shadow-xl">
                  <div className="text-xs text-slate-700 font-extrabold">Security</div>
                  <div className="text-sm font-black text-emerald-950 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Scanned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Mobile Phone Device Mockup Column */}
            <div className="lg:col-span-5 relative flex justify-center items-center mt-10 lg:mt-0">
              <div className="relative animate-float">
                {/* Background Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-300/30 via-teal-300/20 to-emerald-400/30 rounded-[60px] blur-2xl pointer-events-none" />

                {/* Floating Badge 1 (Top Left - White Glass Box with Dark Text) */}
                <div className="absolute -left-6 top-8 bg-white/65 backdrop-blur-2xl border border-white/80 px-4 py-2.5 rounded-2xl shadow-2xl z-20 hidden sm:flex items-center gap-2.5 text-xs font-black text-slate-950">
                  <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    ⚡
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-700 font-bold uppercase">Verification</span>
                    <span className="text-xs text-slate-950 font-black">Instant &lt;3s Settlement</span>
                  </div>
                </div>

                {/* Floating Badge 2 (Bottom Right - White Glass Box with Dark Text) */}
                <div className="absolute -right-6 bottom-10 bg-white/65 backdrop-blur-2xl border border-white/80 px-4 py-2.5 rounded-2xl shadow-2xl z-20 hidden sm:flex items-center gap-2.5 text-xs font-black text-slate-950">
                  <div className="w-7 h-7 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    🛡️
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-700 font-bold uppercase">Security Split</span>
                    <span className="text-xs text-slate-950 font-black">80% Host / 20% Fee</span>
                  </div>
                </div>

                {/* Android Smartphone Frame */}
                <div className="w-[215px] sm:w-[260px] lg:w-[290px] bg-slate-950 border-[7px] sm:border-[8px] border-slate-900 rounded-[40px] sm:rounded-[44px] shadow-2xl shadow-emerald-950/80 overflow-hidden relative border-t-[9px] border-b-[9px]">
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

          {/* How to Install Section (Transparent White Glass Box with Dark Text) */}
          <section className="mt-28 bg-white/45 backdrop-blur-2xl border border-white/60 text-slate-950 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-black text-emerald-900 uppercase tracking-widest mb-2">
                <HelpCircle className="w-4 h-4" />
                <span>Quick Setup Guide</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950">
                How to Install the APK on Android
              </h2>
              <p className="text-slate-800 mt-2 text-sm sm:text-base font-bold">
                Follow these 3 easy steps to install RopeWallet on your phone in
                less than 30 seconds:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {/* Step 1 */}
              <div className="bg-white/60 backdrop-blur-xl border border-white/70 p-6 rounded-2xl relative shadow-md">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg mb-4 shadow-md">
                  1
                </div>
                <h3 className="text-lg font-black text-slate-950 mb-2">
                  Download APK
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed font-semibold">
                  Tap the white <strong>"Download APK Now"</strong> button above
                  to save the <code>RopeWallet.apk</code> file to your device.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white/60 backdrop-blur-xl border border-white/70 p-6 rounded-2xl relative shadow-md">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg mb-4 shadow-md">
                  2
                </div>
                <h3 className="text-lg font-black text-slate-950 mb-2">
                  Allow Permission
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed font-semibold">
                  Open your phone downloads and tap the APK file. If Android
                  prompts, tap <em>Settings</em> and toggle{" "}
                  <strong>"Allow from this source"</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white/60 backdrop-blur-xl border border-white/70 p-6 rounded-2xl relative shadow-md">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg mb-4 shadow-md">
                  3
                </div>
                <h3 className="text-lg font-black text-slate-950 mb-2">
                  Install & Open
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed font-semibold">
                  Tap <strong>Install</strong>. Once completed, open
                  RopeWallet, log in or create a new account, and enjoy instant
                  payments!
                </p>
              </div>
            </div>

            {/* Play Protect Tip Note Banner (White Glass with Dark Text) */}
            <div className="mt-8 bg-white/60 backdrop-blur-xl border border-white/70 p-5 sm:p-6 rounded-2xl flex items-start gap-4 text-left shadow-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md mt-0.5 font-bold">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <span>Google Play Protect Prompt?</span>
                  <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 bg-emerald-700 text-white rounded-full">
                    Safe & Verified
                  </span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  If Android displays a <em>"Google Play Protect"</em> prompt when opening the APK, tap <strong>"Install anyway"</strong>. RopeWallet is 100% virus-scanned, 256-bit encrypted, and completely safe.
                </p>
              </div>
            </div>
          </section>

          {/* Key App Features (4 Transparent White Glass Boxes with Dark Text) */}
          <section className="mt-28">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-sm">
                Why Choose RopeWallet?
              </h2>
              <p className="text-emerald-100 mt-2 font-medium">
                Built from the ground up for speed, enterprise security, and seamless user experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              <div className="bg-white/45 backdrop-blur-2xl border border-white/60 p-6 rounded-2xl hover:bg-white/60 hover:border-white/80 hover:shadow-2xl hover:-translate-y-1 transition-all shadow-xl text-slate-950">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 border border-emerald-300 shadow-xs">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-950 mb-1">
                  Instant P2P Transfers
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed font-semibold">
                  Send & receive money instantly using <code>@userTag</code> with zero hidden fees.
                </p>
              </div>

              <div className="bg-white/45 backdrop-blur-2xl border border-white/60 p-6 rounded-2xl hover:bg-white/60 hover:border-white/80 hover:shadow-2xl hover:-translate-y-1 transition-all shadow-xl text-slate-950">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4 border border-teal-300 shadow-xs">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-950 mb-1">
                  Card Deposits
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed font-semibold">
                  Deposit funds instantly using Debit or Credit Cards with 256-bit bank encryption.
                </p>
              </div>

              <div className="bg-white/45 backdrop-blur-2xl border border-white/60 p-6 rounded-2xl hover:bg-white/60 hover:border-white/80 hover:shadow-2xl hover:-translate-y-1 transition-all shadow-xl text-slate-950">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 border border-emerald-300 shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-950 mb-1">
                  Biometric Protection
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed font-semibold">
                  Lock transactions and app access with Fingerprint ID or Face Recognition.
                </p>
              </div>

              <div className="bg-white/45 backdrop-blur-2xl border border-white/60 p-6 rounded-2xl hover:bg-white/60 hover:border-white/80 hover:shadow-2xl hover:-translate-y-1 transition-all shadow-xl text-slate-950">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4 border border-teal-300 shadow-xs">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-950 mb-1">
                  Real-Time Alerts
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed font-semibold">
                  Receive instant push notifications for every deposit, transfer, and withdrawal.
                </p>
              </div>
            </div>
          </section>

          {/* Footer Callout (Transparent White Glass Box with Dark Text) */}
          <div className="mt-28 bg-white/45 backdrop-blur-2xl border border-white/60 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl text-slate-950">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950">
              Ready to experience modern digital banking?
            </h2>
            <p className="text-slate-800 mt-2 max-w-xl mx-auto text-base font-bold">
              Download the official RopeWallet APK right now and set up your account in 60 seconds.
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href="/ropewallet.apk"
                download="RopeWallet.apk"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-lg shadow-2xl shadow-emerald-950/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                <Download className="w-6 h-6 text-white" />
                <span className="text-white font-bold">Download APK (42 MB)</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-700/60 bg-[#022c22] py-12 text-sm text-emerald-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/ropewallet.png"
              alt="RopeWallet"
              width={24}
              height={24}
              className="rounded-md"
            />
            <span className="font-black text-white">
              RopeWallet Enterprise &bull; RJN Tech
            </span>
          </div>
          <div className="flex items-center gap-6 text-emerald-100 font-bold">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/download" className="hover:text-white transition-colors">
              Download APK
            </Link>
            <a href="https://ropewallet.com" className="hover:text-white transition-colors">
              Official Site
            </a>
          </div>
          <p className="text-xs text-emerald-300/80 font-medium">
            &copy; 2026 RopeWallet & RJN Tech. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
