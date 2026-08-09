'use client';

import { FormEvent, useState } from 'react';

type Consent = { required: boolean; definition: { title: string; versions: Array<{ id: string; text: string }> } };
export type RegistrationField = { key: string; type: 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'select' | 'checkbox'; label: string; required: boolean; options: string[] };

const statusLabel: Record<string, string> = { SUBMITTED: 'Başvurunuz alındı', PENDING: 'Değerlendiriliyor', ACCEPTED: 'Kaydınız tamamlandı', WAITLISTED: 'Yedek listedesiniz', REJECTED: 'Başvurunuz sonuçlandı' };
const statusMessage: Record<string, string> = { SUBMITTED: 'Başvurunuz güvenle kaydedildi.', PENDING: 'Kurum başvurunuzu değerlendiriyor. Sonuç e-postayla bildirilecek.', ACCEPTED: 'Bu etkinlikte yeriniz hazır. Etkinlik bilgilerini katılımcı alanınızdan takip edebilirsiniz.', WAITLISTED: 'Kontenjan dolu olduğu için yedek listeye alındınız.', REJECTED: 'Başvurunuz bu etkinlik için kabul edilmedi.' };

export function RegistrationForm({ orgSlug, eventSlug, open, consents, fields, session }: { orgSlug: string; eventSlug: string; open: boolean; consents: Consent[]; fields: RegistrationField[]; session: { user: { email: string; firstName: string; lastName: string }; registration: { applicationStatus: string } | null } | null }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const user = session?.user;
  const existing = session?.registration;
  const visibleConsents = consents.filter(item => item.definition.versions[0]);
  const missingVersionConsents = consents.filter(item => item.required && !item.definition.versions[0]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const consentVersionIds = visibleConsents.filter(item => data.get(`consent-${item.definition.versions[0]?.id}`)).map(item => item.definition.versions[0].id);
    const answers = Object.fromEntries(fields.map(field => [field.key, field.type === 'checkbox' ? data.get(field.key) === 'on' : data.get(field.key)]));
    const payload = { firstName: data.get('firstName'), lastName: data.get('lastName'), email: data.get('email'), answers, consentVersionIds, createAccount: user ? false : data.get('createAccount') === 'on' };
    try {
      const response = await fetch(`/api/public/events/${orgSlug}/${eventSlug}/registrations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      const text = response.ok ? statusMessage[result.status] ?? 'Başvurunuz alındı.' : Array.isArray(result.message) ? result.message.join(' ') : result.message ?? 'Başvuru gönderilemedi.';
      setMessage(text);
      if (response.ok) { setComplete(true); form.reset(); }
    } catch { setMessage('Bağlantı kurulamadı. Bilgileriniz korunuyor; lütfen yeniden deneyin.'); }
    finally { setBusy(false); }
  }

  if (!open) return <aside className="registration-card registration-state" id="registration"><span className="registration-icon">–</span><p className="eyebrow">KAYIT DURUMU</p><h2>Kayıtlar kapalı</h2><p className="registration-explainer">Etkinlik ayrıntılarını inceleyebilirsiniz; şu anda yeni kayıt kabul edilmiyor.</p></aside>;
  if (existing) return <aside className="registration-card registration-state" id="registration"><span className="registration-icon">✓</span><p className="eyebrow">BAŞVURU DURUMUNUZ</p><h2>{statusLabel[existing.applicationStatus] ?? existing.applicationStatus}</h2><p className="registration-explainer">{statusMessage[existing.applicationStatus] ?? 'Başvurunuz kaydedildi.'}</p><p className="participant-notice"><b>{user?.email}</b></p></aside>;
  if (complete) return <aside className="registration-card registration-state success" id="registration"><span className="registration-icon">✓</span><p className="eyebrow">BAŞVURUNUZ ALINDI</p><h2>Teşekkürler</h2><p className="registration-explainer">{message}</p><p className="registration-security">Bilgileriniz güvenli biçimde kaydedildi.</p></aside>;

  return <form className="registration-card" id="registration" onSubmit={submit}>
    <div className="registration-heading"><p className="eyebrow">KAYIT FORMU</p><h2>Yerinizi ayırın</h2><p className="registration-explainer">Birkaç kısa bilgiyle başvurunuzu tamamlayın.</p></div>
    {user && <p className="participant-notice"><b>{user.email}</b> hesabıyla devam ediyorsunuz.</p>}
    <div className="two"><label>Ad<input name="firstName" autoComplete="given-name" required defaultValue={user?.firstName}/></label><label>Soyad<input name="lastName" autoComplete="family-name" required defaultValue={user?.lastName}/></label></div>
    <label>E-posta<input name="email" type="email" autoComplete="email" required defaultValue={user?.email} readOnly={Boolean(user)}/></label>
    {fields.map(field => field.type === 'checkbox' ? <label className="consent custom-consent" key={field.key}><input name={field.key} type="checkbox" required={field.required}/><span><b>{field.label}</b></span></label> : <label key={field.key}>{field.label}{field.required && <span className="required-mark"> *</span>}{field.type === 'textarea' ? <textarea name={field.key} required={field.required}/> : field.type === 'select' ? <select name={field.key} required={field.required}><option value="">Seçin</option>{(field.options ?? []).map(option => <option key={option}>{option}</option>)}</select> : <input name={field.key} type={field.type === 'phone' ? 'tel' : field.type} required={field.required}/>}</label>)}
    {!user && <label className="consent account-consent"><input type="checkbox" name="createAccount" defaultChecked/><span><b>Katılımcı hesabımı da oluştur</b><small>Etkinliği takip etmeniz için güvenli bir hesap bağlantısı e-postanıza gönderilir.</small></span></label>}
    {visibleConsents.map(item => { const version = item.definition.versions[0]; return <label className="consent" key={version.id}><input type="checkbox" name={`consent-${version.id}`} required={item.required}/><span><b>{item.definition.title}</b><small>{version.text}</small></span></label>; })}
    {missingVersionConsents.length > 0 && <p className="error">Etkinliğin onam yapılandırmasında bir sorun var. Lütfen düzenleyen kurumla iletişime geçin.</p>}
    {message && <p className="notice" role="status">{message}</p>}
    <button className="event-submit-button" disabled={busy || missingVersionConsents.length > 0}>{busy ? 'Gönderiliyor…' : 'Başvuruyu tamamla'}<span>→</span></button>
    <p className="registration-security"><span>✓</span> Bilgileriniz yalnızca bu etkinliğin kayıt süreci için kullanılır.</p>
  </form>;
}
