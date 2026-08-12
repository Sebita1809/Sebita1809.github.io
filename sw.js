// Service worker de la PWA — lo que hace posible "instalar" el juego en la
// pantalla de inicio del celular y que las actualizaciones futuras lleguen
// solas, sin reinstalar nada.
//
// Estrategia (a propósito simple, pensada para un juego chico de una sola
// persona, no para escala):
//   - HTML/JS/JSON (el código del juego): red primero, cae al cache solo
//     si no hay internet. Así un cambio de código se ve la PRÓXIMA VEZ que
//     abra el juego CON internet, sin depender de nada más.
//   - Todo lo demás (sprites, en su mayoría): cache primero, red si no
//     está cacheado. Son ~100 imágenes que cambian poco una vez creadas —
//     cachearlas de entrada evita volver a bajarlas cada vez.
//
// CACHE_VERSION: subila (v1 -> v2 -> ...) solo si alguna vez se REEMPLAZA
// el contenido de un sprite ya existente bajo el mismo nombre de archivo
// (agregar archivos nuevos no lo necesita — se cachean solos la primera
// vez que se piden). Subir la versión borra el cache viejo completo en
// 'activate', forzando a bajar todo de nuevo una vez.
const CACHE_VERSION = 'v1';
const CACHE_NAME = `juego-vero-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  // No esperar a que se cierren todas las pestañas/instancias abiertas —
  // la versión nueva se activa apenas termina de instalar.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isCodeRequest(request, url) {
  return request.mode === 'navigate' || /\.(js|html|json)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // no interceptar el CDN de Phaser ni nada externo

  if (isCodeRequest(event.request, url)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      }))
    );
  }
});
