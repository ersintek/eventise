import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardTwoNav } from '../components/dashboard-two-nav';

export default async function DashboardTwoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login/organization');
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/organizations`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login/organization');
  const organizations = response.ok ? await response.json() as Array<{ id: string; name: string; requiresOrganizationTerms?: boolean }> : [];
  if (!organizations.length) redirect('/organization/access');
  if (organizations[0].requiresOrganizationTerms) redirect(`/legal/organization?organizationId=${organizations[0].id}`);
  return <main className="dashboard-two-shell"><DashboardTwoNav organization={organizations[0]}/><div className="dashboard-two-main">{children}</div></main>;
}
