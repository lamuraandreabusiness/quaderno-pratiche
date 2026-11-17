# Quaderno delle pratiche — versione personale

## Cosa stiamo costruendo

Un quaderno digitale in cui una persona raccoglie le pratiche di crescita personale che trova (respirazione, meditazione, scrittura, esercizi di coaching e PNL…), sa quando farle e registra ogni volta che le fa.

Questa è la **versione per uso personale**: un solo utente, nessun coach, nessun backend. Deve funzionare bene sul telefono e sul computer ed essere installabile come app (PWA).

Lingua dell'interfaccia: **italiano**. Tutti i testi visibili all'utente sono in italiano.

Nella cartella c'è `prototipo-quaderno-pratiche.html`: è il prototipo funzionante in un solo file. Usalo come riferimento per grafica, flussi e logica (soprattutto il suggerimento della pratica del giorno). Non va copiato così com'è: va ricostruito come progetto vero.

## Stack

- Vite + React + TypeScript
- Dati in locale con IndexedDB tramite **Dexie** (local-first, funziona offline)
- PWA con `vite-plugin-pwa` (installabile, icona, funziona offline)
- CSS semplice (CSS modules o un solo file di stile): niente framework UI pesanti, la grafica è su misura
- Font da Google Fonts: **Caveat** (titoli) e **Kalam** (testo)
- Test con Vitest per la logica (suggerimento del giorno, serie di giorni, scadenze)
- Pubblicazione statica (Netlify, Vercel o GitHub Pages)

## Grafica

Deve sembrare un **quadernino**:
- pagina color carta con righe orizzontali azzurre, margine rosso verticale a sinistra, spirale sul bordo sinistro
- linguette colorate sul bordo destro, una per categoria, per saltare alle categorie (su mobile si nascondono o diventano una barra orizzontale)
- titoli scritti a mano (Caveat), testo in Kalam
- la pratica del giorno è un **post-it** giallo leggermente ruotato, con un pezzo di nastro adesivo
- il pulsante di registrazione è un **timbro**
- sfondo "scrivania" color kraft
- ogni categoria ha un colore, scelto da una palette di 8: Corallo `#e2674f`, Arancio `#e8933a`, Senape `#c99d1c`, Salvia `#5f9450`, Petrolio `#2a8a85`, Blu `#3d6fb6`, Viola `#7b5ea7`, Rosa `#cf5f8f`
- accessibile: contrasto leggibile, focus visibile, uso completo da tastiera, `prefers-reduced-motion` rispettato

## Sezioni dell'app

### 1. Home
- Titolo "Quaderno delle pratiche" e data di oggi in italiano (es. "lunedì 16 novembre")
- **Post-it "Pratica del giorno"**: nome, categoria, frequenza, motivo della scelta, inizio dell'obiettivo. Pulsanti: "Apri la pratica", "✓ Fatta", "Un'altra →". Quando non c'è più niente in programma per oggi diventa verde: "Tutto fatto per oggi ✓"
- Conteggio "Pratiche quotidiane: X su Y fatte oggi"
- **Indice**: elenco numerato delle categorie, con pallino colorato, nome nel colore della categoria, puntini di guida e numero di pratiche. Un tocco apre la categoria
- Accesso al **Contenitore** (vedi sotto) con il numero di pratiche in attesa
- Pulsanti "+ Nuova pratica" e "+ Nuova categoria"
- Al primo avvio, con il quaderno vuoto: messaggio di benvenuto, pulsante per creare le categorie di esempio (Respiro, Meditazione, Scrittura, Corpo e movimento, Coaching) e invito a sfogliare la Raccolta

