'use client';
import { useEffect, useState } from 'react';
import { exportAll, importAll, saveSettings } from '@/lib/db';
import { useSettings } from '@/lib/hooks';
import { nextMonday } from '@/lib/mesocycle';
import type { Settings } from '@/lib/types';

export default function Impostazioni() {
  const saved = useSettings();
  const [f, setF] = useState<Settings>(saved);
  const [msg, setMsg] = useState('');
  useEffect(() => setF(saved), [saved.startDate, saved.weightKg]); // eslint-disable-line
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });
  const doExport = async () => {
    const url = URL.createObjectURL(new Blob([await exportAll()], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: `allenamento-${new Date().toISOString().slice(0, 10)}.json` }).click();
  };
  const doImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!confirm('Importare sostituisce tutti i dati attuali. Continuare?')) return;
    try { await importAll(await file.text()); setMsg('Import completato'); } catch (err) { setMsg(String(err)); }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Impostazioni</h1>
      <div className="card grid grid-cols-2 gap-3">
        <label className="col-span-2"><span className="lbl">Inizio mesociclo</span><input type="date" className="inp" value={f.startDate} onChange={e => setF({ ...f, startDate: e.target.value })} /></label>
        <button className="btn-ghost col-span-2" onClick={() => setF({ ...f, startDate: nextMonday() })}>Primo lunedì utile</button>
        <label><span className="lbl">Età</span><input className="inp" inputMode="numeric" value={f.age} onChange={num('age')} /></label>
        <label><span className="lbl">Altezza (cm)</span><input className="inp" inputMode="numeric" value={f.heightCm} onChange={num('heightCm')} /></label>
        <label><span className="lbl">Peso (kg)</span><input className="inp" inputMode="decimal" value={f.weightKg} onChange={num('weightKg')} /></label>
        <label><span className="lbl">Massa grassa % (stima)</span><input className="inp" inputMode="decimal" value={f.bodyFatPct} onChange={num('bodyFatPct')} /></label>
        <button className="btn col-span-2" onClick={async () => { await saveSettings(f); setMsg('Salvato'); }}>Salva</button>
      </div>
      <div className="card space-y-2"><h2 className="font-semibold">Dati</h2>
        <button className="btn-ghost w-full" onClick={doExport}>Esporta JSON</button>
        <label className="btn-ghost block text-center">Importa JSON<input type="file" accept="application/json" className="hidden" onChange={doImport} /></label>
        <p className="text-xs text-zinc-500">Tutto resta sul telefono (IndexedDB). Nessun dato viene inviato fuori.</p></div>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
