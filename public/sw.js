/* Service worker: makes the app load offline once it has been opened.
 * The two placeholders below are filled in by scripts/pwa-postexport.mjs. */
const BUILD_ID = "__BUILD_ID__";
const PRECACHE = __PRECACHE__;
const CACHE = `opentempo-${BUILD_ID}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Only handle our own origin: API calls (login, sync) always go to the network.
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return;

  // Page loads: network first so a new deploy shows up, cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html").then((r) => r || Response.error())),
    );
    return;
  }

  // Everything else (hashed JS, fonts, images, icons): cache first, fill on miss.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
