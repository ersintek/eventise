import { AppNav } from '../../../components/navigation';
import { loadEventData } from './event-data';
import { EventWorkspaceHeader } from './workspace-header';
import { ProductTour } from '../../../components/product-tour';

export default async function EventLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ eventId: string }> }>) {
  const { eventId } = await params;
  const { organization, event } = await loadEventData(eventId);

  return <div className="app-shell event-app-shell">
    <AppNav organization={organization} active="events" compactDefault />
    <main className="event-workspace-shell">
      <EventWorkspaceHeader
        eventId={eventId}
        organizationId={organization.id}
        organizationSlug={organization.slug}
        organizationName={organization.name}
        title={event.title}
        eventSlug={event.slug}
        startsAt={event.startsAt}
        publicationStatus={event.publicationStatus}
        registrationStatus={event.registrationStatus}
        registrationCount={event._count?.registrations ?? 0}
      />
      <div className="event-workspace-content">{children}</div>
    </main>
    <ProductTour eventPath={`/dashboard/events/${eventId}`} />
  </div>;
}
