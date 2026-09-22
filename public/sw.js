// public/sw.js
//
// Minimal service worker — just enough to make Plugr installable (a fetch
// handler that responds + a manifest with the right fields). Not
// offline-first. Registered with scope '/app/' from
// components/pwa/register-service-worker.tsx, so marketing/funnel pages
// (waitlist, find, become-a-plug, demo) are never touched by this SW or its
// cache, even though the file itself is served from the site root.

const CACHE_NAME = 'plugr-app-v1';
const STATIC_CACHE_PATTERNS = [/\.(?:png|jpg|jpeg|svg|ico|woff2?|css|js)$/];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isStaticAsset = STATIC_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));

  if (isStaticAsset) {
    // Cache-first: icons/fonts/bundles don't change under a given deploy hash.
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Network-first: navigations and API calls always try live data. Only
  // fall back to cache if the network request fails (offline).
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});