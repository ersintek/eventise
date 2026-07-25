'use client';
import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ParticipantList } from './participant-area';
import { formatDateLong } from '@/lib/datetime';

type Organization = { id: string; name: string; slug: string; description?: string };
type History = { id: string; title: string; startsAt: string; period: 'CURRENT'|'UPCOMING'|'PAST'; organization: Organization };
type Follow = { id: string; organizationId: string; organization: Organization };
type FollowingEvent = { id: string; title: string; slug: string; summary?: string; startsAt: string; registrationStatus: string; organization: Organization };
type Me = { id: string; email: string; firstName: string; lastName: string; preferredLanguage: string; emailNotifications: boolean; partnerEventEmails: boolean };

export function ParticipantHub({ me, history, certificates, initialFollows, initialFollowingEvents }: { me: Me; history: History[]; certificates: any[]; initialFollows: Follow[]; initialFollowingEvents: FollowingEvent[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<'events'|'following'|'profile'>('events');
  const [follows, setFollows] = useState(initialFollows);
  const [followingEvents, setFollowingEvents] = useState(initialFollowingEvents);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const organizations = useMemo(() => {
    const unique = new Map<string, Organization>();
    history.forEach(item => unique.set(item.organization.id, item.organization));
    return [...unique.values()];
  }, [history]);
  const followedIds = new Set(follows.map(item => item.organizationId));

  async function follow(organization: Organization) {
    setBusy(true); setMessage('');
    const response = await fetch(`/api/backend/participant/organizations/${organization.id}/follow`, { method: 'POST' });
    if (response.ok) {
      const created = await response.json();
      setFollows(rows => [...rows, { ...created, organization }]);
      setMessage(`${organization.name} takip ediliyor.`);
      const eventsResponse = await fetch('/api/backend/participant/following-events');
      if (eventsResponse.ok) setFollowingEvents(await eventsResponse.json());
    } else setMessage('Kurum takip edilemedi.');
    setBusy(false);
  }
  async function unfollow(organizationId: string) {
    setBusy(true); setMessage('');
    const response = await fetch(`/api/backend/participant/organizations/${organizationId}/follow`, { method: 'DELETE' });
    if (response.ok) {
      setFollows(rows => rows.filter(item => item.organizationId !== organizationId));
      setFollowingEvents(rows => rows.filter(item => item.organization.id !== organizationId));
      setMessage('Kurum takibi bırakıldı.');
    }
    setBusy(false);
  }
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/backend/auth/me', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ firstName: form.get('firstName'), lastName: form.get('lastName'), preferredLanguage: form.get('preferredLanguage'), emailNotifications: form.get('emailNotifications') === 'on', partnerEventEmails: form.get('partnerEventEmails') === 'on' }) });
    setMessage(response.ok ? 'Profiliniz ve tercihleriniz kaydedildi.' : 'Bilgiler kaydedilemedi.');
    setBusy(false);
  }
  async function logout() {
    await fetch('/api/session/logout', { method: 'POST' });
    router.push('/login'); router.refresh();
  }
  async function deleteAccount() {
    if (!confirm('Hesabınızı silme sürecini başlatmak istediğinizden emin misiniz? Hesabınızı 30 gün içinde geri alabilirsiniz.')) return;
    setBusy(true);
    const response = await fetch('/api/backend/deletions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'account', id: me.id }) });
    if (response.ok) { await logout(); return; }
    setMessage('Hesap silme işlemi başlatılamadı.'); setBusy(false);
  }

  return <>
    <header className="participant-welcome"><div><p className="eyebrow">KATILIMCI ALANI</p><h1>Merhaba {me.firstName} 👋</h1><p>Etkinliklerinize, takip ettiğiniz kurumlara ve hesap ayarlarınıza buradan ulaşın.</p></div><button className="participant-avatar" onClick={()=>setTab('profile')} aria-label="Profilimi aç">{me.firstName?.[0]}{me.lastName?.[0]}</button></header>
    <nav className="participant-tabs" aria-label="Katılımcı alanı bölümleri">
      <button className={tab==='events'?'active':''} onClick={()=>setTab('events')}>Etkinliklerim</button>
      <button className={tab==='following'?'active':''} onClick={()=>setTab('following')}>Takip ettiklerim {follows.length>0&&<span>{follows.length}</span>}</button>
      <button className={tab==='profile'?'active':''} onClick={()=>setTab('profile')}>Profil ve tercihler</button>
    </nav>
    {message&&<p className="notice" role="status">{message}</p>}
    {tab==='events'&&<ParticipantList history={history} certificates={certificates}/>}
    {tab==='following'&&<div className="participant-follow-layout">
      <section className="participant-follow-section"><div className="section-heading"><div><p className="eyebrow">YENİ ETKİNLİKLER</p><h2>Takip ettiğiniz STK’lardan</h2></div></div>
        {followingEvents.length ? <div className="follow-event-list">{followingEvents.map(event=><Link className="follow-event-card" href={`/events/${event.organization.slug}/${event.slug}`} key={event.id}><div><small>{event.organization.name}</small><h3>{event.title}</h3><p>{event.summary||'Etkinlik ayrıntılarını görüntüleyin.'}</p><b>{formatDateLong(event.startsAt)}</b></div><span>→</span></Link>)}</div> : <div className="participant-soft-empty"><span>◎</span><div><h3>Yeni etkinlik bekleniyor</h3><p>Takip ettiğiniz kurumlar herkese açık bir etkinlik yayınladığında burada görünecek.</p></div></div>}
      </section>
      <aside className="participant-follow-section"><div className="section-heading"><div><p className="eyebrow">STK’LAR</p><h2>Takiplerinizi yönetin</h2></div></div>
        {organizations.length===0?<p className="friendly-status">Bir etkinliğe katıldığınızda düzenleyen STK’yı buradan takip edebilirsiniz.</p>:<div className="follow-org-list">{organizations.map(org=><article key={org.id}><span>{org.name.slice(0,2).toUpperCase()}</span><div><b>{org.name}</b><small>{followedIds.has(org.id)?'Yeni etkinlikleri gösterilecek':'Daha önce etkinliğine katıldınız'}</small></div>{followedIds.has(org.id)?<button disabled={busy} onClick={()=>unfollow(org.id)}>Takibi bırak</button>:<button className="primary" disabled={busy} onClick={()=>follow(org)}>Takip et</button>}</article>)}</div>}
      </aside>
    </div>}
    {tab==='profile'&&<div className="participant-profile-grid">
      <form className="participant-settings-card" onSubmit={saveProfile}><div className="section-intro"><p className="eyebrow">PROFİL</p><h2>Kişisel bilgiler</h2><p>Etkinlik kayıtlarında ve sertifikalarda kullanılacak bilgileriniz.</p></div><div className="two"><label>Ad<input name="firstName" defaultValue={me.firstName} required minLength={2}/></label><label>Soyad<input name="lastName" defaultValue={me.lastName} required minLength={2}/></label></div><label>E-posta<input value={me.email} disabled/><small>E-posta adresi şu anda değiştirilemez.</small></label><label>Dil<select name="preferredLanguage" defaultValue={me.preferredLanguage}><option value="tr">Türkçe</option><option value="en">English</option></select></label><div className="preference-list"><label><input name="emailNotifications" type="checkbox" defaultChecked={me.emailNotifications}/><span><b>Etkinlik bildirimlerini e-postayla al</b><small>Kayıt durumu, hatırlatma ve önemli değişiklikler.</small></span></label><label><input name="partnerEventEmails" type="checkbox" defaultChecked={me.partnerEventEmails}/><span><b>Takip ettiğim STK’ların yeni etkinliklerinden haberdar et</b><small>Yeni etkinlik duyurularını e-postayla almak istiyorum.</small></span></label></div><button className="primary" disabled={busy}>Değişiklikleri kaydet</button></form>
      <aside className="participant-account-card"><div><p className="eyebrow">HESAP</p><h2>Hesap işlemleri</h2><p>Oturumunuzu ve hesabınızı buradan yönetebilirsiniz.</p></div><button className="secondary" onClick={logout}>Çıkış yap</button><div className="participant-danger"><b>Hesabı sil</b><p>Hesabınız 30 gün boyunca geri alınabilir, ardından kalıcı olarak silinir.</p><button disabled={busy} onClick={deleteAccount}>Hesabımı sil</button></div></aside>
    </div>}
  </>;
}
