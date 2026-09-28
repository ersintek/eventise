'use client';
import{FormEvent,useEffect,useState}from'react';import Link from'next/link';
import{formatDateLong,formatDateTime}from'@/lib/datetime';
type History={id:string;title:string;startsAt:string;timezone:string;period:'CURRENT'|'UPCOMING'|'PAST';organization:{name:string}};type Certificate={id:string;verificationCode:string;downloadUrl:string;event:{title:string;organization:{name:string}}};type Application={id:string;title:string;startsAt:string;timezone:string;applicationStatus:'SUBMITTED'|'PENDING'|'ACCEPTED'|'WAITLISTED'|'REJECTED';organization:{name:string}};type Modules={assessments:any[];emailSurveys:any[];feedback:any[];games:any[];resources:any[];notifications:any[]};
const periodLabel={CURRENT:'Şimdi',UPCOMING:'Yaklaşan',PAST:'Geçmiş'},order={CURRENT:0,UPCOMING:1,PAST:2};
const applicationLabel={SUBMITTED:'Başvuruda',PENDING:'Başvuruda',ACCEPTED:'Onaylandı',WAITLISTED:'Yedekte',REJECTED:'Reddedildi'};
function StarRating({value,onChange}:{value:number;onChange:(v:number)=>void}){const[hover,setHover]=useState(0);return <div className="star-rating" onMouseLeave={()=>setHover(0)}>{[1,2,3,4,5].map(n=><button type="button" key={n} className={`star ${(hover||value)>=n?'filled':''}`} onClick={()=>onChange(n)} onMouseEnter={()=>setHover(n)}>★</button>)}</div>}
function AssessmentTasks({assessments,send}:{assessments:any[];send:(path:string,body:object)=>Promise<void>}){return <>{assessments.map(assessment=>{const previous=assessment.submissions[0]?.answers??{};const answered=Boolean(assessment.submissions.length);return <form className="participant-task" key={assessment.id} onSubmit={event=>{event.preventDefault();const values=new FormData(event.currentTarget),answers=Object.fromEntries((assessment.schema.questions??[]).map((question:any)=>question.type==='multiple'?[question.id,values.getAll(question.id)]:[question.id,values.get(question.id)]));void send('participant/assessments/'+assessment.id+'/submissions',{answers})}}><h4>{assessment.title}</h4>{answered&&<p className="friendly-status">Önceki yanıtlarınız aşağıda. Etkinlik başlamadan güncelleyebilirsiniz.</p>}{(assessment.schema.questions??[]).map((question:any)=><div key={question.id} className="test-question"><label>{question.label}</label>{question.type==='text'?<input name={question.id} required defaultValue={String(previous[question.id]??'')}/>:question.type==='multiple'?(question.options??[]).map((option:string,index:number)=><label key={index} className="test-option"><input type="checkbox" name={question.id} value={option} defaultChecked={Array.isArray(previous[question.id])&&previous[question.id].includes(option)}/> {option}</label>):<div>{(question.options??[]).map((option:string,index:number)=><label key={index} className="test-option"><input type="radio" name={question.id} value={option} required defaultChecked={previous[question.id]===option}/> {option}</label>)}</div>}</div>)}<button className="primary">{answered?'Yanıtlarımı güncelle':'Testi gönder'}</button></form>})}</>}

/** Liste sayfası: her etkinlik bir kart + link */
export function ParticipantList({history,certificates,showEvents=true}:{history:History[];certificates:Certificate[];showEvents?:boolean}){
  if(showEvents&&!history.length&&!certificates.length)return <section className="empty-state participant-empty"><span className="empty-illustration">✦</span><h2>Henüz bir etkinliğiniz yok</h2><p>Bir etkinliğe kabul edildiğinizde bütün bilgiler burada görünecek.</p></section>;
  return <>{showEvents&&<section className="participant-events"><div className="section-heading"><div><p className="eyebrow">ETKİNLİKLER</p><h2>Katılımlarınız</h2></div><span>{history.length} etkinlik</span></div>{[...history].sort((a,b)=>order[a.period]-order[b.period]).map(event=><Link href={'/participant/event/'+event.id} key={event.id} className="participant-event-link"><span className={'pill '+(event.period==='CURRENT'?'live':'')}>{periodLabel[event.period]}</span><div><h3>{event.title}</h3><small>{event.organization.name}</small><p>{formatDateLong(event.startsAt,event.timezone)}</p></div><span className="event-arrow">→</span></Link>)}</section>}<section className="certificate-section"><div className="section-heading"><div><p className="eyebrow">BELGELER</p><h2>Sertifikalarım</h2></div></div>{certificates.length===0?<p className="friendly-status">Henüz sertifikanız yok.</p>:<div className="certificate-grid">{certificates.map(c=> <article key={c.id}><span>✓</span><div><b>{c.event.title}</b><p>{c.event.organization.name}</p><a href={c.downloadUrl}>PDF indir</a><a href={'/certificates/'+c.verificationCode}>Doğrula</a></div></article>)}</div>}</section></>;
}

