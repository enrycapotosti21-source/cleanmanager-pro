import { describe, expect, it } from 'vitest';
import { suggest } from '../progression';
import { deloadSets, runPlan, weekInfo } from '../mesocycle';
import { painAlerts } from '../pain';
import { kcalSuggestion } from '../nutrition';
import { SESSIONS } from '../program';
import type { SetLog } from '../types';

const squat = SESSIONS.lowerA.exercises[0]; // fondamentale 3x8-10
const iso = SESSIONS.upperA.exercises[3]; // isolamento 3x12-15
const mk = (exerciseId: string, date: string, reps: number[], rir = 3): SetLog[] =>
  reps.map((r, i) => ({ exerciseId, date, setIndex: i, kg: 100, reps: r, rir }));

describe('progressione', () => {
  it('+5 kg sui fondamentali quando tutte le serie sono al top', () => {
    const s = suggest(squat, mk(squat.id, '2026-10-26', [10, 10, 10]), 3);
    expect(s).toMatchObject({ kind: 'increase', deltaKg: 5 });
  });
  it('+2.5 kg sugli isolamenti', () => {
    expect(suggest(iso, mk(iso.id, '2026-10-26', [15, 15, 15]), 3)).toMatchObject({ kind: 'increase', deltaKg: 2.5 });
  });
  it('non progredisce se il RIR è più basso del previsto', () => {
    expect(suggest(squat, mk(squat.id, '2026-10-26', [10, 10, 10], 1), 3).kind).toBe('keep');
  });
  it('riduce il carico dopo due sessioni sotto il minimo', () => {
    const logs = [...mk(squat.id, '2026-10-26', [7, 6, 6]), ...mk(squat.id, '2026-11-02', [7, 7, 6])];
    expect(suggest(squat, logs, 3)).toMatchObject({ kind: 'decrease', pct: [5, 10] });
  });
  it('una sola sessione sotto il minimo non basta', () => {
    expect(suggest(squat, mk(squat.id, '2026-10-26', [7, 7, 7]), 3).kind).toBe('keep');
  });
});

describe('mesociclo e deload', () => {
  const start = '2026-10-26';
  it('RIR per settimana', () => {
    expect(weekInfo(start, '2026-10-26')?.plannedRir).toBe(3);
    expect(weekInfo(start, '2026-11-09')?.plannedRir).toBe(2);
    expect(weekInfo(start, '2026-11-23')?.plannedRir).toBe(1);
  });
  it('settimana 7 è deload e il ciclo si ripete', () => {
    expect(weekInfo(start, '2026-12-07')).toMatchObject({ week: 7, deload: true });
    expect(weekInfo(start, '2026-12-14')).toMatchObject({ week: 1, deload: false });
  });
  it('prima dell’inizio non c’è settimana', () => { expect(weekInfo(start, '2026-10-20')).toBeNull(); });
  it('deload = -40% delle serie', () => {
    expect([deloadSets(3), deloadSets(2), deloadSets(1)]).toEqual([2, 1, 1]);
  });
  it('piano corsa di qualità per fase', () => {
    expect(runPlan('qualita', 2).title).toMatch(/3 km/);
    expect(runPlan('qualita', 5).title).toMatch(/ripetute/);
    expect(runPlan('qualita', 7).title).toMatch(/Deload/);
  });
});

describe('dolori', () => {
  it('alert sopra 3/10', () => { expect(painAlerts({ polso: 4 }, undefined)).toHaveLength(1); });
  it('nessun alert a 3/10 senza persistenza', () => { expect(painAlerts({ polso: 3 }, { polso: 0 })).toHaveLength(0); });
  it('alert se persiste il giorno dopo', () => { expect(painAlerts({ gomito: 2 }, { gomito: 2 })[0].persists).toBe(true); });
});

describe('nutrizione', () => {
  const day = (d: string, w: number) => ({ date: d, weightKg: w });
  it('suggerisce -150 kcal se la media non scende per 2 settimane', () => {
    const logs = [day('2026-10-26', 95), day('2026-11-02', 95), day('2026-11-09', 95.2)];
    expect(kcalSuggestion(logs)).toMatch(/150/);
  });
  it('nessun suggerimento se scende', () => {
    expect(kcalSuggestion([day('2026-10-26', 95), day('2026-11-02', 94.5), day('2026-11-09', 94)])).toBeNull();
  });
});
