'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface FooterProps {
  className?: string;
  reveal?: boolean;
}

export default function Footer({ className = '', reveal = true }: FooterProps) {
  const revealClass = reveal ? 'reveal-init stagger-1' : '';

  return (
    <footer className={`border-t border-slate-200 bg-white py-12 text-xs text-slate-500 ${revealClass} ${className}`}>
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center bg-white shadow-md border border-slate-100 group-hover:scale-105 transition-transform">
              <Image
                src="/ropewallet.png"
                alt="RopeWallet Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-base block group-hover:text-emerald-600 transition-colors">
                RopeWallet
              </span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                Digital Wallet & Gateway
              </span>
            </div>
          </Link>

          {/* Social Sharing Options & Links */}
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Share & Follow:</span>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow RopeWallet on X"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-700 flex items-center justify-center transition-all hover:scale-105"
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
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 hover:text-blue-600 text-slate-700 flex items-center justify-center transition-all hover:scale-105"
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
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 hover:text-pink-600 text-slate-700 flex items-center justify-center transition-all hover:scale-105"
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
              <Image
                src="/RJN.png"
                alt="RJN Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="font-bold text-slate-800">RJN Tech</span>
          </div>

          <p>© 2026 RopeWallet Digital Wallet & Payment Gateway. All rights reserved.</p>
        </div>

        {/* Legal Links */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-200 mt-2">
          <Link
            href="/terms"
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            Terms & Conditions
          </Link>
          <span className="text-slate-200">•</span>
          <Link
            href="/privacy"
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            Privacy Policy
          </Link>
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
  );
}
