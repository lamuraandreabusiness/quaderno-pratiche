/* Aggiunta al service worker (importata da workbox, vedi vite.config.ts).
 * - apre l'app quando si tocca una notifica
 * - controllo periodico in sottofondo (dove il browser lo permette) per il promemoria
 * Le regole ripetono quelle di src/lib/promemoria.ts: se cambi là, cambia anche qui.
 */
/* eslint-disable no-restricted-globals */
const CACHE_PROMEMORIA = 'quaderno-promemoria';
const CHIAVE_PROMEMORIA = '/__promemoria.json';

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((finestre) => {
      for (const f of finestre) {
        if (new URL(f.url).origin === self.location.origin && 'focus' in f) {
          return f.focus().then((c) => (c && 'navigate' in c ? c.navigate(url) : c));
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'promemoria') event.waitUntil(controllaPromemoria());
});

const pad = (n) => String(n).padStart(2, '0');
const chiaveGiorno = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function controllaPromemoria() {
  const cache = await caches.open(CACHE_PROMEMORIA);
  const r = await cache.match(CHIAVE_PROMEMORIA);
  if (!r) return;
  const s = await r.json();
  const adesso = new Date();
  const oggi = chiaveGiorno(adesso);
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.ora || '');
  if (!s.attivo || !m) return;
  if (s.inviatoIl === oggi) return;
  if (adesso.getHours() * 60 + adesso.getMinutes() < Number(m[1]) * 60 + Number(m[2])) return;
  if (s.giorno === oggi && !s.titolo) return; // tutto fatto
  const conPratica = s.giorno === oggi && s.titolo;
  await self.registration.showNotification('Quaderno delle pratiche', {
    body: conPratica ? `La tua pratica di oggi: ${s.titolo}` : 'La tua pratica di oggi ti aspetta nel quaderno.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'promemoria',
    lang: 'it',
    data: { url: conPratica && s.praticaId ? `/#/pratica/${encodeURIComponent(s.praticaId)}` : '/' },
  });
  s.inviatoIl = oggi;
  await cache.put(CHIAVE_PROMEMORIA, new Response(JSON.stringify(s), { headers: { 'Content-Type': 'application/json' } }));
}
