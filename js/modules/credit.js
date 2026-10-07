/*
==========================================
FinanceFlow
Archivo: credit.js

Gestiona tarjetas de crédito:
- Crear, editar y eliminar tarjetas
- Día de facturación (cierre) y día de pago
- Eventos para el Calendario y "Próximos eventos"
- Alertas de fechas próximas
- Render de la sección Crédito
==========================================
*/


/* ==========================================
   LECTURA DE TARJETAS
========================================== */

function getCreditCards() {

    if (!Array.isArray(userData.creditCards)) {

        userData.creditCards = [];

    }

    return userData.creditCards;

}


function getActiveCreditCards() {

    return getCreditCards().filter(
        card => card && card.active !== false
    );

}


function getCreditCardById(id) {

    return getCreditCards().find(
        card => String(card.id) === String(id)
    ) || null;

}


function getPrimaryCreditCard() {

    return getActiveCreditCards()[0] || null;

}


/*
Los totales suman todas las tarjetas activas.
*/

function getCreditUsed() {

    return getActiveCreditCards().reduce(
        (total, card) => total + (Number(card.used) || 0),
        0
    );

}


function getCreditLimit() {

    return getActiveCreditCards().reduce(
        (total, card) => total + (Number(card.limit) || 0),
        0
    );

}


function getCreditAvailable() {

    return Math.max(
        0,
        getCreditLimit() - getCreditUsed()
    );

}


function getCreditPercentage() {

    const limit = getCreditLimit();

    if (!limit) {

        return 0;

    }

    return calculatePercentage(
        getCreditUsed(),
        limit
    );

}


/* ==========================================
   FECHAS DE FACTURACIÓN Y PAGO
========================================== */

function creditPad(number) {

    return String(number).padStart(2, "0");

}


function creditISO(date) {

    return `${date.getFullYear()}-${creditPad(date.getMonth() + 1)}-${creditPad(date.getDate())}`;

}


function creditToday() {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return today;

}


/*
Fecha de un día concreto dentro de un mes.
Si el mes tiene menos días (ej. 31 en febrero),
se usa el último día del mes.
*/

function creditDateInMonth(year, month, day) {

    const lastDay =
        new Date(year, month + 1, 0).getDate();

    return new Date(
        year,
        month,
        Math.min(Math.max(1, Number(day)), lastDay)
    );

}


/*
Próxima vez (hoy o después) que ocurre ese día del mes.
*/

function getNextCreditDate(day) {

    const today = creditToday();

    let date =
        creditDateInMonth(
            today.getFullYear(),
            today.getMonth(),
            day
        );

    if (date < today) {

        date =
            creditDateInMonth(
                today.getFullYear(),
                today.getMonth() + 1,
                day
            );

    }

    return date;

}


function isValidCreditDay(value) {

    const day = Number(value);

    return (
        Number.isInteger(day) &&
        day >= 1 &&
        day <= 31
    );

}


function formatCreditDate(date) {

    return date.toLocaleDateString(
        "es-PE",
        {
            day: "2-digit",
            month: "short"
        }
    );

}


function describeCreditDays(date) {

    const days =
        Math.round(
            (date - creditToday()) /
            (1000 * 60 * 60 * 24)
        );

    if (days === 0) {

        return "hoy";

    }

    if (days === 1) {

        return "mañana";

    }

    return `en ${days} días`;

}


/* ==========================================
   EVENTOS PARA EL CALENDARIO
========================================== */

function buildCreditCardEvent(card, kind, date) {

    const iso = creditISO(date);

    const monthKey = iso.slice(0, 7);

    if (kind === "payment") {

        return {

            id: `credit-payment-${card.id}-${monthKey}`,

            cardId: card.id,

            date: iso,

            title: `Pago ${card.name}`,

            description: "Fecha límite de pago de tu tarjeta.",

            amount: Number(card.used) || 0,

            type: "expense",

            icon: "💳"

        };

    }

    return {

        id: `credit-closing-${card.id}-${monthKey}`,

        cardId: card.id,

        date: iso,

        title: `Facturación ${card.name}`,

        description: "Cierre del ciclo de facturación.",

        amount: 0,

        type: "reminder",

        icon: "🧾"

    };

}


