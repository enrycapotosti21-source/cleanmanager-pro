export const MESO_WEEKS = 7;

export type WeekInfo = { week: number; rir: string; plannedRir: number; deload: boolean; label: string; dayIndex: number };

export function toDate(iso: string): Date { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
export function iso(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function today(): string { return iso(new Date()); }

/** Primo lunedì a partire da oggi (oggi incluso se lunedì). */
export function nextMonday(from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  return iso(d);
}

export function rirForWeek(week: number): string {
  if (week <= 2) return '3';
  if (week <= 4) return '2';
  if (week <= 6) return '1';
  return '3';
}

/** Settimana (1-7) del mesociclo per una data; il ciclo si ripete. Null se prima dell'inizio. */
export function weekInfo(startDate: string, date: string): WeekInfo | null {
  const days = Math.floor((toDate(date).getTime() - toDate(startDate).getTime()) / 86400000);
  if (days < 0) return null;
  const week = (Math.floor(days / 7) % MESO_WEEKS) + 1;
  const deload = week === MESO_WEEKS;
  return {
    week, deload, dayIndex: days, plannedRir: week === 6 ? 1 : Number(rirForWeek(week)),
    rir: week === 6 ? '0-1 (ultima serie dei fondamentali)' : rirForWeek(week),
    label: deload ? 'Deload' : `Settimana ${week}`,
  };
}

/** Deload: -40% delle serie (arrotondato), minimo 1. */
export function deloadSets(sets: number): number { return Math.max(1, Math.round(sets * 0.6)); }
export function setsForWeek(sets: number, week: number): number { return week === MESO_WEEKS ? deloadSets(sets) : sets; }

export type RunPlan = { title: string; detail: string };
export function runPlan(type: 'qualita' | 'facile', week: number): RunPlan {
  if (type === 'facile') return { title: 'Corsa facile', detail: '35-40′ a 6:15-6:30/km. Talk test: se non parli a frasi complete, rallenta. RPE 4-5.' };
  if (week <= 3) return { title: 'Qualità: 3 km continui', detail: '3 km a ~5:30/km.' };
  if (week <= 6) return { title: 'Qualità: ripetute', detail: '5 × 3′ a ~5:05/km con 2′ di corsa lenta in mezzo.' };
  return { title: 'Deload: 3 km facili', detail: '3 km facili, sciolti.' };
}
