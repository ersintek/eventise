'use client';
import { FormEvent, useMemo, useState } from 'react';
import { Applications } from './applications';

type EventInfo={id:string;title:string;slug:string;summary?:string;startsAt:string;endsAt:string;publicationStatus:string;registrationStatus:string;phase:string;visibility:string;registrationMode:string;capacity:number;_count:{registrations:number}};
type Registration={id:string;firstName:string;lastName:string;email:string;applicationStatus:string};
type FormInfo={id:string;name:string;versions:Array<{version:number;schema:{fields?:unknown[]}}>};
type Template={id:string;key:string;subject:string;body:string};
type Consent={definition:{id:string;title:string;versions:Array<{id:string;version:number;text:string}>};required:boolean};

async function request(path:string,options:RequestInit={}) {
  const response=await fetch(`/api/backend/${path}`,{...options,headers:{'content-type':'application/json',...(options.headers??{})}});
  const data=await response.json().catch(()=>({message:'İşlem tamamlanamadı.'}));
  if(!response.ok)throw new Error(Array.isArray(data.message)?data.message.join(' '):data.message);
  return data;
}

export function EventWorkspace({organization,event:initialEvent,initialRegistrations,forms,templates,consents}:{organization:{id:string;slug:string};event:EventInfo;initialRegistrations:unknown[];forms:unknown[];templates:unknown[];consents:unknown[]}) {
  const[event,setEvent]=useState(initialEvent),[tab,setTab]=useState<'overview'|'applications'|'forms'|'communication'>('overview'),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const publicUrl=`/events/${organization.slug}/${event.slug}`;
  const typedForms=forms as FormInfo[],typedTemplates=templates as Template[],typedConsents=consents as Consent[];
  const accepted=useMemo(()=>(initialRegistrations as Registration[]).filter(r=>r.applicationStatus==='ACCEPTED').length,[initialRegistrations]);
  async function run(action:()=>Promise<unknown>,success:string){setBusy(true);setNotice('');try{await action();setNotice(success)}catch(error){setNotice(error instanceof Error?error.message:'İşlem tamamlanamadı.')}finally{setBusy(false)}}
  async function state(publicationStatus:string,registrationStatus:string){await run(async()=>{await request(`organizations/${organization.id}/events/${event.id}/state`,{method:'PATCH',body:JSON.stringify({publicationStatus,registrationStatus})});setEvent(value=>({...value,publicationStatus,registrationStatus}))},'Etkinlik durumu güncellendi.');}
  async function invite(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget,email=String(new FormData(form).get('email'));await run(()=>request(`organizations/${organization.id}/events/${event.id}/invitations`,{method:'POST',body:JSON.stringify({email})}),'Davet oluşturuldu.');form.reset()}
  async function addConsent(e:FormEvent<HTMLFormElement>){e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));await run(async()=>{const consent=await request(`organizations/${organization.id}/consents`,{method:'POST',body:JSON.stringify({key:`event-${event.id}-${Date.now()}`,title:values.title,text:values.text})});await request(`organizations/${organization.id}/events/${event.id}/consents/${consent.id}`,{method:'PUT',body:JSON.stringify({required:true})})},'Zorunlu onam eklendi. Sayfayı yenilediğinizde listede görünecek.');e.currentTarget.reset()}
  async function reminder(e:FormEvent<HTMLFormElement>){e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));await run(()=>request(`organizations/${organization.id}/events/${event.id}/reminders`,{method:'POST',body:JSON.stringify({templateId:values.templateId,sendAt:new Date(String(values.sendAt)).toISOString()})}),'Hatırlatma planlandı.');e.currentTarget.reset()}
  return <>
    <nav className="workspace-tabs" aria-label="Etkinlik yönetimi bölümleri">
      <button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Genel bakış</button>
      <button className={tab==='applications'?'active':''} onClick={()=>setTab('applications')}>Başvurular ({initialRegistrations.length})</button>
      <button className={tab==='forms'?'active':''} onClick={()=>setTab('forms')}>Form ve onam</button>
      <button className={tab==='communication'?'active':''} onClick={()=>setTab('communication')}>Davet ve iletişim</button>
    </nav>
    {notice&&<p className="notice" role="status">{notice}</p>}
    {tab==='overview'&&<section className="workspace-grid">
      <article className="workspace-card"><p className="eyebrow">DURUM</p><h2>Yayın ve kayıt</h2><div className="status-row"><span className="pill">{event.publicationStatus}</span><span className="pill">{event.registrationStatus}</span><span className="pill">{event.phase}</span></div><p>{new Intl.DateTimeFormat('tr-TR',{dateStyle:'long',timeStyle:'short'}).format(new Date(event.startsAt))}</p><div className="action-links"><button disabled={busy} onClick={()=>state('PUBLISHED','OPEN')}>Yayınla ve kaydı aç</button><button disabled={busy} onClick={()=>state('PUBLISHED','CLOSED')}>Kaydı kapat</button><button disabled={busy} onClick={()=>state('UNPUBLISHED','CLOSED')}>Yayından kaldır</button></div></article>
      <article className="workspace-card"><p className="eyebrow">PAYLAŞIM</p><h2>Etkinlik sayfası</h2><p>Katılımcılar bu bağlantıdan etkinlik bilgilerini görür ve kayıt olur.</p><input readOnly value={publicUrl}/><div className="action-links"><a className="primary link-button" href={publicUrl} target="_blank">Sayfayı aç</a><button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}${publicUrl}`)}>Bağlantıyı kopyala</button></div></article>
      <article className="workspace-card"><p className="eyebrow">ÖZET</p><h2>Katılım görünümü</h2><div className="metric-grid"><div><span>Başvuru</span><b>{initialRegistrations.length}</b></div><div><span>Kabul</span><b>{accepted}</b></div><div><span>Kontenjan</span><b>{event.capacity}</b></div></div></article>
      <article className="workspace-card"><p className="eyebrow">KURALLAR</p><h2>Etkinlik ayarları</h2><dl><dt>Görünürlük</dt><dd>{event.visibility}</dd><dt>Kayıt modeli</dt><dd>{event.registrationMode}</dd><dt>Kayıt formu</dt><dd>{typedForms[0]?.name??'Standart form'}</dd></dl></article>
    </section>}
    {tab==='applications'&&<Applications organizationId={organization.id} initial={initialRegistrations as Registration[]}/>} 
    {tab==='forms'&&<section className="workspace-grid"><article className="workspace-card"><h2>Kayıt formları</h2>{typedForms.length?typedForms.map(form=><div className="list-row" key={form.id}><div><b>{form.name}</b><small>Sürüm {form.versions[0]?.version??1} · {form.versions[0]?.schema?.fields?.length??0} alan</small></div></div>):<p>Henüz form bulunmuyor.</p>}</article><form className="workspace-card" onSubmit={addConsent}><h2>Zorunlu onam ekle</h2><label>Başlık<input name="title" required placeholder="KVKK ve fotoğraf izni"/></label><label>Onam metni<textarea name="text" required minLength={20}/></label><button className="primary" disabled={busy}>Onamı ekle</button></form><article className="workspace-card"><h2>Etkinlik onamları</h2>{typedConsents.length?typedConsents.map(item=><div className="list-row" key={item.definition.id}><div><b>{item.definition.title}</b><small>Sürüm {item.definition.versions[0]?.version} · {item.required?'Zorunlu':'İsteğe bağlı'}</small></div></div>):<p>Bu etkinlikte onam bulunmuyor.</p>}</article></section>}
    {tab==='communication'&&<section className="workspace-grid"><form className="workspace-card" onSubmit={invite}><h2>Katılımcı davet et</h2><label>E-posta<input name="email" type="email" required/></label><button className="primary" disabled={busy}>Davet oluştur</button><small>Davetli etkinliklerde yalnızca davet edilen hesaplar kayıt olabilir.</small></form><form className="workspace-card" onSubmit={reminder}><h2>Hatırlatma planla</h2><label>Şablon<select name="templateId" required>{typedTemplates.map(t=><option value={t.id} key={t.id}>{t.key} — {t.subject}</option>)}</select></label><label>Gönderim zamanı<input name="sendAt" type="datetime-local" required/></label><button className="primary" disabled={busy}>Hatırlatmayı planla</button><small>Bir etkinlik için en fazla iki hatırlatma planlanabilir.</small></form><article className="workspace-card wide"><h2>E-posta şablonları</h2><p>Hazır şablonlar kurumunuza özel oluşturuldu. Gerçek SMTP bağlandığında kabul, ret ve hatırlatma iletileri buradan gönderilecek.</p><div className="template-list">{typedTemplates.map(t=><div className="list-row" key={t.id}><div><b>{t.key}</b><small>{t.subject}</small></div></div>)}</div></article></section>}
  </>;
}
