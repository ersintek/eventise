'use client';
import { useState } from 'react';

type QType = 'text' | 'single' | 'multiple';
type Q = { id: string; type: QType; label: string; correctAnswer?: string | string[]; options?: string[] };

export function AssessmentEditor() {
  const [items, setItems] = useState<Q[]>([{ id: 'q1', type: 'text', label: '' }]);
  const uid = () => `q${Date.now()}`;
  const upd = (i: number, v: Partial<Q>) => setItems(r => r.map((q, idx) => idx === i ? { ...q, ...v } : q));

  return (
    <fieldset className="visual-editor">
      <legend>Test soruları</legend>
      <input type="hidden" name="questions" value={JSON.stringify(items.filter(q => q.label.trim()))} />
      {items.map((q, i) => (
        <div key={i} className="question-card">
          <div className="question-header">
            <span>Soru {i + 1}</span>
            <select value={q.type} onChange={e => upd(i, { type: e.target.value as QType })}>
              <option value="text">Açık yanıt</option>
              <option value="single">Çoktan seçmeli (tek)</option>
              <option value="multiple">Çoktan seçmeli (çoklu)</option>
            </select>
            {items.length > 1 && <button type="button" className="remove-button" onClick={() => setItems(r => r.filter((_, idx) => idx !== i))}>Sil</button>}
          </div>
          <input value={q.label} onChange={e => upd(i, { label: e.target.value })} placeholder="Soru metni" className="question-input" />
          {q.type !== 'text' && (
            <div className="options-editor">
              {(q.options ?? ['', '']).map((opt, oi) => (
                <div key={oi} className="option-row">
                  <input value={opt} onChange={e => { const opts = [...(q.options ?? ['', ''])]; opts[oi] = e.target.value; upd(i, { options: opts }); }} placeholder={`Seçenek ${oi + 1}`} />
                  <button type="button" className="remove-button" onClick={() => { const opts = (q.options ?? []).filter((_, idx) => idx !== oi); upd(i, { options: opts.length ? opts : undefined }); }}>×</button>
                </div>
              ))}
              <button type="button" className="secondary" onClick={() => upd(i, { options: [...(q.options ?? ['', '']), ''] })}>+ Seçenek</button>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="secondary add-row" onClick={() => setItems(r => [...r, { id: uid(), type: 'text', label: '' }])}>+ Soru ekle</button>
    </fieldset>
  );
}
