var offlineFundamentals = [
  '/',
  '/css/view.css',
  '/js/view.js',
  '/images/touch/icon-128x128.png',
  '/images/touch/icon-192x192.png',
  '/images/touch/icon-256x256.png',
  '/images/touch/icon-384x384.png',
  '/images/touch/icon-512x512.png'
];
var version = 'v1::';
self.addEventListener('install', function installer (event) {
  event.waitUntil(
    caches
      .open(version + 'fundamentals')
      .then(function prefill (cache) {
        return cache.addAll(offlineFundamentals);
      })
  );
});

self.addEventListener('activate', function activator (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys
        .filter(function (key) {
          return key.indexOf(version) !== 0;
        })
        .map(function (key) {
          return caches.delete(key);
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function fetcher (event) {
  var request = event.request;
  if (request.method !== 'GET') {
    event.respondWith(fetch(request)); return;
  }
  const requestURL = new URL(event.request.url);
  if(requestURL.pathname == '/'){
    return event.respondWith(caches.match('/'));
  }
  event.respondWith(async function() {
    const cachedResponse = await caches.match(event.request);
    return cachedResponse || fetch(event.request);
  }());
});