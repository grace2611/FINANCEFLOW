/*
==========================================
FinanceFlow
Archivo: utils.js
Versión: 0.1.0

Descripción:
Funciones reutilizables
utilizadas en toda la aplicación.
==========================================
*/

/**
 * Formatea números como moneda.
 * Ejemplo:
 * 286.5 -> S/ 286.50
 */
function formatMoney(value){

    return new Intl.NumberFormat("es-PE",{

        style:"currency",

        currency:"PEN"

    }).format(value);

}

/**
 * Devuelve la fecha actual.
 */
function getCurrentDate() {

    return new Date();

}


/**
 * Devuelve la fecha local
 * en formato YYYY-MM-DD.
 */
function getLocalDateString() {

    const date =
        getCurrentDate();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

/**
 * Convierte una fecha al formato peruano.
 */
function formatDate(date){

    return new Intl.DateTimeFormat("es-PE").format(date);

}

/**
 * Calcula un porcentaje.
 */
function calculatePercentage(current,total){

    if(total === 0){

        return 0;

    }

    return (current / total) * 100;

}

/**
 * Genera un ID temporal.
 * Más adelante será reemplazado
 * por Firebase.
 */
function generateId() {

    return `id_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;

}
/**
 * Evita insertar HTML no deseado
 * cuando mostramos texto ingresado por el usuario.
 */
function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}