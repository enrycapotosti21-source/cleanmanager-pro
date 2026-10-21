'use client';
import { useEffect, useState } from 'react';
import { patchDaily } from '@/lib/db';
import type { DailyLog } from '@/lib/types';

const F = [['weightKg', 'Peso', 'kg', 0.1, 'decimal'], ['proteinG', 'Proteine', 'g', 10, 'numeric'], ['steps', 'Passi', '', 500, 'numeric'], ['sleepH', 'Sonno', 'h', 0.5, 'decimal']] as const;

/** Inserimento rapido: tocca +/− oppure scrivi; si salva da solo. */
export default function QuickDaily({ date, log }: { date: string; log?: DailyLog }) {
  const [v, setV] = useState<Record<string, string>>({});
  useEffect(() => { setV(Object.fromEntries(F.map(([k]) => [k, log?.[k] != null ? String(log[k]) : '']))); }, [date, log?.weightKg, log?.proteinG, log?.steps, log?.sleepH]); // eslint-disable-line
  const save = (k: string, raw: string) => patchDaily(date, { [k]: raw === '' || isNaN(Number(raw)) ? undefined : Number(raw) });
  const bump = (k: string, step: number, dir: 1 | -1, base: number) => {
    const cur = v[k] === '' || v[k] == null ? base : Number(v[k]);
    const next = String(Math.max(0, Math.round((cur + dir * step) * 10) / 10));
    setV({ ...v, [k]: next }); save(k, next);
  };
  const base: Record<string, number> = { weightKg: 95, proteinG: 150, steps: 7500, sleepH: 7 };
  return (
    <section className="card space-y-3">
      <h2 className="font-semibold">Oggi in un tocco</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {F.map(([k, label, unit, step, mode]) => (
          <div key={k}><span className="lbl">{label}{unit ? ` (${unit})` : ''}</span>
            <div className="flex gap-2 mt-1">
              <button className="step" onClick={() => bump(k, step, -1, base[k])} aria-label={`meno ${label}`}>−</button>
              <input className="inp text-center" inputMode={mode} value={v[k] ?? ''} onChange={e => setV({ ...v, [k]: e.target.value })} onBlur={e => save(k, e.target.value)} />
              <button className="step" onClick={() => bump(k, step, 1, base[k])} aria-label={`più ${label}`}>+</button>
            </div></div>
        ))}
      </div>
      <button className={log?.mobility ? 'btn w-full' : 'btn-ghost w-full'} onClick={() => patchDaily(date, { mobility: !log?.mobility })}>{log?.mobility ? '✓ Mobilità fatta' : 'Segna mobilità fatta'}</button>
    </section>
  );
}
