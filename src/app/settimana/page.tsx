'use client';
import { useSettings } from '@/lib/hooks';
import { MESO_WEEKS, iso, rirForWeek, toDate, today, weekInfo } from '@/lib/mesocycle';
import { WEEK } from '@/lib/program';

export default function Settimana() {
  const s = useSettings();
  const cur = weekInfo(s.startDate, today());
  const days = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Mesociclo</h1>
      <p className="text-sm text-zinc-500">Inizio {toDate(s.startDate).toLocaleDateString('it-IT')} · 7 settimane, poi si ripete con carichi aggiornati.</p>
      {Array.from({ length: MESO_WEEKS }, (_, i) => i + 1).map(n => {
        const deload = n === MESO_WEEKS, isCur = cur?.week === n;
        const mon = toDate(s.startDate); mon.setDate(mon.getDate() + (n - 1) * 7);
        return (
          <div key={n} className={`card ${isCur ? 'ring-2 ring-emerald-500' : ''} ${deload ? '!bg-sky-50 dark:!bg-sky-950/40' : ''}`}>
            <div className="flex justify-between"><h2 className="font-semibold">Settimana {n}{isCur ? ' · ora' : ''}</h2>
              <span className="text-sm">{deload ? 'DELOAD −40% serie' : n === 6 ? 'RIR 1 (ultima serie fondamentali 0-1)' : `RIR ${rirForWeek(n)}`}</span></div>
            <p className="text-xs text-zinc-500 mb-2">dal {iso(mon).split('-').reverse().join('/')}</p>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {days.map(d => <div key={d} className="rounded-lg bg-zinc-100 dark:bg-zinc-800 py-2"><b>{['D', 'L', 'M', 'M', 'G', 'V', 'S'][d]}</b><br />{WEEK[d].label.split(' ')[0]}</div>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
