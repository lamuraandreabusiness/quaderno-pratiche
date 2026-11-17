// Backup in JSON: creazione, lettura con controlli, conversione dei dati del prototipo.
import type { Categoria, DaProvare, Frequenza, Pratica, Registrazione } from '../db/types';
import { COLORI } from './costanti';

export const FORMATO_BACKUP = 'quaderno-pratiche';
export const VERSIONE_BACKUP = 1;

export interface DatiQuaderno {
  categorie: Categoria[];
  pratiche: Pratica[];
  registrazioni: Registrazione[];
  daProvare: DaProvare[];
}

export interface Backup extends DatiQuaderno {
  formato: typeof FORMATO_BACKUP;
  versione: number;
  esportatoIl: string;
}

export function creaBackup(dati: DatiQuaderno, ora = new Date()): Backup {
  return { formato: FORMATO_BACKUP, versione: VERSIONE_BACKUP, esportatoIl: ora.toISOString(), ...dati };
}

export function nomeFileBackup(ora = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `quaderno-pratiche-${ora.getFullYear()}-${p(ora.getMonth() + 1)}-${p(ora.getDate())}.json`;
}

/** Quanti record non eliminati ci sono. */
export function conta(d: DatiQuaderno) {
  const vivi = <T extends { deletedAt?: string }>(l: T[]) => l.filter((x) => !x.deletedAt).length;
  return {
    categorie: vivi(d.categorie),
    pratiche: vivi(d.pratiche),
    registrazioni: vivi(d.registrazioni),
    daProvare: vivi(d.daProvare),
  };
}

/* ---------------- lettura con controlli ---------------- */

export type EsitoLettura =
  | { ok: true; dati: DatiQuaderno; esportatoIl?: string; scartati: number }
  | { ok: false; errore: string };

const FREQUENZE: Frequenza[] = ['giorno', 'settimana', 'bisogno', 'anno', 'inizio-anno'];
type Grezzo = Record<string, unknown>;
const eOggetto = (x: unknown): x is Grezzo => typeof x === 'object' && x !== null && !Array.isArray(x);
const testo = (x: unknown): string | undefined => (typeof x === 'string' ? x : undefined);
const testoNonVuoto = (x: unknown): string | undefined => (typeof x === 'string' && x.trim() ? x : undefined);
const dataValida = (x: unknown): string | undefined =>
  typeof x === 'string' && !Number.isNaN(new Date(x.length === 10 ? x + 'T12:00:00' : x).getTime()) ? x : undefined;
const coloreValido = (x: unknown, i: number) =>
  typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x) ? x : COLORI[i % COLORI.length].colore;

function comuni(r: Grezzo, ora: string) {
  const createdAt = dataValida(r.createdAt) ?? ora;
  return {
    createdAt,
    updatedAt: dataValida(r.updatedAt) ?? createdAt,
    ...(dataValida(r.deletedAt) ? { deletedAt: r.deletedAt as string } : {}),
  };
}

function leggiCategoria(r: unknown, i: number, ora: string): Categoria | null {
  if (!eOggetto(r)) return null;
  const id = testoNonVuoto(r.id);
  const nome = testoNonVuoto(r.nome);
  if (!id || !nome) return null;
  return {
    id,
    nome,
    colore: coloreValido(r.colore, i),
    ordine: typeof r.ordine === 'number' && Number.isFinite(r.ordine) ? r.ordine : i,
    ...comuni(r, ora),
  };
}

function leggiPratica(r: unknown, ora: string): Pratica | null {
  if (!eOggetto(r)) return null;
  const id = testoNonVuoto(r.id);
  const categoriaId = testoNonVuoto(r.categoriaId);
  const titolo = testoNonVuoto(r.titolo);
  if (!id || !categoriaId || !titolo) return null;
  const campi = Array.isArray(r.campi)
    ? r.campi
        .filter(eOggetto)
        .map((c) => ({ etichetta: testo(c.etichetta) ?? '', valore: testo(c.valore) ?? '' }))
        .filter((c) => c.etichetta || c.valore)
    : [];
  return {
    id,
    categoriaId,
    titolo,
    obiettivo: testo(r.obiettivo) ?? '',
    svolgimento: testo(r.svolgimento) ?? '',
    frequenza: FREQUENZE.includes(r.frequenza as Frequenza) ? (r.frequenza as Frequenza) : 'bisogno',
    esempio: testo(r.esempio) ?? '',
    ...(testoNonVuoto(r.fonte) ? { fonte: r.fonte as string } : {}),
    campi,
    ...(testoNonVuoto(r.origineRaccoltaId) ? { origineRaccoltaId: r.origineRaccoltaId as string } : {}),
    ...comuni(r, ora),
  };
}

function leggiRegistrazione(r: unknown, ora: string): Registrazione | null {
  if (!eOggetto(r)) return null;
  const id = testoNonVuoto(r.id);
  const praticaId = testoNonVuoto(r.praticaId);
  const data = dataValida(r.data);
  if (!id || !praticaId || !data) return null;
  return { id, praticaId, data, ...comuni(r, ora) };
}

