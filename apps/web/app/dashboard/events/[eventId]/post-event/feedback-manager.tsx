'use client';

import { FormEvent, useState } from 'react';
import { FeedbackEditor } from '../visual-editors';

type Feedback = { id: string; title: string; open: boolean; _count: { submissions: number } };

export function FeedbackManager({ organizationId, eventId, initialFeedback, initialFeatureEnabled }: { organizationId: string; eventId: string; initialFeedback: Feedback[]; initialFeatureEnabled: boolean }) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [featureEnabled, setFeatureEnabled] = useState(initialFeatureEnabled);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function request(path: string, method = 'POST', body?: object) {
    const response = await fetch(`/api/backend/${path}`, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'İşlem tamamlanamadı.');
    return data;
  }

  async function createFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const form = new FormData(event.currentTarget);
      const questions = JSON.parse(String(form.get('questions') || '[]')).filter((question: { label?: string }) => question.label?.trim());
      if (!questions.length) throw new Error('En az bir soru ekleyin.');
      const created = await request(`organizations/${organizationId}/events/${eventId}/feedback`, 'POST', { title: form.get('title'), schema: { questions: questions.map((question: { type: string; label: string }, index: number) => ({ id: `q${index + 1}`, type: question.type, label: question.label })) } });
      await request(`organizations/${organizationId}/feedback/${created.id}/open`, 'PATCH', { open: true });
      setFeedback(current => [{ ...created, open: true, _count: { submissions: 0 } }, ...current]);
      setMessage('Geri bildirim formu oluşturuldu ve katılımcılara açıldı.');
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Geri bildirim formu oluşturulamadı.');
    } finally { setBusy(false); }
  }

  async function toggleFeature() {
    setBusy(true); setMessage('');
    try {
      const enabled = !featureEnabled;
      await request(`organizations/${organizationId}/events/${eventId}/features/feedback`, 'PUT', { enabled, config: {} });
      setFeatureEnabled(enabled);
      setMessage(`Geri Bildirim ${enabled ? 'açıldı' : 'kapatıldı'}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Geri Bildirim ayarı güncellenemedi.');
    } finally { setBusy(false); }
  }

  return <section className="feedback-workspace">
    <section className="workspace-card tool-availability"><div className="section-intro"><p className="eyebrow">GERİ BİLDİRİM</p><h2>Katılımcılara açık geri bildirim</h2><p>Formu hazırladıktan sonra katılımcıların görmesi için açın. Kapatmak için aynı düğmeye tıklayın.</p></div><div className="feature-switches"><button type="button" className={featureEnabled ? 'feature-on' : 'feature-off'} disabled={busy} onClick={toggleFeature}>Geri Bildirim: {featureEnabled ? 'Açık' : 'Kapalı'}</button></div></section>
    <form className="workspace-card" onSubmit={createFeedback}>
      <div className="section-intro"><h2>Geri bildirim formu oluştur</h2><p>Etkinlik deneyimini değerlendirmek için katılımcılara sorular hazırlayın. Form oluşturulduğunda katılımcı alanında görünür.</p></div>
      <label>Form başlığı<input name="title" defaultValue="Etkinlik geri bildirimi" required /></label>
      <FeedbackEditor />
      <button className="primary" disabled={busy}>{busy ? 'Oluşturuluyor…' : 'Formu oluştur ve aç'}</button>
    </form>
    {message && <p className="notice" role="status">{message}</p>}
    <section className="feedback-list" aria-label="Geri bildirim formları">
      {feedback.length === 0 ? <div className="hint-box">Henüz geri bildirim formu yok. Katılımcıların deneyimini toplamak için ilk formunuzu oluşturun.</div> : feedback.map(item => <article className="workspace-card" key={item.id}><div className="assessment-header"><h3>{item.title}</h3><span className={`pill ${item.open ? 'published' : ''}`}>{item.open ? 'Açık' : 'Kapalı'}</span></div><p>{item._count.submissions} yanıt alındı.</p></article>)}
    </section>
  </section>;
}
