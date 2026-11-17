import Dexie, { type EntityTable } from 'dexie';
import type { Categoria, DaProvare, Pratica, Registrazione } from './types';

export class QuadernoDB extends Dexie {
  categorie!: EntityTable<Categoria, 'id'>;
  pratiche!: EntityTable<Pratica, 'id'>;
  registrazioni!: EntityTable<Registrazione, 'id'>;
  daProvare!: EntityTable<DaProvare, 'id'>;

  constructor(nome = 'quaderno-pratiche') {
    super(nome);
    this.version(1).stores({
      categorie: 'id, ordine, updatedAt',
      pratiche: 'id, categoriaId, origineRaccoltaId, updatedAt',
      registrazioni: 'id, praticaId, data, updatedAt',
      daProvare: 'id, createdAt, updatedAt',
    });
  }
}

export const db = new QuadernoDB();
