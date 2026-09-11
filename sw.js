// Service Worker - Mental Palace
// Mode offline complet, mais TOUJOURS la dernière version quand le réseau répond.
//
// Stratégie :
// - Fichiers de l'app (même origine) : réseau d'abord, cache en secours.
//   Un fichier modifié est donc visible dès le prochain chargement.
// - Ressources externes (police Google) : cache d'abord, réseau en secours.

const CACHE_NAME = 'mental-palace-v11'; // v11 : emoji des pièces
// Même ?v= que dans index.html
const V = '11';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css?v=' + V,
  './js/app.js?v=' + V,
  './js/kawaii.js?v=' + V,
  './data/lieux.js?v=' + V,
  './manifest.json'
];

// Installation : mise en cache des fichiers, en forçant le réseau
// (cache: 'reload' ignore le cache HTTP du navigateur)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches, prise de contrôle immédiate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const sameOrigin = new URL(request.url).origin === self.location.origin;

  if (sameOrigin) {
    // Réseau d'abord, cache en secours
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('./index.html');
        }))
    );
    return;
  }

  // Externe (police) : cache d'abord, réseau en secours
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
