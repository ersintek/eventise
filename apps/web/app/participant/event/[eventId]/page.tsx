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
  const [regResponse, historyResponse, certResponse] = await Promise.all([
    fetch(`${base}/participant/events/${eventId}/registration`, { headers, cache: 'no-store' }),
    fetch(`${base}/participant/history`, { headers, cache: 'no-store' }),
    fetch(`${base}/participant/certificates`, { headers, cache: 'no-store' }),
  ]);
  if (regResponse.status === 401) redirect('/login');
  const session = regResponse.ok ? await regResponse.json() : null;
  const history = historyResponse.ok ? await historyResponse.json() : [];
  const certificates = certResponse?.ok ? await certResponse.json() : [];
  const eventInfo = history.find((h: any) => h.id === eventId);
  const title = eventInfo?.title ?? 'Etkinlik';
  const orgName = eventInfo?.organization?.name ?? '';
  const startsAt = eventInfo?.startsAt;
  const eventCerts = certificates.filter((c: any) => c.event?.id === eventId);

  if (!session?.registration) {
    return <main className="participant-standalone participant-event-page">
      <div className="participant-event-header">
        <Link href="/participant" className="participant-back">← Tüm etkinliklerim</Link>
        <h1>{title}</h1>
      </div>
      <section className="empty-state participant-empty"><span className="empty-illustration">✦</span><h2>Bu etkinliğe kaydınız bulunamadı</h2><p>Etkinlik sayfasından kayıt olabilirsiniz.</p></section>
    </main>;
  }

  return <main className="participant-standalone participant-event-page">
    <div className="participant-event-header">
      <Link href="/participant" className="participant-back">← Tüm etkinliklerim</Link>
      <p className="eyebrow">{orgName}</p>
    </div>
    {startsAt && <ParticipantArea eventId={eventId} title={title} orgName={orgName} startsAt={startsAt} certificates={eventCerts} />}
  </main>;
}
