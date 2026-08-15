import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicEvent, getRegistrationContext } from '../event-data';
import { RegistrationForm } from '../registration-form';

type PageProps = { params: Promise<{ orgSlug: string; eventSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orgSlug, eventSlug } = await params;
  const event = await getPublicEvent(orgSlug, eventSlug);
  return event ? { title: `${event.title} kayıt formu` } : { title: 'Etkinlik bulunamadı' };
}

export default async function RegistrationPage({ params }: PageProps) {
  const { orgSlug, eventSlug } = await params;
  const event = await getPublicEvent(orgSlug, eventSlug);
  if (!event) notFound();
  const { consents, fields, formVersionId, session } = await getRegistrationContext(event.id);
  const eventHref = `/events/${orgSlug}/${eventSlug}`;
  const initials = event.organization.name.trim().slice(0, 1).toLocaleUpperCase('tr-TR');
  const style = { '--event-accent': event.accentColor || '#4F46E5' } as CSSProperties;

  return <main className="public-event-page public-registration-page" style={style}>
    <header className="public-event-header registration-page-header">
      <a className="public-organizer-brand" href={eventHref} aria-label={`${event.organization.name} etkinlik sayfasına dön`}>
        <span className="public-organizer-logo">{event.organization.logoUrl ? <img src={event.organization.logoUrl} alt={`${event.organization.name} logosu`}/> : <b>{initials}</b>}</span>
        <span><small>DÜZENLEYEN</small><strong>{event.organization.name}</strong></span>
      </a>
      <a className="registration-back-link" href={eventHref}>← Etkinlik sayfası</a>
    </header>

    <div className="public-registration-shell">
      <section className="registration-page-intro">
        <p className="section-kicker">KAYIT FORMU</p>
        <h1>{event.title}</h1>
        <p>{event.summary || 'Başvurunuzu tamamlamak için aşağıdaki alanları doldurun.'}</p>
        <div className="registration-page-progress" aria-label="Form içeriği">
          <span><b>1</b> İletişim bilgileri</span>
          <span><b>2</b> {fields.length} etkinlik sorusu</span>
          <span><b>3</b> Onaylar</span>
        </div>
      </section>
      <RegistrationForm
        orgSlug={orgSlug}
        eventSlug={eventSlug}
        open={event.registrationStatus === 'OPEN'}
        consents={consents}
        fields={fields}
        formVersionId={formVersionId}
        session={session}
        standalone
      />
    </div>
  </main>;
}
