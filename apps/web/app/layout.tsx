import type { Metadata } from 'next';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './globals.css';
import './phase2.css';
import './phase2-management.css';
import './phase3.css';
import './phase4.css';
import './acceptance.css';
import './product.css';
import './participant.css';
import './admin.css';
import './operations.css';
import './event-page.css';
import './visual-refresh.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://eventise.sici.dev'),
  title: {
    default: 'Eventise — Etki odaklı etkinlik yönetimi',
    template: '%s | Eventise',
  },
  description: 'Etkinlik bilgilerini, başvuruları, katılımı ve sonuçları tek yerden yönetin.',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Eventise',
    title: 'Eventise — Etki odaklı etkinlik yönetimi',
    description: 'Etkinlik bilgilerini, başvuruları, katılımı ve sonuçları tek yerden yönetin.',
    images: [{ url: '/eventise-social-card.png', width: 1728, height: 864, alt: 'Eventise etkinlik yönetimi çalışma alanı' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eventise — Etki odaklı etkinlik yönetimi',
    description: 'Etkinlik bilgilerini, başvuruları, katılımı ve sonuçları tek yerden yönetin.',
    images: ['/eventise-social-card.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
