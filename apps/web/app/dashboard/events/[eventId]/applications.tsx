'use client';

import { useMemo, useState } from 'react';
import { ActionFeedback, type FeedbackState } from '../../../components/action-feedback';
import { applicationStatusLabel } from '@/lib/product-language';

interface Registration { id: string; firstName: string; lastName: string; email: string; applicationStatus: string }

export function Applications({ organizationId, eventId, capacity, initial }: { organizationId: string; eventId: string; capacity: number; initial: Registration[] }) {
  const [rows, setRows] = useState(initial);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');
  const summary = useMemo(() => ({
    pending: rows.filter(row => row.applicationStatus === 'SUBMITTED' || row.applicationStatus === 'PENDING').length,
    accepted: rows.filter(row => row.applicationStatus === 'ACCEPTED').length,
    waitlisted: rows.filter(row => row.applicationStatus === 'WAITLISTED').length,
  }), [rows]);
  const shown = filter === 'ALL' ? rows : rows.filter(row => filter === 'PENDING' ? row.applicationStatus === 'SUBMITTED' || row.applicationStatus === 'PENDING' : row.applicationStatus === filter);

  async function decide(id: string, status: string) {
    setBusyId(id); setFeedback(null);
    try {
      const response = await fetch(`/api/backend/organizations/${organizationId}/registrations/${id}/decision`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Başvuru güncellenemedi.');
      setRows(value => value.map(row => row.id === id ? { ...row, applicationStatus: data.applicationStatus } : row));
      const message = status === 'ACCEPTED' ? 'Başvuru kabul edildi.' : status === 'WAITLISTED' ? 'Başvuru yedek listeye alındı.' : 'Başvuru reddedildi.';
      setFeedback({ kind: 'success', message });
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Başvuru güncellenemedi.' });
    } finally { setBusyId(null); }
  }

  return <section className="applications-workspace" data-event-id={eventId}>
    <ActionFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />
    <div className="application-metrics" aria-label="Başvuru özeti">
      <article><span>Toplam başvuru</span><b>{rows.length}</b></article>
      <article><span>Bekleyen</span><b>{summary.pending}</b></article>
      <article><span>Kabul edilen</span><b>{summary.accepted}</b><small>{Math.max(capacity - summary.accepted, 0)} yer kaldı</small></article>
      <article><span>Kontenjan</span><b>{capacity}</b><div className="capacity-track"><i style={{ width: `${Math.min(capacity ? summary.accepted / capacity * 100 : 0, 100)}%` }}/></div></article>
    </div>
    <div className="application-toolbar">
      <div role="tablist" aria-label="Başvuruları filtrele">
        {[
          ['ALL', 'Tümü', rows.length],
          ['PENDING', 'Bekleyen', summary.pending],
          ['ACCEPTED', 'Kabul edilen', summary.accepted],
          ['WAITLISTED', 'Yedek liste', summary.waitlisted],
        ].map(([key, label, count]) => <button type="button" role="tab" aria-selected={filter === key} className={filter === key ? 'active' : ''} key={String(key)} onClick={() => setFilter(String(key))}>{label} <span>{count}</span></button>)}
      </div>
    </div>
    {rows.length === 0 ? <section className="empty-state"><span className="empty-illustration">＋</span><h2>Henüz başvuru yok</h2><p>Kayıt formundan gönderilen başvurular burada görünecek.</p></section> : shown.length === 0 ? <section className="empty-state compact"><h2>Bu durumda başvuru yok</h2><p>Başka bir filtre seçebilirsiniz.</p></section> : <div className="applications table-wrap"><table><thead><tr><th>Katılımcı adayı</th><th>E-posta</th><th>Durum</th><th>İşlemler</th></tr></thead><tbody>{shown.map(row => {
      const status = row.applicationStatus;
      return <tr key={row.id}><td data-label="Katılımcı adayı"><b>{row.firstName} {row.lastName}</b></td><td data-label="E-posta">{row.email}</td><td data-label="Durum"><span className={`pill ${status === 'ACCEPTED' ? 'published' : ''}`}>{applicationStatusLabel[status] ?? status}</span></td><td data-label="İşlemler" className="action-links">{status !== 'ACCEPTED' && <button className="secondary" disabled={busyId !== null} onClick={() => decide(row.id, 'ACCEPTED')}>{busyId === row.id ? 'Güncelleniyor…' : 'Kabul et'}</button>}{status !== 'WAITLISTED' && <button className="secondary" disabled={busyId !== null} onClick={() => decide(row.id, 'WAITLISTED')}>Yedek listeye al</button>}{status !== 'REJECTED' && <button className="secondary danger-text" disabled={busyId !== null} onClick={() => decide(row.id, 'REJECTED')}>Reddet</button>}</td></tr>;
    })}</tbody></table></div>}
  </section>;
}
