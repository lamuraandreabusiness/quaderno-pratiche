import { useState } from 'react';
import type { Quaderno } from '../app/dati';
import { percorso } from '../app/rotte';
import { eliminaDaProvare, type DatiPratica } from '../db/repo';
import { voceRaccolta } from '../data/raccolta';
import { categoriaPerTema } from '../lib/statoRaccolta';
import { ModuloPratica } from './ModuloPratica';
import { NonTrovata } from './NonTrovata';

/** "Mettilo nel quaderno": modulo pratica già compilato da un elemento "Da provare". */
export function NelQuaderno({ dati, id }: { dati: Quaderno; id: string }) {
  // Fotografia presa all'apertura: se l'elemento cambia altrove, il modulo non si svuota
  const [d] = useState(() => dati.daProvare.find((x) => x.id === id));
  if (!d) return <NonTrovata />;

  // Se viene dalla Raccolta, il modulo parte dalla pratica completa; la nota (se diversa dall'obiettivo) diventa un campo
  const v = d.origineRaccoltaId ? voceRaccolta(d.origineRaccoltaId) : undefined;
  const nota = d.nota?.trim() ?? '';
  const iniziale: Partial<DatiPratica> = v
    ? {
        titolo: d.titolo,
        obiettivo: v.obiettivo,
        svolgimento: v.svolgimento,
        frequenza: v.frequenza,
        esempio: v.esempio,
        fonte: d.fonte || v.fonte,
        campi: [
          ...(v.avvertenza ? [{ etichetta: 'Attenzione', valore: v.avvertenza }] : []),
          ...(nota && nota !== v.obiettivo ? [{ etichetta: 'Nota', valore: nota }] : []),
        ],
        origineRaccoltaId: v.id,
      }
    : { titolo: d.titolo, fonte: d.fonte, svolgimento: nota };
  const categoriaId = d.categoriaSuggeritaId || (v ? categoriaPerTema(dati, v.tema)?.id : undefined);

  return (
    <ModuloPratica
      dati={dati}
      titoloPagina="Mettilo nel quaderno"
      categoriaId={categoriaId}
      iniziale={iniziale}
      annullaHref={percorso.contenitore()}
      onSalvata={() => eliminaDaProvare(d.id)}
    />
  );
}
