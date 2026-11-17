// Navigazione con l'hash (#/…): funziona su qualsiasi hosting statico.
import { useSyncExternalStore } from 'react';

export type Rotta =
  | { nome: 'home' }
  | { nome: 'categoria'; id: string }
  | { nome: 'modifica-categoria'; id: string }
  | { nome: 'nuova-categoria' }
  | { nome: 'pratica'; id: string }
  | { nome: 'modifica-pratica'; id: string }
  | { nome: 'nuova-pratica'; categoriaId?: string }
  | { nome: 'contenitore'; parte: 'da-provare' | 'raccolta'; q: string; tema: string }
  | { nome: 'voce-raccolta'; id: string }
  | { nome: 'impostazioni' }
  | { nome: 'condividi' }
  | { nome: 'note' }
  | { nome: 'modifica-da-provare'; id: string }
  | { nome: 'nel-quaderno'; id: string }
  | { nome: 'non-trovata' };

export const percorso = {
  home: () => '#/',
  categoria: (id: string) => `#/categoria/${encodeURIComponent(id)}`,
  modificaCategoria: (id: string) => `#/categoria/${encodeURIComponent(id)}/modifica`,
  nuovaCategoria: () => '#/nuova-categoria',
  pratica: (id: string) => `#/pratica/${encodeURIComponent(id)}`,
  modificaPratica: (id: string) => `#/pratica/${encodeURIComponent(id)}/modifica`,
  nuovaPratica: (categoriaId?: string) =>
    categoriaId ? `#/nuova-pratica?categoria=${encodeURIComponent(categoriaId)}` : '#/nuova-pratica',
  contenitore: () => '#/contenitore',
  raccolta: (q = '', tema = '') => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (tema) p.set('tema', tema);
    const qs = p.toString();
    return '#/contenitore/raccolta' + (qs ? '?' + qs : '');
  },
  impostazioni: () => '#/impostazioni',
  note: () => '#/note',
  voceRaccolta: (id: string) => `#/raccolta/${encodeURIComponent(id)}`,
  modificaDaProvare: (id: string) => `#/da-provare/${encodeURIComponent(id)}/modifica`,
  nelQuaderno: (id: string) => `#/da-provare/${encodeURIComponent(id)}/nel-quaderno`,
};

export function leggiRotta(hash: string): Rotta {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const parti = path.split('/').filter(Boolean).map(decodeURIComponent);
  const q = new URLSearchParams(query);
  const [a, b, c] = parti;
  if (!a) return { nome: 'home' };
  if (a === 'categoria' && b && !c) return { nome: 'categoria', id: b };
  if (a === 'categoria' && b && c === 'modifica') return { nome: 'modifica-categoria', id: b };
  if (a === 'nuova-categoria') return { nome: 'nuova-categoria' };
  if (a === 'pratica' && b && !c) return { nome: 'pratica', id: b };
  if (a === 'pratica' && b && c === 'modifica') return { nome: 'modifica-pratica', id: b };
  if (a === 'nuova-pratica') return { nome: 'nuova-pratica', categoriaId: q.get('categoria') ?? undefined };
  if (a === 'contenitore' && (!b || b === 'raccolta') && !c) {
    return { nome: 'contenitore', parte: b ? 'raccolta' : 'da-provare', q: q.get('q') ?? '', tema: q.get('tema') ?? '' };
  }
  if (a === 'note' && !b) return { nome: 'note' };
  if (a === 'condividi' && !b) return { nome: 'condividi' };
  if (a === 'impostazioni' && !b) return { nome: 'impostazioni' };
  if (a === 'raccolta' && b && !c) return { nome: 'voce-raccolta', id: b };
  if (a === 'da-provare' && b && c === 'modifica') return { nome: 'modifica-da-provare', id: b };
  if (a === 'da-provare' && b && c === 'nel-quaderno') return { nome: 'nel-quaderno', id: b };
  return { nome: 'non-trovata' };
}

function iscriviti(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useHash(): string {
  return useSyncExternalStore(iscriviti, () => window.location.hash);
}

/** Vai a un percorso. `sostituisci` evita di lasciare la pagina nella cronologia (es. dopo un salvataggio). */
export function vai(href: string, sostituisci = false) {
  if (sostituisci) {
    window.history.replaceState(null, '', href);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = href.replace(/^#/, '');
  }
}