### 2. Categoria
- Nome con evidenziatore del colore della categoria, pulsanti Modifica ed Elimina
- Elenco delle pratiche: casella del colore della categoria con spunta se fatta oggi, nome, frequenza, "ultima volta X giorni fa" o "mai registrata"
- Pulsante "+ Nuova pratica in [categoria]"
- Eliminare una categoria che contiene pratiche chiede conferma e dice quante pratiche verranno eliminate (finestra di conferma dentro l'app, non `confirm()`)

### 3. Scheda pratica
Voci fisse, in quest'ordine:
1. **Nome** e **categoria**
2. **Obiettivo della pratica**
3. **Svolgimento** (testo su più righe, a capo rispettati)
4. **Ogni quanto**: Ogni giorno · Una volta a settimana · Al bisogno · Una volta l'anno · A inizio anno
5. **Esempio di utilizzo**
6. **Campi personalizzati**: quanti ne vuole l'utente, ognuno con nome e contenuto (es. Fonte, Durata, Materiali)
7. **Fonte** (facoltativa: link o testo, es. libro, corso, video)

In fondo, il **Registro**:
- timbro "Registra: fatta oggi". Se è già fatta oggi diventa pieno: "✓ Fatta oggi"
- "annulla l'ultima" per togliere una registrazione sbagliata
- "+ altra data" per registrare una data passata (mai futura)
- statistiche: quante volte in totale, ultima volta, per le pratiche quotidiane **giorni di fila**
- elenco delle ultime 10 registrazioni con data e ora

Pulsanti Modifica ed Elimina.

### 4. Modulo nuova/modifica pratica
- Categoria da menu, con opzione "+ Nuova categoria…" che apre nome e colore senza uscire dal modulo
- Tutti i campi della scheda, campi personalizzati aggiungibili e rimovibili
- Validazione: nome obbligatorio, categoria obbligatoria
- Mentre si compila un modulo nessun aggiornamento dei dati deve cancellare quello che si sta scrivendo

### 5. Contenitore delle pratiche (novità)
Il posto dove l'utente mette le pratiche che **trova in giro e pensa possano essergli utili**, prima di metterle nel quaderno. Ha due parti.

**a) Da provare** — le pratiche raccolte dall'utente
- Inserimento rapido, pensato per il telefono: basta un **nome**. Facoltativi: fonte (link o testo), una nota, categoria suggerita
- Elenco con nome, fonte, data di inserimento
- Per ogni elemento:
  - **"Mettilo nel quaderno"**: apre il modulo della pratica già compilato con quello che c'è (nome, fonte nel campo Fonte, nota nello Svolgimento o in un campo personalizzato). Al salvataggio l'elemento esce dal Contenitore
  - **Modifica**
  - **Scarta**, con conferma
- Se l'app è installata come PWA, supporta la **condivisione verso l'app** (Web Share Target): da un browser o da un'altra app si condivide un link e finisce in "Da provare", con titolo e URL compilati

**b) Raccolta** — pratiche già pronte da sfogliare
- Un catalogo di pratiche già scritte (vedi "Pratiche della Raccolta" più sotto), caricato dal file `src/data/raccolta.ts`
- Ricerca per testo e filtro per tema
- Ogni pratica si apre in anteprima (obiettivo, svolgimento, frequenza consigliata, esempio)
- **"Aggiungi al mio quaderno"**: chiede in quale categoria metterla (una esistente o una nuova), poi crea una copia modificabile. Le pratiche già aggiunte mostrano "Già nel quaderno"
- **"Mettila da provare"**: la manda in "Da provare"

## Pratica del giorno: regole

Il suggerimento resta **lo stesso per tutta la giornata** (scelta deterministica con seme = data del giorno) e cambia con "Un'altra →".

Le pratiche già fatte oggi non vengono mai proposte. Per le altre si calcola un punteggio:

| Ogni quanto | Punteggio | Motivo mostrato |
| --- | --- | --- |
| Ogni giorno | 100 | "È una pratica quotidiana e oggi non l'hai ancora fatta." |
| A inizio anno | 95 a gennaio e febbraio se quest'anno non è ancora stata fatta; 15 a dicembre; altrimenti 0 | "È inizio anno: il momento giusto per questa pratica." |
| Una volta a settimana | Mai fatta: 85. Ultima volta ≥ 7 giorni fa: 80 + (giorni − 7), massimo 95. Altrimenti 5 + giorni | "È settimanale: l'ultima volta è stata X giorni fa." |
| Una volta l'anno | Mai fatta: 40. Ultima volta ≥ 365 giorni fa: 75. Altrimenti 0 | "È passato un anno dall'ultima volta." |
| Al bisogno | 20 + giorni dall'ultima volta (massimo +40; mai fatta = +30) | "Da usare al bisogno: l'ultima volta è stata X giorni fa." |

Candidate = punteggio > 0, ordinate per punteggio. Si prendono quelle con punteggio ≥ 60% del primo (massimo 6); se ne resta una sola, le prime 5. Indice = (hash della data + numero di "Un'altra") modulo il numero di candidate.

Le date si confrontano come **giorni di calendario locali**, non come differenze di 24 ore.

## Modello dati (Dexie)

Pensato fin da ora per poter aggiungere più avanti la sincronizzazione tra dispositivi e la versione coach–cliente: id generati dal client, date ISO, `updatedAt` ovunque, eliminazioni con `deletedAt` (soft delete).

