import { NextRequest, NextResponse } from 'next/server';

const destinations: Record<string, string> = {
  participant: '/participant',
  organization: '/organization/access',
};
const validDestinations = new Set(['auto', ...Object.keys(destinations)]);

function loginError(request: NextRequest, reason: string, destination = 'auto') {
  const appUrl = process.env.PUBLIC_APP_URL;
  const context = destination === 'participant' || destination === 'organization' ? `/${destination}` : '';
  const path = reason === 'account-not-found' ? `/register${context}?googlePrompt=choose` : `/login${context}?googleError=${encodeURIComponent(reason)}`;
  const response = NextResponse.redirect(new URL(path, appUrl || request.url));
  response.cookies.delete('eventise_google_oauth');
  return response;
}

export async function GET(request: NextRequest) {
  const stored = request.cookies.get('eventise_google_oauth')?.value;
  const parts = stored?.split('.') ?? [];
  const expectedState = parts[0] ?? '';
  const storedDestination = parts[1] ?? 'auto';
  const createAccount = parts[2] === 'register';
  const destination = validDestinations.has(storedDestination) ? storedDestination : 'auto';
  const state = request.nextUrl.searchParams.get('state') ?? '';
  const code = request.nextUrl.searchParams.get('code');
  if (!code || !expectedState || state !== expectedState) return loginError(request, 'invalid-state', destination);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.PUBLIC_APP_URL;
  if (!clientId || !clientSecret || !appUrl) return loginError(request, 'not-configured', destination);

  try {
    const redirectUri = new URL('/api/session/google/callback', appUrl).toString();
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
      cache: 'no-store',
    });
    const tokens = await tokenResponse.json() as { id_token?: string };
    if (!tokenResponse.ok || !tokens.id_token) return loginError(request, 'token-exchange', destination);

    const apiResponse = await fetch(`${process.env.API_INTERNAL_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: tokens.id_token, createAccount }),
      cache: 'no-store',
    });
    const data = await apiResponse.json() as { accessToken?: string; message?: string };
    if (!apiResponse.ok || !data.accessToken) {
      const reason = apiResponse.status === 404
        ? 'account-not-found'
        : apiResponse.status === 409
        ? 'account-conflict'
        : apiResponse.status === 401 && data.message?.includes('aktif değil')
          ? 'account-inactive'
          : apiResponse.status === 401
            ? 'identity'
            : 'account';
      return loginError(request, reason, destination);
    }

    const organizations = await fetch(`${process.env.API_INTERNAL_URL}/api/organizations`, {
      headers: { authorization: `Bearer ${data.accessToken}` },
      cache: 'no-store',
    }).then((response) => response.ok ? response.json() as Promise<unknown[]> : []);
    const resolvedDestination = destination === 'participant'
      ? 'participant'
      : destination === 'organization'
        ? organizations.length ? 'dashboard' : 'organization'
        : organizations.length ? 'dashboard' : 'participant';
    const legalStatus = await fetch(`${process.env.API_INTERNAL_URL}/api/legal/status`, {
      headers: { authorization: `Bearer ${data.accessToken}` },
      cache: 'no-store',
    }).then((response) => response.ok ? response.json() as Promise<{ userTermsAccepted: boolean }> : null);
    const resolvedPath = resolvedDestination === 'dashboard' ? '/dashboard' : destinations[resolvedDestination];
    const target = legalStatus?.userTermsAccepted ? resolvedPath : `/legal/accept?destination=${resolvedDestination}`;
    const response = NextResponse.redirect(new URL(target, appUrl));
    response.cookies.delete('eventise_google_oauth');
    response.cookies.set('eventise_session', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch {
    return loginError(request, 'unavailable', destination);
  }
}
