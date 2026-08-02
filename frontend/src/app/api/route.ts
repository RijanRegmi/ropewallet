import { NextRequest } from 'next/server';
import { GET as handlerGET, POST as handlerPOST } from './[...path]/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) { return handlerGET(req); }
export async function POST(req: NextRequest) { return handlerPOST(req); }
