import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import FloatingNavbar from "@/components/FloatingNavbar";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Read the Terms and Conditions for using RopeWallet, the enterprise digital wallet platform for secure deposits, card payments, and instant payouts.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By downloading, installing, or using the RopeWallet application or website (collectively, the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Service. These Terms constitute a legally binding agreement between you ("User") and RopeWallet ("we," "us," or "our").

We reserve the right to modify these Terms at any time. We will notify you of material changes via email or in-app notification. Continued use of the Service after changes constitutes your acceptance of the updated Terms.`,
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    content: `You must meet the following requirements to use RopeWallet:

• You must be at least 18 years of age.
• You must be a resident of the United States of America.
• You must have the legal capacity to enter into a binding agreement.
• You must not be prohibited from using financial services under applicable law.
• You must provide accurate, complete, and current account information.`,
  },
  {
    id: "account",
    title: "3. Account Registration & Security",
    content: `To access certain features of RopeWallet, you must create an account. You agree to:

• Provide accurate and truthful registration information including a valid email address.
• Maintain the confidentiality of your account credentials, including your PIN.
• Notify us immediately at support@ropewallet.com if you suspect unauthorized access.
• Accept full responsibility for all activities that occur under your account.

We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.`,
  },
  {
    id: "wallet",
    title: "4. Wallet & Payment Services",
    content: `RopeWallet provides a digital wallet platform that allows users to:

• Deposit funds via credit, debit, or virtual card.
• Process verified card payments and manage host balances.
• Withdraw funds to a linked bank account or debit card.

All transactions are final once confirmed. You are responsible for ensuring the accuracy of recipient information before initiating any transfer. Funds in your RopeWallet balance are not FDIC-insured and do not earn interest. RopeWallet is not a bank.`,
  },
  {
    id: "fees",
    title: "5. Fees & Charges",
    content: `RopeWallet may charge fees for certain transactions and services. Current fee information is available within the application. We reserve the right to change our fee structure at any time with reasonable notice.

You are responsible for any fees charged by your bank, card issuer, or other third-party financial institutions in connection with transactions made through RopeWallet.`,
  },
  {
    id: "prohibited",
    title: "6. Prohibited Uses",
    content: `You agree NOT to use RopeWallet for any of the following:

• Illegal activities, including money laundering, fraud, or financing terrorism.
• Purchasing or selling illegal goods or services.
• Circumventing any security or fraud detection systems.
• Sending funds to sanctioned individuals, entities, or jurisdictions.
• Impersonating any person or entity.
• Using automated scripts, bots, or other tools to interact with the Service.
• Any activity that violates applicable federal, state, or local law.

Violation may result in immediate account termination and reporting to law enforcement.`,
  },
  {
    id: "hosts",
    title: "7. Host Accounts",
    content: `Certain users may apply to become "Hosts" on the RopeWallet platform. Hosts may receive funds from customers through verified card gateways. By becoming a Host, you additionally agree to:

• Use Host features solely for lawful purposes.
• Accurately represent your services to customers.
• Comply with all applicable tax obligations for income received through the platform.
• Not engage in deceptive, misleading, or fraudulent practices.

RopeWallet reserves the right to review, suspend, or terminate Host accounts at any time.`,
  },
  {
    id: "privacy",
    title: "8. Privacy",
    content: `Your use of RopeWallet is governed by our Privacy Policy, available at ropewallet.com/privacy. By using the Service, you consent to the collection and use of your information as described in the Privacy Policy.

We collect information you provide during registration (such as email address and payment method details) and information about your transactions. We do not sell your personal information to third parties.`,
  },
  {
    id: "intellectual",
    title: "9. Intellectual Property",
    content: `All content, features, and functionality of RopeWallet — including text, graphics, logos, icons, and software — are the exclusive property of RopeWallet and are protected by applicable intellectual property laws.

You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service for personal, non-commercial purposes. You may not copy, modify, distribute, sell, or lease any part of the Service without our prior written consent.`,
  },
  {
    id: "disclaimer",
    title: "10. Disclaimer of Warranties",
    content: `THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, ROPEWALLET DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.`,
  },
  {
    id: "liability",
    title: "11. Limitation of Liability",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ROPEWALLET SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL.

IN NO EVENT SHALL ROPEWALLET'S TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO ROPEWALLET IN THE TWELVE (12) MONTHS PRIOR TO THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).`,
  },
  {
    id: "termination",
    title: "12. Termination",
    content: `We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for any reason including violation of these Terms.

You may terminate your account at any time by contacting us at support@ropewallet.com. Upon termination, your right to use the Service ceases immediately. Any funds remaining in your wallet will be returned in accordance with our standard payout procedures, subject to applicable holds.`,
  },
  {
    id: "governing",
    title: "13. Governing Law & Disputes",
    content: `These Terms shall be governed by the laws of the United States, without regard to conflict of law provisions.

Any dispute arising from these Terms shall first be attempted to be resolved through informal negotiation. If that fails, disputes shall be resolved through binding arbitration per the American Arbitration Association rules. You waive any right to participate in a class action lawsuit or class-wide arbitration.`,
  },
  {
    id: "contact",
    title: "14. Contact Us",
    content: `If you have questions about these Terms and Conditions, please contact us:

• Email: support@ropewallet.com
• Website: ropewallet.com

We will respond to your inquiries within 5 business days.`,
  },
];

