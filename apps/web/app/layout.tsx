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

export const metadata: Metadata = {
  title: 'Eventise — STK Etkinlik Yönetimi',
  description: 'STK etkinliklerini uçtan uca yönetin.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
