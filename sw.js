const CACHE = "orange-hunt-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./game.js",
  "./style.css",
  "./orange.png",
  "./bomb.png",
  "./background.png",
  "./pop.mp3",
  "./background.mp3",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // The game itself is fully local: cache-first so it plays offline.
  // Cross-origin requests (the Google Font) are cached at runtime the same way.
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((r) => {
        const cp = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, cp));
        return r;
      });
    })
  );
});
