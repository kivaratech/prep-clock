const CACHE_NAME = 'shelf-life-timer-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/style.css',
  '/manifest.json',
  '/alert1.wav',
  '/alert2.mp3',
  '/alert3.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});