'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter(), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(''); const body = Object.fromEntries(new FormData(event.currentTarget)); const response = await fetch('/api/session/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); setBusy(false); if (!response.ok) { setError((await response.json()).message ?? 'Giriş yapılamadı.'); return; } router.push('/dashboard'); router.refresh(); }
  return <main className="auth-shell"><section className="auth-brand"><div className="logo"><b>e</b>eventise</div><div><span>STK’LAR İÇİN TASARLANDI</span><h1>Etkinlikler,<br/>insanlar ve etki.<br/><em>Tek bir yerde.</em></h1><p>Etkinlik öncesinden sertifikaya kadar bütün süreci güvenle yönetin.</p></div></section><section className="auth-panel"><form className="auth-card" onSubmit={submit}><p className="eyebrow">TEKRAR HOŞ GELDİNİZ</p><h2>Hesabınıza giriş yapın</h2><label>E-posta<input name="email" type="email" required autoComplete="email"/></label><label>Şifre<input name="password" type="password" required autoComplete="current-password"/></label>{error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?'Giriş yapılıyor…':'Giriş yap'}</button><p className="auth-link">Hesabınız yok mu? <Link href="/register">Ücretsiz başlayın</Link></p></form></section></main>;
}
