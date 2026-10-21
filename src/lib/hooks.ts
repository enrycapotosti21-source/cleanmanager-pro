'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings, defaultSettings } from './db';

export const useSettings = () => useLiveQuery(getSettings, [], defaultSettings());
export const useDaily = (date: string) => useLiveQuery(() => db.daily.get(date), [date]);
export const useAllDaily = () => useLiveQuery(() => db.daily.orderBy('date').toArray(), [], []);
export const useAllSets = () => useLiveQuery(() => db.sets.toArray(), [], []);
export const useAllRuns = () => useLiveQuery(() => db.runs.orderBy('date').toArray(), [], []);
export const useCheckins = () => useLiveQuery(() => db.checkins.orderBy('date').toArray(), [], []);
export const useChat = () => useLiveQuery(() => db.chat.orderBy('ts').toArray(), [], []);
