import { describe, expect, it } from 'vitest';
import { convertiPrototipo, creaBackup, leggiBackup, nomeFileBackup, conta, type DatiQuaderno } from './backup';

const ORA = '2026-11-16T10:00:00.000Z';

const esempio: DatiQuaderno = {
  categorie: [
    { id: 'c1', nome: 'Respiro', colore: '#2a8a85', ordine: 0, createdAt: ORA, updatedAt: ORA },
    { id: 'c2', nome: 'Vecchia', colore: '#e2674f', ordine: 1, createdAt: ORA, updatedAt: ORA, deletedAt: ORA },
  ],
  pratiche: [
    {
      id: 'p1', categoriaId: 'c1', titolo: 'Respirazione quadrata', obiettivo: 'Calma', svolgimento: 'Inspira 4\nEspira 4',
      frequenza: 'giorno', esempio: '', fonte: 'https://esempio.it', campi: [{ etichetta: 'Durata', valore: '5 min' }],
      origineRaccoltaId: 'respirazione-quadrata', createdAt: ORA, updatedAt: ORA,
    },
  ],
  registrazioni: [
    { id: 'r1', praticaId: 'p1', data: ORA, createdAt: ORA, updatedAt: ORA },
    { id: 'r2', praticaId: 'p1', data: '2026-11-15', createdAt: ORA, updatedAt: ORA },
  ],
  daProvare: [{ id: 'd1', titolo: 'Metta', fonte: 'YouTube', createdAt: ORA, updatedAt: ORA }],
};

describe('backup', () => {
  it('andata e ritorno senza perdere nulla', () => {
    const json = JSON.stringify(creaBackup(esempio, new Date(ORA)));
    const esito = leggiBackup(json, ORA);
    expect(esito.ok).toBe(true);
    if (!esito.ok) return;
    expect(esito.dati).toEqual(esempio);
    expect(esito.scartati).toBe(0);
    expect(esito.esportatoIl).toBe(ORA);
  });

  it('conta solo i record non eliminati', () => {
    expect(conta(esempio)).toEqual({ categorie: 1, pratiche: 1, registrazioni: 2, daProvare: 1 });
  });

  it('nome del file con la data locale', () => {
    expect(nomeFileBackup(new Date(2026, 0, 5, 23))).toBe('quaderno-pratiche-2026-01-05.json');
  });

  it('rifiuta file non validi', () => {
    expect(leggiBackup('ciao')).toEqual({ ok: false, errore: 'Il file non è un JSON valido.' });
    expect(leggiBackup('{"a":1}').ok).toBe(false);
    expect(leggiBackup('[]').ok).toBe(false);
    const futuro = leggiBackup(JSON.stringify({ formato: 'quaderno-pratiche', versione: 99 }));
    expect(futuro.ok === false && futuro.errore).toMatch(/più recente/);
  });

  it('scarta le righe rovinate e tiene le altre', () => {
    const json = JSON.stringify({
      formato: 'quaderno-pratiche',
      versione: 1,
      categorie: [esempio.categorie[0], { id: 'senza-nome' }, 'spazzatura', { ...esempio.categorie[0] }],
      pratiche: [
        esempio.pratiche[0],
        { id: 'orfana', categoriaId: 'non-esiste', titolo: 'X' },
        { id: 'p2', categoriaId: 'c1', titolo: 'Minima' },
      ],
      registrazioni: [esempio.registrazioni[0], { id: 'r9', praticaId: 'p1', data: 'non è una data' }, { id: 'r8', praticaId: 'orfana', data: ORA }],
      daProvare: [{ id: 'd2' }],
    });
    const esito = leggiBackup(json, ORA);
    expect(esito.ok).toBe(true);
    if (!esito.ok) return;
    expect(esito.dati.categorie.map((c) => c.id)).toEqual(['c1']); // doppione e righe senza nome scartati
    expect(esito.dati.pratiche.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(esito.dati.pratiche[1]).toMatchObject({ obiettivo: '', frequenza: 'bisogno', campi: [], createdAt: ORA });
    expect(esito.dati.registrazioni.map((r) => r.id)).toEqual(['r1']);
    expect(esito.dati.daProvare).toEqual([]);
    expect(esito.scartati).toBe(3 + 1 + 2 + 1);
  });
});

describe('convertiPrototipo', () => {
  it('converte categorie, pratiche e registro', () => {
    const proto = {
      'cat-a': { type: 'cat', name: 'Respiro', color: '#2a8a85', order: 0, created: '2026-10-01T08:00:00.000Z' },
      'cat-b': { type: 'cat', name: 'Senza colore' },
      'pr-1': {
        type: 'pr', catId: 'cat-a', title: 'Respirazione quadrata', obiettivo: 'Calma', svolgimento: 'Inspira',
        frequenza: 'giorno', esempio: 'Prima di una riunione',
        campi: [{ label: 'Durata', value: '5 min' }, { label: '', value: '' }],
        log: ['2026-11-15T07:30:00.000Z', '2026-11-10', 'rotta'],
        created: '2026-10-02T08:00:00.000Z', updated: '2026-11-15T07:30:00.000Z',
      },
      'pr-orfana': { type: 'pr', catId: 'cat-z', title: 'Orfana', log: [] },
      spazzatura: 42,
    };
    const d = convertiPrototipo(proto, ORA);
    expect(d.categorie).toEqual([
      { id: 'cat-a', nome: 'Respiro', colore: '#2a8a85', ordine: 0, createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z' },
      { id: 'cat-b', nome: 'Senza colore', colore: '#e8933a', ordine: 1, createdAt: ORA, updatedAt: ORA },
    ]);
    expect(d.pratiche).toHaveLength(1);
    expect(d.pratiche[0]).toMatchObject({
      id: 'pr-1', categoriaId: 'cat-a', titolo: 'Respirazione quadrata', frequenza: 'giorno',
      campi: [{ etichetta: 'Durata', valore: '5 min' }], updatedAt: '2026-11-15T07:30:00.000Z',
    });
    expect(d.registrazioni.map((r) => r.data)).toEqual(['2026-11-15T07:30:00.000Z', '2026-11-10']);
    expect(d.registrazioni.every((r) => r.praticaId === 'pr-1')).toBe(true);
    // id stabili: una seconda conversione dà gli stessi id (niente doppioni importando due volte)
    expect(convertiPrototipo(proto, ORA).registrazioni.map((r) => r.id)).toEqual(d.registrazioni.map((r) => r.id));
  });

  it('dati assenti o rovinati → quaderno vuoto', () => {
    expect(convertiPrototipo(null)).toEqual({ categorie: [], pratiche: [], registrazioni: [], daProvare: [] });
    expect(convertiPrototipo('x').categorie).toEqual([]);
  });
});
