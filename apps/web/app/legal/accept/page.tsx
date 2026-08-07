'use client';
import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LegalAcceptanceForm() {
  const router = useRouter(), search = useSearchParams();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const destination = ['onboarding', 'participant', 'dashboard'].includes(search.get('destination') ?? '') ? search.get('destination')! : 'participant';
  const destinationPath = destination === 'onboarding' ? '/onboarding' : destination === 'dashboard' ? '/dashboard' : '/participant';
  useEffect(() => { void fetch('/api/backend/legal/status').then(async response => {
    if (response.status === 401) router.replace('/login');
    else if (response.ok && (await response.json()).userTermsAccepted) router.replace(destinationPath);
  }); }, [router, destinationPath]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const response = await fetch('/api/backend/legal/accept-user-terms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ version: '1.0' }) });
    setBusy(false);
    if (!response.ok) { setError('Kabul kaydedilemedi. Lütfen yeniden deneyin.'); return; }
    router.push(destinationPath); router.refresh();
  }
  return <main className="center-shell"><form className="onboarding-card" onSubmit={submit}><div className="logo dark"><b>e</b>eventise</div><p className="eyebrow">SON BİR ADIM</p><h1>Kullanım koşulları</h1><p>Koşulları kabul ettikten sonra {destination === 'onboarding' ? 'kurum çalışma alanınızı oluşturma adımına' : destination === 'dashboard' ? 'kurum panelinize' : 'katılımcı alanınıza'} yönlendirileceksiniz.</p><label className="consent"><input type="checkbox" required/><span><Link href="/legal/kullanici-sozlesmesi" target="_blank">Eventise Kullanıcı Sözleşmesi</Link>&apos;ni okudum ve kabul ediyorum.</span></label><p><Link href="/legal/kvkk-aydinlatma" target="_blank">KVKK Aydınlatma Metni</Link> kişisel verilerinizin nasıl işlendiğini açıklar.</p>{error&&<p className="error">{error}</p>}<button className="primary" disabled={busy}>{busy?'Kaydediliyor…':'Kabul et ve devam et'}</button></form></main>;
}

export default function LegalAcceptancePage() {
  return <Suspense fallback={<main className="center-shell"><section className="onboarding-card">Yükleniyor…</section></main>}><LegalAcceptanceForm/></Suspense>;
}
