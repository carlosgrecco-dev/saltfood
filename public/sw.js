const CACHE_NAME = 'saltfood-v2';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/saltfood-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Network-first para chamadas de API (Supabase), cache-first para o app shell.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache API só aceita http/https — ignora chrome-extension://, blob:, etc.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  if (url.origin.includes('supabase.co')) {
    return; // nunca cachear chamadas ao banco/API
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone).catch(() => {}));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
