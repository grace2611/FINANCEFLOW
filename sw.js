/*
==========================================
FinanceFlow
Archivo: sw.js  (Service Worker)

Qué hace:
- Guarda en caché SOLO archivos estáticos de la interfaz
  (HTML, CSS, JS, iconos, fuente y el código del SDK de Firebase).
- NUNCA toca las solicitudes dinámicas de Firebase
  (Authentication, Firestore, tokens): pasan directo a la red.
- Solo atiende solicitudes GET.

Estrategias:
- Navegación (index.html): red primero → si no hay Internet, usa la
  copia guardada. Así siempre recibes la última versión publicada.
- Archivos estáticos propios: se sirven de la caché al instante y se
  revalidan en segundo plano (la siguiente apertura ya trae lo nuevo).
- SDK de Firebase (gstatic, versión fija) y fuente de Google: caché.

PARA PUBLICAR UNA ACTUALIZACIÓN: sube tus cambios y, si quieres que se
renueve todo de inmediato, cambia CACHE_VERSION (por ejemplo v2 → v3).
Las cachés antiguas se borran solas.
==========================================
*/

const CACHE_VERSION = "v1";

const STATIC_CACHE = "financeflow-static-" + CACHE_VERSION;

const RUNTIME_CACHE = "financeflow-runtime-" + CACHE_VERSION;

/* Rutas relativas al lugar donde vive sw.js (sirve en GitHub Pages
   dentro de /nombre-del-repositorio/ y también en localhost). */

const PRECACHE = [
    "./",
    "index.html",
    "manifest.json",
    "assets/icons/icon-192.png",
    "assets/icons/icon-512.png",
    "assets/icons/apple-touch-icon.png",
    "css/variables.css",
    "css/main.css",
    "css/cards.css",
    "css/dashboard-summary-cards.css",
    "css/dashboard-budget-tracker.css",
    "css/tables.css",
    "css/charts.css",
    "css/animations.css",
    "css/components.css",
    "css/forms.css",
    "css/layout.css",
    "css/modal.css",
    "css/pages.css",
    "css/responsive.css",
    "css/sidebar.css",
    "css/dashboard-layout.css",
    "css/notifications-events.css",
    "css/dashboard-refined.css",
    "css/sidebar-modern.css",
    "css/pages-refined.css",
    "css/calendar-view.css",
    "css/auth.css",
    "css/theme-dark.css",
    "css/responsive-final.css",
    "js/data.js",
    "js/services/cloud-sync.js",
    "js/utils.js",
    "js/modules/accounts.js",
    "js/modules/movements.js",
    "js/modules/goals.js",
    "js/modules/loans.js",
    "js/modules/credit.js",
    "js/modules/calendar.js",
    "js/ui.js",
    "js/dashboard-summary-cards.js",
    "js/dashboard-budget-tracker.js",
    "js/app.js",
    "js/dashboard-carousels.js",
    "js/dashboard-layout.js",
    "js/dashboard-scroll.js",
    "js/theme.js",
    "js/mobile-nav.js",
    "js/services/firebase.js",
    "js/auth.js",
    "js/pwa.js"
];

/* Solo estos orígenes externos se guardan (código estático, sin datos
   del usuario). Todo lo demás de otros orígenes NO se intercepta. */

function isCacheableExternal(url) {

    if (url.hostname === "www.gstatic.com") {

        return url.pathname.startsWith("/firebasejs/");

    }

    return (
        url.hostname === "fonts.googleapis.com" ||
        url.hostname === "fonts.gstatic.com"
    );

}


self.addEventListener("install", event => {

    event.waitUntil((async () => {

        const cache = await caches.open(STATIC_CACHE);

        /* Si un archivo falla no se rompe la instalación completa */

        await Promise.allSettled(
            PRECACHE.map(path =>
                cache.add(new Request(path, { cache: "reload" }))
            )
        );

        await self.skipWaiting();

    })());

});


self.addEventListener("activate", event => {

    event.waitUntil((async () => {

        const keep = [STATIC_CACHE, RUNTIME_CACHE];

        const names = await caches.keys();

        await Promise.all(
            names
                .filter(name => name.startsWith("financeflow-") && !keep.includes(name))
                .map(name => caches.delete(name))
        );

        await self.clients.claim();

    })());

});


self.addEventListener("fetch", event => {

    const request = event.request;

    if (request.method !== "GET") {

        return;

    }

    const url = new URL(request.url);

    const sameOrigin = url.origin === self.location.origin;

    if (!sameOrigin && !isCacheableExternal(url)) {

        /* Firebase Auth / Firestore / cualquier API: directo a la red */

        return;

    }

    /* Navegación: red primero, copia guardada si no hay conexión */

    if (request.mode === "navigate") {

        event.respondWith(networkFirstPage(request));

        return;

    }

    if (sameOrigin) {

        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));

        return;

    }

    /* SDK de Firebase (versión fija) y fuente: caché primero */

    event.respondWith(cacheFirst(request, RUNTIME_CACHE));

});


async function networkFirstPage(request) {

    const cache = await caches.open(STATIC_CACHE);

    try {

        const response = await fetch(request, { cache: "no-cache" });

        if (response && response.ok) {

            cache.put("index.html", response.clone());

        }

        return response;

    } catch (error) {

        const cached =
            (await cache.match("index.html")) ||
            (await cache.match("./"));

        if (cached) {

            return cached;

        }

        throw error;

    }

}


async function staleWhileRevalidate(request, cacheName) {

    const cache = await caches.open(cacheName);

    const cached = await cache.match(request);

    const refresh = fetch(request, { cache: "no-cache" })
        .then(response => {

            if (response && response.ok) {

                cache.put(request, response.clone());

            }

            return response;

        })
        .catch(() => null);

    if (cached) {

        /* Se mantiene viva la revalidación aunque ya respondimos */

        refresh.catch(() => {});

        return cached;

    }

    const response = await refresh;

    return response || Response.error();

}


async function cacheFirst(request, cacheName) {

    const cache = await caches.open(cacheName);

    const cached = await cache.match(request);

    if (cached) {

        return cached;

    }

    const response = await fetch(request);

    if (response && (response.ok || response.type === "opaque")) {

        cache.put(request, response.clone());

    }

    return response;

}
