import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function api<T>(path: string, token: string): Promise<T> {
  const r = await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (r.status === 401) redirect('/login');
  if (!r.ok) throw new Error('Etkinlik verileri alınamadı.');
  return r.json();
}
async function optional<T>(path: string, token: string, fallback: T): Promise<T> {
  try { return await api<T>(path, token); } catch { return fallback; }
}

export type EventData = {
  organization: any;
  event: any;
  registrations: any[];
  forms: any[];
  templates: any[];
  consents: any[];
  reminders: any[];
};

export async function loadEventData(eventId: string): Promise<EventData> {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const organizations = await api<any[]>('organizations', token);
  if (!organizations.length) redirect('/onboarding');
  const organization = organizations[0];
  const events = await api<any[]>(`organizations/${organization.id}/events`, token);
  const event = events.find((x: any) => x.id === eventId);
  if (!event) redirect('/dashboard');
  const [registrations, templates, consents, reminders] = await Promise.all([
    optional(`organizations/${organization.id}/events/${eventId}/registrations`, token, []),
    optional(`organizations/${organization.id}/email-templates`, token, []),
    optional(`public/event-consents/${eventId}`, token, []),
    optional(`organizations/${organization.id}/events/${eventId}/reminders`, token, []),
  ]);
  const forms = event.form ? [{ id: event.form.id, name: event.title + ' kayıt formu', versions: event.form.versions }] : [];
  return { organization, event, registrations, forms, templates, consents, reminders };
}
