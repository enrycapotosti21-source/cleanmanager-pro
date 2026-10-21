'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, patchDaily } from '@/lib/db';
import { useAllSets, useDaily, useSettings } from '@/lib/hooks';
import { SESSIONS, PAIN_JOINTS } from '@/lib/program';
import { iso, setsForWeek, today, toDate, weekInfo } from '@/lib/mesocycle';
import { sessionsByDate, suggest } from '@/lib/progression';
import { alternativeFor, painAlerts } from '@/lib/pain';
import RestTimer from '@/components/RestTimer';
import type { Exercise, Joint, SessionId } from '@/lib/types';

function Sessione() {
  const id = (useSearchParams().get('id') ?? 'lowerA') as SessionId;
  const router = useRouter();
  const session = SESSIONS[id] ?? SESSIONS.lowerA;
  const s = useSettings(), allSets = useAllSets();
  const t = today();
  const w = weekInfo(s.startDate, t);
  const yDate = (() => { const d = toDate(t); d.setDate(d.getDate() - 1); return iso(d); })();
  const yLog = useDaily(yDate);
  const [timer, setTimer] = useState<{ sec: number; key: number } | null>(null);
  const [pain, setPain] = useState<Partial<Record<Joint, number>>>({});
  const [done, setDone] = useState(false);
  const alerts = painAlerts(pain, yLog?.pain).concat(painAlerts(yLog?.pain, undefined).filter(a => a.value > 3));

  const finish = async () => { await patchDaily(t, { pain }); setDone(true); };
  if (done) return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Sessione completata 💪</h1>
      {painAlerts(pain, yLog?.pain).map(a => <p key={a.joint} className="card border-amber-500">⚠️ {a.joint} {a.value}/10 — vedi alternative nella prossima seduta.</p>)}
      <button className="btn w-full" onClick={() => router.push('/')}>Torna a Oggi</button></div>
  );

  return (
    <div className="space-y-4 pb-24">
      <header><p className="lbl">{w ? `${w.label} · ${w.deload ? 'carichi invariati, −40% serie' : `RIR ${w.rir}`}` : 'Mesociclo non iniziato'}</p><h1 className="text-2xl font-bold">{session.label}</h1></header>
      {session.exercises.map(ex => (
        <ExerciseCard key={ex.id} ex={ex} weekNum={w?.week ?? 1} plannedRir={w?.plannedRir ?? 3} sets={allSets} alertsForAlt={alerts} date={t}
          onSetDone={() => setTimer({ sec: ex.restSec, key: Date.now() })} />
      ))}
      <section className="card space-y-3">
        <h2 className="font-semibold">Check dolori (0-10)</h2>
        {PAIN_JOINTS.map(j => (
          <label key={j} className="flex items-center gap-3"><span className="w-24 capitalize">{j}</span>
            <input type="range" min={0} max={10} value={pain[j] ?? 0} onChange={e => setPain({ ...pain, [j]: Number(e.target.value) })} className="flex-1 accent-emerald-600" />
            <span className="w-6 text-right tabular-nums">{pain[j] ?? 0}</span></label>
        ))}
        <button className="btn w-full" onClick={finish}>Termina sessione</button>
      </section>
      {timer && <RestTimer seconds={timer.sec} runKey={timer.key} onClose={() => setTimer(null)} />}
    </div>
  );
}

function ExerciseCard({ ex, weekNum, plannedRir, sets, alertsForAlt, date, onSetDone }: {
  ex: Exercise; weekNum: number; plannedRir: number; sets: ReturnType<typeof useAllSets>; alertsForAlt: ReturnType<typeof painAlerts>; date: string; onSetDone: () => void;
}) {
  const nSets = setsForWeek(ex.sets, weekNum);
  const hist = sessionsByDate(sets ?? [], ex.id);
  const last = hist.find(h => h.date !== date);
  const todays = (sets ?? []).filter(l => l.exerciseId === ex.id && l.date === date);
  const sug = suggest(ex, (sets ?? []).filter(l => l.date !== date), plannedRir);
  const alt = alternativeFor(ex, alertsForAlt);
  const prevSet = todays[todays.length - 1] ?? last?.sets[todays.length] ?? last?.sets[0];
  const lastKg = prevSet?.kg;
  const [kg, setKg] = useState<string>(''); const [reps, setReps] = useState<string>(''); const [rir, setRir] = useState<string>(String(plannedRir));
  const curKg = Number(kg || lastKg || 0), curReps = Number(reps || prevSet?.reps || ex.repMax);
  const step = ex.fundamental ? 5 : 2.5;
  const bump = (set: (v: string) => void, cur: number, d: number) => set(String(Math.max(0, Math.round((cur + d) * 10) / 10)));

  const log = async () => {
    await db.sets.add({ exerciseId: ex.id, date, setIndex: todays.length, kg: curKg, reps: curReps, rir: Number(rir) });
    setKg(String(curKg)); setReps(String(curReps));
    onSetDone();
  };

  return (
    <section className="card space-y-3">
      <div><h2 className="font-semibold">{ex.name}</h2>
        <p className="text-sm text-zinc-500">{nSets}×{ex.repMin === ex.repMax ? ex.repMax : `${ex.repMin}-${ex.repMax}`}{ex.timed ? ' sec' : ''} · rec. {Math.round(ex.restSec / 6) / 10}′</p></div>
      {alt && <p className="text-sm rounded-lg bg-amber-100 dark:bg-amber-950/50 p-2">⚠️ Alternativa: {alt}</p>}
      {last && <p className="text-sm">Ultima volta: {last.sets.map(x => `${x.kg}×${x.reps}`).join(' · ')}</p>}
      <p className={`text-sm font-medium ${sug.kind === 'increase' ? 'text-emerald-600' : sug.kind === 'decrease' ? 'text-red-500' : 'text-zinc-500'}`}>{sug.message}</p>
      {todays.map(l => <p key={l.id} className="text-sm tabular-nums flex justify-between"><span>✓ Serie {l.setIndex + 1}: {l.kg} kg × {l.reps} · RIR {l.rir}</span><button className="text-zinc-400 px-2" aria-label="elimina serie" onClick={() => db.sets.delete(l.id!)}>✕</button></p>)}
      {todays.length < nSets && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><span className="lbl w-12">kg</span>
            <button className="step" onClick={() => bump(setKg, curKg, -step)}>−</button>
            <input className="inp text-center text-lg font-semibold" inputMode="decimal" value={kg || (lastKg ?? '')} onChange={e => setKg(e.target.value)} />
            <button className="step" onClick={() => bump(setKg, curKg, step)}>+</button></div>
          <div className="flex items-center gap-2"><span className="lbl w-12">rep</span>
            <button className="step" onClick={() => bump(setReps, curReps, -1)}>−</button>
            <input className="inp text-center text-lg font-semibold" inputMode="numeric" value={reps || (prevSet?.reps ?? ex.repMax)} onChange={e => setReps(e.target.value)} />
            <button className="step" onClick={() => bump(setReps, curReps, 1)}>+</button></div>
          <div className="flex items-center gap-2"><span className="lbl w-12">RIR</span>
            {[0, 1, 2, 3, 4].map(r => <button key={r} className={Number(rir) === r ? 'btn flex-1 !py-2.5' : 'btn-ghost flex-1 !py-2.5'} onClick={() => setRir(String(r))}>{r}</button>)}</div>
          <button className="btn w-full" onClick={log}>Serie {todays.length + 1}/{nSets} fatta</button>
        </div>
      )}
    </section>
  );
}

export default function Page() { return <Suspense fallback={null}><Sessione /></Suspense>; }