```ts
type Frequenza = 'giorno' | 'settimana' | 'bisogno' | 'anno' | 'inizio-anno';

interface Categoria {
  id: string; nome: string; colore: string; ordine: number;
  createdAt: string; updatedAt: string; deletedAt?: string;
}

interface Pratica {
  id: string; categoriaId: string; titolo: string;
  obiettivo: string; svolgimento: string; frequenza: Frequenza; esempio: string;
  fonte?: string;
  campi: { etichetta: string; valore: string }[];
  origineRaccoltaId?: string;   // se aggiunta dalla Raccolta
  createdAt: string; updatedAt: string; deletedAt?: string;
}

interface Registrazione {          // una riga per ogni volta che la pratica è fatta
  id: string; praticaId: string;
  data: string;                    // ISO con ora; per "altra data" solo YYYY-MM-DD
  createdAt: string; deletedAt?: string;
}

interface DaProvare {
  id: string; titolo: string; fonte?: string; nota?: string;
  categoriaSuggeritaId?: string;
  createdAt: string; updatedAt: string; deletedAt?: string;
}
```

Le registrazioni sono una tabella separata (non un array dentro la pratica), così le statistiche e la futura sincronizzazione restano semplici.

## Dati e backup

- In Impostazioni: **Esporta** tutto in un file JSON e **Importa** da file (con anteprima e conferma prima di sovrascrivere)
- Richiedi `navigator.storage.persist()` per ridurre il rischio che il browser cancelli i dati
- Un piccolo avviso in fondo alla home: "I tuoi dati restano su questo dispositivo. Esporta un backup ogni tanto."
- Il prototipo salvava in `localStorage` con chiave `quaderno-pratiche-v1`. Al primo avvio, se la chiave esiste, proponi di importare quei dati

## Promemoria (facoltativo, ultima fase)

Notifica locale "La tua pratica di oggi: …" a un orario scelto dall'utente, solo se il dispositivo e il browser lo permettono. Se non è possibile, l'app funziona lo stesso senza.

## Ordine di lavoro

1. Struttura del progetto, PWA, database Dexie, modello dati e test della logica (suggerimento, serie, date)
2. Home, categorie, scheda pratica, modulo, registro: riproduci il prototipo
3. Contenitore: "Da provare" con inserimento rapido e "Mettilo nel quaderno"
4. Raccolta con ricerca, filtro e "Aggiungi al mio quaderno"
5. Esporta/Importa, importazione dal prototipo, persistenza
6. Condivisione verso l'app (Web Share Target) e promemoria
7. Rifinitura grafica su telefono, accessibilità, controllo con Lighthouse

Dopo ogni fase: avvia l'app, provala sul serio (anche con viewport da telefono) e correggi prima di passare alla successiva.

## Regole

- Niente `alert`, `confirm`, `prompt`: finestre di dialogo dentro l'app
- Niente tracciamento, analytics o chiamate a server esterni (a parte i font)
- Testi brevi, caldi, in italiano corretto
- Nessuna dipendenza in più se non serve davvero

## Pratiche della Raccolta (contenuto iniziale)

Da mettere in `src/data/raccolta.ts`. Ogni voce ha: `id`, `titolo`, `tema`, `obiettivo`, `svolgimento`, `frequenza`, `esempio`.

1. **Respirazione quadrata** · tema Respiro · Ogni giorno
   - Obiettivo: calmare il sistema nervoso e ritrovare lucidità in pochi minuti.
   - Svolgimento: Siediti con la schiena dritta. Inspira contando fino a 4. Trattieni 4. Espira 4. Resta vuoto 4. Ripeti per 4–5 minuti.
   - Esempio: prima di una riunione o di una conversazione difficile.

2. **Respirazione 4-7-8** · Respiro · Al bisogno
   - Obiettivo: rilassarsi e favorire il sonno.
   - Svolgimento: Inspira dal naso per 4. Trattieni per 7. Espira dalla bocca per 8. Ripeti 4 cicli.
   - Esempio: a letto, quando la mente non si spegne.

3. **Body scan** · Meditazione · Ogni giorno
   - Obiettivo: riconnettersi con il corpo e notare le tensioni.
   - Svolgimento: Sdraiati. Porta l'attenzione ai piedi, poi sali lentamente: gambe, bacino, addome, petto, mani, braccia, spalle, collo, viso. Su ogni zona nota le sensazioni senza giudicarle. 10–20 minuti.
   - Esempio: la sera, per staccare dalla giornata.

