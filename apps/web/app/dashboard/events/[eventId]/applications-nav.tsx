import Link from 'next/link';

export function ApplicationsNav({ eventId, active }: { eventId: string; active: 'applications' | 'report' }) {
  const base = `/dashboard/events/${eventId}/applications`;
  return <nav className="workspace-tabs applications-nav" aria-label="Başvuru yönetimi bölümleri">
    <Link className={active === 'applications' ? 'active' : ''} href={base}>Başvurular</Link>
    <Link className={active === 'report' ? 'active' : ''} href={`${base}/report`}>Rapor</Link>
  </nav>;
}
