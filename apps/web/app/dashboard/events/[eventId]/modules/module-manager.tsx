'use client';
import { FormEvent, useState } from 'react';
import { ManualGroups } from './manual-groups';
import { TestComparison } from './test-comparison';
import { FeedbackEditor } from '../visual-editors';
import { AssessmentEditor } from './assessment-editor';

type Game = { id: string; title: string; status: string; _count: { participants: number; responses: number } };
type Assessment = { id: string; kind: 'PRE_TEST' | 'POST_TEST'; title: string; open: boolean; _count: { submissions: number } };
type Comparison = { pre: { submissions: number; average: number | null }; post: { submissions: number; average: number | null }; improvement: number | null };

export function ModuleManager(p: {
  organizationId: string; eventId: string;
  initialGroups: any[]; initialGames: Game[]; initialAssessments: Assessment[];
  initialFeedback: any[]; initialFeatures: any[]; roster: any[]; initialComparison: Comparison;
}) {
  const { organizationId, eventId } = p;
  const [tab, setTab] = useState('tests');
  const [groups, setGroups] = useState(p.initialGroups);
  const [games, setGames] = useState(p.initialGames);
  const [assessments, setAssessments] = useState(p.initialAssessments);
  const [feedback, setFeedback] = useState(p.initialFeedback);
  const [comparison, setComparison] = useState(p.initialComparison);
  const [message, setMessage] = useState('');
  const [gameDetails, setGameDetails] = useState<any>(null);
  const [subDetails, setSubDetails] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function api(path: string, method = 'POST', body?: object) {
    setBusy(true);
    try {
      const res = await fetch('/api/backend/' + path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) { setMessage(Array.isArray(data.message) ? data.message.join(' ') : (data.message || 'Hata')); setBusy(false); return null; }
      setBusy(false);
      return data;
    } catch (err) {
      setMessage('Baglanti hatasi: ' + (err instanceof Error ? err.message : '?'));
      setBusy(false);
      return null;
    }
  }

  const base = 'organizations/' + organizationId + '/events/' + eventId;
  const gameBase = 'organizations/' + organizationId + '/game-sessions';

  // === GAME ===
  async function createGame(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget as HTMLFormElement);
    const created = await api(base + '/games', 'POST', { title: f.get('title'), prompt: f.get('prompt') });
    if (!created) return;
    const opened = await api(gameBase + '/' + created.id + '/open', 'POST');
    if (opened) {
      setGames(v => [{ ...created, status: 'OPEN', _count: { participants: opened.assignments?.length || 0, responses: 0 } }, ...v]);
      setMessage('Oyun acildi! ' + (opened.assignments?.length || 0) + ' kisiye atama yapildi.');
    } else {
      setMessage('Oyun olusturuldu ama acilamadi - en az 2 kabul edilmis katilimci gerekir.');
    }
  }
  async function gameAction(g: Game, action: string) {
    const r = await api(gameBase + '/' + g.id + '/' + action, 'POST');
    if (r) { setGames(v => v.map(x => x.id === g.id ? { ...x, status: r.status } : x)); }
  }
  async function showGameDetails(g: Game) {
    const d = await api(gameBase + '/' + g.id + '/details', 'GET');
    if (d) setGameDetails(d);
  }

  // === TEST ===
  async function createTest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget as HTMLFormElement);
    const qs = JSON.parse(String(f.get('questions') || '[]'));
    if (!qs.length) { setMessage('En az bir soru ekleyin.'); return; }
    const created = await api(base + '/assessments', 'POST', { kind: 'PRE_TEST', title: f.get('title'), questions: qs });
    if (!created) return;
    await api('organizations/' + organizationId + '/assessments/' + created.id + '/open', 'PATCH', { open: true });
    setAssessments(v => [{ ...created, kind: 'PRE_TEST', open: true, _count: { submissions: 0 } }, ...v]);
    setMessage('On test olusturuldu ve gonderildi.');
  }
  async function sendPostTest(a: Assessment) {
    const r = await api('organizations/' + organizationId + '/assessments/' + a.id + '/copy', 'POST', { kind: 'POST_TEST', title: a.title + ' (Son test)' });
    if (!r) return;
    await api('organizations/' + organizationId + '/assessments/' + r.id + '/open', 'PATCH', { open: true });
    setAssessments(v => [{ ...r, kind: 'POST_TEST', open: true, _count: { submissions: 0 } }, ...v]);
    setMessage('Son test olusturuldu ve gonderildi.');
  }
  async function showSubmissions(a: Assessment) {
    const d = await api('organizations/' + organizationId + '/assessments/' + a.id + '/submissions', 'GET');
    if (d) setSubDetails(d);
  }
  async function refreshComparison() {
    const r = await api(base + '/assessments/comparison', 'GET');
    if (r) { setComparison(r); setMessage('Karsilastirma yenilendi.'); }
  }

  // === FEEDBACK ===
  async function createFeedback(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget as HTMLFormElement);
    const qs = JSON.parse(String(f.get('questions') || '[]')).filter((q: any) => q.label.trim());
    if (!qs.length) { setMessage('En az bir soru ekleyin.'); return; }
    const r = await api(base + '/feedback', 'POST', { title: f.get('title'), schema: { questions: qs.map((q: any, i: number) => ({ id: 'q' + (i + 1), type: q.type, label: q.label })) } });
    if (!r) return;
    await api('organizations/' + organizationId + '/feedback/' + r.id + '/open', 'PATCH', { open: true });
    setFeedback(v => [{ ...r, open: true, _count: { submissions: 0 } }, ...v]);
    setMessage('Geri bildirim olusturuldu.');
  }

  const tabs: [string, string][] = [['tests', 'Testler'], ['game', 'Tanisma Oyunu'], ['feedback', 'Geri Bildirim'], ['groups', 'Gruplar'], ['notifications', 'Duyurular'], ['resources', 'Kaynaklar']];

  return (
    <>
      <nav className="workspace-tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav>
      {message && <p className="notice">{message}</p>}
      <section className="module-workspace">
        {tab === 'tests' && (
          <>
            <form className="workspace-card" onSubmit={createTest}>
              <div className="section-intro"><h2>On Test Olustur</h2><p>Katilimcilara gonderilir. Son testi sonra gonderebilirsiniz.</p></div>
              <label>Test basligi<input name="title" required placeholder="Orn. Etkinlik Bilgi Testi" /></label>
              <AssessmentEditor />
              <button className="primary" disabled={busy}>{busy ? 'Gonderiliyor...' : 'On test olustur ve gonder'}</button>
            </form>
            <TestComparison comparison={comparison} />
            <button className="secondary" onClick={refreshComparison} disabled={busy}>Karsilastirmayi yenile</button>
            {assessments.map(a => (
              <article className="workspace-card" key={a.id}>
                <div className="assessment-header"><h3>{a.title}</h3><span className={'pill ' + (a.kind === 'PRE_TEST' ? 'published' : '')}>{a.kind === 'PRE_TEST' ? 'On Test' : 'Son Test'}</span></div>
                <p>{a._count.submissions} yanit - {a.open ? 'Acik' : 'Kapali'}</p>
                <div className="action-links">
                  {a.kind === 'PRE_TEST' && <button className="secondary" onClick={() => sendPostTest(a)} disabled={busy}>Son test gonder</button>}
                  <button className="secondary" onClick={() => showSubmissions(a)} disabled={busy}>Yanitlari gor ({a._count.submissions})</button>
                </div>
              </article>
            ))}
            {subDetails && (
              <article className="workspace-card wide">
                <div className="section-intro"><h2>{subDetails.assessment?.title} - Yanitlar</h2></div>
                <table className="submissions-table">
                  <thead><tr><th>Katilimci</th>{(subDetails.assessment?.questions || []).map((q: any, i: number) => <th key={i}>{q.label}</th>)}</tr></thead>
                  <tbody>{(subDetails.submissions || []).map((s: any) => <tr key={s.id}><td>{s.name}</td>{(subDetails.assessment?.questions || []).map((q: any, i: number) => <td key={i}>{String((s.answers || {})[q.id] || '-')}</td>)}</tr>)}</tbody>
                </table>
              </article>
            )}
          </>
        )}
        {tab === 'game' && (
          <>
            <form className="workspace-card" onSubmit={createGame}>
              <div className="section-intro"><h2>Tanisma Oyunu</h2><p>Her katilimci bir cumle yazar. Sonra herkese random bir baskasinin yazdigi isimsiz gosterilir.</p></div>
              <label>Oyun basligi<input name="title" defaultValue="Baskasinin Yanitini Oku" /></label>
              <label>Katilimcilara sorulacak soru<textarea name="prompt" required defaultValue="Diger katilimcilarin seni tanimasini saglayacak kisa bir anini veya ilgi alanini yaz." /></label>
              <button className="primary" disabled={busy}>{busy ? 'Olusturuluyor...' : 'Olustur ve ac'}</button>
            </form>
            {games.map(g => (
              <article className="workspace-card" key={g.id}>
                <h3>{g.title}</h3>
                <p><span className={'pill ' + (g.status === 'OPEN' ? 'published' : '')}>{g.status}</span> - {g._count.responses}/{g._count.participants} yanit</p>
                <div className="action-links">
                  {g.status === 'OPEN' && <button className="primary" onClick={() => gameAction(g, 'reveal')} disabled={busy}>Yanitlari goster</button>}
                  {g.status === 'OPEN' && <button className="secondary" onClick={() => showGameDetails(g)} disabled={busy}>Detaylar</button>}
                  {g.status === 'REVEAL' && <button className="primary" onClick={() => gameAction(g, 'complete')} disabled={busy}>Tamamla</button>}
                </div>
              </article>
            ))}
            {gameDetails && (
              <article className="workspace-card wide">
                <div className="section-intro"><h2>Oyun Detaylari</h2><p>Soru: {gameDetails.session?.prompt}</p></div>
                <table className="submissions-table">
                  <thead><tr><th>Katilimci</th><th>Yaniti</th><th>Atanan kisi</th></tr></thead>
                  <tbody>{(gameDetails.responses || []).map((r: any, i: number) => <tr key={i}><td>{r.name}</td><td>{r.answer}</td><td>{(gameDetails.assignments || []).find((a: any) => a.from === r.name)?.to || '-'}</td></tr>)}</tbody>
                </table>
              </article>
            )}
          </>
        )}
        {tab === 'feedback' && (
          <>
            <form className="workspace-card" onSubmit={createFeedback}>
              <div className="section-intro"><h2>Geri Bildirim Formu</h2></div>
              <label>Form basligi<input name="title" defaultValue="Etkinlik geri bildirimi" required /></label>
              <FeedbackEditor />
              <button className="primary" disabled={busy}>{busy ? 'Olusturuluyor...' : 'Olustur ve ac'}</button>
            </form>
            {feedback.map((f: any) => <article className="workspace-card" key={f.id}><h3>{f.title}</h3><p>{f._count.submissions} yanit</p></article>)}
          </>
        )}
        {tab === 'groups' && (
          <GroupsPanel organizationId={organizationId} eventId={eventId} groups={groups} setGroups={setGroups} api={api} roster={p.roster} />
        )}
        {tab === 'notifications' && <NotificationsPanel base={base} api={api} />}
        {tab === 'resources' && <ResourcesPanel base={base} organizationId={organizationId} api={api} />}
      </section>
    </>
  );
}

