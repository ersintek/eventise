import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppNav, MobileTopBar } from '../components/navigation';
import { formatDate, formatTime } from '@/lib/datetime';

async function api<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login');
  if (!response.ok) throw new Error('Veriler alınamadı.');
  return response.json();
}
const statusName: Record<string, string> = { PUBLISHED: 'Yayında', UNPUBLISHED: 'Taslak', DRAFT: 'Taslak', ARCHIVED: 'Arşivlendi', OPEN: 'Başvuru açık', CLOSED: 'Başvuru kapalı', NOT_OPEN: 'Başlamadı' };

export default async function Dashboard() {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const [organizations, me] = await Promise.all([api<any[]>('organizations', token), api<any>('auth/me', token)]);
  if (!organizations.length) redirect('/organization/access');
  const organization = organizations[0], events = await api<any[]>(`organizations/${organization.id}/events`, token), now = Date.now();
  const upcoming = events.filter(event => new Date(event.endsAt).getTime() >= now);
  const registrations = events.reduce((total, event) => total + (event._count?.registrations ?? 0), 0);
  const drafts = events.filter(event => event.publicationStatus === 'DRAFT' || event.publicationStatus === 'UNPUBLISHED').length;
  const archived = events.filter(event => event.publicationStatus === 'ARCHIVED');
  return <main className="app-shell"><AppNav organization={organization} active="home" systemAdmin={me.systemRole === 'SYSTEM_ADMIN'} /><section className="dashboard"><MobileTopBar />
    <header className="page-heading"><div><p className="eyebrow">BUGÜN</p><h1>Merhaba {me.firstName || ''} 👋</h1><p>Etkinliklerinizde neler olduğuna birlikte bakalım.</p></div><Link className="primary link-button" href="/dashboard/events/new">+ Yeni etkinlik</Link></header>
    <section className="attention-card"><div><span className="attention-icon">✓</span><div><h2>{drafts ? `${drafts} konu sizi bekliyor` : 'Her şey yolunda'}</h2><p>{drafts ? `${drafts} etkinlik henüz yayınlanmadı.` : 'Yayın bekleyen etkinliğiniz yok.'}</p></div></div>{drafts > 0 && <a href="#events">Taslakları göster →</a>}</section>
    <div className="quick-metrics"><article><span>Yaklaşan etkinlik</span><b>{upcoming.length}</b><small>Bugünden sonrası</small></article><article><span>Toplam başvuru</span><b>{registrations}</b><small>Tüm etkinlikler</small></article><article><span>Yayında</span><b>{events.length - drafts}</b><small>Katılıma açık sayfalar</small></article></div>
    <section id="events" className="content-section"><div className="section-heading"><div><p className="eyebrow">ETKİNLİK YÖNETİMİ</p><h2>Etkinlikler</h2></div><span>{events.length} etkinlik</span></div>
      {events.length === 0 ? <section className="empty-state"><span className="empty-illustration">✦</span><h2>İlk etkinliğinizi oluşturalım</h2><p>Temel bilgileri girin; geri kalan hazırlıkları daha sonra tamamlayabilirsiniz.</p><Link className="primary link-button" href="/dashboard/events/new">Etkinlik oluştur</Link></section> : <div className="event-list">{events.map(event => { const date = new Date(event.startsAt), days = Math.ceil((date.getTime() - now) / 86400000); return <article className="event-row" key={event.id}><div className="date-tile"><b>{date.getDate()}</b><span>{date.toLocaleDateString('tr-TR', { month: 'short' })}</span></div><div className="event-main"><div className="event-status"><span className={`pill ${event.publicationStatus.toLowerCase()}`}>{statusName[event.publicationStatus] ?? event.publicationStatus}</span><span className="pill">{statusName[event.registrationStatus] ?? event.registrationStatus}</span></div><h3>{event.title}</h3><p>{formatDate(event.startsAt)} · {formatTime(event.startsAt)}</p><small>{event._count?.registrations ?? 0} başvuru{days >= 0 ? ` · ${days === 0 ? 'Bugün' : `${days} gün kaldı`}` : ''}</small></div><Link className="event-manage" href={`/dashboard/events/${event.id}`}>Etkinliği yönet <span>→</span></Link></article> })}</div>}
    </section>
  </section></main>;
}
