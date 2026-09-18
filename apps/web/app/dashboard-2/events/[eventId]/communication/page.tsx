import { EventWorkspace } from '../../../../dashboard/events/[eventId]/event-workspace';
import { loadEventData } from '../../../../dashboard/events/[eventId]/event-data';

export default async function DashboardTwoParticipants({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ subtab?: string }> }) {
  const { eventId } = await params; const { subtab } = await searchParams;
  const { organization, event, registrations, forms, templates, consents, reminders } = await loadEventData(eventId);
  return <main className="builder-shell"><div className="dashboard-two-section-heading"><p className="eyebrow">KATILIMCILAR</p><h2>Katılımcılarla iletişim kur</h2><p>Kişileri davet et, hatırlatma planla ve etkinlikle ilgili duyuruları gönder.</p></div><EventWorkspace organization={organization} event={event} initialRegistrations={registrations} forms={forms} templates={templates} consents={consents} initialReminders={reminders} section="communication" initialSubtab={subtab ?? 'invite'} basePath={`/dashboard-2/events/${eventId}`}/></main>;
}
