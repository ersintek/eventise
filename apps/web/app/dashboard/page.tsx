import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppNav, MobileTopBar } from '../components/navigation';
import { formatDate, formatTime } from '@/lib/datetime';

type EventSummary = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  publicationStatus: string;
  registrationStatus: string;
  _count?: { registrations?: number };
};

async function api<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (response.status === 401) redirect('/login');
  if (!response.ok) throw new Error('Veriler alınamadı.');
  return response.json();
}

const statusName: Record<string, string> = {
  PUBLISHED: 'Yayında',
  UNPUBLISHED: 'Taslak',
  DRAFT: 'Taslak',
  ARCHIVED: 'Arşivlendi',
  OPEN: 'Başvuru açık',
  CLOSED: 'Başvuru kapalı',
  NOT_OPEN: 'Başlamadı',
};

function greeting(hour: number) {
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function relativeDay(dateValue: string, now: number) {
  const start = new Date(dateValue);
  const today = new Date(now);
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const days = Math.round((start.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  if (days > 1) return `${days} gün sonra`;
  return `${Math.abs(days)} gün önce`;
}

export default async function Dashboard() {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');

  const [organizations, me] = await Promise.all([
    api<any[]>('organizations', token),
    api<any>('auth/me', token),
  ]);
  if (!organizations.length) redirect('/organization/access');

  const organization = organizations[0];
  const events = await api<EventSummary[]>(`organizations/${organization.id}/events`, token);
  const now = Date.now();
  const orderedEvents = [...events].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const upcoming = orderedEvents.filter(event => new Date(event.endsAt).getTime() >= now);
  const nextEvent = upcoming[0];
  const drafts = events.filter(event => event.publicationStatus === 'DRAFT' || event.publicationStatus === 'UNPUBLISHED');
  const firstDraft = drafts[0];
  const published = events.filter(event => event.publicationStatus === 'PUBLISHED').length;
  const registrations = events.reduce((total, event) => total + (event._count?.registrations ?? 0), 0);
  const today = new Date(now);
  const firstName = me.firstName?.trim();
  const longDate = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(today);

  const focus = firstDraft
    ? {
        eyebrow: 'YAYINA HAZIRLIK',
        title: `${drafts.length} etkinlik sizden son dokunuşu bekliyor.`,
        body: 'Taslak ayrıntılarını gözden geçirip etkinlik sayfanızı katılımcılarla buluşturabilirsiniz.',
        href: `/dashboard/events/${firstDraft.id}`,
        action: 'Taslağı tamamla',
      }
    : nextEvent
      ? {
          eyebrow: 'SIRADAKİ ETKİNLİK',
          title: `${nextEvent.title} için her şey hazır mı?`,
          body: `${relativeDay(nextEvent.startsAt, now)} başlayacak etkinliğin başvurularını ve saha hazırlıklarını tek yerde kontrol edin.`,
          href: `/dashboard/events/${nextEvent.id}`,
          action: 'Hazırlıkları gözden geçir',
        }
      : {
          eyebrow: 'YENİ BİR BAŞLANGIÇ',
          title: 'İlk etkinliğiniz için alan hazır.',
          body: 'Temel bilgileri girin; başvuru, iletişim ve etkinlik günü araçlarını ihtiyaç oldukça açın.',
          href: '/dashboard/events/new',
          action: 'İlk etkinliği oluştur',
        };

  return <main className="app-shell">
    <AppNav organization={organization} active="home" systemAdmin={me.systemRole === 'SYSTEM_ADMIN'} />
    <section className="dashboard home-dashboard">
      <MobileTopBar />

      <header className="home-intro">
        <div>
          <p className="home-date"><span aria-hidden="true" />{longDate}</p>
          <h1>{greeting(today.getHours())}{firstName ? `, ${firstName}` : ''}.</h1>
          <p>Bugünün önemli işlerini görün, etkinliklerinizi güvenle ilerletin.</p>
        </div>
        <Link className="home-create-button" href="/dashboard/events/new">
          <span aria-hidden="true">＋</span> Yeni etkinlik
        </Link>
      </header>

      <section className="home-focus" aria-labelledby="focus-title">
        <div className="home-focus-copy">
          <p className="home-focus-eyebrow"><span aria-hidden="true" />{focus.eyebrow}</p>
          <h2 id="focus-title">{focus.title}</h2>
          <p>{focus.body}</p>
          <div className="home-focus-actions">
            <Link className="home-focus-primary" href={focus.href}>{focus.action}<span aria-hidden="true">→</span></Link>
            {events.length > 0 && <a href="#events">Tüm etkinlikler</a>}
          </div>
        </div>

        <aside className="home-next-card" aria-label="Sıradaki etkinlik">
          {nextEvent ? <>
            <div className="home-next-topline"><span>Sıradaki</span><em>{relativeDay(nextEvent.startsAt, now)}</em></div>
            <div className="home-next-event">
              <div className="home-next-date">
                <strong>{new Date(nextEvent.startsAt).getDate()}</strong>
                <span>{new Date(nextEvent.startsAt).toLocaleDateString('tr-TR', { month: 'short' })}</span>
              </div>
              <div>
                <h3>{nextEvent.title}</h3>
                <p>{formatTime(nextEvent.startsAt)} · {nextEvent._count?.registrations ?? 0} başvuru</p>
              </div>
            </div>
            <Link href={`/dashboard/events/${nextEvent.id}`}>Etkinlik merkezini aç <span aria-hidden="true">↗</span></Link>
          </> : <>
            <div className="home-next-topline"><span>Etkinlik takvimi</span><em>Hazır</em></div>
            <div className="home-calendar-empty" aria-hidden="true"><span>e</span></div>
            <h3>Yeni bir etki alanı açın.</h3>
            <p>Planlamaya başladığınızda sıradaki etkinliğiniz burada görünecek.</p>
          </>}
        </aside>
      </section>

      <section className="home-metrics" aria-label="Etkinlik özeti">
        <article>
          <span className="metric-label"><i className="metric-dot indigo" />Yaklaşan</span>
          <b>{upcoming.length}</b>
          <small>etkinlik takvimde</small>
        </article>
        <article>
          <span className="metric-label"><i className="metric-dot green" />Toplam başvuru</span>
          <b>{registrations.toLocaleString('tr-TR')}</b>
          <small>tüm etkinliklerde</small>
        </article>
        <article>
          <span className="metric-label"><i className="metric-dot coral" />Yayında</span>
          <b>{published}</b>
          <small>katılımcılara açık</small>
        </article>
      </section>

      <section id="events" className="home-events">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">ETKİNLİKLER</p>
            <h2>Planınız, tek bakışta.</h2>
            <p>Yaklaşan tarihler ve katılımcı hareketleri.</p>
          </div>
          <span>{events.length} etkinlik</span>
        </div>

        {events.length === 0 ? <section className="home-empty-state">
          <div className="home-empty-mark" aria-hidden="true">＋</div>
          <div><h3>İlk etkinliğinizi birlikte kuralım.</h3><p>Birkaç temel bilgiyle başlayın; ayrıntıları dilediğiniz zaman tamamlayın.</p></div>
          <Link className="home-outline-button" href="/dashboard/events/new">Etkinlik oluştur <span aria-hidden="true">→</span></Link>
        </section> : <div className="home-event-list">
          {orderedEvents.map(event => {
            const date = new Date(event.startsAt);
            const isPast = new Date(event.endsAt).getTime() < now;
            return <article className={`home-event-row${isPast ? ' is-past' : ''}`} key={event.id}>
              <div className="home-event-date">
                <b>{date.getDate()}</b>
                <span>{date.toLocaleDateString('tr-TR', { month: 'short' })}</span>
              </div>
              <div className="home-event-main">
                <div className="home-event-titleline">
                  <h3>{event.title}</h3>
                  <span className={`home-status ${event.publicationStatus.toLowerCase()}`}>{statusName[event.publicationStatus] ?? event.publicationStatus}</span>
                </div>
                <p>{formatDate(event.startsAt)} · {formatTime(event.startsAt)}</p>
              </div>
              <div className="home-event-registration">
                <b>{event._count?.registrations ?? 0}</b>
                <span>başvuru</span>
              </div>
              <span className="home-event-relative">{isPast ? 'Tamamlandı' : relativeDay(event.startsAt, now)}</span>
              <Link className="home-event-manage" href={`/dashboard/events/${event.id}`} aria-label={`${event.title} etkinliğini yönet`}>
                Yönet <span aria-hidden="true">→</span>
              </Link>
            </article>;
          })}
        </div>}
      </section>
    </section>
  </main>;
}
