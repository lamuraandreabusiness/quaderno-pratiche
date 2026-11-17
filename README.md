# Quaderno delle pratiche

Un quaderno digitale per raccogliere le pratiche di crescita personale (respirazione, meditazione, scrittura, coaching…), sapere quando farle e registrare ogni volta che le fai.

Versione personale: un solo utente, nessun server. I dati restano sul dispositivo (IndexedDB) e si possono esportare in un file JSON. Funziona offline e si installa come app (PWA).

## Comandi

```bash
npm install
npm run dev       # sviluppo su http://localhost:5173
npm test          # test della logica (Vitest)
npm run build     # build di produzione in dist/
npm run preview   # prova della build
```

## Pubblicazione

A ogni push su `main`, GitHub Actions esegue i test, costruisce l'app e la pubblica su GitHub Pages (`.github/workflows/pubblica.yml`), all'indirizzo https://quaderno.andrealamura.it/ (record CNAME `quaderno` → `lamuraandreabusiness.github.io` nel DNS di Aruba). La variabile `BASE_PATH` indica la cartella in cui vive l'app (`/` in locale).

La specifica completa del progetto è in `CLAUDE.md`.
