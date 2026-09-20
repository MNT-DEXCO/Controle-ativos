const CACHE_NAME = 'dexco-ativos-v5';
const CORE_ASSETS = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-192.png','./icon-maskable-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(
    names.filter(name => name.startsWith('dexco-ativos-') && name !== CACHE_NAME).map(name => caches.delete(name))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || url.pathname.endsWith('/manifest.json')) {
    event.respondWith(fetch(request).then(response => {
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request,copy));
      return response;
    }).catch(() => caches.match(request).then(r => r || caches.match('./index.html'))));
    return;
  }

  event.respondWith(caches.match(request).then(cached => {
    const network=fetch(request).then(response => {
      if (response && response.ok) {
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request,copy));
      }
      return response;
    }).catch(() => cached);
    return cached || network;
  }));
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') self.skipWaiting();
});
