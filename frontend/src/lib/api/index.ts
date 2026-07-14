export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    // Relative URL to hit the Next.js API route proxy (/api/[...path])
    const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;
    
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const res = await fetch(url, config);
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        return {
          success: false,
          error: 'Invalid session or service unavailable.',
        };
      }

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || `Request failed: status ${res.status}`,
        };
      }
      return data;
    } catch (err: any) {
      console.error('API Client Error:', err);
      return {
        success: false,
        error: err.message || 'Network connection failed',
      };
    }
  }

  static get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  static post<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  static put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}
