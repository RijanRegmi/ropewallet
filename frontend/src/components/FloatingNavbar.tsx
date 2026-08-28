'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight, UserPlus, Download } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
  badge?: string;
}

interface FloatingNavbarProps {
  brandNameFirst?: string;
  brandNameSecond?: string;
  subTitle?: string;
  logoImg?: string;
  navItems?: NavItem[];
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  accentColor?: 'emerald' | 'purple' | 'blue' | 'indigo';
  theme?: 'light' | 'dark';
}

const defaultNavItems: NavItem[] = [
  { label: 'Gateways', href: '#gateways' },
  { label: 'Become a Host', href: '#become-host' },
  { label: 'Mobile App', href: '#mobile-app' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Download App', href: '/download', badge: 'APK' },
];

export default function FloatingNavbar({
  brandNameFirst = 'Rope',
  brandNameSecond = 'Wallet',
  logoImg = '/ropewallet.png',
  navItems = defaultNavItems,
  ctaLabel = 'Become a Host',
  ctaHref = '#become-host',
  ctaOnClick,
  accentColor = 'emerald',
  theme = 'light',
}: FloatingNavbarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);

    const handleScroll = () => {
      if (window.scrollY > 25) {
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

  const scrollToTop = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      return; // Let Link navigate to '/'
    }
    e.preventDefault();
    setActiveIndex(null);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, index?: number) => {
    if (index !== undefined) setActiveIndex(index);
    setMobileMenuOpen(false);

    // If it's a direct route without hash (e.g. '/download')
    if (href.startsWith('/') && !href.includes('#')) {
      return; // Let standard link navigation proceed
    }

    // It is a hash target like '#gateways' or '/#gateways'
    const hashPart = href.includes('#') ? href.split('#')[1] : '';
    if (!hashPart) return;

    if (typeof window !== 'undefined') {
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
      if (isHomePage) {
        e.preventDefault();
        if (hashPart === 'hero' || hashPart === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const elem = document.getElementById(hashPart);
          if (elem) {
            elem.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } else {
        // We are on /download, /terms, /privacy etc -> navigate to home with hash
        window.location.href = `/#${hashPart}`;
      }
    }
  };

  const isDark = theme === 'dark';

  // Theme styling definitions
  const themeStyles = {
    emerald: {
      textAccent: 'text-emerald-500',
      subTitle: 'text-emerald-500',
      hoverPillBg: isDark
        ? 'bg-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-500/10 border border-emerald-500/30'
        : 'bg-emerald-500/15 text-emerald-950 shadow-md shadow-emerald-500/10 border border-emerald-500/25',
      activePillBg: isDark
        ? 'bg-emerald-500/30 text-emerald-200 font-bold border border-emerald-500/40'
        : 'bg-emerald-500/20 text-emerald-950 font-bold border border-emerald-500/30',
      ctaBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50',
      badge: isDark
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    },
    purple: {
      textAccent: 'text-[#7C3AED]',
      subTitle: 'text-[#7C3AED]',
      hoverPillBg: isDark
        ? 'bg-purple-500/20 text-purple-300 shadow-md shadow-purple-500/10 border border-purple-500/30'
        : 'bg-[#EDE9FE]/95 text-[#5B21B6] shadow-md shadow-purple-500/10 border border-purple-200/80',
      activePillBg: isDark
        ? 'bg-purple-500/30 text-purple-200 font-bold border border-purple-500/40'
        : 'bg-[#EDE9FE] text-[#5B21B6] font-bold border border-purple-300',
      ctaBtn: 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold shadow-lg shadow-[#6D28D9]/30 hover:shadow-[#6D28D9]/50',
      badge: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200',
    },
    indigo: {
      textAccent: 'text-indigo-500',
      subTitle: 'text-indigo-500',
      hoverPillBg: isDark
        ? 'bg-indigo-500/20 text-indigo-300 shadow-md shadow-indigo-500/10 border border-indigo-500/30'
        : 'bg-indigo-50/90 text-indigo-900 shadow-md shadow-indigo-500/10 border border-indigo-200/80',
      activePillBg: isDark
        ? 'bg-indigo-500/30 text-indigo-200 font-bold border border-indigo-500/40'
        : 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-300',
      ctaBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50',
      badge: isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    blue: {
      textAccent: 'text-blue-500',
      subTitle: 'text-blue-500',
      hoverPillBg: isDark
        ? 'bg-blue-500/20 text-blue-300 shadow-md shadow-blue-500/10 border border-blue-500/30'
        : 'bg-blue-50/90 text-blue-900 shadow-md shadow-blue-500/10 border border-blue-200/80',
      activePillBg: isDark
        ? 'bg-blue-500/30 text-blue-200 font-bold border border-blue-500/40'
        : 'bg-blue-100 text-blue-900 font-bold border border-blue-300',
      ctaBtn: 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50',
      badge: isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-200',
    },
  }[accentColor];

  // Nav item text color
  const navTextClass = 'text-slate-800 hover:text-slate-950';
  const brandFirstClass = 'text-slate-950';

  return (
    <header className="sticky top-2.5 sm:top-4 z-50 w-full px-2 sm:px-4 md:px-6 pointer-events-none transition-all duration-500">
      {/* Container smoothly expands at top and remains comfortably spacious on scroll */}
      <div
        className={`mx-auto pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'max-w-[1240px] w-full' : 'max-w-[1380px] w-full'
          }`}
      >
        {/* Consistent Semi-Transparent White Frosted Glass Floating Pill Container */}
        <div
          className="relative rounded-full px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between transition-all duration-500 gap-2 sm:gap-3 lg:gap-4 bg-white/65 backdrop-blur-2xl sm:backdrop-blur-3xl border border-white/75 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12),inset_0_1px_1.5px_rgba(255,255,255,0.7)]"
        >
          {/* 1. Left: Animated Splitting Logo with Smooth Scroll to Very Top */}
          <Link
            href="/"
            onClick={scrollToTop}
            className="flex items-center group cursor-pointer select-none shrink-0 pl-1 sm:pl-2"
            title="RopeWallet Home"
          >
            {/* 3D Animated Logo Icon */}
            <div
              className={`relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0 border border-slate-800 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:rotate-1 ${isScrolled || !isLoaded
                ? 'scale-95 shadow-md shadow-slate-950/20'
                : 'scale-105 shadow-xl shadow-slate-900/30'
                }`}
            >
              <img
                src={logoImg}
                alt="RopeWallet Logo"
                width={44}
                height={44}
                decoding="async"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            {/* Splitting Brand Text: Emerges & splits out from behind the logo icon */}
            <div
              className={`flex flex-col justify-center overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left ${isScrolled || !isLoaded
                ? 'max-w-0 opacity-0 -translate-x-6 scale-90 pointer-events-none'
                : 'max-w-[260px] opacity-100 translate-x-0 scale-100 ml-3 sm:ml-3.5'
                }`}
            >
              <div className="flex items-baseline font-black tracking-tight text-xl sm:text-2xl leading-none whitespace-nowrap">
                <span className={brandFirstClass}>{brandNameFirst}</span>
                <span className={themeStyles.textAccent}>{brandNameSecond}</span>
              </div>
            </div>
          </Link>

          {/* 2. Middle: Single-Line Nav Items with 3D Pop-Up Hover Effect */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 text-[13px] xl:text-[14.5px] font-bold shrink-0">
            {navItems.map((item, index) => {
              const isHovered = hoveredIndex === index;
              const isActive = activeIndex === index;

              return (
                <div
                  key={item.label}
                  className="relative shrink-0"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {item.href.startsWith('/') && !item.href.includes('#') ? (
                    <Link
                      href={item.href}
                      className={`relative z-10 px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-full flex items-center gap-1.5 select-none transition-all duration-200 ease-out cursor-pointer whitespace-nowrap ${isHovered
                        ? `${themeStyles.hoverPillBg} -translate-y-0.5 scale-105 font-extrabold`
                        : isActive
                          ? `${themeStyles.activePillBg} -translate-y-0.2 scale-[1.02]`
                          : navTextClass
                        }`}
                    >
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full border whitespace-nowrap ${themeStyles.badge}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href, index)}
                      className={`relative z-10 px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-full flex items-center gap-1.5 select-none transition-all duration-200 ease-out cursor-pointer whitespace-nowrap ${isHovered
                        ? `${themeStyles.hoverPillBg} -translate-y-0.5 scale-105 font-extrabold`
                        : isActive
                          ? `${themeStyles.activePillBg} -translate-y-0.2 scale-[1.02]`
                          : navTextClass
                        }`}
                    >
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full border whitespace-nowrap ${themeStyles.badge}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </a>
                  )}
                </div>
              );
            })}
          </nav>

          {/* 3. Right: High-Impact Single-Line Pill CTA Button with White Text */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pr-1 sm:pr-1.5">
            {ctaHref.startsWith('/') && !ctaHref.includes('#') ? (
              <Link
                href={ctaHref}
                onClick={ctaOnClick}
                className={`hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 select-none whitespace-nowrap shrink-0 ${themeStyles.ctaBtn}`}
              >
                <UserPlus className="w-4 h-4 shrink-0 text-white" />
                <span className="whitespace-nowrap text-white font-bold">{ctaLabel}</span>
              </Link>
            ) : (
              <a
                href={ctaHref}
                onClick={(e) => {
                  if (ctaOnClick) {
                    ctaOnClick();
                  } else {
                    handleNavClick(e, ctaHref, 999);
                  }
                }}
                className={`hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 select-none cursor-pointer whitespace-nowrap shrink-0 ${themeStyles.ctaBtn}`}
              >
                <UserPlus className="w-4 h-4 shrink-0 text-white" />
                <span className="whitespace-nowrap text-white font-bold">{ctaLabel}</span>
              </a>
            )}

            {/* Mobile Menu Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-full transition-colors cursor-pointer shrink-0 ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100/80'
                }`}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 4. Responsive Mobile Glassmorphic Drawer */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden mt-2 rounded-3xl p-5 shadow-2xl space-y-2 animate-in fade-in slide-in-from-top-3 duration-200 border ${isDark
              ? 'bg-[#0B0F1A]/95 backdrop-blur-2xl border-white/15 text-white'
              : 'bg-white/90 backdrop-blur-2xl border-slate-200/90 text-slate-900'
              }`}
          >
            {navItems.map((item, index) => (
              <div key={item.label}>
                {item.href.startsWith('/') && !item.href.includes('#') ? (
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-[15px] font-bold transition-colors whitespace-nowrap ${isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-800 hover:bg-emerald-500/10'
                      }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${themeStyles.badge}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href, index)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-[15px] font-bold transition-colors cursor-pointer whitespace-nowrap ${isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-800 hover:bg-emerald-500/10'
                      }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${themeStyles.badge}`}>
                        {item.badge}
                      </span>
                    )}
                  </a>
                )}
              </div>
            ))}

            <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-100/80'}`}>
              <a
                href={ctaHref}
                onClick={(e) => handleNavClick(e, ctaHref, 999)}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white shadow-md transition-all whitespace-nowrap ${themeStyles.ctaBtn}`}
              >
                <UserPlus className="w-4 h-4 shrink-0 text-white" />
                <span className="text-white font-bold">{ctaLabel}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
