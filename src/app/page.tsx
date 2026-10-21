'use client';
import Link from 'next/link';
import { useAllDaily, useDaily, useSettings } from '@/lib/hooks';
import { today, toDate, iso, weekInfo, runPlan } from '@/lib/mesocycle';
import { SESSIONS, WEEK } from '@/lib/program';
import { painAlerts, JOINT_ADVICE } from '@/lib/pain';
import { kcalSuggestion } from '@/lib/nutrition';

export default function Oggi() {
  const s = useSettings();
  const t = today();
  const y = (() => { const d = toDate(t); d.setDate(d.getDate() - 1); return iso(d); })();
  const dayLog = useDaily(t), yLog = useDaily(y), all = useAllDaily();
  const w = weekInfo(s.startDate, t);
  const plan = WEEK[toDate(t).getDay()];
  const alerts = painAlerts(dayLog?.pain, yLog?.pain);
  const tip = kcalSuggestion(all);

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
        <p className="lbl">Oggi</p>
        <h2 className="text-xl font-semibold">{plan.label}</h2>
        {plan.kind === 'session' && plan.session && (
          <>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-5">{SESSIONS[plan.session].exercises.map(e => <li key={e.id}>{e.name}</li>)}</ul>
            <Link href={`/sessione?id=${plan.session}`} className="btn block text-center">Inizia allenamento</Link>
          </>
        )}
        {plan.kind === 'run' && plan.run && (
          <>
            <p className="text-sm">{runPlan(plan.run, w?.week ?? 1).title}: {runPlan(plan.run, w?.week ?? 1).detail}</p>
            <Link href="/corsa" className="btn block text-center">Registra corsa</Link>
          </>
        )}
        {plan.kind === 'rest' && <Link href="/salute" className="btn-ghost block text-center">Segna mobilità fatta</Link>}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/salute" className="card"><p className="lbl">Peso oggi</p><p className="text-xl font-semibold">{dayLog?.weightKg ?? '–'} kg</p></Link>
        <Link href="/salute" className="card"><p className="lbl">Proteine</p><p className="text-xl font-semibold">{dayLog?.proteinG ?? '–'} g</p></Link>
      </section>
      {tip && <div className="card text-sm">💡 {tip}</div>}
      <details className="card text-sm"><summary className="font-medium">Allenamento diverso da oggi?</summary>
        <div className="grid grid-cols-2 gap-2 mt-3">{Object.values(SESSIONS).map(x => <Link key={x.id} href={`/sessione?id=${x.id}`} className="btn-ghost text-center">{x.label}</Link>)}</div>
      </details>
    </div>
  );
}
