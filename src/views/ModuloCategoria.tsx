import { useRef, useState, type FormEvent } from 'react';
import type { Quaderno } from '../app/dati';
import { useAvviso } from '../app/avvisi';
import { percorso, vai } from '../app/rotte';
import { aggiornaCategoria, creaCategoria } from '../db/repo';
import { COLORI } from '../lib/costanti';
import { SceltaColore } from '../components/SceltaColore';
import { NonTrovata } from './NonTrovata';
import { LinkSostituisci } from '../components/LinkSostituisci';

interface Props {
  dati: Quaderno;
  id?: string;
}

export function ModuloCategoria({ dati, id }: Props) {
  const avviso = useAvviso();
  const esistente = id ? dati.categorie.find((c) => c.id === id) : undefined;
  // Stato iniziale letto una volta sola: gli aggiornamenti dei dati non toccano quello che stai scrivendo
  const [nome, setNome] = useState(esistente?.nome ?? '');
  const [colore, setColore] = useState(esistente?.colore ?? COLORI[dati.categorie.length % COLORI.length].colore);
  const [errore, setErrore] = useState('');
  const campoNome = useRef<HTMLInputElement>(null);

  if (id && !esistente) return <NonTrovata cosa="categoria" />;
  const indietro = esistente ? percorso.categoria(esistente.id) : percorso.home();

  async function salva(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErrore('Scrivi un nome per la categoria.');
      campoNome.current?.focus();
      return;
    }
    if (esistente) {
      await aggiornaCategoria(esistente.id, { nome: nome.trim(), colore });
      avviso('Categoria aggiornata');
      vai(percorso.categoria(esistente.id), true);
    } else {
      const c = await creaCategoria(nome, colore);
      avviso('Categoria creata');
      vai(percorso.categoria(c.id), true);
    }
  }

  return (
    <>
      <p className="briciole">
        <LinkSostituisci href={indietro}>← Annulla</LinkSostituisci>
      </p>
      <h1 tabIndex={-1}>{esistente ? 'Modifica categoria' : 'Nuova categoria'}</h1>
      <form className="modulo" onSubmit={salva} noValidate>
        <div className="campo">
          <label htmlFor="cat-nome">Nome</label>
          <input
            ref={campoNome}
            id="cat-nome"
            type="text"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (errore) setErrore('');
            }}
            placeholder="Es. Gestione delle emozioni"
            autoFocus={!esistente}
            aria-invalid={!!errore}
            aria-describedby={errore ? 'cat-nome-errore' : undefined}
            autoComplete="off"
          />
          {errore && (
            <p className="errore" id="cat-nome-errore">
              {errore}
            </p>
          )}
        </div>
        <div className="campo">
          <span className="nome-campo" id="cat-colore">
            Colore
          </span>
          <SceltaColore nome="colore-categoria" valore={colore} onChange={setColore} etichettaId="cat-colore" />
        </div>
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
