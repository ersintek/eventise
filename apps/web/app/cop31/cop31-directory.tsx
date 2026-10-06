'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { copy, dayNumber, directoryHref, eventContent, eventHref, formatEventDate, formatLabel, isPast, localized, monthName } from './cop31-data';
import type { Cop31Event, Cop31Locale } from './cop31-types';

type View = 'upcoming' | 'newest' | 'past' | 'all';

const dateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)].filter(Boolean).join('-');
};

const dateFilterValue = (value: string) => {
  const match = /^(\d{2})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '';
  const day = Number(match[1]), month = Number(match[2]), year = 2000 + Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return '';
  return `${year}-${match[2]}-${match[1]}`;
};

const readableDate = (value: string, locale: Cop31Locale) => new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));

function eventStatus(event: Cop31Event, locale: Cop31Locale) {
  const words = copy[locale];
  if (event.status === 'POSTPONED') return words.postponed;
  if (event.status === 'CANCELLED') return words.cancelled;
  if (isPast(event)) return words.past;
  return null;
}

function EventCard({ event, locale }: { event: Cop31Event; locale: Cop31Locale }) {
  const words = copy[locale];
  const status = eventStatus(event, locale);
  const content = eventContent(event, locale);
  const place = event.format === 'ONLINE' ? words.online : [content.city, content.country].filter(Boolean).join(', ') || content.venueName || words.inPerson;
  return <article className={`cop31-event-card${event.status === 'CANCELLED' ? ' is-cancelled' : ''}`}>
    <time className="cop31-date-badge" dateTime={event.startsAt}><strong>{dayNumber(event, locale)}</strong><span>{monthName(event, locale)}</span></time>
    <div className="cop31-card-main">
      <div className="cop31-card-meta"><span>{formatEventDate(event, locale)}</span><span aria-hidden="true">·</span><span>{formatLabel(event.format, locale)}</span><span aria-hidden="true">·</span><span>{place}</span></div>
      <h2><Link href={eventHref(event, locale)}>{localized(event, 'title', locale)}</Link></h2>
      <p>{localized(event, 'summary', locale)}</p>
      <div className="cop31-card-tags"><span className="cop31-connection-tag">{content.cop31Connection}</span>{content.topics.map(topic => <span key={topic}>{topic}</span>)}</div>
      <p className="cop31-organizer-line"><span>{words.organizers}</span>{content.organizers.join(' · ')}</p>
    </div>
    <div className="cop31-card-action">
      {status && <span className={`cop31-status ${event.status.toLowerCase()}`}>{status}</span>}
      <Link href={eventHref(event, locale)}>{words.details}<span aria-hidden="true">→</span></Link>
    </div>
  </article>;
}

