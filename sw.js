/* Long Haul Ledger service worker — network-first app shell (long-haul-ledger-v23) */
const CACHE = 'long-haul-ledger-v23';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './nav.js',
  './zoom.js',
  './chains.js',
  './geo.js',
  './leadership.js',
  './stats.js',
  './curated.js',
  './data/stats/us.json',
  './data/stats/world.json',
  './labels.js',
  './verify.js',
  './desks.js',
  './places.js',
  './locate.js',
  './newsrank.js',
  './world.svg',
  './manifest.webmanifest',
  './icons/icon.svg',
  './data/signals-live.json',
  './data/leadership.json',
  './data/desks/prices.json',
  './data/geo/admin1.geojson',
  './data/geo/cities.geojson',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => caches.open(CACHE).then((c) => c.addAll(ASSETS)))
     .then(() => self.clients.claim())
  );
});

function isShell(url) {
  const p = url.pathname;
  return (
    p.endsWith('.js') ||
    p.endsWith('.css') ||
    p.endsWith('.html') ||
    p.endsWith('.svg') ||
    p.endsWith('.webmanifest') ||
    p.endsWith('.json') ||
    p.endsWith('.geojson') ||
    p.endsWith('/') ||
    p.endsWith('/long-haul-ledger')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache or serve docs (.md) from the SW; let the network answer.
  if (url.pathname.endsWith('.md')) return;

  if (isShell(url)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
