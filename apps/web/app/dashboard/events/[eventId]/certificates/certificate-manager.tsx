'use client';
import { FormEvent, useMemo, useRef, useState } from 'react';

type Template = { id: string; name: string; bodyTemplate: string; primaryColor?: string | null; signatureLabel?: string | null; includeQr: boolean; orientation: string; backgroundAssetId?: string | null; _count?: { certificates: number } };
const DEFAULT_BODY = '{{participant.full_name}}, {{event.name}} etkinliğine katılmıştır.';
const variables = [
  ['{{participant.full_name}}', 'Katılımcı adı'],
  ['{{event.name}}', 'Etkinlik adı'],
  ['{{event.start_date}}', 'Etkinlik tarihi'],
  ['{{organization.name}}', 'Kurum adı'],
];

export function CertificateManager({ organizationId, organizationName, eventId, eventName, eventDate, eligibleCount, initialTemplates }: { organizationId: string; organizationName: string; eventId: string; eventName: string; eventDate: string; eligibleCount: number; initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id ?? '');
  const selected = templates.find(item => item.id === selectedId);
  const [name, setName] = useState(selected?.name ?? 'Katılım Sertifikası');
  const [body, setBody] = useState(selected?.bodyTemplate ?? DEFAULT_BODY);
  const [color, setColor] = useState(selected?.primaryColor ?? '#1d4ed8');
  const [signature, setSignature] = useState(selected?.signatureLabel ?? '');
  const [includeQr, setIncludeQr] = useState(selected?.includeQr ?? true);
  const [orientation, setOrientation] = useState(selected?.orientation ?? 'LANDSCAPE');
  const [backgroundAssetId, setBackgroundAssetId] = useState<string | null>(selected?.backgroundAssetId ?? null);
  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const previewBody = useMemo(() => body
    .replaceAll('{{participant.full_name}}', 'Ayşe Yılmaz')
    .replaceAll('{{event.name}}', eventName)
    .replaceAll('{{event.start_date}}', new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(eventDate)))
    .replaceAll('{{organization.name}}', organizationName), [body, eventDate, eventName, organizationName]);

  async function call(path: string, method = 'POST', payload?: object) {
    const response = await fetch(`/api/backend/${path}`, { method, headers: { 'content-type': 'application/json' }, body: payload ? JSON.stringify(payload) : undefined });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'İşlem tamamlanamadı.');
    return data;
  }
  function loadTemplate(id: string) {
    setSelectedId(id);
    const item = templates.find(template => template.id === id);
    if (!item) { setName('Katılım Sertifikası'); setBody(DEFAULT_BODY); setColor('#1d4ed8'); setSignature(''); setIncludeQr(true); setOrientation('LANDSCAPE'); setBackgroundAssetId(null); return; }
    setName(item.name); setBody(item.bodyTemplate); setColor(item.primaryColor ?? '#1d4ed8'); setSignature(item.signatureLabel ?? ''); setIncludeQr(item.includeQr); setOrientation(item.orientation); setBackgroundAssetId(item.backgroundAssetId ?? null); setBackgroundPreview('');
  }
  function insertVariable(variable: string) {
    const field = bodyRef.current;
    if (!field) return setBody(value => `${value} ${variable}`);
    const start = field.selectionStart, end = field.selectionEnd;
    setBody(value => value.slice(0, start) + variable + value.slice(end));
    requestAnimationFrame(() => { field.focus(); field.selectionStart = field.selectionEnd = start + variable.length; });
  }
  async function uploadBackground(file: File) {
    setUploading(true); setMessage('');
    try {
      const grant = await call(`organizations/${organizationId}/events/${eventId}/certificate-backgrounds/upload`, 'POST', { name: file.name, contentType: file.type, sizeBytes: String(file.size) });
      const uploaded = await fetch(String(grant.uploadUrl).replace('/api/', '/api/backend/'), { method: 'PUT', headers: { 'content-type': file.type }, body: file });
      if (!uploaded.ok) throw new Error('Arka plan yüklenemedi.');
      await call(`organizations/${organizationId}/certificate-backgrounds/confirm`, 'POST', { assetId: grant.assetId });
      setBackgroundAssetId(grant.assetId); setBackgroundPreview(URL.createObjectURL(file)); setMessage('Arka plan hazır. Şablonu kaydetmeyi unutmayın.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Arka plan yüklenemedi.'); }
    finally { setUploading(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    const payload = { name, bodyTemplate: body, primaryColor: color, signatureLabel: signature || null, includeQr, orientation, backgroundAssetId };
    try {
      const saved = selectedId
        ? await call(`organizations/${organizationId}/events/${eventId}/certificate-templates/${selectedId}`, 'POST', payload)
        : await call(`organizations/${organizationId}/events/${eventId}/certificate-templates`, 'POST', payload);
      setTemplates(rows => selectedId ? rows.map(row => row.id === saved.id ? { ...row, ...saved } : row) : [{ ...saved, _count: { certificates: 0 } }, ...rows]);
      setSelectedId(saved.id); setMessage('Sertifika tasarımı kaydedildi.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Şablon kaydedilemedi.'); }
    finally { setBusy(false); }
  }
  async function issue() {
    if (!selectedId || eligibleCount === 0) return;
    setBusy(true); setMessage('');
    try {
      const result = await call(`organizations/${organizationId}/events/${eventId}/certificates`, 'POST', { templateId: selectedId });
      setMessage(`${result.queued} katılımcının sertifikası hazırlanmak üzere sıraya alındı.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Sertifikalar hazırlanamadı.'); }
    finally { setBusy(false); }
  }

  return <div className="certificate-studio">
    <ol className="certificate-steps"><li className="done"><span>1</span><div><b>Tasarla</b><small>Metin ve görünüm</small></div></li><li className={selectedId?'done':''}><span>2</span><div><b>Kaydet</b><small>Tasarımı hazırla</small></div></li><li><span>3</span><div><b>Üret</b><small>Katılanlara ver</small></div></li></ol>
    <div className="certificate-studio-grid">
      <form className="certificate-controls" onSubmit={save}>
        <div className="certificate-control-head"><div><p className="eyebrow">TASARIM</p><h2>Sertifikanızı hazırlayın</h2></div>{templates.length>0&&<label>Kayıtlı tasarım<select value={selectedId} onChange={event=>loadTemplate(event.target.value)}><option value="">Yeni tasarım</option>{templates.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}</div>
        <label>Sertifika adı<input value={name} onChange={event=>setName(event.target.value)} required/></label>
        <label>Sertifikada yazacak metin<textarea ref={bodyRef} value={body} onChange={event=>setBody(event.target.value)} rows={4} required/></label>
        <div className="certificate-variable-row">{variables.map(([variable,label])=><button key={variable} type="button" onClick={()=>insertVariable(variable)}>+ {label}</button>)}</div>
        <div className="certificate-options">
          <label>Vurgu rengi<span className="color-control"><input type="color" value={color} onChange={event=>setColor(event.target.value)}/><code>{color}</code></span></label>
          <label>Sayfa düzeni<select value={orientation} onChange={event=>setOrientation(event.target.value)}><option value="LANDSCAPE">Yatay — önerilen</option><option value="PORTRAIT">Dikey</option></select></label>
        </div>
        <label>İmza / unvan yazısı <small>İsteğe bağlı</small><input value={signature} onChange={event=>setSignature(event.target.value)} placeholder="Örn. Ayşe Yılmaz · Genel Sekreter"/></label>
        <label className="certificate-upload"><b>Arka plan görseli <small>İsteğe bağlı</small></b><span>Hazır tasarımınızı PNG veya JPG olarak yükleyebilirsiniz. Yüklemezseniz Eventise’ın sade tasarımı kullanılır.</span><input type="file" accept="image/png,image/jpeg" disabled={uploading} onChange={event=>{const file=event.target.files?.[0];if(file)uploadBackground(file)}}/></label>
        <label className="certificate-qr"><input type="checkbox" checked={includeQr} onChange={event=>setIncludeQr(event.target.checked)}/><span><b>Doğrulama QR kodu ekle</b><small>Sertifikanın gerçekliği çevrim içi doğrulanabilir.</small></span></label>
        <button className="primary certificate-save" disabled={busy||uploading}>{uploading?'Görsel yükleniyor…':busy?'Kaydediliyor…':selectedId?'Tasarımı güncelle':'Tasarımı kaydet'}</button>
      </form>
      <aside className="certificate-preview-panel">
        <div className="certificate-preview-heading"><div><p className="eyebrow">CANLI ÖNİZLEME</p><h2>Katılımcının göreceği sertifika</h2></div><span>{orientation==='LANDSCAPE'?'Yatay':'Dikey'}</span></div>
        <div className={`certificate-canvas ${orientation.toLowerCase()}`} style={{ color, backgroundImage: backgroundPreview ? `url(${backgroundPreview})` : undefined }}>
          {!backgroundPreview&&<><div className="certificate-corner top"/><div className="certificate-corner bottom"/></>}
          <small>KATILIM SERTİFİKASI</small><h3>Ayşe Yılmaz</h3><p>{previewBody}</p><div className="certificate-org"><b>{organizationName}</b>{signature&&<span>{signature}</span>}</div>{includeQr&&<div className="certificate-qr-preview"><span>▦</span><small>DOĞRULA</small></div>}
        </div>
        <div className="certificate-issue-card"><div><span className="certificate-eligible">{eligibleCount}</span><div><b>Sertifika almaya uygun katılımcı</b><p>Yalnızca katılım teyidi yapılmış ve kabul edilmiş kişiler.</p></div></div>{selected?._count?.certificates? <small>Bu tasarımla daha önce {selected._count.certificates} sertifika kaydı oluşturuldu.</small>:null}<button className="primary" type="button" disabled={busy||!selectedId||eligibleCount===0} onClick={issue}>{eligibleCount===0?'Katılım teyidi bekleniyor':!selectedId?'Önce tasarımı kaydedin':`${eligibleCount} kişiye sertifika üret`}</button></div>
      </aside>
    </div>
    {message&&<p className="notice" role="status">{message}</p>}
  </div>;
}