/*
Eventos de todas las tarjetas activas dentro de un mes.
*/

function getCreditCardEventsForMonth(year, month) {

    const events = [];

    getActiveCreditCards().forEach(card => {

        if (isValidCreditDay(card.closingDay)) {

            events.push(
                buildCreditCardEvent(
                    card,
                    "closing",
                    creditDateInMonth(year, month, card.closingDay)
                )
            );

        }

        if (isValidCreditDay(card.paymentDay)) {

            events.push(
                buildCreditCardEvent(
                    card,
                    "payment",
                    creditDateInMonth(year, month, card.paymentDay)
                )
            );

        }

    });

    return events;

}


/*
Próximo cierre y próximo pago de cada tarjeta activa.
*/

function getCreditCardUpcomingEvents() {

    const events = [];

    getActiveCreditCards().forEach(card => {

        if (isValidCreditDay(card.closingDay)) {

            events.push(
                buildCreditCardEvent(
                    card,
                    "closing",
                    getNextCreditDate(card.closingDay)
                )
            );

        }

        if (isValidCreditDay(card.paymentDay)) {

            events.push(
                buildCreditCardEvent(
                    card,
                    "payment",
                    getNextCreditDate(card.paymentDay)
                )
            );

        }

    });

    return events;

}


/* ==========================================
   CREAR / EDITAR / ELIMINAR
========================================== */

function readCreditCardData(data, currentId) {

    const name =
        String(data.name || "").trim();

    if (!name) {

        throw new Error(
            "El nombre de la tarjeta es obligatorio."
        );

    }

    const duplicated =
        getActiveCreditCards().some(
            card =>
                String(card.id) !== String(currentId) &&
                String(card.name).toLowerCase() ===
                name.toLowerCase()
        );

    if (duplicated) {

        throw new Error(
            "Ya existe una tarjeta con ese nombre."
        );

    }

    const limit = Number(data.limit);

    if (
        data.limit === "" ||
        !Number.isFinite(limit) ||
        limit <= 0
    ) {

        throw new Error(
            "El límite de crédito debe ser mayor que cero."
        );

    }

    const used =
        data.used === "" || data.used === undefined
            ? 0
            : Number(data.used);

    if (
        !Number.isFinite(used) ||
        used < 0
    ) {

        throw new Error(
            "El monto utilizado no es válido."
        );

    }

    if (used > limit) {

        throw new Error(
            "El monto utilizado no puede superar el límite."
        );

    }

    if (!isValidCreditDay(data.closingDay)) {

        throw new Error(
            "El día de facturación debe estar entre 1 y 31."
        );

    }

    if (!isValidCreditDay(data.paymentDay)) {

        throw new Error(
            "El día de pago debe estar entre 1 y 31."
        );

    }

    const monthlyGoal =
        data.monthlyGoal === "" ||
        data.monthlyGoal === undefined
            ? 0
            : Number(data.monthlyGoal);

    if (
        !Number.isFinite(monthlyGoal) ||
        monthlyGoal < 0
    ) {

        throw new Error(
            "La meta mensual no es válida."
        );

    }

    return {

        name,

        limit,

        used,

        closingDay: Number(data.closingDay),

        paymentDay: Number(data.paymentDay),

        monthlyGoal

    };

}


function createCreditCard(data) {

    const values =
        readCreditCardData(data, null);

    const card = {

        id: generateId(),

        ...values,

        active: true

    };

    getCreditCards().push(card);

    saveFinanceFlowData();

    return card;

}


