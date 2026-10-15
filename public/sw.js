/* M8 - offline support.
   Static assets: stale-while-revalidate (cached copy paints immediately, a fresh
   one is fetched behind it and stored for next time).
   Pages: network-first with a cache fallback, then the offline page.
   Text styling itself never needs the network — the engine is precached.

   VERSION is not a formality. It is the only thing that rebuilds PRECACHE, and
   PRECACHE holds /css/main.css. Nothing under /public is content-hashed — the
   filename is edited in place, which is why next.config.mjs refuses to mark it
   immutable — so a stylesheet change is invisible to this worker unless the
   worker itself changes. Bump this in the same commit as any edit to a file
   listed in PRECACHE, or returning visitors keep painting the old CSS. */
const VERSION = 'stylix-v9';
const PRECACHE = [
  '/offline.html',
  '/css/main.css',
  '/css/offline.css',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/js/ui.js',
  '/js/lib.js',
  '/js/generator.js',
  '/js/analytics.js',
  '/js/image-compressor.js',
  '/js/zip.js',
  '/js/engine/engine.js',
  '/js/engine/mappings.js',
  '/js/engine/decorators.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const STATIC = /\.(?:css|js|svg|png|webmanifest|woff2?)$/;
// Admin responses can contain operational data; never store them in the cache.
const PRIVATE = /^\/admin(?:\/|$)/;

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // blob: and data: are same-document resources, not network requests.
  //
  // A blob: URL inherits the page's origin, so the check below does not exclude
  // it, and it carries no file extension, so it misses the static branch too. It
  // therefore fell through to fetch() — which a service worker cannot do for a
  // blob, because the blob lives in the document's realm and not the worker's.
  // The catch answered with the precached offline page, so every object-URL
  // image rendered as a broken image icon. Returning here lets the browser
  // resolve it natively, which is the only thing that can.
  if (url.protocol === 'blob:' || url.protocol === 'data:') return;

  if (url.origin !== self.location.origin) return;
  if (PRIVATE.test(url.pathname)) return;

  if (STATIC.test(url.pathname)) {
    // Stale-while-revalidate: instant cached response, and the fresh file is
    // fetched in the background so the next visit gets the update.
    event.respondWith(
      caches.match(request).then((cached) => {
        const refresh = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              // waitUntil, not a bare .then(): a floating promise is not awaited
              // by anything, and the browser is free to terminate an idle worker
              // before cache.put settles. When that happened the fresh copy was
              // simply dropped and the visitor went on being served the stale
              // stylesheet — indefinitely, because nothing else rewrites that
              // entry. waitUntil keeps the worker alive until the write lands.
              event.waitUntil(
                caches.open(VERSION).then((cache) => cache.put(request, copy)),
              );
            }
            return res;
          })
          .catch(() => cached || new Response('Offline', { status: 503, statusText: 'Offline' }));
        return cached || refresh;
      }),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.mode === 'navigate') {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return res;
      })
      .catch(async () => (await caches.match(request)) || (await caches.match('/offline.html'))),
  );
});
