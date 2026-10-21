import Dexie, { type Table } from 'dexie';
import type { DailyLog, RunLog, SetLog, Settings } from './types';
import { nextMonday } from './mesocycle';

class AppDB extends Dexie {
  sets!: Table<SetLog, number>;
  runs!: Table<RunLog, number>;
  daily!: Table<DailyLog, string>;
  settings!: Table<Settings & { key: string }, string>;
  constructor() {
    super('allenamento');
    this.version(1).stores({ sets: '++id, exerciseId, date', runs: '++id, date', daily: 'date', settings: 'key' });
  }
}

export const db = new AppDB();

export const defaultSettings = (): Settings => ({
  startDate: nextMonday(), age: 22, heightCm: 192, weightKg: 95.5, bodyFatPct: 20, kcalAdjust: 0,
});

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('main');
  return s ? { ...defaultSettings(), ...s } : defaultSettings();
}
export async function saveSettings(s: Settings) { await db.settings.put({ ...s, key: 'main' }); }

export async function patchDaily(date: string, patch: Partial<DailyLog>) {
  const cur = (await db.daily.get(date)) ?? { date };
  await db.daily.put({ ...cur, ...patch, pain: { ...cur.pain, ...patch.pain } });
}

export async function exportAll(): Promise<string> {
  return JSON.stringify({ version: 1, sets: await db.sets.toArray(), runs: await db.runs.toArray(), daily: await db.daily.toArray(), settings: await getSettings() }, null, 2);
}

export async function importAll(json: string) {
  const d = JSON.parse(json);
  if (!d || d.version !== 1) throw new Error('File non valido');
  await db.transaction('rw', [db.sets, db.runs, db.daily, db.settings], async () => {
    await Promise.all([db.sets.clear(), db.runs.clear(), db.daily.clear()]);
    await db.sets.bulkAdd(d.sets ?? []); await db.runs.bulkAdd(d.runs ?? []); await db.daily.bulkPut(d.daily ?? []);
    if (d.settings) await saveSettings(d.settings);
  });
}
