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
      <div className="card space-y-3">
        <div><h2 className="font-semibold">Coach AI</h2><p className="text-xs text-zinc-500">Chiave API Anthropic (console.anthropic.com). Resta solo su questo dispositivo e non viene mai esportata. Il coach funziona online e consuma credito a ogni risposta.</p></div>
        <input className="inp" type="password" autoComplete="off" placeholder="sk-ant-…" value={f.apiKey} onChange={e => setF({ ...f, apiKey: e.target.value.trim() })} />
        <label><span className="lbl">Modello</span><select className="inp" value={f.model} onChange={e => setF({ ...f, model: e.target.value })}>
          <option value="claude-opus-5-5">Opus 5.5 — il più accurato (consigliato)</option><option value="claude-sonnet-5-5">Sonnet 5.5 — più veloce ed economico</option></select></label>
        <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={f.webSearch} onChange={e => setF({ ...f, webSearch: e.target.checked })} /><span className="text-sm">Ricerca web per risposte aggiornate (studi, nutrizione, biomeccanica)</span></label>
        <label><span className="lbl">Note per il coach</span><textarea className="inp" rows={3} placeholder="Infortuni, cibi che eviti, orari, attrezzatura, obiettivi…" value={f.coachNotes} onChange={e => setF({ ...f, coachNotes: e.target.value })} /></label>
        <button className="btn w-full" onClick={async () => { await saveSettings(f); setMsg('Salvato'); }}>Salva</button>
      </div>
      <div className="card space-y-2"><h2 className="font-semibold">Dati</h2>
        <button className="btn-ghost w-full" onClick={doExport}>Esporta JSON</button>
        <label className="btn-ghost block text-center">Importa JSON<input type="file" accept="application/json" className="hidden" onChange={doImport} /></label>
        <p className="text-xs text-zinc-500">I dati restano sul telefono (IndexedDB). Escono solo le domande al coach (e le foto che scegli di far analizzare) verso Anthropic.</p></div>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
