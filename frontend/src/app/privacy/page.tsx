import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import FloatingNavbar from "@/components/FloatingNavbar";

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
• Right to Opt-Out: We do not sell your personal information, so no opt-out is necessary.
• Non-Discrimination: We will not discriminate against you for exercising your CCPA rights.

To exercise these rights, email us at privacy@ropewallet.com with "CCPA Request" in the subject line.`,
  },
  {
    id: "changes",
    title: "10. Changes to This Privacy Policy",
    content: `We may update this Privacy Policy periodically. We will notify you of material changes by posting the new policy on this page with an updated "Last Updated" date, and via email or in-app notification when appropriate.

Your continued use of RopeWallet after changes are posted constitutes your acceptance of the updated Privacy Policy.`,
  },
  {
    id: "contact",
    title: "11. Contact Us",
    content: `For questions, concerns, or requests regarding this Privacy Policy:

• Email: privacy@ropewallet.com
• Support: support@ropewallet.com
• Website: ropewallet.com

We will respond to all inquiries within 5 business days.`,
  },
];

export default function PrivacyPage() {
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

      {/* SECTION 1 (WHITE): Header Hero */}
      <section className="bg-white text-slate-900 pt-36 pb-16 px-4 text-center relative overflow-hidden">
        {/* Subtle Background Pattern & Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <span className="inline-block text-xs font-black tracking-widest uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full mb-6 shadow-xs">
            Privacy &amp; Data Protection
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            We value your trust and are committed to protecting your personal information. Read our privacy practices below.
          </p>
          <p className="mt-4 text-sm text-emerald-700 font-bold">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* SECTION 2 (WHITE): Table of Contents & Policy Sections */}
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

          {/* Policy Sections */}
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
            If you have questions about how RopeWallet collects or uses your information, reach out to our privacy team.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm flex-wrap font-bold text-white">
            <Link href="/terms" className="hover:text-emerald-200 underline transition-colors">
              Terms &amp; Conditions
            </Link>
            <span className="text-white/40">•</span>
            <Link href="/" className="text-emerald-100 hover:text-white transition-colors">
              Back to Home
            </Link>
            <span className="text-white/40">•</span>
            <a href="mailto:privacy@ropewallet.com" className="text-emerald-100 hover:text-white transition-colors">
              Contact Privacy Team
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
