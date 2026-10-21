import type { Checkin, DailyLog, RunLog, SetLog, Settings } from './types';
import { SESSIONS, TARGETS } from './program';
import { weekInfo } from './mesocycle';
import { DAY_ORDER, DAY_NAMES, slotLabel } from './schedule';
import { kcalSuggestion, movingAverage, weeklyRate } from './nutrition';
import { formatPace, paceSecPerKm } from './running';
import { sessionsByDate } from './progression';

type Data = { settings: Settings; daily: DailyLog[]; sets: SetLog[]; runs: RunLog[]; checkins: Omit<Checkin, 'photos'>[]; today: string };

export const COACH_SYSTEM = `Sei il personal trainer personale dell'utente, disponibile 24 ore su 24: un coach su misura, non un assistente generico.
Metodo: scienza applicata, progressione misurabile, tecnica e biomeccanica curate, aderenza prima della perfezione. Tono diretto, concreto, motivante, senza giri di parole né frasi fatte. Rispondi sempre in italiano.

Come lavori:
- Parti dai dati dell'utente che trovi sotto (allenamenti, carichi, peso, sonno, passi, dolori, check-in). Non inventare dati: se manca qualcosa, dillo e chiedilo.
- Dai indicazioni precise e applicabili (serie, ripetizioni, carichi, kcal, macro, orari) e spiega in una riga il perché. L'utente può modificare da solo giorni e sedute nella schermata Piano: quando proponi un cambio, dì esattamente cosa spostare.
- Se la domanda riguarda nutrizione, biomeccanica, recupero o studi recenti e la ricerca web è disponibile, usala per essere aggiornato e cita le fonti in modo breve. Non cercare sul web per cose banali.
- Sulle foto di progresso: descrivi solo cambiamenti visibili e confrontabili tra una settimana e l'altra (definizione, proporzioni, postura), in modo oggettivo e rispettoso. Una stima di massa grassa da foto è approssimativa: dai al massimo un intervallo largo e dillo. Se luce, distanza o posa sono diverse, segnala che il confronto è limitato e come migliorarlo.
- Valuta l'andamento su medie settimanali, non sul singolo giorno.

Sicurezza:
- Non fai diagnosi mediche. Dolore articolare che supera 3/10 o persiste: riduci carico/ROM, proponi l'alternativa e consiglia un professionista se non passa.
- Mai deficit calorici aggressivi (oltre circa il 20-25% del fabbisogno), niente sostanze dopanti, nessuna spinta a comportamenti alimentari estremi. Se emergono segnali di disagio alimentare, invita a parlarne con un professionista.
- Non presentarti come una persona reale né imitare un trainer esistente.

Formato: risposte brevi, leggibili da telefono, elenchi puntati quando servono, massimo qualche grassetto. Chiudi con il prossimo passo concreto quando ha senso.`;

const kg = (n?: number) => (n != null ? `${n} kg` : '–');

export function buildContext(d: Data): string {
  const { settings: s, today } = d;
  const w = weekInfo(s.startDate, today);
  const L: string[] = [];
  L.push(`Data di oggi: ${today}`);
  L.push(`Profilo: ${s.age} anni, ${s.heightCm} cm, ${s.weightKg} kg, massa grassa stimata ~${s.bodyFatPct}%. Obiettivo: ricomposizione (perdere grasso, aumentare massa magra) mantenendo atletismo e corsa.`);
  if (s.coachNotes.trim()) L.push(`Note dell'utente: ${s.coachNotes.trim()}`);
  L.push(`Mesociclo: ${w ? `settimana ${w.week}/7 (${w.deload ? 'deload' : `RIR ${w.rir}`})` : `inizia il ${s.startDate}`}`);
  L.push('Piano settimanale: ' + DAY_ORDER.map(i => `${DAY_NAMES[i].slice(0, 3)} ${slotLabel(s.schedule[i] ?? 'riposo')}`).join(' · '));
  const ov = Object.entries(s.overrides ?? {}).filter(([date]) => date >= today).slice(0, 7);
  if (ov.length) L.push('Eccezioni prossimi giorni: ' + ov.map(([date, slot]) => `${date} ${slotLabel(slot)}`).join(', '));
  L.push(`Obiettivi quotidiani: ${TARGETS.kcal[0]}-${TARGETS.kcal[1]} kcal, ${TARGETS.protein[0]}-${TARGETS.protein[1]} g proteine, ${TARGETS.steps[0]}-${TARGETS.steps[1]} passi, ${TARGETS.sleep[0]}-${TARGETS.sleep[1]} h sonno. Obiettivo peso: -0,3/-0,5 kg a settimana.`);

  const recent = d.daily.filter(x => x.date <= today).slice(-14);
  if (recent.length) {
    L.push('Ultimi giorni (data: peso, proteine, kcal, sonno, passi, dolori):');
    for (const x of recent) {
      const pain = Object.entries(x.pain ?? {}).filter(([, v]) => v > 0).map(([j, v]) => `${j} ${v}`).join(', ');
      L.push(`- ${x.date}: ${kg(x.weightKg)}, ${x.proteinG ?? '–'} g, ${x.kcal ?? '–'} kcal, ${x.sleepH ?? '–'} h, ${x.steps ?? '–'} passi${pain ? `, dolori: ${pain}` : ''}`);
    }
    const ma = movingAverage(d.daily.filter(x => x.weightKg).map(x => ({ date: x.date, v: x.weightKg! })));
    if (ma.length) L.push(`Media mobile peso (7 gg): ${ma[ma.length - 1].avg} kg. Variazione media settimanale: ${weeklyRate(d.daily) ?? 'dati insufficienti'} kg.`);
    const tip = kcalSuggestion(d.daily); if (tip) L.push(`Nota app: ${tip}`);
  } else L.push('Nessun dato giornaliero registrato ancora.');

  const lines: string[] = [];
  for (const sess of Object.values(SESSIONS)) for (const ex of sess.exercises) {
    const h = sessionsByDate(d.sets, ex.id).slice(0, 3);
    if (!h.length) continue;
    lines.push(`- ${ex.name}: ` + h.map(x => `${x.date.slice(5)} ${x.sets.map(t => `${t.kg}×${t.reps}@${t.rir}`).join(' ')}`).join(' | '));
  }
  if (lines.length) L.push('Carichi recenti (kg×rep@RIR, ultime 3 sedute):', ...lines);
  else L.push('Nessuna serie registrata ancora.');

  const runs = d.runs.slice(-4);
  if (runs.length) L.push('Ultime corse: ' + runs.map(r => `${r.date} ${r.type} ${r.km} km ${formatPace(paceSecPerKm(r.km, r.minutes))}/km RPE ${r.rpe}`).join(' · '));

  const ck = d.checkins.slice(-3);
  if (ck.length) L.push('Ultimi check-in: ' + ck.map(c => `${c.date} peso ${kg(c.weightKg)} vita ${c.waistCm ?? '–'} cm${c.note ? ` nota "${c.note}"` : ''}`).join(' · '));
  return L.join('\n');
}
