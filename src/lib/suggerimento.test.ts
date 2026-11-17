import { describe, expect, it } from 'vitest';
import type { Frequenza } from '../db/types';
import { chiaveGiorno } from './date';
import { hashStringa, praticaDelGiorno, punteggioPratica } from './suggerimento';

const OGGI = new Date(2026, 10, 16, 10, 0); // lunedì 16 novembre 2026
const giorniFa = (n: number, base = OGGI) => {
  const d = new Date(base);
  d.setDate(d.getDate() - n);
  return { data: chiaveGiorno(d) };
};
const p = (frequenza: Frequenza) => ({ frequenza });

describe('punteggioPratica', () => {
  it('già fatta oggi → mai proposta', () => {
    expect(punteggioPratica(p('giorno'), [{ data: new Date().toISOString() }], new Date()).punteggio).toBe(-1);
    expect(punteggioPratica(p('bisogno'), [giorniFa(0)], OGGI).punteggio).toBe(-1);
  });

  it('ogni giorno: 100', () => {
    const r = punteggioPratica(p('giorno'), [giorniFa(1)], OGGI);
    expect(r.punteggio).toBe(100);
    expect(r.motivo).toBe("È una pratica quotidiana e oggi non l'hai ancora fatta.");
    expect(punteggioPratica(p('giorno'), [], OGGI).punteggio).toBe(100);
  });

  describe('settimanale', () => {
    it('mai fatta: 85', () => expect(punteggioPratica(p('settimana'), [], OGGI).punteggio).toBe(85));
    it('7 giorni fa: 80', () => {
      const r = punteggioPratica(p('settimana'), [giorniFa(7)], OGGI);
      expect(r.punteggio).toBe(80);
      expect(r.motivo).toBe("È settimanale: l'ultima volta è stata 7 giorni fa.");
    });
    it('10 giorni fa: 83', () => expect(punteggioPratica(p('settimana'), [giorniFa(10)], OGGI).punteggio).toBe(83));
    it('massimo 95', () => expect(punteggioPratica(p('settimana'), [giorniFa(40)], OGGI).punteggio).toBe(95));
    it('3 giorni fa: 5 + 3', () => expect(punteggioPratica(p('settimana'), [giorniFa(3)], OGGI).punteggio).toBe(8));
  });

  describe('una volta l\'anno', () => {
    it('mai fatta: 40', () => expect(punteggioPratica(p('anno'), [], OGGI).punteggio).toBe(40));
    it('≥ 365 giorni: 75', () => {
      const r = punteggioPratica(p('anno'), [giorniFa(365)], OGGI);
      expect(r.punteggio).toBe(75);
      expect(r.motivo).toContain("È passato un anno dall'ultima volta");
    });
    it('364 giorni: 0', () => expect(punteggioPratica(p('anno'), [giorniFa(364)], OGGI).punteggio).toBe(0));
  });

  describe('a inizio anno', () => {
    const gennaio = new Date(2027, 0, 10);
    it('gennaio, non fatta quest\'anno: 95', () => {
      const r = punteggioPratica(p('inizio-anno'), [{ data: '2026-01-05' }], gennaio);
      expect(r.punteggio).toBe(95);
      expect(r.motivo).toBe('È inizio anno: il momento giusto per questa pratica.');
    });
    it('febbraio, mai fatta: 95', () =>
      expect(punteggioPratica(p('inizio-anno'), [], new Date(2027, 1, 27)).punteggio).toBe(95));
    it('gennaio, già fatta quest\'anno: 0', () =>
      expect(punteggioPratica(p('inizio-anno'), [{ data: '2027-01-02' }], gennaio).punteggio).toBe(0));
    it('dicembre: 15', () => expect(punteggioPratica(p('inizio-anno'), [], new Date(2026, 11, 3)).punteggio).toBe(15));
    it('marzo–novembre: 0', () => {
      expect(punteggioPratica(p('inizio-anno'), [], new Date(2026, 2, 1)).punteggio).toBe(0);
      expect(punteggioPratica(p('inizio-anno'), [], OGGI).punteggio).toBe(0);
    });
  });

  describe('al bisogno', () => {
    it('mai fatta: 20 + 30', () => expect(punteggioPratica(p('bisogno'), [], OGGI).punteggio).toBe(50));
    it('5 giorni fa: 25', () => {
      const r = punteggioPratica(p('bisogno'), [giorniFa(5)], OGGI);
      expect(r.punteggio).toBe(25);
      expect(r.motivo).toBe("Da usare al bisogno: l'ultima volta è stata 5 giorni fa.");
    });
    it('massimo +40', () => expect(punteggioPratica(p('bisogno'), [giorniFa(200)], OGGI).punteggio).toBe(60));
  });

  it('ignora le registrazioni annullate', () => {
    const r = punteggioPratica(p('giorno'), [{ data: chiaveGiorno(OGGI), deletedAt: 'x' }], OGGI);
    expect(r.punteggio).toBe(100);
  });
});

