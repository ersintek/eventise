'use client';
import Link from 'next/link';import{FormEvent,useState}from'react';import{useRouter}from'next/navigation';

type Intent='organizer'|'participant';

export default function RegisterPage(){
  const router=useRouter(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[intent,setIntent]=useState<Intent|''>('');
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const data=Object.fromEntries(new FormData(e.currentTarget));const r=await fetch('/api/session/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});setBusy(false);if(!r.ok){setError((await r.json()).message??'Hesap oluşturulamadı.');return}router.push(intent==='participant'?'/participant':'/onboarding');router.refresh()}
  return <main className="auth-shell">
    <section className="auth-brand"><div className="logo"><b>e</b>eventise</div><div><span>ÜCRETSİZ TIER 1</span><h1>Topluluğunuzu<br/><em>birlikte büyütün.</em></h1><p>20 aktif etkinlik, etkinlik başına 500 katılımcı ve güçlü operasyon araçları.</p></div></section>
    <section className="auth-panel">
      {!intent?<>
        <div className="auth-card intent-choice">
          <p className="eyebrow">HESAP OLUŞTUR</p>
          <h2>Nasıl devam edelim?</h2>
          <p className="intent-subtitle">Size uygun olanı seçin; istediğiniz zaman değiştirebilirsiniz.</p>
          <button type="button" className="intent-card" onClick={()=>setIntent('organizer')}>
            <span className="intent-icon">🏛️</span>
            <div><b>STK olarak katıl</b><small>Etkinlik oluşturun, katılımcıları yönetin, kurumunuzu büyütün.</small></div>
            <span className="intent-arrow">→</span>
          </button>
          <button type="button" className="intent-card" onClick={()=>setIntent('participant')}>
            <span className="intent-icon">🎟️</span>
            <div><b>Etkinliklere katıl</b><small>Kayıt olun, etkinlik günü içeriklere erişin, sertifikanızı alın.</small></div>
            <span className="intent-arrow">→</span>
          </button>
          <p className="auth-link">Zaten hesabınız var mı? <Link href="/login">Giriş yapın</Link></p><p className="auth-link"><Link href="/yardim">STK'lar için rehber →</Link></p>
        </div>
      </>:<>
        <form className="auth-card" onSubmit={submit}>
          <p className="eyebrow">{intent==='organizer'?'STK HESABI':'KATILIMCI HESABI'}</p>
          <h2>{intent==='organizer'?'STK olarak kaydolun':'Etkinliklere katılmak için kaydolun'}</h2>
          <div className="two"><label>Ad<input name="firstName" required minLength={2}/></label><label>Soyad<input name="lastName" required minLength={2}/></label></div>
          <label>E-posta<input name="email" type="email" required/></label>
          <label>Şifre<input name="password" type="password" required minLength={12}/><small>En az 12 karakter; büyük/küçük harf ve rakam.</small></label>
          {error&&<p className="error">{error}</p>}
          <button className="primary" disabled={busy}>{busy?'Oluşturuluyor…':'Hesabımı oluştur'}</button>
          <button type="button" className="intent-back" onClick={()=>setIntent('')}>← Farklı bir seçenek ara</button>
        </form>
      </>}
    </section>
  </main>;
}
