import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.ropewallet.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/dashboard', '/admin/users', '/admin/deposits', '/admin/payouts'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
