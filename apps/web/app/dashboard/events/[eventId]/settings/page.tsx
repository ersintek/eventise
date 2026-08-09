import { EventNav } from '../../../../components/navigation';
import { EventWorkspace } from '../event-workspace';
import { loadEventData } from '../event-data';

export default async function EventSettings({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ subtab?: string }> }) {
  const { eventId } = await params;
  const { subtab } = await searchParams;
  const { organization, event, registrations, forms, templates, consents, reminders } = await loadEventData(eventId);
  return <main className="builder-shell">
    <header><div><p className="eyebrow">ETKİNLİK BİLGİLERİ</p><h1>{event.title}</h1><p>Etkinlik sayfasını, kayıt kurallarını, başvuruları ve katılımcıdan istenecek bilgileri yönetin.</p></div></header>
    <EventNav eventId={eventId} active="settings" />
    <EventWorkspace organization={organization} event={event} initialRegistrations={registrations} forms={forms} templates={templates} consents={consents} initialReminders={reminders} section="settings" initialSubtab={subtab ?? 'appearance'} />
  </main>;
}
