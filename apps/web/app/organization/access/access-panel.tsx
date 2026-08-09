'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Invitation = { id: string; role: string; expiresAt: string; organization: { name: string } };
type JoinRequest = { id: string; organization: { name: string } };

const roleNames: Record<string, string> = {
  ORGANIZATION_ADMIN: 'Kurum yöneticisi',
  EVENT_MANAGER: 'Etkinlik yetkilisi',
  FIELD_STAFF: 'Saha görevlisi',
};

export function OrganizationAccessPanel({ email, invitations, joinRequests }: { email: string; invitations: Invitation[]; joinRequests: JoinRequest[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function accept(invitationId: string) {
    setBusyId(invitationId);
    setError('');
    const response = await fetch(`/api/backend/organization-access/invitations/${invitationId}/accept`, { method: 'POST' });
    setBusyId('');
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(Array.isArray(data.message) ? data.message.join(' ') : data.message ?? 'Davet kabul edilemedi.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return <main className="center-shell organization-access-shell">
    <section className="onboarding-card access-card">
      <div className="logo dark"><b>e</b>eventise</div>
      <p className="eyebrow">STK ERİŞİMİ</p>
      <h1>STK çalışma alanınıza bağlanın</h1>
      <p>Eventise hesabınız hazır. Kurumunuza erişmek için aşağıdaki daveti kabul edin, yöneticinizin sizi eklemesini bekleyin veya yeni bir kurum alanı oluşturun.</p>

      {invitations.length > 0 && <section className="access-section">
        <h2>Bekleyen davetleriniz</h2>
        {invitations.map((invitation) => <article className="access-invitation" key={invitation.id}>
          <div><b>{invitation.organization.name}</b><p>{roleNames[invitation.role] ?? invitation.role} olarak davet edildiniz.</p><small>{new Date(invitation.expiresAt).toLocaleDateString('tr-TR')} tarihine kadar geçerli</small></div>
          <button className="primary" disabled={busyId === invitation.id} onClick={() => accept(invitation.id)}>{busyId === invitation.id ? 'Kabul ediliyor…' : 'Daveti kabul et'}</button>
        </article>)}
      </section>}

      {joinRequests.length > 0 && <section className="access-section pending-access">
        <h2>Onay bekleyen istekler</h2>
        {joinRequests.map((request) => <p key={request.id}><b>{request.organization.name}</b> yöneticilerinin onayı bekleniyor.</p>)}
      </section>}

      <section className="access-guidance">
        <h2>Mevcut bir STK ekibine katılacaksanız</h2>
        <p>STK yöneticinizin sizi kurumun <b>Kurum ve ekip</b> ekranından <strong>{email}</strong> adresiyle davet etmesi gerekir. Davet geldiğinde bu ekranda görünecektir.</p>
        <button className="secondary" onClick={() => router.refresh()}>Davetlerimi yeniden kontrol et</button>
      </section>

      <section className="access-create">
        <h2>Kurumunuz Eventise&apos;da henüz yok mu?</h2>
        <p>Yalnızca kurumunuz için ilk çalışma alanını açmaya yetkiliyseniz yeni bir kurum oluşturun.</p>
        <Link className="primary link-button" href="/organization/setup">Yeni STK çalışma alanı oluştur</Link>
      </section>
      {error && <p className="error" role="alert">{error}</p>}
      <p className="auth-link"><Link href="/login">Farklı bir alana dön</Link></p>
    </section>
  </main>;
}
