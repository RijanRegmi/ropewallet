import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production (Vercel), the API serverless function lives at /api/* on the same origin.
    // Only proxy to localhost:5000 during local development.
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const isVercel = !!process.env.VERCEL;

    if (isVercel) {
      return []; // No rewrites needed — /api/* is handled by Vercel serverless function
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
