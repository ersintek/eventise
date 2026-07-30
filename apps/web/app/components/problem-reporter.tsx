'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

export function ProblemReporter({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  useEffect(() => {
    const openReporter = () => {
      setMessage('');
      setOpen(true);
    };
    window.addEventListener('eventise:open-problem-reporter', openReporter);
    return () => window.removeEventListener('eventise:open-problem-reporter', openReporter);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = event.currentTarget;
    const description = String(new FormData(form).get('description') ?? '');
    try {
      const response = await fetch('/api/backend/support-reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          description,
          page: `${window.location.pathname}${window.location.search}`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message);
      form.reset();
      setMessage('Teşekkürler, bildirimin bize ulaştı.');
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : 'Bildirim gönderilemedi. Lütfen tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button className="problem-report-trigger" type="button" onClick={() => { setMessage(''); setOpen(true); }}>
      <span aria-hidden="true">!</span> Sorun Bildir
    </button>
    <dialog ref={dialog} className="compact-dialog report-dialog" onClose={() => setOpen(false)} onClick={event => {
      if (event.target === dialog.current) setOpen(false);
    }}>
      <button className="dialog-close" type="button" onClick={() => setOpen(false)} aria-label="Kapat">×</button>
      <p className="eyebrow">GERİ BİLDİRİM</p>
      <h2>Bir sorun mu var?</h2>
      <p>Kısaca anlat; bulunduğun ekran ve hesap bilgilerin otomatik olarak eklenecek.</p>
      <form onSubmit={submit}>
        <label htmlFor="problem-description">Sorun</label>
        <textarea id="problem-description" name="description" required minLength={5} maxLength={3000} rows={5} placeholder="Ne oldu, ne olmasını bekliyordun?"/>
        <button className="primary" disabled={busy}>{busy ? 'Gönderiliyor…' : 'Gönder'}</button>
      </form>
      {message && <p className="report-status" role="status">{message}</p>}
    </dialog>
  </>;
}
