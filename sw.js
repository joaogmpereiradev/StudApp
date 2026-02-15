const CACHE_NAME = 'studapp-v3';
const DYNAMIC_CACHE = 'studapp-dynamic-v3';

// Lista simplificada de arquivos essenciais.
// Usamos caminhos relativos (./) para evitar problemas de subdiretório ou proxy.
// Scripts dinâmicos (.tsx, .js) serão cacheados em tempo de execução (runtime caching).
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // CDNs Críticos
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Instalação: Baixa e salva o Shell do app
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => {
            console.warn('Falha ao cachear recurso na instalação:', url, err);
          });
        })
      );
    })
  );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

// Fetch: Intercepta e serve do cache ou rede
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignorar chamadas de API do Firebase/Google (Dados)
  // O SDK do Firebase gerencia sua própria persistência (IndexedDB).
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('firestore') ||
      (url.hostname.includes('firebase') && !url.hostname.includes('esm.sh'))) {
    return;
  }

  // 2. Requisições de Navegação (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(res => {
                if (res) return res;
                return caches.match('./index.html'); // Fallback para SPA usando caminho relativo
            });
        })
    );
    return;
  }

  // 3. Ativos (JS, CSS, Imagens, Fontes) -> Cache First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cacheia respostas válidas (incluindo opaque responses de CDNs com status 0)
        if (!response || (response.status !== 200 && response.status !== 0)) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Falha silenciosa para assets secundários se offline
      });
    })
  );
});