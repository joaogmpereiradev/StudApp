const CACHE_NAME = 'studapp-v1';
const DYNAMIC_CACHE = 'studapp-dynamic-v1';

// Arquivos essenciais para o "Shell" do aplicativo
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NÃO fazer cache de requisições para a API do Firebase/Firestore ou GenAI (exceto os scripts do SDK)
  // O SDK do Firebase gerencia sua própria persistência offline (IndexedDB) para os dados.
  // Mas queremos cachear os scripts JS do Firebase vindos do esm.sh.
  if (url.hostname.includes('googleapis.com') || 
      (url.hostname.includes('firebase') && !url.hostname.includes('esm.sh')) || 
      url.hostname.includes('googleusercontent.com')) {
    return;
  }

  // Estratégia: Network First, falling back to Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, clonamos e salvamos no cache dinâmico.
        // Relaxamos a verificação para permitir scripts de CDNs externos (esm.sh) que podem ser cors ou opaque.
        if (!response || response.status !== 200 && response.status !== 0) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Se estiver offline e o fetch falhar, tenta retornar do cache
        return caches.match(event.request);
      })
  );
});