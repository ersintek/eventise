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
      {updates.map((update, index) => <details className="update-card" key={update.version} open={index === 0}>
        <summary>
          <span className="update-version">
            <span>Güncelleme</span>
            <strong>{update.version}</strong>
            {index === 0 && <small>En yeni</small>}
          </span>
          <span className="update-heading">
            <strong>{update.title}</strong>
            <small>{update.changes.length} yenilik · Detayları göster</small>
          </span>
          <span className="update-toggle" aria-hidden="true">+</span>
        </summary>
        <div className="update-content">
          <ul>{update.changes.map(([change, benefit]) => <li key={change}><span className="update-check">✓</span><div><p>{change}</p><small>+ {benefit}</small></div></li>)}</ul>
        </div>
      </details>)}
    </div>
  </AboutShell>;
}
