import { EventWorkspace } from '../event-workspace';
import { loadEventData } from '../event-data';

export default async function EventSettings({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ subtab?: string; created?: string; appearance?: string }> }) {
  const { eventId } = await params;
  const { subtab, created, appearance } = await searchParams;
  const { organization, event, registrations, forms, templates, consents, reminders } = await loadEventData(eventId);
  return <main className="builder-shell">
    {created === '1' && <div className={`route-flash ${appearance === 'failed' ? 'warning' : 'success'}`} role="status"><b>Etkinlik taslak olarak oluşturuldu.</b><span>{appearance === 'failed' ? 'Kapak görseli yüklenemedi; Başvuru Sayfası Görünümü bölümünden yeniden deneyebilirsiniz.' : 'Bilgileri gözden geçirebilir ve hazır olduğunuzda etkinliği Yayında durumuna geçirebilirsiniz.'}</span></div>}
    <EventWorkspace organization={organization} event={event} initialRegistrations={registrations} forms={forms} templates={templates} consents={consents} initialReminders={reminders} section="settings" initialSubtab={subtab ?? 'info'} />
  </main>;
}
