// MesureCam service worker: offline app shell.
const VERSION = "mesurecam-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Pages: network first so updates arrive, cache when offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put("./index.html", copy)); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Other same-origin files: cache first.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
