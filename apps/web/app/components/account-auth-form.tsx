'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiciSignature } from './sici-signature';

type Context = 'participant' | 'organization';
type Action = 'login' | 'register';

const googleErrors: Record<string, string> = {
  'not-configured': 'Google ile giriş henüz yapılandırılmadı.',
  'invalid-state': 'Google giriş isteğinin süresi doldu. Lütfen yeniden deneyin.',
  'token-exchange': 'Google oturumu tamamlanamadı. Lütfen yeniden deneyin.',
  account: 'Google hesabı Eventise hesabına bağlanamadı.',
  'account-conflict': 'Bu e-posta başka bir Google hesabına bağlı. Daha önce kullandığınız Google hesabını seçin.',
  'account-inactive': 'Bu Eventise hesabı aktif değil. Destek ekibiyle iletişime geçin.',
  identity: 'Google oturumu doğrulanamadı. Lütfen hesabınızı yeniden seçip deneyin.',
  unavailable: 'Google ile giriş şu anda kullanılamıyor.',
};

export function AccountAuthForm({ context, action }: { context: Context; action: Action }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const isOrganization = context === 'organization';
  const isLogin = action === 'login';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('googleError');
    if (reason) setError(googleErrors[reason] ?? 'Google ile giriş tamamlanamadı.');
    if (params.get('invited') === '1') setNotice('Davetiniz bu e-posta adresine gönderildi. Hesabınız varsa giriş yapın; yoksa STK kaydı oluşturun.');
    if (params.get('googlePrompt') === 'choose') setNotice('Bu Google hesabıyla henüz bir Eventise hesabı yok. Devam etmek için hesabınızı oluşturun.');
  }, []);

  async function finish(destination: Context) {
    const legal = await fetch('/api/backend/legal/status').then((result) => result.ok ? result.json() : null).catch(() => null);
    if (destination === 'participant') {
      router.push(legal?.userTermsAccepted ? '/participant' : '/legal/accept?destination=participant');
      router.refresh();
      return;
    }
    const access = await fetch('/api/backend/organization-access').then((result) => result.ok ? result.json() : null).catch(() => null);
    const hasOrganization = Boolean(access?.organizations?.length);
    const target = hasOrganization ? '/dashboard' : '/organization/access';
    const legalDestination = hasOrganization ? 'dashboard' : 'organization';
    router.push(legal?.userTermsAccepted ? target : `/legal/accept?destination=${legalDestination}`);
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const response = await fetch(`/api/session/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? (isLogin ? 'Giriş yapılamadı.' : 'Hesap oluşturulamadı.'));
      return;
    }
    await finish(context);
  }

  const heading = isLogin
    ? isOrganization ? 'STK yönetim alanına giriş yapın' : 'Katılımcı alanına giriş yapın'
    : isOrganization ? 'STK ekip hesabınızı oluşturun' : 'Katılımcı hesabınızı oluşturun';

  return <main className="auth-shell">
    <section className={`auth-brand ${isOrganization ? 'organization-auth-brand' : 'participant-auth-brand'}`}>
      <div className="logo"><b>e</b>eventise</div>
      <div>
        <span>{isOrganization ? 'STK EKİP ALANI' : 'KATILIMCI ALANI'}</span>
        <h1>{isOrganization ? <>Ekibinizle<br />etkinlikleri<br /><em>birlikte yönetin.</em></> : <>Etkinliklerinizi<br />tek bir yerde<br /><em>takip edin.</em></>}</h1>
        <p>{isOrganization ? 'Kayıttan sonra kurum oluşturabilir veya yöneticinizin sizi kayıtlı e-posta adresinizle eklemesini bekleyebilirsiniz.' : 'Etkinlik kayıtlarınıza, programlarınıza ve sertifikalarınıza kolayca erişin.'}</p>
      </div>
      <SiciSignature className="auth-brand-foot" />
    </section>
    <section className="auth-panel"><form className="auth-card" onSubmit={submit}>
      <Link className="auth-context-link" href={isLogin ? '/login' : '/register'}>← Alan seçimine dön</Link>
      <p className="eyebrow">{isOrganization ? 'STK EKİBİ' : 'KATILIMCI'} · {isLogin ? 'GİRİŞ' : 'KAYIT'}</p>
      <h2>{heading}</h2>
      {notice && <p className="notice" role="status">{notice}</p>}
      <a className="google-button" href={`/api/session/google?destination=${context}&createAccount=${isLogin ? '0' : '1'}`}><span className="google-mark">G</span>Google ile {isLogin ? 'giriş yap' : 'devam et'}</a>
      <div className="auth-divider"><span>veya</span></div>
      {!isLogin && <div className="two"><label>Ad<input name="firstName" required minLength={2} autoComplete="given-name" /></label><label>Soyad<input name="lastName" required minLength={2} autoComplete="family-name" /></label></div>}
      <label>E-posta<input name="email" type="email" required autoComplete="email" /></label>
      <label>Şifre<input name="password" type="password" required minLength={isLogin ? undefined : 12} autoComplete={isLogin ? 'current-password' : 'new-password'} />{!isLogin && <small>En az 12 karakter; büyük/küçük harf ve rakam.</small>}</label>
      {isLogin && <p className="auth-forgot"><Link href="/forgot-password">Şifremi unuttum</Link></p>}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? isLogin ? 'Giriş yapılıyor…' : 'Oluşturuluyor…' : isLogin ? 'Giriş yap' : 'Hesabımı oluştur'}</button>
      <p className="auth-link">{isLogin ? <>Hesabınız yok mu? <Link href={`/register/${context}`}>Kayıt olun</Link></> : <>Zaten hesabınız var mı? <Link href={`/login/${context}`}>Giriş yapın</Link></>}</p>
    </form></section>
  </main>;
}
