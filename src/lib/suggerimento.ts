// Pratica del giorno: punteggio per frequenza + scelta deterministica con seme = data.
import type { Pratica, Registrazione } from '../db/types';
import { chiaveGiorno, fa } from './date';
import { fattaNellAnno, giorniDallUltima } from './registro';

type Reg = Pick<Registrazione, 'data' | 'deletedAt'>;

export interface Punteggio {
  punteggio: number;
  motivo: string;
}

/** Punteggio di una pratica per oggi. -1 = già fatta oggi (mai proposta). */
export function punteggioPratica(p: Pick<Pratica, 'frequenza'>, regs: Reg[], oggi: Date): Punteggio {
  const giorni = giorniDallUltima(regs, oggi);
  if (giorni !== null && giorni <= 0) return { punteggio: -1, motivo: '' };
  const mai = giorni === null;

  switch (p.frequenza) {
    case 'giorno':
      return {
        punteggio: 100,
        motivo: mai
          ? "È una pratica quotidiana e non l'hai ancora mai registrata."
          : "È una pratica quotidiana e oggi non l'hai ancora fatta.",
      };

    case 'inizio-anno': {
      const mese = oggi.getMonth();
      if (mese <= 1 && !fattaNellAnno(regs, oggi.getFullYear())) {
        return { punteggio: 95, motivo: 'È inizio anno: il momento giusto per questa pratica.' };
      }
      if (mese === 11) {
        return { punteggio: 15, motivo: "L'anno sta per chiudersi: puoi prepararla." };
      }
      return { punteggio: 0, motivo: '' };
    }

    case 'settimana':
      if (mai) return { punteggio: 85, motivo: "È settimanale e non l'hai ancora mai registrata." };
      if (giorni >= 7) {
        return {
          punteggio: Math.min(80 + (giorni - 7), 95),
          motivo: `È settimanale: l'ultima volta è stata ${fa(giorni)}.`,
        };
      }
      return { punteggio: 5 + giorni, motivo: `L'hai fatta ${fa(giorni)}: puoi ripeterla se ti serve.` };

    case 'anno':
      if (mai) return { punteggio: 40, motivo: "È una pratica annuale che non hai ancora registrato." };
      if (giorni >= 365) return { punteggio: 75, motivo: `È passato un anno dall'ultima volta (${fa(giorni)}).` };
      return { punteggio: 0, motivo: '' };

    case 'bisogno':
    default:
      if (mai) return { punteggio: 20 + 30, motivo: "Non l'hai ancora provata: oggi può essere il giorno." };
      return {
        punteggio: 20 + Math.min(giorni, 40),
        motivo: `Da usare al bisogno: l'ultima volta è stata ${fa(giorni)}.`,
      };
  }
}

/** Hash FNV-1a a 32 bit (stesso del prototipo). */
export function hashStringa(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Candidata<P> {
  pratica: P;
  punteggio: number;
  motivo: string;
}

export type Suggerimento<P> =
  | { tipo: 'vuoto' } // nessuna pratica nel quaderno
  | { tipo: 'tutto-fatto' } // niente più in programma per oggi
  | { tipo: 'pratica'; scelta: Candidata<P>; numeroCandidate: number };

/**
 * Sceglie la pratica del giorno.
 * - candidate = punteggio > 0, ordinate per punteggio (a parità: per id, così l'ordine è stabile)
 * - si tengono quelle ≥ 60% della prima (max 6); se ne resta una sola, le prime 5
 * - indice = (hash della data + numero di "Un'altra") mod numero di candidate
 */
export function praticaDelGiorno<P extends Pick<Pratica, 'id' | 'frequenza'>>(
  pratiche: P[],
  registrazioni: Map<string, Reg[]>,
  oggi: Date,
  altre = 0,
): Suggerimento<P> {
  if (!pratiche.length) return { tipo: 'vuoto' };

  const candidate: Candidata<P>[] = pratiche
    .map((p) => ({ pratica: p, ...punteggioPratica(p, registrazioni.get(p.id) ?? [], oggi) }))
    .filter((c) => c.punteggio > 0)
    .sort((a, b) => b.punteggio - a.punteggio || (a.pratica.id < b.pratica.id ? -1 : a.pratica.id > b.pratica.id ? 1 : 0));

  if (!candidate.length) return { tipo: 'tutto-fatto' };

  const soglia = candidate[0].punteggio * 0.6;
  let gruppo = candidate.filter((c) => c.punteggio >= soglia).slice(0, 6);
  if (gruppo.length <= 1) gruppo = candidate.slice(0, 5);

  const indice = (hashStringa(chiaveGiorno(oggi)) + altre) % gruppo.length;
  return { tipo: 'pratica', scelta: gruppo[indice], numeroCandidate: gruppo.length };
}
