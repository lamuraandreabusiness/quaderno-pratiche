// Modello dati del quaderno.
// Pensato per la sincronizzazione futura: id generati dal client, date ISO,
// updatedAt su ogni record, eliminazioni "morbide" con deletedAt.

export type Frequenza = 'giorno' | 'settimana' | 'bisogno' | 'anno' | 'inizio-anno';

export interface Categoria {
  id: string;
  nome: string;
  colore: string;
  ordine: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CampoPersonalizzato {
  etichetta: string;
  valore: string;
}

export interface Pratica {
  id: string;
  categoriaId: string;
  titolo: string;
  obiettivo: string;
  svolgimento: string;
  frequenza: Frequenza;
  esempio: string;
  fonte?: string;
  campi: CampoPersonalizzato[];
  /** Se la pratica è stata aggiunta dalla Raccolta */
  origineRaccoltaId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/** Una riga per ogni volta che la pratica è stata fatta. */
export interface Registrazione {
  id: string;
  praticaId: string;
  /** ISO con ora (es. "2026-11-16T08:12:00.000Z"); per "altra data" solo "YYYY-MM-DD" */
  data: string;
  createdAt: string;
  /** Aggiornato quando la registrazione viene annullata: serve alla sincronizzazione */
  updatedAt: string;
  deletedAt?: string;
}

export interface DaProvare {
  id: string;
  titolo: string;
  fonte?: string;
  nota?: string;
  categoriaSuggeritaId?: string;
  /** Se messa da provare dalla Raccolta */
  origineRaccoltaId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/** Voce del catalogo della Raccolta (dati statici in src/data/raccolta.ts). */
export interface VoceRaccolta {
  id: string;
  titolo: string;
  tema: string;
  obiettivo: string;
  svolgimento: string;
  frequenza: Frequenza;
  esempio: string;
  /** Da dove viene la pratica (autore, libro, tradizione) */
  fonte?: string;
  /** Precauzioni da leggere prima di provarla */
  avvertenza?: string;
}
