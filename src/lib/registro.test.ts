import { describe, expect, it } from 'vitest';
import { fattaOggi, giorniDiFila, ordinaRecenti, ultimaVolta } from './registro';
import { chiaveGiorno } from './date';

const OGGI = new Date(2026, 10, 16, 10, 0);
const alle = (g: number, h = 9) => new Date(2026, 10, g, h).toISOString();

describe('giorniDiFila', () => {
  it('nessuna registrazione → 0', () => {
    expect(giorniDiFila([], OGGI)).toBe(0);
  });
  it('conta da oggi se oggi è fatta', () => {
    const r = [alle(16), alle(15), alle(14)].map((data) => ({ data }));
    expect(giorniDiFila(r, OGGI)).toBe(3);
  });
  it('se oggi non è ancora fatta conta da ieri (la serie non è persa)', () => {
    const r = [alle(15), alle(14)].map((data) => ({ data }));
    expect(giorniDiFila(r, OGGI)).toBe(2);
  });
  it('un buco interrompe la serie', () => {
    const r = [alle(16), alle(15), alle(13)].map((data) => ({ data }));
    expect(giorniDiFila(r, OGGI)).toBe(2);
  });
  it('se manca anche ieri la serie è 0', () => {
    expect(giorniDiFila([{ data: alle(14) }], OGGI)).toBe(0);
  });
  it('due registrazioni nello stesso giorno contano una volta', () => {
    const r = [alle(16, 8), alle(16, 20), alle(15)].map((data) => ({ data }));
    expect(giorniDiFila(r, OGGI)).toBe(2);
  });
  it('mescola registrazioni con ora e con sola data', () => {
    const r = [{ data: alle(16) }, { data: '2026-11-15' }, { data: '2026-11-14' }];
    expect(giorniDiFila(r, OGGI)).toBe(3);
  });
  it('ignora le registrazioni annullate', () => {
    const r = [{ data: alle(16) }, { data: alle(15), deletedAt: 'x' }, { data: alle(14) }];
    expect(giorniDiFila(r, OGGI)).toBe(1);
  });
  it('attraversa il cambio di mese', () => {
    const oggi = new Date(2026, 11, 1, 9);
    const r = ['2026-12-01', '2026-11-30', '2026-11-29'].map((data) => ({ data }));
    expect(giorniDiFila(r, oggi)).toBe(3);
  });
});

describe('ultima volta e fatta oggi', () => {
  it('la più recente vince anche se inserita dopo', () => {
    const r = [{ data: alle(16) }, { data: '2026-11-10' }];
    expect(chiaveGiorno(ultimaVolta(r)!)).toBe('2026-11-16');
    expect(ordinaRecenti(r)[0].data).toBe(alle(16));
  });
  it('fatta oggi alle 23:59 di ieri non conta', () => {
    expect(fattaOggi([{ data: new Date(2026, 10, 15, 23, 59).toISOString() }], OGGI)).toBe(false);
    expect(fattaOggi([{ data: new Date(2026, 10, 16, 0, 1).toISOString() }], OGGI)).toBe(true);
  });
});