function GroupsPanel({ organizationId, eventId, groups, setGroups, api, roster }: any) {
  const [busy, setBusy] = useState(false);
  async function generate(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); const d = new FormData(e.currentTarget); const r = await api('organizations/' + organizationId + '/events/' + eventId + '/groups/generate', 'POST', { count: Number(d.get('count')), strategy: d.get('strategy') }); if (r) setGroups(r); setBusy(false); }
  return (
    <>
      <form className="workspace-card" onSubmit={generate}>
        <div className="section-intro"><h2>Otomatik gruplama</h2></div>
        <label>Grup sayisi<input name="count" type="number" min="1" defaultValue="2" /></label>
        <label>Dagitim<select name="strategy"><option value="RANDOM">Rastgele</option><option value="BALANCED">Dengeli</option></select></label>
        <button className="primary" disabled={busy}>Gruplari olustur</button>
      </form>
      <div className="group-board">{groups.map((g: any) => <article className="workspace-card" key={g.id}><h3>{g.name}</h3>{g.members.map((m: any) => <span className="participant-chip" key={m.registration.id}>{m.registration.firstName} {m.registration.lastName}</span>)}</article>)}</div>
    </>
  );
}

function NotificationsPanel({ base, api }: any) {
  async function send(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const d = new FormData(e.currentTarget); const r = await api(base + '/notifications', 'POST', { title: d.get('title'), body: d.get('body'), audience: d.get('audience') }); }
  return (
    <form className="workspace-card" onSubmit={send}>
      <div className="section-intro"><h2>Duyuru gonder</h2></div>
      <label>Hedef<select name="audience" defaultValue="ACCEPTED"><option value="ACCEPTED">Kabul edilenler</option><option value="CHECKED_IN">Teyit verenler</option><option value="ALL">Tum kayitlilar</option></select></label>
      <label>Baslik<input name="title" required /></label>
      <label>Mesaj<textarea name="body" required /></label>
      <button className="primary">Gonder</button>
    </form>
  );
}

