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
   VENTANA DE PAGO (DESDE – HASTA)
========================================== */

/*
Cada tarjeta tiene:
- paymentStartDay: primer día del mes en que ya se puede pagar
- paymentDay:      último día para pagar (fecha máxima)
Si la ventana cruza de mes (ej. desde el 20 hasta el 5),
el inicio cae en el mes anterior a la fecha máxima.
Las tarjetas antiguas sin paymentStartDay se tratan como un solo día.
*/

function hasCreditPaymentWindow(card) {

    return (
        isValidCreditDay(card.paymentStartDay) &&
        Number(card.paymentStartDay) !== Number(card.paymentDay)
    );

}


/*
Ciclo de pago cuya fecha máxima cae en (year, month).
*/

function getCreditPaymentCycle(card, year, month) {

    const end =
        creditDateInMonth(year, month, card.paymentDay);

    if (!hasCreditPaymentWindow(card)) {

        return { start: end, end, hasWindow: false };

    }

    let start =
        creditDateInMonth(year, month, card.paymentStartDay);

    if (start > end) {

        start =
            creditDateInMonth(year, month - 1, card.paymentStartDay);

    }

    return { start, end, hasWindow: true };

}


/*
Ciclo vigente: el primero cuya fecha máxima es hoy o posterior.
*/

function getNextCreditPaymentCycle(card) {

    const today = creditToday();

    for (let i = 0; i < 3; i++) {

        const cycle =
            getCreditPaymentCycle(
                card,
                today.getFullYear(),
                today.getMonth() + i
            );

        if (cycle.end >= today) {

            return cycle;

        }

    }

    return getCreditPaymentCycle(
        card,
        today.getFullYear(),
        today.getMonth() + 3
    );

}


function creditDaysFromToday(date) {

    return Math.round(
        (date - creditToday()) /
        (1000 * 60 * 60 * 24)
    );

}


/*
Texto de estado del pago de una tarjeta:
- aún no abre → "Abre el 20 oct · en 3 días"
- ya abierto  → "Abierto · máximo 05 nov (en 6 días)"
*/

function describeCreditPaymentStatus(card) {

    const cycle = getNextCreditPaymentCycle(card);

    const today = creditToday();

    if (!cycle.hasWindow) {

        return `Límite ${formatCreditDate(cycle.end)} · ${describeCreditDays(cycle.end)}`;

    }

    if (cycle.start > today) {

        return `Abre el ${formatCreditDate(cycle.start)} (${describeCreditDays(cycle.start)}) · máximo ${formatCreditDate(cycle.end)}`;

    }

    return `Ya puedes pagar · máximo ${formatCreditDate(cycle.end)} (${describeCreditDays(cycle.end)})`;

}


function describeCreditPaymentRange(card) {

    return hasCreditPaymentWindow(card)
        ? `Del día ${card.paymentStartDay} al ${card.paymentDay}`
        : `Día ${card.paymentDay}`;

}


/* ==========================================
   EVENTOS PARA EL CALENDARIO
========================================== */

