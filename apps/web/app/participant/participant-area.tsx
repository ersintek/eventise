'use client';
import{FormEvent,useEffect,useState}from'react';import Link from'next/link';
import{formatDateLong,formatDateTime}from'@/lib/datetime';
type History={id:string;title:string;startsAt:string;period:'CURRENT'|'UPCOMING'|'PAST';organization:{name:string}};type Certificate={id:string;verificationCode:string;downloadUrl:string;event:{title:string;organization:{name:string}}};type Modules={assessments:any[];feedback:any[];games:any[];resources:any[];notifications:any[]};
const periodLabel={CURRENT:'Şimdi',UPCOMING:'Yaklaşan',PAST:'Geçmiş'},order={CURRENT:0,UPCOMING:1,PAST:2};
function StarRating({value,onChange}:{value:number;onChange:(v:number)=>void}){const[hover,setHover]=useState(0);return <div className="star-rating" onMouseLeave={()=>setHover(0)}>{[1,2,3,4,5].map(n=><button type="button" key={n} className={`star ${(hover||value)>=n?'filled':''}`} onClick={()=>onChange(n)} onMouseEnter={()=>setHover(n)}>★</button>)}</div>}

/** Liste sayfası: her etkinlik bir kart + link */
export function ParticipantList({history,certificates}:{history:History[];certificates:Certificate[]}){
  if(!history.length&&!certificates.length)return <section className="empty-state participant-empty"><span className="empty-illustration">✦</span><h2>Henüz bir etkinliğiniz yok</h2><p>Bir etkinliğe kabul edildiğinizde bütün bilgiler burada görünecek.</p></section>;
  return <><section className="participant-events"><div className="section-heading"><div><p className="eyebrow">ETKİNLİKLER</p><h2>Katılımlarınız</h2></div><span>{history.length} etkinlik</span></div>{[...history].sort((a,b)=>order[a.period]-order[b.period]).map(event=><Link href={'/participant/event/'+event.id} key={event.id} className="participant-event-link"><span className={'pill '+(event.period==='CURRENT'?'live':'')}>{periodLabel[event.period]}</span><div><h3>{event.title}</h3><small>{event.organization.name}</small><p>{formatDateLong(event.startsAt)}</p></div><span className="event-arrow">→</span></Link>)}</section><section className="certificate-section"><div className="section-heading"><div><p className="eyebrow">BELGELER</p><h2>Sertifikalarım</h2></div></div>{certificates.length===0?<p className="friendly-status">Henüz sertifikanız yok.</p>:<div className="certificate-grid">{certificates.map(c=> <article key={c.id}><span>✓</span><div><b>{c.event.title}</b><p>{c.event.organization.name}</p><a href={c.downloadUrl}>PDF indir</a><a href={'/certificates/'+c.verificationCode}>Doğrula</a></div></article>)}</div>}</section></>;
}

