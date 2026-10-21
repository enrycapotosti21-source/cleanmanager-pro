import Dexie, { type Table } from 'dexie';
import type { ChatMsg, Checkin, DailyLog, Pose, RunLog, SetLog, Settings } from './types';
import { nextMonday } from './mesocycle';
import { DEFAULT_SCHEDULE } from './schedule';

class AppDB extends Dexie {
  sets!: Table<SetLog, number>;
  runs!: Table<RunLog, number>;
  daily!: Table<DailyLog, string>;
  settings!: Table<Settings & { key: string }, string>;
  checkins!: Table<Checkin, number>;
  chat!: Table<ChatMsg, number>;
  constructor() {
    super('allenamento');
    this.version(1).stores({ sets: '++id, exerciseId, date', runs: '++id, date', daily: 'date', settings: 'key' });
    this.version(2).stores({ checkins: '++id, date', chat: '++id, ts' });
  }
}

export const db = new AppDB();

export const DEFAULT_MODEL = 'claude-opus-5-5';

export const defaultSettings = (): Settings => ({
  startDate: nextMonday(), age: 22, heightCm: 192, weightKg: 95.5, bodyFatPct: 20, kcalAdjust: 0,
  schedule: { ...DEFAULT_SCHEDULE }, overrides: {}, coachNotes: '', apiKey: '', model: DEFAULT_MODEL, webSearch: true, photoConsent: false,
});

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('main');
  return s ? { ...defaultSettings(), ...s } : defaultSettings();
}
export async function saveSettings(s: Settings) { await db.settings.put({ ...s, key: 'main' }); }
export async function patchSettings(patch: Partial<Settings>) { await saveSettings({ ...(await getSettings()), ...patch }); }

export async function patchDaily(date: string, patch: Partial<DailyLog>) {
  const cur = (await db.daily.get(date)) ?? { date };
  await db.daily.put({ ...cur, ...patch, pain: { ...cur.pain, ...patch.pain } });
}

const toDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(b); });
const fromDataUrl = async (u: string) => (await fetch(u)).blob();
const POSES: Pose[] = ['front', 'side', 'back'];

/** Esporta tutto (foto incluse come data URL). La chiave API non viene mai esportata. */
export async function exportAll(): Promise<string> {
  const checkins = await Promise.all((await db.checkins.toArray()).map(async c => ({
    ...c, photos: Object.fromEntries(await Promise.all(POSES.filter(p => c.photos[p]).map(async p => [p, await toDataUrl(c.photos[p]!)]))),
  })));
  const { apiKey: _k, ...settings } = await getSettings(); void _k;
  return JSON.stringify({ version: 2, sets: await db.sets.toArray(), runs: await db.runs.toArray(), daily: await db.daily.toArray(), settings, checkins, chat: await db.chat.toArray() });
}

export async function importAll(json: string) {
  const d = JSON.parse(json);
  if (!d || ![1, 2].includes(d.version)) throw new Error('File non valido');
  const checkins: Checkin[] = await Promise.all((d.checkins ?? []).map(async (c: { photos: Record<string, string> } & Omit<Checkin, 'photos'>) => ({
    ...c, photos: Object.fromEntries(await Promise.all(Object.entries(c.photos ?? {}).map(async ([k, u]) => [k, await fromDataUrl(u)]))),
  })));
  const keepKey = (await getSettings()).apiKey;
  await db.transaction('rw', [db.sets, db.runs, db.daily, db.settings, db.checkins, db.chat], async () => {
    await Promise.all([db.sets.clear(), db.runs.clear(), db.daily.clear(), db.checkins.clear(), db.chat.clear()]);
    await db.sets.bulkAdd(d.sets ?? []); await db.runs.bulkAdd(d.runs ?? []); await db.daily.bulkPut(d.daily ?? []);
    await db.checkins.bulkAdd(checkins); await db.chat.bulkAdd(d.chat ?? []);
    if (d.settings) await saveSettings({ ...defaultSettings(), ...d.settings, apiKey: keepKey });
  });
}
