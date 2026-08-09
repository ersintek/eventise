import Link from 'next/link';

type GatewayProps = { entry: 'login' | 'register' };

export function AuthGateway({ entry }: GatewayProps) {
  const isLogin = entry === 'login';
  return <main className="auth-shell auth-gateway-shell">
    <section className="auth-brand">
      <div className="logo"><b>e</b>eventise</div>
      <div>
        <span>DOĞRU ALANA, İLK ADIMDAN</span>
        <h1>Etkinliğe katılın<br />veya ekibinizle<br /><em>etki yaratın.</em></h1>
        <p>Katılımcı ve STK işlemleri birbirinden ayrıdır. Size uygun alanı seçerek sade bir şekilde devam edin.</p>
      </div>
    </section>
    <section className="auth-panel">
      <div className="auth-card gateway-card">
        <p className="eyebrow">{isLogin ? 'GİRİŞ YAP' : 'HESAP OLUŞTUR'}</p>
        <h2>Hangi alan için devam ediyorsunuz?</h2>
        <p className="intent-subtitle">Tek bir Eventise hesabıyla iki alanı da kullanabilirsiniz. Bu seçim yalnızca sizi doğru ekrana yönlendirir.</p>
        <article className="gateway-option participant-option">
          <span className="intent-icon" aria-hidden="true">🎟️</span>
          <div><h3>Katılımcı</h3><p>Etkinliklere kaydolun, katılımlarınızı ve sertifikalarınızı görün.</p></div>
          <div className="gateway-actions">
            <Link className={isLogin ? 'primary link-button' : 'secondary link-button'} href="/login/participant">Giriş yap</Link>
            <Link className={!isLogin ? 'primary link-button' : 'secondary link-button'} href="/register/participant">Kayıt ol</Link>
          </div>
        </article>
        <article className="gateway-option organization-option">
          <span className="intent-icon" aria-hidden="true">🏛️</span>
          <div><h3>STK ekibi</h3><p>Bir kurum adına etkinlik oluşturun veya mevcut ekibinize katılın.</p></div>
          <div className="gateway-actions">
            <Link className={isLogin ? 'primary link-button' : 'secondary link-button'} href="/login/organization">STK girişi</Link>
            <Link className={!isLogin ? 'primary link-button' : 'secondary link-button'} href="/register/organization">STK kaydı</Link>
          </div>
        </article>
        <p className="auth-link"><Link href="/yardim">Kullanım rehberi →</Link></p>
      </div>
    </section>
  </main>;
}
