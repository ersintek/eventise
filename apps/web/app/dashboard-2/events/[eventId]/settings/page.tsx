import { EventWorkspace } from '../../../../dashboard/events/[eventId]/event-workspace';
import { loadEventData } from '../../../../dashboard/events/[eventId]/event-data';

export default async function DashboardTwoPlan({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ subtab?: string }> }) {
  const { eventId } = await params; const { subtab } = await searchParams;
  const { organization, event, registrations, forms, templates, consents, reminders } = await loadEventData(eventId);
  return <main className="builder-shell"><div className="dashboard-two-section-heading"><p className="eyebrow">PLANLA</p><h2>Etkinliği hazırla</h2><p>Etkinlik detaylarını, başvuru biçimini ve katılımcıların göreceği sayfayı burada düzenle.</p></div><EventWorkspace organization={organization} event={event} initialRegistrations={registrations} forms={forms} templates={templates} consents={consents} initialReminders={reminders} section="settings" initialSubtab={subtab ?? 'info'} basePath={`/dashboard-2/events/${eventId}`}/></main>;
}
