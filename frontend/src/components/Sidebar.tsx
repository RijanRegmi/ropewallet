'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, Link as LinkIcon, Download, LogOut, Bell, ArrowUpRight, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Pending Deposits', href: '/admin/deposits', icon: CreditCard },
    { name: 'Host Payout Requests', href: '/admin/payouts', icon: ArrowUpRight },
    { name: 'Notice Center', href: '/admin/notices', icon: Bell },
    ...(FEATURE_FLAGS.ENABLE_P2P ? [{ name: 'P2P Accounts', href: '/admin/p2p-accounts', icon: LinkIcon }] : []),
  ];

  const initials = admin?.fullName
    ? admin.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div
        className="p-6 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(92, 124, 137, 0.18)' }}
      >
        <div>
          <h1
            className="text-xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(90deg, #ffffff 0%, #a8c4cc 60%, #5C7C89 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            RopeWallet
          </h1>
          <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: '#5C7C89' }}>
            Admin Portal
          </span>
        </div>
        {/* Glass logo badge */}
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: 'rgba(92, 124, 137, 0.15)',
              border: '1px solid rgba(92, 124, 137, 0.35)',
              backdropFilter: 'blur(8px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
            }}
          >
            <img src="/RJN.png" alt="RJN Logo" className="w-full h-full object-cover rounded-full" />
          </div>

          {/* Close button for mobile inside sidebar */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-5 space-y-1 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
              style={
                isActive
                  ? {
                      background: 'rgba(92, 124, 137, 0.20)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(92, 124, 137, 0.38)',
                      borderLeft: '3px solid #5C7C89',
                      color: '#ffffff',
                      fontWeight: 700,
                      boxShadow: '0 4px 20px rgba(1, 20, 37, 0.30), inset 0 1px 0 rgba(255,255,255,0.07)',
                    }
                  : {
                      color: 'rgba(168, 196, 204, 0.60)',
                      border: '1px solid transparent',
                    }
              }
            >
              <Icon
                className="w-5 h-5 flex-shrink-0"
                style={{ color: isActive ? '#7ba5b5' : '#5C7C89' }}
              />
              {item.name}
            </Link>
          );
        })}

        {/* Export Data */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/export/transactions`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
          style={{ color: 'rgba(168, 196, 204, 0.60)', border: '1px solid transparent' }}
        >
          <Download className="w-5 h-5" style={{ color: '#5C7C89' }} />
          Export Data
        </a>
      </nav>

      {/* Admin profile + logout */}
      <div
        className="p-4 space-y-3"
        style={{ borderTop: '1px solid rgba(92, 124, 137, 0.18)' }}
      >
        {admin && (
          <div className="flex items-center gap-3 px-2">
            {/* Glass avatar */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(92,124,137,0.70) 0%, rgba(31,73,89,0.90) 100%)',
                border: '1px solid rgba(92, 124, 137, 0.45)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 16px rgba(92, 124, 137, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{admin.fullName}</p>
              <p className="text-xs capitalize truncate" style={{ color: '#5C7C89' }}>{admin.role}</p>
            </div>
          </div>
        )}

        {/* Glass logout button */}
        <button
          onClick={() => {
            setMobileOpen(false);
            setIsLogoutModalOpen(true);
          }}
          className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95 text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sticky Navbar Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 sm:px-6"
        style={{
          background: 'rgba(1, 25, 42, 0.88)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(92, 124, 137, 0.22)',
          boxShadow: '0 4px 20px rgba(1, 20, 37, 0.50)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: 'rgba(92, 124, 137, 0.15)',
              border: '1px solid rgba(92, 124, 137, 0.35)',
            }}
          >
            <img src="/RJN.png" alt="RJN Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <h1
              className="text-base font-extrabold tracking-tight leading-tight"
              style={{
                background: 'linear-gradient(90deg, #ffffff 0%, #a8c4cc 60%, #5C7C89 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              RopeWallet
            </h1>
            <span className="text-[10px] uppercase tracking-widest font-semibold block" style={{ color: '#5C7C89' }}>
              Admin Portal
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-white transition-all active:scale-95"
          style={{
            background: 'rgba(92, 124, 137, 0.18)',
            border: '1px solid rgba(92, 124, 137, 0.30)',
          }}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer Sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'rgba(1, 25, 42, 0.95)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderRight: '1px solid rgba(92, 124, 137, 0.25)',
          boxShadow: '8px 0 50px rgba(1, 20, 37, 0.80)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Fixed Sidebar */}
      <aside
        className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-40"
        style={{
          background: 'rgba(1, 25, 42, 0.82)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderRight: '1px solid rgba(92, 124, 137, 0.22)',
          boxShadow: '4px 0 40px rgba(1, 20, 37, 0.60)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        type="logout"
        title="Sign Out Confirmation"
        message="Are you sure you want to log out of the RopeWallet Admin Portal? You will need to sign in again to access the dashboard."
        confirmText="Sign Out"
        cancelText="Stay Logged In"
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          logout();
        }}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
}
