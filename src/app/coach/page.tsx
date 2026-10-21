'use client';
import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { db, patchSettings } from '@/lib/db';
import { useAllDaily, useAllRuns, useAllSets, useChat, useCheckins, useSettings } from '@/lib/hooks';
import { today } from '@/lib/mesocycle';
import { askCoach, explainError, type CoachImage } from '@/lib/coach';
import { buildContext } from '@/lib/coachContext';
import { blobToBase64 } from '@/lib/image';
import type { Checkin, Pose } from '@/lib/types';

const SUGGEST = ['Come sta andando la settimana?', 'Aggiusta le kcal in base al mio peso', 'Spostami gli allenamenti: questa settimana ho solo 3 giorni', 'Controlla la mia tecnica su RDL e trap bar', 'Cosa dicono gli studi recenti su proteine e ricomposizione?'];
const LABEL: Record<Pose, string> = { front: 'fronte', side: 'lato', back: 'retro' };

async function photosOf(c: Checkin, who: string): Promise<CoachImage[]> {
  const out: CoachImage[] = [];
  for (const p of ['front', 'side', 'back'] as Pose[]) if (c.photos[p]) out.push({ label: `${who} (${c.date}) – ${LABEL[p]}:`, base64: await blobToBase64(c.photos[p]!) });
  return out;
}

function Coach() {
  const s = useSettings(), chat = useChat() ?? [], daily = useAllDaily() ?? [], sets = useAllSets() ?? [], runs = useAllRuns() ?? [], checkins = useCheckins() ?? [];
  const analyzeId = Number(useSearchParams().get('analyze')) || undefined;
  const target = checkins.find(c => c.id === analyzeId);
  const [text, setText] = useState(''), [live, setLive] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const end = useRef<HTMLDivElement>(null), abort = useRef<AbortController | null>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat.length, live]);

  const ensureConsent = async () => {
    if (s.photoConsent) return true;
    if (!confirm('Per analizzarle, le foto vengono inviate ad Anthropic (api.anthropic.com) usando la tua chiave API. Non vengono salvate altrove dall’app. Continuare?')) return false;
    await patchSettings({ photoConsent: true }); return true;
  };

  const send = async (userText: string, images: CoachImage[] = [], onDone?: (reply: string) => void) => {
    if (!userText.trim() || busy) return;
    setErr(''); setBusy(true); setLive(''); setText('');
    const history = chat.map(m => ({ role: m.role, text: m.text }));
    await db.chat.add({ ts: Date.now(), role: 'user', text: userText, photos: images.length > 0 });
    abort.current = new AbortController();
    try {
      const context = buildContext({ settings: s, daily, sets, runs, checkins, today: today() });
      const r = await askCoach({ settings: s, context, history, userText, images, onText: setLive, signal: abort.current.signal });
      await db.chat.add({ ts: Date.now(), role: 'assistant', text: r.text || '(nessuna risposta)', searched: r.searched });
      onDone?.(r.text);
    } catch (e) { setErr(explainError(e)); }
    finally { setBusy(false); setLive(''); }
  };

  const analyze = async () => {
    if (!target || !(await ensureConsent())) return;
    const prev = [...checkins].filter(c => c.date < target.date).pop();
    const images = [...(prev ? await photosOf(prev, 'Check-in precedente') : []), ...(await photosOf(target, 'Check-in attuale'))];
    const prompt = `Analizza il mio check-in del ${target.date}${prev ? ` confrontandolo con quello del ${prev.date}` : ' (è il primo, fissiamo il punto di partenza)'}. Peso ${target.weightKg ?? 'n/d'} kg, vita ${target.waistCm ?? 'n/d'} cm${target.note ? `, note: ${target.note}` : ''}. Dimmi: 1) cosa cambia nelle foto, 2) come sta andando secondo i dati, 3) cosa modificare questa settimana (allenamento, kcal, abitudini).`;
    await send(prompt, images, reply => db.checkins.update(target.id!, { analysis: reply }));
  };

  return (
    <div className="flex flex-col gap-3 min-h-[calc(100dvh-9.5rem)]">
      <header className="flex items-center justify-between"><h1 className="text-2xl font-bold">Coach</h1>
        {chat.length > 0 && <button className="chip" onClick={() => confirm('Cancellare la chat?') && db.chat.clear()}>Svuota</button>}</header>

      {!s.apiKey && <div className="card text-sm space-y-2"><p>Per attivare il coach serve la tua chiave API Anthropic. Resta salvata solo su questo telefono.</p><Link href="/impostazioni" className="btn block text-center">Aggiungi chiave</Link></div>}
      {target && s.apiKey && <div className="card space-y-2"><p className="text-sm">Check-in del <b>{target.date}</b> pronto per l’analisi (con confronto sul precedente).</p><button className="btn w-full" disabled={busy} onClick={analyze}>📸 Analizza foto e dati</button></div>}

      <div className="space-y-3">
        {chat.length === 0 && !live && <div className="flex flex-wrap gap-2">{SUGGEST.map(q => <button key={q} className="chip text-left" disabled={!s.apiKey} onClick={() => send(q)}>{q}</button>)}</div>}
        {chat.map(m => (
          <div key={m.id} className={m.role === 'user' ? 'ml-10' : 'mr-4'}>
            <div className={`rounded-2xl px-4 py-3 whitespace-pre-wrap text-[15px] leading-relaxed ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'}`}>{m.text}</div>
            {(m.photos || m.searched) && <p className="text-[11px] text-zinc-500 mt-1 px-2">{m.photos ? '📸 con foto ' : ''}{m.searched ? '🔎 ricerca web' : ''}</p>}
          </div>))}
        {live && <div className="mr-4 rounded-2xl px-4 py-3 whitespace-pre-wrap text-[15px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">{live}</div>}
        {busy && !live && <p className="text-sm text-zinc-500 px-2">Il coach sta pensando…</p>}
        {err && <p className="card text-sm border-red-500 text-red-600">{err}</p>}
        <div ref={end} />
      </div>

      <form className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] mt-auto flex gap-2 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur py-2" onSubmit={e => { e.preventDefault(); send(text); }}>
        <input className="inp" placeholder="Scrivi al coach…" value={text} onChange={e => setText(e.target.value)} disabled={!s.apiKey} enterKeyHint="send" />
        {busy ? <button type="button" className="btn-ghost" onClick={() => abort.current?.abort()}>■</button> : <button className="btn" disabled={!text.trim() || !s.apiKey}>Invia</button>}
      </form>
    </div>
  );
}

export default function Page() { return <Suspense fallback={null}><Coach /></Suspense>; }
