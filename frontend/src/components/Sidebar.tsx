'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
      const res = await ApiClient.get('/admin/logout');
      // Delete local cookies/token if any
      document.cookie = 'admin_token=; Max-Age=0; path=/;';
      router.push('/');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Users', path: '/admin/users', icon: '👥' },
    { name: 'Pending Deposits', path: '/admin/deposits', icon: '💰' },
    { name: 'P2P Accounts', path: '/admin/p2p-accounts', icon: '🔗' },
    { name: 'Export Data', path: '/admin/export', icon: '📥' },
  ];

  return (
    <aside className="w-64 bg-dark-surface border-r border-dark-border py-6 flex flex-col fixed inset-y-0 left-0 z-50">
      {/* Sidebar Logo */}
      <div className="px-6 pb-6 border-b border-dark-border mb-4">
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
          RopeWallet
        </h1>
        <span className="text-[10px] text-dark-text-secondary uppercase tracking-[2px] font-bold">
          Admin Portal
        </span>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 border-l-3 ${
                isActive
                  ? 'text-primary bg-primary/8 border-primary'
                  : 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-surface-2 border-transparent'
              }`}
            >
              <span className="text-lg w-6 text-center">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto px-6 border-t border-dark-border pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dark-border text-dark-text-secondary hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-all duration-200 cursor-pointer font-semibold text-sm"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
