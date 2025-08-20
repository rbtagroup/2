const CACHE_NAME = 'rb-taxi-cache-v6ee';
const ASSETS = [
  'index.html',
  'style.css?v=10.2.2',
  'app.js?v=10.2.2',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});


self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    self.clients.matchAll({type:'window'}).then(clients => {
      clients.forEach(client => client.postMessage({type:'RELOAD'}));
    });
  }
});
