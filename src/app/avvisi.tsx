// Finestre di conferma e avvisi brevi, tutti dentro l'app (niente alert/confirm).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface OpzioniConferma {
  titolo: string;
  testo: string;
  conferma?: string;
  annulla?: string;
  pericolo?: boolean;
}

type Conferma = (o: OpzioniConferma) => Promise<boolean>;
type Avviso = (testo: string) => void;

const ConfermaCtx = createContext<Conferma>(async () => false);
const AvvisoCtx = createContext<Avviso>(() => {});

export const useConferma = () => useContext(ConfermaCtx);
export const useAvviso = () => useContext(AvvisoCtx);

export function AvvisiProvider({ children }: { children: ReactNode }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const risolvi = useRef<((v: boolean) => void) | null>(null);
  const [opzioni, setOpzioni] = useState<OpzioniConferma | null>(null);
  const [avviso, setAvviso] = useState<{ testo: string; n: number } | null>(null);

  const conferma = useCallback<Conferma>((o) => {
    risolvi.current?.(false);
    setOpzioni(o);
    return new Promise<boolean>((r) => {
      risolvi.current = r;
    });
  }, []);

  useEffect(() => {
    const d = dialogo.current;
    if (opzioni && d && !d.open) d.showModal();
  }, [opzioni]);

  const chiudi = (v: boolean) => {
    risolvi.current?.(v);
    risolvi.current = null;
    dialogo.current?.close();
  };

  const mostraAvviso = useCallback<Avviso>((testo) => setAvviso((a) => ({ testo, n: (a?.n ?? 0) + 1 })), []);

  useEffect(() => {
    if (!avviso) return;
    const t = window.setTimeout(() => setAvviso(null), 2600);
    return () => window.clearTimeout(t);
  }, [avviso]);

  return (
    <ConfermaCtx.Provider value={conferma}>
      <AvvisoCtx.Provider value={mostraAvviso}>
        {children}
        <dialog
          ref={dialogo}
          className="dialogo"
          aria-labelledby="dialogo-titolo"
          aria-describedby="dialogo-testo"
          onClose={() => {
            risolvi.current?.(false);
            risolvi.current = null;
            setOpzioni(null);
          }}
          onClick={(e) => {
            if (e.target === dialogo.current) chiudi(false); // clic fuori dal foglio
          }}
        >
          {opzioni && (
            <div className="dialogo-foglio">
              <h2 id="dialogo-titolo">{opzioni.titolo}</h2>
              <p id="dialogo-testo">{opzioni.testo}</p>
              <div className="riga fine">
                <button type="button" className="btn leggero" autoFocus onClick={() => chiudi(false)}>
                  {opzioni.annulla ?? 'Annulla'}
                </button>
                <button
                  type="button"
                  className={`btn ${opzioni.pericolo ? 'pericolo' : 'pieno'}`}
                  onClick={() => chiudi(true)}
                >
                  {opzioni.conferma ?? 'Conferma'}
                </button>
              </div>
            </div>
          )}
        </dialog>
        <div className={`avviso ${avviso ? 'visibile' : ''}`} role="status" aria-live="polite">
          {avviso?.testo}
        </div>
      </AvvisoCtx.Provider>
    </ConfermaCtx.Provider>
  );
}
