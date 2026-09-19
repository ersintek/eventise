'use client';

import { useState } from 'react';
import type { ReportData } from './page';

const statusLabel: Record<string, string> = { SUBMITTED: 'Başvuruda', PENDING: 'Başvuruda', ACCEPTED: 'Onaylandı', WAITLISTED: 'Yedekte', REJECTED: 'Reddedildi' };

export function ApplicationsReport({ organizationId, eventId, eventTitle, initial }: { organizationId: string; eventId: string; eventTitle: string; initial: ReportData }) {
  const [exportState, setExportState] = useState<'idle' | 'creating' | 'ready' | 'failed'>('idle');
  const [message, setMessage] = useState('');

  async function downloadXlsx() {
    setExportState('creating');
    setMessage('Excel dosyanız hazırlanıyor…');
    try {
      const create = await fetch(`/api/backend/organizations/${organizationId}/events/${eventId}/reports/xlsx`, { method: 'POST' });
      const report = await create.json();
      if (!create.ok) throw new Error(report.message ?? 'Rapor hazırlanamadı.');
      for (let attempt = 0; attempt < 20; attempt++) {
        const response = await fetch(`/api/backend/organizations/${organizationId}/reports/${report.id}`);
        const current = await response.json();
        if (!response.ok) throw new Error(current.message ?? 'Rapor durumu alınamadı.');
        if (current.status === 'READY' && current.downloadUrl) {
          window.location.assign(current.downloadUrl);
          setExportState('ready');
          setMessage('Excel dosyası indiriliyor.');
          return;
        }
        if (current.status === 'FAILED') throw new Error(current.lastError ?? 'Rapor hazırlanamadı.');
        await new Promise(resolve => window.setTimeout(resolve, 750));
      }
      throw new Error('Rapor hazırlanıyor. Lütfen kısa süre sonra yeniden deneyin.');
    } catch (error) {
      setExportState('failed');
      setMessage(error instanceof Error ? error.message : 'Rapor hazırlanamadı.');
    }
  }

  return <section className="application-report">
    <div className="application-report-summary">
      <article><span>Toplam başvuru</span><b>{initial.totalRegistrations}</b></article>
      {initial.byStatus.filter(item => item.count > 0).map(item => <article key={item.status}><span>{statusLabel[item.status] ?? item.status}</span><b>{item.count}</b></article>)}
    </div>

    <section className="report-export workspace-card">
      <div><p className="eyebrow">DIŞARI AKTAR</p><h2>Toplu başvuru listesi</h2><p>{eventTitle} için kişi bilgileri, başvuru durumu ve form yanıtlarını Excel olarak indirin.</p></div>
      <button className="primary" disabled={exportState === 'creating'} onClick={downloadXlsx}>{exportState === 'creating' ? 'Hazırlanıyor…' : 'Excel’e aktar'}</button>
      {message && <small className={exportState === 'failed' ? 'report-error' : ''}>{message}</small>}
    </section>

    <section className="report-questions">
      <div className="section-intro"><p className="eyebrow">FORM YANITLARI</p><h2>Yanıt dağılımı</h2><p>Seçenekli sorularda yanıtların dağılımını, açık uçlu sorularda ise yanıt sayısını görün.</p></div>
      {initial.questions.length === 0 ? <section className="empty-state compact"><h2>Ek başvuru sorusu yok</h2><p>Başvuru Formu’na soru eklediğinizde yanıt dağılımları burada görünür.</p></section> : <div className="report-question-grid">
        {initial.questions.map(question => {
          const max = Math.max(1, ...question.choices.map(choice => choice.count));
          return <article className="workspace-card report-question" key={question.key}>
            <h3>{question.label}</h3>
            {question.kind === 'open'
              ? <p className="open-answer-count"><b>{question.responseCount}</b> yanıt</p>
              : <div className="choice-distribution">{question.choices.map(choice => <div key={choice.label}><div><span>{choice.label}</span><b>{choice.count}</b></div><i><em style={{ width: `${choice.count / max * 100}%` }}/></i></div>)}</div>}
            <small>{question.kind === 'choice' ? `${question.responseCount} kişi bu soruyu yanıtladı.` : 'Açık uçlu yanıtların içeriği Başvurular listesinden incelenebilir.'}</small>
          </article>;
        })}
      </div>}
    </section>
  </section>;
}
