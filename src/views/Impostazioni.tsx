import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Quaderno } from '../app/dati';
import { useAvviso, useConferma } from '../app/avvisi';
import { percorso } from '../app/rotte';
import { aggiungiAlQuaderno, chiediPersistenza, leggiTutto, sostituisciTutto, statoArchiviazione } from '../db/repo';
import { conta, convertiPrototipo, creaBackup, leggiBackup, nomeFileBackup, type DatiQuaderno } from '../lib/backup';
import { formattaRegistrazione } from '../lib/date';
import { SezionePromemoria } from '../components/SezionePromemoria';
import { GuidaInstallazione } from '../components/GuidaInstallazione';
import { datiPrototipo, scaricaFile, segnaBackup, segnaPrototipoGestito, ultimoBackup } from '../lib/locale';

type Anteprima = { nomeFile: string; dati: DatiQuaderno; esportatoIl?: string; scartati: number };

export function descriviConteggi(c: ReturnType<typeof conta>): string {
  const parti = [
    c.categorie === 1 ? '1 categoria' : `${c.categorie} categorie`,
    c.pratiche === 1 ? '1 pratica' : `${c.pratiche} pratiche`,
    c.registrazioni === 1 ? '1 registrazione' : `${c.registrazioni} registrazioni`,
  ];
  if (c.daProvare) parti.push(c.daProvare === 1 ? '1 da provare' : `${c.daProvare} da provare`);
  return parti.join(', ');
}

