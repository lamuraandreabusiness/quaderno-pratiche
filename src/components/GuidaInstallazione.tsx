import { useState } from 'react';
import { useAvviso } from '../app/avvisi';
import { eSafariIos, useInstallazione, type Piattaforma } from '../app/installazione';

/** Istruzioni passo passo per installare l'app, per ogni tipo di dispositivo. */
export function Istruzioni({ piattaforma }: { piattaforma: Piattaforma }) {
  if (piattaforma === 'iphone') {
    return (
      <ol className="passi">
        {!eSafariIos() && <li>Apri questa pagina con <b>Safari</b>.</li>}
        <li>
          Tocca il pulsante <b>Condividi</b> <span aria-hidden="true">(il quadrato con la freccia in su ⬆︎)</span>.
        </li>
        <li>
          Scorri e scegli <b>Aggiungi alla schermata Home</b>, poi <b>Aggiungi</b>.
        </li>
        <li>Da ora apri il quaderno dall'icona sulla schermata Home.</li>
      </ol>
    );
  }
  if (piattaforma === 'android') {
    return (
      <ol className="passi">
        <li>
          In Chrome tocca il menu <b>⋮</b> in alto a destra.
        </li>
        <li>
          Scegli <b>Installa app</b> (o <b>Aggiungi a schermata Home</b>).
        </li>
        <li>Da ora apri il quaderno dall'icona, come le altre app. Comparirà anche nel menu «Condividi».</li>
      </ol>
    );
  }
  return (
    <ol className="passi">
      <li>
        In Chrome o Edge cerca l'icona <b>Installa</b> nella barra dell'indirizzo (uno schermo con una freccia), oppure
        apri il menu e scegli <b>Installa Quaderno delle pratiche</b>.
      </li>
      <li>Su Mac con Safari: menu <b>File → Aggiungi al Dock</b>.</li>
    </ol>
  );
}

/** Pulsante "Installa" se il browser lo permette, altrimenti le istruzioni. */
export function GuidaInstallazione({ compatta = false }: { compatta?: boolean }) {
  const avviso = useAvviso();
  const { installata, puoInstallare, piattaforma, installa } = useInstallazione();
  const [mostra, setMostra] = useState(!compatta);

  if (installata) {
    return <p>✓ Stai usando il quaderno come app installata.</p>;
  }
  return (
    <>
      <p>
        Installato sulla schermata Home il quaderno si apre come un'app, funziona senza rete e i tuoi dati sono più al
        sicuro{piattaforma === 'iphone' ? ': su iPhone, se resta una pagina di Safari, iOS può cancellarli dopo qualche settimana senza aperture' : ''}.
      </p>
      <div className="riga" style={{ marginTop: 8 }}>
        {puoInstallare && (
          <button
            type="button"
            className="btn pieno"
            onClick={async () => {
              if (await installa()) avviso('Quaderno installato ✓');
            }}
          >
            Installa l'app
          </button>
        )}
        {(!puoInstallare || compatta) && (
          <button type="button" className="btn leggero" aria-expanded={mostra} onClick={() => setMostra(!mostra)}>
            {mostra ? 'Nascondi le istruzioni' : 'Come si installa?'}
          </button>
        )}
      </div>
      {mostra && <Istruzioni piattaforma={piattaforma} />}
    </>
  );
}
