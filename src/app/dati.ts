import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { elencoCategorie, elencoDaProvare, elencoPratiche, elencoRegistrazioni } from '../db/repo';
import type { Categoria, DaProvare, Pratica, Registrazione } from '../db/types';
import { chiaveGiorno } from '../lib/date';
import { perPratica } from '../lib/registro';

export interface Quaderno {
  categorie: Categoria[];
  pratiche: Pratica[];
  registrazioni: Map<string, Registrazione[]>;
  daProvare: DaProvare[];
}

/** Tutto il quaderno, aggiornato dal vivo. `undefined` finché il database non risponde. */
export function useQuaderno(): Quaderno | undefined {
  return useLiveQuery(async () => {
    const [categorie, pratiche, regs, daProvare] = await Promise.all([
      elencoCategorie(),
      elencoPratiche(),
      elencoRegistrazioni(),
      elencoDaProvare(),
    ]);
    const idCategorie = new Set(categorie.map((c) => c.id));
    return {
      categorie,
      pratiche: pratiche.filter((p) => idCategorie.has(p.categoriaId)),
      registrazioni: perPratica(regs),
      daProvare,
    };
  });
}

/** La data di oggi; cambia da sola a mezzanotte e quando si torna sull'app. */
export function useOggi(): Date {
  const [giorno, setGiorno] = useState(() => chiaveGiorno(new Date()));
  useEffect(() => {
    const controlla = () => setGiorno(chiaveGiorno(new Date()));
    const ora = new Date();
    const mezzanotte = new Date(ora.getFullYear(), ora.getMonth(), ora.getDate() + 1, 0, 0, 1);
    const t = window.setTimeout(controlla, mezzanotte.getTime() - ora.getTime());
    document.addEventListener('visibilitychange', controlla);
    window.addEventListener('focus', controlla);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('visibilitychange', controlla);
      window.removeEventListener('focus', controlla);
    };
  }, [giorno]);
  return useMemo(() => new Date(), [giorno]);
}
