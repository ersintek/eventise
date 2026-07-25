'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const googleErrors: Record<string, string> = {
  'not-configured': 'Google ile giriş henüz yapılandırılmadı.',
  'invalid-state': 'Google giriş isteğinin süresi doldu. Lütfen yeniden deneyin.',
  'token-exchange': 'Google oturumu tamamlanamadı. Lütfen yeniden deneyin.',
  account: 'Google hesabı Eventise hesabına bağlanamadı.',
  unavailable: 'Google ile giriş şu anda kullanılamıyor.',
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('googleError');
    if (reason) setError(googleErrors[reason] ?? 'Google ile giriş tamamlanamadı.');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const response = await fetch('/api/session/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    setBusy(false);
    if (!response.ok) {
      setError((await response.json()).message ?? 'Giriş yapılamadı.');
      return;
    }
    const organizations = await fetch('/api/backend/organizations').then((result) => result.ok ? result.json() : []).catch(() => []);
    router.push(organizations.length ? '/dashboard' : '/participant');
    router.refresh();
  }

  return <main className="auth-shell">
    <section className="auth-brand"><div className="logo"><b>e</b>eventise</div><div><span>STK&apos;LAR İÇİN TASARLANDI</span><h1>Etkinlikler,<br />insanlar ve etki.<br /><em>Tek bir yerde.</em></h1><p>Etkinlik öncesinden sertifikaya kadar bütün süreci güvenle yönetin.</p></div></section>
    <section className="auth-panel"><form className="auth-card" onSubmit={submit}>
      <p className="eyebrow">TEKRAR HOŞ GELDİNİZ</p><h2>Hesabınıza giriş yapın</h2>
      <a className="google-button" href="/api/session/google"><span className="google-mark">G</span>Google ile devam et</a>
      <div className="auth-divider"><span>veya</span></div>
      <label>E-posta<input name="email" type="email" required autoComplete="email" /></label>
      <label>Şifre<input name="password" type="password" required autoComplete="current-password" /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</button>
      <p className="auth-link">Hesabınız yok mu? <Link href="/register">Ücretsiz başlayın</Link></p>
      <p className="auth-link"><Link href="/yardim">STK&apos;lar için rehber →</Link></p>
    </form></section>
  </main>;
}
