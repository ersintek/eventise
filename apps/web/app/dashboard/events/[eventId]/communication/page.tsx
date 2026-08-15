import { EventWorkspace } from '../event-workspace';
import { loadEventData } from '../event-data';

export default async function EventCommunication({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ subtab?: string }> }) {
  const { eventId } = await params;
  const { subtab } = await searchParams;
  const { organization, event, registrations, forms, templates, consents, reminders } = await loadEventData(eventId);
  return <main className="builder-shell">
    <div className="workspace-page-heading"><div><p className="eyebrow">ETKİNLİK ÖNCESİ</p><h2>İletişim</h2><p>Katılımcıları davet edin; hatırlatma, duyuru ve e-posta metinlerini yönetin.</p></div></div>
    <EventWorkspace organization={organization} event={event} initialRegistrations={registrations} forms={forms} templates={templates} consents={consents} initialReminders={reminders} section="communication" initialSubtab={subtab ?? 'invite'} />
  </main>;
}
