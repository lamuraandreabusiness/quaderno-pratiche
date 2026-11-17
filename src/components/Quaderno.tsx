import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { avviaAllineamento } from './allineaRighe';
import type { Categoria } from '../db/types';
import { percorso } from '../app/rotte';
import { stileColore } from '../lib/costanti';

interface Props {
  categorie: Categoria[];
  categoriaAttiva?: string;
  children: ReactNode;
}

/** La pagina del quaderno con spirale e linguette delle categorie. */
export function Quaderno({ categorie, categoriaAttiva, children }: Props) {
  const pagina = useRef<HTMLElement>(null);
  useEffect(() => (pagina.current ? avviaAllineamento(pagina.current) : undefined), []);
  return (
    <>
      <a className="salta" href="#contenuto" onClick={(e) => { e.preventDefault(); document.getElementById('contenuto')?.focus(); }}>
        Vai al contenuto
      </a>
      <div className="quaderno">
        <div className="spirale" aria-hidden="true" />
        {categorie.length > 0 && (
          <nav className="linguette" aria-label="Categorie">
            {categorie.map((c) => (
              <a
                key={c.id}
                className="linguetta"
                href={percorso.categoria(c.id)}
                style={stileColore(c.colore) as CSSProperties}
                aria-current={c.id === categoriaAttiva ? 'page' : undefined}
                title={c.nome}
              >
                {c.nome}
              </a>
            ))}
          </nav>
        )}
        <main ref={pagina} className="pagina" id="contenuto" tabIndex={-1}>
          {children}
        </main>
      </div>
      <p className="piede">
        I tuoi dati restano su questo dispositivo. <a href={percorso.impostazioni()}>Esporta un backup</a> ogni tanto.
      </p>
    </>
  );
}
