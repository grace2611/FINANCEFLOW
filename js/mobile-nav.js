/*
==========================================
FinanceFlow
Archivo: mobile-nav.js

En celular la barra inferior se desplaza en horizontal (tiene las
10 secciones). Este script centra la sección activa al cambiar de
página para que siempre sea visible. No toca datos ni navegación.
==========================================
*/
(function () {
    "use strict";

    function centerActive() {
        var menu = document.querySelector(".sidebar-menu");
        var active = menu && menu.querySelector("li.active");
        if (!active) return;

        // Barra inferior (celular): desplazamiento horizontal
        if (menu.scrollWidth > menu.clientWidth + 1) {
            var left = active.offsetLeft - (menu.clientWidth - active.offsetWidth) / 2;
            menu.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
        }

        // Menú lateral (tablet / celular horizontal): desplazamiento vertical
        if (menu.scrollHeight > menu.clientHeight + 1) {
            var top = active.offsetTop - (menu.clientHeight - active.offsetHeight) / 2;
            menu.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        }
    }

    document.addEventListener("click", function (event) {
        if (event.target.closest(".sidebar-menu li, [data-view]")) {
            setTimeout(centerActive, 60);
        }
    }, { passive: true });

    window.addEventListener("load", centerActive);
})();
