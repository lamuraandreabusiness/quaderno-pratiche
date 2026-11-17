import { useState, type CSSProperties } from 'react';
import type { Quaderno } from '../app/dati';
import { percorso, vai } from '../app/rotte';
import { RACCOLTA, TEMI } from '../data/raccolta';
import { etichettaFrequenza, stileColore } from '../lib/costanti';
import { cercaInRaccolta } from '../lib/ricerca';
import { coloreTema, statoVoce } from '../lib/statoRaccolta';

interface Props {
  dati: Quaderno;
  q: string;
  tema: string;
}

// Ultima ricerca fatta nella Raccolta: l'anteprima ci torna con "← Raccolta"
let ultimaRicerca = percorso.raccolta();
export const indirizzoUltimaRicerca = () => ultimaRicerca;

/** Catalogo di pratiche già pronte, con ricerca e filtro per tema. */
export function ParteRaccolta({ dati, q, tema }: Props) {
  // Il testo vive qui (così il cursore non salta); l'indirizzo viene aggiornato per ritrovare la ricerca tornando indietro
  const [testo, setTesto] = useState(q);
  const temaValido = TEMI.includes(tema) ? tema : '';
  const risultati = cercaInRaccolta(RACCOLTA, testo, temaValido || undefined);

  ultimaRicerca = percorso.raccolta(testo.trim() ? testo : '', temaValido);
  const aggiorna = (t: string, tm: string) => vai(percorso.raccolta(t.trim() ? t : '', tm), true);

  return (
    <>
      <h2 className="sr">Raccolta</h2>
      <p className="tenue">
        Pratiche già scritte: sfogliale, provale, copiale nel tuo quaderno e cambiale come vuoi.
      </p>
      <div className="modulo cerca">
        <label htmlFor="cerca-raccolta" className="sr">
          Cerca nella Raccolta
        </label>
        <input
          id="cerca-raccolta"
          type="search"
          value={testo}
          onChange={(e) => {
            setTesto(e.target.value);
            aggiorna(e.target.value, temaValido);
          }}
          placeholder="Cerca: sonno, ansia, mattino…"
          enterKeyHint="search"
          autoComplete="off"
        />
      </div>
      <div className="filtri" role="group" aria-label="Filtra per tema">
        {['', ...TEMI].map((t) => (
          <button
            key={t || 'tutti'}
            type="button"
            className="filtro"
            aria-pressed={temaValido === t}
            style={t ? (stileColore(coloreTema(dati, t)) as CSSProperties) : undefined}
            onClick={() => aggiorna(testo, t)}
          >
            {t || 'Tutti i temi'}
          </button>
        ))}
      </div>

      <p className="tenue conto-risultati" role="status">
        {risultati.length === 0
          ? 'Nessuna pratica trovata. Prova con un’altra parola o un altro tema.'
          : risultati.length === 1
            ? '1 pratica'
            : `${risultati.length} pratiche`}
      </p>

      <ul className="elenco-raccolta">
        {risultati.map((v) => {
          const stato = statoVoce(dati, v.id);
          return (
            <li key={v.id}>
              <a className="cartoncino voce-raccolta" href={percorso.voceRaccolta(v.id)} style={stileColore(coloreTema(dati, v.tema)) as CSSProperties}>
                <span className="t">{v.titolo}</span>
                <span className="riga" style={{ gap: 6 }}>
                  <span className="etichetta-cat">{v.tema}</span>
                  <span className="tag">{etichettaFrequenza(v.frequenza)}</span>
                  {stato.tipo === 'nel-quaderno' && <span className="bollino">✓ Già nel quaderno</span>}
                  {stato.tipo === 'da-provare' && <span className="bollino">In “Da provare”</span>}
                </span>
                <span className="obiettivo">{v.obiettivo}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
