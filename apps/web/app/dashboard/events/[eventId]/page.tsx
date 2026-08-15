import { redirect } from 'next/navigation';

export default async function EventDashboard({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(`/dashboard/events/${eventId}/settings?subtab=info`);
}
