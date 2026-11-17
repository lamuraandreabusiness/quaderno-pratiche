import { useEffect, useState } from 'react';
import { useAvviso } from '../app/avvisi';
import { impostaPromemoria, leggiPromemoria, mostraNotifica, promemoriaSupportato } from '../app/promemoria';
import type { StatoPromemoria } from '../lib/promemoria';

/** Impostazioni del promemoria giornaliero. Facoltativo: senza notifiche l'app funziona lo stesso. */
export function SezionePromemoria() {
  const avviso = useAvviso();
  const supportato = promemoriaSupportato();
  const [stato, setStato] = useState<StatoPromemoria | null>(null);
  const [permesso, setPermesso] = useState<NotificationPermission | null>(supportato ? Notification.permission : null);

  useEffect(() => {
    if (supportato) void leggiPromemoria().then(setStato);
  }, [supportato]);

  async function attiva(attivo: boolean) {
    if (attivo && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      setPermesso(p);
      if (p !== 'granted') {
        avviso('Senza il permesso per le notifiche il promemoria non può arrivare');
        return;
      }
    }
    setStato(await impostaPromemoria({ attivo }));
    avviso(attivo ? 'Promemoria attivato ✓' : 'Promemoria spento');
  }

  async function cambiaOra(ora: string) {
    if (!/^\d{2}:\d{2}$/.test(ora)) return;
    // Cambiando l'ora, il promemoria di oggi può ripartire
    setStato(await impostaPromemoria({ ora, inviatoIl: undefined }));
  }

  return (
    <section aria-labelledby="t-promemoria">
      <h2 id="t-promemoria">Promemoria</h2>
      {!supportato ? (
        <p className="tenue">
          Su questo browser l'app non può mandare notifiche. Su iPhone e iPad funzionano se installi l'app sulla
          schermata Home (iOS 16.4 o successivo). Il quaderno funziona benissimo anche così.
        </p>
      ) : !stato ? (
        <p className="tenue">Controllo…</p>
      ) : (
        <div className="modulo">
          <label className="spunta">
            <input type="checkbox" checked={stato.attivo} onChange={(e) => attiva(e.target.checked)} />
            <span>Ricordami ogni giorno la pratica del giorno</span>
          </label>
          {stato.attivo && (
            <>
              <div className="campo riga" style={{ gap: 10 }}>
                <label htmlFor="ora-promemoria" className="nome-campo">
                  Alle
                </label>
                <input
                  id="ora-promemoria"
                  type="time"
                  value={stato.ora}
                  onChange={(e) => cambiaOra(e.target.value)}
                  style={{ maxWidth: 140 }}
                />
                <button
                  type="button"
                  className="btn leggero"
                  onClick={() => void mostraNotifica('Così ti arriverà il promemoria della pratica del giorno.')}
                >
                  Prova ora
                </button>
              </div>
              <p className="aiuto" style={{ marginTop: 8 }}>
                Arriva di sicuro se l'app è aperta, anche in sottofondo. Con l'app chiusa dipende dal browser: su Android,
                con l'app installata, di solito arriva; altrove può non arrivare. Se quel giorno hai già aperto il quaderno
                dopo l'ora scelta, o se hai già fatto tutto, non ti disturba.
              </p>
            </>
          )}
          {permesso === 'denied' && (
            <p className="errore">Le notifiche sono bloccate per questo sito: puoi riattivarle dalle impostazioni del browser.</p>
          )}
        </div>
      )}
    </section>
  );
}
