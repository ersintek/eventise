'use client';
import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

export function MarkdownEditor({ value, onChange, placeholder, rows = 5 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const wrap = (before: string, after: string = before) => {
    const el = ref.current; if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = start + before.length; el.selectionEnd = end + before.length; });
  };
  const insertLine = (prefix: string) => {
    const el = ref.current; if (!el) return;
    const start = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(newValue);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + prefix.length; });
  };
  return <div className="md-editor">
    <div className="md-toolbar">
      <button type="button" title="Kalın" onClick={() => wrap('**')}>B</button>
      <button type="button" title="İtalik" onClick={() => wrap('*')}><i>I</i></button>
      <button type="button" title="Başlık" onClick={() => insertLine('## ')}>H</button>
      <button type="button" title="Madde" onClick={() => insertLine('- ')}>•</button>
      <button type="button" title="Bağlantı" onClick={() => wrap('[', '](https://)')}>🔗</button>
      <button type="button" className={showPreview?'active':''} onClick={() => setShowPreview(!showPreview)}>{showPreview?'Düzenle':'Önizle'}</button>
    </div>
    {showPreview
      ? <div className="md-preview prose">{value
        ? <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{String(value)}</ReactMarkdown>
        : <span style={{color:'var(--muted-light)'}}>Önizleme burada görünür…</span>}</div>
      : <textarea ref={ref} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}/>
    }
  </div>;
}
