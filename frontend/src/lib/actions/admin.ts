'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://ropewallet.com/api';

/**
 * Admin Server Actions
 */

export async function loginAction(state: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  try {
    const res = await fetch(`${BACKEND_API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Authentication failed' };
    }

    // Set cookie on server
    const token = data.data.token;
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      path: '/',
      maxAge: 86400,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection to server failed' };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (token) {
      await fetch(`${BACKEND_API_URL}/admin/logout`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `admin_token=${token}`,
        },
      });
    }
  } catch (err) {
    console.error('Logout request failed:', err);
  } finally {
    const cookieStore = await cookies();
    cookieStore.delete('admin_token');
    redirect('/');
  }
}

export async function getDashboardStatsAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return { success: false, error: 'Unauthorized: Session expired' };
  }

  try {
    const res = await fetch(`${BACKEND_API_URL}/admin/dashboard-data`, {
      method: 'GET',
      headers: {
        'Cookie': `admin_token=${token}`,
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}
