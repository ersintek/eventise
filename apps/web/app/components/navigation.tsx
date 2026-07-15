import Link from 'next/link';
import { LogoutButton } from '../dashboard/logout-button';

type Organization = { name: string; memberships?: Array<{ role?: string }> };

const roleNames: Record<string, string> = {
  OWNER: 'Kurum yöneticisi', ADMIN: 'Yönetici', EVENT_MANAGER: 'Etkinlik yöneticisi',
  STAFF: 'Ekip üyesi', MEMBER: 'Üye',
};

function Mark() { return <div className="brand"><span>e</span><b>eventise</b></div>; }

export function AppNav({ organization, active, systemAdmin = false }: { organization: Organization; active: string; systemAdmin?: boolean }) {
  const item = (href: string, label: string, key: string) => <Link className={active === key ? 'active' : ''} href={href}>{label}</Link>;
  const role = organization.memberships?.[0]?.role ?? 'MEMBER';
  return <aside className="app-nav">
    <Mark />
    <div className="org-chip"><span>{organization.name.slice(0, 2).toUpperCase()}</span><div><b>{organization.name}</b><small>{roleNames[role] ?? role}</small></div></div>
    <nav aria-label="Ana menü">
      <div className="nav-group"><small>GENEL</small>{item('/dashboard', 'Ana sayfa', 'home')}</div>
      <div className="nav-group"><small>ETKİNLİK YÖNETİMİ</small>{item('/dashboard#events', 'Etkinlikler', 'events')}{item('/dashboard/events/new', 'Yeni etkinlik', 'new')}</div>
      <div className="nav-group"><small>KATILIM</small>{item('/participant', 'Katılımcı alanım', 'participant')}</div>
      <div className="nav-group"><small>KURUM</small>{item('/dashboard/settings', 'Ekip ve ayarlar', 'settings')}{item('/dashboard/quota', 'Kullanım ve plan', 'quota')}</div>
      {systemAdmin && <div className="nav-group"><small>YÖNETİM</small>{item('/admin', 'Sistem yönetimi', 'admin')}</div>}
    </nav>
    <LogoutButton />
  </aside>;
}

export function MobileTopBar({ backHref = '/dashboard', backLabel = 'Ana sayfa' }: { backHref?: string; backLabel?: string }) {
  return <div className="mobile-topbar"><Mark /><Link href={backHref}>← {backLabel}</Link></div>;
}

export function EventNav({ eventId, active, enabled = {} }: { eventId: string; active: string; enabled?: Record<string, boolean> }) {
  const base = `/dashboard/events/${eventId}`;
  const link = (href: string, label: string, key: string) => (enabled[key] ?? true) ? <Link className={active === key ? 'active' : ''} href={href}>{label}</Link> : null;
  return <nav className="event-nav" aria-label="Etkinlik bölümleri">
    <div className="event-nav-back"><Link href="/dashboard">← Tüm etkinlikler</Link></div>
    <div className="event-nav-groups">
      <div><small>GENEL</small>{link(base, 'Etkinlik özeti', 'overview')}</div>
      <div><small>HAZIRLIK</small>{link(base, 'Başvurular', 'applications')}{link(`${base}/modules`, 'Modüller', 'modules')}</div>
      <div><small>ETKİNLİK GÜNÜ</small>{link(`${base}/day`, 'Kontrol merkezi', 'day')}</div>
      <div><small>ETKİNLİK SONRASI</small>{link(`${base}/post-event`, 'Sonuçlar ve çıktılar', 'post')}</div>
    </div>
  </nav>;
}

