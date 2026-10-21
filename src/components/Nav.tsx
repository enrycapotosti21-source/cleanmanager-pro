'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [['/', 'Oggi', '🏋️'], ['/piano', 'Piano', '📅'], ['/foto', 'Foto', '📸'], ['/coach', 'Coach', '💬'], ['/altro', 'Altro', '⋯']] as const;

export default function Nav() {
  const path = usePathname().replace(/\/$/, '') || '/';
  const on = (h: string) => (h === '/' ? path === '/' || path === '/sessione' : path.startsWith(h) || (h === '/altro' && ['/corsa', '/salute', '/progressi', '/impostazioni'].some(p => path.startsWith(p))));
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="shell grid grid-cols-5">
        {ITEMS.map(([href, label, icon]) => (
          <li key={href}><Link href={href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${on(href) ? 'text-emerald-600' : 'text-zinc-500'}`}><span className="text-xl leading-none">{icon}</span>{label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
