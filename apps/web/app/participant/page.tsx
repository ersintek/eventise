import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ParticipantHub } from './participant-hub';

async function fetchJson(path: string, token: string) {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login');
  return response.ok ? response.json() : [];
}

export default async function ParticipantPage() {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const [history, upcomingEvents, certificates, me, follows, followingEvents, legal, notifications] = await Promise.all([
    fetchJson('participant/history', token),
    fetchJson('participant/upcoming-events', token),
    fetchJson('participant/certificates', token),
    fetchJson('auth/me', token),
    fetchJson('participant/follows', token),
    fetchJson('participant/following-events', token),
    fetchJson('legal/status', token),
    fetchJson('notifications', token),
  ]);
  const eventTasks = await Promise.all(
    history.filter((event: { period: string }) => event.period !== 'PAST').slice(0, 12).map(async (event: { id: string; title: string }) => {
      const modules = await fetchJson(`participant/events/${event.id}/modules`, token) as { assessments?: Array<{ submissions?: unknown[] }>; feedback?: Array<{ submissions?: unknown[] }>; games?: Array<{ status?: string; responses?: unknown[] }> };
      const pending = (modules.assessments ?? []).filter(item => !item.submissions?.length).length
        + (modules.feedback ?? []).filter(item => !item.submissions?.length).length
        + (modules.games ?? []).filter(item => item.status === 'OPEN' && !item.responses?.length).length;
      return { eventId: event.id, title: event.title, pending };
    }),
  );
  return <main className="participant-app-shell">
    <ParticipantHub me={me} history={history} upcomingEvents={upcomingEvents} certificates={certificates} initialFollows={follows} initialFollowingEvents={followingEvents} legal={legal} initialNotifications={notifications} eventTasks={eventTasks}/>
  </main>;
}
