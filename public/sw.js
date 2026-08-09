const CACHE_NAME = 'kali-linux-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Network first for API, cache first for others
  if (event.request.url.includes('/api') || event.request.url.includes('/terminal') || event.request.url.includes('/health')) {
    return event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request).catch(() => caches.match('/index.html')))
  );
});
