'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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

export function EventWorkspaceHeader({ eventId, organizationId, organizationSlug, organizationName, title, eventSlug, startsAt, publicationStatus, registrationStatus }: {
  eventId: string; organizationId: string; organizationSlug: string; organizationName: string; title: string; eventSlug: string; startsAt: string; publicationStatus: string; registrationStatus: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [publication, setPublication] = useState(publicationStatus);
  const [registration, setRegistration] = useState(registrationStatus);
  const [busy, setBusy] = useState(false);
  const [compact, setCompact] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setCompact(current => current ? y > 32 : y > 160);
      });
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!deleteRef.current?.contains(event.target as Node)) setDeleteOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDeleteOpen(false);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  const base = `/dashboard/events/${eventId}`;
  const publicUrl = `/events/${organizationSlug}/${eventSlug}`;
  const eventDate = new Date(startsAt);
  const eventDay = eventDate.getDate();
  const eventMonth = eventDate.toLocaleDateString('tr-TR', { month: 'short' });
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
    if (!confirm('Etkinliği silme süreci başlatılsın mı? Etkinlik 30 gün boyunca geri alınabilir.')) return;
    setBusy(true);
    const response = await fetch(`/api/backend/organizations/${organizationId}/events/${eventId}/deletion`, { method: 'POST' });
    if (response.ok) router.push('/dashboard#events');
    else setBusy(false);
  }

  return <header className={`event-command-center${compact ? ' is-compact' : ''}`} data-tour-id="event-command-center">
    <div className="event-topline">
      <Link className="event-back" href="/dashboard#events"><span>←</span> Tüm Etkinlikler</Link>
      <span className="workspace-label">ETKİNLİK KONTROL MERKEZİ</span>
    </div>
    <div className="event-identity">
      <div className="event-identity-date" aria-hidden="true"><strong>{eventDay}</strong><span>{eventMonth}</span></div>
      <div><span>{organizationName}</span><h1>{title}</h1><p>{formatDateLong(startsAt)}</p></div>
    </div>
    <div className="event-quick-actions" aria-label="Etkinlik hızlı işlemleri" data-tour-id="publication-controls">
      <button className={`event-action-toggle ${publication === 'PUBLISHED' ? 'is-on' : ''}`} role="switch" aria-checked={publication === 'PUBLISHED'} disabled={busy} onClick={() => update(publication === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED', registration)} title="Katılımcıların etkinliğin herkese açık tanıtım sayfasını görüp göremeyeceğini belirler.">
        <span className="action-icon">◉</span><span className="action-copy"><b>Etkinlik Sayfası</b><small>{publication === 'PUBLISHED' ? 'Yayında' : 'Yayın dışı'}</small></span><span className="action-switch"><i/></span>
      </button>
      <button className={`event-action-toggle ${registration === 'OPEN' ? 'is-on' : ''}`} role="switch" aria-checked={registration === 'OPEN'} disabled={busy} onClick={() => update(publication === 'PUBLISHED' ? publication : 'PUBLISHED', registration === 'OPEN' ? 'CLOSED' : 'OPEN')} title="Katılımcıların kayıt formunu doldurup yeni başvuru gönderebilmesini açar veya kapatır.">
        <span className="action-icon">✓</span><span className="action-copy"><b>Kayıt Formu</b><small>{registration === 'OPEN' ? 'Yayında' : 'Yayın dışı'}</small></span><span className="action-switch"><i/></span>
      </button>
      <a className="event-action-button public-page" href={publicUrl} target="_blank" rel="noopener noreferrer" title="Etkinlik sayfasını yeni sekmede görüntüleyin."><span className="action-icon">↗</span><span className="action-copy"><b>Etkinlik sayfasını aç</b><small>Yeni sekmede görüntüle</small></span></a>
      <Link className="event-action-button announce" href={`${base}/communication?subtab=notifications`} title="Kayıtlı katılımcılara hedefli bir etkinlik duyurusu gönderin."><span className="action-icon">✦</span><span className="action-copy"><b>Duyuru gönder</b><small>Katılımcılara ulaş</small></span></Link>
      <div className="event-delete" ref={deleteRef}>
        <button className="event-action-button delete-trigger" type="button" aria-haspopup="dialog" aria-controls="event-delete-confirmation" aria-expanded={deleteOpen} disabled={busy} onClick={() => setDeleteOpen(value => !value)}><span className="action-icon">⌫</span><span className="action-copy"><b>Sil</b><small>Güvenli silme</small></span></button>
        {deleteOpen && <div className="event-delete-popover" id="event-delete-confirmation" role="dialog" aria-labelledby="event-delete-title">
          <div className="event-delete-warning"><span aria-hidden="true">!</span><div><b id="event-delete-title">Etkinliği silmek üzeresiniz</b><p>Etkinlik 30 gün boyunca geri alınabilir, ardından kalıcı olarak silinir.</p></div></div>
          <div className="event-delete-actions"><button type="button" className="cancel-delete" onClick={() => setDeleteOpen(false)}>Vazgeç</button><button type="button" className="confirm-delete" disabled={busy} onClick={removeEvent}>{busy ? 'Siliniyor…' : 'Etkinliği sil'}</button></div>
        </div>}
      </div>
    </div>
    <nav className="event-primary-nav" aria-label="Etkinlik ana menüsü">
      {links.map(([href, label, key]) => <Link data-tour-id={`${key === 'info' ? 'registration' : key === 'door' ? 'event-day' : key}-area`} key={key} href={href} className={current === key ? 'active' : ''} aria-current={current === key ? 'page' : undefined}><Icon name={key}/><span>{label}</span></Link>)}
    </nav>
  </header>;
}
