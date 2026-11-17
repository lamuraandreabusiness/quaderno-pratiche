import { percorso } from '../app/rotte';

export function NonTrovata({ cosa }: { cosa?: 'categoria' | 'pratica' }) {
  return (
    <>
      <h1 tabIndex={-1}>Pagina strappata</h1>
      <p className="tenue">
        {cosa === 'categoria'
          ? 'Questa categoria non è più nel quaderno.'
          : cosa === 'pratica'
            ? 'Questa pratica non è più nel quaderno.'
            : 'Questa pagina non esiste.'}
      </p>
      <p className="sopra">
        <a className="btn" href={percorso.home()}>
          ← Torna all'indice
        </a>
      </p>
    </>
  );
}
