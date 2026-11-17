import type { AnchorHTMLAttributes } from 'react';
import { vai } from '../app/rotte';

/**
 * Link che sostituisce la pagina corrente nella cronologia invece di aggiungerne una.
 * Per moduli e "Annulla": così il tasto Indietro non ripassa da pagine doppie.
 */
export function LinkSostituisci(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        vai(props.href, true);
      }}
    />
  );
}
