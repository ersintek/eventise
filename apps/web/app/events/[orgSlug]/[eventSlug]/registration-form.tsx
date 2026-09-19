'use client';

import { FormEvent, useState } from 'react';

type Consent = { required: boolean; definition: { title: string; versions: Array<{ id: string; text: string }> } };
export type RegistrationField = { key: string; type: 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'select' | 'checkbox'; label: string; required: boolean; options: string[] };

type RegistrationFormProps = {
  eventId: string;
  orgSlug: string;
  eventSlug: string;
  open: boolean;
  consents: Consent[];
  fields: RegistrationField[];
  formVersionId?: string;
  registrationMode: string;
  session: { user: { email: string; firstName: string; lastName: string }; registration: { applicationStatus: string; answers: Record<string, unknown> } | null } | null;
  standalone?: boolean;
};

const statusLabel: Record<string, string> = {
  SUBMITTED: 'Başvurunuz alındı',
  PENDING: 'Başvurunuz değerlendiriliyor',
  ACCEPTED: 'Başvurunuz onaylandı',
  WAITLISTED: 'Yedek listedesiniz',
  REJECTED: 'Başvurunuz reddedildi',
};

const statusMessage: Record<string, string> = {
  SUBMITTED: 'Başvurunuz güvenle kaydedildi.',
  PENDING: 'Kurum başvurunuzu değerlendiriyor. Sonuç e-postayla bildirilecek.',
  ACCEPTED: 'Başvurunuz kabul edildi. Etkinlik bilgilerini katılımcı alanınızdan takip edebilirsiniz.',
  WAITLISTED: 'Kontenjan dolu olduğu için yedek listeye alındınız.',
  REJECTED: 'Başvurunuz bu etkinlik için kabul edilmedi.',
};

function RegistrationEmailReminder() {
  return <section className="registration-email-reminder" aria-label="E-posta bildirimi hatırlatması"><b>E-posta kutunuzu kontrol edin</b><p>Size gönderdiğimiz e-posta spam klasöründeyse güvenli e-posta olarak işaretleyin. Bu etkinlikle ilgili bildirimleri almanız için önemlidir.</p></section>;
}

