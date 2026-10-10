/*
==========================================
FinanceFlow
Archivo: pwa.js

Registra el service worker (solo en http/https; no en file://).
No recarga la página automáticamente: la nueva versión se usa
la próxima vez que abras la app.
==========================================
*/

(function () {
    "use strict";

    if (!("serviceWorker" in navigator)) return;

    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;

    window.addEventListener("load", function () {

        // Ruta relativa: funciona en /repositorio/ (GitHub Pages) y en localhost
        navigator.serviceWorker.register("sw.js", { scope: "./" })
            .catch(function (error) {
                console.warn("FinanceFlow: no se pudo registrar el service worker", error);
            });

    });
})();
