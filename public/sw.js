// Kali Nexus Service Worker — Network-first strategy (always get latest)
const CACHE_NAME = 'kali-nexus-v2';

// Skip waiting on install to activate immediately
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache API, WebSocket, or health check
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/terminal') ||
    url.pathname.startsWith('/metasploit') ||
    url.pathname.startsWith('/wireshark') ||
    url.pathname.startsWith('/health')
  ) {
    return; // Let browser handle natively
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Network-first for everything else (so updates are always seen)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: try cache, then index.html
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('/index.html');
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

// Allow page to trigger skipWaiting
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
