import type { CSSProperties } from 'react';
import type { Quaderno } from '../app/dati';
import { useAvviso, useConferma } from '../app/avvisi';
import { percorso, vai } from '../app/rotte';
import { eliminaCategoria } from '../db/repo';
import { etichettaFrequenza, stileColore } from '../lib/costanti';
import { fa } from '../lib/date';
import { fattaOggi, giorniDallUltima } from '../lib/registro';
import { NonTrovata } from './NonTrovata';
import { LinkSostituisci } from '../components/LinkSostituisci';

interface Props {
  dati: Quaderno;
  id: string;
  oggi: Date;
}

export function PaginaCategoria({ dati, id, oggi }: Props) {
  const conferma = useConferma();
  const avviso = useAvviso();
  const c = dati.categorie.find((x) => x.id === id);
  if (!c) return <NonTrovata cosa="categoria" />;
  const pratiche = dati.pratiche.filter((p) => p.categoriaId === id);
  const stile = stileColore(c.colore) as CSSProperties;

  async function elimina() {
    const n = pratiche.length;
    const testo = n
      ? `La categoria "${c!.nome}" contiene ${n === 1 ? '1 pratica, che verrà eliminata con il suo registro' : `${n} pratiche, che verranno eliminate con i loro registri`}.`
      : `La categoria "${c!.nome}" è vuota.`;
    const ok = await conferma({ titolo: 'Eliminare la categoria?', testo, conferma: 'Elimina', pericolo: true });
    if (!ok) return;
    vai(percorso.home(), true); // prima si esce dalla pagina, poi si elimina
    await eliminaCategoria(id);
    avviso('Categoria eliminata');
  }

  return (
    <div className="colorata" style={stile}>
      <p className="briciole">
        <a href={percorso.home()}>← Indice</a>
      </p>
      <div className="testa-cat">
        <h1 tabIndex={-1}>
          <span className="evidenziatore">{c.nome}</span>
        </h1>
        <span className="spazio" />
        <span className="azioni-testa">
          <LinkSostituisci className="btn leggero" href={percorso.modificaCategoria(c.id)}>
            Modifica
          </LinkSostituisci>
          <button type="button" className="btn leggero" onClick={elimina}>
            Elimina
          </button>
        </span>
      </div>

      {pratiche.length === 0 ? (
        <p className="vuoto">Nessuna pratica in questa categoria, per ora.</p>
      ) : (
        <ul className="elenco-pratiche">
          {pratiche.map((p) => {
            const regs = dati.registrazioni.get(p.id) ?? [];
            const fatta = fattaOggi(regs, oggi);
            const giorni = giorniDallUltima(regs, oggi);
            return (
              <li key={p.id}>
                <a className="voce-pratica" href={percorso.pratica(p.id)}>
                  <span className={`casella ${fatta ? 'spuntata' : ''}`} aria-hidden="true">
                    {fatta ? '✓' : ''}
                  </span>
                  <span>
                    <span className="t">{p.titolo}</span>
                    {fatta && <span className="sr"> (fatta oggi)</span>}
                    <span className="meta">
                      {etichettaFrequenza(p.frequenza)} · {giorni === null ? 'mai registrata' : `ultima volta ${fa(giorni)}`}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <div className="riga sopra">
        <a className="btn pieno" href={percorso.nuovaPratica(c.id)}>
          + Nuova pratica in {c.nome}
        </a>
      </div>
    </div>
  );
}
