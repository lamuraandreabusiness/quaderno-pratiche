import { describe, expect, it } from 'vitest';
import { RACCOLTA, TEMI } from '../data/raccolta';
import { cercaInRaccolta, normalizza } from './ricerca';

const titoli = (testo: string, tema?: string) => cercaInRaccolta(RACCOLTA, testo, tema).map((v) => v.titolo);

describe('Raccolta', () => {
  it('ha le 15 pratiche con id unici e tutti i campi', () => {
    expect(RACCOLTA).toHaveLength(15);
    expect(new Set(RACCOLTA.map((v) => v.id)).size).toBe(15);
    for (const v of RACCOLTA) {
      expect(v.titolo && v.tema && v.obiettivo && v.svolgimento && v.esempio).toBeTruthy();
    }
  });
  it('gli strumenti digitali hanno un indirizzo https', () => {
    for (const v of RACCOLTA.filter((x) => x.strumento)) expect(v.strumento!.url).toMatch(/^https:\/\//);
    expect(RACCOLTA.find((v) => v.id === 'ruota-della-vita')?.strumento?.url).toBe(
      'https://www.andrealamura.it/ruota-della-vita-strumento/',
    );
  });
  it('temi', () => {
    expect(TEMI).toEqual(['Respiro', 'Meditazione', 'Scrittura', 'Coaching', 'Corpo e movimento']);
  });
});

describe('cercaInRaccolta', () => {
  it('senza testo né tema restituisce tutto', () => {
    expect(titoli('')).toHaveLength(15);
  });
  it('ignora maiuscole e accenti', () => {
    expect(normalizza('Perché Più')).toBe('perche piu');
    expect(titoli('GRATITUDINE')).toEqual(['Diario della gratitudine']);
    expect(titoli('liberta')).toEqual([]);
    expect(titoli('priorita')).toContain('Revisione settimanale');
  });
  it('cerca anche in obiettivo, svolgimento ed esempio', () => {
    expect(titoli('sonno')).toEqual(['Respirazione 4-7-8']);
    expect(titoli('caffè')).toEqual(['Risveglio del corpo']);
  });
  it('tutte le parole devono comparire', () => {
    expect(titoli('respir sonno')).toEqual(['Respirazione 4-7-8']);
  });
  it('chi ha la parola nel titolo viene prima', () => {
    expect(titoli('respir')[0]).toMatch(/^Respirazione/);
  });
  it('filtro per tema', () => {
    expect(titoli('', 'Respiro')).toEqual(['Respirazione quadrata', 'Respirazione 4-7-8']);
    expect(titoli('sera', 'Coaching')).toEqual(['Domanda della sera', 'Revisione settimanale']);
  });
});
