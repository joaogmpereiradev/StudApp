const CACHE_NAME = 'studapp-v6';
const DYNAMIC_CACHE = 'studapp-dynamic-v6';

// Arquivos para cache na instalação
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.ts',
  './services/firebase.ts',
  './components/AuthScreen.tsx',
  './components/RoutineView.tsx',
  './components/ReviewsView.tsx',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => {
            console.warn('Falha no precache:', url);
          });
        })
      );
    })
  );
});

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

self.addEventListener('fetch', (event) => {
  let url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    // Se a URL for inválida (ex: data:, blob: ou algo estranho), ignoramos
    return;
  }

  // 1. Ignorar APIs externas de dados (Firestore, Google AI, Auth)
  // Permitimos esm.sh para cachear as bibliotecas JS
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('firestore') ||
      (url.hostname.includes('firebase') && !url.hostname.includes('esm.sh'))) {
    return;
  }

  // 2. Navegação (HTML) -> Network First com fallback para Cache ou Index
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

  // 3. Cache First para todo o resto (JS, CSS, Imagens)
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

        // Não cachear requisições POST/PUT etc
        if (event.request.method !== 'GET') {
            return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
            try {
                cache.put(event.request, responseToCache);
            } catch (err) {
                // Ignora erros de quota
            }
        });

        return response;
      }).catch(() => {
        // Falha silenciosa offline
      });
    })
  );
});