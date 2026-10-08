/*
==========================================
FinanceFlow
Archivo: services/firebase.js

Descripción:
Conexión con Firebase Authentication.
Solo se usa el acceso con CORREO y CONTRASEÑA
(no hay Google ni otros proveedores).

Este archivo se carga como módulo ES desde index.html:
<script type="module" src="js/services/firebase.js"></script>

Expone window.FinanceFlowFirebase con:
- onAuthChange(callback)   → se ejecuta al abrir la app y en cada
                             cambio de sesión (callback recibe el
                             usuario o null)
- register(name, email, password)
- login(email, password)
- logout()

js/auth.js usa esta interfaz para la pantalla de acceso.

IMPORTANTE:
- Authentication → Sign-in method → "Correo electrónico/contraseña"
  debe estar HABILITADO en la consola de Firebase.
- Firebase Auth no funciona abriendo index.html con doble clic
  (file://). Hay que abrirlo desde un servidor local, por ejemplo
  http://localhost:5500 con la extensión Live Server de VS Code.
==========================================
*/

import { initializeApp }
    from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
}
    from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


/* ==========================================
   CONFIGURACIÓN DEL PROYECTO
   (la apiKey de Firebase en web es pública
   por diseño; la seguridad la dan las reglas
   y los dominios autorizados de Firebase)
========================================== */

const firebaseConfig = {

    apiKey: "AIzaSyBu_UI1mxEuWhsRUKao29d76YKukNsGiug",

    authDomain: "financeflow-de3fc.firebaseapp.com",

    projectId: "financeflow-de3fc",

    storageBucket: "financeflow-de3fc.firebasestorage.app",

    messagingSenderId: "356573507508",

    appId: "1:356573507508:web:07dc36c1f728a1ac800ce1"

};

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

/* Mensajes de Firebase en español */
auth.languageCode = "es";


/* ==========================================
   INTERFAZ PARA js/auth.js
========================================== */

function toPublicUser(user) {

    if (!user) {

        return null;

    }

    return {

        uid: user.uid,

        email: user.email || "",

        displayName: user.displayName || ""

    };

}

/* ==========================================
   NUBE (Cloud Firestore) · datos de cada cuenta
   Se carga solo cuando hace falta, para que un
   problema con Firestore nunca bloquee el acceso.
   Documento: users/{uid}
========================================== */

let firestoreModule = null;

function loadFirestore() {

    if (!firestoreModule) {

        firestoreModule =
            import(
                "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
            ).then(module => ({
                module,
                db: module.getFirestore(app)
            }));

        /* Si falló la descarga, permite reintentar luego */

        firestoreModule.catch(() => {

            firestoreModule = null;

        });

    }

    return firestoreModule;

}

const cloud = {

    async get(uid) {

        const { module, db } = await loadFirestore();

        const snapshot =
            await module.getDoc(
                module.doc(db, "users", uid)
            );

        return snapshot.exists() ? snapshot.data() : null;

    },

    async set(uid, payload) {

        const { module, db } = await loadFirestore();

        await module.setDoc(
            module.doc(db, "users", uid),
            payload
        );

    }

};

window.FinanceFlowFirebase = {

    cloud,

    onAuthChange(callback) {

        return onAuthStateChanged(
            auth,
            user => callback(toPublicUser(user))
        );

    },

    async register(name, email, password) {

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        /* El nombre se guarda en el perfil de la cuenta */

        try {

            await updateProfile(
                credential.user,
                { displayName: name }
            );

        } catch (error) {

            /* La cuenta ya existe; el nombre se puede
               completar después sin bloquear el registro. */

            console.warn(
                "No se pudo guardar el nombre en Firebase:",
                error
            );

        }

        const user = toPublicUser(credential.user);

        /* Por si updateProfile falló: usamos el nombre tecleado */

        user.displayName = user.displayName || name;

        return user;

    },

    async login(email, password) {

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        return toPublicUser(credential.user);

    },

    async logout() {

        await signOut(auth);

    }

};

window.dispatchEvent(
    new Event("financeflow:firebase-ready")
);
