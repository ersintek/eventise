import type { Metadata } from 'next';
import { AboutShell } from '../about-shell';
import { updates } from '../about-data';

export const metadata: Metadata = { title: 'Yenilikler — Eventise' };

export default function UpdatesPage() {
  return <AboutShell activeTab="updates">
    <section className="updates-intro">
      <div><p className="eyebrow">ÜRÜN GÜNLÜĞÜ</p><h2>İlk günden bugüne</h2></div>
      <p>Eventise’a eklenen özellikleri ve deneyimi iyileştiren değişiklikleri burada bulabilirsiniz. En yeni güncelleme her zaman en üstte yer alır.</p>
    </section>
    <div className="updates-list">
      {updates.map((update, index) => <details className="update-card" key={update.version}>
        <summary>
          <span className="update-version">
            <span>Güncelleme</span>
            <strong>{update.version}</strong>
            {index === 0 && <small>{'label' in update ? update.label : 'En yeni'}</small>}
          </span>
          <span className="update-heading">
            <strong>{update.title}</strong>
            <small>{update.changes.length} yenilik</small>
          </span>
          <span className="update-toggle" aria-hidden="true">
            <span className="update-toggle-closed">Detaylar</span>
            <span className="update-toggle-open">Kapat</span>
            <svg viewBox="0 0 20 20" fill="none"><path d="m5.5 7.5 4.5 4.5 4.5-4.5" /></svg>
          </span>
        </summary>
        <div className="update-content">
          <ul>{update.changes.map(([change, benefit]) => <li key={change}><span className="update-check">✓</span><div><p>{change}</p><small>+ {benefit}</small></div></li>)}</ul>
        </div>
      </details>)}
    </div>
  </AboutShell>;
}
