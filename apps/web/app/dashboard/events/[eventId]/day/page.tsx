import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { FieldOperations } from './field-operations';

type Stats = { registered: number; checkedIn: number; remaining: number };
type RosterItem = { id: string; firstName: string; lastName: string; email: string; attendance: null | { status: string; confirmedAt: string; method: string } };
type Feature = { key: string; enabled: boolean };

async function json<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...init?.headers }, cache: 'no-store' });
  if (response.status === 401) redirect('/login');
  if (!response.ok) throw new Error('Saha verileri alınamadı.');
  return response.json();
}

export default async function EventDay({ params }: { params: Promise<{ eventId: string }> }) {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const base = `${process.env.API_INTERNAL_URL}/api`;
  const organizations = await json<Array<{ id: string }>>(`${base}/organizations`, token);
  if (!organizations.length) redirect('/onboarding');
  const organizationId = organizations[0].id;
  const { eventId } = await params;
  const activation = await json<{ eventToken: string }>(`${base}/organizations/${organizationId}/events/${eventId}/check-in/activate`, token, { method: 'POST', body: '{}' });
  const [stats, roster, features, events] = await Promise.all([
    json<Stats>(`${base}/organizations/${organizationId}/events/${eventId}/check-in/stats`, token),
    json<RosterItem[]>(`${base}/organizations/${organizationId}/events/${eventId}/check-in/roster`, token),
    json<Feature[]>(`${base}/organizations/${organizationId}/events/${eventId}/features`, token),
    json<Array<{ id: string; title: string }>>(`${base}/organizations/${organizationId}/events`, token),
  ]);
  const event = events.find(item => item.id === eventId);
  if (!event) redirect('/dashboard');
  const url = `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3001'}/check-in/${activation.eventToken}`;
  const qr = await QRCode.toDataURL(url, { width: 420, margin: 2, color: { dark: '#17493a', light: '#ffffff' } });
  return <main className="builder-shell"><div className="workspace-page-heading"><div><p className="eyebrow">ETKİNLİK SIRASINDA</p><h2>Katılım</h2><p>Kapı girişlerini, katılım teyidini ve kapıda kaydı yönetin.</p></div></div><section className="day-layout"><aside className="checkin-panel"><div><p className="eyebrow">KATILIM QR KODU</p><h2>Girişte okutun</h2><p>Katılımcı kodu okutup e-posta adresiyle girişini doğrular.</p></div><img src={qr} alt="Katılım teyidi QR kodu"/><details><summary>Bağlantıyı göster</summary><code>{url}</code></details></aside><FieldOperations organizationId={organizationId} eventId={eventId} initialStats={stats} initialRoster={roster} initialFeatures={features}/></section></main>;
}
