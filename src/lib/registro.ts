// Statistiche del registro di una pratica, calcolate da un elenco di registrazioni.
import type { Registrazione } from '../db/types';
import { chiaveGiorno, giorniTra, inizioGiorno, leggiDataRegistrazione } from './date';

type ConData = Pick<Registrazione, 'data' | 'deletedAt'>;

const attive = <T extends ConData>(r: T[]) => r.filter((x) => !x.deletedAt);

/** Registrazioni non eliminate, dalla più recente. */
export function ordinaRecenti<T extends ConData>(regs: T[]): T[] {
  return attive(regs)
    .slice()
    .sort((a, b) => leggiDataRegistrazione(b.data).getTime() - leggiDataRegistrazione(a.data).getTime());
}

export function ultimaVolta(regs: ConData[]): Date | null {
  const [prima] = ordinaRecenti(regs);
  return prima ? leggiDataRegistrazione(prima.data) : null;
}

export function giorniDallUltima(regs: ConData[], oggi: Date): number | null {
  const u = ultimaVolta(regs);
  return u ? giorniTra(u, oggi) : null;
}

export function fattaOggi(regs: ConData[], oggi: Date): boolean {
  return attive(regs).some((r) => giorniTra(leggiDataRegistrazione(r.data), oggi) === 0);
}

export function fattaNellAnno(regs: ConData[], anno: number): boolean {
  return attive(regs).some((r) => leggiDataRegistrazione(r.data).getFullYear() === anno);
}

/**
 * Giorni di fila: conta all'indietro da oggi (o da ieri, se oggi non è ancora fatta).
 * Più registrazioni nello stesso giorno contano una volta.
 */
export function giorniDiFila(regs: ConData[], oggi: Date): number {
  const giorni = new Set(attive(regs).map((r) => chiaveGiorno(leggiDataRegistrazione(r.data))));
  if (!giorni.size) return 0;
  const d = inizioGiorno(oggi);
  if (!giorni.has(chiaveGiorno(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (giorni.has(chiaveGiorno(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Raggruppa le registrazioni per pratica. */
export function perPratica<T extends Registrazione>(regs: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of regs) {
    if (r.deletedAt) continue;
    const l = m.get(r.praticaId);
    if (l) l.push(r);
    else m.set(r.praticaId, [r]);
  }
  return m;
}
