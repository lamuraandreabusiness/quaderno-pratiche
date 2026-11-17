// Operazioni sul database. Tutte le eliminazioni sono "morbide" (deletedAt).
import { db } from './db';
import type { Categoria, DaProvare, Pratica, Registrazione } from './types';
import { adessoISO, nuovoId } from '../lib/id';
import { CATEGORIE_DI_ESEMPIO } from '../lib/costanti';
import { ordinaRecenti } from '../lib/registro';
import type { DatiQuaderno } from '../lib/backup';

const vive = <T extends { deletedAt?: string }>(x: T) => !x.deletedAt;

/* ---------------- letture ---------------- */

export async function elencoCategorie(): Promise<Categoria[]> {
  const tutte = await db.categorie.toArray();
  return tutte
    .filter(vive)
    .sort((a, b) => a.ordine - b.ordine || a.createdAt.localeCompare(b.createdAt));
}

export async function elencoPratiche(categoriaId?: string): Promise<Pratica[]> {
  const righe = categoriaId
    ? await db.pratiche.where('categoriaId').equals(categoriaId).toArray()
    : await db.pratiche.toArray();
  return righe.filter(vive).sort((a, b) => a.titolo.localeCompare(b.titolo, 'it'));
}

export async function elencoRegistrazioni(praticaId?: string): Promise<Registrazione[]> {
  const righe = praticaId
    ? await db.registrazioni.where('praticaId').equals(praticaId).toArray()
    : await db.registrazioni.toArray();
  return righe.filter(vive);
}

