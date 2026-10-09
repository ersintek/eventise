'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { directoryHref } from './cop31-data';
import type { Cop31Event, Cop31Format, Cop31Locale, Cop31Status } from './cop31-types';
import { isoToZonedDateTimeInput, zonedDateTimeToIso } from '@/lib/zoned-datetime';

type LanguageScreen = Cop31Locale;
type EntryMode = 'form' | 'json';
type DateTimeParts = { date: string; hour: string; minute: string };
type ContentReadiness = { ready: boolean; missing: string[] };
type ContentDraft = {
  title: string; summary: string; description: string; venueName: string; venueAddress: string; city: string; country: string;
  organizers: string[]; organizerUrl: string; languages: string[]; topics: string[]; cop31Connection: string;
  registrationUrl: string; informationUrl: string; sourceUrl: string;
};
type FormState = {
  id?: string; slug: string; timezone: string; format: Cop31Format; status: Cop31Status; featured: boolean;
  startsDate: string; startsHour: string; startsMinute: string; endsDate: string; endsHour: string; endsMinute: string;
  verifiedDate: string; verifiedHour: string; verifiedMinute: string; contentTr: string; contentEn: string;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTES = ['00', '30'];
const commaList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);
const dateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)].filter(Boolean).join('-');
};

const emptyContentObject = (locale: Cop31Locale): ContentDraft => ({
  title: '', summary: '', description: '', venueName: '', venueAddress: '', city: '', country: '', organizers: [], organizerUrl: '',
  languages: locale === 'tr' ? ['Türkçe'] : ['English'], topics: [], cop31Connection: '', registrationUrl: '', informationUrl: '', sourceUrl: '',
});
const emptyContent = (locale: Cop31Locale) => JSON.stringify(emptyContentObject(locale), null, 2);

function contentDraft(value: string, locale: Cop31Locale): ContentDraft {
  const fallback = emptyContentObject(locale);
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return fallback;
    const item = parsed as Record<string, unknown>;
    const text = (key: keyof ContentDraft) => typeof item[key] === 'string' ? item[key] as string : fallback[key] as string;
    const list = (key: 'organizers' | 'languages' | 'topics') => Array.isArray(item[key]) ? item[key].filter((entry): entry is string => typeof entry === 'string') : fallback[key];
    return { title: text('title'), summary: text('summary'), description: text('description'), venueName: text('venueName'), venueAddress: text('venueAddress'), city: text('city'), country: text('country'), organizers: list('organizers'), organizerUrl: text('organizerUrl'), languages: list('languages'), topics: list('topics'), cop31Connection: text('cop31Connection'), registrationUrl: text('registrationUrl'), informationUrl: text('informationUrl'), sourceUrl: text('sourceUrl') };
  } catch { return fallback; }
}

function contentReadiness(value: string, locale: Cop31Locale): ContentReadiness {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return { ready: false, missing: ['geçerli JSON'] };
  } catch { return { ready: false, missing: ['geçerli JSON'] }; }
  const content = contentDraft(value, locale);
  const validUrl = (entry: string) => {
    try { const url = new URL(entry); return ['http:', 'https:'].includes(url.protocol); } catch { return false; }
  };
  const missing = [
    content.title.trim().length >= 2 ? null : 'başlık',
    content.summary.trim().length >= 20 ? null : 'kısa özet',
    content.organizers.length ? null : 'düzenleyen kurum',
    content.languages.length ? null : 'etkinlik dili',
    content.cop31Connection.trim() ? null : 'COP31 bağlantısı',
    validUrl(content.sourceUrl.trim()) ? null : 'kaynak bağlantısı',
  ].filter((entry): entry is string => Boolean(entry));
  return { ready: missing.length === 0, missing };
}

function dateTimeParts(value?: string | null): DateTimeParts {
  if (!value) return { date: '', hour: '', minute: '00' };
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { date: '', hour: '', minute: '00' };
  return { date: match[3] + '-' + match[2] + '-' + match[1].slice(-2), hour: match[4], minute: MINUTES.includes(match[5]) ? match[5] : '00' };
}

