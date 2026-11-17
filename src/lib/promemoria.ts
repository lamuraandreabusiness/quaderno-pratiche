// Promemoria: regole pure. Le stesse regole sono ripetute in public/sw-promemoria.js
// (il service worker non può importare questo file): se cambi qui, cambia anche là.
import { chiaveGiorno } from './date';

export interface StatoPromemoria {
  attivo: boolean;
  /** "HH:MM" */
  ora: string;
  /** Giorno ("YYYY-MM-DD") a cui si riferiscono titolo e praticaId */
  giorno?: string;
  /** Pratica del giorno; null = tutto fatto, niente da ricordare */
  titolo?: string | null;
  praticaId?: string | null;
  /** Ultimo giorno in cui il promemoria è stato inviato (o non serviva più) */
  inviatoIl?: string;
}

export const ORA_PREDEFINITA = '08:30';
export const statoIniziale = (): StatoPromemoria => ({ attivo: false, ora: ORA_PREDEFINITA });

export function minutiDa(ora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(ora);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

const minutiDi = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** È arrivata l'ora e oggi non è ancora partito? (e c'è qualcosa da ricordare) */
export function devoAvvisare(s: StatoPromemoria, adesso: Date): boolean {
  if (!s.attivo) return false;
  const m = minutiDa(s.ora);
  if (m === null) return false;
  const oggi = chiaveGiorno(adesso);
  if (s.inviatoIl === oggi) return false;
  if (minutiDi(adesso) < m) return false;
  if (s.giorno === oggi && !s.titolo) return false; // tutto fatto per oggi
  return true;
}

/** Gli indirizzi sono relativi alla cartella dell'app ("./#/pratica/…"): funziona anche in una sottocartella. */
export function testoPromemoria(s: StatoPromemoria, adesso: Date): { corpo: string; url: string } {
  if (s.giorno === chiaveGiorno(adesso) && s.titolo) {
    return {
      corpo: `La tua pratica di oggi: ${s.titolo}`,
      url: s.praticaId ? `./#/pratica/${encodeURIComponent(s.praticaId)}` : './',
    };
  }
  return { corpo: 'La tua pratica di oggi ti aspetta nel quaderno.', url: './' };
}

/** Millisecondi fino al prossimo promemoria (oggi se non è ancora passato, altrimenti domani). */
export function msAlProssimo(s: StatoPromemoria, adesso: Date): number | null {
  if (!s.attivo) return null;
  const m = minutiDa(s.ora);
  if (m === null) return null;
  const oggi = chiaveGiorno(adesso);
  const prossimo = new Date(adesso.getFullYear(), adesso.getMonth(), adesso.getDate(), Math.floor(m / 60), m % 60, 0, 0);
  if (prossimo.getTime() <= adesso.getTime() || s.inviatoIl === oggi) prossimo.setDate(prossimo.getDate() + 1);
  return prossimo.getTime() - adesso.getTime();
}
