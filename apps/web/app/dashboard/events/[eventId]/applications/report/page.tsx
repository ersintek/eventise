import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApplicationsNav } from '../../applications-nav';
import { ApplicationsReport } from './report-client';

async function api<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login');
  if (!response.ok) throw new Error('Başvuru raporu alınamadı.');
  return response.json();
}

export default async function ApplicationReportPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const organizations = await api<Array<{ id: string }>>('organizations', token);
  if (!organizations.length) redirect('/onboarding');
  const organizationId = organizations[0].id;
  const [events, report] = await Promise.all([
    api<Array<{ id: string; title: string }>>(`organizations/${organizationId}/events`, token),
    api<ReportData>(`organizations/${organizationId}/events/${eventId}/reports/applications`, token),
  ]);
  const event = events.find(item => item.id === eventId);
  if (!event) redirect('/dashboard');
  return <main className="builder-shell"><div className="workspace-page-heading"><div><p className="eyebrow">BAŞVURU YÖNETİMİ</p><h2>Başvuru raporu</h2><p>Başvuru durumlarını ve form yanıtlarının dağılımını tek yerden inceleyin.</p></div><span className="heading-count">{report.totalRegistrations} başvuru</span></div><ApplicationsNav eventId={eventId} active="report"/><ApplicationsReport organizationId={organizationId} eventId={eventId} eventTitle={event.title} initial={report}/></main>;
}

export type ReportData = { totalRegistrations: number; byStatus: Array<{ status: string; count: number }>; questions: Array<{ key: string; label: string; kind: 'choice' | 'open'; responseCount: number; choices: Array<{ label: string; count: number }> }> };
