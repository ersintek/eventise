'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ParticipantApplicationList, ParticipantList } from './participant-area';
import { PrivacyCard, type LegalStatus } from './privacy-card';
import { formatDateLong } from '@/lib/datetime';
import { MarkdownContent } from '../components/markdown-content';

type Organization = { id: string; name: string; slug: string };
type History = { id: string; title: string; startsAt: string; period: 'CURRENT'|'UPCOMING'|'PAST'; organization: Organization };
type Follow = { id: string; organizationId: string; organization: Organization };
type FollowingEvent = { id: string; title: string; slug: string; summary?: string; startsAt: string; organization: Organization };
type UpcomingEvent = { id:string; title:string; slug:string; summary?:string; startsAt:string; endsAt:string; format:string; venueName?:string; registrationStatus:string; followed:boolean; registration:{id:string;applicationStatus:string}|null; organization:Organization };
type Notification = { id: string; eventId: string; title: string; body: string; createdAt: string; readAt?: string | null };
type EventTask = { eventId: string; title: string; pending: number };
type Me = { id: string; email: string; firstName: string; lastName: string; preferredLanguage: string; emailNotifications: boolean; partnerEventEmails: boolean };
type Tab = 'home'|'events'|'discover'|'profile';

const applicationLabels: Record<string, string> = { SUBMITTED:'Başvurun alındı', PENDING:'Başvurun değerlendiriliyor', ACCEPTED:'Etkinliğe git', WAITLISTED:'Yedek listedesindesiniz', REJECTED:'Başvurun reddedildi' };

