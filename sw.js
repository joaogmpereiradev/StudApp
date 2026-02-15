const CACHE_NAME = 'studapp-v4';
const DYNAMIC_CACHE = 'studapp-dynamic-v4';

// Lista de arquivos essenciais para o funcionamento offline.
// Incluímos explicitamente os arquivos fonte (.tsx) porque neste ambiente
// o navegador baixa os módulos individualmente.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Código Fonte (Essencial para carregar a lógica offline neste ambiente)
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.ts',
  './services/firebase.ts',
  './components/AuthScreen.tsx',
  './components/RoutineView.tsx',
  './components/ReviewsView.tsx',
  // CDNs Críticos
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Instalação: Baixa e salva todos os arquivos listados
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

// Fetch: Intercepta requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignorar APIs de dados (Firebase/Google)
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('firestore') ||
      (url.hostname.includes('firebase') && !url.hostname.includes('esm.sh'))) {
    return;
  }

  // 2. Requisições de Navegação (HTML) -> Network First, Fallback to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(res => {
                if (res) return res;
                return caches.match('./index.html');
            });
        })
    );
    return;
  }

  // 3. Ativos e Scripts -> Cache First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cacheia respostas válidas
        if (!response || (response.status !== 200 && response.status !== 0)) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Falha silenciosa offline
      });
    })
  );
});