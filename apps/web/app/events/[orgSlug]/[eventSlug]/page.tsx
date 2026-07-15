import { notFound } from 'next/navigation';
import { RegistrationField, RegistrationForm } from './registration-form';

interface EventData { id: string; title: string; summary: string | null; description: string | null; startsAt: string; venueName: string | null; capacity: number; registrationStatus: string; organization: { name: string }; faqs: Array<{ id: string; question: string; answer: string }> }

export default async function PublicEvent({ params }: { params: Promise<{ orgSlug: string; eventSlug: string }> }) {
  const { orgSlug, eventSlug } = await params;
  const base = `${process.env.API_INTERNAL_URL}/api`;
  const response = await fetch(`${base}/public/events/${orgSlug}/${eventSlug}`, { cache: 'no-store' });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Etkinlik bilgileri alınamadı.');
  const event = await response.json() as EventData;
  const [consentResponse, formResponse] = await Promise.all([
    fetch(`${base}/public/events/${event.id}/consents`, { cache: 'no-store' }),
    fetch(`${base}/public/event-forms/${event.id}`, { cache: 'no-store' }),
  ]);
  const consents = consentResponse.ok ? await consentResponse.json() : [];
  const form = formResponse.ok ? await formResponse.json() as { schema: { fields?: RegistrationField[] } } : { schema: { fields: [] } };
  return <main className="public-event"><header><div className="logo dark"><b>e</b>eventise</div><span>{event.organization.name}</span></header><section className="event-hero"><p className="eyebrow">ETKİNLİK</p><h1>{event.title}</h1><p>{event.summary ?? event.description}</p><div className="event-facts"><div><small>Tarih</small><b>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(event.startsAt))}</b></div><div><small>Mekân</small><b>{event.venueName ?? 'Daha sonra duyurulacak'}</b></div><div><small>Kontenjan</small><b>{event.capacity} kişi</b></div></div></section><div className="public-columns"><section><h2>Etkinlik hakkında</h2><p>{event.description ?? event.summary ?? 'Etkinlik ayrıntıları kurum tarafından paylaşılacaktır.'}</p>{event.faqs.length > 0 && <><h2>Sık sorulan sorular</h2>{event.faqs.map(item => <details key={item.id}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</>}</section><RegistrationForm orgSlug={orgSlug} eventSlug={eventSlug} open={event.registrationStatus === 'OPEN'} consents={consents} fields={form.schema.fields ?? []} /></div></main>;
}
