// Promemoria: stato condiviso con il service worker (Cache API), notifiche e timer mentre l'app è aperta.
import { useEffect } from 'react';
import type { Quaderno } from './dati';
import { chiaveGiorno } from '../lib/date';
import { devoAvvisare, msAlProssimo, statoIniziale, testoPromemoria, type StatoPromemoria } from '../lib/promemoria';
import { praticaDelGiorno } from '../lib/suggerimento';

const CACHE = 'quaderno-promemoria';
const CHIAVE = '/__promemoria.json';
const EVENTO = 'quaderno-promemoria-cambiato';

/** Il browser permette le notifiche dell'app? */
export function promemoriaSupportato(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'caches' in window;
}

export async function leggiPromemoria(): Promise<StatoPromemoria> {
  try {
    const r = await (await caches.open(CACHE)).match(CHIAVE);
    return r ? { ...statoIniziale(), ...(await r.json()) } : statoIniziale();
  } catch {
    return statoIniziale();
  }
}

async function scrivi(s: StatoPromemoria) {
  try {
    const cache = await caches.open(CACHE);
    await cache.put(CHIAVE, new Response(JSON.stringify(s), { headers: { 'Content-Type': 'application/json' } }));
  } catch {
    /* archiviazione non disponibile */
  }
}

/** Cambia le impostazioni del promemoria (e riprogramma il timer). */
export async function impostaPromemoria(dati: Partial<StatoPromemoria>) {
  const s = { ...(await leggiPromemoria()), ...dati };
  await scrivi(s);
  window.dispatchEvent(new Event(EVENTO));
  if (s.attivo) await registraControlloPeriodico();
  return s;
}

/** Mostra una notifica (dal service worker se c'è, così il tocco apre l'app). */
export async function mostraNotifica(corpo: string, url = '/') {
  const opzioni: NotificationOptions = {
    body: corpo,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'promemoria',
    lang: 'it',
    data: { url },
  };
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) return reg.showNotification('Quaderno delle pratiche', opzioni);
  const n = new Notification('Quaderno delle pratiche', opzioni);
  n.onclick = () => {
    window.focus();
    window.location.hash = url.replace(/^\/?/, '').replace(/^#?/, '#');
  };
}

/** Dove il browser lo permette (Chrome con l'app installata), controlla anche con l'app chiusa. */
async function registraControlloPeriodico() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const ps = (reg as ServiceWorkerRegistration & { periodicSync?: { register(tag: string, o: { minInterval: number }): Promise<void> } })
      ?.periodicSync;
    if (!reg || !ps) return;
    const perm = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
    if (perm.state === 'granted') await ps.register('promemoria', { minInterval: 60 * 60 * 1000 });
  } catch {
    /* non supportato: resta il timer mentre l'app è aperta */
  }
}

/**
 * Tiene aggiornata la pratica del giorno per il promemoria e, mentre l'app è aperta (anche in sottofondo),
 * manda la notifica all'ora scelta.
 */
export function usePromemoria(dati: Quaderno | undefined, oggi: Date) {
  const giorno = chiaveGiorno(oggi);
  const s = dati ? praticaDelGiorno(dati.pratiche, dati.registrazioni, oggi) : null;
  const titolo = s ? (s.tipo === 'pratica' ? s.scelta.pratica.titolo : null) : undefined;
  const praticaId = s && s.tipo === 'pratica' ? s.scelta.pratica.id : null;

  useEffect(() => {
    if (!promemoriaSupportato() || titolo === undefined) return;
    let timer: number | undefined;
    let fermo = false;

    async function programma() {
      window.clearTimeout(timer);
      const st = await leggiPromemoria();
      if (fermo || !st.attivo) return;
      const ms = msAlProssimo(st, new Date());
      if (ms === null) return;
      // setTimeout non regge attese lunghissime: al massimo un'ora, poi si ricontrolla
      timer = window.setTimeout(scatta, Math.min(ms + 500, 60 * 60 * 1000));
    }

    async function scatta() {
      const st = await leggiPromemoria();
      const adesso = new Date();
      if (devoAvvisare(st, adesso) && Notification.permission === 'granted') {
        const t = testoPromemoria(st, adesso);
        await mostraNotifica(t.corpo, t.url);
        await scrivi({ ...st, inviatoIl: chiaveGiorno(adesso) });
      }
      void programma();
    }

    void (async () => {
      const st = await leggiPromemoria();
      const agg: StatoPromemoria = { ...st, giorno, titolo, praticaId };
      // Se apri l'app dopo l'ora del promemoria, sei già qui: oggi non serve più
      if (document.visibilityState === 'visible' && devoAvvisare(agg, new Date())) agg.inviatoIl = giorno;
      await scrivi(agg);
      void programma();
    })();

    window.addEventListener(EVENTO, programma);
    return () => {
      fermo = true;
      window.clearTimeout(timer);
      window.removeEventListener(EVENTO, programma);
    };
  }, [giorno, titolo, praticaId]);
}
