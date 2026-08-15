'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useState } from 'react';
import { formatDateTime, toLocalDateInputValue, toLocalDatetimeInputValue } from '@/lib/datetime';
import { MarkdownEditor } from './markdown-editor';

type EventFormat = 'OFFLINE' | 'ONLINE' | 'HYBRID';
type FormState = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  startsAt: string;
  endsAt: string;
  format: EventFormat;
  venueName: string;
  venueAddress: string;
  onlineLink: string;
  capacity: number;
  registrationMode: string;
  visibility: string;
};

const steps = [
  { label: 'Başlangıç', title: 'Etkinliği tanımlayın', description: 'Duyuru metninden otomatik doldurun veya temel bilgileri elle girin.' },
  { label: 'Zaman ve yer', title: 'Zamanı ve katılım biçimini belirleyin', description: 'Tarih, saat, mekân veya çevrim içi katılım bilgilerini kontrol edin.' },
  { label: 'Kayıt', title: 'Kayıt ayarlarını belirleyin', description: 'Kontenjanı ve başvuruların nasıl kabul edileceğini seçin.' },
  { label: 'Görünüm', title: 'Görünümü tamamlayın', description: 'İsterseniz kapak görseli ve renk seçin; etkinlik taslak olarak oluşturulur.' },
];

const colorChoices = [
  { value: '#4F46E5', label: 'Gece mavisi' },
  { value: '#0F766E', label: 'Adaçayı' },
  { value: '#A16207', label: 'Kehribar' },
  { value: '#9F1239', label: 'Bordo' },
  { value: '#6B21A8', label: 'Erik' },
  { value: '#075985', label: 'Okyanus' },
];

const visibilityLabels: Record<string, string> = {
  PUBLIC: 'Herkese açık',
  LINK_ONLY: 'Bağlantıya sahip olanlar',
  INVITE_ONLY: 'Yalnız davetliler',
};

const formatLabels: Record<EventFormat, string> = {
  OFFLINE: 'Yüz yüze',
  ONLINE: 'Çevrim içi',
  HYBRID: 'Hibrit',
};

