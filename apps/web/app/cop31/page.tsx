import type { Metadata } from 'next';
import { Cop31ComingSoon } from './cop31-coming-soon';

export const metadata: Metadata = { title: 'COP31 — Updating', description: 'A new COP31 experience is taking shape at Eventise.' };

export default function Cop31Page() { return <Cop31ComingSoon locale="tr" />; }
