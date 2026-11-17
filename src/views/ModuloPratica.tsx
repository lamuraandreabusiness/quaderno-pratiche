import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Quaderno } from '../app/dati';
import { useAvviso } from '../app/avvisi';
import { percorso, vai } from '../app/rotte';
import { aggiornaPratica, creaCategoria, creaPratica, type DatiPratica } from '../db/repo';
import type { Frequenza, Pratica } from '../db/types';
import { COLORI, FREQUENZE } from '../lib/costanti';
import { SceltaColore } from '../components/SceltaColore';
import { NonTrovata } from './NonTrovata';
import { LinkSostituisci } from '../components/LinkSostituisci';

const NUOVA = '__nuova';

interface Props {
  dati: Quaderno;
  /** Pratica da modificare */
  id?: string;
  /** Categoria preselezionata per una nuova pratica */
  categoriaId?: string;
  /** Valori di partenza per una nuova pratica (es. dal Contenitore o dalla Raccolta) */
  iniziale?: Partial<DatiPratica>;
  /** Chiamata dopo il salvataggio, prima di aprire la scheda */
  onSalvata?: (p: Pratica) => void | Promise<void>;
  /** Dove torna "Annulla" */
  annullaHref?: string;
  /** Titolo della pagina, se diverso da "Nuova pratica" */
  titoloPagina?: string;
}

interface CampoBozza {
  chiave: number;
  etichetta: string;
  valore: string;
}

type Errori = Partial<Record<'titolo' | 'categoria' | 'nuovaCategoria', string>>;

