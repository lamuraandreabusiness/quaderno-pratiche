// Raccolta: pratiche già pronte da sfogliare e copiare nel quaderno.
// Gli id sono stabili: servono a riconoscere le pratiche già aggiunte (origineRaccoltaId).
import type { VoceRaccolta } from '../db/types';

export const RACCOLTA: VoceRaccolta[] = [
  {
    id: 'respirazione-quadrata',
    titolo: 'Respirazione quadrata',
    tema: 'Respiro',
    frequenza: 'giorno',
    obiettivo: 'Calmare il sistema nervoso e ritrovare lucidità in pochi minuti.',
    svolgimento:
      'Siediti con la schiena dritta.\nInspira contando fino a 4.\nTrattieni 4.\nEspira 4.\nResta vuoto 4.\nRipeti per 4–5 minuti.',
    esempio: 'Prima di una riunione o di una conversazione difficile.',
  },
  {
    id: 'respirazione-4-7-8',
    titolo: 'Respirazione 4-7-8',
    tema: 'Respiro',
    frequenza: 'bisogno',
    obiettivo: 'Rilassarsi e favorire il sonno.',
    svolgimento: 'Inspira dal naso per 4.\nTrattieni per 7.\nEspira dalla bocca per 8.\nRipeti 4 cicli.',
    esempio: 'A letto, quando la mente non si spegne.',
  },
  {
    id: 'body-scan',
    titolo: 'Body scan',
    tema: 'Meditazione',
    frequenza: 'giorno',
    obiettivo: 'Riconnettersi con il corpo e notare le tensioni.',
    svolgimento:
      "Sdraiati.\nPorta l'attenzione ai piedi, poi sali lentamente: gambe, bacino, addome, petto, mani, braccia, spalle, collo, viso.\nSu ogni zona nota le sensazioni senza giudicarle.\n10–20 minuti.",
    esempio: 'La sera, per staccare dalla giornata.',
  },
  {
    id: 'radicamento-5-4-3-2-1',
    titolo: 'Radicamento 5-4-3-2-1',
    tema: 'Meditazione',
    frequenza: 'bisogno',
    obiettivo: "Tornare al presente quando l'ansia sale.",
    svolgimento: 'Nomina 5 cose che vedi, 4 che senti col tatto, 3 suoni, 2 odori, 1 sapore.',
    esempio: 'In un momento di agitazione in mezzo alla giornata.',
  },
  {
    id: 'diario-della-gratitudine',
    titolo: 'Diario della gratitudine',
    tema: 'Scrittura',
    frequenza: 'giorno',
    obiettivo: "Allenare l'attenzione a ciò che funziona.",
    svolgimento: 'Scrivi 3 cose per cui sei grato oggi, ognuna con il perché.',
    esempio: 'Prima di dormire, 5 minuti.',
  },
  {
    id: 'pagine-del-mattino',
    titolo: 'Pagine del mattino',
    tema: 'Scrittura',
    frequenza: 'giorno',
    obiettivo: 'Svuotare la mente e far emergere idee e pensieri ricorrenti.',
    svolgimento: 'Appena sveglio scrivi a mano, di getto, per circa tre pagine o 15 minuti, senza correggere né rileggere.',
    esempio: 'Nei periodi di blocco creativo o di confusione.',
  },
  {
    id: 'intenzione-del-giorno',
    titolo: 'Intenzione del giorno',
    tema: 'Coaching',
    frequenza: 'giorno',
    obiettivo: 'Iniziare la giornata con una direzione chiara.',
    svolgimento: 'Rispondi per iscritto:\n"Come voglio essere oggi?"\n"Qual è l\'unica cosa che rende oggi un buon giorno?"',
    esempio: 'Al mattino, prima di aprire mail e messaggi.',
  },
  {
    id: 'revisione-settimanale',
    titolo: 'Revisione settimanale',
    tema: 'Coaching',
    frequenza: 'settimana',
    obiettivo: "Imparare dall'esperienza e riallineare le priorità.",
    svolgimento:
      'Rispondi:\nCosa è andato bene?\nCosa ho imparato?\nCosa faccio diversamente la prossima settimana?\nQuali sono le 3 priorità?',
    esempio: 'La domenica sera o il venerdì pomeriggio.',
  },
  {
    id: 'ruota-della-vita',
    titolo: 'Ruota della vita',
    tema: 'Coaching',
    frequenza: 'anno',
    obiettivo: "Fotografare l'equilibrio tra le aree della vita e scegliere dove intervenire.",
    svolgimento:
      "Disegna un cerchio diviso in 8 aree (es. salute, lavoro, relazioni, famiglia, crescita, denaro, svago, ambiente).\nDai a ciascuna un voto da 1 a 10.\nScegli un'area su cui lavorare e un primo passo concreto.",
    esempio: 'A inizio anno o in un momento di cambiamento.',
  },
  {
    id: 'obiettivi-dell-anno',
    titolo: "Obiettivi dell'anno",
    tema: 'Coaching',
    frequenza: 'inizio-anno',
    obiettivo: "Dare forma ai risultati che vuoi raggiungere nell'anno.",
    svolgimento:
      'Scrivi da 3 a 5 obiettivi in positivo, specifici, misurabili e con una scadenza.\nPer ognuno: perché è importante, come saprai di averlo raggiunto, primo passo.',
    esempio: 'Nella prima settimana di gennaio.',
  },
  {
    id: 'lettera-al-te-del-futuro',
    titolo: 'Lettera al te del futuro',
    tema: 'Scrittura',
    frequenza: 'anno',
    obiettivo: 'Chiarire desideri e valori e misurare il cammino fatto.',
    svolgimento:
      'Scrivi una lettera a te stesso tra un anno: dove sei, cosa speri sia cambiato, cosa vuoi ricordarti.\nChiudila e rileggila tra dodici mesi.',
    esempio: 'Il giorno del compleanno o a fine anno.',
  },
  {
    id: 'ancora-di-eccellenza',
    titolo: 'Ancora di eccellenza',
    tema: 'Coaching',
    frequenza: 'bisogno',
    obiettivo: 'Richiamare uno stato di sicurezza e risorsa quando serve.',
    svolgimento:
      'Ricorda un momento in cui ti sei sentito pienamente capace.\nRivivilo: cosa vedevi, sentivi, provavi.\nQuando la sensazione è al massimo, fai un gesto preciso (es. pollice e indice uniti).\nRipeti più volte.\nUsa il gesto prima delle situazioni impegnative.',
    esempio: 'Prima di parlare in pubblico.',
  },
  {
    id: 'passeggiata-consapevole',
    titolo: 'Passeggiata consapevole',
    tema: 'Corpo e movimento',
    frequenza: 'bisogno',
    obiettivo: 'Muoversi e calmare la mente nello stesso momento.',
    svolgimento:
      "Cammina più lentamente del solito per 10 minuti.\nPorta l'attenzione ai passi, al respiro, ai suoni intorno.\nQuando la mente vaga, torna ai piedi.",
    esempio: 'Nella pausa pranzo.',
  },
  {
    id: 'risveglio-del-corpo',
    titolo: 'Risveglio del corpo',
    tema: 'Corpo e movimento',
    frequenza: 'giorno',
    obiettivo: 'Attivare il corpo e la circolazione al mattino.',
    svolgimento:
      '5 minuti in piedi: rotazioni di collo, spalle, polsi, anche e caviglie.\nAllungamento verso l\'alto.\nTre respiri profondi.',
    esempio: 'Appena alzati, prima del caffè.',
  },
  {
    id: 'domanda-della-sera',
    titolo: 'Domanda della sera',
    tema: 'Coaching',
    frequenza: 'giorno',
    obiettivo: 'Chiudere la giornata con consapevolezza.',
    svolgimento:
      'Rispondi in due righe:\n"Cosa ho fatto oggi che mi ha avvicinato a ciò che voglio?"\n"Cosa lascio andare?"',
    esempio: 'Prima di spegnere il telefono la sera.',
  },
];

/** I temi, nell'ordine in cui compaiono. */
export const TEMI: string[] = [...new Set(RACCOLTA.map((v) => v.tema))];

export const voceRaccolta = (id: string) => RACCOLTA.find((v) => v.id === id);
