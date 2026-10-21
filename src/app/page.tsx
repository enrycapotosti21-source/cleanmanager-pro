'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAllDaily, useAllRuns, useAllSets, useDaily, useSettings } from '@/lib/hooks';
import { today, toDate, weekInfo, runPlan } from '@/lib/mesocycle';
import { SESSIONS } from '@/lib/program';
import { painAlerts, JOINT_ADVICE } from '@/lib/pain';
import { kcalSuggestion } from '@/lib/nutrition';
import { addDays, isSession, moveSlot, planFor, setOverride, slotLabel, SLOTS, DAY_NAMES } from '@/lib/schedule';
import { patchSettings } from '@/lib/db';
import QuickDaily from '@/components/QuickDaily';
import type { Slot } from '@/lib/types';

export default function Oggi() {
  const s = useSettings();
  const t = today(), y = addDays(t, -1);
  const dayLog = useDaily(t), yLog = useDaily(y), all = useAllDaily(), sets = useAllSets(), runs = useAllRuns();
  const [menu, setMenu] = useState(false);
  const w = weekInfo(s.startDate, t);
  const { slot, moved } = planFor(s, t);
  const alerts = painAlerts(dayLog?.pain, yLog?.pain);
  const tip = kcalSuggestion(all);
  const done = isSession(slot) ? (sets ?? []).some(x => x.date === t && SESSIONS[slot].exercises.some(e => e.id === x.exerciseId))
    : slot.startsWith('corsa') ? (runs ?? []).some(r => r.date === t) : !!dayLog?.mobility;

  const setToday = (to: Slot | null) => { patchSettings({ overrides: setOverride(s.overrides, t, to) }); setMenu(false); };
  const moveTo = (n: number) => { patchSettings({ overrides: moveSlot(s, t, addDays(t, n)) }); setMenu(false); };

  return (
    <div className="space-y-4">
      <header>
        <p className="lbl">{toDate(t).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="text-2xl font-bold">{w ? `${w.label}${w.deload ? ' · −40% serie' : ` · RIR ${w.rir}`}` : `Si parte il ${toDate(s.startDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`}</h1>
      </header>

      {alerts.map(a => (
        <div key={a.joint} className="card border-amber-500 !bg-amber-50 dark:!bg-amber-950/40">
          <p className="font-semibold">⚠️ {a.joint}: {a.value}/10{a.persists ? ' (persiste da ieri)' : ''}</p>
          <p className="text-sm mt-1">{JOINT_ADVICE[a.joint] ?? 'Riduci carico e ROM; se non passa, fatti vedere da un professionista.'}</p>
        </div>
      ))}

      <section className="card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div><p className="lbl">Oggi{moved ? ' · spostato' : ''}</p><h2 className="text-xl font-semibold">{done ? '✓ ' : ''}{slotLabel(slot)}</h2></div>
          <button className="btn-ghost !py-2 !px-3 text-sm" onClick={() => setMenu(!menu)}>Cambia</button>
        </div>
        {menu && (
          <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-3 space-y-3">
            <p className="lbl">Fai oggi un’altra cosa</p>
            <div className="flex flex-wrap gap-2">{SLOTS.filter(x => x !== slot).map(x => <button key={x} className="chip" onClick={() => setToday(x)}>{slotLabel(x)}</button>)}</div>
            <p className="lbl">Sposta {slotLabel(slot)} a…</p>
            <div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5, 6].map(n => <button key={n} className="chip" onClick={() => moveTo(n)}>{n === 1 ? 'Domani' : DAY_NAMES[toDate(addDays(t, n)).getDay()]}</button>)}</div>
            {moved && <button className="chip" onClick={() => setToday(null)}>↺ Ripristina piano normale</button>}
          </div>
        )}
        {isSession(slot) && (
          <>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-5">{SESSIONS[slot].exercises.map(e => <li key={e.id}>{e.name}</li>)}</ul>
            <Link href={`/sessione?id=${slot}`} className="btn block text-center">{done ? 'Riprendi allenamento' : 'Inizia allenamento'}</Link>
          </>
        )}
        {slot.startsWith('corsa') && (() => { const type = slot === 'corsa-qualita' ? 'qualita' : 'facile'; const p = runPlan(type, w?.week ?? 1); return (
          <><p className="text-sm"><b>{p.title}</b> — {p.detail}</p><Link href="/corsa" className="btn block text-center">Registra corsa</Link></>); })()}
        {slot === 'riposo' && <p className="text-sm text-zinc-500">Giorno di recupero: 10′ di mobilità e passi tranquilli.</p>}
      </section>

      <QuickDaily date={t} log={dayLog} />
      {tip && <div className="card text-sm">💡 {tip}</div>}
      <Link href="/coach" className="card flex items-center justify-between"><span>💬 Chiedi al coach</span><span className="text-zinc-400">›</span></Link>
    </div>
  );
}
