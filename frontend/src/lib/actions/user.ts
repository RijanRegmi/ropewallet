'use server';

import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://ropewallet.vercel.app/api';

async function getAuthHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return token ? { 'Cookie': `admin_token=${token}`, 'Authorization': `Bearer ${token}` } : {};
}

export async function getUsersAction(page = 1, search = '') {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function createUserAction(userData: any) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function updateUserAction(id: string, userData: any) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function deleteUserAction(id: string) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function toggleFreezeAction(id: string, freeze: boolean) {
  try {
    const headers = await getAuthHeader();
    const url = freeze ? `${BACKEND_API_URL}/admin/users/${id}/freeze` : `${BACKEND_API_URL}/admin/users/${id}/unfreeze`;
    const res = await fetch(url, {
      method: 'PUT',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function updateUserRoleAction(id: string, role: string) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/users/${id}/role`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}
