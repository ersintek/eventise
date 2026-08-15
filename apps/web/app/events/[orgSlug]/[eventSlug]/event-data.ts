import { cookies } from 'next/headers';
import type { RegistrationField } from './registration-form';

export interface EventData {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string;
  format: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  venueName: string | null;
  venueAddress: string | null;
  capacity: number;
  registrationStatus: string;
  registrationMode: string;
  visibility: 'PUBLIC' | 'LINK_ONLY' | 'INVITE_ONLY';
  accentColor: string;
  coverImageUrl: string | null;
  organization: { name: string; slug: string; description: string | null; website: string | null; logoUrl: string | null };
  faqs: Array<{ id: string; question: string; answer: string }>;
}

type Consent = { required: boolean; definition: { title: string; versions: Array<{ id: string; text: string }> } };
type Session = { user: { email: string; firstName: string; lastName: string }; registration: { applicationStatus: string } | null } | null;

export async function getPublicEvent(orgSlug: string, eventSlug: string): Promise<EventData | null> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/public/events/${orgSlug}/${eventSlug}`, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Etkinlik bilgileri alınamadı.');
  return response.json();
}

export async function getRegistrationContext(eventId: string): Promise<{ consents: Consent[]; fields: RegistrationField[]; formVersionId?: string; session: Session }> {
  const base = `${process.env.API_INTERNAL_URL}/api`;
  const [consentResponse, formResponse] = await Promise.all([
    fetch(`${base}/public/event-consents/${eventId}`, { cache: 'no-store' }),
    fetch(`${base}/public/event-forms/${eventId}`, { cache: 'no-store' }),
  ]);
  const consents = consentResponse.ok ? await consentResponse.json() as Consent[] : [];
  const form = formResponse.ok ? await formResponse.json() as { id?: string; schema: { fields?: RegistrationField[] } } : { schema: { fields: [] } };
  const token = (await cookies()).get('eventise_session')?.value;
  let session: Session = null;
  if (token) {
    try {
      const response = await fetch(`${base}/participant/events/${eventId}/registration`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (response.ok) session = await response.json();
    } catch { /* Misafir kayıt akışı kullanılabilir. */ }
  }
  return { consents, fields: form.schema.fields ?? [], formVersionId: form.id, session };
}
