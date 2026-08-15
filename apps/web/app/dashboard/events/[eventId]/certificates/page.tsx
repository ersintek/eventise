import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CertificateManager } from './certificate-manager';

async function api<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login');
  if (!response.ok) throw new Error('Sertifika bilgileri alınamadı.');
  return response.json();
}

export default async function CertificatesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const { eventId } = await params;
  const organizations = await api<Array<{ id: string; name: string }>>('organizations', token);
  if (!organizations.length) redirect('/onboarding');
  const organization = organizations[0];
  const events = await api<Array<{ id: string; title: string; startsAt: string }>>(`organizations/${organization.id}/events`, token);
  const event = events.find(item => item.id === eventId);
  if (!event) redirect('/dashboard');
  const [templates, summary] = await Promise.all([
    api<any[]>(`organizations/${organization.id}/events/${eventId}/certificate-templates`, token),
    api<{ checkedIn: number }>(`organizations/${organization.id}/events/${eventId}/reports/summary`, token),
  ]);
  return <main className="builder-shell">
    <div className="workspace-page-heading"><div><p className="eyebrow">ETKİNLİK SONRASI</p><h2>Sertifikalar</h2><p>Katılım sertifikanızı hazırlayın ve katılanlara birkaç adımda ulaştırın.</p></div></div>
    <CertificateManager organizationId={organization.id} organizationName={organization.name} eventId={eventId} eventName={event.title} eventDate={event.startsAt} eligibleCount={summary.checkedIn} initialTemplates={templates}/>
  </main>;
}
