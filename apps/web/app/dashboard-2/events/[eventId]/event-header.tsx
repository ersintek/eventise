'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatDateLong } from '@/lib/datetime';

type Props = { eventId: string; organizationId: string; organizationSlug: string; eventSlug: string; title: string; startsAt: string; publicationStatus: string; registrationStatus: string };

export function DashboardTwoEventHeader({ eventId, organizationId, organizationSlug, eventSlug, title, startsAt, publicationStatus, registrationStatus }: Props) {
  const pathname = usePathname(), router = useRouter();
  const [publication, setPublication] = useState(publicationStatus), [registration, setRegistration] = useState(registrationStatus), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const base = `/dashboard-2/events/${eventId}`;
  const active = pathname.includes('/settings') ? 'plan' : pathname.includes('/applications') || pathname.includes('/communication') ? 'participants' : pathname.includes('/modules') ? 'content' : pathname.includes('/day') ? 'day' : 'closure';
  const links = [['plan', 'Planla', `${base}/settings?subtab=info`], ['participants', 'Katılımcılar', `${base}/applications`], ['content', 'Etkinlik içeriği', `${base}/modules`], ['day', 'Etkinlik günü', `${base}/day`], ['closure', 'Kapanış', `${base}/post-event`]];
  const state = publication !== 'PUBLISHED' ? 'Taslak · Katılımcılar henüz göremez' : registration === 'OPEN' ? 'Yayında · Başvurular açık' : 'Yayında · Başvuru alınmıyor';
  const action = publication !== 'PUBLISHED' ? 'Etkinliği yayınla' : registration !== 'OPEN' ? 'Başvuru almayı aç' : 'Başvuru almayı kapat';
  async function update(nextPublication: string, nextRegistration: string) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/backend/organizations/${organizationId}/events/${eventId}/state`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ publicationStatus: nextPublication, registrationStatus: nextRegistration }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message ?? 'Durum güncellenemedi.');
      setPublication(nextPublication); setRegistration(nextRegistration); setMessage(nextPublication !== 'PUBLISHED' ? 'Etkinlik taslağa alındı.' : nextRegistration === 'OPEN' ? 'Etkinlik yayınlandı ve başvuru almaya başladı.' : 'Etkinlik yayınlandı.'); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Durum güncellenemedi.'); }
    finally { setBusy(false); }
  }
  function act() {
    if (publication !== 'PUBLISHED') return void update('PUBLISHED', registration);
    if (registration !== 'OPEN') return void update('PUBLISHED', 'OPEN');
    if (window.confirm('Yeni başvuru almayı durdurmak istiyor musunuz?')) void update('PUBLISHED', 'CLOSED');
  }
  const preview = publication === 'PUBLISHED' ? `/events/${organizationSlug}/${eventSlug}` : `${base}/settings?subtab=appearance`;
  const secondary = active === 'participants' ? [['Başvurular', `${base}/applications`], ['Davet et', `${base}/communication?subtab=invite`], ['Hatırlatmalar', `${base}/communication?subtab=reminders`], ['Duyurular', `${base}/communication?subtab=notifications`]] : active === 'closure' ? [['Sonuçlar', `${base}/post-event`], ['Sertifikalar', `${base}/certificates`]] : [];
  return <header className="dashboard-two-event-header"><Link className="dashboard-two-back" href="/dashboard-2">← Etkinliklere dön</Link><div className="dashboard-two-event-heading"><div><h1>{title}</h1><p>{formatDateLong(startsAt)}</p><span className="dashboard-two-event-status">{state}</span></div><div className="dashboard-two-event-header-actions"><button className="primary" disabled={busy} onClick={act}>{busy ? 'Güncelleniyor…' : action}</button><a className="secondary" href={preview} target={publication === 'PUBLISHED' ? '_blank' : undefined} rel="noreferrer">{publication === 'PUBLISHED' ? 'Katılımcı sayfasını aç' : 'Katılımcı sayfasını düzenle'}</a></div></div>{message && <p className="notice" role="status">{message}</p>}<nav className="dashboard-two-event-nav" aria-label="Etkinlik yönetimi">{links.map(([key, label, href]) => <Link key={key} href={href} className={active === key ? 'active' : ''} aria-current={active === key ? 'page' : undefined}>{label}</Link>)}</nav>{secondary.length > 0 && <nav className="dashboard-two-subnav" aria-label="Bölüm işlemleri">{secondary.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav>}</header>;
}
