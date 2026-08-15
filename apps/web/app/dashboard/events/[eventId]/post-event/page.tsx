import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PostEventManager } from './post-event-manager';

export default async function PostEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const api = `${process.env.API_INTERNAL_URL}/api`;
  const headers = { authorization: `Bearer ${token}` };
  const organizationResponse = await fetch(`${api}/organizations`, { headers, cache: 'no-store' });
  if (organizationResponse.status === 401) redirect('/login');
  const organizations = organizationResponse.ok ? await organizationResponse.json() as Array<{ id: string }> : [];
  if (!organizations.length) redirect('/onboarding');
  const { eventId } = await params;
  const organizationId = organizations[0].id;
  const [summaryResponse, photosResponse] = await Promise.all([
    fetch(`${api}/organizations/${organizationId}/events/${eventId}/reports/summary`, { headers, cache: 'no-store' }),
    fetch(`${api}/organizations/${organizationId}/events/${eventId}/photos`, { headers, cache: 'no-store' }),
  ]);
  return <main className="builder-shell">
    <div className="workspace-page-heading"><div><p className="eyebrow">ETKİNLİK SONRASI</p><h2>Sonuçlar</h2><p>Katılımı, geri bildirimleri, fotoğrafları ve paylaşılacak çıktıları yönetin.</p></div></div>
    <PostEventManager organizationId={organizationId} eventId={eventId} initialSummary={summaryResponse.ok ? await summaryResponse.json() : { registrations: 0, accepted: 0, checkedIn: 0, attendanceRate: 0, approvedPhotos: 0, feedbackSubmissions: 0 }} initialPhotos={photosResponse.ok ? await photosResponse.json() : []}/>
  </main>;
}
