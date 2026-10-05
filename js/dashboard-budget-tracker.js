/*
==========================================
FinanceFlow — dashboard-budget-tracker.js
==========================================
Lógica de la tarjeta "¿Cómo van tus gastos
este mes?": barra de presupuesto con marcador,
estado (verde/amarillo/rojo) y mensaje dinámico
que avisa cuando te excedes.

Origen: financeflow_presupuesto_demo (app.js)

Cómo se conecta con datos reales:
- "Ingresos del mes" = ingresos del mes actual
  (mismo valor que la tarjeta Ingresos del dashboard).
- "Gastado" = gastos del mes actual
  (mismo valor que la tarjeta Gastos del dashboard).
- El porcentaje se calcula como gastado / ingresos.

No modifica: cuentas, movimientos, créditos,
metas, sidebar, ni otras vistas.
==========================================
*/


/* ==========================================
   PORCENTAJE Y ESTADO
========================================== */

function calculateBudgetPercentage(income, spent) {

    /*
        Si no hay ingresos registrados, evitamos
        dividir entre cero.
    */

    if (income <= 0) {
        return spent > 0 ? 100 : 0;
    }

    return (spent / income) * 100;

}


function getBudgetStatus(percentage) {

    if (percentage < 70) {
        return "good";
    }

    if (percentage < 90) {
        return "warning";
    }

    return "danger";

}


/* ==========================================
   TEXTOS Y CLASES SEGÚN EL ESTADO
========================================== */

function getBudgetStatusContent(status, percentage, remaining) {

    if (status === "good") {

        return {
            pill: "Vas bien",
            icon: "✓",
            title: "Gastos bajo control",

            message:
                `Has utilizado el ${percentage.toFixed(1)}% de tus ingresos ` +
                `de este mes. Todavía te quedan ${formatMoney(remaining)} disponibles.`,

            pillClass: "budget-status-good",
            messageClass: "budget-message-good",
            fillClass: "budget-progress-good"
        };

    }


    if (status === "warning") {

        return {
            pill: "Cuidado",
            icon: "!",
            title: "Te queda poco margen",

            message:
                `Has utilizado el ${percentage.toFixed(1)}% de tus ingresos ` +
                `de este mes. Te quedan ${formatMoney(Math.max(remaining, 0))} para gastar.`,

            pillClass: "budget-status-warning",
            messageClass: "budget-message-warning",
            fillClass: "budget-progress-warning"
        };

    }


    return {
        pill: percentage > 100 ? "Excedido" : "Límite cercano",
        icon: "!",

        title: percentage > 100
            ? "Has excedido tus ingresos"
            : "Estás cerca del límite",

        message: percentage > 100
            ? `Has gastado ${formatMoney(Math.abs(remaining))} más de lo que ingresó este mes.`
            : `Solo te quedan ${formatMoney(Math.max(remaining, 0))} antes de superar tus ingresos.`,

        pillClass: "budget-status-danger",
        messageClass: "budget-message-danger",
        fillClass: "budget-progress-danger"
    };

}


/* ==========================================
   REFERENCIAS AL DOM (se resuelven en cada
   actualización por si el dashboard aún no
   existía cuando cargó el script)
========================================== */

function getBudgetTrackerElements() {

    return {

        spentAmount: document.querySelector("#budgetSpentAmount"),
        spentPercentage: document.querySelector("#budgetSpentPercentage"),
        budgetLimit: document.querySelector("#budgetLimitAmount"),

        progressTrack: document.querySelector("#budgetProgressTrack"),
        progressFill: document.querySelector("#budgetProgressFill"),
        progressMarker: document.querySelector("#budgetProgressMarker"),
        markerPercentage: document.querySelector("#budgetMarkerPercentage"),

        statusPill: document.querySelector("#budgetStatusPill"),
        statusPillText: document.querySelector("#budgetStatusPillText"),

        statusMessage: document.querySelector("#budgetStatusMessage"),
        statusMessageIcon: document.querySelector("#budgetStatusMessageIcon"),
        statusMessageTitle: document.querySelector("#budgetStatusMessageTitle"),
        statusMessageText: document.querySelector("#budgetStatusMessageText"),

        detailSpent: document.querySelector("#budgetDetailSpent"),
        detailRemaining: document.querySelector("#budgetDetailRemaining"),
        detailPercentage: document.querySelector("#budgetDetailPercentage")

    };

}


