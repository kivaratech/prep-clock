const CACHE_NAME = 'prep-clock-v4';

// Static assets in /public — known paths, no hashing, must all cache on install.
// JS/CSS and Vite-transformed modules are caught by the runtime fetch handler below.
const PRECACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

const PRECACHE_OPTIONAL = [
  '/alert1.wav',
  '/alert2.mp3',
  '/alert3.mp3',
];

// ── Install ──────────────────────────────────────────────────────────────────
// Cache required assets first; if any fail, the install fails so we never
// activate a SW with an incomplete cache.  Audio is best-effort.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(PRECACHE);
      await Promise.allSettled(PRECACHE_OPTIONAL.map((url) => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
// Delete every cache that isn't the current version, then take control of all
// open tabs immediately so they don't keep using a stale SW.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
// Navigations (HTML): network-first, so a manual reload while online always
//   picks up the latest deploy with no CACHE_NAME bump needed; falls back to
//   the cached shell when offline.
// Everything else (hashed assets, audio, icons): cache-first.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await cache.match(request) || await cache.match('/');
          return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        // Only cache valid responses (not opaque/error responses)
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })
  );
});
