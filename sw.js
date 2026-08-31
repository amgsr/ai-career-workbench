var CACHE_VERSION = 'v1-' + Date.now();
var STATIC_CACHE = 'workbench-static-' + CACHE_VERSION;
var STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon-512.jpg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          return key !== STATIC_CACHE;
        }).map(function (key) {
          return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  if (url.pathname.indexOf('/api/') !== -1) {
    return;
  }

  if (e.request.method !== 'GET') {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fetchPromise = fetch(e.request).then(function (response) {
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(STATIC_CACHE).then(function (cache) {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      }).catch(function () {
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});
