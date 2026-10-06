import { NextRequest, NextResponse } from 'next/server';
import { COP31_EDITOR_COOKIE, createCop31EditorSession, verifyCop31EditorPassword } from '@/lib/cop31-editor-session';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!process.env.COP31_EDITOR_PASSWORD) return NextResponse.json({ message: 'COP31 editör erişimi henüz yapılandırılmadı.' }, { status: 503 });
  if (!verifyCop31EditorPassword(body.password)) return NextResponse.json({ message: 'Erişim parolası doğru değil.' }, { status: 401 });
  const session = createCop31EditorSession(); const response = NextResponse.json({ ok: true });
  response.cookies.set(COP31_EDITOR_COOKIE, session.value, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: session.maxAge });
  return response;
}

export function DELETE() { const response = NextResponse.json({ ok: true }); response.cookies.set(COP31_EDITOR_COOKIE, '', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 }); return response; }
