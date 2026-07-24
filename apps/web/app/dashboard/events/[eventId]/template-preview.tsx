'use client';
import { useRef, useState, useEffect } from 'react';

// E-posta şablonu için canlı önizleme + değişken ekleme çipleri.
// Örnek bir katılımcıyla render eder, böylece STK sonucu düzenlerken görür.

const SAMPLE_VARS: Record<string, string> = {
  'participant.first_name': 'Ayşe',
  'participant.full_name': 'Ayşe Yılmaz',
  'organization.name': 'SICI',
  'event.name': 'Gençlik ve İklim Buluşması',
  'event.start_date': '21 Temmuz 2026',
  'event.start_datetime': '21 Temmuz 2026, 14:00',
  'event.start_time': '14:00',
  'event.end_date': '21 Temmuz 2026',
  'event.end_time': '18:00',
  'event.location': 'Kadıköy Kültür Merkezi',
  'event.public_url': 'https://eventise.sici.dev/events/sici/genclik-iklim',
  'event.participant_url': 'https://eventise.sici.dev/participant',
  'certificate.url': 'https://eventise.sici.dev/certificates/ornek-kod',
};

const COMMON_VARS = [
  'participant.first_name',
  'participant.full_name',
  'event.name',
  'event.start_date',
  'event.start_datetime',
  'event.location',
  'event.public_url',
];

function renderPreview(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
    .replace(/{{\s*([a-z_]+\.[a-z_]+)\s*}}/g, (_, key) => SAMPLE_VARS[key] ?? `{{${key}}}`);
}

export function TemplateForm({ id, initialSubject, initialBody, onSave }: {
  id: string;
  initialSubject: string;
  initialBody: string;
  onSave: (subject: string, body: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // parent form submit etse bile state senkron kalsın
  useEffect(() => { setSubject(initialSubject); setBody(initialBody); }, [initialSubject, initialBody]);

  const insertVar = (variable: string) => {
    const el = bodyRef.current; if (!el) { setBody(b => `${b}{{${variable}}}`); return; }
    const start = el.selectionStart, end = el.selectionEnd;
    const insert = `{{${variable}}}`;
    const next = body.slice(0, start) + insert + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + insert.length; });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setSaved(false);
    try { await onSave(subject, body); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    finally { setBusy(false); }
  };

  return (
    <form className="template-form" onSubmit={save}>
      <b>{id}</b>
      <label>Konu
        <input value={subject} onChange={e => setSubject(e.target.value)} required/>
      </label>
      <label>İçerik
        <textarea ref={bodyRef} value={body} onChange={e => setBody(e.target.value)} required rows={6}/>
      </label>
      <div className="var-chips">
        <small>Değişken ekle:</small>
        {COMMON_VARS.map(v => (
          <button type="button" key={v} className="var-chip" onClick={() => insertVar(v)} title={`{{{${v}}}}`}>{v}</button>
        ))}
      </div>
      <details className="template-preview-details">
        <summary>👁 Canlı önizleme</summary>
        <div className="template-preview-box">
          <b dangerouslySetInnerHTML={{ __html: renderPreview(subject) }} />
          <p dangerouslySetInnerHTML={{ __html: renderPreview(body) }} />
        </div>
      </details>
      <button className="secondary" disabled={busy}>{busy ? 'Kaydediliyor…' : saved ? '✓ Kaydedildi' : 'Şablonu kaydet'}</button>
    </form>
  );
}