function buildCreditClosingEvent(card, date) {

    const iso = creditISO(date);

    return {

        id: `credit-closing-${card.id}-${iso.slice(0, 7)}`,

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
Eventos de un ciclo de pago:
- "Ya puedes pagar" el primer día de la ventana (si hay rango)
- "Último día para pagar" en la fecha máxima, con el monto
Ambos llevan range { start, end } para pintar la franja en el calendario.
*/

function buildCreditPaymentEvents(card, cycle) {

    const endISO = creditISO(cycle.end);

    const startISO = creditISO(cycle.start);

    const monthKey = endISO.slice(0, 7);

    const range =
        cycle.hasWindow
            ? { start: startISO, end: endISO, label: card.name }
            : null;

    const today = creditToday();

    const open =
        cycle.hasWindow &&
        cycle.start <= today &&
        cycle.end >= today;

    const events = [];

    if (cycle.hasWindow) {

        events.push({

            id: `credit-payopen-${card.id}-${monthKey}`,

            cardId: card.id,

            date: startISO,

            title: `Ya puedes pagar ${card.name}`,

            description:
                `Ventana de pago abierta. Fecha máxima: ${formatCreditDate(cycle.end)}.`,

            amount: 0,

            type: "reminder",

            icon: "🟢",

            range

        });

    }

    events.push({

        id: `credit-payment-${card.id}-${monthKey}`,

        cardId: card.id,

        date: endISO,

        title: `Pago ${card.name}`,

        description:
            cycle.hasWindow
                ? (
                    open
                        ? `Último día para pagar (ya puedes pagar desde el ${formatCreditDate(cycle.start)}).`
                        : `Último día para pagar (puedes pagar desde el ${formatCreditDate(cycle.start)}).`
                )
                : "Fecha límite de pago de tu tarjeta.",

        amount: Number(card.used) || 0,

        type: "expense",

        icon: "💳",

        range

    });

    return events;

}


/*
Eventos de todas las tarjetas activas dentro de un mes.
Se revisan los ciclos que terminan este mes y el siguiente,
porque el inicio de la ventana puede caer en el mes anterior.
*/

function getCreditCardEventsForMonth(year, month) {

    const prefix =
        `${year}-${creditPad(month + 1)}-`;

    const events = [];

    const add = event => {

        if (
            event.date.startsWith(prefix) &&
            !events.some(item => item.id === event.id)
        ) {

            events.push(event);

        }

    };

    getActiveCreditCards().forEach(card => {

        if (isValidCreditDay(card.closingDay)) {

            add(
                buildCreditClosingEvent(
                    card,
                    creditDateInMonth(year, month, card.closingDay)
                )
            );

        }

        if (isValidCreditDay(card.paymentDay)) {

            [0, 1].forEach(offset => {

                buildCreditPaymentEvents(
                    card,
                    getCreditPaymentCycle(card, year, month + offset)
                ).forEach(add);

            });

        }

    });

    return events;

}


/*
Franjas "puedes pagar" de todas las tarjetas activas que tocan
el rango de fechas dado (YYYY-MM-DD).
*/

function getCreditPaymentWindows(fromISO, toISO) {

    const from = new Date(`${fromISO}T00:00:00`);

    const windows = [];

    getActiveCreditCards().forEach(card => {

        if (
            !isValidCreditDay(card.paymentDay) ||
            !hasCreditPaymentWindow(card)
        ) {

            return;

        }

        for (let i = -1; i <= 2; i++) {

            const cycle =
                getCreditPaymentCycle(
                    card,
                    from.getFullYear(),
                    from.getMonth() + i
                );

            const start = creditISO(cycle.start);

            const end = creditISO(cycle.end);

            if (end >= fromISO && start <= toISO) {

                windows.push({

                    id: `credit-window-${card.id}-${end.slice(0, 7)}`,

                    label: `💳 ${card.name}`,

                    start,

                    end,

                    kind: "expense"

                });

            }

        }

    });

    return windows;

}


/*
Próximo cierre y próximo pago de cada tarjeta activa.
*/

function getCreditCardUpcomingEvents() {

    const events = [];

    getActiveCreditCards().forEach(card => {

        if (isValidCreditDay(card.closingDay)) {

            events.push(
                buildCreditClosingEvent(
                    card,
                    getNextCreditDate(card.closingDay)
                )
            );

        }

        if (isValidCreditDay(card.paymentDay)) {

            buildCreditPaymentEvents(
                card,
                getNextCreditPaymentCycle(card)
            ).forEach(event => events.push(event));

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

    if (!isValidCreditDay(data.paymentStartDay)) {

        throw new Error(
            "Indica desde qué día puedes pagar (entre 1 y 31)."
        );

    }

    if (!isValidCreditDay(data.paymentDay)) {

        throw new Error(
            "La fecha máxima de pago debe estar entre 1 y 31."
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

        paymentStartDay: Number(data.paymentStartDay),

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

        if (event.id.startsWith("credit-payopen-")) {

            if (days === 0) {

                createUniqueNotification({

                    type: "credit",

                    title: "Ya puedes pagar tu tarjeta",

                    message:
                        `${event.title}. ${event.description}`,

                    referenceId:
                        `credit_open_${cardId}_${event.date}`

                });

            }

            return;

        }

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
                        <strong>${escapeHTML(describeCreditPaymentRange(card))}</strong>
                        <small>
                            ${escapeHTML(describeCreditPaymentStatus(card))}
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

    const paymentStart =
        document.querySelector("#creditCardPaymentStartDay")?.value;

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

        const draft = {
            paymentDay: Number(payment),
            paymentStartDay: isValidCreditDay(paymentStart) ? Number(paymentStart) : null
        };

        const cycle = getNextCreditPaymentCycle(draft);

        parts.push(
            cycle.hasWindow
                ? `Podrás pagar del <b>${formatCreditDate(cycle.start)}</b> al <b>${formatCreditDate(cycle.end)}</b> · no te pases del <b>${formatCreditDate(cycle.end)}</b>`
                : `Próximo pago: <b>${formatCreditDate(cycle.end)}</b> (${describeCreditDays(cycle.end)})`
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
        field("#creditCardPaymentStartDay").value =
            isValidCreditDay(card.paymentStartDay)
                ? card.paymentStartDay
                : "";
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

    ["#creditCardClosingDay", "#creditCardPaymentStartDay", "#creditCardPaymentDay"].forEach(selector => {

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

            paymentStartDay: value("#creditCardPaymentStartDay"),

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
