/* CorridorOS simple service worker for offline support */
const CACHE_NAME = 'corridoros-cache-v2';
// Only pre-cache app shell (HTML). All other assets are hashed and cached at runtime.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/corridor-os.html',
  '/corridoros_detailed.html',
  '/corridoros_dashboard.html',
  '/corridoros_simulator.html',
  '/corridoros_advanced.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Precache core assets; ignore failures (some files may be optional)
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const req = new Request(url, { cache: 'reload' });
            const resp = await fetch(req);
            if (resp.ok) await cache.put(url, resp.clone());
          } catch (_) {
            // ignore
          }
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? Promise.resolve() : caches.delete(k))));
      try {
        if (self.registration.navigationPreload) {
          await self.registration.navigationPreload.enable();
        }
      } catch (e) {
        // ignore
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // App-shell style for navigation: serve cached index.html offline
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse;
          if (preload) return preload;
          const network = await fetch(req);
          return network;
        } catch (e) {
          const cache = await caches.open(CACHE_NAME);
          const fallback = await cache.match('/index.html');
          return fallback || Response.error();
        }
      })()
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const match = await cache.match(req);
      if (match) return match;
      try {
        const resp = await fetch(req);
        // Cache successful same-origin GETs
        if (resp && resp.ok && req.url.startsWith(location.origin)) {
          cache.put(req, resp.clone());
        }
        return resp;
      } catch (e) {
        // Last-resort: if requesting an HTML, return cached index
        if (req.headers.get('accept')?.includes('text/html')) {
          const fallback = await cache.match('/index.html');
          if (fallback) return fallback;
        }
        throw e;
      }
    })()
  );
});
