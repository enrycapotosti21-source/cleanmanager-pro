import { SESSIONS } from './program';
import { iso, toDate } from './mesocycle';
import type { Settings, Slot } from './types';

export const DEFAULT_SCHEDULE: Record<number, Slot> = {
  1: 'lowerA', 2: 'upperA', 3: 'corsa-qualita', 4: 'upperB', 5: 'lowerB', 6: 'riposo', 0: 'corsa-facile',
};
export const WEIGHTS_ONLY_SCHEDULE: Record<number, Slot> = {
  1: 'lowerA', 2: 'upperA', 3: 'riposo', 4: 'upperB', 5: 'lowerB', 6: 'riposo', 0: 'riposo',
};

export const SLOTS: Slot[] = ['lowerA', 'upperA', 'upperB', 'lowerB', 'corsa-qualita', 'corsa-facile', 'riposo'];
export const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function slotLabel(slot: Slot): string {
  if (slot === 'corsa-qualita') return 'Corsa di qualità';
  if (slot === 'corsa-facile') return 'Corsa facile';
  if (slot === 'riposo') return 'Riposo + mobilità';
  return SESSIONS[slot].label;
}
export const isSession = (s: Slot): s is keyof typeof SESSIONS => s in SESSIONS;

/** Cosa è previsto in una data: eccezione puntuale oppure piano settimanale. */
export function planFor(s: Pick<Settings, 'schedule' | 'overrides'>, date: string): { slot: Slot; moved: boolean } {
  const o = s.overrides?.[date];
  if (o) return { slot: o, moved: true };
  return { slot: (s.schedule ?? DEFAULT_SCHEDULE)[toDate(date).getDay()] ?? 'riposo', moved: false };
}

export function setOverride(overrides: Record<string, Slot>, date: string, slot: Slot | null): Record<string, Slot> {
  const next = { ...overrides };
  if (slot === null) delete next[date]; else next[date] = slot;
  return next;
}

/** Sposta quello che è previsto in `from` su `to`; `from` diventa riposo. */
export function moveSlot(s: Pick<Settings, 'schedule' | 'overrides'>, from: string, to: string): Record<string, Slot> {
  const slot = planFor(s, from).slot;
  let o = setOverride(s.overrides ?? {}, from, 'riposo');
  o = setOverride(o, to, slot);
  return o;
}

export function addDays(date: string, n: number): string { const d = toDate(date); d.setDate(d.getDate() + n); return iso(d); }

export function trainingDays(schedule: Record<number, Slot>): number { return Object.values(schedule).filter(s => isSession(s)).length; }
export function runDays(schedule: Record<number, Slot>): number { return Object.values(schedule).filter(s => s.startsWith('corsa')).length; }
