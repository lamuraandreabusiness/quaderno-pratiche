import type { CSSProperties } from 'react';
import { COLORI } from '../lib/costanti';

interface Props {
  nome: string; // nome del gruppo di radio
  valore: string;
  onChange: (colore: string) => void;
  etichettaId?: string;
}

/** Palette di 8 colori: radio veri, quindi frecce della tastiera comprese. */
export function SceltaColore({ nome, valore, onChange, etichettaId }: Props) {
  return (
    <div className="colori" role="radiogroup" aria-labelledby={etichettaId}>
      {COLORI.map((c) => (
        <label key={c.colore} className="colore" title={c.nome}>
          <input
            type="radio"
            name={nome}
            value={c.colore}
            checked={valore === c.colore}
            onChange={() => onChange(c.colore)}
            aria-label={c.nome}
          />
          <span style={{ '--c': c.colore } as CSSProperties} aria-hidden="true" />
        </label>
      ))}
    </div>
  );
}
