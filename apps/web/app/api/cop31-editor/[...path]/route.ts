import { NextRequest, NextResponse } from 'next/server';
import { COP31_EDITOR_COOKIE, verifyCop31EditorSession } from '@/lib/cop31-editor-session';

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!verifyCop31EditorSession(request.cookies.get(COP31_EDITOR_COOKIE)?.value)) return NextResponse.json({ message: 'Editör oturumunuz bulunmuyor veya süresi doldu.' }, { status: 401 });
  if (!process.env.COP31_EDITOR_KEY) return NextResponse.json({ message: 'COP31 servis erişimi henüz yapılandırılmadı.' }, { status: 503 });
  const { path } = await params;
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/cop31/${path.join('/')}${request.nextUrl.search}`, { method: request.method, headers: { 'content-type': request.headers.get('content-type') ?? 'application/json', 'x-cop31-editor-key': process.env.COP31_EDITOR_KEY }, body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(), cache: 'no-store' });
  return new NextResponse(await response.arrayBuffer(), { status: response.status, headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' } });
}

export const GET = proxy; export const POST = proxy; export const PATCH = proxy;
