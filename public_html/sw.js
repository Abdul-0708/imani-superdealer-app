/* IMANI SUPERDEALER - service worker.
 * Strategy: NETWORK FIRST for everything. While online users always get the
 * newest deployed version; the cache is only an offline fallback for the app
 * shell. API responses are never cached - stale business data is worse than
 * an honest "no connection" message. */
var CACHE = 'imani-v82';

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
  /*
   * NETWORK FIRST, BUT NOT NETWORK FOREVER.
   *
   * fetch() has no timeout. On a good connection that is fine and on a dead
   * one it rejects quickly, but the connection that actually hurts is the one
   * in between - the packets go out and nothing comes back. fetch() does not
   * reject, so the catch() below never ran, the cached copy underneath was
   * never reached, and the app hung on its own splash screen with a perfectly
   * good copy of itself sitting on the phone.
   *
   * So the network gets a few seconds to be better than the cache. If it is
   * not, the cache answers and the officer gets on with his round; the fetch
   * is left running and still refreshes the cache if it ever lands.
   */
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
      if (!hit) return net.catch(function () { return Response.error(); });
      /* we hold a copy: let the network try, but not indefinitely */
      return Promise.race([
        net.catch(function () { return hit; }),
        new Promise(function (resolve) { setTimeout(function () { resolve(hit); }, 4000); })
      ]);
    })
  );
});
