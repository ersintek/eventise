import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppNav, MobileTopBar } from '../../components/navigation';

async function api<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (response.status === 401) redirect('/login');
  if (!response.ok) throw new Error('Bilgiler alınamadı.');
  return response.json();
}

export async function AboutShell({ activeTab, children }: { activeTab: 'about' | 'updates'; children: React.ReactNode }) {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const [organizations, me] = await Promise.all([api<any[]>('organizations', token), api<any>('auth/me', token)]);
  if (!organizations.length && me.systemRole !== 'SYSTEM_ADMIN') redirect('/participant');
  const organization = organizations[0] ?? { name: 'Eventise', memberships: [{ role: 'SYSTEM_ADMIN' }] };

  return <main className="app-shell">
    <AppNav organization={organization} active="about" systemAdmin={me.systemRole === 'SYSTEM_ADMIN'} />
    <section className="dashboard about-page">
      <MobileTopBar />
      <header className="page-heading about-heading">
        <div><p className="eyebrow">EVENTISE</p><h1>Eventise Hakkında</h1><p>Sivil toplumun etkinliklerini kolaylaştırmak için geliştiriyoruz.</p></div>
      </header>
      <nav className="about-tabs" aria-label="Eventise hakkında bölümleri">
        <Link className={activeTab === 'about' ? 'active' : ''} href="/dashboard/about">Hakkında</Link>
        <Link className={activeTab === 'updates' ? 'active' : ''} href="/dashboard/about/updates">Güncellemeler</Link>
      </nav>
      {children}
    </section>
  </main>;
}

export async function getOrganizationId() {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const organizations = await api<any[]>('organizations', token);
  return organizations[0]?.id as string | undefined;
}
