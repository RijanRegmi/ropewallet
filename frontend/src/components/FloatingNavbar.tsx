'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeHref, setActiveHref] = useState<string>('');
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const lastClickTimeRef = React.useRef<number>(0);

  useEffect(() => {
    if (!pathname || pathname !== '/') {
      // On subpages like /download, /terms, /privacy:
      setActiveHref(pathname || '');
      return;
    }

    // Check on landing page if initial hash exists on mount
    if (typeof window !== 'undefined' && window.location.hash) {
      const initialHash = window.location.hash;
      setActiveHref(initialHash);
      lastClickTimeRef.current = Date.now();
      const hashId = initialHash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(hashId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }

    // On Landing Page ('/'): Real-time scroll spy that tracks the active section dynamically
    const handleActiveSection = () => {
      // If user recently clicked a nav item, preserve the clicked mark during smooth scroll
      if (Date.now() - lastClickTimeRef.current < 900) {
        return;
      }

      const becomeHostEl = document.getElementById('become-host');
      const mobileAppEl = document.getElementById('mobile-app');
      const featuresEl = document.getElementById('features');
      const howItWorksEl = document.getElementById('how-it-works');

      const scrollPos = window.scrollY + 220;

      if (howItWorksEl && scrollPos >= howItWorksEl.offsetTop - 120) {
        setActiveHref('#how-it-works');
      } else if (featuresEl && scrollPos >= featuresEl.offsetTop - 120) {
        setActiveHref('#features');
      } else if (mobileAppEl && scrollPos >= mobileAppEl.offsetTop - 120) {
        setActiveHref('#mobile-app');
      } else if (becomeHostEl && scrollPos >= becomeHostEl.offsetTop - 120) {
        setActiveHref('#become-host');
      } else {
        setActiveHref('');
      }
    };

    handleActiveSection();
    window.addEventListener('scroll', handleActiveSection, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleActiveSection);
    };
  }, [pathname]);

  useEffect(() => {
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
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      return; // Let Link navigate to '/'
    }
    e.preventDefault();
    setActiveHref('');
    lastClickTimeRef.current = Date.now();
    if (typeof window !== 'undefined') {
      history.replaceState(null, '', '/');
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setActiveHref(href);
    setClickedItem(href);
    setTimeout(() => setClickedItem(null), 450);
    lastClickTimeRef.current = Date.now();
    setMobileMenuOpen(false);

    // If it's a direct route without hash (e.g. '/download')
    if (href.startsWith('/') && !href.includes('#')) {
      return; // Let standard link navigation proceed
    }

    // It is a hash target like '#features' or '/#features'
    const hashPart = href.includes('#') ? href.split('#')[1] : '';
    if (!hashPart) return;

    if (typeof window !== 'undefined') {
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
      if (isHomePage) {
        e.preventDefault();
        const elem = document.getElementById(hashPart);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
          history.replaceState(null, '', `#${hashPart}`);
        }
      } else {
        // We are on /download, /terms, /privacy etc -> navigate to home with hash
        window.location.href = `/#${hashPart}`;
      }
    }
  };

  const isDark = theme === 'dark';

  // Theme styling definitions (Clean, compact, non-bold typography)
  const themeStyles = {
    emerald: {
      textAccent: 'text-emerald-500',
      subTitle: 'text-emerald-500',
      hoverPillBg: isDark
        ? 'bg-emerald-500/20 text-emerald-300'
        : 'bg-emerald-500/15 text-emerald-950',
      activePillBg: isDark
        ? 'bg-emerald-500/20 text-emerald-200'
        : 'bg-emerald-500/15 text-emerald-950',
      ctaBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold',
      badge: isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500/15 text-emerald-700',
    },
    purple: {
      textAccent: 'text-[#7C3AED]',
      subTitle: 'text-[#7C3AED]',
      hoverPillBg: isDark
        ? 'bg-purple-500/20 text-purple-300'
        : 'bg-[#EDE9FE] text-[#5B21B6]',
      activePillBg: isDark
        ? 'bg-purple-500/20 text-purple-200'
        : 'bg-[#EDE9FE]/80 text-[#5B21B6]',
      ctaBtn: 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-semibold',
      badge: isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700',
    },
    indigo: {
      textAccent: 'text-indigo-500',
      subTitle: 'text-indigo-500',
      hoverPillBg: isDark
        ? 'bg-indigo-500/20 text-indigo-300'
        : 'bg-indigo-100 text-indigo-950',
      activePillBg: isDark
        ? 'bg-indigo-500/20 text-indigo-200'
        : 'bg-indigo-100/80 text-indigo-900',
      ctaBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold',
      badge: isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700',
    },
    blue: {
      textAccent: 'text-blue-500',
      subTitle: 'text-blue-500',
      hoverPillBg: isDark
        ? 'bg-blue-500/20 text-blue-300'
        : 'bg-blue-100 text-blue-950',
      activePillBg: isDark
        ? 'bg-blue-500/20 text-blue-200'
        : 'bg-blue-100/80 text-blue-900',
      ctaBtn: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold',
      badge: isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700',
    },
  }[accentColor];

  // Nav item text color (Non-bold, clean font-medium)
  const navTextClass = 'text-slate-700 hover:text-slate-950 font-medium';
  const brandFirstClass = 'text-slate-950';

  return (
    <header className="sticky top-2.5 sm:top-4 z-50 w-full px-2 sm:px-4 md:px-6 pointer-events-none transition-all duration-500">
      {/* Centered spacious container */}
      <div
        className={`mx-auto flex flex-col items-center pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'max-w-[1240px] w-full' : 'max-w-[1380px] w-full'
          }`}
      >
        {/* Transparent Frosted Glass Floating Pill Container */}
        <div className="relative rounded-full px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 bg-white/70 backdrop-blur-2xl sm:backdrop-blur-3xl border border-white/75 shadow-lg shadow-slate-900/5 w-full overflow-hidden animate-navbar-glass-reveal">
          
          {/* Inner Content: Laid out uncompressed and revealed cleanly in place */}
          <div className="w-full flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
            {/* 1. Left: Animated Splitting Logo with Smooth Scroll to Very Top */}
            <Link
              href="/"
              onClick={scrollToTop}
              className="flex items-center group cursor-pointer select-none shrink-0 pl-1 sm:pl-2"
              title="RopeWallet Home"
            >
              {/* 3D Animated Logo Icon (Clean, no dark smudge shadow) */}
              <div
                className={`relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0 border border-slate-800/80 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:rotate-1 ${isScrolled
                  ? 'scale-95'
                  : 'scale-105'
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
                className={`flex flex-col justify-center overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left ${isScrolled
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

          {/* 2. Middle: Single-Line Nav Items with Clean Font-Medium & Click/Hover Pulse */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 text-[13.5px] xl:text-[14.5px] font-medium shrink-0">
            {navItems.map((item, index) => {
              const isHovered = hoveredIndex === index;
              const isActive = (item.href.startsWith('/') && pathname === item.href) || activeHref === item.href;
              const isClicked = clickedItem === item.href;

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
                      onClick={() => {
                        setClickedItem(item.href);
                        setTimeout(() => setClickedItem(null), 450);
                      }}
                      className={`relative px-3.5 xl:px-4 py-1.5 xl:py-2 rounded-full flex items-center gap-1.5 select-none transition-all duration-200 ease-out cursor-pointer whitespace-nowrap outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${isHovered
                        ? themeStyles.hoverPillBg
                        : isActive
                          ? themeStyles.activePillBg
                          : navTextClass
                        }`}
                    >
                      <span
                        className={`whitespace-nowrap inline-block transition-colors duration-200 ${
                          isClicked
                            ? 'animate-nav-click-zoom text-slate-950'
                            : isHovered
                              ? 'animate-nav-pulse text-slate-950'
                              : isActive
                                ? 'text-slate-950 font-medium'
                                : ''
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-full whitespace-nowrap ${themeStyles.badge}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={`relative px-3.5 xl:px-4 py-1.5 xl:py-2 rounded-full flex items-center gap-1.5 select-none transition-all duration-200 ease-out cursor-pointer whitespace-nowrap outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${isHovered
                        ? themeStyles.hoverPillBg
                        : isActive
                          ? themeStyles.activePillBg
                          : navTextClass
                        }`}
                    >
                      <span
                        className={`whitespace-nowrap inline-block transition-colors duration-200 ${
                          isClicked
                            ? 'animate-nav-click-zoom text-slate-950'
                            : isHovered
                              ? 'animate-nav-pulse text-slate-950'
                              : isActive
                                ? 'text-slate-950 font-medium'
                                : ''
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-full whitespace-nowrap ${themeStyles.badge}`}
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
                className={`hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 select-none whitespace-nowrap shrink-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${themeStyles.ctaBtn}`}
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
                    handleNavClick(e, ctaHref);
                  }
                }}
                className={`hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 select-none cursor-pointer whitespace-nowrap shrink-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${themeStyles.ctaBtn}`}
              >
                <UserPlus className="w-4 h-4 shrink-0 text-white" />
                <span className="whitespace-nowrap text-white font-bold">{ctaLabel}</span>
              </a>
            )}

            {/* Mobile Menu Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2.5 rounded-full transition-all duration-300 cursor-pointer shrink-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${mobileMenuOpen
                ? 'bg-slate-900 text-white rotate-90 scale-105'
                : 'text-slate-800 hover:bg-slate-100/90'
                }`}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

        {/* 4. Responsive Mobile Glassmorphic Drawer (Smooth downward expansion in a clean rounded-3xl card) */}
        <div
          className={`lg:hidden w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${mobileMenuOpen
            ? 'max-h-[520px] opacity-100 translate-y-0 mt-2.5'
            : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'
            }`}
        >
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-3xl p-5 space-y-1.5">
            {navItems.map((item, index) => (
              <div key={item.label}>
                {item.href.startsWith('/') && !item.href.includes('#') ? (
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl text-[15px] font-bold text-slate-800 hover:text-slate-950 hover:bg-emerald-500/15 transition-all whitespace-nowrap"
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
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl text-[15px] font-bold text-slate-800 hover:text-slate-950 hover:bg-emerald-500/15 transition-all cursor-pointer whitespace-nowrap"
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

            <div className="pt-3 mt-2 border-t border-slate-200/70">
              <a
                href={ctaHref}
                onClick={(e) => handleNavClick(e, ctaHref)}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white transition-all whitespace-nowrap cursor-pointer ${themeStyles.ctaBtn}`}
              >
                <UserPlus className="w-4 h-4 shrink-0 text-white" />
                <span className="text-white font-bold">{ctaLabel}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