4. **Radicamento 5-4-3-2-1** · Meditazione · Al bisogno
   - Obiettivo: tornare al presente quando l'ansia sale.
   - Svolgimento: Nomina 5 cose che vedi, 4 che senti col tatto, 3 suoni, 2 odori, 1 sapore.
   - Esempio: in un momento di agitazione in mezzo alla giornata.

5. **Diario della gratitudine** · Scrittura · Ogni giorno
   - Obiettivo: allenare l'attenzione a ciò che funziona.
   - Svolgimento: Scrivi 3 cose per cui sei grato oggi, ognuna con il perché.
   - Esempio: prima di dormire, 5 minuti.

6. **Pagine del mattino** · Scrittura · Ogni giorno
   - Obiettivo: svuotare la mente e far emergere idee e pensieri ricorrenti.
   - Svolgimento: Appena sveglio scrivi a mano, di getto, per circa tre pagine o 15 minuti, senza correggere né rileggere.
   - Esempio: nei periodi di blocco creativo o di confusione.

7. **Intenzione del giorno** · Coaching · Ogni giorno
   - Obiettivo: iniziare la giornata con una direzione chiara.
   - Svolgimento: Rispondi per iscritto: "Come voglio essere oggi?" e "Qual è l'unica cosa che rende oggi un buon giorno?".
   - Esempio: al mattino, prima di aprire mail e messaggi.

8. **Revisione settimanale** · Coaching · Una volta a settimana
   - Obiettivo: imparare dall'esperienza e riallineare le priorità.
   - Svolgimento: Rispondi: Cosa è andato bene? Cosa ho imparato? Cosa faccio diversamente la prossima settimana? Quali sono le 3 priorità?
   - Esempio: la domenica sera o il venerdì pomeriggio.

9. **Ruota della vita** · Coaching · Una volta l'anno
   - Obiettivo: fotografare l'equilibrio tra le aree della vita e scegliere dove intervenire.
   - Svolgimento: Disegna un cerchio diviso in 8 aree (es. salute, lavoro, relazioni, famiglia, crescita, denaro, svago, ambiente). Dai a ciascuna un voto da 1 a 10. Scegli un'area su cui lavorare e un primo passo concreto.
   - Esempio: a inizio anno o in un momento di cambiamento.

10. **Obiettivi dell'anno** · Coaching · A inizio anno
    - Obiettivo: dare forma ai risultati che vuoi raggiungere nell'anno.
    - Svolgimento: Scrivi da 3 a 5 obiettivi in positivo, specifici, misurabili e con una scadenza. Per ognuno: perché è importante, come saprai di averlo raggiunto, primo passo.
    - Esempio: nella prima settimana di gennaio.

11. **Lettera al te del futuro** · Scrittura · Una volta l'anno
    - Obiettivo: chiarire desideri e valori e misurare il cammino fatto.
    - Svolgimento: Scrivi una lettera a te stesso tra un anno: dove sei, cosa speri sia cambiato, cosa vuoi ricordarti. Chiudila e rileggila tra dodici mesi.
    - Esempio: il giorno del compleanno o a fine anno.

12. **Ancora di eccellenza** · Coaching · Al bisogno
    - Obiettivo: richiamare uno stato di sicurezza e risorsa quando serve.
    - Svolgimento: Ricorda un momento in cui ti sei sentito pienamente capace. Rivivilo: cosa vedevi, sentivi, provavi. Quando la sensazione è al massimo, fai un gesto preciso (es. pollice e indice uniti). Ripeti più volte. Usa il gesto prima delle situazioni impegnative.
    - Esempio: prima di parlare in pubblico.

13. **Passeggiata consapevole** · Corpo e movimento · Al bisogno
    - Obiettivo: muoversi e calmare la mente nello stesso momento.
    - Svolgimento: Cammina più lentamente del solito per 10 minuti. Porta l'attenzione ai passi, al respiro, ai suoni intorno. Quando la mente vaga, torna ai piedi.
    - Esempio: nella pausa pranzo.

14. **Risveglio del corpo** · Corpo e movimento · Ogni giorno
    - Obiettivo: attivare il corpo e la circolazione al mattino.
    - Svolgimento: 5 minuti in piedi: rotazioni di collo, spalle, polsi, anche e caviglie; allungamento verso l'alto; tre respiri profondi.
    - Esempio: appena alzati, prima del caffè.

15. **Domanda della sera** · Coaching · Ogni giorno
    - Obiettivo: chiudere la giornata con consapevolezza.
    - Svolgimento: Rispondi in due righe: "Cosa ho fatto oggi che mi ha avvicinato a ciò che voglio?" e "Cosa lascio andare?".
    - Esempio: prima di spegnere il telefono la sera.