function updateCreditCard(id, data) {

    const card =
        getCreditCardById(id);

    if (!card) {

        throw new Error(
            "La tarjeta no existe."
        );

    }

    Object.assign(
        card,
        readCreditCardData(data, id)
    );

    saveFinanceFlowData();

    return card;

}


function deleteCreditCard(id) {

    userData.creditCards =
        getCreditCards().filter(
            card => String(card.id) !== String(id)
        );

    saveFinanceFlowData();

}


/* ==========================================
   ALERTAS DE FECHAS
========================================== */

function checkCreditDateNotifications() {

    if (typeof createUniqueNotification !== "function") {

        return;

    }

    getCreditCardUpcomingEvents().forEach(event => {

        const cardId =
            event.cardId;

        const days =
            Math.round(
                (new Date(`${event.date}T00:00:00`) - creditToday()) /
                (1000 * 60 * 60 * 24)
            );

        if (event.id.startsWith("credit-payment-")) {

            if (days > 3 || event.amount <= 0) {

                return;

            }

            createUniqueNotification({

                type: "credit",

                title: "Pago de tarjeta próximo",

                message:
                    `${event.title}: ${formatMoney(event.amount)} ${describeCreditDays(new Date(`${event.date}T00:00:00`))}.`,

                referenceId:
                    `credit_due_${cardId}_${event.date}`

            });

            return;

        }

        if (days <= 1) {

            createUniqueNotification({

                type: "credit",

                title: "Cierre de facturación",

                message:
                    `${event.title} ${describeCreditDays(new Date(`${event.date}T00:00:00`))}.`,

                referenceId:
                    `credit_close_${cardId}_${event.date}`

            });

        }

    });

}


/* ==========================================
   RENDER · SECCIÓN CRÉDITO
========================================== */

