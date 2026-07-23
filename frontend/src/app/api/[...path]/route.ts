import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://ropewallet.com/api';

/**
 * Wildcard API Proxy Route Handler
 * Proxies all requests from the Next.js client (/api/*) to the Express backend.
 * Keeps backend URLs private and prevents CORS issues.
 */
async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathString = resolvedParams.path.join('/');
  const searchParams = req.nextUrl.search;
  
  const targetUrl = `${BACKEND_API_URL}/${pathString}${searchParams}`;

  // Clone headers
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Forward relevant headers, skip Host
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value);
    }
  });

  // Read request body if present
  let body: any = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.text();
    } catch {
      // Body empty or unreadable
    }
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      credentials: 'include',
    });

    const responseData = await backendRes.text();
    
    // Copy headers from backend response
    const resHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      // Forward cookie and content-type headers
      if (key.toLowerCase() === 'set-cookie' || key.toLowerCase() === 'content-type') {
        resHeaders.set(key, value);
      }
    });

    return new NextResponse(responseData, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error(`API Proxy Error forwarding to ${targetUrl}:`, err);
    return NextResponse.json(
      { success: false, error: 'Proxy failed to connect to backend server' },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
