import { AppNav } from '../../../components/navigation';
import { loadEventData } from './event-data';
import { EventWorkspaceHeader } from './workspace-header';

export default async function EventLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ eventId: string }> }>) {
  const { eventId } = await params;
  const { organization, event } = await loadEventData(eventId);

  return <div className="app-shell event-app-shell">
    <AppNav organization={organization} active="events" />
    <main className="event-workspace-shell">
      <EventWorkspaceHeader
        eventId={eventId}
        organizationId={organization.id}
        organizationName={organization.name}
        title={event.title}
        startsAt={event.startsAt}
        publicationStatus={event.publicationStatus}
        registrationStatus={event.registrationStatus}
      />
      <div className="event-workspace-content">{children}</div>
    </main>
  </div>;
}
