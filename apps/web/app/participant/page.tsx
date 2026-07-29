import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppNav, MobileTopBar } from '../components/navigation';
import { ParticipantHub } from './participant-hub';

async function fetchJson(path: string, token: string) {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login');
  return response.ok ? response.json() : [];
}

export default async function ParticipantPage() {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const [history, upcomingEvents, certificates, organizations, me, follows, followingEvents, legal] = await Promise.all([
    fetchJson('participant/history', token),
    fetchJson('participant/upcoming-events', token),
    fetchJson('participant/certificates', token),
    fetchJson('organizations', token),
    fetchJson('auth/me', token),
    fetchJson('participant/follows', token),
    fetchJson('participant/following-events', token),
    fetchJson('legal/status', token),
  ]);
  const content = <section className={organizations.length ? 'dashboard participant-dashboard' : 'participant-shell'}>
    <MobileTopBar backHref="/participant" backLabel="Etkinliklerim"/>
    <ParticipantHub me={me} history={history} upcomingEvents={upcomingEvents} certificates={certificates} initialFollows={follows} initialFollowingEvents={followingEvents} legal={legal}/>
  </section>;
  return organizations.length
    ? <main className="app-shell"><AppNav organization={organizations[0]} active="participant" systemAdmin={me.systemRole === 'SYSTEM_ADMIN'}/>{content}</main>
    : <main>{content}</main>;
}
