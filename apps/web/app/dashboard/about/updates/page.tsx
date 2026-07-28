import type { Metadata } from 'next';
import { AboutShell } from '../about-shell';
import { updates } from '../about-data';

export const metadata: Metadata = { title: 'Güncellemeler — Eventise' };

export default function UpdatesPage() {
  return <AboutShell activeTab="updates">
    <section className="updates-intro">
      <div><p className="eyebrow">ÜRÜN GÜNLÜĞÜ</p><h2>İlk günden bugüne</h2></div>
      <p>Eventise’a eklenen özellikleri ve deneyimi iyileştiren değişiklikleri burada bulabilirsiniz. En yeni güncelleme her zaman en üstte yer alır.</p>
    </section>
    <div className="updates-list">
      {updates.map((update, index) => <article className="update-card" key={update.version}>
        <div className="update-version">
          <span>Güncelleme</span>
          <strong>{update.version}</strong>
          {index === 0 && <small>En yeni</small>}
        </div>
        <div className="update-content">
          <h2>{update.title}</h2>
          <ul>{update.changes.map(([change, benefit]) => <li key={change}><span className="update-check">✓</span><div><p>{change}</p><small>+ {benefit}</small></div></li>)}</ul>
        </div>
      </article>)}
    </div>
  </AboutShell>;
}
