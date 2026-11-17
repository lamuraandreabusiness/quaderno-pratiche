import type { VoceRaccolta } from '../db/types';

/** Minuscolo e senza accenti: "Perché" → "perche". */
export function normalizza(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Filtra la Raccolta per tema e testo.
 * Ogni parola cercata deve comparire in almeno uno dei campi (titolo, tema, obiettivo, svolgimento, esempio).
 * I risultati con la parola nel titolo vengono prima.
 */
export function cercaInRaccolta(voci: VoceRaccolta[], testo: string, tema?: string): VoceRaccolta[] {
  const parole = normalizza(testo).split(/\s+/).filter(Boolean);
  const perTema = tema ? voci.filter((v) => v.tema === tema) : voci;
  if (!parole.length) return perTema;
  return perTema
    .map((v) => {
      const titolo = normalizza(v.titolo);
      const tutto = normalizza([v.titolo, v.tema, v.obiettivo, v.svolgimento, v.esempio].join(' '));
      if (!parole.every((p) => tutto.includes(p))) return null;
      return { v, nelTitolo: parole.filter((p) => titolo.includes(p)).length };
    })
    .filter((x): x is { v: VoceRaccolta; nelTitolo: number } => x !== null)
    .sort((a, b) => b.nelTitolo - a.nelTitolo)
    .map((x) => x.v);
}
