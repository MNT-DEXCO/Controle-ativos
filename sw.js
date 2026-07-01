const CACHE_NAME = 'dexco-ativos-v36';

// Ficheiros essenciais para guardar no telemóvel e permitir carregamento offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 1. Instalação: Ocorre quando o telemóvel descarrega o SW pela primeira vez (ou uma nova versão)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] A guardar assets em cache para modo offline');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Ativação: Ocorre quando a nova versão do SW assume o controlo. Limpa caches antigos.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] A remover cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Estratégia "Network First" (Tenta a internet primeiro, se falhar usa o Cache)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a resposta for válida, guardamos um clone no cache para atualizar os dados offline
        if (event.request.method === 'GET' && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se o utilizador estiver offline, servimos o ficheiro guardado localmente
        return caches.match(event.request);
      })
  );
});

// 4. O Pulo do Gato (V36): Recebe o comando do index.html para forçar a atualização silenciosa
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[Service Worker] Ordem recebida: A forçar ativação imediata da nova versão.');
    self.skipWaiting();
  }
});
