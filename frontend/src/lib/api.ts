const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const apiBase = getApiBase();
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

    const res = await fetch(`${apiBase}${endpoint}`, opts);

    // Safely check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error(`Non-JSON API response from ${apiBase}${endpoint} (Status ${res.status}):`, text);
      return {
        success: false,
        error: res.status === 404
          ? 'Backend API route not found (404)'
          : `Server error (${res.status}): ${res.statusText || 'Unexpected server response'}`,
      };
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('API Network Error:', err);
    return { success: false, error: err.message || 'Network error occurred' };
  }
}

export const ApiClient = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body?: any) => apiRequest<T>(endpoint, 'POST', body),
  put: <T>(endpoint: string, body?: any) => apiRequest<T>(endpoint, 'PUT', body),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, 'DELETE'),
};