function relativeDate(value: string) {
  const days = Math.round((new Date(value).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  if (days > 1) return `${days} gün sonra`;
  return `${Math.abs(days)} gün önce`;
}

export function ParticipantHub({ me, history, upcomingEvents, certificates, initialFollows, initialFollowingEvents, legal, initialNotifications, eventTasks }: { me: Me; history: History[]; upcomingEvents: UpcomingEvent[]; certificates: any[]; initialFollows: Follow[]; initialFollowingEvents: FollowingEvent[]; legal: LegalStatus; initialNotifications: Notification[]; eventTasks: EventTask[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('home');
  const [followedOnly, setFollowedOnly] = useState(false);
  const [follows, setFollows] = useState(initialFollows);
  const [followingEvents, setFollowingEvents] = useState(initialFollowingEvents);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const organizations = useMemo(() => [...new Map(history.map(item => [item.organization.id, item.organization])).values()], [history]);
  const activeHistory = history.filter(item => item.period !== 'PAST');
  const pastHistory = history.filter(item => item.period === 'PAST');
  const unread = notifications.filter(item => !item.readAt);
  const nextEvent = [...activeHistory].sort((a,b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0];
  const primaryRegistration = upcomingEvents.find(item => item.registration?.applicationStatus === 'ACCEPTED');
  const pendingApplication = upcomingEvents.find(item => item.registration && !['ACCEPTED', 'REJECTED'].includes(item.registration.applicationStatus));
  const applications = useMemo(() => {
    const byEventId = new Map(upcomingEvents.filter(item => item.registration).map(item => [item.id, { id:item.id, title:item.title, startsAt:item.startsAt, organization:item.organization, applicationStatus:item.registration!.applicationStatus as 'SUBMITTED'|'PENDING'|'ACCEPTED'|'WAITLISTED'|'REJECTED' }]));
    for (const event of activeHistory) if (!byEventId.has(event.id)) byEventId.set(event.id, { id:event.id, title:event.title, startsAt:event.startsAt, organization:event.organization, applicationStatus:'ACCEPTED' });
    return [...byEventId.values()].sort((a,b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  }, [upcomingEvents, activeHistory]);
  const primaryTask = eventTasks.find(item => item.pending > 0);
  const followedIds = new Set(follows.map(item => item.organizationId));
  const go = (next: Tab) => () => setTab(next);

  async function follow(organization: Organization) {
    setBusy(true); setMessage('');
    const response = await fetch(`/api/backend/participant/organizations/${organization.id}/follow`, { method: 'POST' });
    if (response.ok) { const created = await response.json(); setFollows(rows => [...rows, { ...created, organization }]); setMessage(`${organization.name} artık takip ediliyor.`); const eventsResponse = await fetch('/api/backend/participant/following-events'); if (eventsResponse.ok) setFollowingEvents(await eventsResponse.json()); }
    else setMessage('Kurum takibi güncellenemedi. Lütfen tekrar deneyin.');
    setBusy(false);
  }
  async function unfollow(organizationId: string) {
    setBusy(true); setMessage('');
    const response = await fetch(`/api/backend/participant/organizations/${organizationId}/follow`, { method: 'DELETE' });
    if (response.ok) { setFollows(rows => rows.filter(item => item.organizationId !== organizationId)); setFollowingEvents(rows => rows.filter(item => item.organization.id !== organizationId)); setMessage('Kurum takibi bırakıldı.'); }
    setBusy(false);
  }
  async function markRead(item: Notification) {
    if (item.readAt) return;
    const response = await fetch(`/api/backend/notifications/${item.id}/read`, { method: 'PATCH' });
    if (response.ok) setNotifications(rows => rows.map(row => row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row));
  }
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/backend/auth/me', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ firstName: form.get('firstName'), lastName: form.get('lastName'), preferredLanguage: form.get('preferredLanguage'), emailNotifications: form.get('emailNotifications') === 'on', partnerEventEmails: form.get('partnerEventEmails') === 'on' }) });
    setMessage(response.ok ? 'Profiliniz ve bildirim tercihleriniz kaydedildi.' : 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.'); setBusy(false);
  }
  async function logout() { await fetch('/api/session/logout', { method: 'POST' }); router.push('/login'); router.refresh(); }
  async function deleteAccount() { if (!confirm('Hesabınızı silme sürecini başlatmak istediğinizden emin misiniz? Hesabınızı 30 gün içinde geri alabilirsiniz.')) return; setBusy(true); const response = await fetch('/api/backend/deletions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'account', id: me.id }) }); if (response.ok) { await logout(); return; } setMessage('Hesap silme işlemi başlatılamadı.'); setBusy(false); }

  return <div className="participant-shell participant-redesign">
    <header className="participant-welcome"><div><p className="eyebrow">KATILIMCI ALANI</p><h1>Merhaba {me.firstName}</h1><p>Etkinliklerin, bildirimlerin ve yapman gerekenler burada.</p></div><button className="participant-avatar" onClick={go('profile')} aria-label="Profil ve ayarları aç">{me.firstName?.[0]}{me.lastName?.[0]}</button></header>
    <nav className="participant-tabs" aria-label="Katılımcı alanı bölümleri"><button className={tab === 'home' ? 'active' : ''} onClick={go('home')}>Ana Sayfa{unread.length > 0 && <span>{unread.length}</span>}</button><button className={tab === 'events' ? 'active' : ''} onClick={go('events')}>Etkinliklerim</button><button className={tab === 'discover' ? 'active' : ''} onClick={go('discover')}>Keşfet</button><button className={tab === 'profile' ? 'active' : ''} onClick={go('profile')}>Profil</button></nav>
    {message && <p className="notice" role="status">{message}</p>}

    {tab === 'home' && <section className="participant-home" aria-label="Katılımcı ana sayfası">
      <section className="participant-priority" aria-labelledby="today-title"><div><p className="eyebrow">BUGÜN</p><h2 id="today-title">{primaryTask ? 'Tamamlaman gereken bir iş var.' : primaryRegistration ? 'Sıradaki adımın hazır.' : pendingApplication ? 'Başvurun değerlendiriliyor.' : 'Şu an bekleyen bir işlemin yok.'}</h2><p>{primaryTask ? `${primaryTask.title} için ${primaryTask.pending} görevin bekliyor. Önce bunları tamamlayarak etkinlik sürecini ilerletebilirsin.` : primaryRegistration ? `${primaryRegistration.title} için etkinlik bilgilerini ve yapman gerekenleri buradan takip edebilirsin.` : pendingApplication ? `${pendingApplication.title} için başvuru durumun Etkinliklerim alanında görünür. Onaylandığında etkinlik alanın açılır.` : 'Yeni etkinlikleri inceleyerek sana uygun olana başvurabilirsin.'}</p></div>{primaryTask ? <Link className="primary link-button" href={`/participant/event/${primaryTask.eventId}`}>Görevleri aç <span aria-hidden="true">→</span></Link> : primaryRegistration ? <Link className="primary link-button" href={`/participant/event/${primaryRegistration.id}`}>Etkinliği aç <span aria-hidden="true">→</span></Link> : pendingApplication ? <button className="secondary" onClick={go('events')}>Başvurularımı gör <span aria-hidden="true">→</span></button> : <button className="primary" onClick={go('discover')}>Etkinlikleri keşfet <span aria-hidden="true">→</span></button>}</section>
      <div className="participant-home-grid">
        <section className="participant-panel participant-next-event"><div className="participant-panel-heading"><div><p className="eyebrow">SIRADAKİ ETKİNLİK</p><h2>{nextEvent ? nextEvent.title : 'Henüz kayıtlı etkinliğin yok'}</h2></div>{nextEvent && <span className="participant-date-badge">{relativeDate(nextEvent.startsAt)}</span>}</div>{nextEvent ? <><p>{nextEvent.organization.name} · {formatDateLong(nextEvent.startsAt)}</p><Link href={`/participant/event/${nextEvent.id}`}>Etkinlik bilgilerini aç <span aria-hidden="true">→</span></Link></> : <><p>Bir etkinliğe kabul edildiğinde tarih, yer ve yapman gerekenler burada görünecek.</p><button className="text-action" onClick={go('discover')}>Etkinlikleri keşfet →</button></>}</section>
        <section className="participant-panel participant-notification-summary"><div className="participant-panel-heading"><div><p className="eyebrow">BİLDİRİMLER</p><h2>{unread.length ? `${unread.length} yeni gelişme` : 'Her şey güncel'}</h2></div></div>{unread.slice(0, 2).map(item => <button className="home-notification" key={item.id} onClick={() => void markRead(item)}><span>Yeni</span><div><b>{item.title}</b><small>{item.body}</small></div></button>)}{!unread.length && <p>Başvuru, etkinlik değişikliği ve belge haberleri burada görünür.</p>}</section>
      </div>
      <section className="participant-panel participant-activity"><div className="participant-panel-heading"><div><p className="eyebrow">ETKİNLİKLERİN</p><h2>Hızlı görünüm</h2><p>Başvurularını ve tamamladığın etkinlikleri tek yerden takip et.</p></div><button className="secondary" onClick={go('events')}>Tümünü gör</button></div><div className="participant-stat-row"><span><b>{activeHistory.length}</b> aktif etkinlik</span><span><b>{pastHistory.length}</b> tamamlanan</span><span><b>{certificates.length}</b> sertifika</span></div></section>
    </section>}

    {tab === 'events' && <section className="participant-events-hub"><div className="participant-section-intro"><p className="eyebrow">ETKİNLİKLERİM</p><h2>Katılım yolculuğun</h2><p>Başvuru durumunu önce gör; yalnızca onaylanan etkinliklerin alanına girebilirsin.</p></div><ParticipantApplicationList applications={applications}/><ParticipantList history={[]} certificates={certificates} showEvents={false}/>{pastHistory.length > 0 && <details className="participant-history"><summary>Geçmiş etkinliklerini göster <span>{pastHistory.length}</span></summary><ParticipantList history={pastHistory} certificates={[]}/></details>}</section>}

    {tab === 'discover' && <section className="participant-discovery"><div className="participant-section-intro discovery-heading"><div><p className="eyebrow">KEŞFET</p><h2>Yeni etkinlikler bul</h2><p>İlgi duyduğun etkinliği incele, uygunsa başvurunu başlat.</p></div><div className="discovery-controls">{follows.length > 0 && <label className="discovery-filter"><input type="checkbox" checked={followedOnly} onChange={event => setFollowedOnly(event.target.checked)}/><span>Takip ettiklerim</span></label>}<button className="secondary" onClick={go('profile')}>Takipleri yönet</button></div></div>{upcomingEvents.filter(event => !followedOnly || event.followed).length ? <div className="discovery-grid">{upcomingEvents.filter(event => !followedOnly || event.followed).map(event => { const status = event.registration?.applicationStatus; const href = status === 'ACCEPTED' ? `/participant/event/${event.id}` : `/events/${event.organization.slug}/${event.slug}`; const action = status ? applicationLabels[status] ?? 'Başvuru durumunu gör' : event.registrationStatus === 'OPEN' ? 'İncele ve başvur' : 'Etkinliği incele'; return <Link href={href} className="discovery-card" key={event.id}><div className="discovery-card-top"><span className="event-format">{event.format === 'ONLINE' ? 'Çevrim içi' : event.format === 'HYBRID' ? 'Hibrit' : 'Yüz yüze'}</span>{event.followed && <span className="followed-badge">Takip ettiğin kurum</span>}</div><small>{event.organization.name}</small><h3>{event.title}</h3>{event.summary ? <MarkdownContent className="prose event-card-summary">{event.summary}</MarkdownContent> : <p className="event-card-summary-fallback">Etkinlik ayrıntılarını ve başvuru koşullarını inceleyin.</p>}<dl><div><dt>Tarih</dt><dd>{formatDateLong(event.startsAt)}</dd></div><div><dt>Yer</dt><dd>{event.format === 'ONLINE' ? 'Çevrim içi' : event.venueName || 'Mekân bilgisi yakında paylaşılacak'}</dd></div></dl><div className="discovery-action"><b className={status ? 'has-status' : ''}>{action}</b><span>→</span></div></Link>; })}</div> : <div className="participant-soft-empty"><span>◇</span><div><h3>Şimdilik yeni etkinlik yok</h3><p>Yeni bir etkinlik yayınlandığında burada göreceksin.</p></div></div>}</section>}

    {tab === 'profile' && <section className="participant-profile-page"><div className="participant-section-intro"><p className="eyebrow">PROFİL VE AYARLAR</p><h2>Hesabını yönet</h2><p>Bilgilerini, bildirim tercihlerini ve takip ettiğin kurumları buradan düzenleyebilirsin.</p></div><PrivacyCard legal={legal}/><div className="participant-profile-grid"><form className="participant-settings-card" onSubmit={saveProfile}><div className="section-intro"><h2>Kişisel bilgiler</h2><p>Bu bilgiler etkinlik kayıtlarında ve sertifikalarda kullanılır.</p></div><div className="two"><label>Ad<input name="firstName" defaultValue={me.firstName} required minLength={2}/></label><label>Soyad<input name="lastName" defaultValue={me.lastName} required minLength={2}/></label></div><label>E-posta<input value={me.email} disabled/><small>E-posta adresin şu anda değiştirilemez.</small></label><label>Dil<select name="preferredLanguage" defaultValue={me.preferredLanguage}><option value="tr">Türkçe</option><option value="en">English</option></select></label><div className="preference-list"><label><input name="emailNotifications" type="checkbox" defaultChecked={me.emailNotifications}/><span><b>Önemli etkinlik haberlerini e-postayla al</b><small>Başvuru sonucu, hatırlatma ve önemli değişiklikler.</small></span></label><label><input name="partnerEventEmails" type="checkbox" defaultChecked={me.partnerEventEmails}/><span><b>Takip ettiğim kurumların yeni etkinliklerinden haberdar et</b><small>Yeni etkinlik duyurularını e-postayla almak istiyorum.</small></span></label></div><button className="primary" disabled={busy}>Değişiklikleri kaydet</button></form><aside className="participant-settings-card participant-follow-settings"><div className="section-intro"><h2>Takip ettiğin kurumlar</h2><p>Yeni etkinlikleri önce görmek için kurumları takip edebilirsin.</p></div>{organizations.length === 0 ? <p className="friendly-status">Bir etkinliğe katıldığında düzenleyen kurumu buradan takip edebilirsin.</p> : <div className="follow-org-list">{organizations.map(org => <article key={org.id}><span>{org.name.slice(0,2).toUpperCase()}</span><div><b>{org.name}</b><small>{followedIds.has(org.id) ? 'Yeni etkinlikleri sana gösterilecek' : 'Daha önce etkinliğine katıldın'}</small></div>{followedIds.has(org.id) ? <button disabled={busy} onClick={() => void unfollow(org.id)}>Takibi bırak</button> : <button className="primary" disabled={busy} onClick={() => void follow(org)}>Takip et</button>}</article>)}</div>}{followingEvents.length > 0 && <p className="participant-follow-note">Takip ettiğin kurumlardan {followingEvents.length} yeni etkinlik var. <button className="text-action" onClick={go('discover')}>Keşfete git →</button></p>}</aside><aside className="participant-account-card"><div><p className="eyebrow">HESAP</p><h2>Hesap işlemleri</h2><p>Oturumunu ve hesabını buradan yönetebilirsin.</p></div><button className="secondary" onClick={logout}>Çıkış yap</button><div className="participant-danger"><b>Hesabı sil</b><p>Hesabın 30 gün boyunca geri alınabilir; ardından kalıcı olarak silinir.</p><button disabled={busy} onClick={deleteAccount}>Hesabımı sil</button></div></aside></div></section>}
  </div>;
}
