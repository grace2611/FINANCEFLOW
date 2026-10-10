


## Cuentas (Firebase Authentication)

El acceso es solo con **nombre, correo y contraseña** (sin Google ni otros proveedores).

1. En la consola de Firebase (proyecto `financeflow-de3fc`) abre **Authentication → Sign-in method** y activa **Correo electrónico/contraseña**.
2. Abre la app desde un servidor local (por ejemplo `http://localhost:5500` con Live Server de VS Code, o `npx serve`). Firebase Auth **no funciona** abriendo `index.html` con doble clic.
3. En **Authentication → Settings → Authorized domains** debe estar `localhost` (viene por defecto) y, cuando publiques la app, tu dominio.

Archivos: `js/services/firebase.js` (conexión), `js/auth.js` (pantalla de acceso, sesión y menú del perfil) y `css/auth.css`.
Los datos de cada cuenta se guardan en el navegador con la clave `financeflow_user_data_<uid>` y se sincronizan entre dispositivos con Cloud Firestore (ver abajo).

## Sincronización entre dispositivos (Cloud Firestore)

Para que tus datos del celular aparezcan en la laptop (y al revés) hay que activar Firestore **una sola vez**:

1. En la consola de Firebase (proyecto `financeflow-de3fc`) abre **Build → Firestore Database → Crear base de datos** (modo producción, la región que prefieras).
2. Abre la pestaña **Reglas**, pega el contenido de `firestore.rules` y pulsa **Publicar**.
3. Abre la app en el dispositivo que ya tiene tus datos (el celular) e inicia sesión: sube tu información a la nube. Luego inicia sesión en los demás dispositivos.

Archivos: `js/services/cloud-sync.js` (lógica) y `js/services/firebase.js` (conexión). Cada guardado se sube a `users/{uid}`; al iniciar sesión y al volver a la pestaña se descarga lo más reciente. Antes de reemplazar datos locales se guarda un respaldo en el navegador (`financeflow_backup_<uid>`).

## Adaptación a celular / tablet y rendimiento

- `css/responsive-final.css` (se carga el último): barra inferior móvil con las 10 secciones (desplazable), Dashboard fluido en ≤ 1200 px, tarjetas y filtros compactos en celular, modales ajustados y reducción de efectos costosos (blur, animaciones infinitas) en pantallas pequeñas / táctiles. El escritorio (> 1200 px) no cambia.
- `js/mobile-nav.js`: centra la sección activa en la barra inferior.
- `js/dashboard-scroll.js`: ya no mide el layout en tablet/celular.
- La fuente de Google carga sin bloquear el primer pintado.

## PWA (instalable en Android)

- `manifest.json`: nombre, iconos, colores y modo `standalone`. Usa rutas relativas (`./`), así funciona en GitHub Pages dentro de `/nombre-del-repositorio/`.
- `sw.js`: service worker. Solo guarda archivos estáticos (HTML, CSS, JS, iconos, SDK de Firebase con versión fija y la fuente). Las solicitudes de Firebase Authentication y Firestore **no se interceptan ni se guardan**.
- `js/pwa.js`: registra el service worker (solo en https o localhost).
- `assets/icons/`: iconos 192, 512, maskable 512 y apple-touch.
- Para publicar una actualización y forzar renovar la caché, cambia `CACHE_VERSION` en `sw.js` (v1 → v2).
- Sin Internet solo se muestra la estructura de la app: el inicio de sesión y la sincronización siguen necesitando conexión.
