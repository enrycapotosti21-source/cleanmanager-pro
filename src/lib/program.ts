import type { Exercise, Session, SessionId } from './types';

const ex = (id: string, name: string, sets: number, repMin: number, repMax: number, restSec: number, extra: Partial<Exercise> = {}): Exercise =>
  ({ id, name, sets, repMin, repMax, restSec, ...extra });

export const SESSIONS: Record<SessionId, Session> = {
  lowerA: { id: 'lowerA', label: 'Lower A', exercises: [
    ex('hack', 'Hack squat o leg press (ROM profondo)', 3, 8, 10, 150, { fundamental: true, altIfPain: { joint: 'ginocchio', replacement: 'Leg press con ROM comodo, ginocchia in linea con i piedi, niente rimbalzo sul fondo' } }),
    ex('rdl', 'RDL manubri', 3, 8, 10, 150, { fundamental: true }),
    ex('split', 'Split squat (per gamba)', 2, 10, 10, 120, { altIfPain: { joint: 'ginocchio', replacement: 'Leg press con ROM comodo' } }),
    ex('legcurl-a', 'Leg curl seduto', 3, 10, 12, 90),
    ex('calf-st', 'Calf in piedi, pausa 2" in basso', 3, 10, 12, 60),
    ex('sideplank', 'Side plank (secondi per lato)', 3, 20, 30, 45, { timed: true }),
  ] },
  upperA: { id: 'upperA', label: 'Upper A', exercises: [
    ex('incline-db', 'Panca inclinata manubri, presa neutra', 3, 8, 10, 120, { fundamental: true, altIfPain: { joint: 'polso', replacement: 'Chest press a macchina con impugnatura neutra' } }),
    ex('latpull', 'Lat machine presa neutra', 3, 8, 10, 120, { fundamental: true }),
    ex('chest-row', 'Rematore petto appoggiato', 3, 10, 12, 120),
    ex('lateral', 'Alzate laterali ai cavi', 3, 12, 15, 60),
    ex('fly', 'Fly ai cavi basso-alto', 2, 12, 15, 60),
    ex('pushdown', 'Pushdown corda', 2, 12, 12, 60),
    ex('pallof', 'Pallof press (per lato)', 3, 10, 10, 45),
  ] },
  upperB: { id: 'upperB', label: 'Upper B', exercises: [
    ex('chestpress', 'Chest press macchina', 3, 8, 10, 120, { fundamental: true }),
    ex('cable-row', 'Rematore al cavo presa neutra', 3, 10, 12, 120, { fundamental: true }),
    ex('pullup', 'Trazioni assistite o lat machine', 3, 6, 10, 120),
    ex('reverse-pec', 'Reverse pec deck', 3, 12, 15, 60),
    ex('oh-tri', 'Estensioni tricipiti sopra la testa ai cavi', 3, 12, 12, 60, { altIfPain: { joint: 'gomito', replacement: 'Pushdown corda (evitare skullcrusher e french press)' } }),
    ex('hammer', 'Curl a martello ai cavi', 2, 12, 12, 60),
    ex('deadbug', 'Dead bug (per lato)', 3, 8, 8, 45),
  ] },
  lowerB: { id: 'lowerB', label: 'Lower B', exercises: [
    ex('trapbar', 'Trap bar deadlift, presa neutra (straps se il polso protesta)', 3, 6, 8, 180, { fundamental: true }),
    ex('hipthrust', 'Hip thrust', 3, 8, 10, 120, { fundamental: true }),
    ex('legpress', 'Leg press', 3, 10, 12, 120, { altIfPain: { joint: 'ginocchio', replacement: 'ROM comodo, ginocchia in linea con i piedi, niente rimbalzo' } }),
    ex('legext', 'Leg extension', 2, 12, 15, 60, { altIfPain: { joint: 'ginocchio', replacement: 'Ridurre ROM e carico, fermarsi se il dolore sale' } }),
    ex('legcurl-b', 'Leg curl seduto', 2, 12, 12, 90),
    ex('calf-seat', 'Calf seduto', 3, 12, 15, 60),
    ex('core-b', 'Bird dog 3×6 per lato (5") + curl-up McGill 3×8', 3, 8, 8, 45),
  ] },
};

export const PAIN_JOINTS = ['polso', 'gomito', 'ginocchio', 'spalla', 'schiena'] as const;

export const TARGETS = { kcal: [2650, 2750], protein: [160, 180], steps: [8000, 10000], sleep: [7, 9] } as const;

export const MOBILITY = ['Flessori d\'anca', 'Ischiocrurali', 'Polpacci', 'Pettorali'];
