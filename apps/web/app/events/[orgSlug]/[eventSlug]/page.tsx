import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { RegistrationField, RegistrationForm } from './registration-form';
import { formatDateLong, formatTime } from '@/lib/datetime';
import { MarkdownContent } from '../../../components/markdown-content';
import { EventShare } from './event-share';

interface EventData {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string;
  format: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  venueName: string | null;
  venueAddress: string | null;
  capacity: number;
  registrationStatus: string;
  registrationMode: string;
  visibility: 'PUBLIC' | 'LINK_ONLY' | 'INVITE_ONLY';
  accentColor: string;
  coverImageUrl: string | null;
  organization: { name: string; slug: string; description: string | null; website: string | null; logoUrl: string | null };
  faqs: Array<{ id: string; question: string; answer: string }>;
}

async function getEvent(orgSlug: string, eventSlug: string): Promise<EventData | null> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/public/events/${orgSlug}/${eventSlug}`, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Etkinlik bilgileri alınamadı.');
  return response.json();
}

function absoluteAsset(url: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  const base = process.env.PUBLIC_APP_URL?.replace(/\/$/, '');
  return base ? `${base}${url}` : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ orgSlug: string; eventSlug: string }> }): Promise<Metadata> {
  const { orgSlug, eventSlug } = await params;
  const event = await getEvent(orgSlug, eventSlug);
  if (!event) return { title: 'Etkinlik bulunamadı' };
  const description = event.summary || `${event.organization.name} tarafından düzenlenen ${event.title} etkinliği.`;
  const image = absoluteAsset(event.coverImageUrl);
  return {
    title: `${event.title} | ${event.organization.name}`,
    description,
    openGraph: { title: event.title, description, type: 'website', locale: 'tr_TR', ...(image ? { images: [{ url: image, alt: event.title }] } : {}) },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: event.title, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function PublicEvent({ params }: { params: Promise<{ orgSlug: string; eventSlug: string }> }) {
  const { orgSlug, eventSlug } = await params;
  const event = await getEvent(orgSlug, eventSlug);
  if (!event) notFound();
  const base = `${process.env.API_INTERNAL_URL}/api`;
  const [consentResponse, formResponse] = await Promise.all([
    fetch(`${base}/public/event-consents/${event.id}`, { cache: 'no-store' }),
    fetch(`${base}/public/event-forms/${event.id}`, { cache: 'no-store' }),
  ]);
  const consents = consentResponse.ok ? await consentResponse.json() : [];
  const form = formResponse.ok ? await formResponse.json() as { schema: { fields?: RegistrationField[] } } : { schema: { fields: [] } };
  const token = (await cookies()).get('eventise_session')?.value;
  let session: { user: { email: string; firstName: string; lastName: string }; registration: { applicationStatus: string } | null } | null = null;
  if (token) {
    try {
      const response = await fetch(`${base}/participant/events/${event.id}/registration`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (response.ok) session = await response.json();
    } catch { /* Kayıt formu misafir olarak kullanılmaya devam eder. */ }
  }
  const registrationOpen = event.registrationStatus === 'OPEN';
  const formatLabel = event.format === 'ONLINE' ? 'Çevrim içi' : event.format === 'HYBRID' ? 'Hibrit' : 'Yüz yüze';
  const sameDay = new Date(event.startsAt).toDateString() === new Date(event.endsAt).toDateString();
  const initials = event.organization.name.trim().slice(0, 1).toLocaleUpperCase('tr-TR');
  const style = { '--event-accent': event.accentColor || '#4F46E5' } as CSSProperties;

  return <main className="public-event-page" style={style}>
    <header className="public-event-header">
      <a className="public-organizer-brand" href="#organizer" aria-label={`${event.organization.name} hakkında`}>
        <span className="public-organizer-logo">{event.organization.logoUrl ? <img src={event.organization.logoUrl} alt={`${event.organization.name} logosu`}/> : <b>{initials}</b>}</span>
        <span><small>DÜZENLEYEN</small><strong>{event.organization.name}</strong></span>
      </a>
      <span className="eventise-trust"><i>e</i> Eventise ile güvenli kayıt</span>
    </header>

    <section className={`public-event-hero${event.coverImageUrl ? ' has-cover' : ''}`} style={event.coverImageUrl ? { backgroundImage: `url(${event.coverImageUrl})` } : undefined}>
      <div className="public-event-hero-overlay" />
      <div className="public-event-hero-content">
        <div className="event-status-row"><span>{formatLabel}</span><span className={registrationOpen ? 'open' : 'closed'}>{registrationOpen ? 'Kayıt açık' : 'Kayıt kapalı'}</span></div>
        <p className="hero-organizer">{event.organization.name} sunar</p>
        <h1>{event.title}</h1>
        {event.summary && <p className="event-lead">{event.summary}</p>}
        <div className="hero-actions">{registrationOpen && <a className="event-register-button" href="#registration">Kayıt ol <span>→</span></a>}<a className="event-details-link" href="#event-details">Etkinliği incele</a></div>
      </div>
    </section>

    <section className="event-fact-strip" aria-label="Etkinlik özeti">
      <article><span className="fact-icon">01</span><div><small>TARİH VE SAAT</small><strong>{formatDateLong(event.startsAt)}</strong><p>{sameDay ? `${formatTime(event.startsAt)}–${formatTime(event.endsAt)}` : `${formatTime(event.startsAt)} – ${formatDateLong(event.endsAt)}, ${formatTime(event.endsAt)}`}</p></div></article>
      <article><span className="fact-icon">02</span><div><small>{event.format === 'ONLINE' ? 'KATILIM' : 'MEKÂN'}</small><strong>{event.format === 'ONLINE' ? 'Çevrim içi etkinlik' : event.venueName || 'Daha sonra duyurulacak'}</strong>{event.venueAddress && event.format !== 'ONLINE' && <p>{event.venueAddress}</p>}</div></article>
      <article><span className="fact-icon">03</span><div><small>KONTENJAN</small><strong>{event.capacity} katılımcı</strong><p>{event.registrationMode === 'APPROVAL' ? 'Başvurular değerlendirilir' : 'Kayıt sırasına göre'}</p></div></article>
    </section>

    <div className="public-event-layout" id="event-details">
      <div className="public-event-content">
        <section className="public-content-section event-about"><p className="section-kicker">ETKİNLİK HAKKINDA</p><h2>Neden katılmalısınız?</h2>{event.description ? <MarkdownContent>{event.description}</MarkdownContent> : <p>{event.summary || 'Etkinlik ayrıntıları kurum tarafından yakında paylaşılacaktır.'}</p>}</section>
        {event.venueAddress && event.format !== 'ONLINE' && <section className="public-content-section event-location"><p className="section-kicker">KONUM</p><h2>Buluşma noktası</h2><div className="location-card"><span>⌖</span><div><strong>{event.venueName}</strong><p>{event.venueAddress}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress)}`} target="_blank" rel="noopener noreferrer">Haritada aç ↗</a></div></div></section>}
        <section className="public-content-section organizer-card" id="organizer"><div className="organizer-card-logo">{event.organization.logoUrl ? <img src={event.organization.logoUrl} alt=""/> : <b>{initials}</b>}</div><div><p className="section-kicker">DÜZENLEYEN KURUM</p><h2>{event.organization.name}</h2>{event.organization.description && <p>{event.organization.description}</p>}{event.organization.website && <a href={event.organization.website} target="_blank" rel="noopener noreferrer">Kurumun web sitesini ziyaret et ↗</a>}</div></section>
        {event.faqs.length > 0 && <section className="public-content-section event-faq"><p className="section-kicker">MERAK EDİLENLER</p><h2>Sık sorulan sorular</h2><div>{event.faqs.map(item => <details key={item.id}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div></section>}
        {event.visibility !== 'INVITE_ONLY' && <EventShare title={event.title}/>}
      </div>
      <RegistrationForm orgSlug={orgSlug} eventSlug={eventSlug} open={registrationOpen} consents={consents} fields={form.schema.fields ?? []} session={session}/>
    </div>

    <footer className="public-event-footer"><div className="footer-organizer"><span className="public-organizer-logo">{event.organization.logoUrl ? <img src={event.organization.logoUrl} alt=""/> : <b>{initials}</b>}</span><div><strong>{event.organization.name}</strong><small>Topluluklar için birlikte üretiyoruz.</small></div></div><span className="eventise-trust"><i>e</i> eventise</span></footer>
    {registrationOpen && <a className="mobile-registration-cta" href="#registration">Kayıt ol <span>→</span></a>}
  </main>;
}
