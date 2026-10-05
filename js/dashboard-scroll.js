/*
==========================================
FinanceFlow
Archivo: dashboard-scroll.js

Encabezado dinámico del Dashboard: al bajar, el encabezado se
compacta de forma progresiva (deja visibles las acciones rápidas
y la fecha) y al subir recupera su tamaño. Escribe en el
encabezado la variable CSS --hp (0 = completo, 1 = compacto).

El alto total que ocupa el encabezado en el flujo se mantiene
constante (con margen inferior) para que el contenido no "salte".
==========================================
*/

(function () {
    "use strict";

    var DISTANCE = 110;          // px de scroll para pasar de completo a compacto (se recalcula)
    var hero, view, scroller, ticking = false;

    // Mide el encabezado completo y compacto, y ajusta el recorrido de scroll
    // para que el encabezado siempre termine compacto cuando hace falta.
    function measure() {
        if (!hero || !scroller || !view.classList.contains("active")) return;

        var fit = window.matchMedia("(min-width: 1201px) and (min-height: 640px)").matches;

        // Tablet / celular: el Dashboard hace scroll normal (ver
        // css/responsive-final.css). No hace falta medir nada: se evita
        // forzar recálculos de layout en cada cambio de tamaño.
        if (!window.matchMedia("(min-width: 1201px)").matches) {
            hero.style.setProperty("--hp", "0");
            hero.classList.remove("is-compact", "is-shrunk");
            scroller.style.removeProperty("--grid-top");
            scroller.style.removeProperty("--grid-pad-top");
            scroller.style.removeProperty("--grid-extra-bottom");
            return;
        }

        var prevHp = hero.style.getPropertyValue("--hp");
        var wasCompact = hero.classList.contains("is-compact");
        var wasShrunk = hero.classList.contains("is-shrunk");

        function outer() {
            var cs = getComputedStyle(hero);
            return hero.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
        }

        hero.style.setProperty("--hp", "0");
        hero.classList.remove("is-compact", "is-shrunk");
        var fullH = outer();

        hero.style.setProperty("--hp", "1");
        hero.classList.add("is-compact", "is-shrunk");
        var compactH = outer();

        // Estado de compactación real vuelve a su sitio
        hero.style.setProperty("--hp", prevHp || "0");
        hero.classList.toggle("is-compact", wasCompact);
        hero.classList.toggle("is-shrunk", wasShrunk);

        DISTANCE = Math.max(60, fullH - compactH);

        if (fit) {
            // La 3.ª fila mide lo que ocupa su contenido (ya no se estira).
            // Para que el encabezado siempre pueda llegar a su estado compacto,
            // el recorrido de scroll debe ser 0 (todo cabe con el encabezado
            // completo) o al menos DISTANCE. Si queda entre ambos, el sobrante
            // se añade como espacio libre al final de la cuadrícula.
            scroller.style.setProperty("--grid-top", Math.round(compactH) + "px");
            scroller.style.setProperty("--grid-pad-top", Math.round(DISTANCE) + "px");
            scroller.style.setProperty("--grid-extra-bottom", "0px");

            var range = scroller.scrollHeight - scroller.clientHeight;
            var extra = (range > 0 && range < DISTANCE) ? Math.ceil(DISTANCE - range) : 0;

            scroller.style.setProperty("--grid-extra-bottom", extra + "px");
        } else {
            scroller.style.removeProperty("--grid-top");
            scroller.style.removeProperty("--grid-pad-top");
            scroller.style.removeProperty("--grid-extra-bottom");
        }

        update();
    }

    function update() {
        ticking = false;
        if (!hero || !scroller || !view.classList.contains("active")) return;

        var p = Math.min(1, Math.max(0, scroller.scrollTop / DISTANCE));
        hero.style.setProperty("--hp", p.toFixed(3));
        hero.classList.toggle("is-shrunk", p > 0.02);
        hero.classList.toggle("is-compact", p >= 0.98);
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }

    function init() {
        hero = document.querySelector("#dashboardView .dashboard-hero");
        view = document.getElementById("dashboardView");
        scroller = view && view.querySelector(".dashboard-summary-grid");
        if (!hero || !scroller) return;

        scroller.addEventListener("scroll", onScroll, { passive: true });
        hero.addEventListener("wheel", function (e) {
            scroller.scrollTop += e.deltaY;
        }, { passive: true });
        var resizeTimer;
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(measure, 120);
        }, { passive: true });
        if (typeof ResizeObserver !== "undefined") {
            var ro = new ResizeObserver(function () { measure(); });
            ro.observe(view);
            scroller.querySelectorAll(".ffc-cards-section, .ffc-goals-section, .budget-card")
                .forEach(function (el) { ro.observe(el); });
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
