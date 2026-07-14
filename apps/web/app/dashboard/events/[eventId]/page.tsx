import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EventWorkspace } from './event-workspace';

async function api<T>(path:string, token:string):Promise<T> {
  const response=await fetch(`${process.env.API_INTERNAL_URL}/api/${path}`,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});
  if(response.status===401)redirect('/login');
  if(!response.ok)throw new Error('Etkinlik verileri alınamadı.');
  return response.json();
}

async function optionalApi<T>(path:string,token:string,fallback:T):Promise<T>{
  try{return await api<T>(path,token)}catch{return fallback}
}

export default async function EventManagement({params}:{params:Promise<{eventId:string}>}) {
  const token=(await cookies()).get('eventise_session')?.value;
  if(!token)redirect('/login');
  const organizations=await api<Array<{id:string;slug:string}>>('organizations',token);
  if(!organizations.length)redirect('/onboarding');
  const organization=organizations[0],{eventId}=await params;
  const events=await api<Array<{id:string;title:string;slug:string;summary?:string;startsAt:string;endsAt:string;publicationStatus:string;registrationStatus:string;phase:string;visibility:string;registrationMode:string;capacity:number;_count:{registrations:number}}>>(`organizations/${organization.id}/events`,token);
  const event=events.find(item=>item.id===eventId);
  if(!event)redirect('/dashboard');
  const [registrations,forms,templates,consents]=await Promise.all([
    optionalApi<unknown[]>(`organizations/${organization.id}/events/${eventId}/registrations`,token,[]),
    optionalApi<unknown[]>(`organizations/${organization.id}/forms`,token,[]),
    optionalApi<unknown[]>(`organizations/${organization.id}/email-templates`,token,[]),
    optionalApi<unknown[]>(`public/events/${eventId}/consents`,token,[]),
  ]);
  return <main className="builder-shell"><header><Link href="/dashboard">← Etkinlikler</Link><div><p className="eyebrow">ETKİNLİK ÖNCESİ</p><h1>{event.title}</h1><div className="action-links"><Link className="primary link-button" href={`/dashboard/events/${eventId}/day`}>Saha ekranı</Link><Link className="secondary link-button" href={`/dashboard/events/${eventId}/modules`}>Etkinlik modülleri</Link><Link className="secondary link-button" href={`/dashboard/events/${eventId}/post-event`}>Etkinlik sonrası</Link></div></div></header><EventWorkspace organization={organization} event={event} initialRegistrations={registrations} forms={forms} templates={templates} consents={consents}/></main>;
}
