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
        // Sem isso, uma falha de rede sem nada em cache tentava resolver com `undefined`,
        // e o navegador acusava "Failed to convert value to 'Response'".
        .catch(() => cached || Response.error());
      return cached || networkFetch;
    })
  );
});

// Notificação push (atualização de status do pedido) — o payload vem como JSON de notificarPedido().
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'SaltFood', {
      body: payload.body,
      icon: '/saltfood-icon.png',
      badge: '/saltfood-icon.png',
      data: { url: payload.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (!url) return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
