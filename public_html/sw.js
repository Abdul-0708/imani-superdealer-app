/* IMANI SUPERDEALER - service worker.
 * Strategy: NETWORK FIRST for everything. While online users always get the
 * newest deployed version; the cache is only an offline fallback for the app
 * shell. API responses are never cached - stale business data is worse than
 * an honest "no connection" message. */
var CACHE = 'imani-v29';

self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                       /* POSTs: network only */
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;             /* CDN: browser handles */
  if (url.pathname.indexOf('api.php') !== -1) return;     /* never cache data */
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || Response.error();
      });
    })
  );
});
