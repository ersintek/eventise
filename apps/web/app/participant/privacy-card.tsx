'use client';
import Link from 'next/link';
import { useState } from 'react';

export type ConsentRecord = {
  id:string; title:string; text:string; version:number; status:'GRANTED'|'WITHDRAWN';
  acceptedAt:string; eventName:string; organizationName:string;
};
export type LegalStatus = {
  userTermsAccepted:boolean; requiredVersion:string; acceptedAt:string|null; consentRecords:ConsentRecord[];
};

export function PrivacyCard({ legal }: { legal: LegalStatus }) {
  const [records, setRecords] = useState(legal.consentRecords ?? []);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function withdraw(id:string) {
    if (!confirm('Bu onamı geri çekmek istediğinizden emin misiniz? İlgili STK, buna bağlı hizmeti sürdüremeyebilir.')) return;
    setBusy(true); setMessage('');
    const response = await fetch(`/api/backend/legal/consents/${id}/withdraw`, { method:'POST' });
    if (response.ok) {
      setRecords(rows => rows.map(row => row.id === id ? { ...row, status:'WITHDRAWN' } : row));
      setMessage('Onam geri çekildi.');
    } else setMessage('Onam geri çekilemedi.');
    setBusy(false);
  }

  return <section className="workspace-card">
    <p className="eyebrow">HESAP VE GİZLİLİK</p><h2>Sözleşmeler ve onamlar</h2>
    <p><Link href="/legal/kullanici-sozlesmesi">Kullanıcı Sözleşmesi v{legal.requiredVersion}</Link> · {legal.acceptedAt?'kabul edildi':'bekliyor'}</p>
    <p><Link href="/legal/kvkk-aydinlatma">KVKK Aydınlatma Metni</Link></p>
    {records.length>0&&<div className="applications"><h3>Etkinlik onamları</h3>{records.map(record=><article key={record.id}><div><b>{record.title}</b><p>{record.organizationName} · {record.eventName}</p><small>{record.status==='GRANTED'?'Aktif':'Geri çekildi'}</small></div>{record.status==='GRANTED'&&<button className="secondary" disabled={busy} onClick={()=>withdraw(record.id)}>Onamı geri çek</button>}</article>)}</div>}
    {message&&<p className="notice" role="status">{message}</p>}
  </section>;
}
