var offlineFundamentals = [
  '/',
  '/css/view.css',
  '/js/view.js'
];

var version = 'v1::1::1::';

function precache() {
  return caches.open(version + 'fundamentals').then(function (cache) {
    return cache.addAll(offlineFundamentals);
  });
}
self.addEventListener('install', function installer (event) {
    event.waitUntil(precache().then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function activator (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys
        .filter(function (key) {
          return !key.startsWith(version);
        })
        .map(function (key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      return self.clients.matchAll().then(function(clients1) {
        return Promise.all(clients1.map(function(client) {
          return client.postMessage({"func":"msg","msg":"Ready For Offline"});
        }));
      });
    })
  );
});
self.addEventListener('fetch', function fetcher (event) {
  var request = event.request;
  const requestURL = new URL(event.request.url);
  if ((request.method !== 'GET') || (request.destination == "")) {
    return;
  }
  if(request.destination == "document"){
    return event.respondWith(caches.match('/'));
  }
  event.respondWith(async function() {
    const cachedResponse = await caches.match(event.request);
    return cachedResponse || fetch(event.request);
  }());
});
