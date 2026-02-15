const CACHE_NAME = 'studapp-v2';
const DYNAMIC_CACHE = 'studapp-dynamic-v2';

// Lista explícita de arquivos para garantir que o app funcione offline.
// Inclui bibliotecas externas (CDNs) e os arquivos fonte do projeto.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/manifest.json',
  '/types.ts',
  '/constants.ts',
  '/services/firebase.ts',
  '/components/AuthScreen.tsx',
  '/components/RoutineView.tsx',
  '/components/ReviewsView.tsx',
  // CDNs Críticos para o visual
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Instalação: Baixa e salva tudo da lista acima imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos Promise.all para que falhas em um arquivo não impeçam os outros de serem cacheados
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

// Ativação: Limpa caches antigos para garantir que a nova versão seja usada
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

// Fetch: A estratégia principal
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignorar chamadas de API de dados (Firebase Firestore / GenAI)
  // O SDK do Firebase já lida com persistência de dados (IndexedDB), não queremos cachear as requisições de rede dele.
  // Porém, queremos cachear os scripts JS do Firebase vindos do esm.sh.
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('firestore') ||
      (url.hostname.includes('firebase') && !url.hostname.includes('esm.sh'))) {
    return;
  }

  // 2. Requisições de Navegação (HTML) -> Network First, Fallback to Cache, Fallback to Index
  // Isso garante que se você der refresh offline, o app carrega o index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(res => {
                if (res) return res;
                return caches.match('/index.html'); // Fallback para SPA (Single Page App)
            });
        })
    );
    return;
  }

  // 3. Ativos Estáticos (JS, CSS, Fontes, Imagens) -> Cache First, Network Background
  // Tenta pegar do cache primeiro para velocidade máxima e suporte offline.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Se não estiver no cache, busca na rede e salva no cache dinâmico
      return fetch(event.request).then((response) => {
        // Verifica se a resposta é válida (status 0 é para respostas 'opaques' de CDNs como esm.sh/tailwindcss)
        if (!response || (response.status !== 200 && response.status !== 0)) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(err => {
         // Se falhar (offline) e não estiver no cache, não há muito o que fazer para assets novos
         console.log('Fetch falhou (offline):', event.request.url);
      });
    })
  );
});