export function RegistrationForm({ eventId, orgSlug, eventSlug, open, consents, fields, formVersionId, registrationMode, session, standalone = false }: RegistrationFormProps) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(session?.registration?.applicationStatus);
  const user = session?.user;
  const existing = session?.registration;
  const eventConsent = consents[0];
  const consentVersion = eventConsent?.definition.versions[0];
  const missingConsentVersion = Boolean(eventConsent?.required && !consentVersion);
  const consentHref = `/events/${orgSlug}/${eventSlug}-onam`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const consentVersionIds = consentVersion && data.get('event-consent') ? [consentVersion.id] : [];
    const answers = Object.fromEntries(fields.map(field => [field.key, field.type === 'checkbox' ? data.get(field.key) === 'on' : data.get(field.key)]));
    const payload = {
      firstName: data.get('firstName'),
      lastName: data.get('lastName'),
      email: data.get('email'),
      answers,
      formVersionId,
      consentVersionIds,
      createAccount: user ? false : data.get('createAccount') === 'on',
    };
    try {
      const response = await fetch(`/api/public/events/${orgSlug}/${eventSlug}/registrations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const text = response.ok
        ? statusMessage[result.status] ?? 'Başvurunuz alındı.'
        : Array.isArray(result.message) ? result.message.join(' ') : result.message ?? 'Başvuru gönderilemedi.';
      setMessage(text);
      if (response.ok) {
        setComplete(true);
        form.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setMessage('Bağlantı kurulamadı. Bilgileriniz korunuyor; lütfen yeniden deneyin.');
    } finally {
      setBusy(false);
    }
  }

  async function updateAnswers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (registrationMode === 'APPROVAL' && !window.confirm('Yanıtlarınızı güncellediğinizde başvurunuz yeniden değerlendirmeye alınacaktır. Devam etmek istiyor musunuz?')) return;
    setBusy(true); setMessage('');
    const data = new FormData(event.currentTarget);
    const answers = Object.fromEntries(fields.map(field => [field.key, field.type === 'checkbox' ? data.get(field.key) === 'on' : data.get(field.key)]));
    try {
      const update = await fetch(`/api/backend/participant/events/${eventId}/registration`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers }) });
      const result = await update.json();
      if (!update.ok) throw new Error(Array.isArray(result.message) ? result.message.join(' ') : result.message ?? 'Başvurunuz güncellenemedi.');
      setApplicationStatus(result.applicationStatus);
      setEditMode(false);
      setMessage(result.requiresReview ? 'Yanıtlarınız güncellendi. Başvurunuz yeniden değerlendirmeye alındı.' : 'Yanıtlarınız güncellendi. Başvurunuz onaylı olarak kalıyor.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Başvurunuz güncellenemedi.');
    } finally { setBusy(false); }
  }

  const cardClass = `registration-card${standalone ? ' standalone-registration-form' : ''}`;
  if (!open) return <aside className={`${cardClass} registration-state`} id="registration"><span className="registration-icon">–</span><p className="eyebrow">BAŞVURU DURUMU</p><h2>Başvuru formu kapalı</h2><p className="registration-explainer">Etkinlik bilgilerini inceleyebilirsiniz; şu anda yeni başvuru alınmıyor.</p></aside>;
  if (existing && !editMode) return <aside className={`${cardClass} registration-state`} id="registration"><span className="registration-icon">✓</span><p className="eyebrow">BAŞVURU DURUMUNUZ</p><h2>{statusLabel[applicationStatus ?? existing.applicationStatus] ?? applicationStatus ?? existing.applicationStatus}</h2><p className="registration-explainer">{message || statusMessage[applicationStatus ?? existing.applicationStatus] || 'Başvurunuz kaydedildi.'}</p><RegistrationEmailReminder/><p className="participant-notice"><b>{user?.email}</b></p>{(applicationStatus ?? existing.applicationStatus)==='ACCEPTED'&&<button type="button" className="secondary" onClick={()=>setEditMode(true)}>Yanıtlarımı düzenle</button>}</aside>;
  if (complete) return <aside className={`${cardClass} registration-state success`} id="registration"><span className="registration-icon">✓</span><p className="eyebrow">BAŞVURUNUZ ALINDI</p><h2>Başvuru tamamlandı</h2><p className="registration-explainer">{message}</p><RegistrationEmailReminder/><p className="registration-security">Bilgileriniz güvenli biçimde kaydedildi.</p></aside>;

  if (existing && editMode) return <form className={cardClass} id="registration" onSubmit={updateAnswers}>
    <div className="registration-heading"><p className="eyebrow">BAŞVURU YANITLARINIZ</p><h2>Yanıtlarınızı düzenleyin</h2><p className="registration-explainer">Yalnızca etkinlik sorularındaki yanıtlarınızı güncelleyebilirsiniz.</p></div>
    {registrationMode === 'APPROVAL' && <p className="participant-notice"><b>Önemli:</b> Kaydettiğinizde başvurunuz yeniden değerlendirmeye alınacaktır.</p>}
    <fieldset className="registration-form-section"><legend>Etkinlik soruları</legend>{fields.length ? fields.map(field => field.type === 'checkbox'
      ? <label className="consent custom-consent" key={field.key}><input name={field.key} type="checkbox" required={field.required} defaultChecked={Boolean(existing.answers?.[field.key])}/><span><b>{field.label}</b></span></label>
      : <label key={field.key}>{field.label}{field.required && <span className="required-mark"> *</span>}{field.type === 'textarea'
        ? <textarea name={field.key} required={field.required} defaultValue={String(existing.answers?.[field.key] ?? '')}/>
        : field.type === 'select'
          ? <select name={field.key} required={field.required} defaultValue={String(existing.answers?.[field.key] ?? '')}><option value="">Seçin</option>{(field.options ?? []).map(option => <option key={option}>{option}</option>)}</select>
          : <input name={field.key} type={field.type === 'phone' ? 'tel' : field.type} required={field.required} defaultValue={String(existing.answers?.[field.key] ?? '')}/>}</label>) : <p className="friendly-status">Bu başvuru formunda düzenlenebilecek ek soru yok.</p>}</fieldset>
    {message && <p className="notice" role="status">{message}</p>}<div className="action-links"><button type="button" className="secondary" disabled={busy} onClick={()=>setEditMode(false)}>Vazgeç</button><button className="event-submit-button" disabled={busy||!fields.length}>{busy?'Kaydediliyor…':'Yanıtları kaydet'}<span>→</span></button></div>
  </form>;

  return <form className={cardClass} id="registration" onSubmit={submit}>
    <div className="registration-heading"><p className="eyebrow">BAŞVURU FORMU</p><h2>Etkinliğe başvurun</h2><p className="registration-explainer">Zorunlu alanları doldurup başvurunuzu gönderin.</p></div>
    {user && <p className="participant-notice"><b>{user.email}</b> hesabıyla devam ediyorsunuz.</p>}
    <fieldset className="registration-form-section">
      <legend>İletişim bilgileri</legend>
      <div className="two"><label>Ad<input name="firstName" autoComplete="given-name" required defaultValue={user?.firstName}/></label><label>Soyad<input name="lastName" autoComplete="family-name" required defaultValue={user?.lastName}/></label></div>
      <label>E-posta<input name="email" type="email" autoComplete="email" required defaultValue={user?.email} readOnly={Boolean(user)}/></label>
    </fieldset>
    {fields.length > 0 && <fieldset className="registration-form-section">
      <legend>Etkinlik soruları</legend>
      {fields.map(field => field.type === 'checkbox'
        ? <label className="consent custom-consent" key={field.key}><input name={field.key} type="checkbox" required={field.required}/><span><b>{field.label}</b></span></label>
        : <label key={field.key}>{field.label}{field.required && <span className="required-mark"> *</span>}{field.type === 'textarea'
          ? <textarea name={field.key} required={field.required}/>
          : field.type === 'select'
            ? <select name={field.key} required={field.required}><option value="">Seçin</option>{(field.options ?? []).map(option => <option key={option}>{option}</option>)}</select>
            : <input name={field.key} type={field.type === 'phone' ? 'tel' : field.type} required={field.required}/>}</label>)}
    </fieldset>}
    <fieldset className="registration-form-section registration-preferences">
      <legend>Onaylar</legend>
      {!user && <label className="consent account-consent"><input type="checkbox" name="createAccount" defaultChecked/><span><b>Katılımcı hesabımı oluştur</b><small>Etkinliği takip etmeniz için güvenli hesap bağlantısı e-postanıza gönderilir.</small></span></label>}
      {consentVersion && <label className="consent"><input type="checkbox" name="event-consent" required={eventConsent.required}/><span><b>Onamı kabul ediyorum</b><a className="consent-view-link" href={consentHref} target="_blank" rel="noopener noreferrer">(Onamı görüntülemek için tıklayın)</a></span></label>}
      {missingConsentVersion && <p className="error">Etkinliğin onam yapılandırmasında bir sorun var. Lütfen düzenleyen kurumla iletişime geçin.</p>}
    </fieldset>
    {message && <p className="notice" role="status">{message}</p>}
    <button className="event-submit-button" disabled={busy || missingConsentVersion}>{busy ? 'Gönderiliyor…' : 'Başvuruyu gönder'}<span>→</span></button>
    <p className="registration-security"><span>✓</span> Bilgileriniz yalnızca bu etkinliğin başvuru süreci için kullanılır.</p>
  </form>;
}
