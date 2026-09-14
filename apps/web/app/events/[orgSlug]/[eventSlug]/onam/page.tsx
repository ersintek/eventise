import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarkdownContent } from '../../../../components/markdown-content';
import { getEventConsents, getPublicEvent } from '../event-data';

type PageProps = { params: Promise<{ orgSlug: string; eventSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orgSlug, eventSlug } = await params;
  const event = await getPublicEvent(orgSlug, eventSlug);
  return event ? { title: `${event.title} etkinlik onamı` } : { title: 'Etkinlik bulunamadı' };
}

export default async function ConsentPage({ params }: PageProps) {
  const { orgSlug, eventSlug } = await params;
  const event = await getPublicEvent(orgSlug, eventSlug);
  if (!event) notFound();

  const consents = await getEventConsents(event.id);
  const consent = consents[0]?.definition.versions[0];
  if (!consent) notFound();

  const eventHref = `/events/${orgSlug}/${eventSlug}`;
  const initials = event.organization.name.trim().slice(0, 1).toLocaleUpperCase('tr-TR');
  const style = { '--event-accent': event.accentColor || '#4F46E5' } as CSSProperties;

  return <main className="public-event-page public-consent-page" style={style}>
    <header className="public-event-header consent-page-header">
      <a className="public-organizer-brand" href={eventHref} aria-label={`${event.organization.name} etkinlik sayfasına dön`}>
        <span className="public-organizer-logo">{event.organization.logoUrl ? <img src={event.organization.logoUrl} alt={`${event.organization.name} logosu`}/> : <b>{initials}</b>}</span>
        <span><small>DÜZENLEYEN</small><strong>{event.organization.name}</strong></span>
      </a>
      <a className="registration-back-link" href={eventHref}>← Etkinlik sayfası</a>
    </header>

    <div className="public-consent-shell">
      <article className="public-consent-document">
        <p className="section-kicker">ETKİNLİK ONAMI</p>
        <h1>{consents[0].definition.title}</h1>
        <p className="consent-event-name">{event.title}</p>
        <MarkdownContent className="consent-document-body">{consent.text}</MarkdownContent>
      </article>
    </div>
  </main>;
}
