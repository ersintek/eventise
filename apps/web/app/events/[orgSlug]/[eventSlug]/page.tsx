import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RegistrationForm } from './registration-form';
import { formatDateLong, formatTime } from '@/lib/datetime';
import { MarkdownContent } from '../../../components/markdown-content';
import { EventShare } from './event-share';
import { getPublicEvent, getRegistrationContext } from './event-data';

function absoluteAsset(url: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  const base = process.env.PUBLIC_APP_URL?.replace(/\/$/, '');
  return base ? `${base}${url}` : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ orgSlug: string; eventSlug: string }> }): Promise<Metadata> {
  const { orgSlug, eventSlug } = await params;
  const event = await getPublicEvent(orgSlug, eventSlug);
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
  const event = await getPublicEvent(orgSlug, eventSlug);
  if (!event) notFound();
  const { consents, fields, formVersionId, session } = await getRegistrationContext(event.id);
  const registrationOpen = event.registrationStatus === 'OPEN';
  const formatLabel = event.format === 'ONLINE' ? 'Çevrim içi' : event.format === 'HYBRID' ? 'Hibrit' : 'Yüz yüze';
  const sameDay = new Date(event.startsAt).toDateString() === new Date(event.endsAt).toDateString();
  const initials = event.organization.name.trim().slice(0, 1).toLocaleUpperCase('tr-TR');
  const style = { '--event-accent': event.accentColor || '#4F46E5' } as CSSProperties;
  const dedicatedRegistration = fields.length > 5;
  const registrationHref = dedicatedRegistration ? `/events/${orgSlug}/${eventSlug}/kayit` : '#registration';
  const aboutDescription = event.description?.replace(/^\s*#{1,3}\s*(?:Etkinlik hakkında|Hakkında)\s*(?:\r?\n)+/i, '');

  return <main className="public-event-page" style={style}>
    <header className="public-event-header">
      <a className="public-organizer-brand" href="#organizer" aria-label={`${event.organization.name} hakkında`}>
        <span className="public-organizer-logo">{event.organization.logoUrl ? <img src={event.organization.logoUrl} alt={`${event.organization.name} logosu`}/> : <b>{initials}</b>}</span>
        <span><small>DÜZENLEYEN</small><strong>{event.organization.name}</strong></span>
      </a>
      <span className="eventise-trust"><i>e</i> Eventise ile güvenli kayıt</span>
    </header>

    <section className={`public-event-hero${event.coverImageUrl ? ' has-cover' : ''}`}>
      {event.coverImageUrl && <div className="public-event-cover-art" aria-hidden="true"><img src={event.coverImageUrl} alt="" /></div>}
      <div className="public-event-hero-overlay" />
      <div className="public-event-hero-content">
        <div className="event-status-row"><span>{formatLabel}</span><span className={registrationOpen ? 'open' : 'closed'}>{registrationOpen ? 'Kayıt formu açık' : 'Kayıt formu kapalı'}</span></div>
        <h1>{event.title}</h1>
        {event.summary && <p className="event-lead">{event.summary}</p>}
        <div className="hero-actions">{registrationOpen && <a className="event-register-button" href={registrationHref}>Kayıt ol <span>→</span></a>}<a className="event-details-link" href="#event-details">Etkinlik bilgileri</a></div>
      </div>
    </section>

    <section className="event-fact-strip" aria-label="Etkinlik özeti">
      <article><span className="fact-icon">01</span><div><small>TARİH VE SAAT</small><strong>{formatDateLong(event.startsAt)}</strong><p>{sameDay ? `${formatTime(event.startsAt)}–${formatTime(event.endsAt)}` : `${formatTime(event.startsAt)} – ${formatDateLong(event.endsAt)}, ${formatTime(event.endsAt)}`}</p></div></article>
      <article><span className="fact-icon">02</span><div><small>{event.format === 'OFFLINE' ? 'MEKÂN' : 'KATILIM'}</small><strong>{event.format === 'ONLINE' ? 'Çevrim içi' : event.venueName || formatLabel}</strong>{event.venueAddress && event.format !== 'ONLINE' && <p>{event.venueAddress}</p>}</div></article>
      <article><span className="fact-icon">03</span><div><small>KONTENJAN</small><strong>{event.capacity} katılımcı</strong><p>{event.registrationMode === 'APPROVAL' ? 'Başvurular değerlendirilir' : 'Kayıt sırasına göre'}</p></div></article>
    </section>

    <nav className="public-section-nav" aria-label="Etkinlik sayfası bölümleri">
      <a href="#about">Etkinlik hakkında</a>
      {event.venueAddress && event.format !== 'ONLINE' && <a href="#location">Mekân</a>}
      {event.faqs.length > 0 && <a href="#faq">SSS</a>}
      {registrationOpen && <a href={registrationHref}>Kayıt</a>}
    </nav>

    <div className="public-event-layout" id="event-details">
      <div className="public-event-content">
        <section className="public-content-section event-about" id="about"><p className="section-kicker">ETKİNLİK BİLGİLERİ</p><h2>Etkinlik hakkında</h2>{aboutDescription ? <MarkdownContent>{aboutDescription}</MarkdownContent> : <p>{event.summary || 'Etkinlik açıklaması henüz eklenmedi.'}</p>}</section>
        {event.venueAddress && event.format !== 'ONLINE' && <section className="public-content-section event-location" id="location"><p className="section-kicker">MEKÂN</p><h2>{event.venueName || 'Etkinlik mekânı'}</h2><div className="location-card"><span>⌖</span><div><p>{event.venueAddress}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress)}`} target="_blank" rel="noopener noreferrer">Haritada aç ↗</a></div></div></section>}
        <section className="public-content-section organizer-card" id="organizer"><div className="organizer-card-logo">{event.organization.logoUrl ? <img src={event.organization.logoUrl} alt=""/> : <b>{initials}</b>}</div><div><p className="section-kicker">DÜZENLEYEN KURUM</p><h2>{event.organization.name}</h2>{event.organization.description && <p>{event.organization.description}</p>}{event.organization.website && <a href={event.organization.website} target="_blank" rel="noopener noreferrer">Kurumun web sitesini ziyaret et ↗</a>}</div></section>
        {event.faqs.length > 0 && <section className="public-content-section event-faq" id="faq"><p className="section-kicker">SSS</p><h2>Sık sorulan sorular</h2><div>{event.faqs.map(item => <details key={item.id}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div></section>}
        {event.visibility !== 'INVITE_ONLY' && <EventShare title={event.title}/>}
      </div>
      {dedicatedRegistration && registrationOpen
        ? <aside className="registration-card registration-launch-card" id="registration"><p className="eyebrow">KAYIT FORMU</p><h2>Başvurunuzu tamamlayın</h2><p className="registration-explainer">Formda iletişim bilgilerinin ardından {fields.length} etkinlik sorusu bulunuyor.</p><a className="event-submit-button" href={registrationHref}>Kayıt formunu aç <span>→</span></a><p className="registration-security"><span>✓</span> Yanıtlarınız yalnızca bu etkinliğin kayıt süreci için kullanılır.</p></aside>
        : <RegistrationForm orgSlug={orgSlug} eventSlug={eventSlug} open={registrationOpen} consents={consents} fields={fields} formVersionId={formVersionId} session={session}/>}
    </div>

    <footer className="public-event-footer"><div className="footer-organizer"><span className="public-organizer-logo">{event.organization.logoUrl ? <img src={event.organization.logoUrl} alt=""/> : <b>{initials}</b>}</span><div><strong>{event.organization.name}</strong><small>Düzenleyen kurum</small></div></div><span className="eventise-trust"><i>e</i> eventise</span></footer>
    {registrationOpen && <a className="mobile-registration-cta" href={registrationHref}>Kayıt ol <span>→</span></a>}
  </main>;
}