export function EventBuilder({ organization }: { organization: { id: string; slug: string; name: string } }) {
  const [text, setText] = useState('');
  const [form, setForm] = useState<FormState>({
    title: '',
    slug: '',
    summary: '',
    description: '',
    startsAt: '',
    endsAt: '',
    format: 'OFFLINE',
    venueName: '',
    venueAddress: '',
    onlineLink: '',
    capacity: 100,
    registrationMode: 'APPROVAL',
    visibility: 'PUBLIC',
  });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [accentColor, setAccentColor] = useState('#4F46E5');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [importedCount, setImportedCount] = useState(0);

  const set = (key: keyof FormState, value: string | number) => setForm(current => ({ ...current, [key]: value }));
  const slugify = (value: string) => value.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const autoSlug = () => {
    const base = slugify(organization.name || 'etkinlik').slice(0, 20);
    const title = slugify(form.title).slice(0, 30);
    return title ? `${base}-${title}` : base;
  };
  const ensureSlug = () => {
    const slug = form.slug || autoSlug();
    if (!form.slug) set('slug', slug);
    return slug;
  };

  const extract = async () => {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/backend/organizations/${organization.id}/event-drafts/extract`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message ?? 'Taslak hazırlanamadı.');
        return;
      }
      const draft = data.draft;
      setForm(current => ({
        ...current,
        title: draft.title ?? current.title,
        summary: draft.summary ?? current.summary,
        description: draft.description ?? current.description,
        startsAt: draft.startsAt ? toLocalDatetimeInputValue(draft.startsAt) : current.startsAt,
        endsAt: draft.endsAt ? toLocalDatetimeInputValue(draft.endsAt) : current.endsAt,
        format: draft.format ?? current.format,
        venueName: draft.venueName ?? current.venueName,
        venueAddress: draft.venueAddress ?? current.venueAddress,
        onlineLink: draft.onlineLink ?? current.onlineLink,
        capacity: draft.capacity ?? current.capacity,
      }));
      const found = ['title','summary','startsAt','endsAt','format','venueName','venueAddress','onlineLink','capacity'].filter(key => draft[key] !== undefined && draft[key] !== null && draft[key] !== '').length;
      setConfidence(draft.confidence ?? {}); setImportedCount(found);
      setMessage(`${found} bilgi bulundu ve alanlara eklendi. “Kontrol edin” işaretli alanları gözden geçirin.`);
    } catch {
      setMessage('Duyuru metni işlenemedi. Lütfen yeniden deneyin.');
    } finally {
      setBusy(false);
    }
  };

  const goToStep = (nextStep: number) => {
    if (nextStep > furthestStep) return;
    setMessage('');
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function next() {
    ensureSlug();
    if (step === 0 && form.title.trim().length < 2) {
      setMessage('Devam etmek için etkinliğinize en az iki karakterlik bir ad verin.');
      return;
    }
    if (step === 1) {
      if (!form.startsAt || !form.endsAt) {
        setMessage('Başlangıç ve bitiş zamanını seçmeniz gerekiyor.');
        return;
      }
      if (new Date(form.endsAt) <= new Date(form.startsAt)) {
        setMessage('Bitiş zamanı başlangıçtan sonra olmalıdır.');
        return;
      }
    }
    if (step === 2 && Number(form.capacity) < 1) {
      setMessage('Kontenjan en az 1 kişi olmalıdır.');
      return;
    }
    const nextStep = Math.min(3, step + 1);
    setMessage('');
    setStep(nextStep);
    setFurthestStep(current => Math.max(current, nextStep));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const slug = ensureSlug();
    if (step < 3) {
      next();
      return;
    }
    setBusy(true);
    setMessage('Etkinliğiniz hazırlanıyor…');
    try {
      const response = await fetch(`/api/backend/organizations/${organization.id}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slug,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          capacity: Number(form.capacity),
          faqs: [],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Etkinlik oluşturulamadı.');
        return;
      }
      let appearanceFailed = false;
      try {
        await fetch(`/api/backend/organizations/${organization.id}/events/${data.id}/page-appearance`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accentColor }) });
        if (coverFile) {
          const uploadRequest = await fetch(`/api/backend/organizations/${organization.id}/events/${data.id}/page-assets/upload`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'COVER', name: coverFile.name, contentType: coverFile.type, sizeBytes: coverFile.size }) });
          const grant = await uploadRequest.json();
          if (!uploadRequest.ok) throw new Error(grant.message ?? 'Kapak görseli yüklenemedi.');
          const uploadUrl = String(grant.uploadUrl).startsWith('/api/') ? String(grant.uploadUrl).replace('/api/', '/api/backend/') : String(grant.uploadUrl);
          const uploaded = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': coverFile.type }, body: coverFile });
          if (!uploaded.ok) throw new Error('Kapak görseli depolama alanına aktarılamadı.');
          const confirmed = await fetch(`/api/backend/organizations/${organization.id}/events/${data.id}/page-assets/confirm`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'COVER', assetId: grant.assetId, reservationId: grant.reservationId }) });
          if (!confirmed.ok) throw new Error('Kapak görseli doğrulanamadı.');
        }
      } catch { appearanceFailed = true; }
      location.href = `/dashboard/events/${data.id}/settings?subtab=info&created=1${appearanceFailed ? '&appearance=failed' : ''}`;
    } catch {
      setMessage('Bağlantı kurulamadı. Bilgileriniz korunuyor; lütfen yeniden deneyin.');
    } finally {
      setBusy(false);
    }
  }

  function chooseCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setMessage('Kapak görseli en fazla 15 MB olabilir.'); event.target.value = ''; return; }
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); setMessage('');
  }

  const organizationInitial = organization.name.trim().slice(0, 1).toLocaleUpperCase('tr-TR');
  const previewDate = form.startsAt
    ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(form.startsAt))
    : 'Tarih daha sonra';
  const previewTime = form.startsAt
    ? `${form.startsAt.slice(11, 16)}${form.endsAt ? ` – ${form.endsAt.slice(11, 16)}` : ''}`
    : 'Saat seçilmedi';
  const previewLocation = form.format === 'ONLINE'
    ? 'Çevrim içi'
    : form.venueName || (form.format === 'HYBRID' ? 'Mekân eklenmedi · çevrim içi' : 'Mekân eklenmedi');
  const needsReview = (key: string) => confidence[key] > 0 && confidence[key] < .8;

  return <main className="builder-shell wizard-shell create-event-shell">
    <header className="create-event-header">
      <Link className="create-event-back" href="/dashboard#events"><span aria-hidden="true">‹</span> Etkinlikler</Link>
      <div className="create-event-heading">
        <p className="eyebrow">YENİ ETKİNLİK</p>
        <h1>Yeni bir etkinlik oluşturun</h1>
        <p>Önce gerekli olanları tamamlayın. Ayrıntıları Etkinlik Bilgileri bölümünde istediğiniz zaman değiştirebilirsiniz.</p>
      </div>
      <span className="draft-status"><i aria-hidden="true"/> Taslak</span>
    </header>

    <nav className="create-event-progress" aria-label="Etkinlik oluşturma adımları">
      <ol>{steps.map((item, index) => <li key={item.label} className={index === step ? 'active' : index < furthestStep || index < step ? 'done' : ''}>
        <button type="button" disabled={index > furthestStep} onClick={() => goToStep(index)} aria-current={index === step ? 'step' : undefined}>
          <span>{index < furthestStep ? '✓' : index + 1}</span>
          <b>{item.label}</b>
        </button>
      </li>)}</ol>
      <div className="create-event-progress-bar"><span style={{ width: `${((step + 1) / steps.length) * 100}%` }}/></div>
    </nav>

    <div className="create-event-workspace">
      <form className="wizard-card create-event-form" onSubmit={submit}>
        <div className="wizard-intro">
          <p className="step-counter">ADIM {step + 1} / {steps.length}</p>
          <h2>{steps[step].title}</h2>
          <p>{steps[step].description}</p>
        </div>

        {step === 0 && <div className="create-step-fields">
          <section className="smart-import-hero">
            <div><p className="eyebrow">OTOMATİK DOLDUR</p><h3>Duyuru metninden doldurun</h3><p>Elinizdeki duyuru metnini yapıştırın; başlık, tarih, saat, yer, bağlantı ve kontenjan bilgilerini alanlara yerleştirelim.</p></div>
            <textarea autoFocus value={text} onChange={event => setText(event.target.value)} placeholder="Elinizdeki duyuru metnini buraya yapıştırın…" rows={6}/>
            <button type="button" className="primary" disabled={busy || text.length < 20} onClick={extract}>{busy ? 'Bilgiler bulunuyor…' : 'Otomatik doldur'}<span aria-hidden="true">→</span></button>
            {importedCount > 0 && <span className="import-result"><b>✓ {importedCount} bilgi bulundu</b><small>Alanları aşağıdan kontrol edebilirsiniz.</small></span>}
          </section>
          <div className="manual-entry-divider"><span>veya bilgileri elle girin</span></div>
          <label className={`event-title-field${needsReview('title')?' needs-review':''}`}><span className="field-heading">Etkinlik adı <small>Zorunlu</small>{needsReview('title')&&<em>Kontrol edin</em>}</span><input required minLength={2} maxLength={160} value={form.title} onChange={event => set('title', event.target.value)} placeholder="Örn. Gençlik ve İklim Buluşması"/></label>
          <label className={needsReview('summary')?'needs-review':''}><span className="field-heading">Kısa açıklama <small>{form.summary.length}/300</small>{needsReview('summary')&&<em>Kontrol edin</em>}</span><textarea maxLength={300} rows={3} value={form.summary} onChange={event => set('summary', event.target.value)} placeholder="Etkinliğinizi tek, açık bir cümleyle anlatın."/></label>
          <details className="optional-panel">
            <summary><span><b>Ayrıntılı açıklama</b><small>Program, hedef kitle veya önemli notlar ekleyin</small></span><i aria-hidden="true">＋</i></summary>
            <div className="optional-panel-body"><MarkdownEditor value={form.description} onChange={value => set('description', value)} placeholder="Programı, hedef kitleyi ve katılımcıların bilmesi gerekenleri yazın." rows={8}/></div>
          </details>
        </div>}

        {step === 1 && <div className="create-step-fields">
          <fieldset className={`format-fieldset${needsReview('format')?' needs-review':''}`}><legend>Etkinlik biçimi {needsReview('format')&&<em>Kontrol edin</em>}</legend><div className="segmented-control">
            {(['OFFLINE', 'ONLINE', 'HYBRID'] as EventFormat[]).map(value => <label key={value} className={form.format === value ? 'selected' : ''}><input type="radio" name="format" checked={form.format === value} onChange={() => set('format', value)}/><span>{formatLabels[value]}</span></label>)}
          </div></fieldset>
          <div className="date-card-grid">
            <label className={needsReview('startsAt')?'needs-review':''}><span className="field-heading">Başlangıç <small>Zorunlu</small>{needsReview('startsAt')&&<em>Kontrol edin</em>}</span><div className="datetime-inputs"><input required aria-label="Başlangıç tarihi" type="date" value={form.startsAt.slice(0, 10)} onChange={event => set('startsAt', `${event.target.value}T${form.startsAt.slice(11, 16) || '10:00'}`)}/><input aria-label="Başlangıç saati" type="time" value={form.startsAt.slice(11, 16) || '10:00'} onChange={event => set('startsAt', `${form.startsAt.slice(0, 10) || toLocalDateInputValue(new Date())}T${event.target.value}`)}/></div></label>
            <label className={needsReview('endsAt')?'needs-review':''}><span className="field-heading">Bitiş <small>Zorunlu</small>{needsReview('endsAt')&&<em>Kontrol edin</em>}</span><div className="datetime-inputs"><input required aria-label="Bitiş tarihi" type="date" value={form.endsAt.slice(0, 10)} onChange={event => set('endsAt', `${event.target.value}T${form.endsAt.slice(11, 16) || '18:00'}`)}/><input aria-label="Bitiş saati" type="time" value={form.endsAt.slice(11, 16) || '18:00'} onChange={event => set('endsAt', `${form.endsAt.slice(0, 10) || toLocalDateInputValue(new Date())}T${event.target.value}`)}/></div></label>
          </div>
          <div className="quick-date-row"><span>Hızlı seçim</span><button type="button" onClick={() => { const date = new Date(); date.setDate(date.getDate() + 7); const value = toLocalDateInputValue(date); setForm(current => ({ ...current, startsAt: `${value}T10:00`, endsAt: `${value}T18:00` })); }}>Önümüzdeki hafta</button><button type="button" onClick={() => { const date = new Date(); date.setMonth(date.getMonth() + 1); const value = toLocalDateInputValue(date); setForm(current => ({ ...current, startsAt: `${value}T10:00`, endsAt: `${value}T18:00` })); }}>Önümüzdeki ay</button></div>
          {form.format !== 'ONLINE' && <div className="location-fields"><label className={needsReview('venueName')?'needs-review':''}><span className="field-heading">Mekân adı <small>İsteğe bağlı</small>{needsReview('venueName')&&<em>Kontrol edin</em>}</span><input value={form.venueName} onChange={event => set('venueName', event.target.value)} placeholder="Örn. İstanbul Planlama Ajansı"/></label><label className={needsReview('venueAddress')?'needs-review':''}><span className="field-heading">Adres <small>İsteğe bağlı</small>{needsReview('venueAddress')&&<em>Kontrol edin</em>}</span><input value={form.venueAddress} onChange={event => set('venueAddress', event.target.value)} placeholder="Açık adres"/></label></div>}
          {form.format !== 'OFFLINE' && <label className={needsReview('onlineLink')?'needs-review':''}><span className="field-heading">Çevrim içi katılım bağlantısı <small>İsteğe bağlı</small>{needsReview('onlineLink')&&<em>Kontrol edin</em>}</span><input type="url" value={form.onlineLink} onChange={event => set('onlineLink', event.target.value)} placeholder="https://…"/><small className="field-note important">Bağlantıyı daha sonra da ekleyebilirsiniz. Yalnızca yetkili katılımcılarla paylaşın.</small></label>}
          <details className="optional-panel">
            <summary><span><b>Etkinlik bağlantısı</b><small>/events/{organization.slug}/{form.slug || autoSlug()}</small></span><i aria-hidden="true">＋</i></summary>
            <div className="optional-panel-body"><label><span className="field-heading">Bağlantı kısa adı</span><div className="slug-preview"><input required pattern="[a-z0-9-]+" value={form.slug} onChange={event => set('slug', event.target.value)} placeholder={autoSlug()}/><button type="button" onClick={() => set('slug', autoSlug())}>Otomatik doldur</button></div></label></div>
          </details>
        </div>}

        {step === 2 && <div className="create-step-fields">
          <fieldset className="registration-fieldset"><legend>Başvurular nasıl alınsın?</legend><div className="choice-grid registration-choices">
            <label className={form.registrationMode === 'APPROVAL' ? 'selected' : ''}><input type="radio" name="registrationMode" checked={form.registrationMode === 'APPROVAL'} onChange={() => set('registrationMode', 'APPROVAL')}/><span className="choice-mark" aria-hidden="true">✓</span><b>Başvuru onayı</b><small>Her başvuruyu siz değerlendirirsiniz.</small><em>Önerilen</em></label>
            <label className={form.registrationMode === 'DIRECT' ? 'selected' : ''}><input type="radio" name="registrationMode" checked={form.registrationMode === 'DIRECT'} onChange={() => set('registrationMode', 'DIRECT')}/><span className="choice-mark" aria-hidden="true">✓</span><b>Otomatik kabul</b><small>Başvurular kontenjan dolana kadar kabul edilir.</small></label>
          </div></fieldset>
          <label className="capacity-field"><span><b>Kontenjan</b><small>Etkinliğe kabul edilecek en fazla kişi sayısı</small></span><div><input required min="1" type="number" inputMode="numeric" value={form.capacity} onChange={event => set('capacity', Number(event.target.value))}/><span>kişi</span></div></label>
          <label className="select-row"><span><b>Görünürlük</b><small>Etkinliği kimlerin bulabileceğini seçin</small></span><select value={form.visibility} onChange={event => set('visibility', event.target.value)}><option value="PUBLIC">Herkese açık</option><option value="LINK_ONLY">Bağlantıya sahip olanlar</option><option value="INVITE_ONLY">Yalnız davetliler</option></select></label>
          <div className="privacy-note"><span aria-hidden="true">i</span><p><b>Kişisel verileri ölçülü tutun.</b> Özel nitelikli bilgi gerekiyorsa katılımcıları ayrıca aydınlatın. Onam metnini Etkinlik Bilgileri → Kayıt Formu bölümünden düzenleyebilirsiniz.</p></div>
        </div>}

        {step === 3 && <div className="create-step-fields review-step">
          <section className="creation-appearance">
            <div className="creation-appearance-heading"><div><p className="eyebrow">İSTEĞE BAĞLI</p><h3>Sayfa görünümü</h3><p>Bu adımı boş bırakabilir ve daha sonra tamamlayabilirsiniz.</p></div><span>Atlanabilir</span></div>
            <label className="creation-cover-upload"><span>{coverPreview?<img src={coverPreview} alt="Seçilen kapak görseli"/>:<b>16:9</b>}</span><div><strong>{coverFile?coverFile.name:'Kapak görseli ekleyin'}</strong><small>PNG, JPG veya WebP · en fazla 15 MB</small><em>{coverFile?'Görseli değiştir':'Görsel seç'}</em></div><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseCover}/></label>
            <fieldset className="creation-color-field"><legend>Vurgu rengi</legend><div>{colorChoices.map(color=><button type="button" key={color.value} title={color.label} aria-label={`${color.label} rengini seç`} aria-pressed={accentColor===color.value} className={accentColor===color.value?'selected':''} style={{backgroundColor:color.value}} onClick={()=>setAccentColor(color.value)}/>)}</div></fieldset>
          </section>
          <dl className="review-list">
            <div><dt>Etkinlik</dt><dd>{form.title}</dd><button type="button" onClick={() => goToStep(0)}>Düzenle</button></div>
            <div><dt>Zaman</dt><dd>{form.startsAt ? `${formatDateTime(form.startsAt)} – ${formatDateTime(form.endsAt)}` : 'Seçilmedi'}</dd><button type="button" onClick={() => goToStep(1)}>Düzenle</button></div>
            <div><dt>Yer</dt><dd>{formatLabels[form.format]} · {previewLocation}</dd><button type="button" onClick={() => goToStep(1)}>Düzenle</button></div>
            <div><dt>Kayıt</dt><dd>{form.registrationMode === 'APPROVAL' ? 'Başvuru onayı' : 'Otomatik kabul'} · {form.capacity} kişi</dd><button type="button" onClick={() => goToStep(2)}>Düzenle</button></div>
            <div><dt>Görünürlük</dt><dd>{visibilityLabels[form.visibility]}</dd><button type="button" onClick={() => goToStep(2)}>Düzenle</button></div>
          </dl>
          <p className="draft-explainer"><span aria-hidden="true">●</span><span><b>Etkinlik taslak olarak oluşturulur.</b> Sonraki ekranda kayıt formu, SSS ve diğer özellikleri isteğe bağlı olarak tamamlayabilirsiniz.</span></p>
        </div>}

        {message && <p className="notice create-event-notice" role="status">{message}</p>}
        <div className="wizard-actions">
          {step > 0 && <button type="button" className="secondary" onClick={() => goToStep(step - 1)}>Geri</button>}
          <button className="primary" disabled={busy}>{busy ? 'Oluşturuluyor…' : step === 3 ? 'Etkinliği oluştur' : 'Devam et'}<span aria-hidden="true">{step === 3 ? '✓' : '→'}</span></button>
        </div>
      </form>

      <aside className="create-preview-shell" aria-label="Etkinlik sayfası canlı önizlemesi">
        <div className="create-preview-label"><span><i aria-hidden="true"/> CANLI ÖNİZLEME</span><small>Katılımcı görünümü</small></div>
        <div className="create-event-preview" aria-live="polite" style={{'--create-accent':accentColor} as React.CSSProperties}>
          <div className={`create-preview-cover${coverPreview?' has-image':''}`}>{coverPreview&&<img src={coverPreview} alt=""/>}<span className="preview-registration-badge">TASLAK ÖNİZLEMESİ</span><div className="preview-date-card"><b>{form.startsAt ? new Date(form.startsAt).getDate() : '—'}</b><span>{form.startsAt ? new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(new Date(form.startsAt)).replace('.', '') : 'Tarih'}</span></div></div>
          <div className="create-preview-body">
            <div className="create-preview-org"><b>{organizationInitial}</b><span>{organization.name}</span></div>
            <h2>{form.title || 'Etkinlik adınız'}</h2>
            <p>{form.summary || 'Kısa açıklamanız burada görünecek ve katılımcılara etkinliğinizi anlatacak.'}</p>
            <div className="create-preview-facts"><article><small>TARİH VE SAAT</small><b>{previewDate}</b><span>{previewTime}</span></article><article><small>KATILIM</small><b>{previewLocation}</b><span>{formatLabels[form.format]}</span></article></div>
            <button type="button" tabIndex={-1}>Kayıt ol <span>→</span></button>
          </div>
        </div>
        <p className="create-preview-note"><span aria-hidden="true">i</span> Bu önizleme yalnızca size görünür. Etkinlik oluşturulduğunda kayıt formu kapalı kalır.</p>
      </aside>
    </div>
  </main>;
}
