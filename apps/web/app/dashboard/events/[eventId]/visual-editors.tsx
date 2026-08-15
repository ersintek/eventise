'use client';

import { useState } from 'react';

type Faq = { question: string; answer: string };
type Field = { key?: string; label: string; type: string; required?: boolean; options?: string[] };
type FeedbackQ = { label: string; type: string };

function move<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function FaqEditor({ initial, onDirty }: { initial: Faq[]; onDirty?: () => void }) {
  const [items, setItems] = useState<Faq[]>(initial);
  const change = (next: Faq[]) => { setItems(next); onDirty?.(); };
  const update = (index: number, key: keyof Faq, value: string) => change(items.map((row, itemIndex) => itemIndex === index ? { ...row, [key]: value } : row));
  return <fieldset className="visual-editor faq-editor">
    <legend>SSS alanları</legend>
    <input type="hidden" name="faqs" value={JSON.stringify(items)}/>
    {items.length === 0 && <div className="editor-empty"><b>Henüz soru eklenmedi.</b><span>Katılımcıların sık sorduğu ilk soruyu aşağıdan ekleyin.</span></div>}
    <div className="faq-editor-list">{items.map((item, index) => <article className="faq-row" key={index}>
      <div className="faq-row-heading"><span>{index + 1}</span><b>Soru {index + 1}</b><div><button type="button" disabled={index === 0} onClick={() => change(move(items, index, index - 1))} aria-label="Soruyu yukarı taşı">↑</button><button type="button" disabled={index === items.length - 1} onClick={() => change(move(items, index, index + 1))} aria-label="Soruyu aşağı taşı">↓</button></div></div>
      <div className="faq-row-fields"><label>Soru<input value={item.question} onChange={event => update(index, 'question', event.target.value)} placeholder="Örn. Katılım ücretsiz mi?"/></label><label>Yanıt<textarea value={item.answer} onChange={event => update(index, 'answer', event.target.value)} placeholder="Kısa ve açık bir yanıt yazın."/></label></div>
      <button type="button" className="remove-button" onClick={() => change(items.filter((_, itemIndex) => itemIndex !== index))}>Soruyu kaldır</button>
    </article>)}</div>
    <button type="button" className="secondary add-row" onClick={() => change([...items, { question: '', answer: '' }])}>＋ Soru ekle</button>
  </fieldset>;
}

function newFieldKey() {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `custom_${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
}

export function FormFieldEditor({ initial = [], startIndex = 1, onDirty }: { initial?: Field[]; startIndex?: number; onDirty?: () => void }) {
  const [items, setItems] = useState<Field[]>(initial);
  const change = (next: Field[]) => { setItems(next); onDirty?.(); };
  const update = (index: number, values: Partial<Field>) => change(items.map((row, itemIndex) => itemIndex === index ? { ...row, ...values } : row));
  return <fieldset className="visual-editor form-field-editor">
    <legend>Ek sorular</legend>
    <p className="editor-guidance">Yalnızca etkinlik için gerçekten gerekli bilgileri sorun.</p>
    <input type="hidden" name="fields" value={JSON.stringify(items)}/>
    {items.length === 0 && <div className="editor-empty"><b>Henüz ek soru yok.</b><span>Form şu anda ad, soyad ve e-posta alanlarından oluşuyor.</span></div>}
    <div className="field-editor-list">{items.map((item, index) => <article className="field-row" key={item.key ?? index}>
      <span>{startIndex + index}</span>
      <div className="field-main"><label>Soru<input aria-label="Soru metni" value={item.label} onChange={event => update(index, { label: event.target.value })} placeholder="Örn. Hangi şehirden katılıyorsunuz?"/></label>{item.type === 'select' && <label>Seçenekler<input value={(item.options ?? []).join(', ')} onChange={event => update(index, { options: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} placeholder="Ankara, İstanbul, İzmir"/><small>Seçenekleri virgülle ayırın.</small></label>}</div>
      <label>Yanıt türü<select aria-label="Yanıt türü" value={item.type} onChange={event => update(index, { type: event.target.value, options: event.target.value === 'select' ? item.options ?? [] : undefined })}><option value="text">Kısa yanıt</option><option value="textarea">Uzun yanıt</option><option value="select">Seçim listesi</option><option value="phone">Telefon</option><option value="number">Sayı</option><option value="checkbox">Onay kutusu</option></select></label>
      <label className="required-check"><input type="checkbox" checked={Boolean(item.required)} onChange={event => update(index, { required: event.target.checked })}/> Zorunlu</label>
      <div className="field-row-actions"><button type="button" disabled={index === 0} onClick={() => change(move(items, index, index - 1))} aria-label="Soruyu yukarı taşı">↑</button><button type="button" disabled={index === items.length - 1} onClick={() => change(move(items, index, index + 1))} aria-label="Soruyu aşağı taşı">↓</button><button type="button" className="remove-button" onClick={() => change(items.filter((_, itemIndex) => itemIndex !== index))}>Kaldır</button></div>
    </article>)}</div>
    <button type="button" className="secondary add-row" onClick={() => change([...items, { key: newFieldKey(), label: '', type: 'text', required: false, options: [] }])}>＋ Soru ekle</button>
  </fieldset>;
}

const defaultFeedbackTemplate: FeedbackQ[] = [
  { label: 'Etkinlik içeriği ne kadar faydalıydı?', type: 'number' },
  { label: 'Sunumlar anlaşılır mıydı?', type: 'number' },
  { label: 'Öğrendiklerinizi günlük işlerinizde kullanabilecek misiniz?', type: 'number' },
  { label: 'Etkinlik sonrası en çok neyi öğrendiniz?', type: 'text' },
  { label: 'Mekân ve teknik altyapı yeterli miydi?', type: 'number' },
  { label: 'Etkinlik organizasyonu nasıldı?', type: 'number' },
  { label: 'Gelecekteki etkinlikler için öneriniz:', type: 'textarea' },
];

export function FeedbackEditor() {
  const [items, setItems] = useState<FeedbackQ[]>(defaultFeedbackTemplate);
  const update = (index: number, values: Partial<FeedbackQ>) => setItems(rows => rows.map((row, itemIndex) => itemIndex === index ? { ...row, ...values } : row));
  return <fieldset className="visual-editor"><legend>Geri bildirim soruları</legend><p>Hazır soruları düzenleyebilir veya yeni soru ekleyebilirsiniz.</p><input type="hidden" name="questions" value={JSON.stringify(items)}/>{items.length === 0 && <div className="editor-empty">Henüz soru yok.</div>}{items.map((item, index) => <div className="field-row" key={index}><span>{index + 1}</span><input aria-label="Soru metni" value={item.label} onChange={event => update(index, { label: event.target.value })} placeholder="Soru metni"/><select aria-label="Yanıt türü" value={item.type} onChange={event => update(index, { type: event.target.value })}><option value="number">Puan (1-5)</option><option value="text">Kısa yanıt</option><option value="textarea">Uzun yanıt</option></select><button type="button" className="remove-button" onClick={() => setItems(rows => rows.filter((_, itemIndex) => itemIndex !== index))}>Kaldır</button></div>)}<button type="button" className="secondary add-row" onClick={() => setItems(rows => [...rows, { label: '', type: 'number' }])}>＋ Soru ekle</button></fieldset>;
}
