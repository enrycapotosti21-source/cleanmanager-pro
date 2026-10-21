'use client';
import { useState } from 'react';
import { db } from '@/lib/db';
import { useAllRuns, useSettings } from '@/lib/hooks';
import { runPlan, today, weekInfo } from '@/lib/mesocycle';
import { formatPace, paceSecPerKm } from '@/lib/running';

export default function Corsa() {
  const s = useSettings(), runs = useAllRuns();
  const w = weekInfo(s.startDate, today())?.week ?? 1;
  const [type, setType] = useState<'qualita' | 'facile'>(new Date().getDay() === 0 ? 'facile' : 'qualita');
  const [km, setKm] = useState(''), [min, setMin] = useState(''), [rpe, setRpe] = useState('6');
  const plan = runPlan(type, w);
  const pace = paceSecPerKm(Number(km), Number(min));
  const save = async () => { if (!km || !min) return; await db.runs.add({ date: today(), type, km: Number(km), minutes: Number(min), rpe: Number(rpe) }); setKm(''); setMin(''); };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Corsa</h1>
      <div className="grid grid-cols-2 gap-2">{(['qualita', 'facile'] as const).map(t => <button key={t} onClick={() => setType(t)} className={t === type ? 'btn' : 'btn-ghost'}>{t === 'qualita' ? 'Qualità (mer)' : 'Facile (dom)'}</button>)}</div>
      <div className="card"><p className="font-semibold">{plan.title}</p><p className="text-sm">{plan.detail}</p></div>
      <div className="card space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <label><span className="lbl">km</span><input className="inp" inputMode="decimal" value={km} onChange={e => setKm(e.target.value)} /></label>
          <label><span className="lbl">minuti</span><input className="inp" inputMode="decimal" value={min} onChange={e => setMin(e.target.value)} /></label>
          <label><span className="lbl">RPE 1-10</span><input className="inp" inputMode="numeric" value={rpe} onChange={e => setRpe(e.target.value)} /></label>
        </div>
        <p className="text-sm">Passo medio: <b>{formatPace(pace)}</b> /km</p>
        <button className="btn w-full" onClick={save}>Salva corsa</button>
      </div>
      <ul className="space-y-2">{[...(runs ?? [])].reverse().map(r => (
        <li key={r.id} className="card flex justify-between text-sm"><span>{r.date} · {r.type === 'qualita' ? 'qualità' : 'facile'}</span><span className="tabular-nums">{r.km} km · {formatPace(paceSecPerKm(r.km, r.minutes))} · RPE {r.rpe}</span></li>))}</ul>
    </div>
  );
}
