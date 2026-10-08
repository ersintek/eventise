import Link from 'next/link';

type Locale = 'tr' | 'en';

const content = {
  tr: {
    eyebrow: 'COP31 / 2026',
    title: <>Bir sonraki buluşma<br /><em>şekilleniyor.</em></>,
    body: 'COP31 için daha iyi bir keşif alanı hazırlıyoruz. Etkinlikler, fikirler ve doğru insanları bir araya getiren yeni deneyim çok yakında burada.',
    status: 'GÜNCELLENİYOR',
    returnHome: 'Eventise ana sayfa',
    note: 'Yeni şeyler yolda',
    orbit: 'Bağlantılar, fikirler, etki.',
  },
  en: {
    eyebrow: 'COP31 / 2026',
    title: <>The next gathering<br />is <em>taking shape.</em></>,
    body: 'We are building a better place to discover COP31. A new experience that brings together events, ideas and the right people is on its way.',
    status: 'UPDATING',
    returnHome: 'Eventise home',
    note: 'Something new is on its way',
    orbit: 'Connections, ideas, impact.',
  },
} as const;

export function Cop31ComingSoon({ locale }: { locale: Locale }) {
  const words = content[locale];
  return <main className="cop31-soon">
    <div className="cop31-soon-noise" aria-hidden="true" />
    <header className="cop31-soon-header">
      <Link className="cop31-soon-brand" href="/" aria-label={words.returnHome}><span>e</span><b>eventise</b></Link>
      <span className="cop31-soon-status"><i />{words.status}</span>
    </header>

    <section className="cop31-soon-stage" aria-labelledby="cop31-soon-title">
      <div className="cop31-soon-copy">
        <p className="cop31-soon-eyebrow">{words.eyebrow}</p>
        <h1 id="cop31-soon-title">{words.title}</h1>
        <p className="cop31-soon-body">{words.body}</p>
        <Link className="cop31-soon-link" href="/"><span>{words.returnHome}</span><b aria-hidden="true">↗</b></Link>
      </div>

      <div className="cop31-soon-art" aria-hidden="true">
        <div className="cop31-soon-orbit orbit-one" />
        <div className="cop31-soon-orbit orbit-two" />
        <div className="cop31-soon-orbit orbit-three" />
        <div className="cop31-soon-core"><span>COP</span><strong>31</strong><i>°</i></div>
        <span className="cop31-soon-satellite satellite-one" />
        <span className="cop31-soon-satellite satellite-two" />
        <span className="cop31-soon-satellite satellite-three" />
        <div className="cop31-soon-art-note"><span>✦</span><div><b>{words.note}</b><small>{words.orbit}</small></div></div>
      </div>
    </section>

    <footer className="cop31-soon-footer"><span>© {new Date().getFullYear()} Eventise</span><span>Built for what moves people forward.</span></footer>
  </main>;
}