export function ParticipantApplicationList({applications}:{applications:Application[]}){
  if(!applications.length)return null;
  return <section className="participant-events participant-applications"><div className="section-heading"><div><p className="eyebrow">BAŞVURULARIN</p><h2>Etkinlik durumların</h2></div><span>{applications.length} başvuru</span></div>{applications.map(application=>{const accepted=application.applicationStatus==='ACCEPTED';const content=<><span className={'pill application-status '+application.applicationStatus.toLowerCase()}>{applicationLabel[application.applicationStatus]}</span><div><h3>{application.title}</h3><small>{application.organization.name}</small><p>{formatDateLong(application.startsAt,application.timezone)}</p>{accepted&&<small className="application-access">Etkinlik alanına girebilirsin.</small>}</div>{accepted&&<span className="event-arrow">→</span>}</>;return accepted?<Link href={'/participant/event/'+application.id} key={application.id} className="participant-event-link">{content}</Link>:<article key={application.id} className="participant-event-link participant-event-static" aria-label={`${application.title}: ${applicationLabel[application.applicationStatus]}`}>{content}</article>})}</section>;
}

/** Tek olay sayfası: modüller otomatik yüklenir + yenile */
export function ParticipantArea({eventId,title,orgName,startsAt,timezone,venueName,venueAddress,publicEventHref,certificates}:{eventId:string;title:string;orgName:string;startsAt:string;timezone:string;venueName?:string;venueAddress?:string;publicEventHref?:string;certificates:Certificate[]}){
  const[message,setMessage]=useState(''),[current,setCurrent]=useState<Modules|null>(null),[reveals,setReveals]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[ratings,setRatings]=useState<Record<string,number>>({}),[refreshKey,setRefreshKey]=useState(0);
  useEffect(()=>{load()},[eventId,refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(){setBusy(true);const response=await fetch('/api/backend/participant/events/'+eventId+'/modules'),data=await response.json();setBusy(false);if(response.ok){setCurrent(data);for(const notice of data.notifications.filter((item:any)=>!item.readAt))void fetch('/api/backend/notifications/'+notice.id+'/read',{method:'PATCH'})}else setMessage(Array.isArray(data.message)?data.message.join(' '):data.message)}
  async function send(path:string,body:object){const response=await fetch('/api/backend/'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),data=await response.json();setMessage(response.ok?'Yanıtınız kaydedildi.':(Array.isArray(data.message)?data.message.join(' '):data.message));if(response.ok)await load()}
  async function upload(event:FormEvent<HTMLFormElement>){event.preventDefault();const values=new FormData(event.currentTarget),file=values.get('photo')as File;if(!file)return;setMessage('Fotoğraf yükleniyor…');const grantResponse=await fetch('/api/backend/participant/events/'+eventId+'/photos/upload',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:file.name,contentType:file.type,sizeBytes:file.size})}),grant=await grantResponse.json();if(!grantResponse.ok){setMessage(grant.message);return}const uploaded=await fetch(String(grant.uploadUrl).replace('/api/','/api/backend/'),{method:'PUT',headers:{'content-type':file.type},body:file});if(!uploaded.ok){setMessage('Yüklenemedi.');return}await send('participant/events/'+eventId+'/photos/confirm',{assetId:grant.assetId,reservationId:grant.reservationId,caption:values.get('caption')})}

  // bekleyen görev sayıları
  const pendingAssessments=current?current.assessments.filter(x=>!x.submissions.length):[];
  const pendingEmailSurveys=current?current.emailSurveys.filter(x=>!x.submittedAt):[];
  const pendingFeedback=current?current.feedback.filter(x=>!x.submissions.length):[];
  const pendingGames=current?current.games.filter(x=>x.status==='OPEN'&&!x.responses.length):[];
  const unreadNotifications=current?current.notifications.filter((n:any)=>!n.readAt):[];
  const totalPending=pendingAssessments.length+pendingEmailSurveys.length+pendingFeedback.length+pendingGames.length;

  // ilk bekleyen blok varsayılan açık olsun
  const firstOpenKey=current?.assessments.length?'assessments':current?.emailSurveys.length?'email-surveys':pendingFeedback.length?'feedback':pendingGames.length?'games':unreadNotifications.length?'notifications':'';

  const fmtDate=(value:string)=>formatDateTime(value,timezone);

  return <>
    <div className="participant-event-toolbar">
      <div>
        <p className="eyebrow">ETKİNLİK ALANIN</p>
        <h3>{title}</h3>
        <small>{orgName}</small>
        <p>{fmtDate(startsAt)}</p>
      </div>
      <button className="refresh-btn" onClick={()=>setRefreshKey(k=>k+1)} disabled={busy} title="Yenile" aria-label="Etkinlik içeriğini yenile">{busy?'…':'↻'}</button>
    </div>

    {(venueName||venueAddress||publicEventHref)&&<section className="participant-event-details" aria-label="Etkinlik bilgileri">
      {(venueName||venueAddress)&&<div className="participant-event-detail"><span aria-hidden="true">⌖</span><div><small>ETKİNLİK ADRESİ</small><b>{venueName||'Etkinlik mekânı'}</b>{venueAddress&&<><p>{venueAddress}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`} target="_blank" rel="noopener noreferrer">Haritada aç ↗</a></>}</div></div>}
      {publicEventHref&&<Link className="participant-public-event-link" href={publicEventHref}>Etkinlik başvuru sayfası <span>→</span></Link>}
    </section>}

    {totalPending>0&&<p className="participant-summary"><b>Şu anda {totalPending} yapman gereken iş var.</b> Önce aşağıdaki görevleri tamamla; ardından etkinlik duyurularını ve dosyalarını inceleyebilirsin.</p>}

    {message&&<p className="notice">{message}</p>}

    {!current&&<p className="friendly-status">Etkinlik içeriği yükleniyor…</p>}
    {current&&totalPending===0&&current.notifications.length===0&&current.resources.length===0&&current.emailSurveys.length===0&&certificates.length===0&&<p className="friendly-status">Etkinlik içeriği henüz hazır değil.</p>}

    {current&&(totalPending>0||current.notifications.length>0||current.resources.length>0||current.games.length>0||current.assessments.length>0||current.emailSurveys.length>0||current.feedback.length>0)&&(
      <div className="participant-modules">

        {current.assessments.length>0&&(
          <details className="module-block" open={firstOpenKey==='assessments'}>
            <summary><span className="module-icon">01</span> {current.assessments[0]?.kind==='PRE_TEST'?'Ön test':'Son test'}{pendingAssessments.length>0&&<span className="module-count">{pendingAssessments.length}</span>}</summary>
            <div className="module-body">
              <AssessmentTasks assessments={current.assessments} send={send}/>
            </div>
          </details>
        )}

        {current.emailSurveys.length>0&&(
          <details className="module-block" open={firstOpenKey==='email-surveys'}>
            <summary><span className="module-icon">02</span> Beklenti anketleri{pendingEmailSurveys.length>0&&<span className="module-count">{pendingEmailSurveys.length}</span>}</summary>
            <div className="module-body">
              {current.emailSurveys.map(survey=><form className="participant-task" key={survey.id} onSubmit={event=>{event.preventDefault();const values=new FormData(event.currentTarget),answers=Object.fromEntries((survey.questions??[]).map((question:any)=>[question.id,String(values.get(question.id)??'')]));void send(`participant/events/${eventId}/email-surveys/${survey.id}/responses`,{answers})}}><h4>{survey.title}</h4>{survey.submittedAt&&<p className="friendly-status">Daha önce yanıt verdiniz. Önceki yanıtlarınız gösterilmez; isterseniz yeni yanıt gönderebilirsiniz.</p>}{(survey.questions??[]).map((question:any)=><label className="test-question" key={question.id}>{question.label}<textarea name={question.id} rows={4}/></label>)}<button className="primary">Yanıtları gönder</button></form>)}
            </div>
          </details>
        )}

        {pendingFeedback.length>0&&(
          <details className="module-block" open={firstOpenKey==='feedback'}>
            <summary><span className="module-icon">02</span> Etkinliği değerlendir{pendingFeedback.length>0&&<span className="module-count">{pendingFeedback.length}</span>}</summary>
            <div className="module-body">
              {pendingFeedback.map(f=>{const questions=(f.schema?.questions??[]);return<form className="participant-task" key={f.id} onSubmit={e=>{e.preventDefault();const values=new FormData(e.currentTarget),answers=Object.fromEntries(questions.map((q:any)=>{if(q.type==='number'){const r=ratings[f.id+'_'+q.id]||0;if(!r){setMessage('Lütfen '+q.label+' için puan verin.');return['__invalid__',null]}return[q.id,r]}if(q.type==='textarea')return[q.id,String(values.get(q.id)??'')];return[q.id,String(values.get(q.id)??'')]}));if(answers['__invalid__']!==undefined)return;delete answers['__invalid__'];void send('participant/feedback/'+f.id+'/submissions',{answers,anonymous:false})}}><h4>{f.title}</h4>{questions.length===0&&<p className="friendly-status">Bu formda soru bulunmuyor.</p>}{questions.map((q:any)=><div key={q.id} className="test-question"><label>{q.label}</label>{q.type==='number'?<StarRating value={ratings[f.id+'_'+q.id]||0} onChange={v=>setRatings(r=>({...r,[f.id+'_'+q.id]:v}))}/>:q.type==='textarea'?<textarea name={q.id} required placeholder="Yanıtınız…"/>:<input name={q.id} required placeholder="Yanıtınız…"/>}</div>)}<button className="primary">Gönder</button></form>})}
            </div>
          </details>
        )}

        {current.games.length>0&&(
          <details className="module-block" open={firstOpenKey==='games'}>
            <summary><span className="module-icon">03</span> Etkinlik etkinliği{pendingGames.length>0&&<span className="module-count">{pendingGames.length}</span>}</summary>
            <div className="module-body">
              {current.games.map(game=><article className="participant-task" key={game.id}><h5>{game.title}</h5>{game.status==='OPEN'&&!game.responses.length&&<form onSubmit={e=>{e.preventDefault();void send('game-sessions/'+game.id+'/responses',{promptKey:'answer',answer:new FormData(e.currentTarget).get('answer')})}}><p>{game.assignments[0]?.prompt}</p><input name="answer" required placeholder="Yanıtınız…"/><button className="primary">Gönder</button></form>}{game.status==='OPEN'&&game.responses.length>0&&<p>Yanıtınız alındı. Gösterim başlayınca göreceksiniz.</p>}{game.status==='REVEAL'&&<><button className="primary" onClick={async()=>{const r=await fetch('/api/backend/game-sessions/'+game.id+'/reveal'),d=await r.json();if(r.ok)setReveals(v=>({...v,[game.id]:d.answer}))}}>Kartı aç</button>{reveals[game.id]&&<blockquote>{reveals[game.id]}</blockquote>}</>}</article>)}
            </div>
          </details>
        )}

        {current.notifications.length>0&&(
          <details className="module-block" open={firstOpenKey==='notifications'}>
            <summary><span className="module-icon">04</span> Yeni gelişmeler{unreadNotifications.length>0&&<span className="module-count">{unreadNotifications.length}</span>}</summary>
            <div className="module-body">
              {current.notifications.map(n=><article className={'participant-notice'+(n===current.notifications[0]?' featured':'')} key={n.id}><b>{n.title}</b><small>{fmtDate(n.createdAt)}</small><p>{n.body}</p></article>)}
            </div>
          </details>
        )}

        {current.resources.length>0&&(
          <details className="module-block">
            <summary><span className="module-icon">05</span> Etkinlik dosyaları ve bağlantıları</summary>
            <div className="module-body">
              {current.resources.map(r=>{const url=r.url??r.externalUrl;return <span className="resource-link" key={r.id}>{url?<a href={url} target="_blank" rel="noopener noreferrer">{r.title} <small>{r.kind==='FILE'?'İndir':'Aç'} →</small></a>:<><span className="pill">{r.title}</span><small>Dosya henüz kullanılamıyor</small></>}</span>})}
            </div>
          </details>
        )}

        <details className="module-block">
          <summary><span className="module-icon">06</span> Fotoğraf paylaş</summary>
          <div className="module-body">
            <form onSubmit={upload} className="participant-photo-form"><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required/><input name="caption" placeholder="Açıklama (opsiyonel)"/><button className="primary">Gönder</button></form>
          </div>
        </details>

      </div>
    )}

    {certificates.length>0&&(
      <details className="module-block">
        <summary><span className="module-icon">07</span> Belgelerin<span className="module-count">{certificates.length}</span></summary>
        <div className="module-body">
          <div className="certificate-grid">{certificates.map(c=><article key={c.id}><span>✓</span><div><b>{c.event.title}</b><a href={c.downloadUrl}>PDF indir</a></div></article>)}</div>
        </div>
      </details>
    )}
  </>;
}
