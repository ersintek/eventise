import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FeedbackManager } from './feedback-manager';
import { PostEventManager } from './post-event-manager';

type Summary = { registrations: number; accepted: number; checkedIn: number; attendanceRate: number; feedbackSubmissions: number };
type Comparison = { pre: { submissions: number; average: number | null }; post: { submissions: number; average: number | null }; improvement: number | null };

export default async function PostEventPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const { eventId } = await params;
  const { tab } = await searchParams;
  const api = `${process.env.API_INTERNAL_URL}/api`;
  const headers = { authorization: `Bearer ${token}` };
  const organizationResponse = await fetch(`${api}/organizations`, { headers, cache: 'no-store' });
  if (organizationResponse.status === 401) redirect('/login');
  const organizations = organizationResponse.ok ? await organizationResponse.json() as Array<{ id: string }> : [];
  if (!organizations.length) redirect('/onboarding');
  const organizationId = organizations[0].id;

  if (tab === 'feedback') {
    const [feedbackResponse, featuresResponse] = await Promise.all([
      fetch(`${api}/organizations/${organizationId}/events/${eventId}/feedback`, { headers, cache: 'no-store' }),
      fetch(`${api}/organizations/${organizationId}/events/${eventId}/features`, { headers, cache: 'no-store' }),
    ]);
    const feedback = feedbackResponse.ok ? await feedbackResponse.json() : [];
    const features = featuresResponse.ok ? await featuresResponse.json() as Array<{ key: string; enabled: boolean }> : [];
    return <main className="builder-shell"><div className="workspace-page-heading"><div><p className="eyebrow">ETKİNLİK SONRASI</p><h2>Geri Bildirim</h2><p>Katılımcıların etkinlik deneyimini değerlendirmesi için form oluşturun ve yanıtları takip edin.</p></div></div><FeedbackManager organizationId={organizationId} eventId={eventId} initialFeedback={feedback} initialFeatureEnabled={Boolean(features.find(feature => feature.key === 'feedback')?.enabled)}/></main>;
  }

  const [summaryResponse, comparisonResponse] = await Promise.all([
    fetch(`${api}/organizations/${organizationId}/events/${eventId}/reports/summary`, { headers, cache: 'no-store' }),
    fetch(`${api}/organizations/${organizationId}/events/${eventId}/assessments/comparison`, { headers, cache: 'no-store' }),
  ]);
  const summary: Summary = summaryResponse.ok ? await summaryResponse.json() : { registrations: 0, accepted: 0, checkedIn: 0, attendanceRate: 0, feedbackSubmissions: 0 };
  const comparison: Comparison = comparisonResponse.ok ? await comparisonResponse.json() : { pre: { submissions: 0, average: null }, post: { submissions: 0, average: null }, improvement: null };
  return <main className="builder-shell"><div className="workspace-page-heading"><div><p className="eyebrow">ETKİNLİK SONRASI</p><h2>Sonuçlar</h2><p>Başvuru, katılım teyidi, geri bildirim ve test sonuçlarını inceleyip raporlayın.</p></div></div><PostEventManager organizationId={organizationId} eventId={eventId} initialSummary={summary} comparison={comparison}/></main>;
}
