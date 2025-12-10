const CACHE_NAME = 'knee-oa-cache-v9';
const URLS_TO_CACHE = [
  'index.html',
  'app.js',
  'manifest.json',
  'logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
