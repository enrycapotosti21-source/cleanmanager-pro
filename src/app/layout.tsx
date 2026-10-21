import './globals.css';
import type { Metadata, Viewport } from 'next';
import Nav from '@/components/Nav';
import SwRegister from '@/components/SwRegister';

export const metadata: Metadata = { title: 'Allenamento', description: 'Il mio programma di allenamento', manifest: '/manifest.webmanifest', appleWebApp: { capable: true, title: 'Allenamento' }, icons: { icon: '/icon.svg', apple: '/icon-192.png' } };
export const viewport: Viewport = { themeColor: '#059669', width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it"><body>
      <main className="mx-auto max-w-md px-4 pt-4 pb-28">{children}</main>
      <Nav /><SwRegister />
    </body></html>
  );
}
