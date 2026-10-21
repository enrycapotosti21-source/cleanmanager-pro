'use client';
import { useSettings } from '@/lib/hooks';
import { patchSettings } from '@/lib/db';
import { MESO_WEEKS, iso, rirForWeek, toDate, today, weekInfo } from '@/lib/mesocycle';
import { DAY_NAMES, DAY_ORDER, DEFAULT_SCHEDULE, SLOTS, WEIGHTS_ONLY_SCHEDULE, planFor, runDays, slotLabel, trainingDays } from '@/lib/schedule';
import type { Slot } from '@/lib/types';

export default function Piano() {
  const s = useSettings();
  const cur = weekInfo(s.startDate, today());
  const setDay = (d: number, slot: Slot) => patchSettings({ schedule: { ...s.schedule, [d]: slot } });
  const swap = (a: number, b: number) => patchSettings({ schedule: { ...s.schedule, [a]: s.schedule[b], [b]: s.schedule[a] } });
  const dup = SLOTS.filter(x => x.length > 0 && x !== 'riposo').filter(x => Object.values(s.schedule).filter(v => v === x).length > 1);
  const missing = (['lowerA', 'upperA', 'upperB', 'lowerB'] as Slot[]).filter(x => !Object.values(s.schedule).includes(x));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Piano</h1>
      <section className="card space-y-3">
        <div><h2 className="font-semibold">I miei giorni</h2>
          <p className="text-sm text-zinc-500">{trainingDays(s.schedule)} sedute di pesi + {runDays(s.schedule)} corse a settimana. Cambia qualsiasi giorno: il piano si aggiorna subito.</p></div>
        <div className="space-y-2">
          {DAY_ORDER.map((d, i) => (
            <div key={d} className="flex items-center gap-2">
              <span className="w-24 text-sm font-medium">{DAY_NAMES[d]}</span>
              <select className="inp !py-2.5" value={s.schedule[d]} onChange={e => setDay(d, e.target.value as Slot)}>{SLOTS.map(x => <option key={x} value={x}>{slotLabel(x)}</option>)}</select>
              <button className="step !h-11 !w-11 text-base" disabled={i === DAY_ORDER.length - 1} onClick={() => swap(d, DAY_ORDER[i + 1])} aria-label="scambia con il giorno dopo">↓</button>
            </div>
          ))}
        </div>
        {(dup.length > 0 || missing.length > 0) && <p className="text-sm text-amber-600">{dup.length ? `Doppione: ${dup.map(slotLabel).join(', ')}. ` : ''}{missing.length ? `Mancano: ${missing.map(slotLabel).join(', ')}.` : ''}</p>}
        <div className="flex flex-wrap gap-2">
          <button className="chip" onClick={() => patchSettings({ schedule: { ...DEFAULT_SCHEDULE } })}>↺ Standard (4 pesi + 2 corse)</button>
          <button className="chip" onClick={() => patchSettings({ schedule: { ...WEIGHTS_ONLY_SCHEDULE } })}>Solo pesi (4 giorni)</button>
        </div>
        <p className="text-xs text-zinc-500">Per spostare solo un giorno una volta, usa “Cambia” nella schermata Oggi: non tocca il piano fisso.</p>
      </section>

      <h2 className="font-semibold pt-2">Mesociclo</h2>
      <p className="text-sm text-zinc-500">7 settimane, poi si ripete con carichi aggiornati. Cambia la data di inizio in Impostazioni.</p>
      {Array.from({ length: MESO_WEEKS }, (_, i) => i + 1).map(n => {
        const deload = n === MESO_WEEKS, isCur = cur?.week === n;
        const mon = toDate(s.startDate); mon.setDate(mon.getDate() + (n - 1) * 7);
        return (
          <div key={n} className={`card ${isCur ? 'ring-2 ring-emerald-500' : ''} ${deload ? '!bg-sky-50 dark:!bg-sky-950/40' : ''}`}>
            <div className="flex justify-between gap-2"><h3 className="font-semibold">Settimana {n}{isCur ? ' · ora' : ''}</h3>
              <span className="text-sm text-right">{deload ? 'DELOAD −40% serie' : n === 6 ? 'RIR 1 (ult. serie 0-1)' : `RIR ${rirForWeek(n)}`}</span></div>
            <p className="text-xs text-zinc-500 mb-2">dal {iso(mon).split('-').reverse().join('/')}</p>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {DAY_ORDER.map(d => { const date = new Date(mon); date.setDate(mon.getDate() + DAY_ORDER.indexOf(d)); const p = planFor(s, iso(date)); return (
                <div key={d} className={`rounded-lg py-2 ${p.moved ? 'bg-amber-100 dark:bg-amber-950/50' : 'bg-zinc-100 dark:bg-zinc-800'}`}><b>{DAY_NAMES[d][0]}</b><br />{slotLabel(p.slot).split(' ')[0]}</div>); })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
