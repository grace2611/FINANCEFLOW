/*
==========================================
FinanceFlow
Archivo: services/cloud-sync.js

Sincroniza los datos de cada cuenta entre dispositivos
usando Cloud Firestore (documento users/{uid}).

Sin esto los datos solo vivían en el navegador donde se
guardaron (localStorage), por eso el celular y la laptop
no compartían nada.

Cómo funciona:
- Cada vez que la app guarda (saveFinanceFlowData) se sube
  una copia a la nube (con una pequeña espera para agrupar
  cambios).
- Al iniciar sesión, y cada vez que vuelves a la pestaña,
  se compara con la copia de la nube: si otro dispositivo
  guardó algo más reciente, se descarga y la página se
  recarga con esos datos.
- Si la nube no responde, la app sigue funcionando con los
  datos locales y reintenta en el siguiente guardado.
- Antes de reemplazar datos locales se guarda una copia de
  respaldo en el navegador (financeflow_backup_<uid>).

Requiere Firestore activo en la consola de Firebase y las
reglas de firestore.rules (ver README).
==========================================
*/

(function () {

    "use strict";

    const DATA_PREFIX = "financeflow_user_data_";

    const META_PREFIX = "financeflow_sync_";

    const BACKUP_PREFIX = "financeflow_backup_";

    const ACTIVE_UID_KEY = "financeflow_active_uid";

    const DEVICE_KEY = "financeflow_device_id";

    const RELOAD_KEY = "financeflow_sync_reloads";

    const REQUEST_TIMEOUT_MS = 8000;

    const PUSH_DELAY_MS = 1500;

    const RECHECK_MS = 20000;

    let ready = false;

    /* Mientras se aplican datos de la nube y se recarga la página,
       los datos en memoria están desactualizados: no se guarda ni se
       sube nada para no pisar lo que acaba de llegar. */

    let applying = false;

    let pushTimer = null;

    let pushChain = Promise.resolve();

    let lastCheck = 0;

    const api = {

        applying: false,

        status: "idle",   // idle | ok | offline | error

        errorCode: ""

    };


    /* ==========================================
       UTILIDADES
    ========================================== */

    function get(key) {

        try {

            return localStorage.getItem(key);

        } catch (error) {

            return null;

        }

    }

    function set(key, value) {

        try {

            localStorage.setItem(key, value);

            return true;

        } catch (error) {

            return false;

        }

    }

    function remove(key) {

        try {

            localStorage.removeItem(key);

        } catch (error) {

            /* nada */

        }

    }

    function activeUid() {

        return get(ACTIVE_UID_KEY);

    }

    function cloud() {

        return (
            window.FinanceFlowFirebase &&
            window.FinanceFlowFirebase.cloud
        ) || null;

    }

    function hashString(text) {

        let hash = 5381;

        for (let i = 0; i < text.length; i++) {

            hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;

        }

        return String(hash >>> 0) + ":" + text.length;

    }

    function localJSON() {

        return JSON.stringify(userData);

    }

    function deviceId() {

        let id = get(DEVICE_KEY);

        if (!id) {

            id = `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

            set(DEVICE_KEY, id);

        }

        return id;

    }

    function withTimeout(promise) {

        return new Promise((resolve, reject) => {

            const timer = setTimeout(
                () => reject({ code: "ff/sync-timeout" }),
                REQUEST_TIMEOUT_MS
            );

            promise.then(
                value => {

                    clearTimeout(timer);

                    resolve(value);

                },
                error => {

                    clearTimeout(timer);

                    reject(error);

                }
            );

        });

    }

    function readMeta(uid) {

        try {

            const meta = JSON.parse(get(META_PREFIX + uid) || "{}");

            return {
                at: Number(meta.at) || 0,
                hash: meta.hash || "",
                baseline: Boolean(meta.baseline)
            };

        } catch (error) {

            return { at: 0, hash: "", baseline: false };

        }

    }

    function writeMeta(uid, meta) {

        set(META_PREFIX + uid, JSON.stringify(meta));

    }

    /*
    Qué tantos datos reales tiene una copia (sin contar
    notificaciones ni la cuenta/perfil por defecto). Sirve para
    no pisar datos importantes con una copia vacía.
    */

    function score(data) {

        if (!data || typeof data !== "object") {

            return 0;

        }

        const count = key =>
            Array.isArray(data[key]) ? data[key].length : 0;

        const accountsWithMoney =
            Array.isArray(data.accounts)
                ? data.accounts.filter(
                    account => Number(account && account.balance) !== 0
                ).length
                : 0;

        return (
            count("movements") +
            count("goals") +
            count("loans") +
            count("events") +
            count("creditCards") +
            count("budgets") +
            accountsWithMoney
        );

    }

    function backupLocal(uid) {

        const current = get(DATA_PREFIX + uid);

        if (current) {

            set(BACKUP_PREFIX + uid, current);

        }

    }

    function parseRemote(remote) {

        if (!remote || remote.cleared || typeof remote.data !== "string") {

            return null;

        }

        try {

            const parsed = JSON.parse(remote.data);

            return parsed && typeof parsed === "object"
                ? parsed
                : null;

        } catch (error) {

            return null;

        }

    }

    function fail(error) {

        const code =
            (error && (error.code || error.message)) || "unknown";

        api.status =
            code === "ff/sync-timeout" || code === "unavailable"
                ? "offline"
                : "error";

        api.errorCode = String(code);

        console.warn("FinanceFlow · sincronización:", code);

    }


    /* ==========================================
       SUBIR
    ========================================== */

    function pushNow(minimumStamp) {

        const run = async () => {

            const uid = activeUid();

            const backend = cloud();

            if (!uid || !backend) {

                return;

            }

            const json = localJSON();

            const hash = hashString(json);

            const meta = readMeta(uid);

            if (!minimumStamp && hash === meta.hash) {

                return;

            }

            const at =
                Math.max(Date.now(), (minimumStamp || 0) + 1, meta.at + 1);

            try {

                await withTimeout(
                    backend.set(uid, {
                        data: json,
                        updatedAt: at,
                        cleared: false,
                        device: deviceId()
                    })
                );

                writeMeta(uid, { at, hash, baseline: false });

                api.status = "ok";

            } catch (error) {

                fail(error);

            }

        };

        pushChain = pushChain.then(run, run);

        return pushChain;

    }

    api.schedulePush = function () {

        /* Hasta decidir qué copia manda (al iniciar sesión)
           no se sube nada, para no pisar la copia de la nube. */

        if (!ready) {

            return;

        }

        clearTimeout(pushTimer);

        pushTimer = setTimeout(() => {

            pushTimer = null;

            pushNow();

        }, PUSH_DELAY_MS);

    };

    api.flush = function () {

        if (!ready) {

            return Promise.resolve();

        }

        clearTimeout(pushTimer);

        pushTimer = null;

        return pushNow();

    };


    /* ==========================================
       COMPARAR Y DECIDIR
       Devuelve "reload" si se aplicaron datos de la nube.
    ========================================== */

    async function reconcile() {

        const uid = activeUid();

        const backend = cloud();

        if (!uid || !backend) {

            return "ok";

        }

        const meta = readMeta(uid);

        /* Tras traer datos de la nube, se toma como referencia
           el estado que la app dejó al cargarlos. */

        if (meta.baseline) {

            meta.hash = hashString(localJSON());

            meta.baseline = false;

            writeMeta(uid, meta);

        }

        let remote;

        try {

            remote = await withTimeout(backend.get(uid));

            api.status = "ok";

        } catch (error) {

            fail(error);

            return "ok";

        }

        const localScore = score(userData);

        /* No hay copia en la nube: se sube la local si tiene algo */

        if (!remote) {

            if (localScore > 0 || meta.at > 0) {

                await pushNow(meta.at);

            }

            return "ok";

        }

        const remoteAt = Number(remote.updatedAt) || 0;

        const remoteData = parseRemote(remote);

        if (remoteAt > meta.at) {

            /* Esta copia local nunca se había sincronizado y tiene
               más datos que la nube: gana la local. */

            if (
                meta.at === 0 &&
                !remote.cleared &&
                localScore > score(remoteData)
            ) {

                if (typeof remote.data === "string") {

                    set(BACKUP_PREFIX + uid + "_cloud", remote.data);

                }

                await pushNow(remoteAt);

                return "ok";

            }

            /* La nube tiene algo más reciente: se aplica */

            const attempts =
                Number(sessionStorage.getItem(RELOAD_KEY)) || 0;

            if (attempts >= 2) {

                return "ok";

            }

            try {

                sessionStorage.setItem(RELOAD_KEY, String(attempts + 1));

            } catch (error) {

                /* nada */

            }

            applying = true;

            ready = false;

            api.applying = true;

            clearTimeout(pushTimer);

            backupLocal(uid);

            if (remote.cleared || !remoteData) {

                remove(DATA_PREFIX + uid);

            } else {

                set(DATA_PREFIX + uid, remote.data);

            }

            writeMeta(uid, {
                at: remoteAt,
                hash: "",
                baseline: true
            });

            return "reload";

        }

        /* La nube no es más nueva: si hay cambios locales, se suben */

        try {

            sessionStorage.removeItem(RELOAD_KEY);

        } catch (error) {

            /* nada */

        }

        if (remote.cleared && localScore === 0) {

            return "ok";

        }

        if (hashString(localJSON()) !== meta.hash) {

            await pushNow();

        }

        return "ok";

    }

    /*
    Al iniciar sesión (lo llama js/auth.js antes de mostrar la app).
    */

    api.syncOnLogin = async function () {

        try {

            const result = await reconcile();

            if (result !== "reload" && !applying) {

                ready = true;

            }

            return result;

        } catch (error) {

            fail(error);

            ready = true;

            return "ok";

        }

    };

    /*
    Borrar los datos también en la nube (si no, volverían
    a bajar desde otro dispositivo).
    */

    api.clearCloud = async function () {

        const uid = activeUid();

        const backend = cloud();

        if (!uid || !backend) {

            return;

        }

        /* Mientras se borra, no se sube nada más
           (hasta recargar la página) */

        ready = false;

        clearTimeout(pushTimer);

        const at = Math.max(Date.now(), readMeta(uid).at + 1);

        try {

            await withTimeout(
                backend.set(uid, {
                    data: null,
                    updatedAt: at,
                    cleared: true,
                    device: deviceId()
                })
            );

            writeMeta(uid, { at, hash: "", baseline: false });

        } catch (error) {

            fail(error);

        }

    };


    /* ==========================================
       VOLVER A LA PESTAÑA / CERRAR
    ========================================== */

    function isEditing() {

        const active = document.activeElement;

        return Boolean(
            document.querySelector(".modal-overlay.is-open") ||
            (
                active &&
                /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)
            )
        );

    }

    async function recheck() {

        if (
            !ready ||
            document.visibilityState !== "visible" ||
            Date.now() - lastCheck < RECHECK_MS
        ) {

            return;

        }

        lastCheck = Date.now();

        if (isEditing()) {

            return;

        }

        await api.flush();

        const result = await reconcile();

        if (result === "reload") {

            window.location.reload();

        }

    }

    document.addEventListener("visibilitychange", () => {

        if (document.visibilityState === "hidden") {

            api.flush();

        } else {

            recheck();

        }

    });

    window.addEventListener("pagehide", () => {

        api.flush();

    });

    window.addEventListener("online", () => {

        lastCheck = 0;

        recheck();

    });

    window.FinanceFlowSync = api;

})();
