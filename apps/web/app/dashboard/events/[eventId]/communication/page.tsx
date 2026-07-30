import { EventNav } from '../../../../components/navigation';
import { EventWorkspace } from '../event-workspace';
import { loadEventData } from '../event-data';

export default async function EventCommunication({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ subtab?: string }> }) {
  const { eventId } = await params;
  const { subtab } = await searchParams;
  const { organization, event, registrations, forms, templates, consents, reminders } = await loadEventData(eventId);
  return <main className="builder-shell">
    <header><div><p className="eyebrow">DAVET VE İLETİŞİM</p><h1>{event.title}</h1><p>Katılımcıları davet edin; hatırlatma, duyuru ve e-posta metinlerini yönetin.</p></div></header>
    <EventNav eventId={eventId} active="communication" />
    <EventWorkspace organization={organization} event={event} initialRegistrations={registrations} forms={forms} templates={templates} consents={consents} initialReminders={reminders} section="communication" initialSubtab={subtab ?? 'invite'} />
  </main>;
}
