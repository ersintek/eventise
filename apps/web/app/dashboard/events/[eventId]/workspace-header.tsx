'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { formatDateLong } from '@/lib/datetime';
import { publicationLabel, registrationLabel } from '@/lib/product-language';
import { ActionFeedback, type FeedbackState } from '../../../components/action-feedback';

const icons: Record<string, React.ReactNode> = {
  info: <><path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  applications: <><path d="M8 4h8M9 2h6v4H9z"/><path d="M5 5h14v16H5zM8 11h8M8 15h5"/></>,
  tools: <><path d="m14.7 6.3 3-3a4 4 0 0 1-5 5l-7.4 7.4a2 2 0 1 1-3-3l7.4-7.4a4 4 0 0 1 5-5l-3 3 3 3Z"/></>,
  communication: <><path d="M4 5h16v11H8l-4 4V5Z"/><path d="m7 8 5 4 5-4"/></>,
  door: <><path d="M5 21h14M7 21V4l10-2v19"/><circle cx="14" cy="12" r=".8"/></>,
  results: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  certificate: <><circle cx="12" cy="9" r="6"/><path d="m8 14-1 8 5-3 5 3-1-8"/></>,
};

function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}

type Props = {
  eventId: string;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  title: string;
  eventSlug: string;
  startsAt: string;
  publicationStatus: string;
  registrationStatus: string;
  registrationCount?: number;
};

