'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');
    if (password !== confirmation) {
      setBusy(false);
      setMessage('Şifreler birbiriyle eşleşmiyor.');
      return;
    }
    const response = await fetch('/api/session/password-reset/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.message ?? 'Şifre yenilenemedi.');
      return;
    }
    setCompleted(true);
    setMessage('Şifreniz yenilendi. Artık yeni şifrenizle giriş yapabilirsiniz.');
  }

  return <main className="auth-shell">
    <section className="auth-brand"><div className="logo"><b>e</b>eventise</div><div><span>HESAP GÜVENLİĞİ</span><h1>Yeni bir şifre<br /><em>belirleyin.</em></h1></div></section>
    <section className="auth-panel"><form className="auth-card" onSubmit={submit}>
      <p className="eyebrow">ŞİFRE YENİLEME</p><h2>Yeni şifrenizi oluşturun</h2>
      {!completed && <>
        <label>Yeni şifre<input name="password" type="password" required minLength={10} autoComplete="new-password" /></label>
        <label>Yeni şifre (tekrar)<input name="confirmation" type="password" required minLength={10} autoComplete="new-password" /></label>
        <button className="primary" disabled={busy || !token}>{busy ? 'Kaydediliyor…' : 'Şifremi yenile'}</button>
      </>}
      {message && <p className={completed ? 'notice' : 'error'} role="status">{message}</p>}
      <p className="auth-link"><Link href="/login">Giriş ekranına dön</Link></p>
    </form></section>
  </main>;
}
