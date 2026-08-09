import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const safeDestinations = new Set(['auto', 'participant', 'organization']);

export function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.PUBLIC_APP_URL;
  const requested = request.nextUrl.searchParams.get('destination') ?? 'auto';
  const destination = safeDestinations.has(requested) ? requested : 'auto';
  const operation = request.nextUrl.searchParams.get('createAccount') === '1' ? 'register' : 'login';
  if (!clientId || !appUrl) return NextResponse.redirect(new URL(`/login${destination === 'auto' ? '' : `/${destination}`}?googleError=not-configured`, request.url));
  const state = randomBytes(32).toString('base64url');
  const redirectUri = new URL('/api/session/google/callback', appUrl).toString();
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set('eventise_google_oauth', `${state}.${destination}.${operation}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });
  return response;
}
