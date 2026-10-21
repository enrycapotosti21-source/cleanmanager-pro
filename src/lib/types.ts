export type Joint = 'polso' | 'gomito' | 'ginocchio' | 'spalla' | 'schiena';
export type SessionId = 'lowerA' | 'upperA' | 'upperB' | 'lowerB';

export type Exercise = {
  id: string; name: string; sets: number; repMin: number; repMax: number; restSec: number;
  notes?: string; fundamental?: boolean; timed?: boolean;
  altIfPain?: { joint: 'polso' | 'gomito' | 'ginocchio'; replacement: string };
};
export type Session = { id: SessionId; label: string; exercises: Exercise[] };
export type SetLog = { id?: number; exerciseId: string; date: string; setIndex: number; kg: number; reps: number; rir: number };
export type RunLog = { id?: number; date: string; type: 'qualita' | 'facile'; km: number; minutes: number; rpe: number };
export type DailyLog = {
  date: string; weightKg?: number; proteinG?: number; kcal?: number; sleepH?: number; steps?: number;
  pain?: Partial<Record<Joint, number>>; mobility?: boolean;
};
export type Settings = {
  startDate: string; age: number; heightCm: number; weightKg: number; bodyFatPct: number; kcalAdjust: number;
};
