import { cookies } from 'next/headers';

/**
 * Cookie Helper
 * Provides server-side cookie actions using Next.js headers,
 * and client-side cookie fallbacks when running in the browser.
 */
export const CookieHelper = {
  /**
   * Sets a cookie securely.
   */
  async set(name: string, value: string, maxAge: number = 86400) {
    if (typeof window === 'undefined') {
      const cookieStore = await cookies();
      cookieStore.set(name, value, {
        path: '/',
        maxAge,
        httpOnly: false, // Set to true if ONLY server action access is needed
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    } else {
      document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax;${
        location.protocol === 'https:' ? ' Secure;' : ''
      }`;
    }
  },

  /**
   * Gets a cookie value.
   */
  async get(name: string): Promise<string | undefined> {
    if (typeof window === 'undefined') {
      const cookieStore = await cookies();
      return cookieStore.get(name)?.value;
    } else {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[2]) : undefined;
    }
  },

  /**
   * Deletes a cookie.
   */
  async delete(name: string) {
    if (typeof window === 'undefined') {
      const cookieStore = await cookies();
      cookieStore.delete(name);
    } else {
      document.cookie = `${name}=; path=/; Max-Age=0;`;
    }
  },
};