describe('praticaDelGiorno', () => {
  const pr = (id: string, frequenza: Frequenza) => ({ id, frequenza });
  const vuote = new Map();

  it('quaderno vuoto', () => {
    expect(praticaDelGiorno([], vuote, OGGI).tipo).toBe('vuoto');
  });

  it('tutto fatto quando nulla ha punteggio > 0', () => {
    const regs = new Map([['a', [giorniFa(0)]]]);
    // "a" fatta oggi, "b" annuale fatta 10 giorni fa (0 punti)
    const b = new Map([...regs, ['b', [giorniFa(10)]]]);
    expect(praticaDelGiorno([pr('a', 'giorno'), pr('b', 'anno')], b, OGGI).tipo).toBe('tutto-fatto');
  });

  it('non propone mai una pratica già fatta oggi', () => {
    const pratiche = [pr('a', 'giorno'), pr('b', 'giorno'), pr('c', 'giorno')];
    const regs = new Map([['a', [giorniFa(0)]], ['b', [giorniFa(0)]]]);
    for (let altre = 0; altre < 10; altre++) {
      const s = praticaDelGiorno(pratiche, regs, OGGI, altre);
      expect(s.tipo === 'pratica' && s.scelta.pratica.id).toBe('c');
    }
  });

  it('stessa scelta per tutta la giornata, indipendente dall\'ora e dall\'ordine', () => {
    const pratiche = ['a', 'b', 'c', 'd'].map((id) => pr(id, 'giorno'));
    const mattina = praticaDelGiorno(pratiche, vuote, new Date(2026, 10, 16, 6));
    const sera = praticaDelGiorno([...pratiche].reverse(), vuote, new Date(2026, 10, 16, 23, 30));
    expect(mattina.tipo === 'pratica' && mattina.scelta.pratica.id).toBe(
      sera.tipo === 'pratica' && sera.scelta.pratica.id,
    );
  });

  it('indice = (hash data + Un\'altra) mod candidate', () => {
    const pratiche = ['a', 'b', 'c', 'd'].map((id) => pr(id, 'giorno'));
    const base = hashStringa('2026-11-16');
    for (let altre = 0; altre < 8; altre++) {
      const s = praticaDelGiorno(pratiche, vuote, OGGI, altre);
      expect(s.tipo === 'pratica' && s.scelta.pratica.id).toBe(['a', 'b', 'c', 'd'][(base + altre) % 4]);
      expect(s.tipo === 'pratica' && s.numeroCandidate).toBe(4);
    }
  });

  it('"Un\'altra" fa girare tutte le candidate', () => {
    const pratiche = ['a', 'b', 'c'].map((id) => pr(id, 'giorno'));
    const viste = new Set<string>();
    for (let altre = 0; altre < 3; altre++) {
      const s = praticaDelGiorno(pratiche, vuote, OGGI, altre);
      if (s.tipo === 'pratica') viste.add(s.scelta.pratica.id);
    }
    expect(viste).toEqual(new Set(['a', 'b', 'c']));
  });

  it('tiene solo le candidate ≥ 60% della prima', () => {
    // giorno = 100; bisogno fatta 5 gg fa = 25 (< 60): esclusa
    const pratiche = [pr('a', 'giorno'), pr('b', 'giorno'), pr('z', 'bisogno')];
    const regs = new Map([['z', [giorniFa(5)]]]);
    for (let altre = 0; altre < 6; altre++) {
      const s = praticaDelGiorno(pratiche, regs, OGGI, altre);
      expect(s.tipo === 'pratica' && s.scelta.pratica.id).not.toBe('z');
      expect(s.tipo === 'pratica' && s.numeroCandidate).toBe(2);
    }
  });

  it('massimo 6 candidate', () => {
    const pratiche = Array.from({ length: 10 }, (_, i) => pr(`p${i}`, 'giorno'));
    const s = praticaDelGiorno(pratiche, vuote, OGGI);
    expect(s.tipo === 'pratica' && s.numeroCandidate).toBe(6);
  });

  it('se ne resta una sola sopra soglia, prende le prime 5', () => {
    // giorno = 100, poi bisogno 25, 26, 27, 28, 29 (tutti < 60)
    const pratiche = [pr('a', 'giorno'), ...[5, 6, 7, 8, 9].map((n) => pr(`b${n}`, 'bisogno'))];
    const regs = new Map<string, { data: string }[]>([5, 6, 7, 8, 9].map((n) => [`b${n}`, [giorniFa(n)]]));
    const s = praticaDelGiorno(pratiche, regs, OGGI);
    expect(s.tipo === 'pratica' && s.numeroCandidate).toBe(5);
  });

  it('con una sola pratica disponibile la propone sempre', () => {
    const s = praticaDelGiorno([pr('solo', 'settimana')], vuote, OGGI, 3);
    expect(s.tipo === 'pratica' && s.scelta.pratica.id).toBe('solo');
    expect(s.tipo === 'pratica' && s.numeroCandidate).toBe(1);
  });
});
