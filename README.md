# Allenamento — web app personale (PWA)

App mobile-first, offline e senza backend, per seguire il programma: pesi 4 giorni + 2 corse a settimana, mesociclo di 7 settimane (RIR 3 → 2 → 1, deload in settimana 7).

Stack: Next.js 14 (export statico) · TypeScript · Tailwind · Dexie/IndexedDB · Recharts. Tutto in italiano, nessun dato lascia il dispositivo.

## Avvio locale
```bash
npm install
npm run dev          # sviluppo su http://localhost:3000
npm test             # test su progressione, deload, dolori, nutrizione
npm run build        # genera la versione statica in ./out
npx serve out        # prova la build (service worker attivo)
```

## Funzioni principali
- **Oggi:** seduta del giorno, inserimento rapido (peso, proteine, passi, sonno con +/−), tasto *Cambia* per fare un’altra seduta o spostarla a un altro giorno senza toccare il piano fisso.
- **Piano:** giorni della settimana completamente modificabili (cambia, scambia, preset), mesociclo di 7 settimane.
- **Foto:** check-in settimanale (fronte/lato/retro + peso + vita), confronto affiancato tra due date. Le foto restano sul telefono (compresse).
- **Coach:** chat con un personal trainer AI che conosce i tuoi dati, legge le foto dei check-in e, se attivi la ricerca web, si aggiorna online. Richiede una chiave API Anthropic.

### Coach AI: chiave API e privacy
Aggiungi la chiave in *Altro → Impostazioni → Coach AI*. Resta nel browser del telefono (IndexedDB), non entra negli export e viene inviata solo ad `api.anthropic.com`. Verso Anthropic escono solo le tue domande, un riassunto dei tuoi dati e, **solo se premi “Analizza”**, le foto del check-in (chiede conferma la prima volta). Chiunque usi il tuo telefono sbloccato può usare la chiave: per un’app personale va bene, per condividerla con altri serve un piccolo server.

## Installarla sul telefono
La PWA richiede HTTPS (o localhost). Il modo più semplice è Vercel: vercel.com → *Add New → Project* → importa questo repository (rileva Next.js da solo, nessuna impostazione da cambiare) → *Deploy*. In alternativa va bene qualunque hosting statico con la cartella `out/`. Poi:
- **iPhone (Safari):** apri l'URL → Condividi → *Aggiungi alla schermata Home*.
- **Android (Chrome):** menu ⋮ → *Installa app*.

Apri l'app una volta online: dopo funziona anche senza connessione in palestra.

## Struttura
- `src/lib/program.ts` – sessioni, esercizi, settimana tipo (modifica qui il programma)
- `src/lib/mesocycle.ts` – settimana/RIR/deload e piano corse
- `src/lib/progression.ts` – doppia progressione (+5 kg fondamentali, +2,5 kg isolamento; −5/10% dopo 2 sessioni sotto il minimo)
- `src/lib/pain.ts` – avvisi dolore (>3/10 o persistente il giorno dopo) e alternative
- `src/lib/nutrition.ts` – media mobile 7 giorni e suggerimento −150 kcal
- `src/lib/schedule.ts` – piano settimanale, eccezioni per data, spostamento sedute
- `src/lib/coach.ts`, `coachContext.ts` – chiamata a Claude e riassunto dati per il coach
- `src/lib/db.ts` – IndexedDB, export/import JSON (foto incluse, chiave API esclusa)

## Note
- Il mesociclo parte dal primo lunedì utile; cambia la data in *Altro → Impostazioni*.
- I dati vivono nel browser del telefono: fai un export JSON ogni tanto (se cancelli i dati del sito si perdono).
- Non sostituisce un medico/fisioterapista: se un dolore persiste, fatti vedere.
