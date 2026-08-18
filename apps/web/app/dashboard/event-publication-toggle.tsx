'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  eventId: string;
  eventTitle: string;
  organizationId: string;
  publicationStatus: string;
  registrationStatus: string;
};

export function EventPublicationToggle({ eventId, eventTitle, organizationId, publicationStatus, registrationStatus }: Props) {
  const router = useRouter();
  const [publication, setPublication] = useState(publicationStatus);
  const [registration, setRegistration] = useState(registrationStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isPublished = publication === 'PUBLISHED';
  const isArchived = publication === 'ARCHIVED';

  async function toggle() {
    const closesRegistration = isPublished && registration === 'OPEN';
    if (closesRegistration && !window.confirm('Etkinlik yayından kaldırılacak ve kayıt formu kapatılacak. Devam edilsin mi?')) return;

    const nextPublication = isPublished ? 'UNPUBLISHED' : 'PUBLISHED';
    const nextRegistration = closesRegistration ? 'CLOSED' : registration;
    setBusy(true);
    setError('');

    try {
      const response = await fetch(`/api/backend/organizations/${organizationId}/events/${eventId}/state`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ publicationStatus: nextPublication, registrationStatus: nextRegistration }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message.join(' ') : data.message;
        throw new Error(message ?? 'Yayın durumu güncellenemedi.');
      }

      setPublication(nextPublication);
      setRegistration(nextRegistration);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Yayın durumu güncellenemedi.');
    } finally {
      setBusy(false);
    }
  }

  const stateLabel = isPublished ? 'Yayında' : isArchived ? 'Arşivlendi' : 'Yayında değil';
  const actionLabel = isPublished ? 'yayından kaldır' : 'yayınla';
  const errorId = `publication-error-${eventId}`;

  return <div className="home-publication-control">
    <button
      type="button"
      role="switch"
      aria-checked={isPublished}
      aria-label={`${eventTitle} etkinliğini ${actionLabel}`}
      aria-describedby={error ? errorId : undefined}
      className={`home-publication-toggle${isPublished ? ' is-on' : ''}${busy ? ' is-busy' : ''}`}
      disabled={busy || isArchived}
      title={isArchived ? 'Arşivlenen etkinlikler yeniden yayınlanamaz.' : `${eventTitle}: ${stateLabel}`}
      onClick={toggle}
    >
      <span aria-hidden="true" />
      <b className="home-publication-copy">{busy ? 'Güncelleniyor…' : stateLabel}</b>
    </button>
    {error && <small className="home-publication-error" id={errorId} role="alert" title={error}>!</small>}
  </div>;
}
