import Link from 'next/link';
import { Cop31Actions } from './cop31-actions';
import { copy, directoryHref, eventContent, eventHref, formatEventDate, formatLabel, isPast, localized } from './cop31-data';
import type { Cop31Event, Cop31Locale } from './cop31-types';

function DetailStatus({ event, locale }: { event: Cop31Event; locale: Cop31Locale }) {
  const words = copy[locale];
  if (event.status === 'POSTPONED') return <span className="cop31-status postponed">{words.postponed}</span>;
  if (event.status === 'CANCELLED') return <span className="cop31-status cancelled">{words.cancelled}</span>;
  if (isPast(event)) return <span className="cop31-status">{words.past}</span>;
  return null;
}

export function Cop31Detail({ event, locale }: { event: Cop31Event; locale: Cop31Locale }) {
  const words = copy[locale];
  const content = eventContent(event, locale);
  const title = localized(event, 'title', locale);
  const description = localized(event, 'description', locale);
  const place = event.format === 'ONLINE' ? words.online : [content.venueName, content.venueAddress, content.city, content.country].filter(Boolean).join(', ');
  const connection = content.cop31Connection;
  const otherLanguageHref = eventHref(event, locale === 'tr' ? 'en' : 'tr');
  return <main className="cop31-page cop31-detail-page">
    <header className="cop31-header"><Link className="cop31-brand" href="/" aria-label="Eventise ana sayfa"><span>e</span><b>eventise</b></Link><div className="cop31-header-actions"><Link href={otherLanguageHref}>{locale === 'tr' ? 'EN' : 'TR'}</Link><Link href={directoryHref(locale)}>{words.back}</Link></div></header>
    <article className="cop31-detail-shell">
      <div className="cop31-detail-topline"><Link href={directoryHref(locale)}>← {words.back}</Link><DetailStatus event={event} locale={locale}/></div>
      <header className="cop31-detail-hero"><p>{connection}</p><h1>{title}</h1><div className="cop31-detail-tags">{content.topics.map(topic => <span key={topic}>{topic}</span>)}</div></header>
      <section className="cop31-detail-facts" aria-label="Event facts">
        <article><span>01</span><div><small>{words.when}</small><strong>{formatEventDate(event, locale)}</strong><p>{event.timezone}</p></div></article>
        <article><span>02</span><div><small>{words.where}</small><strong>{place || words.inPerson}</strong><p>{formatLabel(event.format, locale)}</p></div></article>
        <article><span>03</span><div><small>{words.eventLanguage}</small><strong>{content.languages.join(' · ')}</strong><p>{connection}</p></div></article>
      </section>
      <div className="cop31-detail-layout">
        <div className="cop31-detail-content">
          <section><p className="cop31-eyebrow">{words.about}</p><h2>{words.about}</h2>{description ? description.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>{localized(event, 'summary', locale)}</p>}</section>
          <section className="cop31-organizer-card"><p className="cop31-eyebrow">{words.organizers}</p><h2>{content.organizers.join(' · ')}</h2>{content.organizerUrl && <a href={content.organizerUrl} target="_blank" rel="noopener noreferrer">{locale === 'tr' ? 'Kurumun web sitesini ziyaret et' : 'Visit the organizer’s website'} ↗</a>}</section>
          <section className="cop31-source-card"><span aria-hidden="true">↗</span><div><p className="cop31-eyebrow">{words.source}</p><h2>{locale === 'tr' ? 'Etkinlik bilgisi için kaynak bağlantısı' : 'Source for event information'}</h2><a href={content.sourceUrl} target="_blank" rel="noopener noreferrer">{words.source} ↗</a></div></section>
        </div>
        <aside className="cop31-attend-card"><p className="cop31-eyebrow">{words.access}</p><h2>{locale === 'tr' ? 'Bu etkinliğe katılın' : 'Attend this event'}</h2><p>{localized(event, 'summary', locale)}</p>{content.registrationUrl ? <a className="cop31-primary-link" href={content.registrationUrl} target="_blank" rel="noopener noreferrer">{words.register} <span>→</span></a> : content.informationUrl ? <a className="cop31-primary-link" href={content.informationUrl} target="_blank" rel="noopener noreferrer">{words.information} <span>→</span></a> : <p className="cop31-no-registration">{words.noRegistration}</p>}<Cop31Actions event={event} locale={locale}/>{event.verifiedAt && <p className="cop31-verified">{words.updated}: {new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(event.verifiedAt))}</p>}</aside>
      </div>
    </article>
    <footer className="cop31-footer"><span>© {new Date().getFullYear()} Eventise</span><Link href={directoryHref(locale)}>{locale === 'tr' ? 'COP31 Etkinlikleri' : 'COP31 Events'}</Link></footer>
  </main>;
}
