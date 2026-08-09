'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizationSetupPage() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [existingOrganization, setExistingOrganization] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch('/api/backend/organization-access').then(async response => {
      if (response.status === 401) router.replace('/login/organization');
      else if (response.ok && (await response.json()).organizations?.length) router.replace('/dashboard');
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setExistingOrganization(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/backend/organizations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...values, authorityDeclared: values.authorityDeclared === 'on', organizationTermsAccepted: values.organizationTermsAccepted === 'on', organizationTermsVersion: '1.0' }) });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json();
      if (data.code === 'ORGANIZATION_EXISTS' && data.organization) setExistingOrganization(data.organization);
      setError(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Kurum oluşturulamadı.');
      return;
    }
    router.push('/dashboard/events/new'); router.refresh();
  }

  async function requestJoin() {
    if (!existingOrganization) return;
    setBusy(true); setError('');
    const response = await fetch(`/api/backend/organizations/${existingOrganization.id}/join-requests`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Katılma isteği gönderilemedi.'); return; }
    router.push('/organization/access'); router.refresh();
  }

  if (!confirmed) return <main className="center-shell"><section className="onboarding-card setup-confirmation">
    <div className="logo dark"><b>e</b>eventise</div><p className="eyebrow">YENİ KURUM</p><h1>Yeni bir STK çalışma alanı mı oluşturuyorsunuz?</h1>
    <p>Bu işlem yalnızca kurumunuz Eventise&apos;da henüz kayıtlı değilse yapılmalıdır. Mevcut bir kurumun ekibine katılacaksanız yeni alan oluşturmayın; yöneticiniz sizi kayıtlı e-posta adresinizle davet etsin.</p>
    <div className="setup-warning"><b>Devam etmeden önce</b><p>Kurum adına işlem yapma yetkiniz olduğundan ve daha önce aynı kurum için çalışma alanı açılmadığından emin olun.</p></div>
    <button className="primary" onClick={() => setConfirmed(true)}>Evet, yeni bir kurum oluşturuyorum</button>
    <Link className="secondary link-button" href="/organization/access">Hayır, yöneticimin davetini bekleyeceğim</Link>
  </section></main>;

  return <main className="center-shell"><form className="onboarding-card" onSubmit={submit}>
    <div className="logo dark"><b>e</b>eventise</div><p className="eyebrow">KURUM BİLGİLERİ</p><h1>STK çalışma alanınızı oluşturun</h1>
    <p>Bu bilgiler kurumunuzu tanımlar. Oluşturduğunuzda kurum yöneticisi olarak atanırsınız.</p>
    <label>Kurum adı<input name="name" required minLength={2}/></label>
    <label>Kurum türü<select name="organizationType" defaultValue="DERNEK"><option value="DERNEK">Dernek</option><option value="VAKIF">Vakıf</option><option value="TOPLULUK">Topluluk / inisiyatif</option><option value="KOOPERATIF">Kooperatif</option><option value="DIGER">Diğer</option></select></label>
    <label>Kurumdaki göreviniz<input name="representativeRole" required minLength={2} placeholder="Başkan, yönetim kurulu üyesi, koordinatör…"/></label>
    <label>Kısa ad<input name="slug" required pattern="[a-z0-9-]+" placeholder="ornek-dernek"/><small>Yalnızca küçük harf, rakam ve tire.</small></label>
    <label>İletişim e-postası<input name="contactEmail" type="email" required/></label>
    <label>İnternet sitesi<input name="website" type="url" placeholder="https://"/></label>
    <label>Kısa açıklama<textarea name="description" maxLength={500}/></label>
    <label className="consent"><input name="authorityDeclared" type="checkbox" required/><span>Bu kurum adına Eventise üzerinde işlem yapmaya yetkili olduğumu ve verdiğim bilgilerin doğru olduğunu beyan ederim.</span></label>
    <label className="consent"><input name="organizationTermsAccepted" type="checkbox" required/><span><a href="/legal/kurumsal-kullanim" target="_blank">Kurumsal Kullanım Sözleşmesi</a>&apos;ni kurum adına okudum ve kabul ediyorum.</span></label>
    {error && <p className={existingOrganization ? 'notice' : 'error'} role="alert">{error}</p>}
    {existingOrganization && <button className="secondary" type="button" disabled={busy} onClick={requestJoin}>{busy ? 'Gönderiliyor…' : `${existingOrganization.name} kurumuna katılma isteği gönder`}</button>}
    <button className="primary" disabled={busy}>{busy ? 'Oluşturuluyor…' : 'Kurumu oluştur ve devam et'}</button>
    <button type="button" className="intent-back" onClick={() => setConfirmed(false)}>← Önceki adıma dön</button>
  </form></main>;
}
