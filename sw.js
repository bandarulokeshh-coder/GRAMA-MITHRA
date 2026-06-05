/**
 * Grama Mitra – Service Worker
 * Strategy:
 *   • App shell (HTML/CSS/JS/fonts)  → Cache-first, update in background
 *   • Supabase API calls             → Network-first, fall back to cached response
 *   • Map tiles (OpenStreetMap)      → Cache-first (tiles rarely change)
 *   • Everything else                → Network-first, fall back to offline page
 */

const VERSION = "gm-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const API_CACHE = `${VERSION}-api`;
const TILES_CACHE = `${VERSION}-tiles`;

// Files to pre-cache on install (the "app shell")
const SHELL_URLS = [
  "/index.html",
  "/scheme.html",
  "/eligibility.html",
  "/manifest.json",
  "/sw.js",
  // Leaflet (loaded from CDN — we cache on first fetch instead)
];

// Offline fallback HTML — shown when a page request fails and isn't cached
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline – Grama Mitra</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;font-family:Inter,Arial,sans-serif}
    body{background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .card{background:white;border-radius:16px;padding:40px;max-width:480px;width:100%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.2)}
    .icon{font-size:4rem;margin-bottom:16px}
    h1{color:#1f3b73;font-size:1.6rem;margin-bottom:12px}
    p{color:#555;line-height:1.7;margin-bottom:24px}
    .cached-links{text-align:left;background:#f8f9fa;border-radius:10px;padding:16px;margin-bottom:24px}
    .cached-links h3{color:#1f3b73;font-size:1rem;margin-bottom:10px}
    .cached-links a{display:block;color:#667eea;text-decoration:none;padding:6px 0;font-weight:600;border-bottom:1px solid #eee}
    .cached-links a:last-child{border:none}
    button{background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;padding:12px 28px;border-radius:10px;cursor:pointer;font-size:1rem;font-weight:600}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📶</div>
    <h1>You're offline</h1>
    <p>No internet connection detected. You can still access pages you've visited before.</p>
    <div class="cached-links">
      <h3>📁 Available offline:</h3>
      <a href="/index.html">🏠 Home – Browse Schemes</a>
      <a href="/eligibility.html">🎯 Check Eligibility</a>
    </div>
    <p style="font-size:.85rem;color:#888;margin-bottom:16px">
      Scheme details you've already opened will also load from cache.
    </p>
    <button onclick="location.reload()">↻ Try again</button>
  </div>
</body>
</html>`;

// ── Install: pre-cache the app shell ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => {
        // Use individual adds so one 404 doesn't break the whole install
        return Promise.allSettled(
          SHELL_URLS.map((url) =>
            cache
              .add(url)
              .catch((err) => console.warn(`SW: failed to cache ${url}:`, err)),
          ),
        );
      })
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const KEEP = [SHELL_CACHE, API_CACHE, TILES_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: routing logic ──────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // 1. Supabase API → Network-first, cache response for offline fallback
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // 2. OpenStreetMap / Overpass / Nominatim tiles & geo → Cache-first
  if (
    url.hostname.includes("tile.openstreetmap.org") ||
    url.hostname.includes("overpass-api.de") ||
    url.hostname.includes("nominatim.openstreetmap.org")
  ) {
    event.respondWith(cacheFirstWithNetwork(request, TILES_CACHE));
    return;
  }

  // 3. CDN assets (Leaflet, fonts) → Cache-first
  if (
    url.hostname.includes("cdnjs.cloudflare.com") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(cacheFirstWithNetwork(request, SHELL_CACHE));
    return;
  }

  // 4. Same-origin HTML pages → Network-first, offline fallback page
  if (
    url.origin === self.location.origin &&
    request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // 5. Same-origin assets (JS, CSS, images) → Cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstWithNetwork(request, SHELL_CACHE));
    return;
  }
});

// ── Strategy helpers ──────────────────────────────────────────────────────────

/** Try network; on failure return cached version if available. */
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkRes = await fetch(request);
    if (networkRes.ok) cache.put(request, networkRes.clone());
    return networkRes;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Return empty JSON array so pages degrade gracefully
    return new Response("[]", {
      headers: { "Content-Type": "application/json" },
    });
  }
}

/** Serve from cache if available; fetch & store if not. */
async function cacheFirstWithNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const networkRes = await fetch(request);
    if (networkRes.ok) cache.put(request, networkRes.clone());
    return networkRes;
  } catch {
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

/** Network-first for HTML; show branded offline page on failure. */
async function networkFirstWithOfflineFallback(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const networkRes = await fetch(request);
    if (networkRes.ok) cache.put(request, networkRes.clone());
    return networkRes;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(OFFLINE_HTML, {
      headers: { "Content-Type": "text/html" },
    });
  }
}
