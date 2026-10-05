/*
==========================================
FinanceFlow
Archivo: dashboard-layout.js

Escala el carrusel 3D de "Mis tarjetas" según el ancho
real de su contenedor, para que las tarjetas se vean
completas en el nuevo layout del Dashboard.
No modifica datos ni la lógica de dashboard-carousels.js.
==========================================
*/
(function () {
    "use strict";

    var BASE_WIDTH = 480;   // ancho (px) donde el carrusel se ve a escala 1
    var MIN_SCALE = 0.4;

    function applyScale(stage) {
        var carousel = stage.querySelector(".ffc-cards-carousel");
        if (!carousel) return;

        // Ancho realmente disponible para el carrusel: el escenario menos
        // el panel del gráfico circular (si está en la misma fila).
        var panel = stage.querySelector(".ffc-distribution-panel");
        var available = stage.clientWidth;
        if (panel && panel.offsetLeft < carousel.offsetLeft) {
            available = stage.clientWidth - panel.offsetWidth - 14;
        }

        var scale = Math.min(1, Math.max(MIN_SCALE, available / BASE_WIDTH));
        carousel.style.setProperty("--ffc-scale", scale.toFixed(3));
    }

    function init() {
        var stage = document.getElementById("ffcCardsCarousel");
        if (!stage) return;

        applyScale(stage);

        if (typeof ResizeObserver !== "undefined") {
            new ResizeObserver(function () { applyScale(stage); }).observe(stage);
        } else {
            window.addEventListener("resize", function () { applyScale(stage); });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