function editorDateTime(value: DateTimeParts, label: string, required = false) {
  if (!value.date && !value.hour && !required) return undefined;
  const match = /^(\d{2})-(\d{2})-(\d{2})$/.exec(value.date);
  if (!match) throw new Error(label + ' tarihi DD-MM-YY biçiminde girilmeli.');
  if (!HOURS.includes(value.hour) || !MINUTES.includes(value.minute)) throw new Error(label + ' saati 24 saat düzeninde, dakika ise 00 veya 30 olmalı.');
  const day = Number(match[1]), month = Number(match[2]), year = 2000 + Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new Error(label + ' tarihi geçerli değil.');
  return String(year) + '-' + match[2] + '-' + match[1] + 'T' + value.hour + ':' + value.minute;
}

function DateTimeInput({ label, value, required, onChange }: { label: string; value: DateTimeParts; required?: boolean; onChange: (next: DateTimeParts) => void }) {
  return <fieldset className="cop31-editor-datetime">
    <legend>{label}{required ? ' *' : ''}</legend>
    <label>Tarih<input value={value.date} inputMode="numeric" maxLength={8} placeholder="DD-MM-YY" required={required} onChange={event => onChange({ ...value, date: dateInput(event.target.value) })}/></label>
    <label>Saat<select value={value.hour} required={required} onChange={event => onChange({ ...value, hour: event.target.value })}><option value="">SS</option>{HOURS.map(hour => <option value={hour} key={hour}>{hour}</option>)}</select></label>
    <label>Dakika<select value={value.minute} onChange={event => onChange({ ...value, minute: event.target.value })}>{MINUTES.map(minute => <option value={minute} key={minute}>{minute}</option>)}</select></label>
    <small>DD-MM-YY · 24 saat · dakika 00 / 30</small>
  </fieldset>;
}

const blank = (): FormState => ({ slug: '', timezone: 'Europe/Istanbul', format: 'ONLINE', status: 'DRAFT', featured: false, startsDate: '', startsHour: '', startsMinute: '00', endsDate: '', endsHour: '', endsMinute: '00', verifiedDate: '', verifiedHour: '', verifiedMinute: '00', contentTr: emptyContent('tr'), contentEn: emptyContent('en') });

const fromEvent = (event: Cop31Event): FormState => {
  const starts = dateTimeParts(isoToZonedDateTimeInput(event.startsAt, event.timezone));
  const ends = dateTimeParts(isoToZonedDateTimeInput(event.endsAt, event.timezone));
  const verified = dateTimeParts(event.verifiedAt ? isoToZonedDateTimeInput(event.verifiedAt, event.timezone) : '');
  return { id: event.id, slug: event.slug, timezone: event.timezone, format: event.format, status: event.status, featured: event.featured, startsDate: starts.date, startsHour: starts.hour, startsMinute: starts.minute, endsDate: ends.date, endsHour: ends.hour, endsMinute: ends.minute, verifiedDate: verified.date, verifiedHour: verified.hour, verifiedMinute: verified.minute, contentTr: JSON.stringify(event.contentTr, null, 2), contentEn: JSON.stringify(event.contentEn, null, 2) };
};

function parseContent(value: string, language: string) {
  try {
    const content: unknown = JSON.parse(value);
    if (!content || Array.isArray(content) || typeof content !== 'object') throw new Error('JSON nesnesi bekleniyor.');
    return content;
  } catch (error) { throw new Error(language + ' içeriği geçerli JSON değil: ' + (error instanceof Error ? error.message : 'okunamadı.')); }
}

const statusLabel = (status: Cop31Status) => status === 'PUBLISHED' ? 'Yayında' : status === 'DRAFT' ? 'Taslak' : status === 'POSTPONED' ? 'Ertelendi' : status === 'CANCELLED' ? 'İptal edildi' : 'Arşiv';

