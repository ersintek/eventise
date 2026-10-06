import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Cop31Detail } from '../../../cop31/cop31-detail';
import { getCop31Event, localized } from '../../../cop31/cop31-data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const event = await getCop31Event((await params).slug); if (!event) return { title: 'Event not found' }; const title = localized(event, 'title', 'en'); const description = localized(event, 'summary', 'en'); return { title, description, openGraph: { title, description, type: 'website', locale: 'en_GB' }, twitter: { card: 'summary_large_image', title, description } }; }
export default async function EnglishCop31EventPage({ params }: { params: Promise<{ slug: string }> }) { const event = await getCop31Event((await params).slug); if (!event) notFound(); return <Cop31Detail event={event} locale="en" />; }
