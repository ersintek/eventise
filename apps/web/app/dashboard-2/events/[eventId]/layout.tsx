import { DashboardTwoEventHeader } from './event-header';
import { loadEventData } from '../../../dashboard/events/[eventId]/event-data';

export default async function DashboardTwoEventLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ eventId: string }> }>) {
  const { eventId } = await params;
  const { organization, event } = await loadEventData(eventId);
  return <><DashboardTwoEventHeader eventId={eventId} organizationId={organization.id} organizationSlug={organization.slug} eventSlug={event.slug} title={event.title} startsAt={event.startsAt} publicationStatus={event.publicationStatus} registrationStatus={event.registrationStatus}/>{children}</>;
}
