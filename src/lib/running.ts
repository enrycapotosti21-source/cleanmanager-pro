export function paceSecPerKm(km: number, minutes: number): number { return km > 0 ? (minutes * 60) / km : 0; }
export function formatPace(sec: number): string {
  if (!sec) return '–';
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, '0')}`;
}
