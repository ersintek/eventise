import Link from 'next/link';

export default function NotFound() {
  return <main className="system-state-page"><section className="system-state-card"><div className="logo dark"><b>e</b>eventise</div><span className="system-state-code">404</span><p className="eyebrow">SAYFA BULUNAMADI</p><h1>Aradığınız sayfa burada değil.</h1><p>Bağlantı değişmiş veya sayfa artık kullanılamıyor olabilir. Güvenli bir yerden devam edebilirsiniz.</p><div><Link className="primary link-button" href="/dashboard">Ana sayfaya dön <span aria-hidden="true">→</span></Link><Link className="secondary link-button" href="/yardim">Kullanım rehberi</Link></div></section></main>;
}
