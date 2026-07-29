'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function OrganizationLegalAcceptanceForm() {
  const router = useRouter();
  const search = useSearchParams();
  const organizationId = search.get('organizationId') ?? '';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/backend/legal/accept-organization-terms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        version: '1.0',
        representativeRole: form.get('representativeRole'),
        authorityDeclared: form.get('authorityDeclared') === 'on',
      }),
    });
    setBusy(false);
    if (!response.ok) { const data = await response.json(); setError(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Kabul kaydedilemedi.'); return; }
    router.push('/dashboard'); router.refresh();
  }

  if (!organizationId) return <main className="center-shell"><section className="onboarding-card"><p className="error">Kurum bilgisi bulunamadı.</p></section></main>;
  return <main className="center-shell"><form className="onboarding-card" onSubmit={submit}>
    <div className="logo dark"><b>e</b>eventise</div><p className="eyebrow">KURUM ERİŞİMİ</p><h1>Yetkinizi doğrulayın</h1>
    <p>Kurum katılımcı verilerine erişmeden önce güncel kurumsal koşulları kabul etmeniz gerekir.</p>
    <label>Kurumdaki göreviniz<input name="representativeRole" required minLength={2} placeholder="Koordinatör, etkinlik sorumlusu…"/></label>
    <label className="consent"><input name="authorityDeclared" type="checkbox" required/><span>Bu kurum adına Eventise üzerinde işlem yapmaya yetkili olduğumu ve verdiğim bilgilerin doğru olduğunu beyan ederim.</span></label>
    <label className="consent"><input type="checkbox" required/><span><Link href="/legal/kurumsal-kullanim" target="_blank">Kurumsal Kullanım Sözleşmesi</Link>&apos;ni kurum adına okudum ve kabul ediyorum.</span></label>
    {error&&<p className="error">{error}</p>}<button className="primary" disabled={busy}>{busy?'Kaydediliyor…':'Kabul et ve devam et'}</button>
  </form></main>;
}

export default function OrganizationLegalAcceptancePage() {
  return <Suspense fallback={<main className="center-shell"><section className="onboarding-card">Yükleniyor…</section></main>}><OrganizationLegalAcceptanceForm/></Suspense>;
}