export function Cop31Directory({ events, locale }: { events: Cop31Event[]; locale: Cop31Locale }) {
  const words = copy[locale];
  const [view, setView] = useState<View>('upcoming');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [dateEntry, setDateEntry] = useState('');
  const [region, setRegion] = useState('');
  const [format, setFormat] = useState('');
  const [access, setAccess] = useState('');
  const [language, setLanguage] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const topics = useMemo(() => [...new Set(events.flatMap(event => eventContent(event, locale).topics))].sort(), [events, locale]);
  const regions = useMemo(() => [...new Set(events.map(event => eventContent(event, locale).country).filter((value): value is string => Boolean(value)))].sort((left, right) => left.localeCompare(right, locale === 'tr' ? 'tr' : 'en')), [events, locale]);
  const languages = useMemo(() => [...new Set(events.flatMap(event => eventContent(event, locale).languages))].sort(), [events, locale]);
  const accessOptions = useMemo(() => [...new Set(events.map(event => eventContent(event, locale).access).filter((value): value is string => Boolean(value)))].sort(), [events, locale]);
  const shown = useMemo(() => {
    const newestThreshold = Date.now() - 21 * 24 * 60 * 60 * 1000;
    const needle = query.trim().toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US');
    return events.filter(event => {
      const content = eventContent(event, locale);
      if (view === 'upcoming' && (isPast(event) || event.status === 'CANCELLED')) return false;
      if (view === 'past' && !isPast(event)) return false;
      if (view === 'newest' && new Date(event.createdAt).getTime() < newestThreshold) return false;
      if (topic && !content.topics.includes(topic)) return false;
      if (date) {
        const eventDate = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: event.timezone }).formatToParts(new Date(event.startsAt)).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
        if (`${eventDate.year}-${eventDate.month}-${eventDate.day}` !== date) return false;
      }
      if (region && content.country !== region) return false;
      if (format && event.format !== format) return false;
      if (language && !content.languages.includes(language)) return false;
      if (access && content.access !== access) return false;
      if (!needle) return true;
      const searchable = [localized(event, 'title', locale), localized(event, 'summary', locale), content.organizers.join(' '), content.city, content.country, content.topics.join(' ')].filter(Boolean).join(' ').toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US');
      return searchable.includes(needle);
    });
  }, [access, date, events, format, language, locale, query, region, topic, view]);
  const featured = shown.filter(event => event.featured && !isPast(event) && event.status !== 'CANCELLED');
  const clear = () => { setQuery(''); setTopic(''); setDate(''); setDateEntry(''); setRegion(''); setFormat(''); setAccess(''); setLanguage(''); setView('upcoming'); setFiltersOpen(false); };
  const activeFilterCount = [topic, date, region, format, access, language].filter(Boolean).length;
  const updateDate = (value: string) => { const formatted = dateInput(value); setDateEntry(formatted); setDate(dateFilterValue(formatted)); };

  async function copyCurrentUrl() {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(window.location.href); return; }
    const input = document.createElement('textarea');
    input.value = window.location.href; input.setAttribute('readonly', ''); input.style.position = 'fixed'; input.style.opacity = '0';
    document.body.append(input); input.select();
    const copied = document.execCommand('copy'); input.remove();
    if (!copied) throw new Error('copy unavailable');
  }

  async function shareDirectory() {
    const payload = { title: locale === 'tr' ? 'COP31 Etkinlikleri' : 'COP31 Events', url: window.location.href };
    try {
      if (navigator.share) { await navigator.share(payload); return; }
      await copyCurrentUrl(); setShareMessage(locale === 'tr' ? 'Bağlantı kopyalandı.' : 'Link copied.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      try { await copyCurrentUrl(); setShareMessage(locale === 'tr' ? 'Bağlantı kopyalandı.' : 'Link copied.'); }
      catch { setShareMessage(locale === 'tr' ? 'Bağlantı kopyalanamadı.' : 'Could not copy the link.'); }
    }
  }

  return <main className="cop31-page">
    <header className="cop31-header">
      <Link className="cop31-brand" href="/" aria-label="Eventise ana sayfa"><span>e</span><b>eventise</b></Link>
      <div className="cop31-header-actions"><button type="button" onClick={() => void shareDirectory()} aria-label={words.share}>↗ <span>{words.share}</span></button>{shareMessage && <p className="cop31-share-message" role="status">{shareMessage}</p>}</div>
    </header>

    <section className="cop31-hero" aria-labelledby="cop31-title">
      <div className="cop31-hero-copy"><p className="cop31-eyebrow">{words.eyebrow}</p><h1 id="cop31-title">{words.title}</h1><p>{words.intro}</p>
        <div className="cop31-search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={words.search} aria-label={words.search}/>{query && <button type="button" onClick={() => setQuery('')} aria-label={words.clearFilters}>×</button>}</div>
        <p className="cop31-source-note">{words.label}</p>
      </div>
      <div className="cop31-hero-visual" aria-hidden="true"><div className="cop31-hero-orbit"><span className="cop31-orbit-mark">e</span><span className="cop31-orbit-dot one"/><span className="cop31-orbit-dot two"/><span className="cop31-orbit-dot three"/></div><div className="cop31-hero-note"><span>⌁</span><div><b>{locale === 'tr' ? 'COP31 etrafında hareket' : 'Movement around COP31'}</b><small>{locale === 'tr' ? 'Toplantılar, öğrenme ve ortaklıklar için açık rehber.' : 'An open guide to gatherings, learning and partnerships.'}</small></div></div></div>
    </section>

    <nav className="cop31-view-tabs" aria-label={words.filters}>
      {(['upcoming', 'newest', 'past', 'all'] as View[]).map(item => <button key={item} type="button" className={view === item ? 'active' : ''} onClick={() => setView(item)}>{item === 'upcoming' ? words.upcoming : item === 'newest' ? words.newest : item === 'past' ? words.pastEvents : words.all}</button>)}
    </nav>

    <section className="cop31-directory" aria-label="COP31 event directory">
      <button type="button" className="cop31-mobile-filter-toggle" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} aria-controls="cop31-filters"><span>{words.filters}</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}<i aria-hidden="true">⌄</i></button>
      <aside className={`cop31-filters${filtersOpen ? ' is-open' : ''}`} id="cop31-filters">
        <div className="cop31-filter-title"><h2>{words.filters}</h2><button type="button" onClick={clear}>{words.clearFilters}</button></div>
        <label>{words.topic}<select value={topic} onChange={event => setTopic(event.target.value)}><option value="">{words.allTopics}</option>{topics.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>{locale === 'tr' ? 'Tarih (GG-AA-YY)' : 'Date (DD-MM-YY)'}<input value={dateEntry} inputMode="numeric" maxLength={8} placeholder={locale === 'tr' ? 'GG-AA-YY' : 'DD-MM-YY'} onChange={event => updateDate(event.target.value)} />{date && <small className="cop31-filter-date-label">{readableDate(date, locale)}</small>}</label>
        <label>{words.region}<select value={region} onChange={event => setRegion(event.target.value)}><option value="">{locale === 'tr' ? 'Tüm bölgeler' : 'All regions'}</option>{regions.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>{words.format}<select value={format} onChange={event => setFormat(event.target.value)}><option value="">{words.allFormats}</option><option value="ONLINE">{words.online}</option><option value="IN_PERSON">{words.inPerson}</option><option value="HYBRID">{words.hybrid}</option></select></label>
        <label>{words.filterAccess}<select value={access} onChange={event => setAccess(event.target.value)}><option value="">{locale === 'tr' ? 'Tüm erişim türleri' : 'All access types'}</option>{accessOptions.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>{words.language}<select value={language} onChange={event => setLanguage(event.target.value)}><option value="">{words.allLanguages}</option>{languages.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <div className="cop31-filter-note"><span aria-hidden="true">i</span><p>{locale === 'tr' ? 'Etkinlik bilgileri açık kaynaklardan ve doğrudan paylaşılan duyurulardan derlenir.' : 'Event information is curated from public sources and directly shared announcements.'}</p></div>
      </aside>
      <div className="cop31-results">
        <div className="cop31-results-heading"><p>{shown.length} {words.results}</p><span>{view === 'upcoming' ? words.upcoming : view === 'newest' ? words.newest : view === 'past' ? words.pastEvents : words.all}</span></div>
        {featured.length > 0 && <section className="cop31-featured"><div className="cop31-section-label"><span>{words.featured}</span><i /></div>{featured.map(event => <EventCard event={event} locale={locale} key={event.id}/>)}</section>}
        {shown.length > 0 ? <div className="cop31-event-list">{shown.filter(event => !event.featured || featured.length === 0).map(event => <EventCard event={event} locale={locale} key={event.id}/>)}</div> : <div className="cop31-empty"><span aria-hidden="true">⌁</span><h2>{words.emptyTitle}</h2><p>{words.emptyBody}</p><button type="button" onClick={clear}>{words.clearFilters} →</button></div>}
      </div>
    </section>
    <footer className="cop31-footer"><span>© {new Date().getFullYear()} Eventise</span><Link href={directoryHref(locale)}>COP31 Events</Link></footer>
  </main>;
}