export function ModuloPratica({ dati, id, categoriaId, iniziale, onSalvata, annullaHref, titoloPagina }: Props) {
  const avviso = useAvviso();
  const esistente = id ? dati.pratiche.find((p) => p.id === id) : undefined;
  const base: Partial<DatiPratica> = esistente ?? iniziale ?? {};
  const contatore = useRef(0);
  const nuovaChiave = () => ++contatore.current;

  // La bozza viene letta una volta sola: gli aggiornamenti del database non cancellano quello che scrivi.
  const [bozza, setBozza] = useState(() => {
    const catIniziale = base.categoriaId ?? categoriaId;
    const valida = dati.categorie.some((c) => c.id === catIniziale);
    return {
      categoriaId: valida ? catIniziale! : (dati.categorie[0]?.id ?? NUOVA),
      nuovaCatNome: '',
      nuovaCatColore: COLORI[dati.categorie.length % COLORI.length].colore,
      titolo: base.titolo ?? '',
      obiettivo: base.obiettivo ?? '',
      svolgimento: base.svolgimento ?? '',
      frequenza: (base.frequenza ?? 'giorno') as Frequenza,
      esempio: base.esempio ?? '',
      fonte: base.fonte ?? '',
      campi: (base.campi ?? []).map((c) => ({ ...c, chiave: nuovaChiave() })) as CampoBozza[],
    };
  });
  const [errori, setErrori] = useState<Errori>({});
  const [salvando, setSalvando] = useState(false);

  const rTitolo = useRef<HTMLInputElement>(null);
  const rCategoria = useRef<HTMLSelectElement>(null);
  const rNuovaCat = useRef<HTMLInputElement>(null);

  // Elemento da mettere a fuoco dopo il prossimo render (campo aggiunto, campo tolto…)
  const fuocoDopo = useRef<string | null>(null);
  useEffect(() => {
    if (!fuocoDopo.current) return;
    document.getElementById(fuocoDopo.current)?.focus();
    fuocoDopo.current = null;
  });

  if (id && !esistente) return <NonTrovata cosa="pratica" />;

  const indietro =
    annullaHref ??
    (esistente
      ? percorso.pratica(esistente.id)
      : categoriaId && dati.categorie.some((c) => c.id === categoriaId)
        ? percorso.categoria(categoriaId)
        : percorso.home());

  const imposta = <K extends keyof typeof bozza>(k: K, v: (typeof bozza)[K]) => setBozza((b) => ({ ...b, [k]: v }));
  const togliErrore = (k: keyof Errori) => errori[k] && setErrori((e) => ({ ...e, [k]: undefined }));

  function aggiungiCampo() {
    const chiave = nuovaChiave();
    setBozza((b) => ({ ...b, campi: [...b.campi, { chiave, etichetta: '', valore: '' }] }));
    fuocoDopo.current = `campo-etichetta-${chiave}`;
  }

  function togliCampo(chiave: number) {
    setBozza((b) => ({ ...b, campi: b.campi.filter((c) => c.chiave !== chiave) }));
    fuocoDopo.current = 'aggiungi-campo';
  }

  function cambiaCampo(chiave: number, k: 'etichetta' | 'valore', v: string) {
    setBozza((b) => ({ ...b, campi: b.campi.map((c) => (c.chiave === chiave ? { ...c, [k]: v } : c)) }));
  }

  async function salva(e: FormEvent) {
    e.preventDefault();
    if (salvando) return;
    const err: Errori = {};
    if (!bozza.titolo.trim()) err.titolo = 'Dai un nome alla pratica.';
    if (bozza.categoriaId === NUOVA) {
      if (!bozza.nuovaCatNome.trim()) err.nuovaCategoria = 'Scrivi il nome della nuova categoria.';
    } else if (!dati.categorie.some((c) => c.id === bozza.categoriaId)) {
      err.categoria = 'Scegli una categoria.';
    }
    setErrori(err);
    if (err.titolo) return rTitolo.current?.focus();
    if (err.categoria) return rCategoria.current?.focus();
    if (err.nuovaCategoria) return rNuovaCat.current?.focus();

    setSalvando(true);
    try {
      let catId = bozza.categoriaId;
      if (catId === NUOVA) catId = (await creaCategoria(bozza.nuovaCatNome, bozza.nuovaCatColore)).id;
      const valori: DatiPratica = {
        categoriaId: catId,
        titolo: bozza.titolo.trim(),
        obiettivo: bozza.obiettivo.trim(),
        svolgimento: bozza.svolgimento.trim(),
        frequenza: bozza.frequenza,
        esempio: bozza.esempio.trim(),
        fonte: bozza.fonte.trim() || undefined,
        campi: bozza.campi
          .map((c) => ({ etichetta: c.etichetta.trim(), valore: c.valore.trim() }))
          .filter((c) => c.etichetta || c.valore),
        origineRaccoltaId: esistente?.origineRaccoltaId ?? iniziale?.origineRaccoltaId,
      };
      let salvata: Pratica;
      if (esistente) {
        await aggiornaPratica(esistente.id, valori);
        salvata = { ...esistente, ...valori };
        avviso('Pratica aggiornata');
      } else {
        salvata = await creaPratica(valori);
        avviso('Pratica aggiunta al quaderno');
      }
      // Prima si apre la scheda, poi si fa il resto: così questa pagina non "sparisce" sotto gli occhi
      vai(percorso.pratica(salvata.id), true);
      await onSalvata?.(salvata);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <p className="briciole">
        <LinkSostituisci href={indietro}>← {esistente ? 'Torna alla pratica' : 'Annulla'}</LinkSostituisci>
      </p>
      <h1 tabIndex={-1}>{esistente ? 'Modifica pratica' : (titoloPagina ?? 'Nuova pratica')}</h1>

      <form className="modulo" onSubmit={salva} noValidate>
        <div className="campo">
          <label htmlFor="p-categoria">Categoria</label>
          <select
            ref={rCategoria}
            id="p-categoria"
            value={bozza.categoriaId}
            onChange={(e) => {
              imposta('categoriaId', e.target.value);
              togliErrore('categoria');
              if (e.target.value === NUOVA) fuocoDopo.current = 'p-nuova-cat';
            }}
            aria-invalid={!!errori.categoria}
            aria-describedby={errori.categoria ? 'p-categoria-errore' : undefined}
          >
            {!dati.categorie.some((c) => c.id === bozza.categoriaId) && bozza.categoriaId !== NUOVA && (
              <option value={bozza.categoriaId}>— scegli —</option>
            )}
            {dati.categorie.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
            <option value={NUOVA}>+ Nuova categoria…</option>
          </select>
          {errori.categoria && (
            <p className="errore" id="p-categoria-errore">
              {errori.categoria}
            </p>
          )}
          {bozza.categoriaId === NUOVA && (
            <div className="nuova-cat">
              <label htmlFor="p-nuova-cat" className="sr">
                Nome della nuova categoria
              </label>
              <input
                ref={rNuovaCat}
                id="p-nuova-cat"
                type="text"
                value={bozza.nuovaCatNome}
                onChange={(e) => {
                  imposta('nuovaCatNome', e.target.value);
                  togliErrore('nuovaCategoria');
                }}
                placeholder="Nome della nuova categoria"
                autoComplete="off"
                aria-invalid={!!errori.nuovaCategoria}
                aria-describedby={errori.nuovaCategoria ? 'p-nuova-cat-errore' : undefined}
              />
              {errori.nuovaCategoria && (
                <p className="errore" id="p-nuova-cat-errore">
                  {errori.nuovaCategoria}
                </p>
              )}
              <span className="sr" id="p-nuova-cat-colore">
                Colore della nuova categoria
              </span>
              <SceltaColore
                nome="colore-nuova-categoria"
                valore={bozza.nuovaCatColore}
                onChange={(c) => imposta('nuovaCatColore', c)}
                etichettaId="p-nuova-cat-colore"
              />
            </div>
          )}
        </div>

        <div className="campo">
          <label htmlFor="p-titolo">Nome della pratica</label>
          <input
            ref={rTitolo}
            id="p-titolo"
            type="text"
            value={bozza.titolo}
            onChange={(e) => {
              imposta('titolo', e.target.value);
              togliErrore('titolo');
            }}
            placeholder="Es. Respirazione quadrata"
            autoComplete="off"
            autoFocus={!esistente && !bozza.titolo}
            aria-invalid={!!errori.titolo}
            aria-describedby={errori.titolo ? 'p-titolo-errore' : undefined}
          />
          {errori.titolo && (
            <p className="errore" id="p-titolo-errore">
              {errori.titolo}
            </p>
          )}
        </div>

        <div className="campo">
          <label htmlFor="p-obiettivo">Obiettivo della pratica</label>
          <textarea
            id="p-obiettivo"
            value={bozza.obiettivo}
            onChange={(e) => imposta('obiettivo', e.target.value)}
            placeholder="A cosa serve, cosa ti aiuta a ottenere"
          />
        </div>

        <div className="campo">
          <label htmlFor="p-svolgimento">Svolgimento</label>
          <p className="aiuto" id="p-svolgimento-aiuto">
            Un passaggio per riga, se ti aiuta.
          </p>
          <textarea
            id="p-svolgimento"
            className="lungo"
            value={bozza.svolgimento}
            onChange={(e) => imposta('svolgimento', e.target.value)}
            placeholder={'1. …\n2. …'}
            aria-describedby="p-svolgimento-aiuto"
          />
        </div>

        <div className="campo">
          <label htmlFor="p-frequenza">Ogni quanto</label>
          <select id="p-frequenza" value={bozza.frequenza} onChange={(e) => imposta('frequenza', e.target.value as Frequenza)}>
            {FREQUENZE.map((f) => (
              <option key={f.valore} value={f.valore}>
                {f.etichetta}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="p-esempio">Esempio di utilizzo</label>
          <textarea
            id="p-esempio"
            value={bozza.esempio}
            onChange={(e) => imposta('esempio', e.target.value)}
            placeholder="Una situazione concreta in cui usarla"
          />
        </div>

        <fieldset className="campo">
          <legend>Campi personalizzati</legend>
          <p className="aiuto">Aggiungi quello che ti serve: durata, materiali, note…</p>
          {bozza.campi.map((c, i) => (
            <div className="campo-pers" key={c.chiave}>
              <input
                id={`campo-etichetta-${c.chiave}`}
                type="text"
                value={c.etichetta}
                onChange={(e) => cambiaCampo(c.chiave, 'etichetta', e.target.value)}
                placeholder="Nome del campo (es. Durata)"
                aria-label={`Nome del campo ${i + 1}`}
                autoComplete="off"
              />
              <button
                type="button"
                className="btn leggero"
                onClick={() => togliCampo(c.chiave)}
                aria-label={`Rimuovi il campo ${c.etichetta.trim() || i + 1}`}
              >
                ✕
              </button>
              <textarea
                className="valore-campo"
                value={c.valore}
                onChange={(e) => cambiaCampo(c.chiave, 'valore', e.target.value)}
                placeholder="Contenuto"
                aria-label={`Contenuto del campo ${c.etichetta.trim() || i + 1}`}
              />
            </div>
          ))}
          <button type="button" id="aggiungi-campo" className="btn" style={{ marginTop: 10 }} onClick={aggiungiCampo}>
            + Aggiungi campo
          </button>
        </fieldset>

        <div className="campo">
          <label htmlFor="p-fonte">
            Fonte <span className="facoltativo">(facoltativa)</span>
          </label>
          <p className="aiuto" id="p-fonte-aiuto">
            Un link, oppure un libro, un corso, un video…
          </p>
          <input
            id="p-fonte"
            type="text"
            value={bozza.fonte}
            onChange={(e) => imposta('fonte', e.target.value)}
            aria-describedby="p-fonte-aiuto"
            autoComplete="off"
          />
        </div>

        <div className="riga sopra">
          <button type="submit" className="btn pieno" disabled={salvando}>
            Salva nel quaderno
          </button>
          <LinkSostituisci className="btn leggero" href={indietro}>
            Annulla
          </LinkSostituisci>
        </div>
      </form>
    </>
  );
}
