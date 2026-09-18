'use client';

import { FormEvent, useState } from 'react';
import { TestComparison } from '../modules/test-comparison';

type Summary = { registrations: number; accepted: number; checkedIn: number; attendanceRate: number; feedbackSubmissions: number };
type Comparison = { pre: { submissions: number; average: number | null }; post: { submissions: number; average: number | null }; improvement: number | null };

export function PostEventManager({ organizationId, eventId, initialSummary, comparison }: { organizationId: string; eventId: string; initialSummary: Summary; comparison: Comparison }) {
  const [message, setMessage] = useState('');
  const [reportingFormat, setReportingFormat] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  async function call(path: string, method = 'POST', body?: object) {
    const response = await fetch(`/api/backend/${path}`, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'İşlem tamamlanamadı.');
    return data;
  }

  async function report(format: string) {
    setReportingFormat(format); setMessage('');
    try {
      const created = await call(`organizations/${organizationId}/events/${eventId}/reports/${format}`);
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const status = await call(`organizations/${organizationId}/reports/${created.id}`, 'GET');
        if (status.status === 'READY') {
          window.location.assign(status.downloadUrl);
          setMessage(`${format.toUpperCase()} raporu hazırlandı.`);
          return;
        }
        if (status.status === 'FAILED') throw new Error(`Rapor hazırlanamadı${status.lastError ? `: ${status.lastError}` : '.'}`);
      }
      setMessage('Rapor hazırlanıyor. Biraz sonra yeniden deneyebilirsiniz.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Rapor hazırlanamadı.');
    } finally { setReportingFormat(null); }
  }

  async function copyEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCopying(true); setMessage('');
    try {
      const form = new FormData(event.currentTarget);
      await call(`organizations/${organizationId}/events/${eventId}/copy`, 'POST', {
        title: form.get('title'),
        slug: form.get('slug'),
        startsAt: new Date(String(form.get('startsAt'))).toISOString(),
        endsAt: new Date(String(form.get('endsAt'))).toISOString(),
      });
      setMessage('Taslak etkinlik kopyası oluşturuldu.');
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Etkinlik kopyalanamadı.');
    } finally { setCopying(false); }
  }

  return <section className="post-event-workspace">
    <div className="metric-grid field-metrics">
      <article><span>Başvuru</span><b>{initialSummary.registrations}</b></article>
      <article><span>Kabul edilen</span><b>{initialSummary.accepted}</b></article>
      <article><span>Katılım teyidi</span><b>{initialSummary.checkedIn}</b></article>
      <article><span>Katılım oranı</span><b>%{initialSummary.attendanceRate}</b></article>
    </div>
    <section className="module-grid">
      <article className="workspace-card">
        <div className="section-intro"><h2>Raporlar</h2><p>Başvuru ve katılım özetini indirin.</p></div>
        {['csv', 'xlsx', 'pdf'].map(format => <button key={format} disabled={reportingFormat !== null} onClick={() => report(format)} className="secondary">{reportingFormat === format ? `${format.toUpperCase()} hazırlanıyor…` : format === 'csv' ? 'CSV — liste için' : format === 'xlsx' ? 'Excel — tablo için' : 'PDF — özet için'}</button>)}
      </article>
      <article className="workspace-card">
        <div className="section-intro"><h2>Geri bildirim özeti</h2><p>Katılımcılardan gelen {initialSummary.feedbackSubmissions} yanıtı, Geri Bildirim bölümünden yönetin.</p></div>
        <a className="secondary link-button" href="?tab=feedback">Geri bildirimi aç</a>
      </article>
    </section>
    <TestComparison comparison={comparison}/>
    <form className="workspace-card event-copy-card" onSubmit={copyEvent}>
      <div className="section-intro"><h2>Etkinliği kopyala</h2><p>Bu etkinliğin ayarlarından yeni bir taslak oluşturun.</p></div>
      <label>Yeni etkinlik adı<input name="title" required placeholder="Örn. 2027 Bahar Buluşması" /></label>
      <label>Sayfa adresi<input name="slug" pattern="[a-z0-9-]+" required placeholder="2027-bahar-bulusmasi" /></label>
      <div className="two"><label>Başlangıç<input name="startsAt" type="datetime-local" required /></label><label>Bitiş<input name="endsAt" type="datetime-local" required /></label></div>
      <button className="primary" disabled={copying}>{copying ? 'Kopyalanıyor…' : 'Taslak kopya oluştur'}</button>
    </form>
    {message && <p className="notice" role="status">{message}</p>}
  </section>;
}
