'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    // Backend returns { success, admin: {...} } (not data)
    const res = await apiRequest<any>('/admin/me');
    if (res.success && (res as any).admin) {
      setAdmin((res as any).admin);
    } else {
      setAdmin(null);
      // If we're on an admin protected page, redirect to login
      if (pathname && pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
        router.replace('/admin/login');
      }
    }
    setIsLoading(false);
  }, [pathname, router]);

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Backend returns { success, token, admin: {...} } (not data)
    const res = await apiRequest<any>('/admin/login', 'POST', { email, password });
    if (res.success && (res as any).admin) {
      if ((res as any).token && typeof window !== 'undefined') {
        localStorage.setItem('admin_token', (res as any).token);
      }
      setAdmin((res as any).admin);
      router.push('/admin/dashboard');
      return { success: true };
    }
    return { success: false, error: (res as any).error || 'Authentication failed' };
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
    // Call logout endpoint to clear cookie
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    setAdmin(null);
    router.push('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
