import Link from 'next/link';
import { LogoutButton } from '../dashboard/logout-button';
import { BetaNotice } from './beta-notice';

type Organization = { name: string; memberships?: Array<{ role?: string }> };

const roleNames: Record<string, string> = {
  ORGANIZATION_ADMIN: 'Kurum yöneticisi', OWNER: 'Kurum yöneticisi', ADMIN: 'Yönetici', EVENT_MANAGER: 'Etkinlik yetkilisi', FIELD_STAFF: 'Saha görevlisi', STAFF: 'Ekip üyesi', MEMBER: 'Üye', SYSTEM_ADMIN: 'Sistem yöneticisi',
};

function Mark() { return <div className="brand"><span>e</span><b>eventise</b></div>; }

export function AppNav({ organization, active, systemAdmin = false }: { organization: Organization; active: string; systemAdmin?: boolean }) {
  const item = (href: string, label: string, key: string) => <Link className={active === key ? 'active' : ''} href={href}>{label}</Link>;
  const role = organization.memberships?.[0]?.role ?? 'MEMBER';
  return <aside className="app-nav">
    <div className="brand-row"><Mark /><BetaNotice /></div>
    <div className="org-chip"><span>{organization.name.slice(0, 2).toUpperCase()}</span><div><b>{organization.name}</b><small>{roleNames[role] ?? role}</small></div></div>
    <nav aria-label="Ana menü">
      <div className="nav-group"><small>GENEL</small>{item('/dashboard', 'Ana sayfa', 'home')}</div>
      <div className="nav-group"><small>ETKİNLİK YÖNETİMİ</small>{item('/dashboard#events', 'Etkinlikler', 'events')}{item('/dashboard/events/new', 'Yeni etkinlik', 'new')}</div>
      <div className="nav-group"><small>KATILIM</small>{item('/participant', 'Katılımcı alanım', 'participant')}</div>
      <div className="nav-group"><small>KURUM</small>{item('/dashboard/settings', 'Ekip ve ayarlar', 'settings')}{item('/dashboard/quota', 'Kullanım ve plan', 'quota')}</div>
      {systemAdmin && <div className="nav-group"><small>YÖNETİM</small>{item('/admin', 'Sistem yönetimi', 'admin')}</div>}
      <div className="nav-group"><small>DESTEK</small>{item('/yardim', 'STK rehberi', 'help')}</div>
    </nav>
    <LogoutButton />
  </aside>;
}

export function MobileTopBar({ backHref = '/dashboard', backLabel = 'Ana sayfa' }: { backHref?: string; backLabel?: string }) {
  return <div className="mobile-topbar"><Mark /><Link href={backHref}>← {backLabel}</Link></div>;
}

export function EventNav({ eventId, active, enabled = {} }: { eventId: string; active: string; enabled?: Record<string, boolean> }) {
  const base = `/dashboard/events/${eventId}`;
  const item = (href: string, label: string, key: string, external = false) => (enabled[key] ?? true) ? <Link className={active === key ? 'active' : ''} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}{external && ' ↗'}</Link> : null;
  return <nav className="event-nav" aria-label="Etkinlik bölümleri">
    <div className="event-nav-back"><Link href="/dashboard">← Tüm etkinlikler</Link></div>
    <div className="event-nav-links">
      {item(base, 'Dashboard', 'dashboard')}
      {item(`${base}/settings`, 'Ayarlar', 'settings')}
      {item(`${base}/modules`, 'Modüller', 'modules')}
      {item(`${base}/communication`, 'İletişim', 'communication')}
      {item(`${base}/day`, 'Etkinlik Günü', 'day', true)}
      {item(`${base}/post-event`, 'Etkinlik Sonrası', 'post')}
      {item(`${base}/certificates`, 'Sertifikalar', 'certificates')}
    </div>
  </nav>;
}

