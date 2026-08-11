const CACHE_NAME = "matchconnect-v3";

const urlsToCache = [
"./",
"./index.html",
"./index.css",
"./index.js"
];

self.addEventListener("install", event => {

self.skipWaiting();

event.waitUntil(
caches.open(CACHE_NAME)
.then(cache => cache.addAll(urlsToCache))
);

});

self.addEventListener("activate", event => {

event.waitUntil(

caches.keys().then(cacheNames => {

  return Promise.all(

    cacheNames.map(cacheName => {

      if (cacheName !== CACHE_NAME) {

        return caches.delete(cacheName);

      }

    })

  );

}).then(() => {

  return self.clients.claim();

})

);

});

self.addEventListener("fetch", event => {

// Always get HTML, JavaScript and CSS
// from the network first.
if (
event.request.method === "GET" &&
(
event.request.destination === "script" ||
event.request.destination === "style" ||
event.request.destination === "document"
)
) {

event.respondWith(

  fetch(event.request)
    .then(response => {

      return response;

    })
    .catch(() => {

      return caches.match(event.request);

    })

);

return;

}

// Other files can use the cache first.
event.respondWith(

caches.match(event.request)
  .then(response => {

    return response || fetch(event.request);

  })

);

});
