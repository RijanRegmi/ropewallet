'use server';

import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://ropewallet.vercel.app/api';

async function getAuthHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return token ? { 'Cookie': `admin_token=${token}`, 'Authorization': `Bearer ${token}` } : {};
}

// ─── Deposits approvals queue actions ───────────────────────

export async function getDepositsAction(status = 'pending') {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/deposits?status=${status}`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function approveDepositAction(id: string) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/deposits/${id}/approve`, {
      method: 'PUT',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function declineDepositAction(id: string, reason: string) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/deposits/${id}/decline`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

// ─── P2P Configured Handles actions ───────────────────────

export async function getP2PAccountsAction() {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/p2p-accounts`, {
      method: 'GET',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function createP2PAccountAction(accountData: any) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/p2p-accounts`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function updateP2PAccountAction(id: string, accountData: any) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/p2p-accounts/${id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function deleteP2PAccountAction(id: string) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_API_URL}/admin/p2p-accounts/${id}`, {
      method: 'DELETE',
      headers,
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}
