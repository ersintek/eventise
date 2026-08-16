'use client';

import { useMemo, useState } from 'react';

export type GuideItem = { q: string; a: string; path?: string; check?: string };
export type GuideSection = { id: string; title: string; intro?: string; items: GuideItem[] };

const shortcuts = [
  ['İlk etkinliğimi oluşturacağım', 'ilk-etkinlik', '01'],
  ['Yayın ve kayıtları yöneteceğim', 'yayin-kayit', '02'],
  ['Başvuruları yöneteceğim', 'basvurular', '03'],
  ['Etkinlik gününe hazırlanıyorum', 'etkinlik-gunu', '04'],
  ['Sertifika hazırlayacağım', 'sonrasi', '05'],
  ['Bir sorun yaşıyorum', 'destek', '?'],
] as const;

export function GuideBrowser({ sections }: { sections: GuideSection[] }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase('tr-TR');
  const visible = useMemo(() => normalized ? sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => `${item.q} ${item.a} ${item.path ?? ''} ${item.check ?? ''}`.toLocaleLowerCase('tr-TR').includes(normalized)),
    }))
    .filter(section => section.items.length) : sections, [normalized, sections]);
  const resultCount = visible.reduce((total, section) => total + section.items.length, 0);

  return <>
    <section className="help-finder" aria-label="Rehberde arama ve hızlı yollar">
      <label htmlFor="guide-search">
        <span>Nasıl yardımcı olabiliriz?</span>
        <div className="help-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          <input id="guide-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Örn. sertifika, kontenjan, QR kod…"/>
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Aramayı temizle">×</button>}
        </div>
      </label>
      {!query && <div className="help-shortcuts">
        {shortcuts.map(([label, id, number]) => <a href={`#${id}`} key={id}><span>{number}</span>{label}<b>→</b></a>)}
      </div>}
      {query && <p className="help-result-count">{resultCount ? `${resultCount} ilgili yanıt bulundu` : 'Bu aramayla eşleşen bir yanıt bulamadık.'}</p>}
    </section>

    {visible.map(section => (
      <section className="help-section" key={section.id} id={section.id}>
        <h2>{section.title}</h2>
        {section.intro && <p className="help-section-intro">{section.intro}</p>}
        <div className="help-accordion">
          {section.items.map((item, index) => (
            <details key={item.q} open={Boolean(normalized) || (section.id === 'baslangic' && index === 0)}>
              <summary>{item.q}</summary>
              <div className="help-answer">
                {item.path && <div className="help-answer-route"><small>NEREDEN?</small><b>{item.path}</b></div>}
                <p>{item.a}</p>
                {item.check && <div className="help-answer-check"><span>✓</span><p><small>KONTROL</small>{item.check}</p></div>}
              </div>
            </details>
          ))}
        </div>
      </section>
    ))}

    {query && !resultCount && <button className="secondary help-clear-search" type="button" onClick={() => setQuery('')}>Tüm rehberi göster</button>}
  </>;
}
