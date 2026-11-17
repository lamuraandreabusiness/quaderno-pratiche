import { describe, expect, it } from 'vitest';
import { chiaveGiorno, fa, formattaDataBreve, formattaGiorno, giorniTra, leggiDataRegistrazione } from './date';

describe('giorniTra (giorni di calendario locali)', () => {
  it('conta il cambio di giorno anche se sono passate poche ore', () => {
    expect(giorniTra(new Date(2026, 10, 15, 23, 50), new Date(2026, 10, 16, 0, 10))).toBe(1);
  });
  it('lo stesso giorno a ore diverse vale 0', () => {
    expect(giorniTra(new Date(2026, 10, 16, 0, 1), new Date(2026, 10, 16, 23, 59))).toBe(0);
  });
  it("non sbaglia con l'ora legale (fine marzo, fine ottobre)", () => {
    expect(giorniTra(new Date(2026, 2, 28, 12), new Date(2026, 2, 30, 12))).toBe(2);
    expect(giorniTra(new Date(2026, 9, 24, 23, 30), new Date(2026, 9, 25, 23, 30))).toBe(1);
  });
  it('attraversa il cambio di anno', () => {
    expect(giorniTra(new Date(2025, 11, 31), new Date(2026, 0, 1))).toBe(1);
    expect(giorniTra(new Date(2025, 10, 16), new Date(2026, 10, 16))).toBe(365);
  });
});

describe('leggiDataRegistrazione', () => {
  it('una data "YYYY-MM-DD" è quel giorno locale', () => {
    const d = leggiDataRegistrazione('2026-11-01');
    expect(chiaveGiorno(d)).toBe('2026-11-01');
  });
  it('una data ISO con ora viene letta come istante', () => {
    const iso = new Date(2026, 10, 16, 7, 30).toISOString();
    expect(chiaveGiorno(leggiDataRegistrazione(iso))).toBe('2026-11-16');
  });
});

describe('testi', () => {
  it('fa()', () => {
    expect(fa(0)).toBe('oggi');
    expect(fa(1)).toBe('ieri');
    expect(fa(5)).toBe('5 giorni fa');
    expect(fa(60)).toBe('2 mesi fa');
    expect(fa(400)).toBe('un anno fa');
  });
  it('data breve: anno solo se diverso', () => {
    const oggi = new Date(2026, 10, 16);
    expect(formattaDataBreve(new Date(2026, 10, 3, 9).toISOString(), oggi)).toBe('3 nov');
    expect(formattaDataBreve('2025-12-24', oggi)).toBe('24 dic 2025');
  });
  it('data di oggi in italiano', () => {
    expect(formattaGiorno(new Date(2026, 10, 16))).toBe('lunedì 16 novembre');
  });
});
