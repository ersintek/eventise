'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogoutButton } from '../dashboard/logout-button';
import { BetaNotice } from './beta-notice';

type Organization = { name: string; memberships?: Array<{ role?: string }> };
type IconName = 'home' | 'calendar' | 'plus' | 'users' | 'building' | 'usage' | 'shield' | 'book' | 'info' | 'updates' | 'logout' | 'menu' | 'arrow';

const roleNames: Record<string, string> = {
  ORGANIZATION_ADMIN: 'Kurum yöneticisi', OWNER: 'Kurum yöneticisi', ADMIN: 'Yönetici', EVENT_MANAGER: 'Etkinlik yetkilisi', FIELD_STAFF: 'Saha görevlisi', STAFF: 'Ekip üyesi', MEMBER: 'Üye', SYSTEM_ADMIN: 'Sistem yöneticisi',
};

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  plus: <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  building: <><path d="M3 21h18M6 21V5l6-3 6 3v16M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"/></>,
  usage: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z"/><path d="M8 7h8M8 11h6"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  updates: <><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M15 3h5v18h-5"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  arrow: <path d="m9 18 6-6-6-6"/>,
};

function Icon({ name }: { name: IconName }) {
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Mark() { return <Link className="brand" href="/dashboard" aria-label="Eventise ana sayfa"><span>e</span><b>eventise</b></Link>; }

export function AppNav({ organization, active, systemAdmin = false, compactDefault = false }: { organization: Organization; active: string; systemAdmin?: boolean; compactDefault?: boolean }) {
  const [collapsed, setCollapsed] = useState(compactDefault);
  const [viewerName, setViewerName] = useState('Kullanıcı');
  useEffect(() => {
    const saved = localStorage.getItem('eventise-nav-collapsed');
    setCollapsed(saved === null ? compactDefault : saved === 'true');
  }, [compactDefault]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/backend/auth/me', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(me => {
        if (!me) return;
        const fullName = [me.firstName, me.lastName].filter(Boolean).join(' ').trim();
        setViewerName(fullName || me.email || 'Kullanıcı');
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  function toggle() {
    setCollapsed(value => {
      localStorage.setItem('eventise-nav-collapsed', String(!value));
      return !value;
    });
  }
  const item = (href: string, label: string, description: string, key: string, icon: IconName, emphasis = false) => <Link
    title={collapsed ? label : undefined}
    aria-label={`${label}: ${description}`}
    aria-current={active === key ? 'page' : undefined}
    className={`${active === key ? 'active ' : ''}${emphasis ? 'nav-emphasis' : ''}`.trim()}
    href={href}
  >
    <Icon name={icon}/>
    <span className="nav-item-copy"><b>{label}</b><small>{description}</small></span>
  </Link>;
  const reportProblem = <a href="#sorun-bildir" title={collapsed ? 'Sorun Bildir' : undefined} aria-label="Sorun Bildir" onClick={event => {
    event.preventDefault();
    window.dispatchEvent(new Event('eventise:open-problem-reporter'));
  }}><Icon name="info"/><span className="nav-item-copy"><b>Sorun bildir</b><small>Destek ekibine ilet</small></span></a>;
  const restartTour = <a href="#eventise-turu" title={collapsed ? 'Hızlı ürün turu' : undefined} aria-label="Hızlı ürün turunu başlat" onClick={event => {
    event.preventDefault();
    window.dispatchEvent(new Event('eventise:start-product-tour'));
  }}><Icon name="updates"/><span className="nav-item-copy"><b>Hızlı ürün turu</b><small>Ekranda adım adım keşfet</small></span></a>;
  const role = organization.memberships?.[0]?.role ?? 'MEMBER';
  return <aside className={`app-nav${collapsed ? ' collapsed' : ''}`}>
    <div className="brand-row"><Mark /><BetaNotice /><button className="nav-collapse" onClick={toggle} aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'} title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}><Icon name="menu"/></button></div>
    <div className="org-chip" title={`${organization.name} · ${viewerName}`}><span><Icon name="building"/></span><div><b>{organization.name}</b><strong>{viewerName}</strong><em>{roleNames[role] ?? role}</em></div></div>
    <Link className={`participant-switch${active === 'participant' ? ' active' : ''}`} href="/participant" aria-current={active === 'participant' ? 'page' : undefined} title={collapsed ? 'Katılımcı alanım' : undefined}>
      <span className="participant-switch-icon"><Icon name="users"/></span>
      <span className="nav-item-copy"><b>Katılımcı alanım</b><small>Kişisel etkinliklerim ve belgelerim</small></span>
      <Icon name="arrow"/>
    </Link>
    <nav aria-label="Ana menü">
      <Link
        href="/dashboard/about/updates"
        className={`nav-updates-spotlight${active === 'updates' ? ' active' : ''}`}
        aria-current={active === 'updates' ? 'page' : undefined}
        aria-label="Yenilikler: 0.20.0 sürümünde neler değişti?"
        title={collapsed ? 'Yenilikler' : undefined}
      >
        <span className="nav-updates-icon"><Icon name="updates"/><i aria-hidden="true" /></span>
        <span className="nav-item-copy"><span><b>Yenilikler</b><em>YENİ</em></span><small>v0.20.0 · Neler değişti?</small></span>
        <Icon name="arrow"/>
      </Link>
      <div className="nav-group"><small>BAŞLANGIÇ</small>{item('/dashboard', 'Ana sayfa', 'Günün özeti ve bekleyen işler', 'home', 'home')}</div>
      <div className="nav-group"><small>ETKİNLİKLER</small>{item('/dashboard#events', 'Etkinlikler', 'Tüm etkinlikleri görüntüle', 'events', 'calendar')}{item('/dashboard/events/new', 'Yeni etkinlik', 'Adım adım etkinlik oluştur', 'new', 'plus', true)}</div>
      <div className="nav-group"><small>KURUM</small>{item('/dashboard/settings', 'Kurum ve ekip', 'Bilgiler, üyeler ve yetkiler', 'settings', 'building')}{item('/dashboard/quota', 'Kullanım', 'Dosya ve depolama limitleri', 'quota', 'usage')}</div>
      {systemAdmin && <div className="nav-group"><small>YÖNETİM</small>{item('/admin', 'Sistem yönetimi', 'Kurumlar, kullanıcılar ve planlar', 'admin', 'shield')}</div>}
      <div className="nav-group"><small>YARDIM VE DESTEK</small>{restartTour}{item('/yardim', 'Kullanım rehberi', 'Adım adım kullanım bilgileri', 'help', 'book')}{reportProblem}</div>
      <div className="nav-group"><small>EVENTISE</small>{item('/dashboard/about', 'Eventise hakkında', 'Ürün, yaklaşım ve iletişim', 'about', 'info')}</div>
    </nav>
    <div className="nav-logout"><Icon name="logout"/><LogoutButton /></div>
  </aside>;
}

export function MobileTopBar({ backHref = '/dashboard', backLabel = 'Ana sayfa' }: { backHref?: string; backLabel?: string }) {
  return <div className="mobile-topbar"><Mark /><Link href={backHref}>← {backLabel}</Link></div>;
}

export function EventNav({ eventId, active, enabled = {} }: { eventId: string; active: string; enabled?: Record<string, boolean> }) {
  const base = `/dashboard/events/${eventId}`;
  const item = (href: string, label: string, key: string) => (enabled[key] ?? true) ? <Link className={active === key ? 'active' : ''} href={href} aria-current={active === key ? 'page' : undefined}>{label}</Link> : null;
  return <nav className="event-nav" aria-label="Etkinlik bölümleri">
    <div className="event-nav-top"><Link href="/dashboard">← Tüm etkinlikler</Link><span>Etkinlik çalışma alanı</span></div>
    <div className="event-nav-links">
      {item(base, 'Genel Bakış', 'dashboard')}
      {item(`${base}/settings`, 'Etkinlik Bilgileri', 'settings')}
      {item(`${base}/modules`, 'Etkinlik Araçları', 'modules')}
      {item(`${base}/communication`, 'Davet ve İletişim', 'communication')}
      {item(`${base}/day`, 'Kapı ve Katılım', 'day')}
      {item(`${base}/post-event`, 'Sonuçlar', 'post')}
      {item(`${base}/certificates`, 'Sertifikalar', 'certificates')}
    </div>
  </nav>;
}
