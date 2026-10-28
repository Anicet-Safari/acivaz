// Acivaz offline cache. Bump VERSION when you publish changes.
const VERSION = "acivaz-v22";
const SHELL = [
  "./", "index.html", "manifest.webmanifest",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon-32.png",
  "vendor/cpexcel.js", "vendor/xlsx.bundle.js", "vendor/jspdf.umd.min.js", "vendor/pdf-lib.min.js",
  "fonts/fonts.css",
  "fonts/source-serif-4-latin-500-normal.woff2", "fonts/source-serif-4-latin-600-normal.woff2", "fonts/source-serif-4-latin-700-normal.woff2",
  "fonts/ibm-plex-sans-latin-400-normal.woff2", "fonts/ibm-plex-sans-latin-500-normal.woff2", "fonts/ibm-plex-sans-latin-600-normal.woff2",
  "fonts/ibm-plex-mono-latin-400-normal.woff2", "fonts/ibm-plex-mono-latin-500-normal.woff2"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Anonymous visit counts go straight to the network, never into the cache
  if (/goatcounter\.com|gc\.zgo\.at/.test(req.url)) return;
  if (req.mode === "navigate") {
    // Network first so updates arrive; fall back to the cached app offline.
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); return res; })
      .catch(() => caches.match("index.html").then(r => r || caches.match("./"))));
    return;
  }
  // Everything else: cache first, then network, keeping a copy (fonts, libraries, icons).
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