export function Impostazioni({ dati }: { dati: Quaderno }) {
  const avviso = useAvviso();
  const conferma = useConferma();
  const [ultimo, setUltimo] = useState(ultimoBackup);
  const [anteprima, setAnteprima] = useState<Anteprima | null>(null);
  const [erroreFile, setErroreFile] = useState('');
  const [archivio, setArchivio] = useState<{ protetto: boolean | null; usatoKB: number | null } | null>(null);
  const [proto] = useState(() => {
    const g = datiPrototipo();
    if (!g) return null;
    const d = convertiPrototipo(g);
    return d.categorie.length ? d : null;
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const titoloAnteprima = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    void statoArchiviazione().then(setArchivio);
  }, []);
  useEffect(() => {
    if (anteprima) titoloAnteprima.current?.focus();
  }, [anteprima]);

  const attuali = {
    categorie: dati.categorie.length,
    pratiche: dati.pratiche.length,
    registrazioni: [...dati.registrazioni.values()].reduce((n, l) => n + l.length, 0),
    daProvare: dati.daProvare.length,
  };
  const vuoto = !attuali.categorie && !attuali.daProvare;

  async function esporta() {
    const ora = new Date();
    const backup = creaBackup(await leggiTutto(), ora);
    scaricaFile(nomeFileBackup(ora), JSON.stringify(backup, null, 2));
    segnaBackup(ora.toISOString());
    setUltimo(ora.toISOString());
    avviso('Backup scaricato ✓');
  }

  async function sceltoFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ''; // così si può riscegliere lo stesso file
    setErroreFile('');
    setAnteprima(null);
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      setErroreFile('Il file è troppo grande per essere un backup del quaderno.');
      return;
    }
    const esito = leggiBackup(await f.text());
    if (!esito.ok) {
      setErroreFile(esito.errore);
      return;
    }
    setAnteprima({ nomeFile: f.name, dati: esito.dati, esportatoIl: esito.esportatoIl, scartati: esito.scartati });
  }

  async function sostituisci() {
    if (!anteprima) return;
    if (!vuoto) {
      const ok = await conferma({
        titolo: 'Sostituire il quaderno?',
        testo: `Quello che c'è ora (${descriviConteggi(attuali)}) verrà cancellato e sostituito dal backup. Se non sei sicuro, esporta prima un backup del quaderno attuale.`,
        conferma: 'Sostituisci',
        pericolo: true,
      });
      if (!ok) return;
    }
    await sostituisciTutto(anteprima.dati);
    setAnteprima(null);
    avviso('Quaderno ripristinato dal backup ✓');
  }

  async function importaPrototipo() {
    if (!proto) return;
    await aggiungiAlQuaderno(proto);
    segnaPrototipoGestito('importato');
    avviso('Pratiche del vecchio quaderno importate ✓');
  }

  async function proteggi() {
    const ok = await chiediPersistenza();
    setArchivio(await statoArchiviazione());
    avviso(ok ? 'Dati protetti ✓' : 'Il browser non ha concesso la protezione: esporta un backup ogni tanto');
  }

  return (
    <>
      <p className="briciole">
        <a href={percorso.home()}>← Indice</a>
      </p>
      <h1 tabIndex={-1}>Impostazioni</h1>

      <section aria-labelledby="t-installa">
        <h2 id="t-installa">Installa l'app</h2>
        <GuidaInstallazione />
      </section>

      <section aria-labelledby="t-backup">
        <h2 id="t-backup">Backup</h2>
        <p>
          I tuoi dati restano su questo dispositivo. Esporta un backup ogni tanto e conservalo dove vuoi: ti serve se
          cambi telefono o se il browser cancella i dati.
        </p>
        <p className="tenue">
          {ultimo ? `Ultimo backup: ${formattaRegistrazione(ultimo)}.` : 'Non hai ancora fatto un backup da questo dispositivo.'}
        </p>
        <div className="riga" style={{ marginTop: 10 }}>
          <button type="button" className="btn pieno" onClick={esporta}>
            Esporta il quaderno
          </button>
        </div>
      </section>

      <section aria-labelledby="t-importa">
        <h2 id="t-importa">Importa da un backup</h2>
        <p className="tenue">Scegli un file esportato da questa app: prima di cambiare qualcosa ti mostro cosa contiene.</p>
        <div className="riga" style={{ marginTop: 10 }}>
          <button type="button" className="btn" onClick={() => fileInput.current?.click()} aria-describedby={erroreFile ? 'errore-file' : undefined}>
            Scegli il file…
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" onChange={sceltoFile} hidden />
        </div>
        {erroreFile && (
          <p className="errore" id="errore-file" role="alert">
            {erroreFile}
          </p>
        )}
        {anteprima && (
          <div className="anteprima-backup">
            <h3 ref={titoloAnteprima} tabIndex={-1}>
              Cosa c'è nel file
            </h3>
            <p className="tenue nome-file">{anteprima.nomeFile}</p>
            {anteprima.esportatoIl && <p>Backup del {formattaRegistrazione(anteprima.esportatoIl)}</p>}
            <p>
              <b>{descriviConteggi(conta(anteprima.dati))}</b>
            </p>
            {anteprima.scartati > 0 && (
              <p className="errore">
                {anteprima.scartati === 1 ? '1 riga rovinata verrà ignorata.' : `${anteprima.scartati} righe rovinate verranno ignorate.`}
              </p>
            )}
            <p style={{ marginTop: 8 }}>
              {vuoto
                ? 'Il quaderno ora è vuoto: verrà riempito con questi dati.'
                : `Attenzione: sostituisce tutto il quaderno attuale (${descriviConteggi(attuali)}).`}
            </p>
            <div className="riga" style={{ marginTop: 10 }}>
              <button type="button" className={`btn ${vuoto ? 'pieno' : 'pericolo'}`} onClick={sostituisci}>
                {vuoto ? 'Importa' : 'Sostituisci il quaderno'}
              </button>
              <button type="button" className="btn leggero" onClick={() => setAnteprima(null)}>
                Annulla
              </button>
            </div>
          </div>
        )}
      </section>

      {proto && (
        <section aria-labelledby="t-proto">
          <h2 id="t-proto">Dal vecchio quaderno</h2>
          <p className="tenue">
            In questo browser ci sono le pratiche del prototipo ({descriviConteggi(conta(proto))}). Puoi aggiungerle al
            quaderno: quello che c'è già non viene toccato.
          </p>
          <div className="riga" style={{ marginTop: 10 }}>
            <button type="button" className="btn" onClick={importaPrototipo}>
              Importa dal vecchio quaderno
            </button>
          </div>
        </section>
      )}

      <SezionePromemoria />

      <section aria-labelledby="t-archivio">
        <h2 id="t-archivio">Spazio sul dispositivo</h2>
        {!archivio ? (
          <p className="tenue">Controllo…</p>
        ) : (
          <>
            <p>
              {archivio.protetto === true
                ? '✓ Il browser protegge i dati del quaderno: non li cancella per fare spazio.'
                : archivio.protetto === false
                  ? 'Il browser potrebbe cancellare i dati se resta senza spazio. Installare l’app sulla schermata Home aiuta; il backup resta la sicurezza migliore.'
                  : 'Questo browser non dice se protegge i dati: tieni un backup.'}
            </p>
            {archivio.usatoKB !== null && (
              <p className="tenue">Spazio usato: {archivio.usatoKB < 1024 ? `${archivio.usatoKB} KB` : `${(archivio.usatoKB / 1024).toFixed(1)} MB`}</p>
            )}
            {archivio.protetto === false && (
              <div className="riga" style={{ marginTop: 10 }}>
                <button type="button" className="btn" onClick={proteggi}>
                  Chiedi di proteggere i dati
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <p className="sopra">
        <a href={percorso.note()}>Privacy e note</a>
      </p>
    </>
  );
}
