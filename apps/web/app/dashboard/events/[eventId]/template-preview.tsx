'use client';
import { useEffect, useRef, useState } from 'react';

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

const VARIABLE_LABELS: Record<string, string> = {
  'participant.first_name': 'Katılımcının adı',
  'participant.full_name': 'Adı ve soyadı',
  'organization.name': 'Kurum adı',
  'event.name': 'Etkinlik adı',
  'event.start_date': 'Etkinlik tarihi',
  'event.start_datetime': 'Tarih ve saat',
  'event.start_time': 'Başlangıç saati',
  'event.end_date': 'Bitiş tarihi',
  'event.end_time': 'Bitiş saati',
  'event.location': 'Etkinlik yeri',
  'event.public_url': 'Etkinlik bağlantısı',
  'event.participant_url': 'Katılımcı alanı',
  'certificate.url': 'Sertifika bağlantısı',
};

const COMMON_VARS = Object.keys(VARIABLE_LABELS);

function renderPreview(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
    .replace(/{{\s*([a-z_]+\.[a-z_]+)\s*}}/g, (_, key) => SAMPLE_VARS[key] ?? `{{${key}}}`);
}

export function TemplateForm({ label, description, automatic, initialSubject, initialBody, onSave }: {
  label: string;
  description: string;
  automatic: boolean;
  initialSubject: string;
  initialBody: string;
  onSave: (subject: string, body: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showVariables, setShowVariables] = useState(false);

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
    setBusy(true); setSaved(false); setError('');
    try { await onSave(subject, body); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Şablon kaydedilemedi.'); }
    finally { setBusy(false); }
  };

  return (
    <form className="template-form" onSubmit={save}>
      <div className="template-form-heading">
        <div><span className={automatic ? 'template-kind automatic' : 'template-kind scheduled'}>{automatic ? 'Otomatik gönderilir' : 'Planlanarak gönderilir'}</span><h3>{label}</h3><p>{description}</p></div>
      </div>
      <div className="template-edit-grid">
        <div className="template-fields">
          <label>E-posta konusu
            <input value={subject} onChange={e => setSubject(e.target.value)} required/>
          </label>
          <label>Mesaj
            <textarea ref={bodyRef} value={body} onChange={e => setBody(e.target.value)} required rows={9}/>
          </label>
          <button type="button" className="variable-toggle" onClick={() => setShowVariables(value => !value)}>
            {showVariables ? 'Kişiselleştirme alanlarını gizle' : '+ Kişiselleştirme alanı ekle'}
          </button>
          {showVariables && <div className="var-chips" aria-label="Kişiselleştirme alanları">
            {COMMON_VARS.map(v => (
              <button type="button" key={v} className="var-chip" onClick={() => insertVar(v)} title={`{{${v}}}`}>{VARIABLE_LABELS[v]}</button>
            ))}
          </div>}
        </div>
        <div className="email-preview" aria-label="E-posta önizlemesi">
          <div className="email-preview-bar"><span/><span/><span/><small>Önizleme</small></div>
          <div className="email-preview-content">
            <small>KONU</small>
            <h4 dangerouslySetInnerHTML={{ __html: renderPreview(subject) }} />
            <div className="email-preview-brand"><b>e</b>eventise</div>
            <p dangerouslySetInnerHTML={{ __html: renderPreview(body) }} />
            <footer>Bu e-posta {SAMPLE_VARS['organization.name']} tarafından Eventise üzerinden gönderilir.</footer>
          </div>
        </div>
      </div>
      <div className="template-actions">
        <span>{error && <small className="error">{error}</small>}</span>
        <button className="primary" disabled={busy||subject===initialSubject&&body===initialBody}>{busy ? 'Kaydediliyor…' : saved ? '✓ Kaydedildi' : 'Değişiklikleri kaydet'}</button>
      </div>
    </form>
  );
}

type ReminderTemplate = { id: string; subject: string; body: string; key: string };

export function ReminderComposer({ templates, recipientCount, eventTitle, onSchedule }: {
  templates: ReminderTemplate[];
  recipientCount: number;
  eventTitle: string;
  onSchedule: (templateId: string, sendAt: string, subject: string, body: string) => Promise<boolean>;
}) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const selected = templates.find(template => template.id === templateId) ?? templates[0];
  const [subject, setSubject] = useState(selected?.subject ?? '');
  const [body, setBody] = useState(selected?.body ?? '');
  const [sendAt, setSendAt] = useState('');
  const [showVariables, setShowVariables] = useState(false);
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSubject(selected?.subject ?? '');
    setBody(selected?.body ?? '');
  }, [selected?.id, selected?.subject, selected?.body]);

  const insertVar = (variable: string) => {
    const el = bodyRef.current;
    const insert = `{{${variable}}}`;
    if (!el) return setBody(value => `${value}${insert}`);
    const next = body.slice(0, el.selectionStart) + insert + body.slice(el.selectionEnd);
    const cursor = el.selectionStart + insert.length;
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = cursor;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (await onSchedule(templateId, sendAt, subject, body)) setSendAt('');
    } finally {
      setBusy(false);
    }
  };

  if (!templates.length) return <div className="hint-box">Hatırlatma şablonu bulunamadı. Önce Şablonlar bölümünden bir hatırlatma metni oluşturun.</div>;

  return <form className="reminder-composer" onSubmit={submit}>
    <div className="reminder-composer-head">
      <div><p className="eyebrow">YENİ HATIRLATMA</p><h2>Mesajı hazırlayın ve planlayın</h2><p>Seçtiğiniz şablonu bu gönderim için gözden geçirin. Değişiklikler şablona da kaydedilir.</p></div>
      <div className="recipient-summary"><b>{recipientCount}</b><span>kabul edilen katılımcı</span></div>
    </div>
    <div className="reminder-compose-grid">
      <div className="template-fields">
        <label>Hatırlatma şablonu<select value={templateId} onChange={event => setTemplateId(event.target.value)}>{templates.map(template => <option value={template.id} key={template.id}>{template.subject}</option>)}</select></label>
        <label>E-posta konusu<input value={subject} onChange={event => setSubject(event.target.value)} required /></label>
        <label>Mesaj<textarea ref={bodyRef} value={body} onChange={event => setBody(event.target.value)} required rows={10} /></label>
        <button type="button" className="variable-toggle" onClick={() => setShowVariables(value => !value)}>{showVariables ? 'Kişiselleştirme alanlarını gizle' : '+ Kişiselleştirme alanı ekle'}</button>
        {showVariables && <div className="var-chips">{COMMON_VARS.map(variable => <button type="button" key={variable} className="var-chip" onClick={() => insertVar(variable)} title={`{{${variable}}}`}>{VARIABLE_LABELS[variable]}</button>)}</div>}
      </div>
      <div className="reminder-preview-column">
        <div className="email-preview" aria-label="Hatırlatma e-posta ön izlemesi">
          <div className="email-preview-bar"><span/><span/><span/><small>Canlı ön izleme</small></div>
          <div className="email-preview-content"><small>KONU</small><h4 dangerouslySetInnerHTML={{ __html: renderPreview(subject) }} /><div className="email-preview-brand"><b>e</b>eventise</div><p dangerouslySetInnerHTML={{ __html: renderPreview(body) }} /><footer>Bu e-posta {SAMPLE_VARS['organization.name']} tarafından Eventise üzerinden gönderilir.</footer></div>
        </div>
        <div className="schedule-panel">
          <div><span>Etkinlik</span><b>{eventTitle}</b></div>
          <label>Gönderim tarihi ve saati<input type="datetime-local" value={sendAt} onChange={event => setSendAt(event.target.value)} required /></label>
          <p>{recipientCount > 0 ? `${recipientCount} kabul edilen katılımcıya gönderilecek.` : 'Henüz kabul edilen katılımcı yok. Gönderim anındaki kabul edilen katılımcılar hedeflenir.'}</p>
          <button className="primary" disabled={busy || !templateId || !sendAt}>{busy ? 'Planlanıyor…' : 'Hatırlatmayı planla'}</button>
        </div>
      </div>
    </div>
  </form>;
}
