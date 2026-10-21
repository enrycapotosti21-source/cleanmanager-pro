import type { DailyLog } from './types';

/** Media mobile a 7 giorni sui soli giorni con peso. */
export function movingAverage(points: { date: string; v: number }[], window = 7): { date: string; v: number; avg: number }[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((p, i) => {
    const slice = sorted.slice(Math.max(0, i - window + 1), i + 1);
    return { ...p, avg: Math.round((slice.reduce((s, x) => s + x.v, 0) / slice.length) * 100) / 100 };
  });
}

function weeklyAverages(logs: DailyLog[]): number[] {
  const w = logs.filter(l => l.weightKg).sort((a, b) => a.date.localeCompare(b.date));
  if (!w.length) return [];
  const first = new Date(w[0].date).getTime();
  const buckets = new Map<number, number[]>();
  for (const l of w) {
    const k = Math.floor((new Date(l.date).getTime() - first) / (7 * 86400000));
    buckets.set(k, [...(buckets.get(k) ?? []), l.weightKg!]);
  }
  return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v.reduce((s, x) => s + x, 0) / v.length);
}

/** Dopo 2 settimane senza calo della media settimanale: -150 kcal. */
export function kcalSuggestion(logs: DailyLog[]): string | null {
  const avgs = weeklyAverages(logs);
  if (avgs.length < 3) return null;
  const [a, b, c] = avgs.slice(-3);
  if (c >= a - 0.1 && c >= b - 0.1) return 'La media settimanale del peso non scende da 2 settimane: prova a ridurre di 150 kcal/giorno.';
  return null;
}

export function weeklyRate(logs: DailyLog[]): number | null {
  const avgs = weeklyAverages(logs);
  return avgs.length >= 2 ? Math.round((avgs[avgs.length - 1] - avgs[avgs.length - 2]) * 100) / 100 : null;
}
