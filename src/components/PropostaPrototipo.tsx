import { useState } from 'react';
import { useAvviso } from '../app/avvisi';
import { aggiungiAlQuaderno } from '../db/repo';
import { conta, convertiPrototipo } from '../lib/backup';
import { datiPrototipo, prototipoGestito, segnaPrototipoGestito } from '../lib/locale';
import { descriviConteggi } from '../views/Impostazioni';

/** Al primo avvio: se in questo browser ci sono i dati del prototipo, propone di importarli. */
export function PropostaPrototipo() {
  const avviso = useAvviso();
  const [proto, setProto] = useState(() => {
    if (prototipoGestito()) return null;
    const g = datiPrototipo();
    if (!g) return null;
    const d = convertiPrototipo(g);
    return d.categorie.length ? d : null;
  });
  if (!proto) return null;

  return (
    <aside className="proposta" aria-labelledby="proposta-titolo">
      <h2 id="proposta-titolo">Ho trovato il tuo vecchio quaderno</h2>
      <p>
        In questo browser ci sono le pratiche del prototipo: {descriviConteggi(conta(proto))}. Vuoi portarle qui?
      </p>
      <div className="riga" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="btn pieno"
          onClick={async () => {
            await aggiungiAlQuaderno(proto);
            segnaPrototipoGestito('importato');
            setProto(null);
            avviso('Pratiche importate ✓');
          }}
        >
          Sì, importale
        </button>
        <button
          type="button"
          className="btn leggero"
          onClick={() => {
            segnaPrototipoGestito('rifiutato');
            setProto(null);
            avviso('Va bene. Se cambi idea, lo trovi in Impostazioni');
          }}
        >
          No, grazie
        </button>
      </div>
    </aside>
  );
}
