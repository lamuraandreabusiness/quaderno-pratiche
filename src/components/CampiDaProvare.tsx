import type { Categoria } from '../db/types';

export interface BozzaDaProvare {
  titolo: string;
  fonte: string;
  nota: string;
  categoriaSuggeritaId: string;
}

interface Props {
  prefisso: string; // per id unici nella pagina
  bozza: BozzaDaProvare;
  categorie: Categoria[];
  onChange: (b: BozzaDaProvare) => void;
}

/** Campi facoltativi di un elemento "Da provare": fonte, nota, categoria suggerita. */
export function CampiDaProvare({ prefisso, bozza, categorie, onChange }: Props) {
  const imposta = (k: keyof BozzaDaProvare, v: string) => onChange({ ...bozza, [k]: v });
  return (
    <>
      <div className="campo">
        <label htmlFor={`${prefisso}-fonte`}>
          Fonte <span className="facoltativo">(facoltativa)</span>
        </label>
        <p className="aiuto" id={`${prefisso}-fonte-aiuto`}>
          Dove l'hai trovata: un link, un libro, un video…
        </p>
        <input
          id={`${prefisso}-fonte`}
          type="text"
          value={bozza.fonte}
          onChange={(e) => imposta('fonte', e.target.value)}
          aria-describedby={`${prefisso}-fonte-aiuto`}
          autoComplete="off"
        />
      </div>
      <div className="campo">
        <label htmlFor={`${prefisso}-nota`}>
          Nota <span className="facoltativo">(facoltativa)</span>
        </label>
        <textarea
          id={`${prefisso}-nota`}
          value={bozza.nota}
          onChange={(e) => imposta('nota', e.target.value)}
          placeholder="Perché ti ha colpito, come si fa, cosa vuoi ricordare"
        />
      </div>
      {categorie.length > 0 && (
        <div className="campo">
          <label htmlFor={`${prefisso}-categoria`}>
            Categoria suggerita <span className="facoltativo">(facoltativa)</span>
          </label>
          <select
            id={`${prefisso}-categoria`}
            value={bozza.categoriaSuggeritaId}
            onChange={(e) => imposta('categoriaSuggeritaId', e.target.value)}
          >
            <option value="">— nessuna —</option>
            {categorie.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}

/** Converte la bozza nei dati da salvare (campi vuoti → assenti). */
export function datiDaBozza(b: BozzaDaProvare) {
  return {
    titolo: b.titolo.trim(),
    fonte: b.fonte.trim() || undefined,
    nota: b.nota.trim() || undefined,
    categoriaSuggeritaId: b.categoriaSuggeritaId || undefined,
  };
}

export const bozzaVuota = (): BozzaDaProvare => ({ titolo: '', fonte: '', nota: '', categoriaSuggeritaId: '' });
