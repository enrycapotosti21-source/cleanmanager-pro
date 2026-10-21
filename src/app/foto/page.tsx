'use client';
import Link from 'next/link';
import { useState } from 'react';
import { db } from '@/lib/db';
import { useCheckins, useSettings } from '@/lib/hooks';
import { today } from '@/lib/mesocycle';
import { compressImage } from '@/lib/image';
import Photo from '@/components/Photo';
import type { Checkin, Pose } from '@/lib/types';

const POSES: [Pose, string][] = [['front', 'Fronte'], ['side', 'Lato'], ['back', 'Retro']];

export default function Foto() {
  const s = useSettings(), list = useCheckins() ?? [];
  const [photos, setPhotos] = useState<Checkin['photos']>({});
  const [weight, setWeight] = useState(''), [waist, setWaist] = useState(''), [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [cmp, setCmp] = useState<[number | undefined, number | undefined]>([undefined, undefined]);
  const sorted = [...list].reverse();
  const a = list.find(c => c.id === (cmp[0] ?? list[0]?.id)), b = list.find(c => c.id === (cmp[1] ?? list[list.length - 1]?.id));

  const pick = async (pose: Pose, f?: File) => { if (!f) return; setBusy(true); try { setPhotos({ ...photos, [pose]: await compressImage(f) }); } finally { setBusy(false); } };
  const save = async () => {
    if (!Object.keys(photos).length && !weight && !waist) return;
    await db.checkins.add({ date: today(), photos, weightKg: weight ? Number(weight) : undefined, waistCm: waist ? Number(waist) : undefined, note: note || undefined });
    if (weight) { const cur = (await db.daily.get(today())) ?? { date: today() }; await db.daily.put({ ...cur, weightKg: Number(weight) }); }
    setPhotos({}); setWeight(''); setWaist(''); setNote('');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Foto di progresso</h1>
      <section className="card space-y-3">
        <h2 className="font-semibold">Check-in di oggi</h2>
        <p className="text-sm text-zinc-500">Una volta a settimana, stesso giorno e ora, a digiuno. Stessa luce, stessa distanza, posizione rilassata. Le foto restano sul telefono.</p>
        <div className="grid grid-cols-3 gap-2">
          {POSES.map(([p, label]) => (
            <label key={p} className="block">
              <Photo blob={photos[p]} alt={`+ ${label}`} />
              <input type="file" accept="image/*" className="hidden" onChange={e => pick(p, e.target.files?.[0])} />
              <span className="block text-center text-xs mt-1">{label}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label><span className="lbl">Peso (kg)</span><input className="inp" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} /></label>
          <label><span className="lbl">Vita (cm, ombelico)</span><input className="inp" inputMode="decimal" value={waist} onChange={e => setWaist(e.target.value)} /></label>
        </div>
        <input className="inp" placeholder="Note: energia, sonno, fame, come ti senti…" value={note} onChange={e => setNote(e.target.value)} />
        <button className="btn w-full" disabled={busy} onClick={save}>{busy ? 'Elaboro…' : 'Salva check-in'}</button>
      </section>

      {list.length >= 2 && a && b && (
        <section className="card space-y-3">
          <h2 className="font-semibold">Confronto</h2>
          <div className="grid grid-cols-2 gap-2">
            {[[a, 0], [b, 1]].map(([c, i]) => (
              <select key={i as number} className="inp !py-2" value={(c as Checkin).id} onChange={e => setCmp(i === 0 ? [Number(e.target.value), cmp[1]] : [cmp[0], Number(e.target.value)])}>
                {sorted.map(x => <option key={x.id} value={x.id}>{x.date}{x.weightKg ? ` · ${x.weightKg} kg` : ''}</option>)}</select>))}
          </div>
          {POSES.map(([p, label]) => (a.photos[p] || b.photos[p]) && (
            <div key={p}><p className="lbl mb-1">{label}</p><div className="grid grid-cols-2 gap-2"><Photo blob={a.photos[p]} alt="–" /><Photo blob={b.photos[p]} alt="–" /></div></div>))}
          <p className="text-sm text-zinc-500">{a.weightKg && b.weightKg ? `Peso: ${a.weightKg} → ${b.weightKg} kg (${(b.weightKg - a.weightKg).toFixed(1)}). ` : ''}{a.waistCm && b.waistCm ? `Vita: ${a.waistCm} → ${b.waistCm} cm.` : ''}</p>
        </section>
      )}

      <h2 className="font-semibold">Storico</h2>
      {sorted.length === 0 && <p className="text-sm text-zinc-500">Nessun check-in ancora.</p>}
      {sorted.map(c => (
        <section key={c.id} className="card space-y-2">
          <div className="flex justify-between"><b>{c.date}</b><span className="text-sm text-zinc-500">{c.weightKg ? `${c.weightKg} kg` : ''}{c.waistCm ? ` · vita ${c.waistCm}` : ''}</span></div>
          <div className="grid grid-cols-3 gap-2">{POSES.map(([p, l]) => c.photos[p] ? <Photo key={p} blob={c.photos[p]} alt={l} /> : null)}</div>
          {c.note && <p className="text-sm">{c.note}</p>}
          {c.analysis && <p className="text-sm whitespace-pre-wrap rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3">{c.analysis}</p>}
          <div className="flex gap-2">
            <Link href={`/coach?analyze=${c.id}`} className="btn-ghost flex-1 text-center !py-2.5 text-sm">🤖 Analizza col coach</Link>
            <button className="btn-ghost !py-2.5 text-sm" onClick={() => confirm('Eliminare questo check-in?') && db.checkins.delete(c.id!)}>🗑</button>
          </div>
        </section>
      ))}
      {!s.apiKey && sorted.length > 0 && <p className="text-xs text-zinc-500">Per l’analisi del coach serve la chiave API (Altro → Impostazioni).</p>}
    </div>
  );
}
