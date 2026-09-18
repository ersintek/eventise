'use client';

import { useEffect, useState } from 'react';

type Photo = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  caption?: string;
  url: string;
  uploaderRegistration: { firstName: string; lastName: string };
};

export function PhotoManager({ organizationId, eventId }: { organizationId: string; eventId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const endpoint = `/api/backend/organizations/${organizationId}/events/${eventId}/photos`;

  useEffect(() => {
    let active = true;
    fetch(endpoint).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Fotoğraflar alınamadı.');
      if (active) setPhotos(data);
    }).catch(error => active && setMessage(error instanceof Error ? error.message : 'Fotoğraflar alınamadı.'));
    return () => { active = false; };
  }, [endpoint]);

  async function moderate(id: string, status: 'APPROVED' | 'REJECTED') {
    setBusyId(id); setMessage('');
    try {
      const response = await fetch(`${endpoint}/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Fotoğraf güncellenemedi.');
      setPhotos(current => current.map(photo => photo.id === id ? { ...photo, status } : photo));
      setMessage(status === 'APPROVED' ? 'Fotoğraf onaylandı.' : 'Fotoğraf reddedildi.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Fotoğraf güncellenemedi.');
    } finally { setBusyId(null); }
  }

  return <section className="photo-manager">
    <div className="workspace-page-heading"><div><p className="eyebrow">İLETİŞİM</p><h2>Fotoğraflar</h2><p>Katılımcıların yüklediği fotoğrafları onaylayın veya reddedin.</p></div><span className="heading-count">{photos.length} fotoğraf</span></div>
    {message && <p className="notice" role="status">{message}</p>}
    {photos.length === 0 ? <div className="hint-box">Henüz incelenecek fotoğraf yok. Katılımcılar fotoğraf yükledikçe burada görünecek.</div> : <div className="event-grid photo-grid">{photos.map(photo => <article className="workspace-card" key={photo.id}><img src={photo.url} alt={photo.caption ?? `${photo.uploaderRegistration.firstName} ${photo.uploaderRegistration.lastName} tarafından yüklenen fotoğraf`}/><div><b>{photo.uploaderRegistration.firstName} {photo.uploaderRegistration.lastName}</b>{photo.caption && <p>{photo.caption}</p>}<span className={`pill ${photo.status === 'APPROVED' ? 'published' : ''}`}>{photo.status === 'PENDING' ? 'İnceleniyor' : photo.status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}</span></div>{photo.status === 'PENDING' && <div className="action-links"><button className="secondary" disabled={busyId !== null} onClick={() => moderate(photo.id, 'APPROVED')}>{busyId === photo.id ? 'Güncelleniyor…' : 'Onayla'}</button><button className="secondary danger-text" disabled={busyId !== null} onClick={() => moderate(photo.id, 'REJECTED')}>Reddet</button></div>}</article>)}</div>}
  </section>;
}
