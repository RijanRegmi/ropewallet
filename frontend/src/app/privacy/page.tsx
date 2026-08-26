import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the RopeWallet Privacy Policy to understand how we collect, use, and protect your personal information.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    id: "information",
    title: "1. Information We Collect",
    content: `When you use RopeWallet, we collect the following types of information:

Account Information: When you create an account, we collect your email address, username, and any other information you provide during registration.

Transaction Data: We collect information about the transactions you conduct through our platform, including amounts, dates, and recipient details.

Device & Usage Data: We automatically collect information about your device, browser, IP address, and how you interact with our Service.

Payment Method Information: When you deposit funds via card, we collect the necessary payment details. Card numbers are processed by our certified payment processors — RopeWallet does not store full card numbers.`,
  },
  {
    id: "use",
    title: "2. How We Use Your Information",
    content: `We use the information we collect to:

• Process and complete your transactions, transfers, and withdrawals.
• Maintain the security and integrity of our platform.
• Detect and prevent fraud and unauthorized access.
• Communicate with you about your account, transactions, and updates.
• Improve our services, features, and user experience.
• Comply with applicable laws and legal obligations.
• Send you important notices and service-related messages.`,
  },
  {
    id: "sharing",
    title: "3. Information Sharing",
    content: `RopeWallet does not sell your personal information to third parties. We may share your information with:

Payment Processors & Financial Partners: Third-party processors that we use to execute your card charges and payouts. These partners are contractually bound to protect your information.

Legal & Compliance: Government agencies, regulators, or law enforcement when required by law, court order, or to protect the rights and safety of our users.

Service Providers: Trusted vendors who help us operate our platform (cloud hosting, analytics, customer support) under strict data processing agreements.`,
  },
  {
    id: "security",
    title: "4. Data Security",
    content: `We implement industry-standard security measures to protect your personal information, including:

• Encryption in transit (TLS/SSL) for all data transmissions.
• Secure storage practices for all account and transaction data.
• Regular security reviews and access controls.
• Fraud detection and monitoring systems.

While we take every reasonable precaution to protect your data, no system is 100% secure. We encourage you to use a strong, unique password and to keep your account credentials confidential.`,
  },
  {
    id: "retention",
    title: "5. Data Retention",
    content: `We retain your account and transaction data for as long as your account is active and as required by applicable laws and regulations. If you close your account, we may retain certain information as required by law or for legitimate business purposes, such as fraud prevention.

You may request deletion of non-legally-required data by contacting us at support@ropewallet.com.`,
  },
  {
    id: "rights",
    title: "6. Your Rights",
    content: `Depending on your location, you may have the following rights regarding your personal data:

• Access: Request a copy of the personal information we hold about you.
• Correction: Request that we correct any inaccurate or incomplete information.
• Deletion: Request that we delete your personal information, subject to legal exceptions.
• Opt-Out: Opt out of non-essential marketing communications at any time.

To exercise any of these rights, please contact us at support@ropewallet.com.`,
  },
  {
    id: "cookies",
    title: "7. Cookies",
    content: `We use essential cookies to operate our platform (session management, security tokens). We may also use analytics cookies to understand how users interact with our Service.

You can control non-essential cookies through your browser settings. Disabling essential cookies may prevent certain features of the Service from functioning properly.`,
  },
  {
    id: "children",
    title: "8. Children's Privacy",
    content: `RopeWallet is intended for users who are 18 years of age or older. We do not knowingly collect, use, or disclose personal information from individuals under 18.

If we become aware that we have collected information from a minor, we will promptly delete that data. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at support@ropewallet.com.`,
  },
  {
    id: "ccpa",
    title: "9. California Privacy Rights (CCPA)",
    content: `If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

• Right to Know: Request the categories and specific pieces of personal information we have collected about you.
• Right to Delete: Request deletion of your personal information, subject to legal exceptions.
• Right to Opt-Out of Sale: RopeWallet does not sell your personal information.
• Right to Non-Discrimination: We will not discriminate against you for exercising your privacy rights.

To submit a CCPA request, email support@ropewallet.com with the subject line "CCPA Request."`,
  },
  {
    id: "changes",
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes by email or via a notice in your account dashboard. The "Last Updated" date at the top of this page reflects the most recent revision.

Your continued use of the Service after any changes to this Privacy Policy constitutes your acceptance of the updated policy.`,
  },
  {
    id: "contact",
    title: "11. Contact Us",
    content: `If you have questions about this Privacy Policy or how we handle your data, please contact us:

• Email: support@ropewallet.com
• Website: ropewallet.com

We will make reasonable efforts to respond to your inquiries within 5 business days.`,
  },
];

export default function PrivacyPage() {
  const lastUpdated = "August 26, 2026";
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/ropewallet.png" alt="RopeWallet" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-lg tracking-tight">RopeWallet</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link href="/" className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">Home</Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full mb-6">Legal</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-white/50 text-base max-w-xl mx-auto">We are committed to protecting your privacy. This policy explains how RopeWallet collects, uses, and safeguards your personal information.</p>
          <p className="mt-4 text-sm text-white/30">Last updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Table of Contents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-purple-400/50 group-hover:bg-purple-400 transition-colors" />
                {s.title}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 scroll-mt-24">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">{section.title}</h2>
              <div className="text-white/60 text-sm sm:text-base leading-relaxed whitespace-pre-line">{section.content}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/30 text-sm">Your privacy matters to us. If you have any concerns, please do not hesitate to reach out.</p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm flex-wrap">
            <Link href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">Terms & Conditions</Link>
            <span className="text-white/20">•</span>
            <Link href="/" className="text-white/40 hover:text-white transition-colors">Back to Home</Link>
            <span className="text-white/20">•</span>
            <a href="mailto:support@ropewallet.com" className="text-white/40 hover:text-white transition-colors">Contact Us</a>
          </div>
        </div>
      </div>
    </div>
  );
}
