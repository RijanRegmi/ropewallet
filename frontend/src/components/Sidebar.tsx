'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, Link as LinkIcon, Download, LogOut, Bell, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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

  return (
    <>
      {/* Glass sidebar panel */}
      <aside
        className="w-64 flex flex-col fixed inset-y-0 z-50"
        style={{
          background: 'rgba(1, 25, 42, 0.82)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderRight: '1px solid rgba(92, 124, 137, 0.22)',
          boxShadow: '4px 0 40px rgba(1, 20, 37, 0.60)',
        }}
      >
        {/* Brand */}
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
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'rgba(92, 124, 137, 0.15)',
              border: '1px solid rgba(92, 124, 137, 0.35)',
              backdropFilter: 'blur(8px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
            }}
          >
            <img src="/RJN.png" alt="RJN Logo" className="w-full h-full object-cover rounded-xl" />
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
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#d0e8ef';
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(92, 124, 137, 0.10)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(168, 196, 204, 0.60)';
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  }
                }}
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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#d0e8ef';
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(92, 124, 137, 0.10)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(168, 196, 204, 0.60)';
              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
            }}
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
            onClick={() => setIsLogoutModalOpen(true)}
            className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95"
            style={{
              background: 'rgba(92, 124, 137, 0.10)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(92, 124, 137, 0.22)',
              color: 'rgba(208, 232, 239, 0.80)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = 'rgba(239,68,68,0.12)';
              el.style.border = '1px solid rgba(239,68,68,0.30)';
              el.style.color = '#fca5a5';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = 'rgba(92, 124, 137, 0.10)';
              el.style.border = '1px solid rgba(92, 124, 137, 0.22)';
              el.style.color = 'rgba(208, 232, 239, 0.80)';
            }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
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
