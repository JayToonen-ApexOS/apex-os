// Apex OS — Service Worker
// Versie ophogen bij elke deployment zodat de cache ververst wordt
const CACHE_VERSION = 'v1';
const CACHE_NAME = `apex-os-${CACHE_VERSION}`;

// App-shell bestanden die altijd gecached worden
const PRECACHE_URLS = ['/', '/index.html', '/favicon.svg'];

// ── Install: precache app-shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: verwijder oude caches ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('apex-os-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-strategie ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Alleen GET requests; sla POST/PUT/DELETE over
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Sla niet-HTTP requests over (bijv. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // Laat alle externe requests volledig ongemoeid — GEEN respondWith aanroepen.
  // Firestore gebruikt streaming/WebSocket verbindingen die kapot gaan als de
  // SW ze onderschept. caches.match() geeft undefined terug voor onbekende
  // requests, wat de "Returned response is null" fout veroorzaakt.
  if (url.hostname !== self.location.hostname) return;

  // App-shell & static assets → Cache-first, update op achtergrond
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        // Sla succesvolle responses op in cache
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});

// ── Push: ontvang FCM pushmelding (fallback voor firebase-messaging-sw.js) ───
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: 'Apex OS', body: event.data.text() } };
  }

  const title = payload.notification?.title ?? 'Apex OS';
  const options = {
    body: payload.notification?.body ?? '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    tag: payload.data?.tag ?? 'apex-os',
    data: payload.data ?? {},
    actions: [{ action: 'open', title: 'Openen' }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click: open de app ─────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Breng bestaand venster naar voren, of open nieuw venster
        const existing = clientList.find(
          (c) => c.url.startsWith(self.location.origin) && 'focus' in c
        );
        if (existing) return existing.focus();
        return clients.openWindow('/');
      })
  );
});
