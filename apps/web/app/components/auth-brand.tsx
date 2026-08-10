import Link from 'next/link';

type AuthBrandProps = {
  context?: 'participant' | 'organization';
  title: React.ReactNode;
  description?: string;
};

export function AuthBrand({ context, title, description }: AuthBrandProps) {
  return <section className={`auth-brand${context ? ` ${context}-auth-brand` : ''}`}>
    <Link className="auth-sici-logo" href="/" aria-label="SİCİ ana sayfa">
      <img src="/brand/sici-logo.png" alt="SİCİ" />
    </Link>
    <div className="auth-brand-copy">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  </section>;
}