export default function TermsPage() {
  const lastUpdated = "August 28, 2026";
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-300 selection:text-slate-950">
      {/* Floating White Glass Navbar */}
      <FloatingNavbar
        accentColor="emerald"
        ctaLabel="Become a Host"
        ctaHref="/#become-host"
        navItems={[
          { label: 'Become a Host', href: '/#become-host' },
          { label: 'Mobile App', href: '/#mobile-app' },
          { label: 'Features', href: '/#features' },
          { label: 'How It Works', href: '/#how-it-works' },
          { label: 'Download App', href: '/download', badge: 'APK' },
        ]}
      />

      {/* SECTION 1 (WHITE): Legal Header Hero */}
      <section className="bg-white text-slate-900 pt-36 pb-16 px-4 text-center relative overflow-hidden">
        {/* Subtle Background Pattern & Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <span className="inline-block text-xs font-black tracking-widest uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full mb-6 shadow-xs">
            Legal &amp; Compliance
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight mb-4">
            Terms &amp; Conditions
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Please read these terms carefully before using RopeWallet. By using our service, you agree to be bound by these terms.
          </p>
          <p className="mt-4 text-sm text-emerald-700 font-bold">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* SECTION 2 (WHITE): Table of Contents & Legal Clauses */}
      <section className="py-20 bg-white text-slate-900 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Table of Contents */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 mb-12 shadow-sm">
            <h2 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4">
              Table of Contents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-sm text-slate-900 hover:text-emerald-700 font-bold transition-colors flex items-center gap-2.5 group"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600 group-hover:scale-125 transition-transform shrink-0" />
                  <span>{s.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Legal Sections */}
          <div className="space-y-8">
            {sections.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="bg-slate-50/60 border border-slate-200 rounded-3xl p-6 sm:p-8 scroll-mt-24 shadow-sm hover:shadow-md transition-all"
              >
                <h2 className="text-xl sm:text-2xl font-black mb-4 text-slate-950">
                  {section.title}
                </h2>
                <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 (GREEN): Summary & Quick Links */}
      <section className="bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#064E3B] text-white py-16 text-center border-t border-emerald-600/50 relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <p className="text-emerald-50 text-base font-bold leading-relaxed mb-6">
            By using RopeWallet, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm flex-wrap font-bold text-white">
            <Link href="/privacy" className="hover:text-emerald-200 underline transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/40">•</span>
            <Link href="/" className="text-emerald-100 hover:text-white transition-colors">
              Back to Home
            </Link>
            <span className="text-white/40">•</span>
            <a href="mailto:support@ropewallet.com" className="text-emerald-100 hover:text-white transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 4 (FOOTER - DARK FOREST GREEN) */}
      <footer className="border-t border-emerald-800/60 bg-[#022c22] py-12 text-sm text-emerald-200">
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
            &copy; 2026 RopeWallet &amp; RJN Tech. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
