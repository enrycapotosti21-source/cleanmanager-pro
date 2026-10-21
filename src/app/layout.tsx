import './globals.css';
import type { Metadata, Viewport } from 'next';
import Nav from '@/components/Nav';
import SwRegister from '@/components/SwRegister';

export const metadata: Metadata = {
  title: 'Allenamento', description: 'Il mio personal trainer', manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Allenamento', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
};
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#09090b' }, { media: '(prefers-color-scheme: light)', color: '#fafafa' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it"><body>
      <main className="shell px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+6.5rem)]">{children}</main>
      <Nav /><SwRegister />
    </body></html>
  );
}
