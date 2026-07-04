const CACHE_NAME = 'dexco-ativos-v36';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 1. Instalação do Service Worker (Prepara o Terreno)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Não usamos skipWaiting() aqui diretamente para evitar recarregar a app na cara do utilizador.
    // Ele será chamado apenas quando o utilizador clicar em "RECARREGAR" no toast.
});

// 2. Ativação (Limpeza de Caches Antigos)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    // Toma o controlo imediato dos clientes abertos
    event.waitUntil(self.clients.claim());
});

// 3. Intercetador de Rede (Obrigatório para PWA Installable)
self.addEventListener('fetch', (event) => {
    // Ignora requisições para o Firebase ou outras APIs externas (deixa passar direto)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Estratégia: Stale-While-Revalidate (Retorna rápido do cache e atualiza por trás)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // Se falhar (offline), simplesmente cai silenciosamente, pois o cache já foi retornado
            });
            
            return cachedResponse || fetchPromise;
        })
    );
});

// 4. Conexão com o "Toast" de Atualização do Front-end
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