export function Cop31Editor() {
  const [events, setEvents] = useState<Cop31Event[]>([]);
  const [form, setForm] = useState<FormState>(blank);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<LanguageScreen>('tr');
  const [entryMode, setEntryMode] = useState<EntryMode>('form');
  const notice = (value: string, isError = false) => { setMessage(value); setMessageIsError(isError); };
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(current => ({ ...current, [key]: value }));

  const load = async () => {
    setLoading(true);
    const response = await fetch('/api/cop31-editor/events', { cache: 'no-store' });
    if (response.ok) { setEvents(await response.json() as Cop31Event[]); setReady(true); } else setReady(false);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  function setDateTime(prefix: 'starts' | 'ends' | 'verified', value: DateTimeParts) {
    setForm(current => prefix === 'starts' ? { ...current, startsDate: value.date, startsHour: value.hour, startsMinute: value.minute } : prefix === 'ends' ? { ...current, endsDate: value.date, endsHour: value.hour, endsMinute: value.minute } : { ...current, verifiedDate: value.date, verifiedHour: value.hour, verifiedMinute: value.minute });
  }

  async function unlock(event: FormEvent) {
    event.preventDefault(); notice('');
    const response = await fetch('/api/cop31-editor/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await response.json();
    if (!response.ok) { notice(data.message ?? 'Erişim açılamadı.', true); return; }
    setPassword(''); await load();
  }

  function normalizeContent(locale: Cop31Locale) {
    const key = locale === 'tr' ? 'contentTr' : 'contentEn', language = locale === 'tr' ? 'Türkçe' : 'English';
    try { set(key, JSON.stringify(parseContent(form[key], language), null, 2)); notice(language + ' JSON’u geçerli ve biçimlendirildi.'); } catch (error) { notice(error instanceof Error ? error.message : 'JSON okunamadı.', true); }
  }

  async function importContent(locale: Cop31Locale, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    const key = locale === 'tr' ? 'contentTr' : 'contentEn', language = locale === 'tr' ? 'Türkçe' : 'English';
    try { set(key, JSON.stringify(parseContent(await file.text(), language), null, 2)); setEntryMode('json'); notice(language + ' JSON’u içe aktarıldı.'); } catch (error) { notice(error instanceof Error ? error.message : 'JSON okunamadı.', true); }
    event.target.value = '';
  }

  function exportContent(locale: Cop31Locale) {
    const key = locale === 'tr' ? 'contentTr' : 'contentEn', language = locale === 'tr' ? 'Türkçe' : 'English';
    try {
      const href = URL.createObjectURL(new Blob([JSON.stringify(parseContent(form[key], language), null, 2)], { type: 'application/json;charset=utf-8' }));
      const anchor = document.createElement('a'); anchor.href = href; anchor.download = (form.slug || 'cop31-etkinligi') + '-' + locale + '.json'; anchor.click(); URL.revokeObjectURL(href);
      notice(language + ' JSON’u dışa aktarıldı.');
    } catch (error) { notice(error instanceof Error ? error.message : 'JSON okunamadı.', true); }
  }

  async function save(event: FormEvent) {
    event.preventDefault(); notice('');
    const trReadiness = contentReadiness(form.contentTr, 'tr');
    const enReadiness = contentReadiness(form.contentEn, 'en');
    const requiresCompleteContent = ['PUBLISHED', 'POSTPONED', 'CANCELLED'].includes(form.status);
    if (requiresCompleteContent && (!trReadiness.ready || !enReadiness.ready)) {
      const target = !trReadiness.ready ? 'tr' : 'en';
      setScreen(target); setEntryMode('form');
      notice(`Yayın için ${target === 'tr' ? 'Türkçe' : 'English'} içeriği tamamlanmalı: ${(target === 'tr' ? trReadiness : enReadiness).missing.join(', ')}.`, true);
      return;
    }
    let startsAt: string; let endsAt: string | undefined; let verifiedAt: string | undefined; let contentTr: unknown; let contentEn: unknown;
    try {
      const startWall = editorDateTime({ date: form.startsDate, hour: form.startsHour, minute: form.startsMinute }, 'Başlangıç', true);
      const endWall = editorDateTime({ date: form.endsDate, hour: form.endsHour, minute: form.endsMinute }, 'Bitiş');
      const verifiedWall = editorDateTime({ date: form.verifiedDate, hour: form.verifiedHour, minute: form.verifiedMinute }, 'Son doğrulama');
      if (requiresCompleteContent && !verifiedWall) throw new Error('Yayınlanan, ertelenen veya iptal edilen etkinlikler için son doğrulama tarihi zorunludur.');
      startsAt = zonedDateTimeToIso(startWall!, form.timezone);
      endsAt = endWall ? zonedDateTimeToIso(endWall, form.timezone) : undefined;
      verifiedAt = verifiedWall ? zonedDateTimeToIso(verifiedWall, form.timezone) : undefined;
      contentTr = parseContent(form.contentTr, 'Türkçe'); contentEn = parseContent(form.contentEn, 'English');
    } catch (error) { notice(error instanceof Error ? error.message : 'Etkinlik kaydedilemedi.', true); return; }
    const { id, slug, contentTr: _contentTr, contentEn: _contentEn, startsDate: _startsDate, startsHour: _startsHour, startsMinute: _startsMinute, endsDate: _endsDate, endsHour: _endsHour, endsMinute: _endsMinute, verifiedDate: _verifiedDate, verifiedHour: _verifiedHour, verifiedMinute: _verifiedMinute, ...technical } = form;
    const payload = { ...technical, startsAt, endsAt, verifiedAt, contentTr, contentEn, ...(id ? {} : { slug }) };
    const response = await fetch(id ? '/api/cop31-editor/events/' + id : '/api/cop31-editor/events', { method: id ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) { notice(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Etkinlik kaydedilemedi.', true); return; }
    notice(form.status === 'PUBLISHED' ? 'Etkinlik yayınlandı ve her iki dildeki sayfası hazır.' : 'Taslak başarıyla kaydedildi.');
    setForm(fromEvent(data)); await load();
  }

  async function logout() { await fetch('/api/cop31-editor/session', { method: 'DELETE' }); setReady(false); setEvents([]); setForm(blank()); notice(''); }
  if (loading) return <main className="cop31-editor-page"><p>Yükleniyor…</p></main>;
  if (!ready) return <main className="cop31-editor-page cop31-editor-login"><Link className="cop31-brand" href="/cop31"><span>e</span><b>eventise</b></Link><section><p className="cop31-eyebrow">COP31 EDİTÖR ALANI</p><h1>Etkinlikleri ekleyin ve güncel tutun.</h1><p>Bu alan Eventise hesapları ve etkinlik süreçlerinden bağımsızdır.</p><form onSubmit={unlock}><label>Erişim parolası<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required autoFocus /></label><button className="cop31-primary-link">Editör alanını aç <span>→</span></button></form>{message && <p className={'cop31-editor-message' + (messageIsError ? ' error' : '')} role="alert">{message}</p>}</section></main>;

  const activeKey = screen === 'tr' ? 'contentTr' : 'contentEn', activeLanguage = screen === 'tr' ? 'Türkçe' : 'English', activeContent = contentDraft(form[screen === 'tr' ? 'contentTr' : 'contentEn'], screen);
  const readiness = { tr: contentReadiness(form.contentTr, 'tr'), en: contentReadiness(form.contentEn, 'en') };
  const requiresCompleteContent = ['PUBLISHED', 'POSTPONED', 'CANCELLED'].includes(form.status);
  const updateActiveContent = <K extends keyof ContentDraft>(key: K, value: ContentDraft[K]) => set(activeKey, JSON.stringify({ ...activeContent, [key]: value }, null, 2));
  const chooseEntryMode = (mode: EntryMode) => { if (mode === 'form') { try { parseContent(form[activeKey], activeLanguage); } catch (error) { notice(error instanceof Error ? error.message : 'JSON okunamadı.', true); return; } } setEntryMode(mode); };
  const starts = { date: form.startsDate, hour: form.startsHour, minute: form.startsMinute }, ends = { date: form.endsDate, hour: form.endsHour, minute: form.endsMinute }, verified = { date: form.verifiedDate, hour: form.verifiedHour, minute: form.verifiedMinute };

  return <main className="cop31-editor-page">
    <header className="cop31-editor-header"><Link className="cop31-brand" href="/cop31"><span>e</span><b>eventise</b></Link><div><Link href={directoryHref('tr')} target="_blank">Genel sayfayı aç ↗</Link><button type="button" onClick={logout}>Çıkış</button></div></header>
    <div className="cop31-editor-layout">
      <aside className="cop31-editor-list"><div><p className="cop31-eyebrow">COP31 ETKİNLİKLERİ</p><h1>İçerik alanı</h1><button className="cop31-editor-new" type="button" onClick={() => { setForm(blank()); setScreen('tr'); setEntryMode('form'); notice(''); }}>+ Yeni etkinlik</button></div><p className="cop31-editor-count">{events.length} kayıt</p><div>{events.map(event => <button type="button" className={form.id === event.id ? 'active' : ''} onClick={() => { setForm(fromEvent(event)); setScreen('tr'); setEntryMode('form'); notice(''); }} key={event.id}><span>{new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', timeZone: event.timezone }).format(new Date(event.startsAt))}</span><strong>{event.contentTr.title || event.contentEn.title}</strong><small>{statusLabel(event.status)}</small></button>)}</div></aside>
      <section className="cop31-editor-form-wrap">
        <header><div><p className="cop31-eyebrow">{form.id ? 'ETKİNLİĞİ DÜZENLE' : 'YENİ ETKİNLİK'}</p><h2>{form.id ? 'Etkinlik bilgileri' : 'Yeni COP31 etkinliği'}</h2></div>{message && <p className={'cop31-editor-message' + (messageIsError ? ' error' : '')} role="status">{message}</p>}</header>
        <form className="cop31-editor-form" onSubmit={save}>
          <section><h3>Ortak teknik bilgiler</h3><p className="cop31-editor-section-note">Tarih, saat, katılım biçimi ve yayın durumu iki dil için ortaktır. Görünen bütün içerik aşağıdaki dil ekranlarının içindedir.</p><div className="cop31-editor-grid two"><label className="wide">Bağlantı kısa adı<input value={form.slug} onChange={event => set('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} required={!form.id} disabled={Boolean(form.id)} placeholder="cop31-oncesi-iklim-politikasi-bulusmasi"/><small>Yayınlandıktan sonra bağlantının değişmemesi için düzenlemede kilitlenir.</small></label><DateTimeInput label="Başlangıç" value={starts} required onChange={value => setDateTime('starts', value)}/><DateTimeInput label="Bitiş" value={ends} onChange={value => setDateTime('ends', value)}/><label>Saat dilimi<input value={form.timezone} onChange={event => set('timezone', event.target.value)} required placeholder="Europe/Istanbul"/></label><label>Katılım biçimi<select value={form.format} onChange={event => set('format', event.target.value as Cop31Format)}><option value="ONLINE">Çevrim içi</option><option value="IN_PERSON">Yüz yüze</option><option value="HYBRID">Hibrit</option></select></label></div></section>
          <section className="cop31-editor-language-section"><div className="cop31-editor-language-heading"><div><h3>Dile özgü içerik</h3><p>İki ekran birbirinin çevirisi değildir; her biri bağımsız bir etkinlik anlatımı ve bağlantı setidir.</p></div><nav className="cop31-editor-language-tabs" aria-label="İçerik dili">{(['tr', 'en'] as LanguageScreen[]).map(locale => { const state = readiness[locale]; return <button type="button" key={locale} className={screen === locale ? 'active' : ''} onClick={() => { setScreen(locale); setEntryMode('form'); }} title={state.ready ? 'Yayın için hazır' : `Eksik: ${state.missing.join(', ')}`}><span>{locale === 'tr' ? 'Türkçe içerik' : 'English content'}</span><small className={state.ready ? 'ready' : 'incomplete'}>{state.ready ? 'Hazır' : `Eksik · ${state.missing.length}`}</small></button>; })}</nav></div>
            <div className="cop31-editor-json-panel"><div><p className="cop31-eyebrow">{activeLanguage.toUpperCase()}</p><h4>{activeLanguage} içeriği</h4><p>{screen === 'tr' ? 'Türkçe kamusal sayfada görünecek tüm metin, kurum, konum ve bağlantılar.' : 'Everything that will appear on the English public page: text, organizers, location and links.'}</p></div><nav className="cop31-editor-entry-tabs" aria-label="Giriş yöntemi"><button type="button" className={entryMode === 'form' ? 'active' : ''} onClick={() => chooseEntryMode('form')}>Normal giriş</button><button type="button" className={entryMode === 'json' ? 'active' : ''} onClick={() => chooseEntryMode('json')}>JSON</button></nav>
              {entryMode === 'form' ? <div className="cop31-editor-normal-panel"><div className="cop31-editor-grid two"><label className="wide">Başlık<input value={activeContent.title} onChange={event => updateActiveContent('title', event.target.value)} required={requiresCompleteContent} maxLength={160}/></label><label className="wide">Kısa özet<textarea value={activeContent.summary} onChange={event => updateActiveContent('summary', event.target.value)} required={requiresCompleteContent} minLength={requiresCompleteContent ? 20 : undefined} maxLength={360}/></label><label className="wide">Açıklama<textarea value={activeContent.description} onChange={event => updateActiveContent('description', event.target.value)} /></label><label>Mekân adı<input value={activeContent.venueName} onChange={event => updateActiveContent('venueName', event.target.value)} /></label><label>Şehir<input value={activeContent.city} onChange={event => updateActiveContent('city', event.target.value)} /></label><label>Ülke<input value={activeContent.country} onChange={event => updateActiveContent('country', event.target.value)} /></label><label className="wide">Açık adres<input value={activeContent.venueAddress} onChange={event => updateActiveContent('venueAddress', event.target.value)} /></label><label>Düzenleyen kurum(lar)<input value={activeContent.organizers.join(', ')} onChange={event => updateActiveContent('organizers', commaList(event.target.value))} required={requiresCompleteContent} placeholder="Kurum A, Kurum B"/><small>Birden çok kurum için virgül kullanın.</small></label><label>Kurum web sitesi<input type="url" value={activeContent.organizerUrl} onChange={event => updateActiveContent('organizerUrl', event.target.value)} placeholder="https://"/></label><label>Etkinlik dili/dilleri<input value={activeContent.languages.join(', ')} onChange={event => updateActiveContent('languages', commaList(event.target.value))} required={requiresCompleteContent} placeholder={screen === 'tr' ? 'Türkçe, English' : 'English, Turkish'}/></label><label>COP31 bağlantısı<input value={activeContent.cop31Connection} onChange={event => updateActiveContent('cop31Connection', event.target.value)} required={requiresCompleteContent} placeholder={screen === 'tr' ? 'COP31’e hazırlık' : 'Preparing for COP31'}/></label><label className="wide">Konular<input value={activeContent.topics.join(', ')} onChange={event => updateActiveContent('topics', commaList(event.target.value))} placeholder={screen === 'tr' ? 'İklim diplomasisi, finansman' : 'Climate diplomacy, finance'}/><small>En fazla üç konu; birden çok konu için virgül kullanın.</small></label><label>Kayıt bağlantısı<input type="url" value={activeContent.registrationUrl} onChange={event => updateActiveContent('registrationUrl', event.target.value)} placeholder="https://"/></label><label>Bilgi bağlantısı<input type="url" value={activeContent.informationUrl} onChange={event => updateActiveContent('informationUrl', event.target.value)} placeholder="https://"/></label><label className="wide">Kaynak bağlantısı<input type="url" value={activeContent.sourceUrl} onChange={event => updateActiveContent('sourceUrl', event.target.value)} required={requiresCompleteContent} placeholder="https://"/></label></div></div> : <div><div className="cop31-editor-json-actions"><label className="cop31-editor-json-import">JSON içe aktar<input type="file" accept="application/json,.json" onChange={event => void importContent(screen, event)} /></label><button type="button" onClick={() => normalizeContent(screen)}>Biçimlendir ve doğrula</button><button type="button" onClick={() => exportContent(screen)}>JSON dışa aktar</button></div><label className="cop31-editor-json-label">{activeLanguage} etkinlik içeriği<textarea className="cop31-editor-json" value={form[activeKey]} onChange={event => set(activeKey, event.target.value)} spellCheck={false} required={requiresCompleteContent}/></label><details><summary>Beklenen JSON alanları</summary><pre>{emptyContent(screen)}</pre></details></div>}
            </div>
          </section>
          <section><h3>Yayın durumu</h3><div className="cop31-editor-grid two"><label>Durum<select value={form.status} onChange={event => set('status', event.target.value as Cop31Status)}><option value="DRAFT">Taslak</option><option value="PUBLISHED">Yayında</option><option value="POSTPONED">Ertelendi</option><option value="CANCELLED">İptal edildi</option><option value="ARCHIVED">Arşiv</option></select></label><DateTimeInput label="Son doğrulama" value={verified} required={requiresCompleteContent} onChange={value => setDateTime('verified', value)}/><label className="cop31-featured-toggle"><input type="checkbox" checked={form.featured} onChange={event => set('featured', event.target.checked)}/><span>Öne çıkan etkinlik</span><small>Seçilmezse genel akışta normal görünür.</small></label></div></section>
          <footer><button type="submit" className="cop31-primary-link">{form.status === 'PUBLISHED' ? 'Yayınla ve kaydet' : 'Taslağı kaydet'} <span>→</span></button></footer>
        </form>
      </section>
    </div>
  </main>;
}
