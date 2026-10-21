import Anthropic from '@anthropic-ai/sdk';
import type { Settings } from './types';
import { COACH_SYSTEM } from './coachContext';

export type CoachTurn = { role: 'user' | 'assistant'; text: string };
export type CoachImage = { label: string; base64: string };

export class CoachError extends Error {}

/**
 * Chiamata diretta dal browser: la chiave API resta sul dispositivo dell'utente (IndexedDB)
 * e viene inviata solo ad api.anthropic.com.
 */
export async function askCoach(opts: {
  settings: Settings; context: string; history: CoachTurn[]; userText: string; images?: CoachImage[];
  onText: (acc: string) => void; signal?: AbortSignal;
}): Promise<{ text: string; searched: boolean }> {
  const { settings: s } = opts;
  if (!s.apiKey) throw new CoachError('Manca la chiave API: aggiungila in Altro → Impostazioni → Coach.');
  const client = new Anthropic({ apiKey: s.apiKey, dangerouslyAllowBrowser: true });

  const content: Anthropic.ContentBlockParam[] = [];
  for (const im of opts.images ?? []) {
    content.push({ type: 'text', text: im.label });
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: im.base64 } });
  }
  content.push({ type: 'text', text: opts.userText });

  const messages: Anthropic.MessageParam[] = [
    ...opts.history.slice(-12).map(h => ({ role: h.role, content: h.text })),
    { role: 'user' as const, content },
  ];
  const tools = s.webSearch ? [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }] : undefined;
  const system = `${COACH_SYSTEM}\n\n=== DATI DELL'UTENTE (aggiornati adesso) ===\n${opts.context}`;

  let text = '', searched = false;
  const run = async (withTools: boolean) => {
    for (let turn = 0; turn < 4; turn++) {
      const stream = client.messages.stream({
        model: s.model, max_tokens: 4000, system, messages,
        ...(withTools && tools ? { tools: tools as unknown as Anthropic.ToolUnion[] } : {}),
      }, { signal: opts.signal });
      stream.on('text', t => { text += t; opts.onText(text); });
      const final = await stream.finalMessage();
      if (final.content.some(b => b.type === 'server_tool_use')) searched = true;
      if (final.stop_reason === 'refusal') throw new CoachError('Il modello ha rifiutato questa richiesta. Riformulala.');
      if (final.stop_reason !== 'pause_turn') return;
      messages.push({ role: 'assistant', content: final.content as Anthropic.ContentBlockParam[] });
    }
  };

  try { await run(true); }
  catch (e) {
    // Se la ricerca web non è disponibile per questo modello/account, riprova senza.
    if (e instanceof Anthropic.BadRequestError && tools && !text) { await run(false); }
    else throw e;
  }
  return { text: text.trim(), searched };
}

export function explainError(e: unknown): string {
  if (e instanceof CoachError) return e.message;
  if (e instanceof Anthropic.AuthenticationError) return 'Chiave API non valida. Controllala in Impostazioni.';
  if (e instanceof Anthropic.RateLimitError) return 'Troppe richieste o credito esaurito. Riprova tra poco.';
  if (e instanceof Anthropic.APIConnectionError) return 'Nessuna connessione: il coach funziona solo online.';
  if (e instanceof Anthropic.APIError) return `Errore del servizio (${e.status}): ${e.message}`;
  if (e instanceof DOMException && e.name === 'AbortError') return 'Interrotto.';
  return 'Errore imprevisto.';
}
