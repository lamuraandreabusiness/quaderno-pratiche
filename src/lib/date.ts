// Date come giorni di calendario locali (mai differenze di 24 ore).

const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" nel fuso locale. */
export function chiaveGiorno(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Mezzanotte locale del giorno di `d`. */
export function inizioGiorno(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Converte la data di una registrazione in Date.
 * "YYYY-MM-DD" (registrata con "altra data") è inteso come quel giorno locale.
 */
export function leggiDataRegistrazione(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, g] = s.split('-').map(Number);
    return new Date(y, m - 1, g, 12, 0, 0);
  }
  return new Date(s);
}

/**
 * Giorni di calendario tra `a` e `b` (b − a).
 * Usa Date.UTC sui componenti locali, così i cambi di ora legale non contano.
 */
export function giorniTra(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86_400_000);
}

export function stessoGiorno(a: Date, b: Date): boolean {
  return giorniTra(a, b) === 0;
}

/** "oggi", "ieri", "3 giorni fa", "2 mesi fa", "un anno fa"… */
export function fa(giorni: number): string {
  if (giorni <= 0) return 'oggi';
  if (giorni === 1) return 'ieri';
  if (giorni < 45) return `${giorni} giorni fa`;
  const mesi = Math.round(giorni / 30);
  if (mesi < 12) return mesi === 1 ? 'un mese fa' : `${mesi} mesi fa`;
  const anni = Math.round(giorni / 365);
  return anni === 1 ? 'un anno fa' : `${anni} anni fa`;
}

/** "lunedì 16 novembre" */
export function formattaGiorno(d: Date): string {
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "16 nov 2026 · 08:12" (senza ora per le registrazioni con sola data). */
export function formattaRegistrazione(s: string): string {
  const d = leggiDataRegistrazione(s);
  const giorno = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return giorno;
  return `${giorno} · ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
}

/** "16 nov" (con l'anno se non è quello di `oggi`). Per date ISO salvate dall'app. */
export function formattaDataBreve(iso: string, oggi = new Date()): string {
  const d = leggiDataRegistrazione(iso);
  return d.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== oggi.getFullYear() ? { year: 'numeric' } : {}),
  });
}
