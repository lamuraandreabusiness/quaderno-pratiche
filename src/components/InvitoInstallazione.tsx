import { useState } from 'react';
import { eInstallata } from '../app/installazione';
import { GuidaInstallazione } from './GuidaInstallazione';

const CHIAVE = 'quaderno-invito-installazione-chiuso';
const chiuso = () => {
  try {
    return localStorage.getItem(CHIAVE) !== null;
  } catch {
    return false;
  }
};

/** Invito in home a installare l'app: si chiude per sempre con "Non ora" (resta in Impostazioni). */
export function InvitoInstallazione() {
  const [visibile, setVisibile] = useState(() => !eInstallata() && !chiuso());
  if (!visibile) return null;
  return (
    <aside className="proposta" aria-labelledby="invito-installa">
      <h2 id="invito-installa">Tieni il quaderno sul telefono</h2>
      <GuidaInstallazione compatta />
      <div className="riga riga-chiudi">
        <button
          type="button"
          className="btn leggero"
          onClick={() => {
            try {
              localStorage.setItem(CHIAVE, new Date().toISOString());
            } catch {
              /* pazienza */
            }
            setVisibile(false);
          }}
        >
          Non ora
        </button>
      </div>
    </aside>
  );
}
