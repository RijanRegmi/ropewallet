'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, Link as LinkIcon, Download, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Pending Deposits', href: '/admin/deposits', icon: CreditCard },
    { name: 'P2P Accounts', href: '/admin/p2p-accounts', icon: LinkIcon },
  ];

  const initials = admin?.fullName
    ? admin.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  return (
    <>
      <aside className="w-64 bg-[#111827] border-r border-[#1F2937] flex flex-col fixed inset-y-0 z-50">
        {/* Brand */}
        <div className="p-6 border-b border-[#1F2937]">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            RopeWallet
          </h1>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Admin Portal</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border-l-[3px] border-indigo-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}

          {/* Export link */}
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/export/transactions`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all"
          >
            <Download className="w-5 h-5" />
            Export Data
          </a>
        </nav>

        {/* Admin profile + logout */}
        <div className="p-4 border-t border-[#1F2937] space-y-3">
          {admin && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{admin.fullName}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{admin.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white bg-gray-800/60 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 rounded-xl border border-gray-700 transition-all duration-200 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Modern UI Logout Confirmation Modal */}
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
