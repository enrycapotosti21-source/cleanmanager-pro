'use client';
import { useEffect, useState } from 'react';
import { patchDaily } from '@/lib/db';
import { useDaily } from '@/lib/hooks';
import { today } from '@/lib/mesocycle';
import { MOBILITY, PAIN_JOINTS, TARGETS } from '@/lib/program';

const FIELDS = [
  ['weightKg', 'Peso mattina (kg)', 'decimal', ''], ['proteinG', 'Proteine (g)', 'numeric', `${TARGETS.protein[0]}-${TARGETS.protein[1]}`],
  ['kcal', 'Kcal (opz.)', 'numeric', `${TARGETS.kcal[0]}-${TARGETS.kcal[1]}`], ['sleepH', 'Sonno (ore)', 'decimal', `${TARGETS.sleep[0]}-${TARGETS.sleep[1]}`],
  ['steps', 'Passi', 'numeric', `${TARGETS.steps[0]}-${TARGETS.steps[1]}`],
] as const;

export default function Salute() {
  const date = today();
  const log = useDaily(date);
  const [v, setV] = useState<Record<string, string>>({});
  useEffect(() => { if (log) setV(Object.fromEntries(FIELDS.map(([k]) => [k, log[k] != null ? String(log[k]) : '']))); }, [log?.date]); // eslint-disable-line
  const save = () => patchDaily(date, Object.fromEntries(FIELDS.map(([k]) => [k, v[k] ? Number(v[k]) : undefined])));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Salute di oggi</h1>
      <div className="card grid grid-cols-2 gap-3">
        {FIELDS.map(([k, label, mode, target]) => (
          <label key={k}><span className="lbl">{label}</span><input className="inp" inputMode={mode} placeholder={target} value={v[k] ?? ''} onChange={e => setV({ ...v, [k]: e.target.value })} /></label>
        ))}
        <button className="btn col-span-2" onClick={save}>Salva</button>
      </div>
      <div className="card space-y-2"><h2 className="font-semibold">Dolori (0-10)</h2>
        {PAIN_JOINTS.map(j => <label key={j} className="flex items-center gap-3"><span className="w-24 capitalize">{j}</span>
          <input type="range" min={0} max={10} className="flex-1 accent-emerald-600" value={log?.pain?.[j] ?? 0} onChange={e => patchDaily(date, { pain: { [j]: Number(e.target.value) } })} /><span className="w-6 text-right">{log?.pain?.[j] ?? 0}</span></label>)}
      </div>
      <div className="card"><h2 className="font-semibold mb-2">Mobilità (2′ per lato, 3×/sett.)</h2>
        <p className="text-sm text-zinc-500 mb-2">{MOBILITY.join(' · ')}. Falla dopo l’allenamento o la sera.</p>
        <button className={log?.mobility ? 'btn w-full' : 'btn-ghost w-full'} onClick={() => patchDaily(date, { mobility: !log?.mobility })}>{log?.mobility ? '✓ Fatta oggi' : 'Segna come fatta'}</button></div>
    </div>
  );
}
