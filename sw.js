const CACHE_NAME = 'dexco-ativos-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    // Apaga qualquer cache antigo exclusivo de ativos
                    if (cache !== CACHE_NAME && cache.startsWith('dexco-ativos-')) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Ignora as chamadas do Firebase para manter o banco de dados em tempo real
    if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => { });
            
            return cachedResponse || fetchPromise;
        })
    );
});

self.addEventListener('message', (event) => {
    // Ouve o comando disparado pelo botão do Toast "NOVA ATUALIZAÇÃO"
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