export function EventWorkspaceHeader({ eventId, organizationId, organizationSlug, organizationName, title, eventSlug, startsAt, publicationStatus, registrationStatus, registrationCount = 0 }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [publication, setPublication] = useState(publicationStatus);
  const [registration, setRegistration] = useState(registrationStatus);
  const [busy, setBusy] = useState(false);
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setCompact(current => current ? y > 32 : y > 150);
      });
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
      if (!deleteRef.current?.contains(event.target as Node)) setDeleteOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); setDeleteOpen(false); }
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
  const current = pathname.includes('/applications') ? 'applications'
    : pathname.includes('/settings') ? 'info'
      : pathname.includes('/modules') ? 'tools'
        : pathname.includes('/communication') ? 'communication'
          : pathname.includes('/day') ? 'door'
            : pathname.includes('/post-event') ? 'results'
              : pathname.includes('/certificates') ? 'certificate' : 'info';
  const groups = [
    { label: 'Etkinlik öncesi', links: [
      [`${base}/settings?subtab=info`, 'Etkinlik Bilgileri', 'info'],
      [`${base}/applications`, 'Başvurular', 'applications'],
      [`${base}/communication`, 'İletişim', 'communication'],
      [`${base}/modules`, 'Araçlar', 'tools'],
    ] },
    { label: 'Etkinlik sırasında', links: [[`${base}/day`, 'Katılım', 'door']] },
    { label: 'Etkinlik sonrası', links: [
      [`${base}/post-event`, 'Sonuçlar', 'results'],
      [`${base}/certificates`, 'Sertifikalar', 'certificate'],
    ] },
  ];

  async function update(nextPublication: string, nextRegistration: string, success: string) {
    setBusy(true); setFeedback(null);
    try {
      const response = await fetch(`/api/backend/organizations/${organizationId}/events/${eventId}/state`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ publicationStatus: nextPublication, registrationStatus: nextRegistration }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Durum güncellenemedi.');
      setPublication(nextPublication); setRegistration(nextRegistration);
      setFeedback({ kind: 'success', message: success });
      router.refresh();
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Durum güncellenemedi.' });
    } finally { setBusy(false); }
  }

  async function togglePublication() {
    if (publication === 'PUBLISHED') {
      const closesRegistration = registration === 'OPEN';
      if (closesRegistration && !window.confirm('Etkinlik taslağa alınacak ve kayıt formu kapatılacak. Devam edilsin mi?')) return;
      await update('UNPUBLISHED', closesRegistration ? 'CLOSED' : registration, closesRegistration ? 'Etkinlik taslağa alındı ve kayıt formu kapatıldı.' : 'Etkinlik taslağa alındı.');
      return;
    }
    await update('PUBLISHED', registration, 'Etkinlik yayınlandı.');
  }

  async function toggleRegistration() {
    if (registration === 'OPEN') {
      await update(publication, 'CLOSED', 'Kayıt formu kapatıldı.');
      return;
    }
    if (publication !== 'PUBLISHED') {
      if (!window.confirm('Kayıt formunu açmak için etkinlik de yayınlanacak. İki işlemi birlikte yapmak istiyor musunuz?')) return;
      await update('PUBLISHED', 'OPEN', 'Etkinlik yayınlandı ve kayıt formu açıldı.');
      return;
    }
    await update(publication, 'OPEN', 'Kayıt formu açıldı.');
  }

  async function removeEvent() {
    if (!window.confirm('Etkinlik silme süreci başlatılsın mı? Etkinlik 30 gün boyunca geri alınabilir.')) return;
    setBusy(true);
    const response = await fetch(`/api/backend/organizations/${organizationId}/events/${eventId}/deletion`, { method: 'POST' });
    if (response.ok) router.push('/dashboard#events');
    else { setBusy(false); setFeedback({ kind: 'error', message: 'Etkinlik silinemedi.' }); }
  }

  return <header className={`event-command-center simplified${compact ? ' is-compact' : ''}`} data-tour-id="event-command-center">
    <ActionFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />
    <div className="event-topline">
      <Link className="event-back" href="/dashboard#events"><span>←</span> Tüm etkinlikler</Link>
      <span className="workspace-label">ETKİNLİK YÖNETİMİ</span>
    </div>
    <div className="event-command-main">
      <div className="event-identity">
        <div className="event-identity-date" aria-hidden="true"><strong>{eventDate.getDate()}</strong><span>{eventDate.toLocaleDateString('tr-TR', { month: 'short' })}</span></div>
        <div><span>{organizationName}</span><h1>{title}</h1><p>{formatDateLong(startsAt)}</p></div>
      </div>
      <div className="event-state-actions" aria-label="Etkinlik durumları" data-tour-id="publication-controls">
        <button className={`event-state-button ${publication === 'PUBLISHED' ? 'is-on' : ''}`} disabled={busy} onClick={togglePublication}>
          <span><small>Etkinlik</small><b>{publicationLabel(publication)}</b></span><i aria-hidden="true" />
        </button>
        <button className={`event-state-button ${registration === 'OPEN' ? 'is-on' : ''}`} disabled={busy} onClick={toggleRegistration}>
          <span><small>Kayıt formu</small><b>{registrationLabel(registration)}</b></span><i aria-hidden="true" />
        </button>
        <a className="event-preview-button" href={publication === 'PUBLISHED' ? publicUrl : `${base}/settings?subtab=appearance`} target={publication === 'PUBLISHED' ? '_blank' : undefined} rel="noopener noreferrer">
          <span aria-hidden="true">↗</span><b>{publication === 'PUBLISHED' ? 'Etkinlik sayfasını aç' : 'Sayfa görünümünü düzenle'}</b>
        </a>
        <div className="event-more" ref={menuRef}>
          <button type="button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>•••<span className="sr-only">Diğer işlemler</span></button>
          {menuOpen && <div className="event-more-menu" role="menu">
            <Link role="menuitem" href={`${base}/communication?subtab=notifications`}>Duyuru gönder</Link>
            <Link role="menuitem" href={`${base}/settings?subtab=appearance`}>Sayfa görünümü</Link>
            <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}>Etkinliği sil</button>
          </div>}
        </div>
      </div>
    </div>
    {deleteOpen && <div className="event-delete-inline" ref={deleteRef} role="dialog" aria-labelledby="event-delete-title">
      <div><b id="event-delete-title">Etkinliği silmek üzeresiniz</b><p>Etkinlik 30 gün boyunca geri alınabilir, ardından kalıcı olarak silinir.</p></div>
      <button type="button" onClick={() => setDeleteOpen(false)}>Vazgeç</button>
      <button type="button" className="danger" disabled={busy} onClick={removeEvent}>{busy ? 'Siliniyor…' : 'Etkinliği sil'}</button>
    </div>}
    <nav className="event-primary-nav grouped" aria-label="Etkinlik bölümleri">
      {groups.map(group => <div className="event-nav-group" key={group.label}><small>{group.label}</small><div>{group.links.map(([href, label, key]) => <Link data-tour-id={`${key}-area`} key={key} href={href} className={current === key ? 'active' : ''} aria-current={current === key ? 'page' : undefined}><Icon name={key}/><span>{label}</span>{key === 'applications' && registrationCount > 0 && <em>{registrationCount}</em>}</Link>)}</div></div>)}
    </nav>
  </header>;
}
