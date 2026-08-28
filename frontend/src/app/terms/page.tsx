import type { Metadata } from "next";
import Link from "next/link";
import FloatingNavbar from "@/components/FloatingNavbar";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Read the Terms and Conditions for using RopeWallet, the enterprise digital wallet platform for secure deposits, P2P transfers, and instant payouts.",
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

• Deposit funds via credit or debit card.
• Send and receive money to other RopeWallet users via QR code or user tag (P2P transfers).
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
    content: `Certain users may apply to become "Hosts" on the RopeWallet platform. Hosts may receive funds from multiple customers through the platform. By becoming a Host, you additionally agree to:

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
  const lastUpdated = "August 26, 2026";
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#059669] via-[#047857] to-[#064E3B] text-white selection:bg-emerald-300 selection:text-slate-950 relative">
      {/* Background Ambient Glows (Isolated in fixed overflow container) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-300/25 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-teal-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[32rem] h-[32rem] bg-emerald-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Floating White Glass Navbar */}
      <FloatingNavbar
        accentColor="emerald"
        ctaLabel="Become a Host"
        ctaHref="/#become-host"
        navItems={[
          { label: 'Gateways', href: '/#gateways' },
          { label: 'Become a Host', href: '/#become-host' },
          { label: 'Mobile App', href: '/#mobile-app' },
          { label: 'Features', href: '/#features' },
          { label: 'How It Works', href: '/#how-it-works' },
          { label: 'Download App', href: '/download', badge: 'APK' },
        ]}
      />

      <div className="pt-32 pb-16 px-4 text-center relative overflow-hidden z-10">
        <div className="relative">
          <span className="inline-block text-xs font-black tracking-widest uppercase text-white bg-white/20 border border-white/30 px-4 py-1.5 rounded-full mb-6 shadow-md backdrop-blur-md">Legal</span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-md">Terms &amp; Conditions</h1>
          <p className="text-emerald-50 text-base max-w-xl mx-auto font-medium drop-shadow-xs">Please read these terms carefully before using RopeWallet. By using our service, you agree to be bound by these terms.</p>
          <p className="mt-4 text-sm text-emerald-100 font-medium">Last updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 relative z-10">
        {/* Table of Contents (Transparent White Glass Box) */}
        <div className="bg-white/15 backdrop-blur-2xl border border-white/25 text-white rounded-3xl p-6 sm:p-8 mb-10 shadow-2xl">
          <h2 className="text-sm font-black text-emerald-200 uppercase tracking-widest mb-4">Table of Contents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-sm text-emerald-100 hover:text-white font-bold transition-colors flex items-center gap-2 group">
                <span className="w-2 h-2 rounded-full bg-emerald-300 group-hover:scale-125 transition-transform" />
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Legal Sections (Transparent White Glass Boxes) */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="bg-white/15 backdrop-blur-2xl border border-white/25 text-white rounded-3xl p-6 sm:p-8 scroll-mt-24 shadow-xl">
              <h2 className="text-xl sm:text-2xl font-black mb-4 text-white drop-shadow-sm">{section.title}</h2>
              <div className="text-emerald-100/95 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">{section.content}</div>
            </div>
          ))}
        </div>

        {/* Bottom Callout */}
        <div className="mt-12 text-center bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/25 shadow-lg">
          <p className="text-emerald-50 text-sm font-medium">By using RopeWallet, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm flex-wrap font-bold">
            <Link href="/privacy" className="text-white hover:text-emerald-200 underline transition-colors">Privacy Policy</Link>
            <span className="text-white/40">•</span>
            <Link href="/" className="text-emerald-100 hover:text-white transition-colors">Back to Home</Link>
            <span className="text-white/40">•</span>
            <a href="mailto:support@ropewallet.com" className="text-emerald-100 hover:text-white transition-colors">Contact Us</a>
          </div>
        </div>
      </div>
    </div>
  );
}
