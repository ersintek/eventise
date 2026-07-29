import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { RegistrationField, RegistrationForm } from './registration-form';
import { formatDateFull } from '@/lib/datetime';
import { MarkdownContent } from '../../../components/markdown-content';

interface EventData { id:string; title:string; summary:string|null; description:string|null; startsAt:string; endsAt:string; format:'OFFLINE'|'ONLINE'|'HYBRID'; venueName:string|null; venueAddress:string|null; capacity:number; registrationStatus:string; registrationMode:string; organization:{name:string}; faqs:Array<{id:string;question:string;answer:string}> }

export default async function PublicEvent({ params }: { params: Promise<{ orgSlug: string; eventSlug: string }> }) {
  const { orgSlug, eventSlug } = await params;
  const base = `${process.env.API_INTERNAL_URL}/api`;
  const response = await fetch(`${base}/public/events/${orgSlug}/${eventSlug}`, { cache: 'no-store' });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Etkinlik bilgileri alınamadı.');
  const event = await response.json() as EventData;
  const [consentResponse, formResponse] = await Promise.all([
    fetch(`${base}/public/event-consents/${event.id}`, { cache: 'no-store' }),
    fetch(`${base}/public/event-forms/${event.id}`, { cache: 'no-store' }),
  ]);
  const consents = consentResponse.ok ? await consentResponse.json() : [];
  const form = formResponse.ok ? await formResponse.json() as { schema: { fields?: RegistrationField[] } } : { schema: { fields: [] } };
  // Giriş yapmış kullanıcıyı algıla
  const token = (await cookies()).get('eventise_session')?.value;
  let session: { user: { email: string; firstName: string; lastName: string }; registration: { applicationStatus: string } | null } | null = null;
  if (token) {
    try { const r = await fetch(`${base}/participant/events/${event.id}/registration`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' }); if (r.ok) session = await r.json(); } catch {}
  }
  const registrationOpen=event.registrationStatus==='OPEN';
  const formatLabel=event.format==='ONLINE'?'Çevrim içi':event.format==='HYBRID'?'Hibrit':'Yüz yüze';
  return <main className="public-event">
    <header><div className="logo dark"><b>e</b>eventise</div><span className="organizer-name">{event.organization.name}</span></header>
    <section className="event-hero">
      <div className="event-hero-status"><span>{formatLabel}</span><span className={registrationOpen?'open':'closed'}>{registrationOpen?'Kayıt açık':'Kayıt kapalı'}</span></div>
      <p className="eyebrow">{event.organization.name}</p><h1>{event.title}</h1><p>{event.summary??''}</p>
      {registrationOpen&&<a className="primary event-primary-cta" href="#registration">Kayıt ol</a>}
      <div className="event-facts"><div><small>Tarih</small><b>{formatDateFull(event.startsAt)}</b></div><div><small>{event.format==='ONLINE'?'Etkinlik türü':'Mekân'}</small><b>{event.format==='ONLINE'?'Çevrim içi':event.venueName??'Daha sonra duyurulacak'}</b></div><div><small>Kontenjan</small><b>{event.capacity} kişi</b></div></div>
    </section>
    <div className="public-columns"><section className="event-content"><div className="event-content-block"><p className="eyebrow">ETKİNLİK</p><h2>Etkinlik hakkında</h2>{event.description?<MarkdownContent>{String(event.description)}</MarkdownContent>:<p>{event.summary??'Etkinlik ayrıntıları kurum tarafından paylaşılacaktır.'}</p>}</div>{event.venueAddress&&event.format!=='ONLINE'&&<div className="event-content-block"><p className="eyebrow">KONUM</p><h2>Nasıl katılacaksınız?</h2><p><b>{event.venueName}</b><br/>{event.venueAddress}</p></div>}{event.faqs.length>0&&<div className="event-content-block"><p className="eyebrow">MERAK EDİLENLER</p><h2>Sık sorulan sorular</h2>{event.faqs.map(item=><details key={item.id}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>}</section><RegistrationForm orgSlug={orgSlug} eventSlug={eventSlug} open={registrationOpen} consents={consents} fields={form.schema.fields??[]} session={session}/></div>
    {registrationOpen&&<a className="mobile-registration-cta" href="#registration">Kayıt ol</a>}
  </main>;
}
