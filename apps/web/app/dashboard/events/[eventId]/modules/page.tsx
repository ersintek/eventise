import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ModuleManager } from './module-manager';

async function get(url: string, token: string) { const response = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' }); if (response.status === 401) redirect('/login'); return response.ok ? response.json() : []; }
export default async function Modules({ params }: { params: Promise<{ eventId: string }> }) {
  const token = (await cookies()).get('eventise_session')?.value; if (!token) redirect('/login');
  const base = `${process.env.API_INTERNAL_URL}/api`, organizations = await get(`${base}/organizations`, token) as Array<{ id: string }>;
  if (!organizations.length) redirect('/onboarding');
  const { eventId } = await params, organizationId = organizations[0].id;
  const [groups, games, assessments, feedback, features] = await Promise.all([
    get(`${base}/organizations/${organizationId}/events/${eventId}/groups`, token),
    get(`${base}/organizations/${organizationId}/events/${eventId}/games`, token),
    get(`${base}/organizations/${organizationId}/events/${eventId}/assessments`, token),
    get(`${base}/organizations/${organizationId}/events/${eventId}/feedback`, token),
    get(`${base}/organizations/${organizationId}/events/${eventId}/features`, token),
  ]);
  return <main className="builder-shell"><header><Link href={`/dashboard/events/${eventId}`}>← Başvurular</Link><div><p className="eyebrow">ETKİNLİK İÇİ</p><h1>Modül merkezi</h1></div></header><ModuleManager organizationId={organizationId} eventId={eventId} initialGroups={groups} initialGames={games} initialAssessments={assessments} initialFeedback={feedback} initialFeatures={features}/></main>;
}