/* ==========================================
   ACTUALIZAR TODA LA TARJETA
========================================== */

function updateBudgetTrackerUI(income, spent) {

    const elements =
        getBudgetTrackerElements();

    /*
        Si la tarjeta no está en el DOM (por ejemplo,
        en otra vista) no hacemos nada.
    */

    if (!elements.progressTrack) {
        return;
    }


    const safeIncome =
        Number(income) || 0;

    const safeSpent =
        Number(spent) || 0;

    const remaining =
        safeIncome - safeSpent;

    const percentage =
        calculateBudgetPercentage(safeIncome, safeSpent);

    const status =
        getBudgetStatus(percentage);

    const content =
        getBudgetStatusContent(status, percentage, remaining);


    /* ---------- NÚMEROS ---------- */

    if (elements.spentAmount) {
        elements.spentAmount.textContent = formatMoney(safeSpent);
    }

    if (elements.spentPercentage) {
        elements.spentPercentage.textContent = `${percentage.toFixed(1)}%`;
    }

    if (elements.budgetLimit) {
        elements.budgetLimit.textContent = formatMoney(safeIncome);
    }


    /* ---------- BARRA DE PROGRESO ---------- */

    const visualPercentage =
        Math.min(Math.max(percentage, 0), 100);

    if (elements.progressFill) {

        elements.progressFill.style.width = `${visualPercentage}%`;

        elements.progressFill.classList.remove(
            "budget-progress-good",
            "budget-progress-warning",
            "budget-progress-danger"
        );

        elements.progressFill.classList.add(content.fillClass);

    }

    if (elements.progressMarker) {
        elements.progressMarker.style.left = `${visualPercentage}%`;
    }

    if (elements.markerPercentage) {
        elements.markerPercentage.textContent = `${Math.round(percentage)}%`;
    }

    if (elements.progressTrack) {
        elements.progressTrack.setAttribute("aria-valuenow", percentage.toFixed(1));
    }


    /* ---------- PILL DE ESTADO ---------- */

    if (elements.statusPill) {

        elements.statusPill.classList.remove(
            "budget-status-good",
            "budget-status-warning",
            "budget-status-danger"
        );

        elements.statusPill.classList.add(content.pillClass);

    }

    if (elements.statusPillText) {
        elements.statusPillText.textContent = content.pill;
    }


    /* ---------- MENSAJE DINÁMICO ---------- */

    if (elements.statusMessage) {

        elements.statusMessage.classList.remove(
            "budget-message-good",
            "budget-message-warning",
            "budget-message-danger"
        );

        elements.statusMessage.classList.add(content.messageClass);

    }

    if (elements.statusMessageIcon) {
        elements.statusMessageIcon.textContent = content.icon;
    }

    if (elements.statusMessageTitle) {
        elements.statusMessageTitle.textContent = content.title;
    }

    if (elements.statusMessageText) {
        elements.statusMessageText.textContent = content.message;
    }


    /* ---------- DETALLES INFERIORES ---------- */

    if (elements.detailSpent) {
        elements.detailSpent.textContent = formatMoney(safeSpent);
    }

    if (elements.detailRemaining) {

        elements.detailRemaining.textContent =
            remaining >= 0
                ? formatMoney(remaining)
                : `-${formatMoney(Math.abs(remaining))}`;

    }

    if (elements.detailPercentage) {
        elements.detailPercentage.textContent = `${percentage.toFixed(1)}%`;
    }

}
