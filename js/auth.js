/*
==========================================
FinanceFlow
Archivo: auth.js

Descripción:
Pantalla de acceso con CORREO y CONTRASEÑA
(iniciar sesión / crear cuenta) y control de la sesión.

- Mientras no haya sesión, la app queda tapada por #authScreen.
- Cada cuenta tiene sus propios datos locales:
  "financeflow_user_data_<uid>" (ver data.js).
  Al entrar con una cuenta distinta a la de la página abierta,
  se guarda el uid y se recarga la página para cargar sus datos.
- Los datos que ya tenías antes de existir las cuentas
  ("financeflow_user_data") pasan a la PRIMERA cuenta que
  inicie sesión en este navegador (una sola vez).
- También controla el menú del perfil y "Cerrar sesión".

Depende de js/services/firebase.js (window.FinanceFlowFirebase).
==========================================
*/

(function () {

    "use strict";

    const ACTIVE_UID_KEY = "financeflow_active_uid";

    const LEGACY_KEY = "financeflow_user_data";

    const MIGRATED_KEY = "financeflow_legacy_migrated";

    const RELOAD_GUARD_KEY = "financeflow_auth_reload";

    const BACKEND_TIMEOUT_MS = 12000;

    const RECENT_KEY = "financeflow_recent_accounts";

    const PREFILL_KEY = "financeflow_prefill_email";

    const MAX_RECENT = 5;

    const root = document.documentElement;

    const screen = document.querySelector("#authScreen");

    if (!screen) {

        /* Sin pantalla de acceso no hay nada que bloquear */

        root.classList.remove("ff-auth-locked");

        return;

    }

    const loginForm = document.querySelector("#loginForm");
    const registerForm = document.querySelector("#registerForm");

    let backend = null;

    let busy = false;


    /* ==========================================
       ALMACENAMIENTO SEGURO
    ========================================== */

    function storageGet(key, area) {

        try {

            return (area || localStorage).getItem(key);

        } catch (error) {

            return null;

        }

    }

    function storageSet(key, value, area) {

        try {

            (area || localStorage).setItem(key, value);

            return true;

        } catch (error) {

            return false;

        }

    }

    function storageRemove(key, area) {

        try {

            (area || localStorage).removeItem(key);

        } catch (error) {

            /* nada */

        }

    }


    /* ==========================================
       ESTADOS DE LA PANTALLA
    ========================================== */

    function setState(state) {

        screen.dataset.state = state;

        const isRegister = state === "register";

        const isLogin = state === "login";

        if (isLogin || isRegister) {

            loginForm.hidden = !isLogin;

            registerForm.hidden = !isRegister;

            screen.querySelectorAll("[data-auth-tab]").forEach(tab => {

                tab.setAttribute(
                    "aria-selected",
                    String(tab.dataset.authTab === state)
                );

            });

            const title = document.querySelector("#authTitle");
            const subtitle = document.querySelector("#authSubtitle");

            if (title && subtitle) {

                title.textContent = isLogin
                    ? "Bienvenido de nuevo"
                    : "Crea tu cuenta";

                subtitle.textContent = isLogin
                    ? "Inicia sesión para ver tus finanzas."
                    : "Solo necesitas tu nombre, correo y contraseña.";

            }

        }

    }

    function showLoading(text) {

        const label = document.querySelector("#authLoadingText");

        if (label) {

            label.textContent = text || "Cargando…";

        }

        setState("loading");

    }

    function showFatal(message) {

        const text = document.querySelector("#authFatalText");

        if (text) {

            text.innerHTML = message;

        }

        setState("error");

    }

    function showForm(mode, focus) {

        clearErrors();

        setState(mode);

        if (focus) {

            const form = mode === "login" ? loginForm : registerForm;

            const first = form.querySelector("input");

            if (first) {

                setTimeout(() => first.focus(), 60);

            }

        }

    }

    function unlockApp() {

        storageRemove(RELOAD_GUARD_KEY, sessionStorage);

        root.classList.remove("ff-auth-locked");

        root.classList.add("ff-authed");

        screen.classList.add("is-leaving");

        setTimeout(() => {

            screen.hidden = true;

            screen.classList.remove("is-leaving");

            /* El layout del dashboard se mide al cargar; lo repetimos
               ahora que la pantalla de acceso ya no está */

            window.dispatchEvent(new Event("resize"));

        }, 340);

    }


    /* ==========================================
       MENSAJES DE ERROR (en español)
    ========================================== */

    function friendlyError(error) {

        const code = (error && error.code) || "";

        const map = {

            "auth/email-already-in-use":
                "Ya existe una cuenta con ese correo. Prueba a iniciar sesión.",

            "auth/invalid-email":
                "El correo no tiene un formato válido.",

            "auth/weak-password":
                "La contraseña es muy débil. Usa al menos 6 caracteres.",

            "auth/missing-password":
                "Escribe tu contraseña.",

            "auth/user-not-found":
                "Correo o contraseña incorrectos.",

            "auth/wrong-password":
                "Correo o contraseña incorrectos.",

            "auth/invalid-credential":
                "Correo o contraseña incorrectos.",

            "auth/invalid-login-credentials":
                "Correo o contraseña incorrectos.",

            "auth/user-disabled":
                "Esta cuenta está deshabilitada.",

            "auth/too-many-requests":
                "Demasiados intentos. Espera unos minutos e inténtalo otra vez.",

            "auth/network-request-failed":
                "No hay conexión con internet. Revisa tu red e inténtalo otra vez.",

            "auth/operation-not-allowed":
                "El acceso con correo y contraseña no está activado en Firebase. " +
                "Actívalo en Authentication → Sign-in method → Correo electrónico/contraseña.",

            "auth/configuration-not-found":
                "Firebase Authentication no está activado en el proyecto. " +
                "En la consola de Firebase entra a Authentication y pulsa «Comenzar».",

            "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
                "La clave de Firebase no es válida. Revisa la configuración en js/services/firebase.js.",

            "auth/invalid-api-key":
                "La clave de Firebase no es válida. Revisa la configuración en js/services/firebase.js.",

            "auth/unauthorized-domain":
                "Este dominio no está autorizado en Firebase. Agrégalo en " +
                "Authentication → Settings → Dominios autorizados.",

            "auth/operation-not-supported-in-this-environment":
                "Firebase no funciona abriendo el archivo con doble clic. " +
                "Ábrelo desde un servidor local (por ejemplo http://localhost:5500).",

            "auth/internal-error":
                "Firebase tuvo un error interno. Inténtalo de nuevo en un momento."

        };

        return map[code] ||
            "No pudimos completar la operación. Inténtalo de nuevo.";

    }


    /* ==========================================
       VALIDACIÓN DE FORMULARIOS
    ========================================== */

    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setFieldError(input, message) {

        const slot = document.querySelector(
            `[data-error-for="${input.id}"]`
        );

        if (slot) {

            slot.textContent = message || "";

        }

        if (message) {

            input.setAttribute("aria-invalid", "true");

        } else {

            input.removeAttribute("aria-invalid");

        }

    }

    function clearErrors() {

        screen.querySelectorAll("input").forEach(input => {

            setFieldError(input, "");

        });

        screen.querySelectorAll(".auth-alert").forEach(alert => {

            alert.hidden = true;

            alert.textContent = "";

        });

    }

    function showFormAlert(form, message) {

        const alert = form.querySelector(".auth-alert");

        if (alert) {

            alert.textContent = message;

            alert.hidden = false;

        }

    }

    function validate(form, mode) {

        const nameInput = form.querySelector('[name="name"]');
        const emailInput = form.querySelector('[name="email"]');
        const passwordInput = form.querySelector('[name="password"]');

        const values = {

            name: nameInput
                ? nameInput.value.trim().replace(/\s+/g, " ")
                : "",

            email: emailInput.value.trim().toLowerCase(),

            password: passwordInput.value

        };

        let firstInvalid = null;

        function fail(input, message) {

            setFieldError(input, message);

            if (!firstInvalid) {

                firstInvalid = input;

            }

        }

        clearErrors();

        if (mode === "register") {

            if (values.name.length < 2) {

                fail(nameInput, "Escribe tu nombre.");

            } else if (values.name.length > 40) {

                fail(nameInput, "El nombre es muy largo (máximo 40 letras).");

            }

        }

        if (!EMAIL_PATTERN.test(values.email)) {

            fail(emailInput, "Escribe un correo válido, por ejemplo nombre@correo.com.");

        }

        if (mode === "register") {

            if (values.password.length < 6) {

                fail(passwordInput, "La contraseña debe tener al menos 6 caracteres.");

            }

        } else if (!values.password) {

            fail(passwordInput, "Escribe tu contraseña.");

        }

        if (firstInvalid) {

            firstInvalid.focus();

            return null;

        }

        return values;

    }

    function setBusy(form, isBusy, label) {

        busy = isBusy;

        const button = form.querySelector(".auth-submit");

        form.querySelectorAll("input, button").forEach(element => {

            element.disabled = isBusy;

        });

        if (isBusy) {

            button.dataset.label = button.textContent;

            button.innerHTML =
                '<span class="auth-spinner" aria-hidden="true"></span>' +
                `<span>${label}</span>`;

        } else if (button.dataset.label) {

            button.textContent = button.dataset.label;

        }

    }


    /* ==========================================
       ENVÍO: INICIAR SESIÓN / CREAR CUENTA
    ========================================== */

    async function submitForm(event, mode) {

        event.preventDefault();

        if (busy || !backend) {

            return;

        }

        const form = event.currentTarget;

        const values = validate(form, mode);

        if (!values) {

            return;

        }

        setBusy(
            form,
            true,
            mode === "register" ? "Creando cuenta…" : "Entrando…"
        );

        let user = null;

        try {

            user = mode === "register"
                ? await backend.register(
                    values.name,
                    values.email,
                    values.password
                )
                : await backend.login(
                    values.email,
                    values.password
                );

        } catch (error) {

            console.error("Error de autenticación:", error);

            setBusy(form, false);

            showFormAlert(form, friendlyError(error));

            const password = form.querySelector('[name="password"]');

            if (password && mode === "login") {

                password.value = "";

                password.focus();

            }

            return;

        }

        setBusy(form, false);

        form.reset();

        enter(user);

    }


    /* ==========================================
       ENTRAR CON UN USUARIO
    ========================================== */

    function prepareStorageFor(user) {

        const key = `${LEGACY_KEY}_${user.uid}`;

        let data = null;

        const existing = storageGet(key);

        if (existing) {

            try {

                data = JSON.parse(existing);

            } catch (error) {

                data = null;

            }

        }

        if (!data || typeof data !== "object") {

            data = {};

            /* Los datos anteriores a las cuentas pasan a la primera cuenta */

            if (!storageGet(MIGRATED_KEY)) {

                const legacy = storageGet(LEGACY_KEY);

                if (legacy) {

                    try {

                        const parsed = JSON.parse(legacy);

                        if (parsed && typeof parsed === "object") {

                            data = parsed;

                        }

                    } catch (error) {

                        data = {};

                    }

                }

                storageSet(MIGRATED_KEY, user.uid);

            }

        }

        data.profile = Object.assign(
            {
                id: 1,
                name: "",
                currency: "PEN",
                language: "es",
                theme: "light"
            },
            data.profile || {}
        );

        if (!data.profile.name && user.displayName) {

            data.profile.name = user.displayName;

        }

        storageSet(key, JSON.stringify(data));

        storageSet(ACTIVE_UID_KEY, user.uid);

    }

    function displayNameOf(user) {

        return user.displayName ||
            (user.email ? user.email.split("@")[0] : "Usuario");

    }

    function applyProfile(user) {

        const name = displayNameOf(user);

        const email = user.email || "";

        const initial = name.trim().charAt(0).toUpperCase() || "U";

        const setText = (selector, value) => {

            const element = document.querySelector(selector);

            if (element) {

                element.textContent = value;

            }

        };

        setText("#profileName", name);
        setText("#profilePanelName", name);
        setText("#profileEmail", email);
        setText("#profilePanelEmail", email);
        setText("#profileAvatar", initial);
        setText("#profilePanelAvatar", initial);
        setText("#settingsProfileName", name);

        renderRecentAccounts(user.uid);

        /* Nombre guardado en los datos de la app (saludo, tarjetas) */

        try {

            if (
                typeof userData !== "undefined" &&
                userData.profile &&
                !userData.profile.name &&
                user.displayName
            ) {

                userData.profile.name = user.displayName;

                if (typeof saveFinanceFlowData === "function") {

                    saveFinanceFlowData();

                }

                if (typeof renderGreeting === "function") {

                    renderGreeting();

                }

                if (typeof renderDashboard === "function") {

                    renderDashboard();

                }

            }

        } catch (error) {

            console.warn("No se pudo actualizar el nombre:", error);

        }

    }

    let reloading = false;

    function enter(user) {

        if (reloading) {

            return;

        }

        rememberAccount(user);

        if (storageGet(ACTIVE_UID_KEY) !== user.uid) {

            prepareStorageFor(user);

            /* Evita un bucle de recargas si el navegador no deja guardar */

            const attempts =
                Number(storageGet(RELOAD_GUARD_KEY, sessionStorage)) || 0;

            if (attempts < 2 && storageGet(ACTIVE_UID_KEY) === user.uid) {

                storageSet(
                    RELOAD_GUARD_KEY,
                    String(attempts + 1),
                    sessionStorage
                );

                reloading = true;

                showLoading("Preparando tu espacio…");

                window.location.reload();

                return;

            }

        }

        applyProfile(user);

        unlockApp();

    }

    function showSignedOut() {

        /* Si quedaba una sesión guardada que ya no es válida */

        storageRemove(ACTIVE_UID_KEY);

        root.classList.add("ff-auth-locked");

        screen.hidden = false;

        showForm("login", false);

        applyPrefill();

    }


    /* ==========================================
       CUENTAS RECIENTES (cambio rápido de cuenta)
       Solo se guarda nombre y correo en este navegador.
       Nunca se guarda la contraseña: al elegir una cuenta
       se cierra la sesión y se pide solo la contraseña.
    ========================================== */

    let currentUid = null;

    function readRecent() {

        try {

            const list = JSON.parse(storageGet(RECENT_KEY) || "[]");

            return Array.isArray(list)
                ? list.filter(item => item && item.uid && item.email)
                : [];

        } catch (error) {

            return [];

        }

    }

    function writeRecent(list) {

        storageSet(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));

    }

    function rememberAccount(user) {

        if (!user || !user.uid || !user.email) {

            return;

        }

        const list = readRecent().filter(item => item.uid !== user.uid);

        list.unshift({
            uid: user.uid,
            name: displayNameOf(user),
            email: user.email,
            lastUsed: Date.now()
        });

        writeRecent(list);

    }

    function forgetAccount(uid) {

        writeRecent(readRecent().filter(item => item.uid !== uid));

        renderRecentAccounts(currentUid);

    }

    function switchToAccount(account) {

        /* La pantalla de acceso mostrará este correo ya escrito */

        storageSet(PREFILL_KEY, account.email, sessionStorage);

        logout();

    }

    function renderRecentAccounts(uid) {

        currentUid = uid || currentUid;

        const box = document.querySelector("#profileRecent");
        const list = document.querySelector("#profileRecentList");

        if (!box || !list) {

            return;

        }

        const others = readRecent().filter(item => item.uid !== currentUid);

        list.textContent = "";

        box.hidden = others.length === 0;

        others.forEach(account => {

            const item = document.createElement("li");
            item.className = "profile-recent-row";

            const pick = document.createElement("button");
            pick.type = "button";
            pick.className = "profile-recent-item";
            pick.title = `Cambiar a ${account.email}`;

            const avatar = document.createElement("span");
            avatar.className = "profile-avatar profile-recent-avatar";
            avatar.textContent =
                (account.name || account.email).trim().charAt(0).toUpperCase() || "U";

            const text = document.createElement("span");
            text.className = "profile-recent-text";

            const name = document.createElement("strong");
            name.textContent = account.name || account.email.split("@")[0];

            const mail = document.createElement("small");
            mail.textContent = account.email;

            text.append(name, mail);
            pick.append(avatar, text);

            pick.addEventListener("click", () => switchToAccount(account));

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "profile-recent-remove";
            remove.textContent = "✕";
            remove.title = "Quitar de la lista";
            remove.setAttribute(
                "aria-label",
                `Quitar ${account.email} de la lista`
            );

            remove.addEventListener("click", event => {

                /* Evita que el menú se cierre al quitar una cuenta */

                event.stopPropagation();

                forgetAccount(account.uid);

            });

            item.append(pick, remove);

            list.append(item);

        });

    }

    function applyPrefill() {

        const email = storageGet(PREFILL_KEY, sessionStorage);

        if (!email) {

            return;

        }

        storageRemove(PREFILL_KEY, sessionStorage);

        const emailInput = loginForm.querySelector('[name="email"]');
        const passwordInput = loginForm.querySelector('[name="password"]');
        const subtitle = document.querySelector("#authSubtitle");

        if (emailInput) {

            emailInput.value = email;

        }

        if (subtitle) {

            subtitle.textContent = `Escribe la contraseña de ${email} para entrar.`;

        }

        if (passwordInput) {

            setTimeout(() => passwordInput.focus(), 80);

        }

    }


    /* ==========================================
       CERRAR SESIÓN
    ========================================== */

    async function logout() {

        busy = true;

        try {

            if (backend) {

                await backend.logout();

            }

        } catch (error) {

            console.error("Error al cerrar sesión:", error);

        }

        storageRemove(ACTIVE_UID_KEY);

        /* Se recarga para no dejar en memoria los datos del usuario */

        window.location.reload();

    }


    /* ==========================================
       MENÚ DEL PERFIL
    ========================================== */

    function initializeProfileMenu() {

        const button = document.querySelector("#profileButton");
        const panel = document.querySelector("#profilePanel");

        if (!button || !panel) {

            return;

        }

        function setOpen(open) {

            panel.hidden = !open;

            button.setAttribute("aria-expanded", String(open));

        }

        button.addEventListener("click", event => {

            event.stopPropagation();

            setOpen(panel.hidden);

        });

        document.addEventListener("click", event => {

            if (!panel.hidden && !panel.contains(event.target)) {

                setOpen(false);

            }

        });

        document.addEventListener("keydown", event => {

            if (event.key === "Escape" && !panel.hidden) {

                setOpen(false);

                button.focus();

            }

        });

        panel.querySelectorAll("[data-view]").forEach(item => {

            item.addEventListener("click", () => setOpen(false));

        });

        const logoutButton = document.querySelector("#logoutButton");

        if (logoutButton) {

            logoutButton.addEventListener("click", () => {

                setOpen(false);

                logout();

            });

        }

    }


    /* ==========================================
       EVENTOS DE LA PANTALLA DE ACCESO
    ========================================== */

    function initializeAuthScreen() {

        screen.querySelectorAll("[data-auth-tab]").forEach(tab => {

            tab.addEventListener("click", () => {

                if (!busy) {

                    showForm(tab.dataset.authTab, true);

                }

            });

        });

        screen.querySelectorAll("[data-auth-switch]").forEach(link => {

            link.addEventListener("click", () => {

                if (!busy) {

                    showForm(link.dataset.authSwitch, true);

                }

            });

        });

        loginForm.addEventListener(
            "submit",
            event => submitForm(event, "login")
        );

        registerForm.addEventListener(
            "submit",
            event => submitForm(event, "register")
        );

        screen.querySelectorAll("[data-toggle-password]").forEach(toggle => {

            toggle.addEventListener("click", () => {

                const input = document.querySelector(
                    `#${toggle.dataset.togglePassword}`
                );

                const show = input.type === "password";

                input.type = show ? "text" : "password";

                toggle.textContent = show ? "Ocultar" : "Mostrar";

                toggle.setAttribute("aria-pressed", String(show));

                input.focus();

            });

        });

        const retry = document.querySelector("#authRetry");

        if (retry) {

            retry.addEventListener(
                "click",
                () => window.location.reload()
            );

        }

        /* Al escribir se quita el error de ese campo */

        screen.querySelectorAll("input").forEach(input => {

            input.addEventListener("input", () => {

                setFieldError(input, "");

                const alert = input.closest("form").querySelector(".auth-alert");

                if (alert) {

                    alert.hidden = true;

                }

            });

        });

    }


    /* ==========================================
       CONEXIÓN CON FIREBASE
    ========================================== */

    function waitForBackend() {

        return new Promise((resolve, reject) => {

            if (window.location.protocol === "file:") {

                reject({ code: "ff/file-protocol" });

                return;

            }

            if (window.FinanceFlowFirebase) {

                resolve(window.FinanceFlowFirebase);

                return;

            }

            const timer = setTimeout(
                () => reject({ code: "ff/backend-timeout" }),
                BACKEND_TIMEOUT_MS
            );

            window.addEventListener(
                "financeflow:firebase-ready",
                () => {

                    clearTimeout(timer);

                    resolve(window.FinanceFlowFirebase);

                },
                { once: true }
            );

            const tag = document.querySelector(
                'script[src$="services/firebase.js"]'
            );

            if (tag) {

                tag.addEventListener("error", () => {

                    clearTimeout(timer);

                    reject({ code: "ff/backend-timeout" });

                });

            }

        });

    }

    function start() {

        initializeAuthScreen();

        initializeProfileMenu();

        showLoading("Cargando…");

        waitForBackend()

            .then(firebase => {

                backend = firebase;

                backend.onAuthChange(user => {

                    /* Durante un registro / inicio de sesión lo gestiona el envío */

                    if (busy) {

                        return;

                    }

                    if (user) {

                        enter(user);

                    } else {

                        showSignedOut();

                    }

                });

            })

            .catch(error => {

                console.error("No se pudo iniciar Firebase:", error);

                if (error && error.code === "ff/file-protocol") {

                    showFatal(
                        "Para iniciar sesión, abre FinanceFlow desde un servidor local " +
                        "(por ejemplo <span class=\"auth-code\">http://localhost:5500</span> " +
                        "con la extensión Live Server de VS Code) en lugar de abrir el " +
                        "archivo con doble clic."
                    );

                } else {

                    showFatal(
                        "No pudimos conectar con Firebase. Revisa tu conexión a internet " +
                        "e inténtalo de nuevo."
                    );

                }

            });

    }

    start();

})();