function leggiDaProvare(r: unknown, ora: string): DaProvare | null {
  if (!eOggetto(r)) return null;
  const id = testoNonVuoto(r.id);
  const titolo = testoNonVuoto(r.titolo);
  if (!id || !titolo) return null;
  const facoltativo = (k: string) => (testoNonVuoto(r[k]) ? { [k]: r[k] as string } : {});
  return {
    id,
    titolo,
    ...facoltativo('fonte'),
    ...facoltativo('nota'),
    ...facoltativo('categoriaSuggeritaId'),
    ...facoltativo('origineRaccoltaId'),
    ...comuni(r, ora),
  };
}

/** Legge il testo di un file di backup. Le righe rovinate vengono scartate (e contate), il resto si salva. */
export function leggiBackup(json: string, ora = new Date().toISOString()): EsitoLettura {
  let grezzo: unknown;
  try {
    grezzo = JSON.parse(json);
  } catch {
    return { ok: false, errore: 'Il file non è un JSON valido.' };
  }
  if (!eOggetto(grezzo) || grezzo.formato !== FORMATO_BACKUP) {
    return { ok: false, errore: 'Questo file non sembra un backup del Quaderno delle pratiche.' };
  }
  if (typeof grezzo.versione === 'number' && grezzo.versione > VERSIONE_BACKUP) {
    return { ok: false, errore: "Il backup è stato fatto con una versione più recente dell'app: aggiornala e riprova." };
  }
  let scartati = 0;
  const elenco = <T extends { id: string }>(chiave: string, leggi: (r: unknown, i: number) => T | null): T[] => {
    const l = Array.isArray(grezzo[chiave as keyof typeof grezzo]) ? (grezzo[chiave as keyof typeof grezzo] as unknown[]) : [];
    const visti = new Set<string>();
    const out: T[] = [];
    l.forEach((r, i) => {
      const x = leggi(r, i);
      if (!x || visti.has(x.id)) scartati++;
      else {
        visti.add(x.id);
        out.push(x);
      }
    });
    return out;
  };
  const categorie = elenco('categorie', (r, i) => leggiCategoria(r, i, ora));
  const idCat = new Set(categorie.map((c) => c.id));
  const pratiche = elenco('pratiche', (r) => leggiPratica(r, ora)).filter((p) => idCat.has(p.categoriaId) || (scartati++, false));
  const idPr = new Set(pratiche.map((p) => p.id));
  const registrazioni = elenco('registrazioni', (r) => leggiRegistrazione(r, ora)).filter(
    (r) => idPr.has(r.praticaId) || (scartati++, false),
  );
  const daProvare = elenco('daProvare', (r) => leggiDaProvare(r, ora));
  return {
    ok: true,
    dati: { categorie, pratiche, registrazioni, daProvare },
    esportatoIl: dataValida(grezzo.esportatoIl),
    scartati,
  };
}

/* ---------------- prototipo (localStorage "quaderno-pratiche-v1") ---------------- */

/**
 * Converte i dati del prototipo: un oggetto { id: {type:"cat"|"pr", …} }.
 * Le registrazioni (array "log" dentro ogni pratica) diventano righe separate, con id stabili:
 * importare due volte lo stesso prototipo non crea doppioni.
 */
export function convertiPrototipo(grezzo: unknown, ora = new Date().toISOString()): DatiQuaderno {
  const vuoto: DatiQuaderno = { categorie: [], pratiche: [], registrazioni: [], daProvare: [] };
  if (!eOggetto(grezzo)) return vuoto;
  const voci = Object.entries(grezzo).filter((e): e is [string, Grezzo] => eOggetto(e[1]));

  const categorie: Categoria[] = voci
    .filter(([, o]) => o.type === 'cat' && testoNonVuoto(o.name))
    .map(([id, o], i) => {
      const createdAt = dataValida(o.created) ?? ora;
      return {
        id,
        nome: (o.name as string).trim(),
        colore: coloreValido(o.color, i),
        ordine: typeof o.order === 'number' ? o.order : i,
        createdAt,
        updatedAt: createdAt,
      };
    });
  const idCat = new Set(categorie.map((c) => c.id));

  const pratiche: Pratica[] = [];
  const registrazioni: Registrazione[] = [];
  for (const [id, o] of voci) {
    if (o.type !== 'pr' || !testoNonVuoto(o.title) || !idCat.has(o.catId as string)) continue;
    const createdAt = dataValida(o.created) ?? ora;
    pratiche.push({
      id,
      categoriaId: o.catId as string,
      titolo: (o.title as string).trim(),
      obiettivo: testo(o.obiettivo) ?? '',
      svolgimento: testo(o.svolgimento) ?? '',
      frequenza: FREQUENZE.includes(o.frequenza as Frequenza) ? (o.frequenza as Frequenza) : 'bisogno',
      esempio: testo(o.esempio) ?? '',
      campi: Array.isArray(o.campi)
        ? o.campi
            .filter(eOggetto)
            .map((c) => ({ etichetta: testo(c.label) ?? '', valore: testo(c.value) ?? '' }))
            .filter((c) => c.etichetta || c.valore)
        : [],
      createdAt,
      updatedAt: dataValida(o.updated) ?? createdAt,
    });
    (Array.isArray(o.log) ? o.log : []).forEach((data, i) => {
      if (!dataValida(data)) return;
      registrazioni.push({ id: `${id}~${i}~${data}`, praticaId: id, data: data as string, createdAt: ora, updatedAt: ora });
    });
  }
  return { categorie, pratiche, registrazioni, daProvare: [] };
}
