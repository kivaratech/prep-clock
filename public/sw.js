const CACHE_NAME = 'prep-clock-v3';

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
// Cache-first for every same-origin GET request.
//   • Return from cache immediately if present.
//   • Otherwise fetch from network, store the response, then return it.
//   • For navigation requests (HTML), if both cache and network fail, fall back
//     to the cached root so the app shell still loads.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

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
        // Network failed — for navigation fall back to cached app shell
        if (request.mode === 'navigate') {
          const shell = await cache.match('/');
          if (shell) return shell;
        }
        // For other asset types there's nothing we can do
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })
  );
});
