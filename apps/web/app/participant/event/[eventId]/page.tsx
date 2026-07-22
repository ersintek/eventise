import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ParticipantArea } from '../../participant-area';

export default async function ParticipantEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const base = `${process.env.API_INTERNAL_URL}/api`;
  const headers = { authorization: `Bearer ${token}` };
  const [regResponse, eventResponse, certResponse] = await Promise.all([
    fetch(`${base}/participant/events/${eventId}/registration`, { headers, cache: 'no-store' }),
    fetch(`${base}/public/events/${eventId}`, { headers, cache: 'no-store' }).catch(() => null),
    fetch(`${base}/participant/certificates`, { headers, cache: 'no-store' }),
  ]);
  if (regResponse.status === 401) redirect('/login');
  const session = regResponse.ok ? await regResponse.json() : null;
  const event = eventResponse?.ok ? await eventResponse.json() : null;
  const certificates = certResponse?.ok ? await certResponse.json() : [];
  const cert = certificates.find((c: any) => c.event?.id === eventId);
  const title = event?.title ?? session?.event?.title ?? 'Etkinlik';
  const orgName = event?.organization?.name ?? session?.event?.organization?.name ?? '';
  const startsAt = event?.startsAt ?? session?.event?.startsAt;
  const period = session?.registration ? 'CURRENT' : 'PAST';

  return <main className="participant-standalone participant-event-page">
    <div className="participant-event-header">
      <Link href="/participant" className="participant-back">← Tüm etkinliklerim</Link>
      <p className="eyebrow">{orgName}</p>
      <h1>{title}</h1>
      {startsAt && <p className="participant-date">{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(startsAt))}</p>}
      {session?.registration && <span className={`pill ${session.registration.applicationStatus === 'ACCEPTED' ? 'published' : ''}`}>{session.registration.applicationStatus === 'ACCEPTED' ? 'Kabul edildiniz ✓' : session.registration.applicationStatus}</span>}
    </div>
    {session?.registration
      ? <ParticipantArea history={[{ id: eventId, title, startsAt: startsAt ?? new Date().toISOString(), period: period as 'CURRENT' | 'PAST', organization: { name: orgName } }]} certificates={cert ? [cert] : []} />
      : <section className="empty-state participant-empty"><span className="empty-illustration">✦</span><h2>Bu etkinliğe kaydınız bulunamadı</h2><p>Etkinlik sayfasından kayıt olabilir veya kurum yöneticisiyle iletişime geçebilirsiniz.</p>{event && <Link className="primary link-button" href={`/events/${event.organization?.slug}/${event.slug}`}>Etkinlik sayfasına git</Link>}</section>
    }
  </main>;
}
