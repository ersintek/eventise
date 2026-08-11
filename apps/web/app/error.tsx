'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="system-state-page"><section className="system-state-card"><div className="logo dark"><b>e</b>eventise</div><span className="system-state-symbol" aria-hidden="true">!</span><p className="eyebrow">BİR ŞEY TERS GİTTİ</p><h1>Bu ekranı hazırlayamadık.</h1><p>Bilgileriniz korunuyor. Bağlantınızı kontrol edip işlemi yeniden deneyebilirsiniz.</p><div><button className="primary" onClick={reset}>Yeniden dene <span aria-hidden="true">→</span></button><button className="secondary" onClick={() => window.location.assign('/dashboard')}>Ana sayfaya dön</button></div></section></main>;
}
