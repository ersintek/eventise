'use client';

import { FormEvent, useState } from 'react';

export type ManagedTier = {
  id: string; key: string; name: string; maxActiveEvents: number; maxParticipantsPerEvent: number;
  photoStorageLimitBytes: string; fileStorageLimitBytes: string; maxPhotosPerEvent: number;
  defaultMaxPhotosPerParticipant: number; emailMultiplier: number; allowedFileTypes: string[];
  featureFlags: Record<string, boolean>;
};

const features = [
  ['doorRegistration', 'Kapıda kayıt', 'Görevli, ön kaydı olmayan katılımcıyı etkinlikte kaydedebilir.'],
  ['basicSpamProtection', 'Temel spam koruması', 'Şüpheli veya tekrarlayan başvurular için koruma katmanı.'],
  ['advancedReports', 'Gelişmiş raporlar', 'CSV, Excel ve PDF dışa aktarımları ile başvuru analizi.'],
  ['prioritySupport', 'Öncelikli destek', 'Destek taleplerinde bu tier için öncelik bilgisi taşır.'],
] as const;
const fileTypes = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX'];
const allFeatures = Object.fromEntries(features.map(([key]) => [key, true]));
const emptyTier = (): Omit<ManagedTier, 'id'> => ({ key: '', name: '', maxActiveEvents: 20, maxParticipantsPerEvent: 500, photoStorageLimitBytes: String(1024 ** 3), fileStorageLimitBytes: String(1024 ** 3), maxPhotosPerEvent: 50, defaultMaxPhotosPerParticipant: 5, emailMultiplier: 3, allowedFileTypes: fileTypes, featureFlags: allFeatures });
const mb = (value: string) => (Number(value) / 1024 / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 0 });