function renderCreditPage() {

    const cards =
        getActiveCreditCards();

    const setText = (selector, value) => {

        const element =
            document.querySelector(selector);

        if (element) {

            element.textContent = value;

        }

    };

    setText("#creditUsed", formatMoney(getCreditUsed()));
    setText("#creditLimit", formatMoney(getCreditLimit()));
    setText("#creditAvailable", formatMoney(getCreditAvailable()));
    setText("#creditPercentage", `${Math.round(getCreditPercentage())}%`);

    const container =
        document.querySelector("#creditCardsList");

    if (!container) {

        return;

    }

    if (!cards.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="empty-icon">💳</span>

                <h4>No tienes tarjetas activas</h4>

                <p>
                    Agrega una tarjeta con su día de facturación y de pago
                    para verla en tu calendario y en tus próximos eventos.
                </p>

                <button
                    type="button"
                    class="btn-primary"
                    data-credit-action="new">

                    + Agregar tarjeta

                </button>

            </div>

        `;

        return;

    }

    container.innerHTML =
        cards.map(buildCreditCardHTML).join("");

}


function buildCreditCardHTML(card) {

    const limit = Number(card.limit) || 0;

    const used = Number(card.used) || 0;

    const available = Math.max(limit - used, 0);

    const percentage =
        limit > 0
            ? calculatePercentage(used, limit)
            : 0;

    const nextClosing =
        getNextCreditDate(card.closingDay);

    const nextPayment =
        getNextCreditDate(card.paymentDay);

    const goalHTML =
        Number(card.monthlyGoal) > 0
            ? `<div>
                   <span>Meta mensual</span>
                   <strong>${formatMoney(card.monthlyGoal)}</strong>
               </div>`
            : "";

    return `

        <article class="card credit-card-detail">

            <div class="card-header">

                <div>

                    <span class="card-title">
                        ${escapeHTML(card.name)}
                    </span>

                    <p class="card-description">
                        Tarjeta activa
                    </p>

                </div>

                <span class="account-status">
                    ● Activa
                </span>

            </div>

            <div class="card-body">

                <div class="credit-detail-grid">

                    <div>
                        <span>Utilizado</span>
                        <strong>${formatMoney(used)}</strong>
                    </div>

                    <div>
                        <span>Límite</span>
                        <strong>${formatMoney(limit)}</strong>
                    </div>

                    <div>
                        <span>Disponible</span>
                        <strong>${formatMoney(available)}</strong>
                    </div>

                    <div>
                        <span>Uso</span>
                        <strong>${Math.round(percentage)}%</strong>
                    </div>

                </div>

                <div class="credit-progress">

                    <div
                        class="credit-progress-bar"
                        style="width:${Math.min(Math.max(percentage, 0), 100)}%">
                    </div>

                </div>

                <div class="credit-dates">

                    <div>
                        <span>Facturación</span>
                        <strong>Día ${escapeHTML(card.closingDay)}</strong>
                        <small>
                            ${formatCreditDate(nextClosing)} · ${describeCreditDays(nextClosing)}
                        </small>
                    </div>

                    <div>
                        <span>Pago</span>
                        <strong>Día ${escapeHTML(card.paymentDay)}</strong>
                        <small>
                            ${formatCreditDate(nextPayment)} · ${describeCreditDays(nextPayment)}
                        </small>
                    </div>

                    ${goalHTML}

                </div>

                <div class="account-card-actions credit-card-actions">

                    <button
                        type="button"
                        class="account-action"
                        data-credit-action="edit"
                        data-credit-id="${escapeHTML(card.id)}">

                        Editar

                    </button>

                    <button
                        type="button"
                        class="account-action is-danger"
                        data-credit-action="delete"
                        data-credit-id="${escapeHTML(card.id)}">

                        Eliminar

                    </button>

                </div>

            </div>

        </article>

    `;

}


/* ==========================================
   MODAL · AGREGAR / EDITAR TARJETA
========================================== */

let editingCreditCardId = null;


function updateCreditDatePreview() {

    const preview =
        document.querySelector("#creditCardPreview");

    if (!preview) {

        return;

    }

    const closing =
        document.querySelector("#creditCardClosingDay")?.value;

    const payment =
        document.querySelector("#creditCardPaymentDay")?.value;

    const parts = [];

    if (isValidCreditDay(closing)) {

        const date = getNextCreditDate(closing);

        parts.push(
            `Próxima facturación: <b>${formatCreditDate(date)}</b> (${describeCreditDays(date)})`
        );

    }

    if (isValidCreditDay(payment)) {

        const date = getNextCreditDate(payment);

        parts.push(
            `Próximo pago: <b>${formatCreditDate(date)}</b> (${describeCreditDays(date)})`
        );

    }

    preview.innerHTML =
        parts.length
            ? parts.join("<br>")
            : "Indica los días para ver las próximas fechas.";

}


function openCreditCardModal(cardId) {

    const modal =
        document.querySelector("#creditCardModal");

    const form =
        document.querySelector("#creditCardForm");

    if (!modal || !form) {

        return;

    }

    form.reset();

    const error =
        document.querySelector("#creditCardFormError");

    if (error) {

        error.textContent = "";

    }

    const card =
        cardId ? getCreditCardById(cardId) : null;

    editingCreditCardId =
        card ? card.id : null;

    const field = id =>
        document.querySelector(id);

    if (card) {

        field("#creditCardName").value = card.name;
        field("#creditCardLimit").value = card.limit;
        field("#creditCardUsed").value = card.used;
        field("#creditCardClosingDay").value = card.closingDay;
        field("#creditCardPaymentDay").value = card.paymentDay;
        field("#creditCardGoal").value = card.monthlyGoal || "";

    }

    field("#creditCardModalTitle").textContent =
        card ? "Editar tarjeta" : "Nueva tarjeta";

    field("#creditCardSubmit").textContent =
        card ? "Guardar cambios" : "Guardar tarjeta";

    updateCreditDatePreview();

    modal.hidden = false;

    modal.classList.add("is-open");

    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    field("#creditCardName")?.focus();

}


function closeCreditCardModal() {

    const modal =
        document.querySelector("#creditCardModal");

    if (!modal) {

        return;

    }

    modal.classList.remove("is-open");

    modal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");

    editingCreditCardId = null;

}


function initializeCreditCards() {

    const modal =
        document.querySelector("#creditCardModal");

    const form =
        document.querySelector("#creditCardForm");

    if (!modal || !form) {

        return;

    }

    document
        .querySelector("#openCreditCardModal")
        ?.addEventListener("click", () => openCreditCardModal());

    document
        .querySelector("#closeCreditCardModal")
        ?.addEventListener("click", closeCreditCardModal);

    document
        .querySelector("#cancelCreditCard")
        ?.addEventListener("click", closeCreditCardModal);

    modal.addEventListener("click", event => {

        if (event.target === modal) {

            closeCreditCardModal();

        }

    });

    document.addEventListener("keydown", event => {

        if (
            event.key === "Escape" &&
            modal.classList.contains("is-open")
        ) {

            closeCreditCardModal();

        }

    });

    ["#creditCardClosingDay", "#creditCardPaymentDay"].forEach(selector => {

        document
            .querySelector(selector)
            ?.addEventListener("input", updateCreditDatePreview);

    });

    /* Botones de la lista: nueva, editar, eliminar */

    document
        .querySelector("#creditCardsList")
        ?.addEventListener("click", event => {

            const button =
                event.target.closest("[data-credit-action]");

            if (!button) {

                return;

            }

            const action = button.dataset.creditAction;

            const id = button.dataset.creditId;

            if (action === "new") {

                openCreditCardModal();

                return;

            }

            if (action === "edit") {

                openCreditCardModal(id);

                return;

            }

            if (action === "delete") {

                const card = getCreditCardById(id);

                if (
                    !card ||
                    !confirm(`¿Eliminar la tarjeta "${card.name}"? También se quitarán sus fechas del calendario.`)
                ) {

                    return;

                }

                deleteCreditCard(id);

                refreshCreditDependentUI();

                showNotification(
                    "Tarjeta eliminada.",
                    "success"
                );

            }

        });

    form.addEventListener("submit", event => {

        event.preventDefault();

        const error =
            document.querySelector("#creditCardFormError");

        if (error) {

            error.textContent = "";

        }

        const value = selector =>
            document.querySelector(selector)?.value ?? "";

        const data = {

            name: value("#creditCardName"),

            limit: value("#creditCardLimit"),

            used: value("#creditCardUsed"),

            closingDay: value("#creditCardClosingDay"),

            paymentDay: value("#creditCardPaymentDay"),

            monthlyGoal: value("#creditCardGoal")

        };

        try {

            const isEditing =
                editingCreditCardId !== null;

            if (isEditing) {

                updateCreditCard(editingCreditCardId, data);

            } else {

                createCreditCard(data);

            }

            closeCreditCardModal();

            refreshCreditDependentUI();

            showNotification(
                isEditing
                    ? "Tarjeta actualizada correctamente."
                    : "Tarjeta agregada. Sus fechas ya están en tu calendario.",
                "success"
            );

        } catch (err) {

            if (error) {

                error.textContent = err.message;

            }

        }

    });

    renderCreditPage();

}


/*
Refresca todo lo que depende de las tarjetas:
Crédito, dashboard (carrusel y Próximos eventos),
Calendario y alertas.
*/

function refreshCreditDependentUI() {

    if (typeof refreshFinanceFlowUI === "function") {

        refreshFinanceFlowUI();

    } else {

        renderCreditPage();

    }

    if (typeof checkFinancialNotifications === "function") {

        checkFinancialNotifications();

    }

}


document.addEventListener(
    "DOMContentLoaded",
    initializeCreditCards
);
