import type { Exercise, SetLog } from './types';

export type Suggestion =
  | { kind: 'increase'; deltaKg: number; message: string }
  | { kind: 'decrease'; pct: [number, number]; message: string }
  | { kind: 'keep'; message: string };

/** Raggruppa i set per data, dalla più recente. */
export function sessionsByDate(logs: SetLog[], exerciseId: string): { date: string; sets: SetLog[] }[] {
  const map = new Map<string, SetLog[]>();
  for (const l of logs) if (l.exerciseId === exerciseId) map.set(l.date, [...(map.get(l.date) ?? []), l]);
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([date, sets]) => ({ date, sets: sets.sort((a, b) => a.setIndex - b.setIndex) }));
}

export function stepKg(ex: Exercise): number { return ex.fundamental ? 5 : 2.5; }

/**
 * Doppia progressione.
 * - Tutte le serie al top del range con RIR <= previsto -> +5 kg (fondamentali) / +2.5 kg.
 * - Rep sotto il minimo per due sessioni di fila -> -5/10% del carico.
 */
export function suggest(ex: Exercise, logs: SetLog[], plannedRir: number): Suggestion {
  const hist = sessionsByDate(logs, ex.id);
  if (hist.length === 0) return { kind: 'keep', message: 'Prima volta: scegli un carico con il RIR previsto.' };

  const below = (sets: SetLog[]) => sets.some(s => s.reps < ex.repMin);
  if (hist.length >= 2 && below(hist[0].sets) && below(hist[1].sets)) {
    return { kind: 'decrease', pct: [5, 10], message: 'Rep sotto il minimo per due sessioni di fila: riduci il carico del 5-10%.' };
  }

  const last = hist[0].sets;
  const allTop = last.length >= ex.sets && last.every(s => s.reps >= ex.repMax && s.rir >= plannedRir);
  if (allTop) {
    const d = stepKg(ex);
    return { kind: 'increase', deltaKg: d, message: `Tutte le serie a ${ex.repMax} rep al RIR previsto: prova +${d} kg.` };
  }
  return { kind: 'keep', message: `Resta sul carico e punta a ${ex.repMax} rep su ogni serie.` };
}
