'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <div
        className="min-h-screen text-white selection:bg-[#1F4959] selection:text-white"
        style={{
          background: 'linear-gradient(135deg, #011425 0%, #0d2030 40%, #1F4959 100%)',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <AuthGuard>
      <div
        className="min-h-screen text-white flex selection:bg-[#1F4959] selection:text-white"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(31,73,89,0.45) 0%, #011425 55%, #011020 100%)',
        }}
      >
        <Sidebar />
        <main className="flex-1 ml-64 p-8 min-h-screen">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
