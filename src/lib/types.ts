export type Joint = 'polso' | 'gomito' | 'ginocchio' | 'spalla' | 'schiena';
export type SessionId = 'lowerA' | 'upperA' | 'upperB' | 'lowerB';
export type Slot = SessionId | 'corsa-qualita' | 'corsa-facile' | 'riposo';

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
  /** Piano settimanale: 0 = domenica … 6 = sabato */
  schedule: Record<number, Slot>;
  /** Eccezioni per una data specifica (es. allenamento spostato) */
  overrides: Record<string, Slot>;
  coachNotes: string;
  apiKey: string;
  model: string;
  webSearch: boolean;
  photoConsent: boolean;
};

export type Pose = 'front' | 'side' | 'back';
export type Checkin = {
  id?: number; date: string; weightKg?: number; waistCm?: number; note?: string;
  photos: Partial<Record<Pose, Blob>>; analysis?: string;
};
export type ChatMsg = { id?: number; ts: number; role: 'user' | 'assistant'; text: string; photos?: boolean; searched?: boolean };