/** Tek olay sayfası: modüller otomatik yüklenir + yenile */
export function ParticipantArea({eventId,title,orgName,startsAt,certificates}:{eventId:string;title:string;orgName:string;startsAt:string;certificates:Certificate[]}){
  const[message,setMessage]=useState(''),[current,setCurrent]=useState<Modules|null>(null),[reveals,setReveals]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[ratings,setRatings]=useState<Record<string,number>>({}),[refreshKey,setRefreshKey]=useState(0);
  useEffect(()=>{load()},[eventId,refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(){setBusy(true);const response=await fetch('/api/backend/participant/events/'+eventId+'/modules'),data=await response.json();setBusy(false);if(response.ok){setCurrent(data);for(const notice of data.notifications.filter((item:any)=>!item.readAt))void fetch('/api/backend/notifications/'+notice.id+'/read',{method:'PATCH'})}else setMessage(Array.isArray(data.message)?data.message.join(' '):data.message)}
  async function send(path:string,body:object){const response=await fetch('/api/backend/'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),data=await response.json();setMessage(response.ok?'Harika, yanıtınız kaydedildi.':(Array.isArray(data.message)?data.message.join(' '):data.message));if(response.ok)await load()}
  async function upload(event:FormEvent<HTMLFormElement>){event.preventDefault();const values=new FormData(event.currentTarget),file=values.get('photo')as File;if(!file)return;setMessage('Fotoğraf yükleniyor…');const grantResponse=await fetch('/api/backend/participant/events/'+eventId+'/photos/upload',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:file.name,contentType:file.type,sizeBytes:file.size})}),grant=await grantResponse.json();if(!grantResponse.ok){setMessage(grant.message);return}const uploaded=await fetch(String(grant.uploadUrl).replace('/api/','/api/backend/'),{method:'PUT',headers:{'content-type':file.type},body:file});if(!uploaded.ok){setMessage('Yüklenemedi.');return}await send('participant/events/'+eventId+'/photos/confirm',{assetId:grant.assetId,reservationId:grant.reservationId,caption:values.get('caption')})}

  // bekleyen görev sayıları
  const pendingAssessments=current?current.assessments.filter(x=>!x.submissions.length):[];
  const pendingFeedback=current?current.feedback.filter(x=>!x.submissions.length):[];
  const pendingGames=current?current.games.filter(x=>x.status==='OPEN'&&!x.responses.length):[];
  const unreadNotifications=current?current.notifications.filter((n:any)=>!n.readAt):[];
  const totalPending=pendingAssessments.length+pendingFeedback.length+pendingGames.length;

  // ilk bekleyen blok varsayılan açık olsun
  const firstOpenKey=pendingAssessments.length?'assessments':pendingFeedback.length?'feedback':pendingGames.length?'games':unreadNotifications.length?'notifications':'';

  const fmtDate=formatDateTime;

  return <>
    <div className="participant-event-toolbar">
      <div>
        <h3>{title}</h3>
        <small>{orgName}</small>
        <p>{fmtDate(startsAt)}</p>
      </div>
      <button className="refresh-btn" onClick={()=>setRefreshKey(k=>k+1)} disabled={busy} title="Yenile">{busy?'⏳':'🔄'}</button>
    </div>

    {totalPending>0&&<p className="participant-summary"><b>{totalPending} bekleyen görevin</b> var. Tamamlamak için aşağıdaki kartları aç.</p>}

    {message&&<p className="notice">{message}</p>}

    {!current&&<p className="friendly-status">Etkinlik içeriği yükleniyor…</p>}
    {current&&totalPending===0&&current.notifications.length===0&&current.resources.length===0&&certificates.length===0&&<p className="friendly-status">Etkinlik içeriği henüz hazır değil. 🎉</p>}

    {current&&(totalPending>0||current.notifications.length>0||current.resources.length>0||current.games.length>0||current.assessments.length>0||current.feedback.length>0)&&(
      <div className="participant-modules">

        {pendingAssessments.length>0&&(
          <details className="module-block" open={firstOpenKey==='assessments'}>
            <summary><span className="module-icon">📋</span> Testler{pendingAssessments.length>0&&<span className="module-count">{pendingAssessments.length}</span>}</summary>
            <div className="module-body">
              {pendingAssessments.map(a=><form className="participant-task" key={a.id} onSubmit={e=>{e.preventDefault();const values=new FormData(e.currentTarget),answers=Object.fromEntries((a.schema.questions??[]).map((q:any)=>{if(q.type==='multiple')return[q.id,values.getAll(q.id)];return[q.id,values.get(q.id)]}));void send('participant/assessments/'+a.id+'/submissions',{answers})}}><h4>{a.title}</h4>{(a.schema.questions??[]).map((q:any)=><div key={q.id} className="test-question"><label>{q.label}</label>{q.type==='text'?<input name={q.id} required/>:q.type==='multiple'?(q.options??[]).map((opt:string,oi:number)=><label key={oi} className="test-option"><input type="checkbox" name={q.id} value={opt}/> {opt}</label>):<div>{(q.options??[]).map((opt:string,oi:number)=><label key={oi} className="test-option"><input type="radio" name={q.id} value={opt} required/> {opt}</label>)}</div>}</div>)}<button className="primary">{a.kind==='POST_TEST'?'Son testi gönder':'Testi gönder'}</button></form>)}
            </div>
          </details>
        )}

        {pendingFeedback.length>0&&(
          <details className="module-block" open={firstOpenKey==='feedback'}>
            <summary><span className="module-icon">⭐</span> Geri Bildirim{pendingFeedback.length>0&&<span className="module-count">{pendingFeedback.length}</span>}</summary>
            <div className="module-body">
              {pendingFeedback.map(f=>{const questions=(f.schema?.questions??[]);return<form className="participant-task" key={f.id} onSubmit={e=>{e.preventDefault();const values=new FormData(e.currentTarget),answers=Object.fromEntries(questions.map((q:any)=>{if(q.type==='number'){const r=ratings[f.id+'_'+q.id]||0;if(!r){setMessage('Lütfen '+q.label+' için puan verin.');return['__invalid__',null]}return[q.id,r]}if(q.type==='textarea')return[q.id,String(values.get(q.id)??'')];return[q.id,String(values.get(q.id)??'')]}));if(answers['__invalid__']!==undefined)return;delete answers['__invalid__'];void send('participant/feedback/'+f.id+'/submissions',{answers,anonymous:false})}}><h4>{f.title}</h4>{questions.length===0&&<p className="friendly-status">Bu formda soru bulunmuyor.</p>}{questions.map((q:any)=><div key={q.id} className="test-question"><label>{q.label}</label>{q.type==='number'?<StarRating value={ratings[f.id+'_'+q.id]||0} onChange={v=>setRatings(r=>({...r,[f.id+'_'+q.id]:v}))}/>:q.type==='textarea'?<textarea name={q.id} required placeholder="Yanıtınız…"/>:<input name={q.id} required placeholder="Yanıtınız…"/>}</div>)}<button className="primary">Gönder</button></form>})}
            </div>
          </details>
        )}

        {current.games.length>0&&(
          <details className="module-block" open={firstOpenKey==='games'}>
            <summary><span className="module-icon">🎮</span> Tanışma Oyunu{pendingGames.length>0&&<span className="module-count">{pendingGames.length}</span>}</summary>
            <div className="module-body">
              {current.games.map(game=><article className="participant-task" key={game.id}><h5>{game.title}</h5>{game.status==='OPEN'&&!game.responses.length&&<form onSubmit={e=>{e.preventDefault();void send('game-sessions/'+game.id+'/responses',{promptKey:'answer',answer:new FormData(e.currentTarget).get('answer')})}}><p>{game.assignments[0]?.prompt}</p><input name="answer" required placeholder="Yanıtınız…"/><button className="primary">Gönder</button></form>}{game.status==='OPEN'&&game.responses.length>0&&<p>Yanıtınız alındı. Gösterim başlayınca göreceksiniz.</p>}{game.status==='REVEAL'&&<><button className="primary" onClick={async()=>{const r=await fetch('/api/backend/game-sessions/'+game.id+'/reveal'),d=await r.json();if(r.ok)setReveals(v=>({...v,[game.id]:d.answer}))}}>Kartı aç</button>{reveals[game.id]&&<blockquote>{reveals[game.id]}</blockquote>}</>}</article>)}
            </div>
          </details>
        )}

        {current.notifications.length>0&&(
          <details className="module-block" open={firstOpenKey==='notifications'}>
            <summary><span className="module-icon">📢</span> Duyurular{unreadNotifications.length>0&&<span className="module-count">{unreadNotifications.length}</span>}</summary>
            <div className="module-body">
              {current.notifications.map(n=><article className={'participant-notice'+(n===current.notifications[0]?' featured':'')} key={n.id}><b>{n.title}</b><small>{fmtDate(n.createdAt)}</small><p>{n.body}</p></article>)}
            </div>
          </details>
        )}

        {current.resources.length>0&&(
          <details className="module-block">
            <summary><span className="module-icon">📎</span> Dosyalar ve Bağlantılar</summary>
            <div className="module-body">
              {current.resources.map(r=><span className="resource-link" key={r.id}>{r.externalUrl?<a href={r.externalUrl} target="_blank" rel="noopener noreferrer">{r.title} →</a>:<><span className="pill">📎 {r.title}</span><small>Dosya</small></>}</span>)}
            </div>
          </details>
        )}

        <details className="module-block">
          <summary><span className="module-icon">📷</span> Fotoğraf Paylaş</summary>
          <div className="module-body">
            <form onSubmit={upload} className="participant-photo-form"><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required/><input name="caption" placeholder="Açıklama (opsiyonel)"/><button className="primary">Gönder</button></form>
          </div>
        </details>

      </div>
    )}

    {certificates.length>0&&(
      <details className="module-block">
        <summary><span className="module-icon">🎓</span> Sertifikalar<span className="module-count">{certificates.length}</span></summary>
        <div className="module-body">
          <div className="certificate-grid">{certificates.map(c=><article key={c.id}><span>✓</span><div><b>{c.event.title}</b><a href={c.downloadUrl}>PDF indir</a></div></article>)}</div>
        </div>
      </details>
    )}
  </>;
}
