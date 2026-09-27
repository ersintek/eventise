import { EventWorkspace } from '../event-workspace';
import { loadEventData } from '../event-data';

export default async function EventCommunication({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ subtab?: string }> }) {
  const { eventId } = await params;
  const { subtab } = await searchParams;
  const { organization, event, registrations, forms, templates, consents, reminders, emailSurveys } = await loadEventData(eventId);
  return <main className="builder-shell">
    <EventWorkspace organization={organization} event={event} initialRegistrations={registrations} forms={forms} templates={templates} consents={consents} initialReminders={reminders} initialEmailSurveys={emailSurveys} section="communication" initialSubtab={subtab ?? 'invite'} />
  </main>;
}
