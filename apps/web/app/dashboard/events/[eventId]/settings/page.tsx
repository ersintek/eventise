import { EventWorkspace } from '../event-workspace';
import { loadEventData } from '../event-data';

export default async function EventSettings({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ subtab?: string; created?: string; appearance?: string }> }) {
  const { eventId } = await params;
  const { subtab, created, appearance } = await searchParams;
  const { organization, event, registrations, forms, templates, consents, reminders } = await loadEventData(eventId);
  return <main className="builder-shell">
    {created === '1' && <div className={`route-flash ${appearance === 'failed' ? 'warning' : 'success'}`} role="status"><b>Etkinlik taslak olarak oluşturuldu.</b><span>{appearance === 'failed' ? 'Kapak görseli yüklenemedi; Sayfa Görünümü bölümünden yeniden deneyebilirsiniz.' : 'Bilgileri gözden geçirebilir ve hazır olduğunuzda etkinliği Yayında durumuna geçirebilirsiniz.'}</span></div>}
    <div className="workspace-page-heading"><div><p className="eyebrow">ETKİNLİK ÖNCESİ</p><h2>Etkinlik Bilgileri</h2><p>Katılımcıların göreceği bilgileri, sayfa görünümünü, kayıt formunu ve SSS alanını yönetin.</p></div></div>
    <EventWorkspace organization={organization} event={event} initialRegistrations={registrations} forms={forms} templates={templates} consents={consents} initialReminders={reminders} section="settings" initialSubtab={subtab ?? 'info'} />
  </main>;
}
