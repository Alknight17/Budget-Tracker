// variables for static and data caches
const Static_Cache = "static-cache";
const Data_Cache = "data-cache";

// gather all files that need to be sent to a cache
const Cache_Files = [
  "/",
  "index.html",
  "/css/styles.css",
  "/js/index.js",
  "/js/idb.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
];

// install service worker
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(Static_Cache).then((cache) => {
      return cache.addAll(Cache_Files);
    })
  );
  self.skipWaiting();
});

// activate service worker
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== Static_Cache && key !== Data_Cache) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// fetch GET requests and cache
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/") && e.request.method === "GET") {
    e.respondWith(
      caches
        .open(Data_Cache)
        .then((cache) => {
          return fetch(e.request)
            .then((response) => {
              if (response.status === 200) {
                cache.put(e.request, response.clone());
              }
              return response;
            })
            .catch(() => {
              return cache.match(e.request);
            });
        })
        .catch((err) => console.log(err))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
