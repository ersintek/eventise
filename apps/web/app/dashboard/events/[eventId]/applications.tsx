'use client';

import { useMemo, useState } from 'react';
import { ActionFeedback, type FeedbackState } from '../../../components/action-feedback';
import { applicationStatusLabel } from '@/lib/product-language';

type Field = { key: string; label: string };
interface Registration { id: string; firstName: string; lastName: string; email: string; applicationStatus: string; answers?: Record<string, unknown> }

function answerText(value: unknown) {
  if (value === true) return 'Evet';
  if (value === false) return 'Hayır';
  if (value === null || value === undefined || value === '') return '—';
  return Array.isArray(value) ? value.join(', ') : String(value);
}

export function Applications({ organizationId, eventId, capacity, initial, fields }: { organizationId: string; eventId: string; capacity: number; initial: Registration[]; fields: Field[] }) {
  const [rows, setRows] = useState(initial);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [view, setView] = useState<'list' | 'table'>('list');
  const [openId, setOpenId] = useState<string | null>(null);
  const [moreId, setMoreId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const summary = useMemo(() => ({
    pending: rows.filter(row => row.applicationStatus === 'SUBMITTED' || row.applicationStatus === 'PENDING').length,
    accepted: rows.filter(row => row.applicationStatus === 'ACCEPTED').length,
    waitlisted: rows.filter(row => row.applicationStatus === 'WAITLISTED').length,
  }), [rows]);
  const shown = useMemo(() => {
    const filtered = filter === 'ALL' ? rows : rows.filter(row => filter === 'PENDING' ? row.applicationStatus === 'SUBMITTED' || row.applicationStatus === 'PENDING' : row.applicationStatus === filter);
    return [...filtered].sort((a, b) => {
      const value = (row: Registration) => sort.key === 'name' ? `${row.firstName} ${row.lastName}` : sort.key === 'status' ? applicationStatusLabel[row.applicationStatus] ?? row.applicationStatus : answerText(row.answers?.[sort.key]);
      const compared = value(a).localeCompare(value(b), 'tr', { numeric: true });
      return sort.direction === 'asc' ? compared : -compared;
    });
  }, [filter, rows, sort]);
  function sortBy(key: string) { setSort(current => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }); }
  function sortLabel(key: string) { return sort.key === key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''; }

  async function decide(id: string, status: string) {
    setBusyId(id); setFeedback(null); setMoreId(null);
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

  async function remove(id: string) {
    if (!confirm('Bu kişi etkinlikten çıkarılacak ve başvurusu tamamen silinecek. Devam edilsin mi?')) return;
    setBusyId(id); setFeedback(null); setMoreId(null);
    try {
      const response = await fetch(`/api/backend/organizations/${organizationId}/registrations/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Kayıt kaldırılamadı.');
      setRows(value => value.filter(row => row.id !== id));
      setOpenId(value => value === id ? null : value);
      setFeedback({ kind: 'success', message: 'Katılımcı etkinlikten çıkarıldı.' });
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Kayıt kaldırılamadı.' });
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
      {fields.length > 0 && <div role="tablist" aria-label="Başvuru görünümü"><button type="button" className={view === 'list' ? 'active' : ''} aria-selected={view === 'list'} onClick={() => setView('list')}>Başvuru listesi</button><button type="button" className={view === 'table' ? 'active' : ''} aria-selected={view === 'table'} onClick={() => setView('table')}>Yanıt tablosu</button></div>}
    </div>
    {rows.length === 0 ? <section className="empty-state"><span className="empty-illustration">＋</span><h2>Henüz başvuru yok</h2><p>Başvuru formundan gönderilen başvurular burada görünecek.</p></section> : shown.length === 0 ? <section className="empty-state compact"><h2>Bu durumda başvuru yok</h2><p>Başka bir filtre seçebilirsiniz.</p></section> : view === 'table' ? <div className="applications answer-table table-wrap"><table><thead><tr><th><button onClick={() => sortBy('name')}>Katılımcı{sortLabel('name')}</button></th><th><button onClick={() => sortBy('status')}>Durum{sortLabel('status')}</button></th>{fields.map(field => <th key={field.key}><button onClick={() => sortBy(field.key)}>{field.label}{sortLabel(field.key)}</button></th>)}</tr></thead><tbody>{shown.map(row => <tr key={row.id}><td><b>{row.firstName} {row.lastName}</b><small>{row.email}</small></td><td><span className={`pill ${row.applicationStatus === 'ACCEPTED' ? 'published' : ''}`}>{applicationStatusLabel[row.applicationStatus] ?? row.applicationStatus}</span></td>{fields.map(field => <td key={field.key}>{answerText(row.answers?.[field.key])}</td>)}</tr>)}</tbody></table></div> : <div className="applications table-wrap"><table><thead><tr><th>Katılımcı adayı</th><th>E-posta</th><th>Durum</th><th>İşlemler</th></tr></thead><tbody>{shown.map(row => {
      const status = row.applicationStatus;
      const open = openId === row.id;
      const moreOpen = moreId === row.id;
      return <><tr key={row.id}><td data-label="Katılımcı adayı"><b>{row.firstName} {row.lastName}</b></td><td data-label="E-posta">{row.email}</td><td data-label="Durum"><span className={`pill ${status === 'ACCEPTED' ? 'published' : ''}`}>{applicationStatusLabel[status] ?? status}</span></td><td data-label="İşlemler" className="action-links"><button className="secondary" onClick={() => setOpenId(open ? null : row.id)} aria-expanded={open}>{open ? 'Yanıtları gizle' : 'Yanıtları gör'}</button>{status !== 'ACCEPTED' && <button className="secondary" disabled={busyId !== null} onClick={() => decide(row.id, 'ACCEPTED')}>{busyId === row.id ? 'Güncelleniyor…' : 'Kabul et'}</button>}<details className="application-more" open={moreOpen} onToggle={event => setMoreId(event.currentTarget.open ? row.id : null)}><summary aria-label={`${row.firstName} ${row.lastName} için diğer işlemler`}>•••</summary><div><button type="button" disabled={busyId !== null || status === 'WAITLISTED'} onClick={() => decide(row.id, 'WAITLISTED')}>Yedek listeye al</button><button type="button" disabled={busyId !== null || status === 'REJECTED'} className="danger-text" onClick={() => decide(row.id, 'REJECTED')}>Reddet</button><button type="button" disabled={busyId !== null} className="danger-text" onClick={() => remove(row.id)}>Etkinlikten Çıkar</button></div></details></td></tr>{open && <tr className="application-answers" key={`${row.id}-answers`}><td colSpan={4}>{fields.length ? <dl>{fields.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{answerText(row.answers?.[field.key])}</dd></div>)}</dl> : <p>Bu başvuru formunda ek soru yok.</p>}</td></tr>}</>;
    })}</tbody></table></div>}
  </section>;
}
