import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SettingsManager } from '../../dashboard/settings/settings-manager';

async function api<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login/organization');
  if (!response.ok) throw new Error('Kurum bilgileri alınamadı.');
  return response.json();
}

export default async function DashboardTwoOrganization() {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login/organization');
  const [organizations, me] = await Promise.all([api<Array<{ id: string }>>('organizations', token), api<any>('auth/me', token)]);
  if (!organizations.length) redirect('/organization/access');
  const organizationId = organizations[0].id;
  const [organization, members, joinRequests, invitations] = await Promise.all([
    api<any>(`organizations/${organizationId}`, token),
    api<any[]>(`organizations/${organizationId}/members`, token),
    api<any[]>(`organizations/${organizationId}/join-requests`, token),
    api<any[]>(`organizations/${organizationId}/invitations`, token),
  ]);
  return <><header className="dashboard-two-section-heading"><p className="eyebrow">KURUM</p><h1>Kurum profili ve ekip</h1><p>Kurumunun katılımcılara görünen bilgilerini ve çalışma alanına erişen kişileri yönet.</p></header><SettingsManager organization={organization} members={members} joinRequests={joinRequests} invitations={invitations} me={me}/></>;
}
