'use client';
import { FormEvent, useState } from 'react';

export function DoorRegistration({ organizationId, eventId, onSuccess }: { organizationId: string; eventId: string; onSuccess?: () => void }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const form = event.currentTarget, data = new FormData(form);
    const response = await fetch(`/api/backend/organizations/${organizationId}/events/${eventId}/check-in/door`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ firstName: data.get('firstName'), lastName: data.get('lastName'), email: data.get('email') }) });
    const result = await response.json();
    setMessage(response.ok ? 'Kapıda kayıt ve katılım teyidi oluşturuldu.' : (Array.isArray(result.message) ? result.message.join(' ') : result.message ?? 'İşlem tamamlanamadı.'));
    setBusy(false); if (response.ok) { form.reset(); onSuccess?.(); }
  }
  return <form className="registration-card door-form" onSubmit={submit}><h2>Kapıda kayıt</h2><p>Listede olmayan katılımcıyı kaydedip doğrudan içeri alın.</p><div className="two"><label>Ad<input name="firstName" required/></label><label>Soyad<input name="lastName" required/></label></div><label>E-posta<input name="email" type="email" required/></label><button className="primary" disabled={busy}>{busy ? 'Kaydediliyor…' : 'Kaydet ve teyit et'}</button>{message && <p className="notice" role="status">{message}</p>}</form>;
}
