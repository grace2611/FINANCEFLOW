/*
==========================================
FinanceFlow
Archivo: dashboard-scroll.js

Dashboard SIN efectos de scroll: el encabezado se queda siempre
completo (ya no se compacta al bajar) y no hay snap ni scroll de
página en escritorio.

Este archivo solo mide la altura del encabezado para ubicar la
cuadrícula justo debajo de él (--grid-top).
==========================================
*/

(function () {
    "use strict";

    var hero, view, scroller;

    function measure() {
        if (!hero || !scroller || !view.classList.contains("active")) return;

        // El encabezado nunca se compacta
        hero.style.setProperty("--hp", "0");
        hero.classList.remove("is-compact", "is-shrunk");

        // Tablet / celular: flujo normal de la página, nada que medir
        if (!window.matchMedia("(min-width: 1201px)").matches) {
            scroller.style.removeProperty("--grid-top");
            scroller.style.removeProperty("--grid-pad-top");
            scroller.style.removeProperty("--grid-extra-bottom");
            return;
        }

        var cs = getComputedStyle(hero);
        var fullH = hero.offsetHeight +
            parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);

        scroller.style.setProperty("--grid-top", Math.round(fullH) + "px");
        scroller.style.setProperty("--grid-pad-top", "0px");
        scroller.style.setProperty("--grid-extra-bottom", "0px");
    }

    function init() {
        hero = document.querySelector("#dashboardView .dashboard-hero");
        view = document.getElementById("dashboardView");
        scroller = view && view.querySelector(".dashboard-summary-grid");
        if (!hero || !scroller) return;

        var resizeTimer;
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(measure, 120);
        }, { passive: true });

        if (typeof ResizeObserver !== "undefined") {
            var ro = new ResizeObserver(function () { measure(); });
            ro.observe(view);
            ro.observe(hero);
        }

        // Al cambiar de sección o de tema se vuelve a medir
        document.addEventListener("click", function (e) {
            if (e.target.closest("[data-view]")) setTimeout(measure, 80);
        });

        measure();
        setTimeout(measure, 600);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
