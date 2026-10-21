'use client';
import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAllDaily, useAllRuns, useAllSets } from '@/lib/hooks';
import { movingAverage, weeklyRate } from '@/lib/nutrition';
import { paceSecPerKm } from '@/lib/running';
import { PAIN_JOINTS, SESSIONS } from '@/lib/program';

const COLORS = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed'];
const Chart = ({ data, lines, domain }: { data: object[]; lines: [string, string][]; domain?: [string | number, string | number] }) => (
  <div className="h-56"><ResponsiveContainer><LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
    <CartesianGrid strokeOpacity={0.15} /><XAxis dataKey="date" tickFormatter={d => String(d).slice(5)} fontSize={11} /><YAxis domain={domain ?? ['auto', 'auto']} fontSize={11} />
    <Tooltip /><Legend />{lines.map(([k, n], i) => <Line key={k} dataKey={k} name={n} stroke={COLORS[i]} dot={k !== 'avg'} strokeWidth={k === 'avg' ? 3 : 1.5} connectNulls />)}
  </LineChart></ResponsiveContainer></div>
);

export default function Progressi() {
  const daily = useAllDaily() ?? [], sets = useAllSets() ?? [], runs = useAllRuns() ?? [];
  const exercises = Object.values(SESSIONS).flatMap(s => s.exercises);
  const [exId, setExId] = useState(exercises[0].id);
  const weights = movingAverage(daily.filter(d => d.weightKg).map(d => ({ date: d.date, v: d.weightKg! })));
  const rate = weeklyRate(daily);
  const load = [...new Set(sets.filter(s => s.exerciseId === exId).map(s => s.date))].sort().map(date => ({ date, kg: Math.max(...sets.filter(s => s.exerciseId === exId && s.date === date).map(s => s.kg)) }));
  const pace = runs.map(r => ({ date: r.date, passo: Math.round((paceSecPerKm(r.km, r.minutes) / 60) * 100) / 100 }));
  const pain = daily.filter(d => d.pain).map(d => ({ date: d.date, ...d.pain }));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Progressi</h1>
      <section className="card"><h2 className="font-semibold">Peso e media 7 giorni</h2>{rate != null && <p className="text-sm">Variazione media settimanale: <b>{rate > 0 ? '+' : ''}{rate} kg</b> (obiettivo −0,3/−0,5)</p>}
        {weights.length ? <Chart data={weights} lines={[['v', 'Peso'], ['avg', 'Media 7g']]} /> : <p className="text-sm text-zinc-500">Inserisci il peso in “Salute”.</p>}</section>
      <section className="card"><h2 className="font-semibold mb-2">Carico per esercizio (kg max)</h2>
        <select className="inp mb-2" value={exId} onChange={e => setExId(e.target.value)}>{exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
        {load.length ? <Chart data={load} lines={[['kg', 'kg']]} /> : <p className="text-sm text-zinc-500">Nessun dato ancora.</p>}</section>
      <section className="card"><h2 className="font-semibold">Passo di corsa (min/km)</h2>{pace.length ? <Chart data={pace} lines={[['passo', 'Passo']]} /> : <p className="text-sm text-zinc-500">Nessuna corsa registrata.</p>}</section>
      <section className="card"><h2 className="font-semibold">Storico dolori</h2>{pain.length ? <Chart data={pain} lines={PAIN_JOINTS.map(j => [j, j] as [string, string])} domain={[0, 10]} /> : <p className="text-sm text-zinc-500">Nessun dato.</p>}</section>
    </div>
  );
}
