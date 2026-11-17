// Tiene il testo sulle righe del quaderno.
// Ogni blocco della pagina (titolo, post-it, cartoncino, riga di bottoni…) riceve un margine sotto
// che porta il suo bordo inferiore sulla riga successiva: così quello che viene dopo riparte su una riga.
// Si lavora con le posizioni assolute (non con le altezze), così i mezzi pixel non si sommano.

const RIGA = 32;
const TOLLERANZA = 4;

/** Blocchi da allineare, in ordine di documento. */
const SELETTORE = [
  '.pagina > *',
  '.pagina > .colorata > *',
  '.registro > *',
  '.elenco-da-provare > li',
  '.elenco-raccolta > li',
  '.elenco-pratiche > li',
  '.modulo > .campo',
  '.modulo > fieldset',
].join(', ');

/** Le schede degli elenchi tengono almeno un po' di spazio tra loro. */
const CON_SPAZIO = '.elenco-da-provare > li, .elenco-raccolta > li';

/** Posizione verticale dentro la pagina, ignorando le rotazioni (il post-it è storto apposta). */
function cimaDentro(el: HTMLElement, pagina: HTMLElement): number {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== pagina) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return n === pagina ? y : NaN;
}

function allineaTutto(pagina: HTMLElement) {
  const inizio = parseFloat(getComputedStyle(pagina).paddingTop) || 0;
  for (const el of pagina.querySelectorAll<HTMLElement>(SELETTORE)) {
    el.style.marginBottom = '';
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.position === 'absolute' || cs.position === 'fixed') continue;
    const minimo = el.matches(CON_SPAZIO) ? 8 : 0;
    const proprio = parseFloat(cs.marginBottom) || 0;
    const sotto = Math.max(proprio, minimo);
    const cima = cimaDentro(el, pagina);
    if (Number.isNaN(cima)) continue;
    const fondo = Math.round(cima + el.offsetHeight + sotto - inizio);
    const oltre = ((fondo % RIGA) + RIGA) % RIGA;
    // Se sfora di pochi pixel (una riga di bottoni alta 33 invece di 32) si recupera, invece di sprecare una riga intera
    const correzione = oltre === 0 ? 0 : oltre <= TOLLERANZA ? -oltre : RIGA - oltre;
    if (correzione || sotto !== proprio) el.style.marginBottom = `${sotto + correzione}px`;
  }
}

/**
 * Avvia l'allineamento su una pagina. Restituisce la funzione per fermarlo.
 * Ricalcola quando un blocco cambia altezza (ResizeObserver: testo scritto, font che arrivano)
 * o quando cambia il contenuto (MutationObserver: pagina nuova).
 */
export function avviaAllineamento(pagina: HTMLElement): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {};
  let attesa: number | undefined;
  const programma = () => {
    window.clearTimeout(attesa);
    attesa = window.setTimeout(esegui, 0);
  };
  const osservati = new Set<HTMLElement>();
  const ro = new ResizeObserver(programma);

  function esegui() {
    const attuali = new Set(pagina.querySelectorAll<HTMLElement>(SELETTORE));
    for (const el of osservati) if (!attuali.has(el)) {
      ro.unobserve(el);
      osservati.delete(el);
    }
    for (const el of attuali) if (!osservati.has(el)) {
      osservati.add(el);
      ro.observe(el);
    }
    // I margini cambiati spostano i blocchi ma non ne cambiano l'altezza: il ResizeObserver non riparte
    allineaTutto(pagina);
  }

  const mo = new MutationObserver(programma);
  mo.observe(pagina, { childList: true, subtree: true, characterData: true });
  window.addEventListener('resize', programma);
  esegui();
  return () => {
    mo.disconnect();
    ro.disconnect();
    window.removeEventListener('resize', programma);
    window.clearTimeout(attesa);
  };
}
