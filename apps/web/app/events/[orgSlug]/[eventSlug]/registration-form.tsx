'use client';
import { FormEvent, useState } from 'react';
type Consent = { required: boolean; definition: { title: string; versions: Array<{ id: string; text: string }> } };
export type RegistrationField = { key: string; type: 'text'|'textarea'|'email'|'phone'|'number'|'select'|'checkbox'; label: string; required: boolean; options: string[] };
const statusLabel:Record<string,string>={SUBMITTED:'Gönderildi',PENDING:'Beklemede',ACCEPTED:'Kabul edildi',WAITLISTED:'Yedek listede',REJECTED:'Reddedildi'};
export function RegistrationForm({ orgSlug, eventSlug, open, consents, fields, session }: { orgSlug: string; eventSlug: string; open: boolean; consents: Consent[]; fields: RegistrationField[]; session: { user: { email: string; firstName: string; lastName: string }; registration: { applicationStatus: string } | null } | null }) {
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const user = session?.user;
  const existing = session?.registration;
  // Görüntülenebilir onamlar (versiyonu olanlar)
  const visibleConsents = consents.filter(item => item.definition.versions[0]);
  const missingVersionConsents = consents.filter(item => item.required && !item.definition.versions[0]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); const form = event.currentTarget, data = new FormData(form), consentVersionIds = visibleConsents.filter(item => data.get(`consent-${item.definition.versions[0]?.id}`)).map(item => item.definition.versions[0].id), answers = Object.fromEntries(fields.map(field => [field.key, field.type === 'checkbox' ? data.get(field.key) === 'on' : data.get(field.key)])); const payload = { firstName: data.get('firstName'), lastName: data.get('lastName'), email: data.get('email'), answers, consentVersionIds, createAccount: user ? false : data.get('createAccount') === 'on' }; const response = await fetch(`/api/public/events/${orgSlug}/${eventSlug}/registrations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }), result = await response.json(); setMessage(response.ok ? (result.updated ? 'Başvurunuz güncellendi. Durum: ' : 'Başvurunuz alındı. Durum: ') + `${result.status}` : (Array.isArray(result.message) ? result.message.join(' ') : result.message ?? 'Başvuru gönderilemedi.')); setBusy(false); if (response.ok) form.reset(); }
  if (!open) return <aside className="registration-card" id="registration"><p className="eyebrow">KAYIT DURUMU</p><h2>Kayıtlar kapalı</h2><p className="registration-explainer">Etkinlik ayrıntılarını inceleyebilirsiniz. Yeni kayıt kabul edilmiyor.</p></aside>;
  return <form className="registration-card" id="registration" onSubmit={submit}><p className="eyebrow">KAYIT FORMU</p><h2>Yerinizi ayırın</h2><p className="registration-explainer">Bilgilerinizi paylaşın; kayıt durumunuz e-postayla bildirilsin.</p>
    {user && <p className="participant-notice"><b>Şu hesapla bağlısınız: {user.email}</b></p>}
    {existing && <p className="hint-box">Bu etkinliğe zaten başvurdunuz — durum: <b>{statusLabel[existing.applicationStatus] ?? existing.applicationStatus}</b>. Yanlış bilgi girdiyseniz tekrar göndererek güncelleyebilirsiniz.</p>}
    <div className="two"><label>Ad<input name="firstName" required defaultValue={user?.firstName}/></label><label>Soyad<input name="lastName" required defaultValue={user?.lastName}/></label></div>
    <label>E-posta<input name="email" type="email" required defaultValue={user?.email} readOnly={Boolean(user)}/></label>
    {fields.map(field => <label key={field.key}>{field.label}{field.type === 'textarea' ? <textarea name={field.key} required={field.required}/> : field.type === 'select' ? <select name={field.key} required={field.required}><option value="">Seçin</option>{(field.options ?? []).map(option => <option key={option}>{option}</option>)}</select> : field.type === 'checkbox' ? <input name={field.key} type="checkbox" required={field.required}/> : <input name={field.key} type={field.type === 'phone' ? 'tel' : field.type} required={field.required}/>}</label>)}
    {!user && <label className="consent"><input type="checkbox" name="createAccount" defaultChecked/><span><b>Hesabımı da oluştur</b><small>Şifrenizi belirlemeniz için güvenli, tek kullanımlık bağlantı gönderilir.</small></span></label>}
    {visibleConsents.map(item => { const version = item.definition.versions[0]; return <label className="consent" key={version.id}><input type="checkbox" name={`consent-${version.id}`} required={item.required}/><span><b>{item.definition.title}</b><small>{version.text}</small></span></label>; })}
    {missingVersionConsents.length > 0 && <p className="error">Bu etkinliğin onam yapılandırmasında sorun var. Kurum yöneticisiyle iletişime geçin.</p>}
    {message && <p className="notice" role="status">{message}</p>}
    <button className="primary" disabled={busy}>{busy ? 'Gönderiliyor…' : (existing ? 'Başvuruyu güncelle' : 'Başvuruyu gönder')}</button>
  </form>;
}
