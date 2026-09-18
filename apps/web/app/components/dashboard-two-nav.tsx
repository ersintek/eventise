'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '../dashboard/logout-button';

type Props = { organization: { name: string } };

export function DashboardTwoNav({ organization }: Props) {
  const pathname = usePathname();
  const active = pathname.includes('/organization') ? 'organization' : pathname.includes('/yardim') ? 'help' : 'events';
  return <aside className="dashboard-two-nav">
    <Link href="/dashboard-2" className="dashboard-two-brand" aria-label="Eventise etkinlikler"><span>e</span><b>eventise</b><em>YENİ GÖRÜNÜM</em></Link>
    <div className="dashboard-two-org"><small>KURUM</small><b>{organization.name}</b></div>
    <nav aria-label="Kurum yönetimi">
      <Link className={active === 'events' ? 'active' : ''} href="/dashboard-2"><span>▦</span><div><b>Etkinlikler</b><small>Planla, yönet, tamamla</small></div></Link>
      <Link className={active === 'organization' ? 'active' : ''} href="/dashboard-2/organization"><span>◫</span><div><b>Kurum</b><small>Marka, ekip ve ayarlar</small></div></Link>
      <Link className={active === 'help' ? 'active' : ''} href="/yardim"><span>?</span><div><b>Yardım</b><small>Rehber ve destek</small></div></Link>
    </nav>
    <footer><Link href="/dashboard" className="dashboard-two-classic">Klasik görünüme dön</Link><div className="dashboard-two-logout"><LogoutButton /></div></footer>
  </aside>;
}
