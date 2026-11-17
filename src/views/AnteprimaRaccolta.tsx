import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import type { Quaderno } from '../app/dati';
import { useAvviso } from '../app/avvisi';
import { percorso } from '../app/rotte';
import { creaCategoria, creaDaProvare, creaPratica, eliminaDaProvare } from '../db/repo';
import { voceRaccolta } from '../data/raccolta';
import { COLORI, etichettaFrequenza, stileColore } from '../lib/costanti';
import { categoriaPerTema, coloreTema, statoVoce } from '../lib/statoRaccolta';
import { SceltaColore } from '../components/SceltaColore';
import { indirizzoUltimaRicerca } from './ParteRaccolta';
import { NonTrovata } from './NonTrovata';

const NUOVA = '__nuova';

/** Anteprima di una pratica della Raccolta, con "Aggiungi al mio quaderno" e "Mettila da provare". */
export function AnteprimaRaccolta({ dati, id }: { dati: Quaderno; id: string }) {
  const avviso = useAvviso();
  const v = voceRaccolta(id);
  const [scelta, setScelta] = useState(false); // pannello "in quale categoria?"
  const [categoriaId, setCategoriaId] = useState('');
  const [nuovaNome, setNuovaNome] = useState('');
  const [nuovaColore, setNuovaColore] = useState('');
  const [errore, setErrore] = useState('');
  const [lavoro, setLavoro] = useState(false);
  const fuocoDopo = useRef<string | null>(null);
  useEffect(() => {
    if (!fuocoDopo.current) return;
    const el = document.getElementById(fuocoDopo.current);
    // l'elemento può comparire solo al prossimo aggiornamento dei dati: in quel caso si riprova
    if (el) {
      el.focus();
      fuocoDopo.current = null;
    }
  });

  if (!v) return <NonTrovata />;
  const voce = v;
  const stato = statoVoce(dati, voce.id);
  const colore = coloreTema(dati, voce.tema);

  function apriScelta() {
    // Proposta: la categoria con lo stesso nome del tema, altrimenti la prima; se non ce ne sono, una nuova col nome del tema
    const corrispondente = categoriaPerTema(dati, voce.tema);
    setCategoriaId(corrispondente?.id ?? dati.categorie[0]?.id ?? NUOVA);
    setNuovaNome(voce.tema);
    setNuovaColore(colore !== '#5c5f77' ? colore : COLORI[dati.categorie.length % COLORI.length].colore);
    setErrore('');
    setScelta(true);
    fuocoDopo.current = 'scegli-categoria';
  }

  async function aggiungi(e: FormEvent) {
    e.preventDefault();
    if (lavoro) return;
    if (categoriaId === NUOVA && !nuovaNome.trim()) {
      setErrore('Scrivi il nome della nuova categoria.');
      fuocoDopo.current = 'nuova-cat-nome';
      return;
    }
    setLavoro(true);
    try {
      let catId = categoriaId;
      let nomeCat = dati.categorie.find((c) => c.id === catId)?.nome ?? '';
      if (catId === NUOVA) {
        const c = await creaCategoria(nuovaNome, nuovaColore);
        catId = c.id;
        nomeCat = c.nome;
      }
      await creaPratica({
        categoriaId: catId,
        titolo: voce.titolo,
        obiettivo: voce.obiettivo,
        svolgimento: voce.svolgimento,
        frequenza: voce.frequenza,
        esempio: voce.esempio,
        ...(voce.fonte ? { fonte: voce.fonte } : {}),
        campi: voce.avvertenza ? [{ etichetta: 'Attenzione', valore: voce.avvertenza }] : [],
        origineRaccoltaId: voce.id,
      });
      // Se era in "Da provare", ora è nel quaderno: esce dal Contenitore
      if (stato.tipo === 'da-provare') await eliminaDaProvare(stato.daProvareId);
      setScelta(false);
      avviso(`Aggiunta al quaderno in ${nomeCat} ✓`);
      fuocoDopo.current = 'apri-copia';
    } finally {
      setLavoro(false);
    }
  }

  async function daProvare() {
    fuocoDopo.current = 'vai-da-provare'; // prima del salvataggio: il link compare con l'aggiornamento dei dati
    await creaDaProvare({
      titolo: voce.titolo,
      nota: voce.obiettivo,
      categoriaSuggeritaId: categoriaPerTema(dati, voce.tema)?.id,
      origineRaccoltaId: voce.id,
    });
    avviso('Messa da provare ✓');
  }

  const blocco = (titolo: string, testo: string) => (
    <section className="voce">
      <h2>{titolo}</h2>
      <p className="valore">{testo}</p>
    </section>
  );

  return (
    <div className="colorata" style={stileColore(colore) as CSSProperties}>
      <p className="briciole">
        <a href={indirizzoUltimaRicerca()}>← Raccolta</a>
      </p>
      <h1 className="titolo-pratica" tabIndex={-1}>
        {voce.titolo}
      </h1>
      <div className="riga" style={{ gap: 6 }}>
        <span className="etichetta-cat">{voce.tema}</span>
        <span className="tag">dalla Raccolta</span>
      </div>

      {blocco('Obiettivo della pratica', voce.obiettivo)}
      {blocco('Svolgimento', voce.svolgimento)}
      <section className="voce">
        <h2>Frequenza consigliata</h2>
        <span className="frequenza-grande">{etichettaFrequenza(voce.frequenza)}</span>
      </section>
      {blocco('Esempio di utilizzo', voce.esempio)}
      {voce.avvertenza && (
        <section className="voce" aria-labelledby="t-attenzione">
          <h2 id="t-attenzione">Attenzione</h2>
          <p className="valore attenzione">{voce.avvertenza}</p>
        </section>
      )}
      {voce.fonte && (
        <section className="voce">
          <h2>Fonte</h2>
          <p className="valore fonte">{voce.fonte}</p>
        </section>
      )}

      <section className="registro azioni-raccolta" aria-label="Cosa vuoi farne?">
        {stato.tipo === 'nel-quaderno' ? (
          <div className="riga">
            <span className="bollino grande">✓ Già nel quaderno</span>
            <a id="apri-copia" className="btn pieno" href={percorso.pratica(stato.praticaId)}>
              Apri la pratica
            </a>
          </div>
        ) : scelta ? (
          <form className="modulo scelta-categoria" onSubmit={aggiungi} noValidate>
            <label htmlFor="scegli-categoria">In quale categoria la metti?</label>
            <select id="scegli-categoria" value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setErrore(''); if (e.target.value === NUOVA) fuocoDopo.current = 'nuova-cat-nome'; }}>
              {dati.categorie.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
              <option value={NUOVA}>+ Nuova categoria…</option>
            </select>
            {categoriaId === NUOVA && (
              <div className="nuova-cat">
                <label htmlFor="nuova-cat-nome" className="sr">
                  Nome della nuova categoria
                </label>
                <input
                  id="nuova-cat-nome"
                  type="text"
                  value={nuovaNome}
                  onChange={(e) => { setNuovaNome(e.target.value); setErrore(''); }}
                  placeholder="Nome della nuova categoria"
                  autoComplete="off"
                  aria-invalid={!!errore}
                  aria-describedby={errore ? 'nuova-cat-errore' : undefined}
                />
                {errore && (
                  <p className="errore" id="nuova-cat-errore">
                    {errore}
                  </p>
                )}
                <span className="sr" id="nuova-cat-colore">
                  Colore della nuova categoria
                </span>
                <SceltaColore nome="colore-raccolta" valore={nuovaColore} onChange={setNuovaColore} etichettaId="nuova-cat-colore" />
              </div>
            )}
            <div className="riga" style={{ marginTop: 12 }}>
              <button type="submit" className="btn pieno" disabled={lavoro}>
                Aggiungi
              </button>
              <button type="button" className="btn leggero" onClick={() => { setScelta(false); fuocoDopo.current = 'aggiungi-quaderno'; }}>
                Annulla
              </button>
            </div>
          </form>
        ) : (
          <div className="riga">
            <button id="aggiungi-quaderno" type="button" className="btn pieno" onClick={apriScelta}>
              Aggiungi al mio quaderno
            </button>
            {stato.tipo === 'libera' ? (
              <button type="button" className="btn" onClick={daProvare}>
                Mettila da provare
              </button>
            ) : (
              <a id="vai-da-provare" className="btn leggero" href={percorso.contenitore()}>
                È già in “Da provare” →
              </a>
            )}
          </div>
        )}
        {stato.tipo !== 'nel-quaderno' && (
          <p className="statistiche">Nel quaderno ne nasce una copia tutta tua: puoi cambiarla come vuoi.</p>
        )}
      </section>
    </div>
  );
}
