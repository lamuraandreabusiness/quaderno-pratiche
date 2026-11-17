// Condivisione verso l'app (Web Share Target): da ?title=&text=&url= a una bozza "Da provare".
import type { BozzaDaProvare } from '../components/CampiDaProvare';

const RE_URL = /https?:\/\/[^\s<>"']+/i;

/** Ci sono parametri di condivisione nell'indirizzo? */
export function eCondivisione(search: string): boolean {
  const p = new URLSearchParams(search);
  return ['title', 'text', 'url'].some((k) => (p.get(k) ?? '').trim() !== '');
}

/**
 * Le app condividono in modi diversi: alcune mettono il link in "url", altre (spesso su Android) dentro "text".
 * Titolo: "title", altrimenti il testo senza link, altrimenti il nome del sito.
 */
export function bozzaDaCondivisione(search: string): BozzaDaProvare {
  const p = new URLSearchParams(search);
  const title = (p.get('title') ?? '').trim();
  let text = (p.get('text') ?? '').trim();
  let url = (p.get('url') ?? '').trim();

  if (!url) {
    const trovato = text.match(RE_URL)?.[0];
    if (trovato) url = trovato.replace(/[).,;:!?]+$/, '');
  }
  if (url) text = text.replace(url, '').trim();
  text = text.replace(/^[-–—:|.,;\s]+|[-–—:|,;\s]+$/g, '').replace(/\s+\.$/, '');

  let titolo = togliNomeSito(title, url) || text.split('\n')[0].trim();
  if (!titolo && url) {
    try {
      titolo = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      titolo = url;
    }
  }
  // Il testo diventa nota solo se aggiunge qualcosa al titolo
  const nota = text && text !== titolo ? text : '';
  return { titolo: titolo.slice(0, 200), fonte: url, nota, categoriaSuggeritaId: '' };
}

/** "Respiro coerente | YouTube" con un link youtube.com → "Respiro coerente". */
function togliNomeSito(titolo: string, url: string): string {
  if (!titolo || !url) return titolo;
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return titolo;
  }
  const m = /^(.*\S)\s+[|\-–—·]\s+([^|\-–—·]+)$/.exec(titolo);
  if (!m) return titolo;
  const sito = m[2].toLowerCase().replace(/[^a-z0-9]/g, '');
  return sito.length >= 3 && host.replace(/[^a-z0-9]/g, '').includes(sito) ? m[1] : titolo;
}
