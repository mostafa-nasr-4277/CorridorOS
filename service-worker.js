/* CorridorOS simple service worker for offline support */
const CACHE_NAME = 'corridoros-cache-v3';
// Resolve paths correctly for both root hosting and GitHub Pages project hosting
const scopeURL = new URL(self.registration?.scope || self.location.href);
const scopePath = scopeURL.pathname.replace(/\/$/, '');
const toScoped = (p) => {
  // Ensure leading slash paths are scoped under project (e.g., /CorridorOS)
  const path = p.startsWith('/') ? (scopePath + p) : p;
  return new URL(path, scopeURL).toString();
};
// Only pre-cache app shell (HTML). All other assets are hashed and cached at runtime.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/corridor-os.html',
  '/corridoros_detailed.html',
  '/corridoros_dashboard.html',
  '/corridoros_simulator.html',
  '/corridoros_advanced.html'
].map(toScoped);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Precache core assets; ignore failures (some files may be optional)
      await Promise.all(PRECACHE_URLS.map(async (u) => {
        try {
          const req = new Request(u, { cache: 'reload' });
          const resp = await fetch(req);
          if (resp.ok) await cache.put(req, resp.clone());
        } catch (_) {}
      }));
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
          const fallback = await cache.match(toScoped('/index.html'));
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
          const fallback = await cache.match(toScoped('/index.html'));
          if (fallback) return fallback;
        }
        throw e;
      }
    })()
  );
});
