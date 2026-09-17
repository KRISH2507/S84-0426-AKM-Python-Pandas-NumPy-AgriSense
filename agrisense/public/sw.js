// AgriSense Progressive Web App (PWA) Service Worker
const CACHE_NAME = "agrisense-v1";
const OFFLINE_URLS = [
  "/",
  "/dashboard",
  "/mandi",
  "/subsidies",
  "/advisor",
  "/profile",
  "/globals.css",
  "/manifest.json"
];

// Install Event: Pre-cache essential offline shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline pages");
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn("[Service Worker] Pre-cache non-fatal warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-first with cache fallback for offline reliability
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === "navigate") {
            return caches.match("/dashboard");
          }
        });
      })
  );
});
