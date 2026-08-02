const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const opts: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    if (body) {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('API Error:', err);
    return { success: false, error: err.message || 'Network error occurred' };
  }
}

export const ApiClient = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body?: any) => apiRequest<T>(endpoint, 'POST', body),
  put: <T>(endpoint: string, body?: any) => apiRequest<T>(endpoint, 'PUT', body),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, 'DELETE'),
};
