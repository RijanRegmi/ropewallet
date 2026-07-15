'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem('admin-theme') || 'dark';
      setIsDarkMode(savedTheme === 'dark');
    };
    checkTheme();
    window.addEventListener('theme-change', checkTheme);
    return () => window.removeEventListener('theme-change', checkTheme);
  }, []);

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
    <aside className={`w-64 border-r py-6 flex flex-col fixed inset-y-0 left-0 z-50 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-[#000000] border-zinc-900 text-white' 
        : 'bg-[#FFFFFF] border-slate-200 text-black'
    }`}>
      {/* Sidebar Logo */}
      <div className={`px-6 pb-6 border-b mb-4 ${isDarkMode ? 'border-zinc-900' : 'border-slate-200'}`}>
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
          RopeWallet
        </h1>
        <span className={`text-[10px] uppercase tracking-[2px] font-bold ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
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
                  ? 'text-primary bg-primary/8 border-primary font-semibold'
                  : isDarkMode
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-900 border-transparent'
                    : 'text-slate-600 hover:text-black hover:bg-slate-50 border-transparent'
              }`}
            >
              <span className="text-lg w-6 text-center">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className={`mt-auto px-6 border-t pt-4 ${isDarkMode ? 'border-zinc-900' : 'border-slate-200'}`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer font-semibold text-sm ${
            isDarkMode
              ? 'border-zinc-800 text-zinc-400 hover:text-danger hover:border-danger/30 hover:bg-danger/5'
              : 'border-slate-200 text-slate-600 hover:text-danger hover:border-danger/30 hover:bg-danger/5'
          }`}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
