import { useState, type CSSProperties, type FormEvent } from 'react';
import type { Quaderno } from '../app/dati';
import { useAvviso, useConferma } from '../app/avvisi';
import { percorso, vai } from '../app/rotte';
import { annullaUltima, eliminaPratica, registra } from '../db/repo';
import { etichettaFrequenza, stileColore } from '../lib/costanti';
import { chiaveGiorno, fa, formattaRegistrazione, giorniTra, leggiDataRegistrazione } from '../lib/date';
import { fattaOggi, giorniDiFila, ordinaRecenti } from '../lib/registro';
import { NonTrovata } from './NonTrovata';
import { Fonte } from '../components/Fonte';
import { LinkSostituisci } from '../components/LinkSostituisci';

interface Props {
  dati: Quaderno;
  id: string;
  oggi: Date;
}

export function SchedaPratica({ dati, id, oggi }: Props) {
  const conferma = useConferma();
  const avviso = useAvviso();
  const [altraData, setAltraData] = useState<string | null>(null);
  const [erroreData, setErroreData] = useState('');

  const p = dati.pratiche.find((x) => x.id === id);
  if (!p) return <NonTrovata cosa="pratica" />;
  const c = dati.categorie.find((x) => x.id === p.categoriaId);
  const colore = c?.colore ?? '#5c5f77';

  const regs = ordinaRecenti(dati.registrazioni.get(p.id) ?? []);
  const fatta = fattaOggi(regs, oggi);
  const ultima = regs[0] ? leggiDataRegistrazione(regs[0].data) : null;
  const serie = p.frequenza === 'giorno' ? giorniDiFila(regs, oggi) : 0;
  const oggiChiave = chiaveGiorno(oggi);
  const ieri = chiaveGiorno(new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() - 1));

  async function timbra() {
    await registra(p!.id);
    avviso(fatta ? 'Registrata di nuovo ✓' : 'Registrata ✓ oggi');
  }

  async function annulla() {
    // se era l'ultima registrazione, il pulsante sparisce: il focus torna sul timbro
    if (regs.length === 1) document.querySelector<HTMLElement>('.timbro')?.focus();
    const r = await annullaUltima(p!.id);
    if (r) avviso(`Annullata la registrazione del ${formattaRegistrazione(r.data)}`);
  }

  async function registraData(e: FormEvent) {
    e.preventDefault();
    if (!altraData) {
      setErroreData('Scegli una data.');
      return;
    }
    if (altraData > oggiChiave) {
      setErroreData('Scegli una data passata: il futuro non si registra.');
      return;
    }
    await registra(p!.id, altraData === oggiChiave ? undefined : altraData);
    avviso(`Registrata ✓ ${formattaRegistrazione(altraData)}`);
    setAltraData(null);
    setErroreData('');
  }

  async function elimina() {
    const ok = await conferma({
      titolo: 'Eliminare la pratica?',
      testo: `"${p!.titolo}" e il suo registro verranno tolti dal quaderno.`,
      conferma: 'Elimina',
      pericolo: true,
    });
    if (!ok) return;
    vai(c ? percorso.categoria(c.id) : percorso.home(), true);
    await eliminaPratica(p!.id);
    avviso('Pratica eliminata');
  }

  const voce = (titolo: string, valore: string | undefined) => (
    <section className="voce">
      <h2>{titolo}</h2>
      {valore?.trim() ? <p className="valore">{valore}</p> : <p className="valore vuoto-campo">— da scrivere —</p>}
    </section>
  );

  return (
    <div className="colorata" style={stileColore(colore) as CSSProperties}>
      <p className="briciole">
        <a href={percorso.home()}>Indice</a> › {c ? <a href={percorso.categoria(c.id)}>{c.nome}</a> : 'Senza categoria'}
      </p>
      <h1 className="titolo-pratica" tabIndex={-1}>
        {p.titolo}
      </h1>
      <div className="riga">
        {c && <span className="etichetta-cat">{c.nome}</span>}
        <span className="spazio" />
        <span className="azioni-testa">
          <LinkSostituisci className="btn leggero" href={percorso.modificaPratica(p.id)}>
            Modifica
          </LinkSostituisci>
          <button type="button" className="btn leggero" onClick={elimina}>
            Elimina
          </button>
        </span>
      </div>

      {voce('Obiettivo della pratica', p.obiettivo)}
      {voce('Svolgimento', p.svolgimento)}
      <section className="voce">
        <h2>Ogni quanto</h2>
        <span className="frequenza-grande">{etichettaFrequenza(p.frequenza)}</span>
      </section>
      {voce('Esempio di utilizzo', p.esempio)}
      {p.campi
        .filter((f) => f.etichetta.trim() || f.valore.trim())
        .map((f, i) => (
          <section className="voce" key={i}>
            <h2>{f.etichetta.trim() || 'Campo'}</h2>
            <p className="valore">
              <Fonte valore={f.valore} />
            </p>
          </section>
        ))}
      {p.fonte?.trim() && (
        <section className="voce">
          <h2>Fonte</h2>
          <p className="valore">
            <Fonte valore={p.fonte} />
          </p>
        </section>
      )}

      <section className="registro" aria-labelledby="registro-titolo">
        <h2 id="registro-titolo">Registro</h2>
        <div className="riga riga-timbro">
          <button type="button" className={`timbro ${fatta ? 'fatto' : ''}`} onClick={timbra} aria-describedby={fatta ? 'timbro-aiuto' : undefined}>
            {fatta ? '✓ Fatta oggi' : 'Registra: fatta oggi'}
          </button>
          {fatta && (
            <span id="timbro-aiuto" className="sr">
              Premi di nuovo per registrarla un'altra volta oggi.
            </span>
          )}
          {regs.length > 0 && (
            <button type="button" className="btn leggero" onClick={annulla}>
              annulla l'ultima
            </button>
          )}
          <button
            type="button"
            className="btn leggero"
            aria-expanded={altraData !== null}
            aria-controls="altra-data"
            onClick={() => {
              setAltraData(altraData === null ? ieri : null);
              setErroreData('');
            }}
          >
            {altraData === null ? '+ altra data' : 'chiudi'}
          </button>
        </div>
        {altraData !== null && (
          <form id="altra-data" className="riga altra-data" onSubmit={registraData} noValidate>
            <label htmlFor="data-passata" className="sr">
              Data in cui l'hai fatta
            </label>
            <input
              id="data-passata"
              type="date"
              value={altraData}
              max={oggiChiave}
              onChange={(e) => {
                setAltraData(e.target.value);
                setErroreData('');
              }}
              aria-invalid={!!erroreData}
              aria-describedby={erroreData ? 'data-errore' : undefined}
            />
            <button type="submit" className="btn">
              Registra
            </button>
            {erroreData && (
              <p className="errore" id="data-errore" style={{ flexBasis: '100%' }}>
                {erroreData}
              </p>
            )}
          </form>
        )}

        <p className="statistiche">
          {ultima ? (
            <>
              Fatta {regs.length === 1 ? '1 volta' : `${regs.length} volte`} · ultima {fa(giorniTra(ultima, oggi))}
              {p.frequenza === 'giorno' && ` · ${serie === 1 ? '1 giorno' : `${serie} giorni`} di fila`}
            </>
          ) : (
            'Non ancora registrata.'
          )}
        </p>
        {regs.length > 0 && (
          <>
            <ul className="elenco-registro" aria-label="Ultime registrazioni">
              {regs.slice(0, 10).map((r) => (
                <li key={r.id}>{formattaRegistrazione(r.data)}</li>
              ))}
            </ul>
            {regs.length > 10 && <p className="statistiche">…e altre {regs.length - 10}</p>}
          </>
        )}
      </section>
    </div>
  );
}
