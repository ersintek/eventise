'use client';

import { FormEvent, useState } from 'react';

export function ContactForm({ organizationId, sourcePage = '/dashboard/about' }: { organizationId?: string; sourcePage?: string }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    const form = event.currentTarget;
    const description = String(new FormData(form).get('message') ?? '');
    try {
      const response = await fetch('/api/backend/support-reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...(organizationId ? { organizationId } : {}), description, page: sourcePage, type: 'CONTACT' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message);
      form.reset();
      setSent(true);
      setStatus('Mesajınız bize ulaştı. En kısa sürede size döneceğiz.');
    } catch (error) {
      setStatus(error instanceof Error && error.message ? error.message : 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  }

  return <form className="about-contact-form" onSubmit={submit}>
    <label htmlFor="contact-message">Mesajınız</label>
    <textarea id="contact-message" name="message" required minLength={5} maxLength={3000} rows={6} placeholder="Size nasıl yardımcı olabiliriz?" disabled={busy || sent}/>
    <div className="about-form-footer">
      <p role="status" className={sent ? 'success' : ''}>{status}</p>
      <button className="primary" disabled={busy || sent}>{busy ? 'Gönderiliyor…' : sent ? 'Gönderildi ✓' : 'Mesajı gönder'}</button>
    </div>
  </form>;
}
