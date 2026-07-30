import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/auth/password-reset/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(await request.json()),
    cache: 'no-store',
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
