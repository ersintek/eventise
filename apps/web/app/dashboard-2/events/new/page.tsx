import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EventBuilder } from '../../../dashboard/events/new/event-builder';

export default async function NewDashboardTwoEvent() {
  const token = (await cookies()).get('eventise_session')?.value;
  if (!token) redirect('/login');
  const headers = { authorization: `Bearer ${token}` };
  const response = await fetch(`${process.env.API_INTERNAL_URL}/api/organizations`, { headers, cache: 'no-store' });
  if (!response.ok) redirect('/login');
  const organizations = await response.json() as Array<{ id: string; slug: string; name: string; memberships?: Array<{ role?: string }> }>;
  if (!organizations.length) redirect('/onboarding');
  return <EventBuilder organization={organizations[0]} afterCreateBase="/dashboard-2/events" />;
}
