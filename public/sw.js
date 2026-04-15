const CACHE_NAME = 'shelf-life-timer-v2';
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/style.css',
  '/manifest.json'
];
const AUDIO_ASSETS = [
  '/alert1.wav',
  '/alert2.mp3',
  '/alert3.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).then(() => {
        cache.addAll(AUDIO_ASSETS).catch(() => {});
      });
    }).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (url.origin !== self.location.origin) {
    return;
  }
  
  if (request.method !== 'GET') {
    return;
  }
  
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned)).catch(() => {});
          return response;
        }).catch(() => caches.match('/index.html'))
      })
    );
  } else {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned)).catch(() => {});
          return response;
        }).catch(() => caches.match(request))
      })
    );
  }
});