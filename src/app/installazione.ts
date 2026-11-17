// Installazione come app (PWA): pulsante dove il browser lo permette, istruzioni dove no (iPhone).
import { useEffect, useState } from 'react';

interface EventoInstallazione extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// L'evento arriva presto, anche prima che React disegni la pagina: lo teniamo da parte qui
let proposta: EventoInstallazione | null = null;
const ascoltatori = new Set<() => void>();
const avvisa = () => ascoltatori.forEach((f) => f());

/** Da chiamare all'avvio, prima del primo render. */
export function preparaInstallazione() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // niente fascetta automatica del browser: il pulsante lo mostriamo noi
    proposta = e as EventoInstallazione;
    avvisa();
  });
  window.addEventListener('appinstalled', () => {
    proposta = null;
    avvisa();
  });
}

export type Piattaforma = 'iphone' | 'android' | 'computer';

export function piattaforma(): Piattaforma {
  const ua = navigator.userAgent;
  // iPadOS si presenta come Mac: lo riconosciamo dal touch
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iphone';
  if (/Android/.test(ua)) return 'android';
  return 'computer';
}

/** L'app è già aperta come app installata? */
export function eInstallata(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Su iPhone conta il browser: solo da Safari si aggiunge alla schermata Home (da iOS 16.4 anche da altri). */
export function eSafariIos(): boolean {
  const ua = navigator.userAgent;
  return piattaforma() === 'iphone' && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export function useInstallazione() {
  const [, aggiorna] = useState(0);
  useEffect(() => {
    const f = () => aggiorna((n) => n + 1);
    ascoltatori.add(f);
    return () => {
      ascoltatori.delete(f);
    };
  }, []);
  return {
    installata: eInstallata(),
    puoInstallare: proposta !== null,
    piattaforma: piattaforma(),
    /** Mostra la finestra del browser. Restituisce true se l'utente ha accettato. */
    installa: async () => {
      if (!proposta) return false;
      const p = proposta;
      await p.prompt();
      const { outcome } = await p.userChoice;
      proposta = null;
      avvisa();
      return outcome === 'accepted';
    },
  };
}
