'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const email = String(new FormData(event.currentTarget).get('email') ?? '');
    await fetch('/api/session/password-reset/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    setMessage('Bu e-posta ile bir hesap varsa şifre yenileme bağlantısını gönderdik.');
  }

  return <main className="auth-shell">
    <section className="auth-brand"><div className="logo"><b>e</b>eventise</div><div><span>HESABINIZA DÖNÜN</span><h1>Yeni şifrenizi<br /><em>güvenle belirleyin.</em></h1></div></section>
    <section className="auth-panel"><form className="auth-card" onSubmit={submit}>
      <p className="eyebrow">ŞİFRE YENİLEME</p><h2>Şifrenizi mi unuttunuz?</h2>
      <p>Kayıtlı e-posta adresinizi yazın; size tek kullanımlık bir bağlantı gönderelim.</p>
      <label>E-posta<input name="email" type="email" required autoComplete="email" /></label>
      {message && <p className="notice" role="status">{message}</p>}
      <button className="primary" disabled={busy}>{busy ? 'Gönderiliyor…' : 'Yenileme bağlantısı gönder'}</button>
      <p className="auth-link"><Link href="/login">Giriş ekranına dön</Link></p>
    </form></section>
  </main>;
}
