import type { Exercise, Joint } from './types';

export const PAIN_THRESHOLD = 3;

export type PainAlert = { joint: Joint; value: number; persists: boolean };

/** Alert se il valore supera 3/10 oppure il dolore persiste il giorno dopo (>0 sia ieri che oggi). */
export function painAlerts(today: Partial<Record<Joint, number>> | undefined, yesterday: Partial<Record<Joint, number>> | undefined): PainAlert[] {
  const out: PainAlert[] = [];
  for (const [j, v] of Object.entries(today ?? {}) as [Joint, number][]) {
    const persists = (yesterday?.[j] ?? 0) > 0 && v > 0;
    if (v > PAIN_THRESHOLD || persists) out.push({ joint: j, value: v, persists });
  }
  return out;
}

export function alternativeFor(ex: Exercise, alerts: PainAlert[]): string | null {
  if (!ex.altIfPain) return null;
  return alerts.some(a => a.joint === ex.altIfPain!.joint) ? ex.altIfPain.replacement : null;
}

export const JOINT_ADVICE: Partial<Record<Joint, string>> = {
  gomito: 'Estensioni sopra la testa → pushdown corda. Evita skullcrusher e french press.',
  polso: 'Solo presa neutra, polsi dritti, niente bilanciere dritto: macchine e cavi.',
  ginocchio: 'ROM comodo, ginocchia in linea con i piedi, niente rimbalzo sul fondo; leg press al posto dello squat profondo.',
};
