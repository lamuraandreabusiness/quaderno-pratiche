import { describe, expect, it } from 'vitest';
import { bozzaDaCondivisione, eCondivisione } from './condivisione';
import { devoAvvisare, minutiDa, msAlProssimo, testoPromemoria, type StatoPromemoria } from './promemoria';

const q = (o: Record<string, string>) => '?' + new URLSearchParams(o).toString();

describe('condivisione verso l\'app', () => {
  it('riconosce i parametri', () => {
    expect(eCondivisione('')).toBe(false);
    expect(eCondivisione('?title=')).toBe(false);
    expect(eCondivisione(q({ url: 'https://x.it' }))).toBe(true);
  });
  it('titolo e url separati', () => {
    expect(bozzaDaCondivisione(q({ title: 'Meditazione metta', url: 'https://youtube.com/watch?v=1' }))).toEqual({
      titolo: 'Meditazione metta', fonte: 'https://youtube.com/watch?v=1', nota: '', categoriaSuggeritaId: '',
    });
  });
  it('link dentro il testo (tipico di Android)', () => {
    const b = bozzaDaCondivisione(q({ title: 'Respiro 4-7-8', text: 'Guarda questo video https://youtu.be/abc.' }));
    expect(b.fonte).toBe('https://youtu.be/abc');
    expect(b.titolo).toBe('Respiro 4-7-8');
    expect(b.nota).toBe('Guarda questo video');
  });
  it('senza titolo usa il testo, poi il nome del sito', () => {
    expect(bozzaDaCondivisione(q({ text: 'Body scan guidato - https://esempio.it/body' })).titolo).toBe('Body scan guidato');
    expect(bozzaDaCondivisione(q({ url: 'https://www.esempio.it/pagina' })).titolo).toBe('esempio.it');
  });
  it('toglie il nome del sito in fondo al titolo', () => {
    expect(bozzaDaCondivisione(q({ title: 'Respiro coerente | YouTube', url: 'https://www.youtube.com/watch?v=1' })).titolo).toBe('Respiro coerente');
    expect(bozzaDaCondivisione(q({ title: 'Body scan - Il Post', url: 'https://www.ilpost.it/x' })).titolo).toBe('Body scan');
    expect(bozzaDaCondivisione(q({ title: 'Prima - Dopo', url: 'https://esempio.it' })).titolo).toBe('Prima - Dopo');
  });
  it('il testo uguale al titolo non diventa nota', () => {
    expect(bozzaDaCondivisione(q({ title: 'Ciao', text: 'Ciao' })).nota).toBe('');
  });
});

describe('promemoria', () => {
  const base: StatoPromemoria = { attivo: true, ora: '08:30' };
  const alle = (h: number, m = 0, g = 16) => new Date(2026, 10, g, h, m);

  it('legge l\'ora', () => {
    expect(minutiDa('08:30')).toBe(510);
    expect(minutiDa('24:00')).toBeNull();
    expect(minutiDa('boh')).toBeNull();
  });

  it('avvisa solo dopo l\'ora scelta, una volta al giorno', () => {
    expect(devoAvvisare(base, alle(8, 29))).toBe(false);
    expect(devoAvvisare(base, alle(8, 30))).toBe(true);
    expect(devoAvvisare({ ...base, inviatoIl: '2026-11-16' }, alle(9))).toBe(false);
    expect(devoAvvisare({ ...base, inviatoIl: '2026-11-15' }, alle(9))).toBe(true);
    expect(devoAvvisare({ ...base, attivo: false }, alle(9))).toBe(false);
  });

  it('non avvisa se oggi è tutto fatto', () => {
    expect(devoAvvisare({ ...base, giorno: '2026-11-16', titolo: null }, alle(9))).toBe(false);
    // dati di ieri: non sappiamo, avvisiamo con un testo generico
    expect(devoAvvisare({ ...base, giorno: '2026-11-15', titolo: null }, alle(9))).toBe(true);
  });

  it('testo con la pratica del giorno, o generico se i dati sono vecchi', () => {
    const s = { ...base, giorno: '2026-11-16', titolo: 'Body scan', praticaId: 'p 1' };
    expect(testoPromemoria(s, alle(9))).toEqual({ corpo: 'La tua pratica di oggi: Body scan', url: './#/pratica/p%201' });
    expect(testoPromemoria(s, alle(9, 0, 17)).corpo).toBe('La tua pratica di oggi ti aspetta nel quaderno.');
  });

  it('tempo al prossimo promemoria', () => {
    expect(msAlProssimo(base, alle(8))).toBe(30 * 60_000);
    expect(msAlProssimo(base, alle(9))).toBe((23 * 60 + 30) * 60_000);
    expect(msAlProssimo({ ...base, inviatoIl: '2026-11-16' }, alle(8))).toBe((24 * 60 + 30) * 60_000);
    expect(msAlProssimo({ ...base, attivo: false }, alle(8))).toBeNull();
  });
});
