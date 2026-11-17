import { useRef, useState, type FormEvent } from 'react';
import type { Quaderno } from '../app/dati';
import { useAvviso } from '../app/avvisi';
import { percorso, vai } from '../app/rotte';
import { aggiornaDaProvare } from '../db/repo';
import { CampiDaProvare, datiDaBozza, type BozzaDaProvare } from '../components/CampiDaProvare';
import { LinkSostituisci } from '../components/LinkSostituisci';
import { NonTrovata } from './NonTrovata';

interface Props {
  dati: Quaderno;
  id: string;
}

export function ModuloDaProvare({ dati, id }: Props) {
  const avviso = useAvviso();
  const d = dati.daProvare.find((x) => x.id === id);
  // Bozza letta una volta sola: gli aggiornamenti dei dati non cancellano quello che scrivi
  const [bozza, setBozza] = useState<BozzaDaProvare>(() => ({
    titolo: d?.titolo ?? '',
    fonte: d?.fonte ?? '',
    nota: d?.nota ?? '',
    categoriaSuggeritaId: dati.categorie.some((c) => c.id === d?.categoriaSuggeritaId) ? d!.categoriaSuggeritaId! : '',
  }));
  const [errore, setErrore] = useState('');
  const campoNome = useRef<HTMLInputElement>(null);

  if (!d) return <NonTrovata />;
  const indietro = percorso.contenitore();

  async function salva(e: FormEvent) {
    e.preventDefault();
    if (!bozza.titolo.trim()) {
      setErrore('Il nome non può restare vuoto.');
      campoNome.current?.focus();
      return;
    }
    const valori = datiDaBozza(bozza);
    // undefined non cancellerebbe il campo in Dexie: usiamo stringhe vuote dove serve
    await aggiornaDaProvare(id, {
      titolo: valori.titolo,
      fonte: valori.fonte ?? '',
      nota: valori.nota ?? '',
      categoriaSuggeritaId: valori.categoriaSuggeritaId ?? '',
    });
    avviso('Modifiche salvate');
    vai(indietro, true);
  }

  return (
    <>
      <p className="briciole">
        <LinkSostituisci href={indietro}>← Annulla</LinkSostituisci>
      </p>
      <h1 tabIndex={-1}>Modifica “da provare”</h1>
      <form className="modulo" onSubmit={salva} noValidate>
        <div className="campo">
          <label htmlFor="mdp-titolo">Nome</label>
          <input
            ref={campoNome}
            id="mdp-titolo"
            type="text"
            value={bozza.titolo}
            onChange={(e) => {
              setBozza({ ...bozza, titolo: e.target.value });
              if (errore) setErrore('');
            }}
            autoComplete="off"
            aria-invalid={!!errore}
            aria-describedby={errore ? 'mdp-titolo-errore' : undefined}
          />
          {errore && (
            <p className="errore" id="mdp-titolo-errore">
              {errore}
            </p>
          )}
        </div>
        <CampiDaProvare prefisso="mdp" bozza={bozza} categorie={dati.categorie} onChange={setBozza} />
        <div className="riga sopra">
          <button type="submit" className="btn pieno">
            Salva
          </button>
          <LinkSostituisci className="btn leggero" href={indietro}>
            Annulla
          </LinkSostituisci>
        </div>
      </form>
    </>
  );
}
