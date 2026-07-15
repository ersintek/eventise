import type { Metadata } from 'next';
import './globals.css';
import './phase2.css';
import './phase2-management.css';
import './phase3.css';
import './phase4.css';
import './acceptance.css';
import './product.css';
import './participant.css';
import './admin.css';
export const metadata: Metadata = { title: 'Eventise — STK Etkinlik Yönetimi', description: 'STK etkinliklerini uçtan uca yönetin.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="tr"><body>{children}</body></html>; }
