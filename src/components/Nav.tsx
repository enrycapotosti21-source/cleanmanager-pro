'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [['/', 'Oggi'], ['/settimana', 'Settimana'], ['/corsa', 'Corsa'], ['/salute', 'Salute'], ['/progressi', 'Progressi'], ['/impostazioni', 'Altro']] as const;

export default function Nav() {
  const path = usePathname().replace(/\/$/, '') || '/';
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto max-w-md grid grid-cols-6">
        {ITEMS.map(([href, label]) => (
          <li key={href}><Link href={href} className={`block text-center py-4 text-[11px] font-medium ${path === href ? 'text-emerald-600' : 'text-zinc-500'}`}>{label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
