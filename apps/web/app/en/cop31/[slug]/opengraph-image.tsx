import { ImageResponse } from 'next/og';
import { eventContent, getCop31Event, localized } from '../../../cop31/cop31-data';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const event = await getCop31Event((await params).slug);
  const title = event ? localized(event, 'title', 'en') : 'COP31 Events';
  const connection = event ? eventContent(event, 'en').cop31Connection : 'An Eventise discovery guide';
  const date = event ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: event.timezone }).format(new Date(event.startsAt)) : '';
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '68px 74px', background: '#f7f7f4', color: '#202126', fontFamily: 'sans-serif' }}><div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 31, fontWeight: 700, letterSpacing: '-1.5px' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 22, background: '#7063df', color: 'white', fontFamily: 'serif', fontSize: 34 }}>e</span>eventise</div><div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 970 }}><span style={{ color: '#5042bd', fontSize: 22, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>{connection}</span><div style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-3.4px' }}>{title}</div></div><div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #dcdad4', paddingTop: 25, color: '#686865', fontSize: 24 }}><span>{date}</span><span>COP31 Events</span></div></div>, size);
}
