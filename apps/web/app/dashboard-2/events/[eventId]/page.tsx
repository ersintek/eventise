import { redirect } from 'next/navigation';

export default async function DashboardTwoEvent({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(`/dashboard-2/events/${eventId}/settings?subtab=info`);
}
