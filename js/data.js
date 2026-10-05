/*
==========================================
FinanceFlow
Archivo: data.js
Versión: 0.1.0

Descripción:
Contiene el estado principal de la aplicación.

Actualmente utiliza datos locales.
En el futuro estos datos vendrán desde Firebase.

No modificar los datos directamente desde otros módulos.
Todas las modificaciones deberán hacerse mediante funciones.

==========================================
*/

/* ==========================================
   PERSISTENCIA LOCAL DE FINANCEFLOW
========================================== */

/*
Los datos se guardan por usuario: cada cuenta de FinanceFlow tiene su
propia clave ("financeflow_user_data_<uid>"). js/auth.js escribe el uid
de la sesión activa en "financeflow_active_uid" antes de recargar la
página. Sin sesión se usa una clave aparte para no mezclar datos.
*/

const FINANCEFLOW_LEGACY_STORAGE_KEY =
    "financeflow_user_data";

const FINANCEFLOW_ACTIVE_UID_KEY =
    "financeflow_active_uid";

function getFinanceFlowStorageKey() {

    try {

        const uid =
            localStorage.getItem(
                FINANCEFLOW_ACTIVE_UID_KEY
            );

        return uid
            ? `${FINANCEFLOW_LEGACY_STORAGE_KEY}_${uid}`
            : `${FINANCEFLOW_LEGACY_STORAGE_KEY}_signed_out`;

    } catch (error) {

        return FINANCEFLOW_LEGACY_STORAGE_KEY;

    }

}

const FINANCEFLOW_STORAGE_KEY =
    getFinanceFlowStorageKey();


function loadFinanceFlowData() {

    const savedData =
        localStorage.getItem(
            FINANCEFLOW_STORAGE_KEY
        );


    if (!savedData) {

        return null;

    }


    try {

        return JSON.parse(
            savedData
        );

    } catch (error) {

        console.error(
            "Error al cargar los datos de FinanceFlow:",
            error
        );

        return null;

    }

}


function saveFinanceFlowData() {

    try {

        localStorage.setItem(
            FINANCEFLOW_STORAGE_KEY,
            JSON.stringify(userData)
        );

    } catch (error) {

        console.error(
            "Error al guardar los datos de FinanceFlow:",
            error
        );

    }

}

const userData = {

    profile: {

        id: 1,

        name: "",

        currency: "PEN",

        language: "es",

        theme: "light"

    },

    accounts: [

        {
            id: 1,
            name: "Yape",
            type: "wallet",
            description: "Cuenta principal para gastos diarios",
            balance: 0,
            icon: "📱",
            color: "#7B3FE4",
            available: true,
            active: true
        },

        {
            id: 2,
            name: "Scotiabank",
            type: "bank",
            description: "Cuenta donde recibo mi sueldo",
            balance: 0,
            icon: "🏦",
            color: "#EC111A",
            available: true,
            active: true
        },

        {
            id: 3,
            name: "BBVA Débito",
            type: "bank",
            description: "Dinero reservado para pagar la tarjeta",
            balance: 0,
            icon: "💳",
            color: "#1464F4",
            available: false,
            active: true
        },

        {
            id: 4,
            name: "Efectivo",
            type: "cash",
            description: "Ahorro para la laptop",
            balance: 0,
            icon: "💵",
            color: "#18A957",
            available: false,
            active: true
        }

    ],

    creditCards: [

    ],

    goals: [

    ],

    loans: [


    ],

    movements: [

    ],

    notifications: [

    ],

    events: [

    ],

    categories: [

        {
            id: "food",
            name: "Alimentación",
            type: "expense",
            icon: "🍔",
            active: true
        },

        {
            id: "transport",
            name: "Transporte",
            type: "expense",
            icon: "🚕",
            active: true
        },

        {
            id: "housing",
            name: "Vivienda",
            type: "expense",
            icon: "🏠",
            active: true
        },

        {
            id: "health",
            name: "Salud",
            type: "expense",
            icon: "❤️",
            active: true
        },

        {
            id: "entertainment",
            name: "Entretenimiento",
            type: "expense",
            icon: "🎮",
            active: true
        },

        {
            id: "shopping",
            name: "Compras",
            type: "expense",
            icon: "🛍️",
            active: true
        },

        {
            id: "salary",
            name: "Sueldo",
            type: "income",
            icon: "💼",
            active: true
        },

        {
            id: "other_income",
            name: "Otros ingresos",
            type: "income",
            icon: "💰",
            active: true
        },

        {
            id: "other_expense",
            name: "Otros gastos",
            type: "expense",
            icon: "📦",
            active: true
        }

    ],

    budgets: [

    ],

    statistics: {

    }

};

const savedFinanceFlowData =
    loadFinanceFlowData();


if (savedFinanceFlowData) {

    Object.assign(
        userData,
        savedFinanceFlowData
    );

}