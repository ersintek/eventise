'use client';

import { useState } from 'react';
import type { Cop31Event, Cop31Locale } from './cop31-types';
import { copy, eventContent, localized } from './cop31-data';

function icsDate(value: string) { return new Date(value).toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}/, ''); }

export function Cop31Actions({ event, locale }: { event: Cop31Event; locale: Cop31Locale }) {
  const [message, setMessage] = useState('');
  const words = copy[locale];
  const content = eventContent(event, locale);
  const title = localized(event, 'title', locale);
  const url = typeof window === 'undefined' ? '' : window.location.href;

  async function share() {
    const text = locale === 'tr' ? `${title} etkinliğini inceleyin` : `Explore ${title}`;
    try {
      if (navigator.share) await navigator.share({ title, text, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setMessage(locale === 'tr' ? 'Bağlantı kopyalandı.' : 'Link copied.');
    } catch { /* A closed share sheet is not an error state. */ }
  }

  function calendar() {
    const location = event.format === 'ONLINE' ? (content.registrationUrl || content.informationUrl || '') : [content.venueName, content.venueAddress, content.city, content.country].filter(Boolean).join(', ');
    const body = [`BEGIN:VCALENDAR`, `VERSION:2.0`, `PRODID:-//Eventise//COP31 Directory//EN`, `BEGIN:VEVENT`, `UID:cop31-${event.id}@eventise`, `DTSTAMP:${icsDate(new Date().toISOString())}`, `DTSTART:${icsDate(event.startsAt)}`, ...(event.endsAt ? [`DTEND:${icsDate(event.endsAt)}`] : []), `SUMMARY:${title.replaceAll('\n', ' ')}`, `DESCRIPTION:${localized(event, 'summary', locale).replaceAll('\n', ' ')}`, `LOCATION:${location.replaceAll('\n', ' ')}`, ...(url ? [`URL:${url}`] : []), `END:VEVENT`, `END:VCALENDAR`].join('\r\n');
    const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = href; anchor.download = `${event.slug}.ics`; anchor.click(); URL.revokeObjectURL(href);
    setMessage(locale === 'tr' ? 'Takvim dosyası indirildi.' : 'Calendar file downloaded.');
  }

  return <div className="cop31-actions">
    <button type="button" className="cop31-action-button" onClick={share}><span aria-hidden="true">↗</span>{words.share}</button>
    <button type="button" className="cop31-action-button" onClick={calendar}><span aria-hidden="true">＋</span>{words.calendar}</button>
    {message && <p role="status" className="cop31-action-feedback">{message}</p>}
  </div>;
}