function ResourcesPanel({ base, organizationId, api }: any) {
  const [busy, setBusy] = useState(false);
  async function shareLink(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); const d = new FormData(e.currentTarget); await api(base + '/resources/link', 'POST', { title: d.get('title'), url: d.get('url') }); setBusy(false); }
  async function shareFile(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); const f = new FormData(e.currentTarget); const file = f.get('file') as File; if (!file) return; const grant = await api(base + '/resources/upload', 'POST', { name: file.name, contentType: file.type, sizeBytes: file.size }); if (grant) { const up = await fetch(String(grant.uploadUrl).replace('/api/', '/api/backend/'), { method: 'PUT', headers: { 'content-type': file.type }, body: file }); if (up.ok) await api(base + '/resources/confirm', 'POST', { title: f.get('title'), assetId: grant.assetId, reservationId: grant.reservationId }); } setBusy(false); }
  return (
    <>
      <form className="workspace-card" onSubmit={shareLink}>
        <div className="section-intro"><h2>Baglanti paylas</h2></div>
        <label>Baslik<input name="title" required /></label>
        <label>URL<input name="url" type="url" required /></label>
        <button className="primary" disabled={busy}>Paylas</button>
      </form>
      <form className="workspace-card" onSubmit={shareFile}>
        <div className="section-intro"><h2>Dosya paylas</h2></div>
        <label>Baslik<input name="title" required /></label>
        <label>Dosya<input name="file" type="file" required /></label>
        <button className="primary" disabled={busy}>Yukle</button>
      </form>
    </>
  );
}
