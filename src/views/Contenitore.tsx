import { useRef, useState, type CSSProperties, type FormEvent } from 'react';
import type { Quaderno } from '../app/dati';
import { useAvviso, useConferma } from '../app/avvisi';
import { percorso } from '../app/rotte';
import { creaDaProvare, eliminaDaProvare } from '../db/repo';
import type { DaProvare } from '../db/types';
import { stileColore } from '../lib/costanti';
import { formattaDataBreve } from '../lib/date';
import { CampiDaProvare, bozzaVuota, datiDaBozza, type BozzaDaProvare } from '../components/CampiDaProvare';
import { Fonte } from '../components/Fonte';
import { LinkSostituisci } from '../components/LinkSostituisci';
import { ParteRaccolta } from './ParteRaccolta';

interface Props {
  dati: Quaderno;
  oggi: Date;
  parte: 'da-provare' | 'raccolta';
  q: string;
  tema: string;
}

/** Contenitore delle pratiche: "Da provare" (raccolte da te) e "Raccolta" (già pronte). */
export function Contenitore({ dati, oggi, parte, q, tema }: Props) {
  return (
    <>
      <p className="briciole">
        <a href={percorso.home()}>← Indice</a>
      </p>
      <h1 tabIndex={-1}>Contenitore delle pratiche</h1>
      <p className="tenue">Le pratiche che trovi in giro e pensi possano esserti utili, prima di metterle nel quaderno.</p>

      <nav className="schede" aria-label="Parti del Contenitore">
        <LinkSostituisci href={percorso.contenitore()} aria-current={parte === 'da-provare' ? 'page' : undefined}>
          Da provare{dati.daProvare.length > 0 && <span className="conto-scheda"> {dati.daProvare.length}</span>}
        </LinkSostituisci>
        <LinkSostituisci href={percorso.raccolta()} aria-current={parte === 'raccolta' ? 'page' : undefined}>
          Raccolta
        </LinkSostituisci>
      </nav>

      {parte === 'da-provare' ? <ParteDaProvare dati={dati} oggi={oggi} /> : <ParteRaccolta dati={dati} q={q} tema={tema} />}
    </>
  );
}

function ParteDaProvare({ dati, oggi }: { dati: Quaderno; oggi: Date }) {
  const avviso = useAvviso();
  const conferma = useConferma();
  const [bozza, setBozza] = useState<BozzaDaProvare>(bozzaVuota);
  const [dettagli, setDettagli] = useState(false);
  const [errore, setErrore] = useState('');
  const campoNome = useRef<HTMLInputElement>(null);
  const elenco = dati.daProvare;

  async function aggiungi(e: FormEvent) {
    e.preventDefault();
    if (!bozza.titolo.trim()) {
      setErrore('Scrivi almeno il nome della pratica.');
      campoNome.current?.focus();
      return;
    }
    // Svuota subito il modulo (prima di salvare): così quello che scrivi nel frattempo non si perde
    const daSalvare = bozza;
    setBozza(bozzaVuota());
    setDettagli(false);
    campoNome.current?.focus(); // pronta per la prossima
    try {
      await creaDaProvare(datiDaBozza(daSalvare));
      avviso('Messa da provare ✓');
    } catch {
      setBozza(daSalvare);
      setErrore('Non sono riuscito a salvarla, riprova.');
    }
  }

  async function scarta(d: DaProvare) {
    const ok = await conferma({
      titolo: 'Scartare questa pratica?',
      testo: `"${d.titolo}" uscirà dal Contenitore.`,
      conferma: 'Scarta',
      pericolo: true,
    });
    if (!ok) return;
    await eliminaDaProvare(d.id);
    avviso('Scartata');
    campoNome.current?.focus();
  }

  return (
    <>
      <h2 className="sr">Da provare</h2>
      <form className="modulo inserimento-rapido" onSubmit={aggiungi} noValidate>
        <label htmlFor="dp-titolo" className="sr">
          Nome della pratica da provare
        </label>
        <div className="riga-rapida">
          <input
            ref={campoNome}
            id="dp-titolo"
            type="text"
            value={bozza.titolo}
            onChange={(e) => {
              setBozza({ ...bozza, titolo: e.target.value });
              if (errore) setErrore('');
            }}
            placeholder="Nome della pratica"
            enterKeyHint="done"
            autoComplete="off"
            aria-invalid={!!errore}
            aria-describedby={errore ? 'dp-titolo-errore' : undefined}
          />
          <button type="submit" className="btn pieno">
            Aggiungi
          </button>
        </div>
        {errore && (
          <p className="errore" id="dp-titolo-errore">
            {errore}
          </p>
        )}
        <button
          type="button"
          className="btn leggero"
          aria-expanded={dettagli}
          aria-controls="dp-dettagli"
          onClick={() => setDettagli(!dettagli)}
        >
          {dettagli ? '− meno dettagli' : '+ fonte, nota, categoria'}
        </button>
        {dettagli && (
          <div id="dp-dettagli" className="dettagli-rapidi">
            <CampiDaProvare prefisso="dp" bozza={bozza} categorie={dati.categorie} onChange={setBozza} />
          </div>
        )}
      </form>

      {elenco.length === 0 ? (
        <p className="vuoto">
          Ancora niente da provare. Quando trovi una pratica che ti incuriosisce, scrivila qui: basta il nome.
        </p>
      ) : (
        <ul className="elenco-da-provare" aria-label="Pratiche da provare">
          {elenco.map((d) => {
            const cat = dati.categorie.find((c) => c.id === d.categoriaSuggeritaId);
            return (
              <li key={d.id} className="cartoncino">
                <h3 className="t">{d.titolo}</h3>
                <p className="meta">
                  {d.fonte && (
                    <>
                      <Fonte valore={d.fonte} breve /> ·{' '}
                    </>
                  )}
                  <span className="nowrap">aggiunta il {formattaDataBreve(d.createdAt, oggi)}</span>
                  {cat && (
                    <>
                      {' '}
                      ·{' '}
                      <span className="etichetta-cat" style={stileColore(cat.colore) as CSSProperties}>
                        {cat.nome}
                      </span>
                    </>
                  )}
                </p>
                {d.nota && <p className="nota">{d.nota}</p>}
                <div className="riga azioni">
                  <a className="btn pieno" href={percorso.nelQuaderno(d.id)}>
                    Mettilo nel quaderno
                  </a>
                  <a className="btn leggero" href={percorso.modificaDaProvare(d.id)} aria-label={`Modifica ${d.titolo}`}>
                    Modifica
                  </a>
                  <button type="button" className="btn leggero" onClick={() => scarta(d)} aria-label={`Scarta ${d.titolo}`}>
                    Scarta
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
