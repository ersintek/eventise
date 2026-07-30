'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [existingOrganization, setExistingOrganization] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage(''); setExistingOrganization(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/backend/organizations', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...values, authorityDeclared: values.authorityDeclared === 'on', organizationTermsAccepted: values.organizationTermsAccepted === 'on', organizationTermsVersion: '1.0' }),
    });
    setBusy(false);
    if (!response.ok) { const data = await response.json(); if (data.code === 'ORGANIZATION_EXISTS' && data.organization) setExistingOrganization(data.organization); setError(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Kurum oluşturulamadı.'); return; }
    router.push('/dashboard/events/new'); router.refresh();
  }
  async function requestJoin() {
    if (!existingOrganization) return;
    setBusy(true); setError(''); setMessage('');
    const response = await fetch(`/api/backend/organizations/${existingOrganization.id}/join-requests`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setError(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Katılma isteği gönderilemedi.'); return; }
    setMessage(`Katılma isteğiniz ${existingOrganization.name} yöneticilerine gönderildi.`);
    setExistingOrganization(null);
  }
  return <main className="center-shell"><form className="onboarding-card" onSubmit={submit}>
    <div className="logo dark"><b>e</b>eventise</div><p className="eyebrow">1 / 2 · KURUM BİLGİLERİ</p><h1>Çalışma alanınızı oluşturalım</h1>
    <p>Kurumunuzu oluşturduktan sonra ilk etkinliğinizi hazırlayacağız.</p>
    <label>Kurum adı<input name="name" required minLength={2}/></label>
    <label>Kurum türü<select name="organizationType" defaultValue="DERNEK"><option value="DERNEK">Dernek</option><option value="VAKIF">Vakıf</option><option value="TOPLULUK">Topluluk / inisiyatif</option><option value="KOOPERATIF">Kooperatif</option><option value="DIGER">Diğer</option></select></label>
    <label>Kurumdaki göreviniz<input name="representativeRole" required minLength={2} placeholder="Başkan, yönetim kurulu üyesi, koordinatör…"/></label>
    <label>Kısa ad<input name="slug" required pattern="[a-z0-9-]+" placeholder="ornek-dernek"/><small>Yalnızca küçük harf, rakam ve tire.</small></label>
    <label>İletişim e-postası<input name="contactEmail" type="email" required/></label>
    <label>İnternet sitesi<input name="website" type="url" placeholder="https://"/></label>
    <label>Kısa açıklama<textarea name="description" maxLength={500}/></label>
    <label className="consent"><input name="authorityDeclared" type="checkbox" required/><span>Bu kurum adına Eventise üzerinde işlem yapmaya yetkili olduğumu ve verdiğim bilgilerin doğru olduğunu beyan ederim.</span></label>
    <label className="consent"><input name="organizationTermsAccepted" type="checkbox" required/><span><a href="/legal/kurumsal-kullanim" target="_blank">Kurumsal Kullanım Sözleşmesi</a>&apos;ni kurum adına okudum ve kabul ediyorum.</span></label>
    {error&&<p className={existingOrganization?'notice':'error'} role="alert">{error}</p>}
    {message&&<p className="notice" role="status">{message}</p>}
    {existingOrganization&&<button className="secondary" type="button" disabled={busy} onClick={requestJoin}>{busy?'Gönderiliyor…':`${existingOrganization.name} kurumuna katılma isteği gönder`}</button>}
    <button className="primary" disabled={busy}>{busy?'Oluşturuluyor…':'Devam et: İlk etkinlik →'}</button>
  </form></main>;
}
