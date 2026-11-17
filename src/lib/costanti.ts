import type { Frequenza } from '../db/types';

export const FREQUENZE: { valore: Frequenza; etichetta: string }[] = [
  { valore: 'giorno', etichetta: 'Ogni giorno' },
  { valore: 'settimana', etichetta: 'Una volta a settimana' },
  { valore: 'bisogno', etichetta: 'Al bisogno' },
  { valore: 'anno', etichetta: "Una volta l'anno" },
  { valore: 'inizio-anno', etichetta: 'A inizio anno' },
];

export function etichettaFrequenza(f: Frequenza | string): string {
  return FREQUENZE.find((x) => x.valore === f)?.etichetta ?? '—';
}

export const COLORI: { nome: string; colore: string }[] = [
  { nome: 'Corallo', colore: '#e2674f' },
  { nome: 'Arancio', colore: '#e8933a' },
  { nome: 'Senape', colore: '#c99d1c' },
  { nome: 'Salvia', colore: '#5f9450' },
  { nome: 'Petrolio', colore: '#2a8a85' },
  { nome: 'Blu', colore: '#3d6fb6' },
  { nome: 'Viola', colore: '#7b5ea7' },
  { nome: 'Rosa', colore: '#cf5f8f' },
];

export const CATEGORIE_DI_ESEMPIO: { nome: string; colore: string }[] = [
  { nome: 'Respiro', colore: '#2a8a85' },
  { nome: 'Meditazione', colore: '#7b5ea7' },
  { nome: 'Scrittura', colore: '#e8933a' },
  { nome: 'Corpo e movimento', colore: '#5f9450' },
  { nome: 'Coaching', colore: '#3d6fb6' },
];

/** Chiave usata dal prototipo in localStorage. */
export const CHIAVE_PROTOTIPO = 'quaderno-pratiche-v1';

/** Variante più scura del colore, leggibile come testo su carta o sotto testo bianco. */
export function scurisci(hex: string, quanto = 0.7): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#2b2d42';
  const n = parseInt(m[1], 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => Math.round(x * quanto));
  return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Variabili CSS per il colore di una categoria: --c (pieno) e --c-scuro (testo). */
export function stileColore(colore: string): Record<string, string> {
  return { '--c': colore, '--c-scuro': scurisci(colore) };
}
