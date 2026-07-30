'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatDateLong } from '@/lib/datetime';

const icons: Record<string, React.ReactNode> = {
  overview: <><path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z"/></>,
  info: <><path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  tools: <><path d="m14.7 6.3 3-3a4 4 0 0 1-5 5l-7.4 7.4a2 2 0 1 1-3-3l7.4-7.4a4 4 0 0 1 5-5l-3 3 3 3Z"/></>,
  communication: <><path d="M4 5h16v11H8l-4 4V5Z"/><path d="m7 8 5 4 5-4"/></>,
  door: <><path d="M5 21h14M7 21V4l10-2v19"/><circle cx="14" cy="12" r=".8"/></>,
  results: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  certificate: <><circle cx="12" cy="9" r="6"/><path d="m8 14-1 8 5-3 5 3-1-8"/></>,
};

function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}

export function EventWorkspaceHeader({ eventId, organizationId, organizationName, title, startsAt, publicationStatus, registrationStatus }: {
  eventId: string; organizationId: string; organizationName: string; title: string; startsAt: string; publicationStatus: string; registrationStatus: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [publication, setPublication] = useState(publicationStatus);
  const [registration, setRegistration] = useState(registrationStatus);
  const [busy, setBusy] = useState(false);
  const base = `/dashboard/events/${eventId}`;
  const current = pathname === base ? 'overview' : pathname.includes('/settings') ? 'info' : pathname.includes('/modules') ? 'tools' : pathname.includes('/communication') ? 'communication' : pathname.includes('/day') ? 'door' : pathname.includes('/post-event') ? 'results' : 'certificate';
  const links = [
    [base, 'Genel Bakış', 'overview'],
    [`${base}/settings`, 'Kayıt & Bilgiler', 'info'],
    [`${base}/modules`, 'Etkinlik Araçları', 'tools'],
    [`${base}/communication`, 'Davet & İletişim', 'communication'],
    [`${base}/day`, 'Kapı & Katılım', 'door'],
    [`${base}/post-event`, 'Sonuçlar', 'results'],
    [`${base}/certificates`, 'Sertifikalar', 'certificate'],
  ];
  async function update(nextPublication: string, nextRegistration: string) {
    setBusy(true);
    const response = await fetch(`/api/backend/organizations/${organizationId}/events/${eventId}/state`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ publicationStatus: nextPublication, registrationStatus: nextRegistration }),
    });
    if (response.ok) {
      setPublication(nextPublication);
      setRegistration(nextRegistration);
      router.refresh();
    }
    setBusy(false);
  }
  async function removeEvent() {
    if (!confirm('Bu etkinlik silinecek ve 30 gün boyunca geri alınabilecek. Devam edilsin mi?')) return;
    setBusy(true);
    const response = await fetch(`/api/backend/organizations/${organizationId}/events/${eventId}/deletion`, { method: 'POST' });
    if (response.ok) router.push('/dashboard#events');
    else setBusy(false);
  }

  return <header className="event-command-center">
    <Link className="event-back" href="/dashboard#events"><span>←</span> Tüm Etkinlikler</Link>
    <div className="event-quick-actions" aria-label="Etkinlik hızlı işlemleri">
      <button disabled={busy} onClick={() => update(publication === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED', registration)}>
        <span className={`action-dot ${publication === 'PUBLISHED' ? 'live' : ''}`}/>{publication === 'PUBLISHED' ? 'Yayında' : 'Yayın dışı'}
      </button>
      <button disabled={busy} onClick={() => update(publication === 'PUBLISHED' ? publication : 'PUBLISHED', registration === 'OPEN' ? 'CLOSED' : 'OPEN')}>
        <span className={`action-dot ${registration === 'OPEN' ? 'open' : ''}`}/>{registration === 'OPEN' ? 'Kayıt açık' : 'Kayıt kapalı'}
      </button>
      <Link href={`${base}/communication?subtab=notifications`}>✦ Duyuru gönder</Link>
      <button className="danger-action" disabled={busy} onClick={removeEvent}>⌫ Sil</button>
    </div>
    <div className="event-identity">
      <div className="event-identity-mark">E</div>
      <div><span>{organizationName}</span><h1>{title}</h1><p>📅 {formatDateLong(startsAt)}</p></div>
    </div>
    <nav className="event-primary-nav" aria-label="Etkinlik ana menüsü">
      {links.map(([href, label, key]) => <Link key={key} href={href} className={current === key ? 'active' : ''} aria-current={current === key ? 'page' : undefined}><Icon name={key}/><span>{label}</span></Link>)}
    </nav>
  </header>;
}
