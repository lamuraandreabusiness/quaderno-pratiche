import { useEffect, useRef, useState } from 'react';
import { AvvisiProvider } from './app/avvisi';
import { useOggi, useQuaderno } from './app/dati';
import { usePromemoria } from './app/promemoria';
import { leggiRotta, useHash, type Rotta } from './app/rotte';
import { Quaderno } from './components/Quaderno';
import { chiaveGiorno } from './lib/date';
import { Home } from './views/Home';
import { PaginaCategoria } from './views/PaginaCategoria';
import { ModuloCategoria } from './views/ModuloCategoria';
import { SchedaPratica } from './views/SchedaPratica';
import { ModuloPratica } from './views/ModuloPratica';
import { NonTrovata } from './views/NonTrovata';
import { Contenitore } from './views/Contenitore';
import { ModuloDaProvare } from './views/ModuloDaProvare';
import { NelQuaderno } from './views/NelQuaderno';
import { AnteprimaRaccolta } from './views/AnteprimaRaccolta';
import { Impostazioni } from './views/Impostazioni';
import { ArrivoCondivisione } from './views/ArrivoCondivisione';

export default function App() {
  return (
    <AvvisiProvider>
      <Contenuto />
    </AvvisiProvider>
  );
}

function Contenuto() {
  const hash = useHash();
  const rotta = leggiRotta(hash);
  const dati = useQuaderno();
  const oggi = useOggi();
  usePromemoria(dati, oggi);

  // "Un'altra →": quante volte l'hai premuto oggi (si azzera col nuovo giorno)
  const [altre, setAltre] = useState({ giorno: chiaveGiorno(oggi), n: 0 });
  const nAltre = altre.giorno === chiaveGiorno(oggi) ? altre.n : 0;
  const unAltra = () => setAltre({ giorno: chiaveGiorno(oggi), n: nAltre + 1 });

  // Cambio pagina: torna in cima e porta il focus sul titolo (per chi usa tastiera o lettore di schermo)
  // (solo quando cambia la pagina, non la ricerca nella query: altrimenti si perde il cursore mentre scrivi)
  const percorsoPagina = hash.split('?')[0];
  const primo = useRef(true);
  useEffect(() => {
    if (primo.current) {
      primo.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    document.querySelector<HTMLElement>('main h1')?.focus();
  }, [percorsoPagina]);

  const categoriaAttiva = dati ? categoriaDellaRotta(rotta, dati.pratiche) : undefined;

  return (
    <Quaderno categorie={dati?.categorie ?? []} categoriaAttiva={categoriaAttiva}>
      {!dati ? <p className="tenue">Apro il quaderno…</p> : pagina()}
    </Quaderno>
  );

  // Una funzione, non un componente annidato: così i moduli non vengono ricreati
  // a ogni aggiornamento dei dati e non perdono quello che si sta scrivendo.
  function pagina() {
    const d = dati!;
    const p = { rotta, oggi, altre: nAltre, unAltra };
    switch (p.rotta.nome) {
      case 'home':
        return <Home dati={d} oggi={p.oggi} altre={p.altre} unAltra={p.unAltra} />;
      case 'categoria':
        return <PaginaCategoria dati={d} id={p.rotta.id} oggi={p.oggi} />;
      case 'nuova-categoria':
        return <ModuloCategoria dati={d} />;
      case 'modifica-categoria':
        return <ModuloCategoria key={p.rotta.id} dati={d} id={p.rotta.id} />;
      case 'pratica':
        return <SchedaPratica key={p.rotta.id} dati={d} id={p.rotta.id} oggi={p.oggi} />;
      case 'nuova-pratica':
        return <ModuloPratica key={'nuova-' + (p.rotta.categoriaId ?? '')} dati={d} categoriaId={p.rotta.categoriaId} />;
      case 'modifica-pratica':
        return <ModuloPratica key={p.rotta.id} dati={d} id={p.rotta.id} />;
      case 'contenitore':
        return <Contenitore dati={d} oggi={p.oggi} parte={p.rotta.parte} q={p.rotta.q} tema={p.rotta.tema} />;
      case 'condividi':
        return <ArrivoCondivisione dati={d} />;
      case 'impostazioni':
        return <Impostazioni dati={d} />;
      case 'voce-raccolta':
        return <AnteprimaRaccolta key={p.rotta.id} dati={d} id={p.rotta.id} />;
      case 'modifica-da-provare':
        return <ModuloDaProvare key={p.rotta.id} dati={d} id={p.rotta.id} />;
      case 'nel-quaderno':
        return <NelQuaderno key={p.rotta.id} dati={d} id={p.rotta.id} />;
      default:
        return <NonTrovata />;
    }
  }
}

function categoriaDellaRotta(r: Rotta, pratiche: { id: string; categoriaId: string }[]): string | undefined {
  if (r.nome === 'categoria' || r.nome === 'modifica-categoria') return r.id;
  if (r.nome === 'pratica' || r.nome === 'modifica-pratica') return pratiche.find((p) => p.id === r.id)?.categoriaId;
  if (r.nome === 'nuova-pratica') return r.categoriaId;
  return undefined;
}
