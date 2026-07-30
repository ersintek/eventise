'use client';import{FormEvent,useEffect,useState}from'react';import{useRouter}from'next/navigation';import Link from 'next/link';
export function CheckInActions({eventToken,magic,loggedInEmail}:{eventToken:string;magic?:string;loggedInEmail?:string}){
  const router=useRouter(),[message,setMessage]=useState(magic?'Bağlantınız doğrulanıyor…':''),[email,setEmail]=useState(''),[busy,setBusy]=useState(false);
  async function go(eventId:string){await router.push(`/participant/event/${eventId}`)}
  async function confirmMagic(token:string){try{const r=await fetch(`/api/check-in/${eventToken}/confirm-magic`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token})});const data=await r.json();if(r.ok&&data.eventId){setMessage(data.alreadyConfirmed?'Katılımınız daha önce teyit edilmişti. Etkinlik alanına yönlendiriliyorsunuz…':'Teyit edildi! Etkinlik alanına yönlendiriliyorsunuz…');await go(data.eventId)}else setMessage(data.message??'Bağlantı geçersiz, kullanılmış veya süresi dolmuş.')}catch{setMessage('Bağlantı kurulamadı. Lütfen yeniden deneyin.')}}
  useEffect(()=>{if(magic)void confirmMagic(magic)},[magic]);
  async function account(){setBusy(true);setMessage('');try{const r=await fetch(`/api/backend/check-in/${eventToken}/confirm-account`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});const data=await r.json();if(r.ok&&data.eventId){setMessage(data.alreadyConfirmed?'Katılımınız daha önce teyit edilmişti. Etkinlik alanına yönlendiriliyorsunuz…':'Teyit edildi! Etkinlik alanına yönlendiriliyorsunuz…');await go(data.eventId)}else{setMessage(data.message??'Hesabınızda bu etkinlik için kabul edilmiş kayıt bulunamadı.')}}catch{setMessage('Bağlantı kurulamadı. Lütfen yeniden deneyin.')}finally{setBusy(false)}}
  async function request(e:FormEvent){e.preventDefault();setBusy(true);setMessage('');try{const r=await fetch(`/api/check-in/${eventToken}/request-link`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});const data=await r.json().catch(()=>({}));setMessage(r.ok?'Kayıtlıysa tek kullanımlık bağlantı e-postanıza gönderildi.':data.message??'İstek tamamlanamadı.')}catch{setMessage('Bağlantı kurulamadı. Lütfen yeniden deneyin.')}finally{setBusy(false)}}
  return <div className="check-in-actions">
    {loggedInEmail?<>
      <button className="primary" onClick={account} disabled={busy}>{busy?'Teyit ediliyor…':`${loggedInEmail} olarak teyit ver`}</button>
      <div className="separator">veya başka hesapla</div>
      <Link className="secondary link-button" href="/login">Hesap değiştir →</Link>
    </>:<>
      <div className="hint-box">Teyit vermek için giriş yapın veya e-posta ile tek kullanımlık bağlantı alın.</div>
      <Link className="primary link-button" href="/login">Giriş yap / Kaydol</Link>
    </>}
    <div className="separator">veya</div>
    <form onSubmit={request}><label>Kayıt e-postanız<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="ornek@email.com"/></label><button className="secondary" disabled={busy}>Tek kullanımlık bağlantı gönder</button></form>
    {message&&<p className="notice" role="status">{message}</p>}
  </div>;
}
