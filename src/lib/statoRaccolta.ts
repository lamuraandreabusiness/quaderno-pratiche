import type { Quaderno } from '../app/dati';
import { CATEGORIE_DI_ESEMPIO } from './costanti';
import { normalizza } from './ricerca';

export type StatoVoce =
  | { tipo: 'libera' }
  | { tipo: 'nel-quaderno'; praticaId: string }
  | { tipo: 'da-provare'; daProvareId: string };

/** La voce della Raccolta è già nel quaderno o in "Da provare"? */
export function statoVoce(dati: Pick<Quaderno, 'pratiche' | 'daProvare'>, id: string): StatoVoce {
  const p = dati.pratiche.find((x) => x.origineRaccoltaId === id);
  if (p) return { tipo: 'nel-quaderno', praticaId: p.id };
  const d = dati.daProvare.find((x) => x.origineRaccoltaId === id);
  if (d) return { tipo: 'da-provare', daProvareId: d.id };
  return { tipo: 'libera' };
}

/** Colore di un tema: quello della tua categoria con lo stesso nome, se c'è, altrimenti quello di esempio. */
export function coloreTema(dati: Pick<Quaderno, 'categorie'>, tema: string): string {
  const n = normalizza(tema);
  return (
    dati.categorie.find((c) => normalizza(c.nome) === n)?.colore ??
    CATEGORIE_DI_ESEMPIO.find((c) => c.nome === tema)?.colore ??
    '#5c5f77'
  );
}

/** La categoria che corrisponde al tema (stesso nome, senza badare a maiuscole e accenti). */
export function categoriaPerTema(dati: Pick<Quaderno, 'categorie'>, tema: string) {
  const n = normalizza(tema.trim());
  return dati.categorie.find((c) => normalizza(c.nome.trim()) === n);
}
