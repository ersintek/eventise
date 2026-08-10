import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppNav, MobileTopBar } from '../../components/navigation';
import { ContactForm } from '../about/contact-form';

export const metadata: Metadata = { title: 'İletişim — Eventise' };

async function api<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (response.status === 401) redirect('/login');
  if (!response.ok) throw new Error('Bilgiler alınamadı.');
  return response.json();
}

export default async function ContactPage() {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');

  const [organizations, me] = await Promise.all([
    api<Array<{ id: string; name: string; memberships?: Array<{ role?: string }> }>>('organizations', token),
    api<{ systemRole?: string }>('auth/me', token),
  ]);
  if (!organizations.length && me.systemRole !== 'SYSTEM_ADMIN') redirect('/organization/access');
  const organization = organizations[0] ?? { name: 'Eventise', memberships: [{ role: 'SYSTEM_ADMIN' }] };

  return <main className="app-shell">
    <AppNav organization={organization} active="contact" systemAdmin={me.systemRole === 'SYSTEM_ADMIN'}/>
    <section className="dashboard contact-page">
      <MobileTopBar/>
      <header className="page-heading contact-heading">
        <div>
          <p className="eyebrow">YARDIM VE DESTEK</p>
          <h1>İletişim</h1>
          <p>Sorularınızı, önerilerinizi ve iş birliği fikirlerinizi doğrudan ekibimize iletin.</p>
        </div>
      </header>

      <section className="contact-card">
        <div className="contact-card-copy">
          <span className="contact-badge">Size kulak veriyoruz</span>
          <h2>Birlikte konuşalım</h2>
          <p>Mesajınızı aşağıdaki formdan gönderin. Yanıtımız hesabınızdaki e-posta adresine gelecek.</p>
          <div className="contact-guidance">
            <strong>Bu formu ne zaman kullanmalısınız?</strong>
            <ul>
              <li>Eventise hakkında bir sorunuz olduğunda</li>
              <li>Bir öneri veya iş birliği fikri paylaşmak istediğinizde</li>
              <li>Ekibimize genel bir konuda ulaşmak istediğinizde</li>
            </ul>
          </div>
        </div>
        <ContactForm organizationId={organizations[0]?.id} sourcePage="/dashboard/contact"/>
      </section>

      <aside className="contact-help-note">
        <span aria-hidden="true">i</span>
        <div>
          <strong>Teknik bir sorun mu yaşıyorsunuz?</strong>
          <p>Bulunduğunuz ekranın bilgilerini de iletebilmemiz için soldaki <b>Sorun bildir</b> seçeneğini kullanın. Kullanım adımları için <Link href="/yardim">rehbere göz atabilirsiniz</Link>.</p>
        </div>
      </aside>
    </section>
  </main>;
}
