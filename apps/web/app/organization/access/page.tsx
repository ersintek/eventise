import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OrganizationAccessPanel } from './access-panel';

export default async function OrganizationAccessPage() {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login/organization');
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/organization-access`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login/organization');
  if (!response.ok) throw new Error('STK erişim durumu alınamadı.');
  const access = await response.json();
  if (access.organizations?.length) redirect('/dashboard');
  return <OrganizationAccessPanel email={access.email} invitations={access.invitations ?? []} joinRequests={access.joinRequests ?? []} />;
}
