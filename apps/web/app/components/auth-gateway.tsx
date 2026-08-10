import Link from 'next/link';
import { AuthBrand } from './auth-brand';

type GatewayProps = { entry: 'login' | 'register' };

export function AuthGateway({ entry }: GatewayProps) {
  const isLogin = entry === 'login';
  return <main className="auth-shell auth-gateway-shell">
    <AuthBrand title={<>Etkinliklere katılın.<br />STK’nızı yönetin.</>} />
    <section className="auth-panel">
      <div className="auth-card gateway-card">
        <article className="gateway-option participant-option">
          <div><h2>Katılımcı</h2><p>Etkinlik kayıtlarınıza ve sertifikalarınıza erişin.</p></div>
          <Link className="primary link-button" href={`/${entry}/participant`}>
            {isLogin ? 'Katılımcı girişi' : 'Katılımcı hesabı oluştur'}
          </Link>
        </article>
        <article className="gateway-option organization-option">
          <div><h2>STK</h2><p>Kurumunuzun etkinliklerini ve ekibini yönetin.</p></div>
          <Link className="primary link-button" href={`/${entry}/organization`}>
            {isLogin ? 'STK girişi' : 'STK hesabı oluştur'}
          </Link>
        </article>
      </div>
    </section>
  </main>;
}
