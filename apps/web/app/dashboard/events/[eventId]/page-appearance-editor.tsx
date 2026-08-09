'use client';

import { ChangeEvent, useEffect, useState } from 'react';

type Appearance = {
  accentColor: string;
  organizationName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
};

type Props = {
  organizationId: string;
  eventId: string;
  organizationName: string;
  title: string;
  summary?: string;
  startsAt: string;
  venueName?: string;
};

const colorChoices = ['#4F46E5', '#0F766E', '#B45309', '#BE123C', '#6D28D9', '#0369A1'];

export function PageAppearanceEditor({ organizationId, eventId, organizationName, title, summary, startsAt, venueName }: Props) {
  const [appearance, setAppearance] = useState<Appearance>({ accentColor: '#4F46E5', organizationName, logoUrl: null, coverImageUrl: null });
  const [busy, setBusy] = useState<'LOGO' | 'COVER' | 'COLOR' | null>(null);
  const [message, setMessage] = useState('');
  const endpoint = `/api/backend/organizations/${organizationId}/events/${eventId}`;

  useEffect(() => {
    let active = true;
    fetch(`${endpoint}/page-appearance`).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Görünüm bilgileri alınamadı.');
      if (active) setAppearance(data);
    }).catch(error => active && setMessage(error instanceof Error ? error.message : 'Görünüm bilgileri alınamadı.'));
    return () => { active = false; };
  }, [endpoint]);

  async function upload(kind: 'LOGO' | 'COVER', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(kind); setMessage('');
    try {
      const request = await fetch(`${endpoint}/page-assets/upload`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, name: file.name, contentType: file.type, sizeBytes: file.size }) });
      const grant = await request.json();
      if (!request.ok) throw new Error(Array.isArray(grant.message) ? grant.message.join(' ') : grant.message ?? 'Görsel yüklenemedi.');
      const uploadUrl = String(grant.uploadUrl).startsWith('/api/') ? String(grant.uploadUrl).replace('/api/', '/api/backend/') : String(grant.uploadUrl);
      const uploaded = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': file.type }, body: file });
      if (!uploaded.ok) throw new Error('Görsel depolama alanına aktarılamadı.');
      const confirm = await fetch(`${endpoint}/page-assets/confirm`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, assetId: grant.assetId, reservationId: grant.reservationId }) });
      const data = await confirm.json();
      if (!confirm.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Görsel doğrulanamadı.');
      setAppearance(data); setMessage(kind === 'LOGO' ? 'Kurum logosu güncellendi.' : 'Kapak görseli güncellendi.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Görsel yüklenemedi.');
    } finally {
      setBusy(null); event.target.value = '';
    }
  }

  async function remove(kind: 'LOGO' | 'COVER') {
    if (!window.confirm(kind === 'LOGO' ? 'Kurum logosu tüm etkinlik sayfalarından kaldırılacak. Devam edilsin mi?' : 'Kapak görseli etkinlik sayfasından kaldırılsın mı?')) return;
    setBusy(kind); setMessage('');
    try {
      const response = await fetch(`${endpoint}/page-assets/${kind}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Görsel kaldırılamadı.');
      setAppearance(data); setMessage('Görsel kaldırıldı.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Görsel kaldırılamadı.');
    } finally { setBusy(null); }
  }

  async function saveColor(accentColor: string) {
    setAppearance(current => ({ ...current, accentColor }));
    setBusy('COLOR'); setMessage('');
    try {
      const response = await fetch(`${endpoint}/page-appearance`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accentColor }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Renk kaydedilemedi.');
      setAppearance(data); setMessage('Vurgu rengi kaydedildi.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Renk kaydedilemedi.');
    } finally { setBusy(null); }
  }

  const date = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(startsAt));
  const initial = organizationName.trim().slice(0, 1).toLocaleUpperCase('tr-TR');

  return <section className="appearance-workspace">
    <div className="appearance-controls">
      <div className="appearance-intro"><p className="eyebrow">ETKİNLİK SAYFASI</p><h2>Markanızı öne çıkarın</h2><p>Üç sade ayarla sayfanızı kurumunuza ait hale getirin. Değişiklikleri sağdaki önizlemede görebilirsiniz.</p></div>
      <article className="appearance-setting-card">
        <div className="appearance-setting-heading"><span>1</span><div><h3>Kurum logosu</h3><p>Tüm etkinlik sayfalarında kurum adınızla birlikte görünür.</p></div></div>
        <div className="asset-control-row"><div className="asset-thumbnail logo-thumbnail">{appearance.logoUrl ? <img src={appearance.logoUrl} alt="Yüklü kurum logosu"/> : <b>{initial}</b>}</div><div><label className="secondary upload-button">{busy === 'LOGO' ? 'Yükleniyor…' : appearance.logoUrl ? 'Logoyu değiştir' : 'Logo yükle'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(busy)} onChange={event => upload('LOGO', event)}/></label>{appearance.logoUrl && <button type="button" className="text-danger" disabled={Boolean(busy)} onClick={() => remove('LOGO')}>Kaldır</button>}<small>PNG, JPG veya WebP · en fazla 5 MB</small></div></div>
      </article>
      <article className="appearance-setting-card">
        <div className="appearance-setting-heading"><span>2</span><div><h3>Kapak görseli</h3><p>Etkinliğinizi ilk bakışta anlatan yatay bir görsel seçin.</p></div></div>
        <div className="asset-control-row"><div className="asset-thumbnail cover-thumbnail">{appearance.coverImageUrl ? <img src={appearance.coverImageUrl} alt="Yüklü etkinlik kapak görseli"/> : <span>16:9</span>}</div><div><label className="secondary upload-button">{busy === 'COVER' ? 'Yükleniyor…' : appearance.coverImageUrl ? 'Görseli değiştir' : 'Kapak yükle'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(busy)} onChange={event => upload('COVER', event)}/></label>{appearance.coverImageUrl && <button type="button" className="text-danger" disabled={Boolean(busy)} onClick={() => remove('COVER')}>Kaldır</button>}<small>Önerilen 1600 × 900 px · en fazla 15 MB</small></div></div>
      </article>
      <article className="appearance-setting-card">
        <div className="appearance-setting-heading"><span>3</span><div><h3>Vurgu rengi</h3><p>Butonlar ve önemli bilgiler bu rengi kullanır.</p></div></div>
        <div className="color-choices" aria-label="Vurgu rengi seçenekleri">{colorChoices.map(color => <button type="button" key={color} aria-label={`${color} rengini seç`} aria-pressed={appearance.accentColor.toUpperCase() === color} className={appearance.accentColor.toUpperCase() === color ? 'selected' : ''} style={{ backgroundColor: color }} disabled={Boolean(busy)} onClick={() => saveColor(color)} />)}</div>
      </article>
      <div className="automatic-sharing-note"><b>Paylaşım otomatik yönetilir</b><p>Herkese açık ve bağlantıya özel etkinliklerde paylaşım araçları otomatik görünür. Yalnız davetlilerde gösterilmez.</p></div>
      {message && <p className="notice" role="status">{message}</p>}
    </div>
    <aside className="appearance-preview-shell" aria-label="Etkinlik sayfası önizlemesi">
      <div className="appearance-preview-label"><span>CANLI ÖNİZLEME</span><small>Masaüstü görünümü</small></div>
      <div className="appearance-preview" style={{ '--preview-accent': appearance.accentColor } as React.CSSProperties}>
        <div className={`preview-cover${appearance.coverImageUrl ? '' : ' empty'}`} style={appearance.coverImageUrl ? { backgroundImage: `url(${appearance.coverImageUrl})` } : undefined}><span>KAYIT AÇIK</span></div>
        <div className="preview-body"><div className="preview-org">{appearance.logoUrl ? <img src={appearance.logoUrl} alt=""/> : <b>{initial}</b>}<span>{organizationName}</span></div><h3>{title}</h3><p>{summary || 'Etkinliğin kısa açıklaması burada görünür.'}</p><div className="preview-facts"><span>{date}</span><span>{venueName || 'Mekân daha sonra duyurulacak'}</span></div><button type="button" tabIndex={-1}>Kayıt ol</button></div>
      </div>
    </aside>
  </section>;
}
