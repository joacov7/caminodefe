/*
 * Service worker de Camino de Fe (escrito a mano, sin dependencias).
 *
 * Política de caché (privacidad primero):
 * - Recursos estáticos (/_next/static, íconos, fuentes): cache-first.
 * - Páginas PÚBLICAS de lectura (/biblia, /contenidos, /privacidad): red primero
 *   y copia local para leer sin conexión.
 * - NUNCA se guardan páginas con datos personales (/perfil, /mi-camino,
 *   /asistente, /camino, /planes, /pastoral, /admin) ni respuestas de /api.
 * - Sin red y sin copia: /sin-conexion.
 */
const VERSION = "cdf-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const OFFLINE_URL = "/sin-conexion";

const CACHEABLE_PAGES = [/^\/biblia(\/|$)/, /^\/contenidos(\/|$)/, /^\/privacidad$/, /^\/sin-conexion$/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => c.addAll([OFFLINE_URL, "/biblia"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Al cerrar sesión la app pide borrar copias locales.
self.addEventListener("message", (event) => {
  if (event.data === "clear-pages") event.waitUntil(caches.delete(PAGES));
});

function isStatic(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/icon.svg";
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  const isPage = req.mode === "navigate" || req.headers.get("RSC") === "1";
  if (!isPage) return;
  const cacheable = CACHEABLE_PAGES.some((re) => re.test(url.pathname));

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (cacheable && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        if (cacheable) {
          const hit = await caches.match(req);
          if (hit) return hit;
        }
        if (req.mode === "navigate") {
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
        }
        return Response.error();
      }),
  );
});