export async function elencoDaProvare(): Promise<DaProvare[]> {
  const righe = await db.daProvare.toArray();
  return righe.filter(vive).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ---------------- categorie ---------------- */

export async function creaCategoria(nome: string, colore: string): Promise<Categoria> {
  const ora = adessoISO();
  const ordine = (await elencoCategorie()).length;
  const c: Categoria = { id: nuovoId(), nome: nome.trim(), colore, ordine, createdAt: ora, updatedAt: ora };
  await db.categorie.add(c);
  return c;
}

export async function aggiornaCategoria(id: string, dati: Partial<Pick<Categoria, 'nome' | 'colore' | 'ordine'>>) {
  await db.categorie.update(id, { ...dati, updatedAt: adessoISO() });
}

/** Elimina la categoria insieme alle sue pratiche e ai loro registri. */
export async function eliminaCategoria(id: string) {
  const ora = adessoISO();
  await db.transaction('rw', db.categorie, db.pratiche, db.registrazioni, async () => {
    const pratiche = (await db.pratiche.where('categoriaId').equals(id).toArray()).filter(vive);
    for (const p of pratiche) await segnaPraticaEliminata(p.id, ora);
    await db.categorie.update(id, { deletedAt: ora, updatedAt: ora });
  });
}

export async function creaCategorieDiEsempio() {
  const ora = adessoISO();
  const base = (await elencoCategorie()).length;
  await db.categorie.bulkAdd(
    CATEGORIE_DI_ESEMPIO.map((c, i) => ({
      id: nuovoId(),
      nome: c.nome,
      colore: c.colore,
      ordine: base + i,
      createdAt: ora,
      updatedAt: ora,
    })),
  );
}

/* ---------------- pratiche ---------------- */

export type DatiPratica = Omit<Pratica, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export async function creaPratica(dati: DatiPratica): Promise<Pratica> {
  const ora = adessoISO();
  const p: Pratica = { ...dati, id: nuovoId(), createdAt: ora, updatedAt: ora };
  await db.pratiche.add(p);
  return p;
}

export async function aggiornaPratica(id: string, dati: Partial<DatiPratica>) {
  await db.pratiche.update(id, { ...dati, updatedAt: adessoISO() });
}

async function segnaPraticaEliminata(id: string, ora: string) {
  await db.pratiche.update(id, { deletedAt: ora, updatedAt: ora });
  await db.registrazioni
    .where('praticaId')
    .equals(id)
    .filter(vive)
    .modify({ deletedAt: ora, updatedAt: ora });
}

export async function eliminaPratica(id: string) {
  await db.transaction('rw', db.pratiche, db.registrazioni, () => segnaPraticaEliminata(id, adessoISO()));
}

/* ---------------- registro ---------------- */

/** Registra la pratica: adesso, oppure in una data passata "YYYY-MM-DD". */
export async function registra(praticaId: string, data?: string): Promise<Registrazione> {
  const ora = adessoISO();
  const r: Registrazione = { id: nuovoId(), praticaId, data: data ?? ora, createdAt: ora, updatedAt: ora };
  await db.registrazioni.add(r);
  return r;
}

/** Annulla la registrazione più recente (per data). Restituisce quella annullata. */
export async function annullaUltima(praticaId: string): Promise<Registrazione | undefined> {
  const [ultima] = ordinaRecenti(await elencoRegistrazioni(praticaId));
  if (!ultima) return undefined;
  const ora = adessoISO();
  await db.registrazioni.update(ultima.id, { deletedAt: ora, updatedAt: ora });
  return ultima;
}

/* ---------------- da provare ---------------- */

export type DatiDaProvare = Omit<DaProvare, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export async function creaDaProvare(dati: DatiDaProvare): Promise<DaProvare> {
  const ora = adessoISO();
  const d: DaProvare = { ...dati, titolo: dati.titolo.trim(), id: nuovoId(), createdAt: ora, updatedAt: ora };
  await db.daProvare.add(d);
  return d;
}

export async function aggiornaDaProvare(id: string, dati: Partial<DatiDaProvare>) {
  await db.daProvare.update(id, { ...dati, updatedAt: adessoISO() });
}

export async function eliminaDaProvare(id: string) {
  const ora = adessoISO();
  await db.daProvare.update(id, { deletedAt: ora, updatedAt: ora });
}

/* ---------------- archiviazione ---------------- */

/** Chiede al browser di non cancellare i dati. Restituisce true se concesso. */
export async function chiediPersistenza(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/* ---------------- backup ---------------- */

/** Tutte le righe, comprese quelle eliminate (servono alla sincronizzazione futura). */
export async function leggiTutto(): Promise<DatiQuaderno> {
  const [categorie, pratiche, registrazioni, daProvare] = await Promise.all([
    db.categorie.toArray(),
    db.pratiche.toArray(),
    db.registrazioni.toArray(),
    db.daProvare.toArray(),
  ]);
  return { categorie, pratiche, registrazioni, daProvare };
}

/** Sostituisce l'intero quaderno con i dati di un backup. */
export async function sostituisciTutto(d: DatiQuaderno) {
  await db.transaction('rw', [db.categorie, db.pratiche, db.registrazioni, db.daProvare], async () => {
    await Promise.all([db.categorie.clear(), db.pratiche.clear(), db.registrazioni.clear(), db.daProvare.clear()]);
    await db.categorie.bulkAdd(d.categorie);
    await db.pratiche.bulkAdd(d.pratiche);
    await db.registrazioni.bulkAdd(d.registrazioni);
    await db.daProvare.bulkAdd(d.daProvare);
  });
}

/** Aggiunge dati al quaderno senza toccare quello che c'è: le righe con un id già presente vengono saltate. */
export async function aggiungiAlQuaderno(d: DatiQuaderno) {
  await db.transaction('rw', [db.categorie, db.pratiche, db.registrazioni, db.daProvare], async () => {
    const nuove = async <T extends { id: string }>(t: { bulkGet(ids: string[]): Promise<(T | undefined)[]> }, righe: T[]) => {
      const esistenti = await t.bulkGet(righe.map((r) => r.id));
      return righe.filter((_, i) => !esistenti[i]);
    };
    const base = (await elencoCategorie()).length;
    const categorie = (await nuove(db.categorie, d.categorie)).map((c, i) => ({ ...c, ordine: base + i }));
    await db.categorie.bulkAdd(categorie);
    await db.pratiche.bulkAdd(await nuove(db.pratiche, d.pratiche));
    await db.registrazioni.bulkAdd(await nuove(db.registrazioni, d.registrazioni));
    await db.daProvare.bulkAdd(await nuove(db.daProvare, d.daProvare));
  });
}

/** Spazio usato e stato della protezione dei dati. */
export async function statoArchiviazione(): Promise<{ protetto: boolean | null; usatoKB: number | null }> {
  try {
    const protetto = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
    const stima = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    return { protetto, usatoKB: stima?.usage != null ? Math.round(stima.usage / 1024) : null };
  } catch {
    return { protetto: null, usatoKB: null };
  }
}
