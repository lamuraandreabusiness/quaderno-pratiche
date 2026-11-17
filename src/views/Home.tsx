import { useEffect, useRef, type CSSProperties } from 'react';
import type { Quaderno } from '../app/dati';
import { useAvviso } from '../app/avvisi';
import { percorso } from '../app/rotte';
import { creaCategorieDiEsempio, registra } from '../db/repo';
import { etichettaFrequenza, stileColore } from '../lib/costanti';
import { formattaGiorno } from '../lib/date';
import { fattaOggi } from '../lib/registro';
import { praticaDelGiorno } from '../lib/suggerimento';
import { RACCOLTA } from '../data/raccolta';
import { PropostaPrototipo } from '../components/PropostaPrototipo';
import { InvitoInstallazione } from '../components/InvitoInstallazione';

interface Props {
  dati: Quaderno;
  oggi: Date;
  altre: number;
  unAltra: () => void;
}

const accorcia = (s: string, n = 140) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s);

export function Home({ dati, oggi, altre, unAltra }: Props) {
  const avviso = useAvviso();
  // Dopo "✓ Fatta" il post-it cambia: il focus va sul suo titolo, così chi usa la tastiera non si perde
  const fuocoPostIt = useRef(false);
  useEffect(() => {
    if (!fuocoPostIt.current) return;
    const el = document.getElementById('postit-titolo');
    if (el) {
      el.focus();
      fuocoPostIt.current = false;
    }
  });
  const { categorie, pratiche, registrazioni } = dati;
  const quotidiane = pratiche.filter((p) => p.frequenza === 'giorno');
  const quotidianeFatte = quotidiane.filter((p) => fattaOggi(registrazioni.get(p.id) ?? [], oggi)).length;
  const praticheIn = (id: string) => pratiche.filter((p) => p.categoriaId === id).length;

  return (
    <>
      <h1 tabIndex={-1}>Quaderno delle pratiche</h1>
      <p className="data">{formattaGiorno(oggi)}</p>

      <PropostaPrototipo />

      {pratiche.length > 0 && postIt()}

      {quotidiane.length > 0 && (
        <p className="oggi-conto">
          Pratiche quotidiane: {quotidianeFatte} su {quotidiane.length} fatte oggi
        </p>
      )}

      <h2>Indice</h2>
      {categorie.length === 0 ? (
        <div className="benvenuto">
          <p>Benvenuto nel tuo quaderno delle pratiche!</p>
          <p className="tenue">
            Qui raccogli le pratiche che ti fanno bene, sai quando farle e segni ogni volta che le fai. Comincia dalle
            categorie: crea le tue oppure parti da alcune già pronte.
          </p>
          <div className="riga sopra">
            <button
              type="button"
              className="btn pieno"
              onClick={async () => {
                await creaCategorieDiEsempio();
                avviso('Categorie create: rinominale o cambiane il colore quando vuoi');
              }}
            >
              Usa le categorie di esempio
            </button>
            <a className="btn" href={percorso.nuovaCategoria()}>
              + Nuova categoria
            </a>
          </div>
          <p className="sopra">
            Cerchi idee? <a href={percorso.raccolta()}>Sfoglia la Raccolta</a>: {RACCOLTA.length} pratiche già pronte da
            copiare nel quaderno.
          </p>
        </div>
      ) : (
        <>
          <ol className="indice">
            {categorie.map((c, i) => {
              const n = praticheIn(c.id);
              return (
                <li key={c.id}>
                  <a className="voce-indice" href={percorso.categoria(c.id)} style={stileColore(c.colore) as CSSProperties}>
                    <span className="num" aria-hidden="true">{i + 1}.</span>
                    <span className="pallino" aria-hidden="true" />
                    <span className="nome">{c.nome}</span>
                    <span className="guida" aria-hidden="true" />
                    <span className="conto">{n === 1 ? '1 pratica' : `${n} pratiche`}</span>
                  </a>
                </li>
              );
            })}
          </ol>
          {pratiche.length === 0 && (
            <p className="sopra">
              Le categorie sono pronte ma ancora vuote. Riempile con le pratiche già scritte della Raccolta, oppure
              scrivine una tua.
            </p>
          )}
          <div className="riga sopra">
            {pratiche.length === 0 && (
              <a className="btn pieno" href={percorso.raccolta()}>
                Sfoglia la Raccolta
              </a>
            )}
            <a className={`btn ${pratiche.length === 0 ? '' : 'pieno'}`} href={percorso.nuovaPratica()}>
              + Nuova pratica
            </a>
            <a className="btn" href={percorso.nuovaCategoria()}>
              + Nuova categoria
            </a>
            {pratiche.length > 0 && (
              <a className="btn leggero" href={percorso.raccolta()}>
                Sfoglia la Raccolta →
              </a>
            )}
          </div>
        </>
      )}

      {categorie.length > 0 && <InvitoInstallazione />}

      <a className="tasca" href={percorso.contenitore()}>
        <span className="tasca-titolo">Contenitore delle pratiche</span>
        <span className="tasca-conto">
          {dati.daProvare.length === 0
            ? 'Niente da provare'
            : dati.daProvare.length === 1
              ? '1 pratica da provare'
              : `${dati.daProvare.length} pratiche da provare`}
          {` · ${RACCOLTA.length} pratiche pronte nella Raccolta`}
        </span>
        <span className="tasca-freccia" aria-hidden="true">→</span>
      </a>

      <p className="sopra fine-pagina">
        <a className="btn leggero" href={percorso.impostazioni()}>
          ⚙ Impostazioni e backup
        </a>
      </p>
    </>
  );

  function postIt() {
    const s = praticaDelGiorno(pratiche, registrazioni, oggi, altre);
    if (s.tipo !== 'pratica') {
      return (
        <aside className="postit fatto" aria-labelledby="postit-titolo">
          <div className="intestazione">Pratica del giorno</div>
          <p className="titolo" id="postit-titolo" tabIndex={-1}>
            Tutto fatto per oggi ✓
          </p>
          <p className="motivo">Le pratiche in programma oggi sono già registrate. Se ne senti il bisogno, sfoglia l'indice.</p>
        </aside>
      );
    }
    const p = s.scelta.pratica;
    const c = categorie.find((x) => x.id === p.categoriaId);
    return (
      <aside className="postit" aria-labelledby="postit-titolo">
        <div className="intestazione">✎ Pratica del giorno</div>
        <p className="titolo" id="postit-titolo" tabIndex={-1}>
          {p.titolo}
        </p>
        <div className="riga" style={{ marginTop: 0, gap: 6 }}>
          {c && (
            <span className="etichetta-cat" style={stileColore(c.colore) as CSSProperties}>
              {c.nome}
            </span>
          )}
          <span className="tag">{etichettaFrequenza(p.frequenza)}</span>
        </div>
        <p className="motivo">{s.scelta.motivo}</p>
        {p.obiettivo && (
          <p className="motivo">
            <b>Obiettivo:</b> {accorcia(p.obiettivo)}
          </p>
        )}
        <div className="riga">
          <a className="btn pieno" href={percorso.pratica(p.id)}>
            Apri la pratica
          </a>
          <button
            type="button"
            className="btn"
            onClick={async () => {
              fuocoPostIt.current = true;
              await registra(p.id);
              avviso(`Registrata ✓ ${p.titolo}`);
            }}
          >
            ✓ Fatta
          </button>
          {s.numeroCandidate > 1 && (
            <button type="button" className="btn leggero" onClick={unAltra}>
              Un'altra →
            </button>
          )}
        </div>
      </aside>
    );
  }
}
