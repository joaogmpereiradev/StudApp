const CACHE_NAME = 'studapp-v8';
const DYNAMIC_CACHE = 'studapp-dynamic-v8';

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
  // Bibliotecas Críticas
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  // React Core
  'https://esm.sh/react@^19.2.4',
  'https://esm.sh/react-dom@^19.2.4/',
  // Firebase
  'https://esm.sh/firebase@^12.9.0/compat/app',
  'https://esm.sh/firebase@^12.9.0/compat/auth',
  'https://esm.sh/firebase@^12.9.0/compat/firestore',
  // Excel Export
  'https://esm.sh/xlsx@0.18.5'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => {
            console.warn('Falha no precache (pode ser carregado dinamicamente depois):', url);
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
    return;
  }

  // 1. Ignorar chamadas de API do Google/Firestore (Dados dinâmicos)
  if (url.hostname.includes('googleapis.com') || 
      (url.hostname.includes('firestore.googleapis.com')) || 
      (url.hostname.includes('firebase') && !url.hostname.includes('esm.sh'))) {
    return;
  }

  // 2. Navegação (HTML) -> Network First, Fallback Cache
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

  // 3. Stale-While-Revalidate para Arquivos Estáticos e Libs
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
           const responseToCache = networkResponse.clone();
           caches.open(DYNAMIC_CACHE).then((cache) => {
               try { cache.put(event.request, responseToCache); } catch(e){}
           });
        }
        return networkResponse;
      }).catch(() => {
      });

      return cachedResponse || fetchPromise;
    })
  );
});