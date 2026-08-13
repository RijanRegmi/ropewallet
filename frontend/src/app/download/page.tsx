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

export const metadata = {
  title: "Download RopeWallet App for Android | Direct APK Download",
  description:
    "Download the official RopeWallet Android app (APK). Instant P2P money transfers, card deposits, biometric security, and 256-bit encrypted digital wallet.",
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-teal-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[32rem] h-[32rem] bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#070A12]/90 backdrop-blur-md border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform duration-300 border border-slate-800">
              <Image
                src="/ropewallet.png"
                alt="RopeWallet Logo"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent leading-none">
                RopeWallet
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">
                ENTERPRISE WALLET
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <Link
              href="/download"
              className="text-emerald-400 font-bold flex items-center gap-1.5"
            >
              <span>Download App</span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                APK
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/ropewallet.apk"
              download="RopeWallet.apk"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Get APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>OFFICIAL ANDROID RELEASE &bull; VERIFIED & SIGNED</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
                Download{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                  RopeWallet
                </span>{" "}
                for Android
              </h1>

              {/* Description */}
              <p className="text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-lg shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <Download className="w-6 h-6 group-hover:bounce" />
                  <span>Download APK Now</span>
                  <span className="text-xs px-2.5 py-1 bg-slate-950/20 text-slate-950 font-extrabold rounded-lg ml-1">
                    42 MB
                  </span>
                </a>
              </div>

              {/* Technical Specifications Specs Bar */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left max-w-xl mx-auto lg:mx-0">
                <div className="bg-slate-900/40 border border-slate-800/60 p-3.5 rounded-xl">
                  <div className="text-xs text-slate-400 font-medium">Version</div>
                  <div className="text-sm font-semibold text-slate-100 mt-0.5">
                    v1.0.0 (Build 2)
                  </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/60 p-3.5 rounded-xl">
                  <div className="text-xs text-slate-400 font-medium">File Size</div>
                  <div className="text-sm font-semibold text-slate-100 mt-0.5">
                    42.0 MB
                  </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/60 p-3.5 rounded-xl">
                  <div className="text-xs text-slate-400 font-medium">Requirement</div>
                  <div className="text-sm font-semibold text-slate-100 mt-0.5">
                    Android 8.0+
                  </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/60 p-3.5 rounded-xl">
                  <div className="text-xs text-slate-400 font-medium">Security</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Scanned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Mobile Phone Device Mockup Column (Matches Home Page UI/UX) */}
            <div className="lg:col-span-5 relative flex justify-center items-center mt-10 lg:mt-0">
              <div className="relative animate-float">
                {/* Background Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-500/20 rounded-[60px] blur-2xl pointer-events-none" />

                {/* Floating Badge 1 (Top Left) */}
                <div className="absolute -left-6 top-8 bg-slate-900/95 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-2xl shadow-xl z-20 hidden sm:flex items-center gap-2.5 text-xs font-extrabold text-white">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    ⚡
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-semibold uppercase">Verification</span>
                    <span className="text-xs text-emerald-400">Instant &lt;3s Settlement</span>
                  </div>
                </div>

                {/* Floating Badge 2 (Bottom Right) */}
                <div className="absolute -right-6 bottom-10 bg-slate-900/95 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-2xl shadow-xl z-20 hidden sm:flex items-center gap-2.5 text-xs font-extrabold text-white">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    🛡️
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-semibold uppercase">Security Split</span>
                    <span className="text-xs text-indigo-300">80% Host / 20% Fee</span>
                  </div>
                </div>

                {/* Android Smartphone Frame (Compact & Sleek matching Home Page) */}
                <div className="w-[215px] sm:w-[260px] lg:w-[290px] bg-slate-950 border-[7px] sm:border-[8px] border-slate-900 rounded-[40px] sm:rounded-[44px] shadow-2xl shadow-slate-950/80 overflow-hidden relative border-t-[9px] border-b-[9px]">
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

          {/* How to Install Section */}
          <section className="mt-28 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 sm:p-12 relative overflow-hidden backdrop-blur-md">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">
                <HelpCircle className="w-4 h-4" />
                <span>Quick Setup Guide</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white">
                How to Install the APK on Android
              </h2>
              <p className="text-slate-400 mt-2 text-sm sm:text-base">
                Follow these 3 easy steps to install RopeWallet on your phone in
                less than 30 seconds:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {/* Step 1 */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-lg mb-4 border border-emerald-500/30">
                  1
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Download APK
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Tap the green <strong>"Download APK Now"</strong> button above
                  to save the <code>RopeWallet.apk</code> file to your device.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-lg mb-4 border border-emerald-500/30">
                  2
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Allow Permission
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Open your phone downloads and tap the APK file. If Android
                  prompts, tap <em>Settings</em> and toggle{" "}
                  <strong>"Allow from this source"</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-lg mb-4 border border-emerald-500/30">
                  3
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Install & Open
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Tap <strong>Install</strong>. Once completed, open
                  RopeWallet, log in or create a new account, and enjoy instant
                  payments!
                </p>
              </div>
            </div>

            {/* Play Protect Tip Note Banner */}
            <div className="mt-8 bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-teal-950/60 border border-emerald-500/30 p-5 sm:p-6 rounded-2xl flex items-start gap-4 text-left shadow-lg backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <span>Google Play Protect Prompt?</span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    Safe & Verified
                  </span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  If Android displays a <em>"Google Play Protect"</em> prompt when opening the APK, tap <strong>"Install anyway"</strong>. RopeWallet is 100% virus-scanned, 256-bit encrypted, and completely safe.
                </p>
              </div>
            </div>
          </section>

          {/* Key App Features */}
          <section className="mt-28">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-white">
                Why Choose RopeWallet?
              </h2>
              <p className="text-slate-400 mt-2">
                Built from the ground up for speed, enterprise security, and seamless user experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Instant P2P Transfers
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Send & receive money instantly using <code>@userTag</code> with zero hidden fees.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Card Deposits
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Deposit funds instantly using Debit or Credit Cards with 256-bit bank encryption.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Biometric Protection
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Lock transactions and app access with Fingerprint ID or Face Recognition.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Real-Time Alerts
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Receive instant push notifications for every deposit, transfer, and withdrawal.
                </p>
              </div>
            </div>
          </section>

          {/* Footer Callout */}
          <div className="mt-28 bg-gradient-to-r from-emerald-900/40 via-slate-900 to-teal-900/40 border border-emerald-500/20 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <h2 className="text-3xl font-extrabold text-white">
              Ready to experience modern digital banking?
            </h2>
            <p className="text-slate-300 mt-2 max-w-xl mx-auto text-base">
              Download the official RopeWallet APK right now and set up your account in 60 seconds.
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href="/ropewallet.apk"
                download="RopeWallet.apk"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-lg shadow-xl shadow-emerald-500/25 transition-all duration-300 transform hover:-translate-y-1"
              >
                <Download className="w-6 h-6" />
                <span>Download APK (42 MB)</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#04060C] py-12 text-sm text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/ropewallet.png"
              alt="RopeWallet"
              width={24}
              height={24}
              className="rounded-md"
            />
            <span className="font-semibold text-slate-200">
              RopeWallet Enterprise &bull; RJN Tech
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <Link href="/download" className="hover:text-emerald-400 transition-colors">
              Download APK
            </Link>
            <a href="https://ropewallet.com" className="hover:text-emerald-400 transition-colors">
              Official Site
            </a>
          </div>
          <p className="text-xs text-slate-500">
            &copy; 2026 RopeWallet & RJN Tech. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
