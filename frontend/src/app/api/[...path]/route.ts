import { NextRequest } from 'next/server';
import { Readable, Stream } from 'stream';
// @ts-ignore
import app from '../../../../../backend/dist/app.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function runExpress(req: NextRequest): Promise<Response> {
  return new Promise(async (resolve, reject) => {
    try {
      const url = new URL(req.url);
      const reqPath = url.pathname + url.search;

      // Read request body if present
      let bodyBuffer: Buffer | null = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        try {
          const arrayBuffer = await req.arrayBuffer();
          bodyBuffer = Buffer.from(arrayBuffer);
        } catch {
          bodyBuffer = null;
        }
      }

      // Create standard Node.js Readable stream from request body
      const reqStream: any = bodyBuffer && bodyBuffer.length > 0 ? Readable.from(bodyBuffer) : Readable.from([]);
      reqStream.url = reqPath;
      reqStream.originalUrl = reqPath;
      reqStream.method = req.method;
      reqStream.headers = Object.fromEntries(req.headers.entries());

      let _query: any = {};
      let _body: any = undefined;
      Object.defineProperty(reqStream, 'query', {
        get: () => _query,
        set: (val) => { _query = val; },
        configurable: true,
        enumerable: true,
      });
      Object.defineProperty(reqStream, 'body', {
        get: () => _body,
        set: (val) => { _body = val; },
        configurable: true,
        enumerable: true,
      });

      // Create mock response object
      const resHeaders = new Headers();
      let statusCode = 200;
      const chunks: Buffer[] = [];

      const resMock: any = new Stream.Writable();
      resMock.headersSent = false;
      resMock.statusCode = 200;

      resMock.setHeader = (name: string, value: any) => {
        if (Array.isArray(value)) {
          value.forEach(v => resHeaders.append(name, String(v)));
        } else {
          resHeaders.set(name, String(value));
        }
      };

      resMock.getHeader = (name: string) => resHeaders.get(name);
      resMock.removeHeader = (name: string) => resHeaders.delete(name);

      resMock.writeHead = (code: number, headers?: any) => {
        statusCode = code;
        resMock.statusCode = code;
        if (headers) {
          Object.entries(headers).forEach(([k, v]) => resMock.setHeader(k, v));
        }
        resMock.headersSent = true;
      };

      resMock.status = (code: number) => {
        statusCode = code;
        resMock.statusCode = code;
        return resMock;
      };

      resMock._write = (chunk: any, encoding: any, callback: any) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        callback();
      };

      resMock.end = (chunk?: any, encoding?: any) => {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        }
        const body = Buffer.concat(chunks);
        resolve(new Response(body, { status: statusCode, headers: resHeaders }));
      };

      // Call Express app
      app(reqStream, resMock);
    } catch (err: any) {
      console.error('API Route execution error:', err);
      resolve(new Response(JSON.stringify({ success: false, error: err.message || 'Server execution error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      }));
    }
  });
}

export async function GET(req: NextRequest) { return runExpress(req); }
export async function POST(req: NextRequest) { return runExpress(req); }
export async function PUT(req: NextRequest) { return runExpress(req); }
export async function DELETE(req: NextRequest) { return runExpress(req); }
export async function PATCH(req: NextRequest) { return runExpress(req); }
