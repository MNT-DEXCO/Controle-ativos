const CACHE_NAME = 'dexco-ativos-v1';
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// Instalação do Service Worker e Caching inicial
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
            .catch(err => console.log('Falha ao armazenar em cache: ', err))
    );
});

// Limpeza de Caches antigos (quando lançarmos v2, v3...)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Estratégia Stale-While-Revalidate (Carrega rápido do Cache e atualiza em background)
self.addEventListener('fetch', event => {
    // Ignora requisições para o Firebase e outras APIs externas dinâmicas
    if (event.request.url.includes('firestore.googleapis.com') || 
        event.request.url.includes('firebasestorage.googleapis.com')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Falha de rede silenciosa.
            });
            return cachedResponse || fetchPromise;
        })
    );
});

// OUVINTE SECRETO: Permite que o app injete a atualização silenciosamente
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
