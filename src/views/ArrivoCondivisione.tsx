import { useRef, useState, type FormEvent } from 'react';
import type { Quaderno } from '../app/dati';
import { useAvviso } from '../app/avvisi';
import { percorso, vai } from '../app/rotte';
import { creaDaProvare } from '../db/repo';
import { CampiDaProvare, datiDaBozza, type BozzaDaProvare } from '../components/CampiDaProvare';
import { LinkSostituisci } from '../components/LinkSostituisci';
import { bozzaDaCondivisione, eCondivisione } from '../lib/condivisione';

// Quello che è arrivato con la condivisione, letto una volta all'avvio (poi l'indirizzo viene ripulito)
let arrivata: BozzaDaProvare | null = null;

/** Da chiamare prima del primo render: se l'app è stata aperta da una condivisione, prepara la pagina di arrivo. */
export function accogliCondivisione() {
  if (!eCondivisione(window.location.search)) return;
  arrivata = bozzaDaCondivisione(window.location.search);
  window.history.replaceState(null, '', window.location.pathname + '#/condividi');
}

/** Pagina di arrivo di un link condiviso da un'altra app: si controlla e si mette "Da provare". */
export function ArrivoCondivisione({ dati }: { dati: Quaderno }) {
  const avviso = useAvviso();
  const [bozza, setBozza] = useState<BozzaDaProvare | null>(() => arrivata);
  const [errore, setErrore] = useState('');
  const campoNome = useRef<HTMLInputElement>(null);

  if (!bozza) {
    return (
      <>
        <h1 tabIndex={-1}>Niente da aggiungere</h1>
        <p className="tenue">Non è arrivato nessun link. Puoi condividere una pagina verso il Quaderno dal menu "Condividi" del browser.</p>
        <p className="sopra">
          <a className="btn" href={percorso.contenitore()}>
            Vai al Contenitore
          </a>
        </p>
      </>
    );
  }

  async function salva(e: FormEvent) {
    e.preventDefault();
    if (!bozza!.titolo.trim()) {
      setErrore('Dai un nome alla pratica.');
      campoNome.current?.focus();
      return;
    }
    await creaDaProvare(datiDaBozza(bozza!));
    arrivata = null;
    avviso('Messa da provare ✓');
    vai(percorso.contenitore(), true);
  }

  return (
    <>
      <p className="briciole">
        <LinkSostituisci href={percorso.home()} onClick={() => (arrivata = null)}>
          ← Lascia perdere
        </LinkSostituisci>
      </p>
      <h1 tabIndex={-1}>Mettila da provare</h1>
      <p className="tenue">Hai condiviso questo con il Quaderno. Controlla il nome e mettila nel Contenitore.</p>
      <form className="modulo" onSubmit={salva} noValidate>
        <div className="campo">
          <label htmlFor="cd-titolo">Nome</label>
          <input
            ref={campoNome}
            id="cd-titolo"
            type="text"
            value={bozza.titolo}
            onChange={(e) => {
              setBozza({ ...bozza, titolo: e.target.value });
              if (errore) setErrore('');
            }}
            autoComplete="off"
            aria-invalid={!!errore}
            aria-describedby={errore ? 'cd-titolo-errore' : undefined}
          />
          {errore && (
            <p className="errore" id="cd-titolo-errore">
              {errore}
            </p>
          )}
        </div>
        <CampiDaProvare prefisso="cd" bozza={bozza} categorie={dati.categorie} onChange={setBozza} />
        <div className="riga sopra">
          <button type="submit" className="btn pieno">
            Metti da provare
          </button>
          <LinkSostituisci className="btn leggero" href={percorso.home()} onClick={() => (arrivata = null)}>
            Annulla
          </LinkSostituisci>
        </div>
      </form>
    </>
  );
}
