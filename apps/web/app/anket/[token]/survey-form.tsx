'use client';

import { useState } from 'react';

type Survey = {
  title: string;
  questions: Array<{ id: string; label: string; required?: boolean }>;
  email: string;
  name: string;
  eventTitle: string;
  organizationName: string;
  isTest: boolean;
};

export function SurveyForm({ token, survey }: { token: string; survey: Survey }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = new FormData(event.currentTarget);
    const answers = Object.fromEntries(survey.questions.map(question => [question.id, values.get(question.id)]));
    try {
      const response = await fetch(`/api/public/surveys/${token}/responses`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message ?? 'Yanıt gönderilemedi.');
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Yanıt gönderilemedi.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="center-shell"><section className="onboarding-card">
    <div className="logo dark"><b>e</b>eventise</div>
    <p className="eyebrow">{survey.isTest ? 'TEST E-POSTASI' : 'BEKLENTİ ANKETİ'}</p>
    <h1>{survey.title}</h1>
    <p>{survey.eventTitle} · {survey.organizationName}</p>
    {survey.isTest && <p className="friendly-status">Bu test bağlantısının yanıtı gerçek anket sonuçlarına eklenmez.</p>}
    {done ? <div className="friendly-status"><b>Teşekkürler.</b><p>Yanıtınız kaydedildi. Önceki yanıtlar güvenlik nedeniyle gösterilmez.</p><button className="secondary" type="button" onClick={() => setDone(false)}>Yanıtımı yeniden gönder</button></div> : <form onSubmit={submit}>
      <label>E-posta adresiniz<input value={survey.email} readOnly aria-readonly="true" /></label>
      {survey.questions.map(question => <label key={question.id}>{question.label}<textarea name={question.id} rows={4} /></label>)}
      {error && <p className="error">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? 'Gönderiliyor…' : 'Yanıtlarımı gönder'}</button>
    </form>}
  </section></main>;
}
