import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/development-storage${request.nextUrl.search}`, { cache: 'no-store' });
  return new NextResponse(await response.arrayBuffer(), { status: response.status, headers: { 'content-type': response.headers.get('content-type') ?? 'application/octet-stream', 'cache-control': 'private, max-age=60' } });
}
