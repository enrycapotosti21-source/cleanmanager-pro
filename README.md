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

## Installarla sul telefono
La PWA richiede HTTPS (o localhost). Pubblica la cartella `out/` su un hosting statico gratuito (Netlify, Vercel, Cloudflare Pages, GitHub Pages in radice), poi:
- **iPhone (Safari):** apri l'URL → Condividi → *Aggiungi alla schermata Home*.
- **Android (Chrome):** menu ⋮ → *Installa app*.

Apri l'app una volta online: dopo funziona anche senza connessione in palestra.

## Struttura
- `src/lib/program.ts` – sessioni, esercizi, settimana tipo (modifica qui il programma)
- `src/lib/mesocycle.ts` – settimana/RIR/deload e piano corse
- `src/lib/progression.ts` – doppia progressione (+5 kg fondamentali, +2,5 kg isolamento; −5/10% dopo 2 sessioni sotto il minimo)
- `src/lib/pain.ts` – avvisi dolore (>3/10 o persistente il giorno dopo) e alternative
- `src/lib/nutrition.ts` – media mobile 7 giorni e suggerimento −150 kcal
- `src/lib/db.ts` – IndexedDB, export/import JSON

## Note
- Il mesociclo parte dal primo lunedì utile; cambia la data in *Altro → Impostazioni*.
- I dati vivono nel browser del telefono: fai un export JSON ogni tanto (se cancelli i dati del sito si perdono).
- Non sostituisce un medico/fisioterapista: se un dolore persiste, fatti vedere.