export function TierManager({ initialTiers }: { initialTiers: ManagedTier[] }) {
  const [tiers, setTiers] = useState(initialTiers);
  const [draft, setDraft] = useState<ManagedTier | Omit<ManagedTier, 'id'>>(initialTiers[0] ?? emptyTier());
  const [isNew, setIsNew] = useState(!initialTiers.length);
  const [message, setMessage] = useState('');
  const selectTier = (tier: ManagedTier) => { setDraft({ ...tier, allowedFileTypes: [...tier.allowedFileTypes], featureFlags: { ...allFeatures, ...tier.featureFlags } }); setIsNew(false); setMessage(''); };
  const update = (field: keyof Omit<ManagedTier, 'id'>, value: unknown) => setDraft(current => ({ ...current, [field]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    const method = isNew ? 'POST' : 'PATCH';
    const path = isNew ? 'tiers' : `tiers/${(draft as ManagedTier).id}`;
    const response = await fetch(`/api/backend/admin/${path}`, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft) });
    const data = await response.json();
    if (!response.ok) { setMessage(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Tier kaydedilemedi.'); return; }
    setTiers(current => isNew ? [...current, data] : current.map(tier => tier.id === data.id ? data : tier));
    setDraft(data); setIsNew(false); setMessage('Tier ayarları kaydedildi.');
  }
  async function remove() {
    if (isNew || !confirm(`“${draft.name}” tier’ını silmek istiyor musunuz?`)) return;
    const response = await fetch(`/api/backend/admin/tiers/${(draft as ManagedTier).id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) { setMessage(data.message ?? 'Tier silinemedi.'); return; }
    const remaining = tiers.filter(tier => tier.id !== (draft as ManagedTier).id);
    setTiers(remaining); setDraft(remaining[0] ?? emptyTier()); setIsNew(!remaining.length); setMessage('Tier silindi.');
  }
  return <section className="tier-manager">
    <aside className="tier-list"><div><p className="eyebrow">TIER AYARLAMA</p><h2>Paketler</h2><p>Bir tier’daki değişiklik, o tier’a atanmış tüm kurumlara hemen uygulanır.</p></div>
      <div className="tier-list-items">{tiers.map(tier => <button type="button" key={tier.id} className={!isNew && (draft as ManagedTier).id === tier.id ? 'active' : ''} onClick={() => selectTier(tier)}><b>{tier.name}</b><small>{tier.maxActiveEvents} aktif etkinlik · {tier.maxParticipantsPerEvent.toLocaleString('tr-TR')} kişi</small></button>)}</div>
      <button type="button" className="secondary" onClick={() => { setDraft(emptyTier()); setIsNew(true); setMessage(''); }}>+ Yeni tier oluştur</button>
    </aside>
    <form className="tier-editor" onSubmit={submit}>
      <div className="section-heading"><div><h2>{isNew ? 'Yeni tier' : `${draft.name} ayarları`}</h2><p>Limitleri ve özellikleri bu pakete bağlı kurumlar için belirleyin.</p></div>{!isNew && <button type="button" className="secondary danger" onClick={remove}>Tier’ı sil</button>}</div>
      <div className="tier-fields"><label>Teknik anahtar<input value={draft.key} onChange={e => update('key', e.target.value)} required pattern="[a-z0-9-]+" placeholder="ör. pilot"/><small>Yalnız küçük harf, sayı ve tire kullanın.</small></label><label>Görünen ad<input value={draft.name} onChange={e => update('name', e.target.value)} required placeholder="ör. Pilot"/></label>
        <label>Aktif etkinlik limiti<input type="number" min="1" value={draft.maxActiveEvents} onChange={e => update('maxActiveEvents', Number(e.target.value))} required/></label><label>Etkinlik başına katılımcı<input type="number" min="1" value={draft.maxParticipantsPerEvent} onChange={e => update('maxParticipantsPerEvent', Number(e.target.value))} required/></label>
        <label>Fotoğraf kotası (MB)<input type="number" min="1" value={mb(draft.photoStorageLimitBytes)} onChange={e => update('photoStorageLimitBytes', String(Number(e.target.value) * 1024 * 1024))} required/></label><label>Dosya kotası (MB)<input type="number" min="1" value={mb(draft.fileStorageLimitBytes)} onChange={e => update('fileStorageLimitBytes', String(Number(e.target.value) * 1024 * 1024))} required/></label>
        <label>Etkinlik başına fotoğraf<input type="number" min="1" value={draft.maxPhotosPerEvent} onChange={e => update('maxPhotosPerEvent', Number(e.target.value))} required/></label><label>Katılımcı başına fotoğraf<input type="number" min="1" value={draft.defaultMaxPhotosPerParticipant} onChange={e => update('defaultMaxPhotosPerParticipant', Number(e.target.value))} required/></label>
        <label>Aylık e-posta çarpanı<input type="number" min="1" value={draft.emailMultiplier} onChange={e => update('emailMultiplier', Number(e.target.value))} required/><small>Aylık kayıt sayısı ile çarpılır.</small></label></div>
      <fieldset><legend>İzin verilen kaynak dosyaları</legend><div className="tier-toggles">{fileTypes.map(type => <label key={type}><input type="checkbox" checked={draft.allowedFileTypes.includes(type)} onChange={e => update('allowedFileTypes', e.target.checked ? [...draft.allowedFileTypes, type] : draft.allowedFileTypes.filter(item => item !== type))}/><span>{type}</span></label>)}</div></fieldset>
      <fieldset><legend>Özellikler</legend><div className="feature-toggles">{features.map(([key, title, description]) => <label key={key}><input type="checkbox" checked={draft.featureFlags[key] ?? true} onChange={e => update('featureFlags', { ...draft.featureFlags, [key]: e.target.checked })}/><span><b>{title}</b><small>{description}</small></span></label>)}</div></fieldset>
      <div className="tier-actions"><button className="primary">{isNew ? 'Tier oluştur' : 'Değişiklikleri kaydet'}</button>{message && <span role="status">{message}</span>}</div>
    </form>
  </section>;
}
