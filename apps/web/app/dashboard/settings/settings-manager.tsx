'use client';

import { FormEvent, useState } from 'react';

type SettingsManagerProps = {
  organization: any;
  members: any[];
  joinRequests: any[];
  invitations: any[];
  me: any;
};

export function SettingsManager({
  organization,
  members: initialMembers,
  joinRequests: initialJoinRequests,
  invitations: initialInvitations,
  me,
}: SettingsManagerProps) {
  const [members, setMembers] = useState(initialMembers);
  const [joinRequests, setJoinRequests] = useState(initialJoinRequests);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [message, setMessage] = useState('');

  async function call(path: string, method: string, body?: object) {
    const response = await fetch(`/api/backend/${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    setMessage(
      response.ok
        ? 'Değişiklikler kaydedildi.'
        : Array.isArray(data.message)
          ? data.message.join(' ')
          : data.message || 'İşlem tamamlanamadı.',
    );
    return response.ok ? data : null;
  }

  async function profile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await call('auth/me', 'PATCH', {
      firstName: form.get('firstName'),
      lastName: form.get('lastName'),
      preferredLanguage: form.get('preferredLanguage'),
      emailNotifications: form.get('emailNotifications') === 'on',
      partnerEventEmails: form.get('partnerEventEmails') === 'on',
    });
  }

  async function saveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await call(`organizations/${organization.id}`, 'PATCH', {
      name: form.get('name'),
      description: form.get('description'),
      contactEmail: form.get('contactEmail'),
      website: form.get('website') || undefined,
    });
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await call(`organizations/${organization.id}/members`, 'POST', {
      email: form.get('email'),
      role: form.get('role'),
    });
    if (result?.kind === 'member') {
      setMembers((current) => [...current.filter((member) => member.id !== result.membership.id), result.membership]);
      event.currentTarget.reset();
    } else if (result?.kind === 'invitation') {
      setInvitations((current) => [result.invitation, ...current.filter((invitation) => invitation.id !== result.invitation.id)]);
      event.currentTarget.reset();
    }
  }

  async function updateRole(membershipId: string, role: string) {
    const member = await call(`organizations/${organization.id}/members/${membershipId}`, 'PATCH', { role });
    if (member) setMembers((current) => current.map((item) => item.id === member.id ? member : item));
  }

  async function reviewJoinRequest(requestId: string, approved: boolean) {
    const result = await call(
      `organizations/${organization.id}/join-requests/${requestId}`,
      'PATCH',
      { approved },
    );
    if (!result) return;
    setJoinRequests((current) => current.filter((request) => request.id !== requestId));
    if (approved && result.membership) {
      setMembers((current) => [
        ...current.filter((member) => member.id !== result.membership.id),
        result.membership,
      ]);
    }
  }

  return (
    <>
      <section className="settings-section">
        <div className="settings-section-heading"><span>01</span><div><h2>Kurum bilgileri</h2><p>Etkinliklerde ve katılımcı iletişiminde görünen kurumsal bilgiler.</p></div></div>
        <form className="settings-card" onSubmit={saveOrganization}>
          <label>Kurum adı<input name="name" defaultValue={organization.name} required /></label>
          <label>Açıklama<textarea name="description" defaultValue={organization.description} /></label>
          <div className="two"><label>İletişim e-postası<input name="contactEmail" type="email" defaultValue={organization.contactEmail} required /></label>
          <label>Web sitesi<input name="website" type="url" defaultValue={organization.website} /></label></div>
          <button className="primary">Kurum bilgilerini kaydet</button>
        </form>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading"><span>02</span><div><h2>Ekip yönetimi</h2><p>Yeni ekip üyeleri ekleyin, bekleyen istekleri değerlendirin ve erişimleri görün.</p></div></div>
        <div className="team-layout">
        <form className="settings-card invite-card" onSubmit={addMember}>
          <h3>Ekip üyesi ekle</h3>
          <p>Hesabı varsa doğrudan eklenir; yoksa e-postayla davet edilir.</p>
          <label>E-posta<input name="email" type="email" required placeholder="uye@kurum.org" /></label>
          <label>
            Rol <span className="tooltip" data-tip="Etkinlik yetkilisi tüm etkinlik süreçlerini yönetir. Saha görevlisi yalnızca etkinlik günü operasyonlarına erişir.">(?)</span>
            <select name="role">
              <option value="ORGANIZATION_ADMIN">Kurum yöneticisi</option>
              <option value="EVENT_MANAGER">Etkinlik yetkilisi</option>
              <option value="FIELD_STAFF">Saha görevlisi</option>
            </select>
          </label>
          <button className="primary">Ekibe ekle</button>
        </form>

        <section className="applications team-list">
          <h3>Ekip <span>{members.length} kişi</span></h3>
          {members.map((member) => (
            <article key={member.id}>
              <div className="member-avatar">{(member.user?.firstName?.[0] || '') + (member.user?.lastName?.[0] || '')}</div>
              <div><b>{member.user?.firstName} {member.user?.lastName}</b><p>{member.user?.email}</p></div>
              <select aria-label={`${member.user?.email} rolü`} value={member.role} onChange={(event) => updateRole(member.id, event.target.value)}>
                <option value="ORGANIZATION_ADMIN">Kurum yöneticisi</option>
                <option value="EVENT_MANAGER">Etkinlik yetkilisi</option>
                <option value="FIELD_STAFF">Saha görevlisi</option>
              </select>
              {member.userId !== me.id && (
                <button onClick={async () => {
                  if (await call(`organizations/${organization.id}/members/${member.id}`, 'DELETE')) setMembers((current) => current.filter((item) => item.id !== member.id));
                }}>Ekipten çıkar</button>
              )}
            </article>
          ))}
        </section>
        </div>
      </section>

      {invitations.length > 0 && (
        <section className="applications join-requests">
          <h2>Bekleyen ekip davetleri</h2>
          <p>Hesabını tamamlamamış kişilere gönderilen davetler.</p>
          {invitations.map((invitation) => (
            <article key={invitation.id}>
              <div><b>{invitation.email}</b><p>{invitation.role} · {new Date(invitation.expiresAt).toLocaleString('tr-TR')} tarihine kadar</p></div>
              <div className="button-row">
                <button onClick={() => call(`organizations/${organization.id}/invitations/${invitation.id}/resend`, 'POST')}>Yeniden gönder</button>
                <button onClick={async () => {
                  if (await call(`organizations/${organization.id}/invitations/${invitation.id}`, 'DELETE')) setInvitations((current) => current.filter((item) => item.id !== invitation.id));
                }}>İptal et</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {joinRequests.length > 0 && (
        <section className="applications join-requests">
          <h2>Katılma istekleri</h2>
          <p>Bu kişiler kurumunuzun Eventise ekibine katılmak istiyor.</p>
          {joinRequests.map((request) => (
            <article key={request.id}>
              <div><b>{request.user.firstName} {request.user.lastName}</b><p>{request.user.email}</p></div>
              <div className="button-row">
                <button className="primary" onClick={() => reviewJoinRequest(request.id, true)}>Kabul et</button>
                <button onClick={() => reviewJoinRequest(request.id, false)}>Reddet</button>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="settings-section">
        <div className="settings-section-heading"><span>03</span><div><h2>Kişisel tercihler</h2><p>Yalnızca sizin hesabınıza ait profil ve bildirim ayarları.</p></div></div>
        <form className="settings-card" onSubmit={profile}>
          <label>Ad<input name="firstName" defaultValue={me.firstName} required /></label>
          <label>Soyad<input name="lastName" defaultValue={me.lastName} required /></label>
          <label>
            Dil
            <select name="preferredLanguage" defaultValue={me.preferredLanguage}>
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="consent">
            <input name="emailNotifications" type="checkbox" defaultChecked={me.emailNotifications} />
            <span>Etkinlik bildirimlerini e-postayla al</span>
          </label>
          <label className="consent">
            <input name="partnerEventEmails" type="checkbox" defaultChecked={me.partnerEventEmails} />
            <span>Diğer kurumların etkinlik önerilerini al</span>
          </label>
          <button className="primary">Profili kaydet</button>
        </form>
      </section>

      <section className="workspace-card danger-zone">
        <h2>Hesabı silme</h2>
        <p>Hesap 30 gün boyunca geri alınabilir; sonra kalıcı silinir.</p>
        <button
          onClick={async () => {
            if (confirm('Hesabınızı silme sürecini başlatmak istediğinizden emin misiniz?')) {
              await call('deletions', 'POST', { kind: 'account', id: me.id });
            }
          }}
        >
          30 günlük silme sürecini başlat
        </button>
      </section>
      {message && <p className="notice" role="status">{message}</p>}
    </>
  );
}
