// Piccole preferenze salvate nel browser (localStorage), sempre protette da try/catch.
import { CHIAVE_PROTOTIPO } from './costanti';

const CHIAVE_ULTIMO_BACKUP = 'quaderno-ultimo-backup';
const CHIAVE_PROTOTIPO_GESTITO = 'quaderno-prototipo-gestito';

function leggi(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function scrivi(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* spazio pieno o archiviazione bloccata: pazienza */
  }
}

export const ultimoBackup = () => leggi(CHIAVE_ULTIMO_BACKUP);
export const segnaBackup = (iso: string) => scrivi(CHIAVE_ULTIMO_BACKUP, iso);

/** Dati del prototipo, se presenti in questo browser. */
export function datiPrototipo(): unknown | null {
  const raw = leggi(CHIAVE_PROTOTIPO);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export const prototipoGestito = () => leggi(CHIAVE_PROTOTIPO_GESTITO) !== null;
export const segnaPrototipoGestito = (come: 'importato' | 'rifiutato') => scrivi(CHIAVE_PROTOTIPO_GESTITO, come);

/** Fa scaricare un file di testo. */
export function scaricaFile(nome: string, contenuto: string, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([contenuto], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
