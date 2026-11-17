/** È un link web? */
export const eLink = (s: string) => /^https?:\/\/\S+$/i.test(s.trim());

/** Testo corto per un link: "sito.it/percorso…" */
export function linkBreve(url: string, max = 40): string {
  try {
    const u = new URL(url.trim());
    const t = (u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '') + u.search).trim();
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
  } catch {
    return url;
  }
}

/** Mostra una fonte: link cliccabile se è un indirizzo web, altrimenti testo. */
export function Fonte({ valore, breve = false }: { valore: string; breve?: boolean }) {
  const v = valore.trim();
  if (!eLink(v)) return <>{v}</>;
  return (
    <a href={v} target="_blank" rel="noopener noreferrer">
      {breve ? linkBreve(v) : v}
      <span className="sr"> (si apre in una nuova scheda)</span>
    </a>
  );
}
