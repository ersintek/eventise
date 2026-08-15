import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ModuleManager } from './module-manager';

async function get(url: string, token: string) {
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login');
  return response.ok ? response.json() : [];
}

export default async function Modules({ params }: { params: Promise<{ eventId: string }> }) {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const api = `${process.env.API_INTERNAL_URL}/api`;
  const organizations = await get(`${api}/organizations`, token) as Array<{ id: string }>;
  if (!organizations.length) redirect('/onboarding');
  const { eventId } = await params;
  const organizationId = organizations[0].id;
  const [groups, games, assessments, feedback, features, roster, comparison] = await Promise.all([
    get(`${api}/organizations/${organizationId}/events/${eventId}/groups`, token),
    get(`${api}/organizations/${organizationId}/events/${eventId}/games`, token),
    get(`${api}/organizations/${organizationId}/events/${eventId}/assessments`, token),
    get(`${api}/organizations/${organizationId}/events/${eventId}/feedback`, token),
    get(`${api}/organizations/${organizationId}/events/${eventId}/features`, token),
    get(`${api}/organizations/${organizationId}/events/${eventId}/check-in/roster`, token),
    get(`${api}/organizations/${organizationId}/events/${eventId}/assessments/comparison`, token),
  ]);
  return <main className="builder-shell">
    <div className="workspace-page-heading"><div><p className="eyebrow">ETKİNLİK ÖNCESİ</p><h2>Araçlar</h2><p>Testleri, grupları, tanışma oyununu ve geri bildirim formunu hazırlayın.</p></div></div>
    <ModuleManager organizationId={organizationId} eventId={eventId} initialGroups={groups} initialGames={games} initialAssessments={assessments} initialFeedback={feedback} initialFeatures={features} roster={roster} initialComparison={comparison}/>
  </main>;
}
