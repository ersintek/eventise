import { Applications } from '../applications';
import { loadEventData } from '../event-data';

export default async function EventApplications({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { organization, event, registrations } = await loadEventData(eventId);
  return <main className="builder-shell">
    <div className="workspace-page-heading"><div><p className="eyebrow">ETKİNLİK ÖNCESİ</p><h2>Başvurular</h2><p>Başvuruları değerlendirin ve kabul edilen katılımcıları takip edin.</p></div><span className="heading-count">{registrations.length} başvuru</span></div>
    <Applications organizationId={organization.id} eventId={event.id} capacity={event.capacity} initial={registrations}/>
  </main>;
}
