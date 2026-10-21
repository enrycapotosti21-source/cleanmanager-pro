import Link from 'next/link';

const LINKS = [['/corsa', '🏃', 'Corsa', 'Registra distanza, tempo, passo e RPE'], ['/salute', '❤️', 'Salute', 'Peso, proteine, sonno, passi, dolori'], ['/progressi', '📈', 'Progressi', 'Grafici di peso, carichi, passo e dolori'], ['/impostazioni', '⚙️', 'Impostazioni', 'Profilo, coach AI, export/import dati']];

export default function Altro() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Altro</h1>
      {LINKS.map(([href, icon, title, sub]) => (
        <Link key={href} href={href} className="card flex items-center gap-4"><span className="text-3xl">{icon}</span><span className="flex-1"><b className="block">{title}</b><span className="text-sm text-zinc-500">{sub}</span></span><span className="text-zinc-400">›</span></Link>
      ))}
    </div>
  );
}
