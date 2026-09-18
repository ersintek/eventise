import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { formatDate, formatTime } from '@/lib/datetime';

type Event = { id: string; title: string; startsAt: string; endsAt: string; publicationStatus: string; registrationStatus: string; registrationSummary?: { pending: number }; _count?: { registrations?: number } };

async function api<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login/organization');
  if (!response.ok) throw new Error('Etkinlikler alınamadı.');
  return response.json();
}

function EventRow({ event, now }: { event: Event; now: number }) {
  const start = new Date(event.startsAt), end = new Date(event.endsAt);
  const isCurrent = start.getTime() <= now && end.getTime() >= now;
  const isPast = end.getTime() < now;
  const pending = event.registrationSummary?.pending ?? 0;
  const state = event.publicationStatus !== 'PUBLISHED' ? 'Taslak · Katılımcılar henüz göremez' : isCurrent ? 'Etkinlik sürüyor' : isPast ? 'Tamamlandı' : event.registrationStatus === 'OPEN' ? 'Başvurular açık' : 'Başvuru alınmıyor';
  const action = event.publicationStatus !== 'PUBLISHED' ? 'Etkinliği hazırla' : isCurrent ? 'Katılımı aç' : isPast ? 'Kapanışı aç' : pending > 0 ? 'Başvuruları gör' : 'Etkinliği yönet';
  const section = event.publicationStatus !== 'PUBLISHED' ? 'settings?subtab=info' : isCurrent ? 'day' : isPast ? 'post-event' : 'applications';
  return <article className="dashboard-two-event"><div className="dashboard-two-event-date"><b>{start.getDate()}</b><small>{start.toLocaleDateString('tr-TR', { month: 'short' })}</small></div><div className="dashboard-two-event-copy"><div className="dashboard-two-event-title"><h3>{event.title}</h3><span className="dashboard-two-event-state">{state}</span></div><p>{formatDate(event.startsAt)} · {formatTime(event.startsAt)} · {event._count?.registrations ?? 0} başvuru</p></div><div className="dashboard-two-event-actions"><Link href={`/dashboard-2/events/${event.id}/${section}`}>{action}</Link><Link href={`/dashboard-2/events/${event.id}/settings?subtab=info`}>Yönet</Link></div></article>;
}

export default async function DashboardTwoPage() {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login/organization');
  const organizations = await api<Array<{ id: string }>>('organizations', token);
  if (!organizations.length) redirect('/organization/access');
  const events = await api<Event[]>(`organizations/${organizations[0].id}/events`, token);
  const now = Date.now();
  const ordered = [...events].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const groups = [
    { title: 'Devam eden', rows: ordered.filter(event => event.publicationStatus === 'PUBLISHED' && +new Date(event.startsAt) <= now && +new Date(event.endsAt) >= now) },
    { title: 'Yaklaşan', rows: ordered.filter(event => event.publicationStatus === 'PUBLISHED' && +new Date(event.startsAt) > now) },
    { title: 'Taslaklar', rows: ordered.filter(event => event.publicationStatus !== 'PUBLISHED') },
    { title: 'Tamamlanan', rows: ordered.filter(event => event.publicationStatus === 'PUBLISHED' && +new Date(event.endsAt) < now) },
  ].filter(group => group.rows.length);
  return <><header className="dashboard-two-page-heading"><div><p className="eyebrow">ETKİNLİKLER</p><h1>Etkinliklerin</h1><p>Hazırladığın, yaklaşan ve tamamlanan etkinlikleri buradan yönet.</p></div><Link className="dashboard-two-create" href="/dashboard-2/events/new">＋ Yeni etkinlik</Link></header>{groups.length ? groups.map(group => <section className="dashboard-two-group" key={group.title}><div className="dashboard-two-group-head"><h2>{group.title}</h2><span>{group.rows.length} etkinlik</span></div><div className="dashboard-two-event-list">{group.rows.map(event => <EventRow key={event.id} event={event} now={now}/>)}</div></section>) : <section className="dashboard-two-empty"><b>Henüz etkinlik oluşturmadın.</b><p>İlk etkinliğini oluşturarak katılımcı sayfanı ve başvuru sürecini hazırlayabilirsin.</p><Link className="dashboard-two-create" href="/dashboard-2/events/new">Yeni etkinlik oluştur</Link></section>}</>;
}
