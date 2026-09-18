'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatDateLong } from '@/lib/datetime';
import { productTerms, publicationLabel, registrationLabel } from '@/lib/product-language';
import { ActionFeedback, type FeedbackState } from '../../../components/action-feedback';

const icons: Record<string, React.ReactNode> = {
  info: <><path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  applications: <><path d="M8 4h8M9 2h6v4H9z"/><path d="M5 5h14v16H5zM8 11h8M8 15h5"/></>,
  tools: <><path d="m14.7 6.3 3-3a4 4 0 0 1-5 5l-7.4 7.4a2 2 0 1 1-3-3l7.4-7.4a4 4 0 0 1 5-5l-3 3 3 3Z"/></>,
  communication: <><path d="M4 5h16v11H8l-4 4V5Z"/><path d="m7 8 5 4 5-4"/></>,
  door: <><path d="M5 21h14M7 21V4l10-2v19"/><circle cx="14" cy="12" r=".8"/></>,
  results: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  feedback: <><path d="M5 5h14v10H9l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></>,
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [publication, setPublication] = useState(publicationStatus);
  const [registration, setRegistration] = useState(registrationStatus);
  const [busy, setBusy] = useState(false);
  const [compact, setCompact] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

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
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
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
            : pathname.includes('/post-event') && searchParams.get('tab') === 'feedback' ? 'feedback'
              : pathname.includes('/post-event') ? 'results'
                : pathname.includes('/certificates') ? 'certificate' : 'info';
  const groups = [
    { label: 'İletişim ve Paylaşım', tourId: 'communication-area', links: [
      [`${base}/communication`, 'İletişim', 'communication'],
    ] },
    { label: 'Etkinlik Öncesi', tourId: 'pre-event-area', links: [
      [`${base}/settings?subtab=info`, 'Etkinlik Bilgileri', 'info'],
      [`${base}/applications`, 'Başvuru Yönetimi', 'applications'],
    ] },
    { label: 'Etkinlik Günü', tourId: 'during-event-area', links: [
      [`${base}/day`, productTerms.entryAndAttendance, 'door'],
      [`${base}/modules`, productTerms.eventTools, 'tools'],
    ] },
    { label: 'Etkinlik Sonrası', tourId: 'post-event-area', links: [
      [`${base}/post-event?tab=feedback`, 'Geri Bildirim', 'feedback'],
      [`${base}/certificates`, productTerms.certificates, 'certificate'],
      [`${base}/post-event`, 'Sonuçlar', 'results'],
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
      if (closesRegistration && !window.confirm('Etkinlik taslağa alınacak ve başvuru formu kapatılacak. Devam edilsin mi?')) return;
      await update('UNPUBLISHED', closesRegistration ? 'CLOSED' : registration, closesRegistration ? 'Etkinlik taslağa alındı ve başvuru formu kapatıldı.' : 'Etkinlik taslağa alındı.');
      return;
    }
    await update('PUBLISHED', registration, 'Etkinlik yayınlandı.');
  }

  async function toggleRegistration() {
    if (registration === 'OPEN') {
      await update(publication, 'CLOSED', 'Başvuru formu kapatıldı.');
      return;
    }
    if (publication !== 'PUBLISHED') {
      if (!window.confirm('Başvuru formunu açmak için etkinlik de yayınlanacak. İki işlemi birlikte yapmak istiyor musunuz?')) return;
      await update('PUBLISHED', 'OPEN', 'Etkinlik yayınlandı ve başvuru formu açıldı.');
      return;
    }
    await update(publication, 'OPEN', 'Başvuru formu açıldı.');
  }

  return <header className={`event-command-center simplified${compact ? ' is-compact' : ''}`} data-tour-id="event-command-center">
    <ActionFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />
    <div className="event-topline"><span className="workspace-label">ETKİNLİK YÖNETİMİ</span></div>
    <div className="event-command-main event-command-light-row">
      <div className="event-identity">
        <div className="event-identity-date" aria-hidden="true"><strong>{eventDate.getDate()}</strong><span>{eventDate.toLocaleDateString('tr-TR', { month: 'short' })}</span></div>
        <div><span>{organizationName}</span><h1>{title}</h1><p>{formatDateLong(startsAt)}</p></div>
      </div>
      <div className="event-state-actions" aria-label="Etkinlik durumları" data-tour-id="publication-controls">
        <div className="event-state-control">
          <button type="button" className={`event-state-button ${publication === 'PUBLISHED' ? 'is-on' : ''}`} disabled={busy} onClick={togglePublication} aria-pressed={publication === 'PUBLISHED'}>
            <span><small>Etkinlik</small><b>{publicationLabel(publication)}</b></span><i aria-hidden="true" />
          </button>
          <small>{publication === 'PUBLISHED' ? 'Katılımcılar görebilir · kapatmak için tıklayın' : 'Katılımcılar göremez · yayınlamak için tıklayın'}</small>
        </div>
        <div className="event-state-control">
          <button type="button" className={`event-state-button ${registration === 'OPEN' ? 'is-on' : ''}`} disabled={busy} onClick={toggleRegistration} aria-pressed={registration === 'OPEN'}>
            <span><small>{productTerms.applicationForm}</small><b>{registrationLabel(registration)}</b></span><i aria-hidden="true" />
          </button>
          <small>{registration === 'OPEN' ? 'Yeni başvurular alınır · kapatmak için tıklayın' : 'Yeni başvuru alınmaz · açmak için tıklayın'}</small>
        </div>
        <div className="event-preview-control">
          <a className="event-preview-button" href={publication === 'PUBLISHED' ? publicUrl : `${base}/settings?subtab=appearance`} target={publication === 'PUBLISHED' ? '_blank' : undefined} rel="noopener noreferrer"><span aria-hidden="true">↗</span><b>{publication === 'PUBLISHED' ? 'Başvuru Sayfasını Aç' : 'Başvuru sayfasını düzenle'}</b></a>
          <small>{publication === 'PUBLISHED' ? 'Katılımcıların gördüğü sayfayı yeni sekmede açar.' : 'Başvuru sayfası görünümünü düzenleyin.'}</small>
        </div>
      </div>
    </div>
    <nav className="event-primary-nav grouped" aria-label="Etkinlik bölümleri">
      {groups.map(group => <div className="event-nav-group" data-tour-id={group.tourId} key={group.label}><small>{group.label}</small><div>{group.links.map(([href, label, key]) => <Link data-tour-id={`${key}-area`} key={key} href={href} className={current === key ? 'active' : ''} aria-current={current === key ? 'page' : undefined}><Icon name={key}/><span>{label}</span>{key === 'applications' && registrationCount > 0 && <em>{registrationCount}</em>}</Link>)}</div></div>)}
    </nav>
  </header>;
}
