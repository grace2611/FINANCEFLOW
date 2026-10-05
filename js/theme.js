/*
==========================================
FinanceFlow
Archivo: theme.js

Modo claro / modo oscuro.

- El tema se guarda en localStorage ("financeflow_theme") y se
  aplica como atributo data-theme en <html>. El pequeño script
  del <head> lo aplica antes de pintar para que no haya parpadeo.
- El botón vive al final del sidebar (#themeToggle).
==========================================
*/

(function () {

    const STORAGE_KEY = "financeflow_theme";

    const root = document.documentElement;


    function getTheme() {

        return root.getAttribute("data-theme") === "dark"
            ? "dark"
            : "light";

    }


    function updateButton(theme) {

        const button =
            document.querySelector("#themeToggle");

        if (!button) {

            return;

        }

        const isDark = theme === "dark";

        button.setAttribute(
            "aria-checked",
            String(isDark)
        );

        button.setAttribute(
            "aria-label",
            isDark
                ? "Cambiar a modo claro"
                : "Cambiar a modo oscuro"
        );

        button.title =
            isDark
                ? "Cambiar a modo claro"
                : "Cambiar a modo oscuro";

    }


    function applyTheme(theme, animate) {

        if (animate) {

            /* Transición suave de colores solo al cambiar de tema */
            root.classList.add("theme-changing");

            window.setTimeout(() => {

                root.classList.remove("theme-changing");

            }, 450);

        }

        root.setAttribute("data-theme", theme);

        try {

            localStorage.setItem(STORAGE_KEY, theme);

        } catch (error) {

            /* Sin almacenamiento: el tema vale solo en esta sesión */

        }

        const meta =
            document.querySelector('meta[name="theme-color"]');

        if (meta) {

            meta.setAttribute(
                "content",
                theme === "dark" ? "#0A0F1E" : "#F8FAFC"
            );

        }

        updateButton(theme);

        /* La fila "Tema" de Configuración muestra el tema actual */
        const themeLabel =
            document.querySelector("#settingsTheme");

        if (themeLabel) {

            themeLabel.textContent =
                theme === "dark" ? "Oscuro" : "Claro";

        }

        /* Los gráficos dibujados en canvas toman los colores al pintarse */
        if (animate && typeof refreshFinanceFlowUI === "function") {

            try {

                refreshFinanceFlowUI();

            } catch (error) {

                console.error(error);

            }

        }

    }


    document.addEventListener("DOMContentLoaded", () => {

        updateButton(getTheme());

        const themeLabel =
            document.querySelector("#settingsTheme");

        if (themeLabel) {

            themeLabel.textContent =
                getTheme() === "dark" ? "Oscuro" : "Claro";

        }

        const button =
            document.querySelector("#themeToggle");

        if (!button) {

            return;

        }

        button.addEventListener("click", () => {

            applyTheme(
                getTheme() === "dark" ? "light" : "dark",
                true
            );

        });

    });

})();
