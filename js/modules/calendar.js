/* ==========================================
   FINANCEFLOW
   MÓDULO · CALENDARIO
========================================== */


/* ==========================================
   OBTENER EVENTOS
========================================== */

function getCalendarEvents() {

    const events = [];


    /*
    PRÉSTAMOS PENDIENTES
    */

    if (Array.isArray(userData.loans)) {

        userData.loans.forEach(loan => {

            if (
                loan.status === "pending" &&
                loan.type === "to_receive" &&
                loan.dueDate &&
                isCalendarEventUpcoming(loan.dueDate)
            ) {

                events.push({

                    id: `loan-${loan.id}`,

                    date: loan.dueDate,

                    title: `Cobro: ${loan.person}`,

                    description:
                        "Dinero pendiente de recibir.",

                    amount:
                        Number(loan.amount || 0),

                    type: "income",

                    icon: "💰"

                });

            }

        });

    }


    /*
    TARJETAS DE CRÉDITO
    Próxima fecha de facturación y de pago de cada tarjeta activa.
    */

    if (typeof getCreditCardUpcomingEvents === "function") {

        getCreditCardUpcomingEvents().forEach(event => {

            events.push(event);

        });

    }

    /*
    EVENTOS CREADOS POR EL USUARIO ("Nuevo evento")
    */

    if (Array.isArray(userData.events)) {

        userData.events.forEach(event => {

            if (!event || !event.date) {

                return;

            }

            /* Pago / recordatorio que se repite cada mes:
               se muestra su próxima fecha */

            if (isRecurringEvent(event)) {

                const next = nextRecurringDate(event);

                if (next) {

                    events.push(buildEventOccurrence(event, next));

                }

                return;

            }

            events.push(buildEventOccurrence(event, event.date));

        });

    }

    return events.sort(
        (a, b) =>
            new Date(a.date) -
            new Date(b.date)
    );

}

function isCalendarEventUpcoming(
    dateString
) {

    const eventDate =
        new Date(
            `${dateString}T00:00:00`
        );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return (
        eventDate >= today
    );

}

/* ==========================================
   EVENTOS QUE SE REPITEN CADA MES
========================================== */

/*
Un evento guardado puede traer:
- repeat: "monthly"  → se repite el mismo día de cada mes
- repeatUntil: "AAAA-MM-DD" → último día en que se repite
  (vacío = sin fecha de fin)
Si un mes no tiene ese día (ej. 31 en febrero) se usa el último día.
*/

function isRecurringEvent(event) {

    return Boolean(
        event &&
        event.repeat === "monthly" &&
        event.date
    );

}

function recurringDateInMonth(event, year, month) {

    const start =
        new Date(`${event.date}T00:00:00`);

    if (Number.isNaN(start.getTime())) {

        return null;

    }

    const startIndex =
        start.getFullYear() * 12 + start.getMonth();

    if (year * 12 + month < startIndex) {

        return null;

    }

    const lastDay =
        new Date(year, month + 1, 0).getDate();

    const day =
        Math.min(start.getDate(), lastDay);

    const iso =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (iso < event.date) {

        return null;

    }

    if (event.repeatUntil && iso > event.repeatUntil) {

        return null;

    }

    return iso;

}

/*
Próxima fecha (hoy o después) de un evento mensual.
*/

function nextRecurringDate(event) {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    let year = today.getFullYear();

    let month = today.getMonth();

    for (let i = 0; i < 600; i++) {

        const iso = recurringDateInMonth(event, year, month);

        if (iso && new Date(`${iso}T00:00:00`) >= today) {

            return iso;

        }

        if (
            event.repeatUntil &&
            `${year}-${String(month + 1).padStart(2, "0")}` >
                event.repeatUntil.slice(0, 7)
        ) {

            return null;

        }

        month++;

        if (month > 11) {

            month = 0;

            year++;

        }

    }

    return null;

}

function describeRecurrence(event) {

    if (!isRecurringEvent(event)) {

        return "";

    }

    if (!event.repeatUntil) {

        return "Se repite cada mes";

    }

    const until =
        new Date(`${event.repeatUntil}T00:00:00`)
            .toLocaleDateString(
                "es-PE",
                { day: "2-digit", month: "short", year: "numeric" }
            );

    return `Se repite cada mes hasta ${until}`;

}

function buildEventOccurrence(event, date) {

    const recurring = isRecurringEvent(event);

    const base =
        event.description || "";

    return {

        id: event.id,

        occurrenceKey: `${event.id}@${date}`,

        date,

        title: event.title,

        description:
            recurring
                ? (
                    base
                        ? `${base} · ${describeRecurrence(event)}`
                        : describeRecurrence(event)
                )
                : (base || "Evento programado."),

        amount:
            Number(event.amount || 0),

        type:
            event.type || "reminder",

        icon:
            event.icon || "📌",

        custom: true,

        recurring

    };

}


/* ==========================================
   FORMATEAR FECHA
========================================== */

function formatCalendarDate(dateString) {

    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    if (Number.isNaN(date.getTime())) {

        return dateString;

    }


    return date.toLocaleDateString(
        "es-PE",
        {
            day: "2-digit",
            month: "short"
        }
    );

}


/* ==========================================
   RENDER CALENDARIO
========================================== */

function renderCalendar() {

    /* Calendario mensual (cuadrícula) */
    if (typeof renderFinanceCalendar === "function") {

        renderFinanceCalendar();

    }

    const container =
        document.querySelector(
            "#calendarEvents"
        );


    if (!container) {

        return;

    }


    const allEvents =
        getCalendarEvents();


    const events =
        allEvents.filter(
            event =>
                isCalendarEventUpcoming(
                    event.date
                )
        );


    const count =
        document.querySelector(
            "#calendarUpcomingCount"
        );


    const toReceive =
        document.querySelector(
            "#calendarToReceive"
        );


    /*
    RESUMEN
    */

    if (count) {

        count.textContent =
            events.length;

    }


    const receiveTotal =
        events

            .filter(
                event =>
                    event.type === "income"
            )

            .reduce(
                (total, event) =>
                    total + Number(event.amount || 0),
                0
            );


    if (toReceive) {

        toReceive.textContent =
            formatMoney(receiveTotal);

    }


    /*
    SIN EVENTOS
    */

    if (!events.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="empty-icon">
                    📭
                </span>

                <h4>
                    No tienes eventos próximos
                </h4>

                <p>
                    Cuando tengas pagos o ingresos programados aparecerán aquí.
                </p>

            </div>

        `;

        return;

    }


    /*
    RENDER EVENTOS
    */

    container.innerHTML =
        events.map(buildTimelineItem).join("");

}


/* ==========================================
   ITEM DE EVENTO (calendario y dashboard)
========================================== */

function buildTimelineItem(event) {

    const eventDate =
        new Date(
            `${event.date}T00:00:00`
        );


    const today =
        new Date();

    today.setHours(0, 0, 0, 0);


    const daysUntil =
        Math.ceil(
            (eventDate - today) /
            (1000 * 60 * 60 * 24)
        );


    let timingLabel;

    if (daysUntil === 0) {

        timingLabel = "Hoy";

    } else if (daysUntil === 1) {

        timingLabel = "Mañana";

    } else {

        timingLabel = `En ${daysUntil} días`;

    }


    const amountHTML =
        Number(event.amount) > 0
            ? `<span class="calendar-amount">
                   ${formatMoney(event.amount)}
               </span>`
            : "";


    const deleteHTML =
        event.custom
            ? `<button
                   type="button"
                   class="timeline-delete"
                   data-delete-event="${escapeHTML(event.id)}"
                   aria-label="Eliminar evento"
                   title="Eliminar evento">×</button>`
            : "";


    return `

        <div class="timeline-item is-${escapeHTML(event.type)}">

            <div class="timeline-date">

                ${formatCalendarDate(event.date)}

                <small>${timingLabel}</small>

            </div>

            <div class="timeline-content">

                <strong>
                    ${escapeHTML(event.icon)}
                    ${escapeHTML(event.title)}
                </strong>

                <p>${escapeHTML(event.description)}</p>

                ${amountHTML}

            </div>

            ${deleteHTML}

        </div>

    `;

}


/* ==========================================
   PRÓXIMOS EVENTOS DEL DASHBOARD
========================================== */

const DASHBOARD_EVENTS_LIMIT = 3;

function renderUpcomingEvents() {

    const container =
        document.querySelector(
            "#upcomingEvents"
        );

    if (!container) {

        return;

    }


    const events =
        getCalendarEvents().filter(
            event =>
                isCalendarEventUpcoming(
                    event.date
                )
        );


    if (!events.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="empty-icon">
                    📅
                </span>

                <h4>
                    No hay próximos eventos
                </h4>

                <p>
                    Tus próximos pagos, ingresos y compromisos aparecerán aquí.
                </p>

            </div>

        `;

        return;

    }


    const visible =
        events.slice(
            0,
            DASHBOARD_EVENTS_LIMIT
        );

    const hidden =
        events.length - visible.length;


    container.innerHTML =
        visible.map(buildTimelineItem).join("") +
        (
            hidden > 0
                ? `<p class="events-more">
                       y ${hidden} más en el calendario
                   </p>`
                : ""
        );

}


/* ==========================================
   MODAL · NUEVO EVENTO
========================================== */

function openEventModal(prefillDate) {

    const modal =
        document.querySelector("#eventModal");

    const form =
        document.querySelector("#eventForm");

    if (!modal || !form) {

        return;

    }

    form.reset();

    const error =
        document.querySelector("#eventFormError");

    if (error) {

        error.textContent = "";

    }

    const dateInput =
        document.querySelector("#eventDate");

    if (dateInput) {

        const now = new Date();

        const local =
            new Date(
                now.getTime() -
                now.getTimezoneOffset() * 60000
            ).toISOString().slice(0, 10);

        dateInput.min = local;

        dateInput.value =
            typeof prefillDate === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(prefillDate) &&
            prefillDate >= local
                ? prefillDate
                : local;

    }

    updateEventRepeatUI();

    modal.hidden = false;

    modal.classList.add("is-open");

    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    document.querySelector("#eventTitle")?.focus();

}

/*
Muestra u oculta las opciones de repetición y explica
en una línea cómo se repetirá el evento.
*/

function updateEventRepeatUI() {

    const repeat =
        document.querySelector("#eventRepeat")?.value === "monthly";

    const endMode =
        document.querySelector("#eventRepeatEnd")?.value || "never";

    const date =
        document.querySelector("#eventDate")?.value || "";

    const endGroup =
        document.querySelector("#eventRepeatEndGroup");

    const untilGroup =
        document.querySelector("#eventRepeatUntilGroup");

    const untilInput =
        document.querySelector("#eventRepeatUntil");

    const hint =
        document.querySelector("#eventRepeatHint");

    if (endGroup) {

        endGroup.hidden = !repeat;

    }

    if (untilGroup) {

        untilGroup.hidden = !(repeat && endMode === "date");

    }

    if (untilInput && date) {

        untilInput.min = date;

    }

    if (!hint) {

        return;

    }

    if (!repeat || !date) {

        hint.hidden = true;

        hint.textContent = "";

        return;

    }

    const day = Number(date.slice(8, 10));

    let text =
        `Se repetirá el día ${day} de cada mes` +
        (day > 28 ? " (en meses más cortos, el último día)" : "");

    const until =
        endMode === "date"
            ? untilInput?.value
            : "";

    if (until && until >= date) {

        const probe = {
            date,
            repeat: "monthly",
            repeatUntil: until
        };

        const start = new Date(`${date}T00:00:00`);

        let count = 0;

        for (
            let i = 0;
            i < 600;
            i++
        ) {

            const iso =
                recurringDateInMonth(
                    probe,
                    start.getFullYear() + Math.floor((start.getMonth() + i) / 12),
                    (start.getMonth() + i) % 12
                );

            if (iso) {

                count++;

            } else if (i > 0) {

                break;

            }

        }

        text +=
            ` hasta el ${new Date(`${until}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}` +
            ` (${count} ${count === 1 ? "vez" : "veces"})`;

    } else if (endMode === "never") {

        text += ", sin fecha de fin";

    }

    hint.textContent = text + ".";

    hint.hidden = false;

}

function closeEventModal() {

    const modal =
        document.querySelector("#eventModal");

    if (!modal) {

        return;

    }

    modal.classList.remove("is-open");

    modal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");

}

function initializeEventModal() {

    const modal =
        document.querySelector("#eventModal");

    const form =
        document.querySelector("#eventForm");

    if (!modal || !form) {

        return;

    }

    ["#eventRepeat", "#eventRepeatEnd", "#eventRepeatUntil", "#eventDate"]
        .forEach(selector => {

            const element =
                document.querySelector(selector);

            element?.addEventListener("change", updateEventRepeatUI);

            element?.addEventListener("input", updateEventRepeatUI);

        });

    document
        .querySelector("#closeEventModal")
        ?.addEventListener("click", closeEventModal);

    document
        .querySelector("#cancelEvent")
        ?.addEventListener("click", closeEventModal);

    modal.addEventListener("click", event => {

        if (event.target === modal) {

            closeEventModal();

        }

    });

    form.addEventListener("submit", event => {

        event.preventDefault();

        const error =
            document.querySelector("#eventFormError");

        const title =
            document.querySelector("#eventTitle")
                ?.value.trim() || "";

        const date =
            document.querySelector("#eventDate")
                ?.value || "";

        const type =
            document.querySelector("#eventType")
                ?.value || "reminder";

        const amount =
            Number(
                document.querySelector("#eventAmount")
                    ?.value || 0
            );

        const description =
            document.querySelector("#eventDescription")
                ?.value.trim() || "";

        const repeat =
            document.querySelector("#eventRepeat")
                ?.value === "monthly"
                ? "monthly"
                : "none";

        const repeatEnd =
            document.querySelector("#eventRepeatEnd")
                ?.value || "never";

        const repeatUntil =
            repeat === "monthly" && repeatEnd === "date"
                ? (
                    document.querySelector("#eventRepeatUntil")
                        ?.value || ""
                )
                : "";

        const fail = message => {

            if (error) {

                error.textContent = message;

            }

        };

        if (!title) {

            fail("Escribe un título para el evento.");

            return;

        }

        if (
            !date ||
            Number.isNaN(
                new Date(`${date}T00:00:00`).getTime()
            )
        ) {

            fail("Selecciona una fecha válida.");

            return;

        }

        if (!isCalendarEventUpcoming(date)) {

            fail("La fecha debe ser hoy o una fecha futura.");

            return;

        }

        if (!Number.isFinite(amount) || amount < 0) {

            fail("El monto debe ser igual o mayor que cero.");

            return;

        }

        if (repeat === "monthly" && repeatEnd === "date") {

            if (
                !repeatUntil ||
                Number.isNaN(
                    new Date(`${repeatUntil}T00:00:00`).getTime()
                )
            ) {

                fail("Elige hasta qué fecha se repite.");

                return;

            }

            if (repeatUntil < date) {

                fail("La fecha final no puede ser anterior a la del evento.");

                return;

            }

        }

        const icons = {
            reminder: "📌",
            expense: "💸",
            income: "💰"
        };

        if (!Array.isArray(userData.events)) {

            userData.events = [];

        }

        userData.events.push({

            id:
                `event_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,

            title,

            date,

            type,

            amount,

            description,

            icon:
                icons[type] || "📌",

            repeat,

            repeatUntil

        });

        saveFinanceFlowData();

        closeEventModal();

        refreshFinanceFlowUI();

        if (typeof checkFinancialNotifications === "function") {

            checkFinancialNotifications();

        }

        showNotification(
            repeat === "monthly"
                ? "Evento guardado. Se repetirá cada mes."
                : "Evento guardado.",
            "success"
        );

    });

    /* Eliminar eventos creados por el usuario */

    document.addEventListener("click", event => {

        const button =
            event.target.closest(
                "[data-delete-event]"
            );

        if (!button) {

            return;

        }

        const id =
            button.dataset.deleteEvent;

        const target =
            (userData.events || []).find(
                item => String(item.id) === String(id)
            );

        const message =
            isRecurringEvent(target)
                ? "¿Eliminar este evento recurrente? Se quitará de todos los meses."
                : "¿Eliminar este evento?";

        if (!confirm(message)) {

            return;

        }

        userData.events =
            (userData.events || []).filter(
                item => String(item.id) !== String(id)
            );

        saveFinanceFlowData();

        refreshFinanceFlowUI();

    });

}


/* ==========================================
   NOTIFICACIONES DE EVENTOS (hoy / mañana)
========================================== */

function checkEventNotifications() {

    if (
        !Array.isArray(userData.events) ||
        typeof createUniqueNotification !== "function"
    ) {

        return;

    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    userData.events.forEach(event => {

        const nextDate =
            isRecurringEvent(event)
                ? nextRecurringDate(event)
                : event.date;

        if (!nextDate) {

            return;

        }

        const eventDate =
            new Date(`${nextDate}T00:00:00`);

        const days =
            Math.round(
                (eventDate - today) /
                (1000 * 60 * 60 * 24)
            );

        if (days !== 0 && days !== 1) {

            return;

        }

        createUniqueNotification({

            type: "event",

            title:
                days === 0
                    ? "Evento para hoy"
                    : "Evento para mañana",

            message: event.title,

            referenceId:
                `event_${days === 0 ? "today" : "tomorrow"}_${event.id}_${nextDate}`

        });

    });

}


/* ==========================================
   CALENDARIO MENSUAL (CUADRÍCULA)
========================================== */

const financeCalendarState = {

    year: null,

    month: null,        // 0-11

    selected: null      // "YYYY-MM-DD"

};

const CALENDAR_TYPE_LABELS = {

    income: "Ingreso",

    expense: "Pago",

    reminder: "Recordatorio"

};

function calendarPad(number) {

    return String(number).padStart(2, "0");

}

function calendarISO(year, month, day) {

    return `${year}-${calendarPad(month + 1)}-${calendarPad(day)}`;

}

function calendarTodayISO() {

    const now = new Date();

    return calendarISO(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

}

function calendarEventKind(event) {

    return (
        event.type === "income" ||
        event.type === "expense"
    )
        ? event.type
        : "reminder";

}

/*
Eventos de un mes concreto. Además de los eventos guardados,
la facturación y el pago de cada tarjeta de crédito se repiten
cada mes (desde hoy en adelante).
*/

function getCalendarMonthEvents(year, month) {

    const prefix = `${year}-${calendarPad(month + 1)}-`;

    const events =
        getCalendarEvents().filter(
            event => String(event.date).startsWith(prefix)
        );

    if (Array.isArray(userData.events)) {

        userData.events.forEach(event => {

            if (!isRecurringEvent(event)) {

                return;

            }

            const date =
                recurringDateInMonth(event, year, month);

            if (
                date &&
                isCalendarEventUpcoming(date) &&
                !events.some(
                    item => item.id === event.id && item.date === date
                )
            ) {

                events.push(buildEventOccurrence(event, date));

            }

        });

    }

    if (typeof getCreditCardEventsForMonth === "function") {

        getCreditCardEventsForMonth(year, month).forEach(event => {

            const exists =
                events.some(item => item.id === event.id);

            if (!exists && isCalendarEventUpcoming(event.date)) {

                events.push(event);

            }

        });

    }

    return events;

}

function renderFinanceCalendar() {

    const grid =
        document.querySelector("#ffCalGrid");

    if (!grid) {

        return;

    }

    const state = financeCalendarState;

    const todayISO = calendarTodayISO();

    if (state.year === null) {

        const now = new Date();

        state.year = now.getFullYear();

        state.month = now.getMonth();

        state.selected = todayISO;

    }

    /* Título del mes */

    const monthName =
        new Date(state.year, state.month, 1)
            .toLocaleDateString("es-PE", { month: "long" });

    const monthLabel =
        document.querySelector("#ffCalMonth");

    if (monthLabel) {

        monthLabel.innerHTML =
            `${escapeHTML(monthName)} <b>${state.year}</b>`;

    }

    /* Eventos del mes agrupados por fecha */

    const monthEvents =
        getCalendarMonthEvents(state.year, state.month);

    const byDate = {};

    monthEvents.forEach(event => {

        (byDate[event.date] = byDate[event.date] || []).push(event);

    });

    const summary =
        document.querySelector("#ffCalSummary");

    if (summary) {

        summary.textContent =
            monthEvents.length === 0
                ? "Sin eventos este mes"
                : monthEvents.length === 1
                    ? "1 evento este mes"
                    : `${monthEvents.length} eventos este mes`;

    }

    /* Cuadrícula: semanas de lunes a domingo (solo las filas que el mes necesita) */

    const firstDay =
        new Date(state.year, state.month, 1);

    const offset =
        (firstDay.getDay() + 6) % 7;

    const daysInMonth =
        new Date(state.year, state.month + 1, 0).getDate();

    const totalCells =
        Math.ceil((offset + daysInMonth) / 7) * 7;

    const cells = [];

    for (let i = 0; i < totalCells; i++) {

        const date =
            new Date(state.year, state.month, 1 - offset + i);

        const iso =
            calendarISO(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );

        const inMonth =
            date.getMonth() === state.month;

        /* Los días de otros meses también muestran sus eventos guardados */

        const dayEvents =
            inMonth
                ? (byDate[iso] || [])
                : getCalendarMonthEvents(date.getFullYear(), date.getMonth())
                    .filter(event => event.date === iso);

        const classes = ["ffcal-cell"];

        if (!inMonth) classes.push("is-outside");

        if (iso === todayISO) classes.push("is-today");

        if (iso === state.selected) classes.push("is-selected");

        if (dayEvents.length) classes.push("has-events");

        const chips =
            dayEvents
                .slice(0, 2)
                .map(event =>
                    `<span class="ffcal-chip is-${calendarEventKind(event)}">${escapeHTML(event.title)}</span>`
                )
                .join("");

        const more =
            dayEvents.length > 2
                ? `<span class="ffcal-more">+${dayEvents.length - 2} más</span>`
                : "";

        const dots =
            dayEvents
                .slice(0, 3)
                .map(event =>
                    `<i class="ffcal-dot is-${calendarEventKind(event)}"></i>`
                )
                .join("");

        const label =
            date.toLocaleDateString(
                "es-PE",
                { weekday: "long", day: "numeric", month: "long" }
            ) +
            (
                dayEvents.length
                    ? `, ${dayEvents.length} ${dayEvents.length === 1 ? "evento" : "eventos"}`
                    : ""
            );

        cells.push(`

            <button
                type="button"
                class="${classes.join(" ")}"
                data-cal-date="${iso}"
                role="gridcell"
                aria-label="${escapeHTML(label)}"
                aria-selected="${iso === state.selected}"
                tabindex="${iso === state.selected ? 0 : -1}">

                <span class="ffcal-num">${date.getDate()}</span>

                <span class="ffcal-chips">${chips}${more}</span>

                <span class="ffcal-dots">${dots}</span>

            </button>

        `);

    }

    grid.innerHTML = cells.join("");

    renderFinanceCalendarDay();

}

function renderFinanceCalendarDay() {

    const state = financeCalendarState;

    const list =
        document.querySelector("#ffCalDayEvents");

    const title =
        document.querySelector("#ffCalDayTitle");

    const kicker =
        document.querySelector("#ffCalDayKicker");

    const addButton =
        document.querySelector("#ffCalAdd");

    if (!list || !state.selected) {

        return;

    }

    const date =
        new Date(`${state.selected}T00:00:00`);

    const todayISO = calendarTodayISO();

    if (title) {

        const longDate =
            date.toLocaleDateString(
                "es-PE",
                { weekday: "long", day: "numeric", month: "long" }
            );

        title.textContent =
            longDate.charAt(0).toUpperCase() + longDate.slice(1);

    }

    if (kicker) {

        const days =
            Math.round(
                (date - new Date(`${todayISO}T00:00:00`)) /
                (1000 * 60 * 60 * 24)
            );

        kicker.textContent =
            days === 0
                ? "Hoy"
                : days === 1
                    ? "Mañana"
                    : days === -1
                        ? "Ayer"
                        : days > 1
                            ? `En ${days} días`
                            : `Hace ${Math.abs(days)} días`;

    }

    if (addButton) {

        /* No se pueden crear eventos en fechas pasadas */

        addButton.hidden = state.selected < todayISO;

    }

    const dayMonth = date.getMonth();

    const dayEvents =
        getCalendarMonthEvents(date.getFullYear(), dayMonth)
            .filter(event => event.date === state.selected);

    if (!dayEvents.length) {

        list.innerHTML = `

            <div class="ffcal-empty">

                <span>🗓️</span>

                <p>No hay eventos para este día.</p>

            </div>

        `;

        return;

    }

    list.innerHTML =
        dayEvents.map(event => {

            const kind = calendarEventKind(event);

            const amount =
                Number(event.amount) > 0
                    ? `<span class="ffcal-item-amount">${formatMoney(event.amount)}</span>`
                    : "";

            const remove =
                event.custom
                    ? `<button
                           type="button"
                           class="timeline-delete"
                           data-delete-event="${escapeHTML(event.id)}"
                           aria-label="Eliminar evento"
                           title="Eliminar evento">×</button>`
                    : "";

            return `

                <div class="ffcal-item is-${kind}">

                    <span class="ffcal-item-icon">${escapeHTML(event.icon || "📌")}</span>

                    <div class="ffcal-item-body">

                        <strong>${escapeHTML(event.title)}</strong>

                        <p>${escapeHTML(event.description || "")}</p>

                        <span class="ffcal-item-type">${CALENDAR_TYPE_LABELS[kind]}</span>

                        ${amount}

                    </div>

                    ${remove}

                </div>

            `;

        }).join("");

}

function selectCalendarDate(iso, focus) {

    const state = financeCalendarState;

    const date =
        new Date(`${iso}T00:00:00`);

    if (Number.isNaN(date.getTime())) {

        return;

    }

    state.selected = iso;

    state.year = date.getFullYear();

    state.month = date.getMonth();

    renderFinanceCalendar();

    if (focus) {

        document
            .querySelector(`[data-cal-date="${iso}"]`)
            ?.focus();

    }

}

function shiftCalendarMonth(step) {

    const state = financeCalendarState;

    const target =
        new Date(state.year, state.month + step, 1);

    state.year = target.getFullYear();

    state.month = target.getMonth();

    /* Si el día elegido no pertenece al nuevo mes, se elige el día 1
       (o hoy si el mes visible es el actual) */

    const now = new Date();

    state.selected =
        (
            target.getFullYear() === now.getFullYear() &&
            target.getMonth() === now.getMonth()
        )
            ? calendarTodayISO()
            : calendarISO(target.getFullYear(), target.getMonth(), 1);

    renderFinanceCalendar();

}

function initializeFinanceCalendar() {

    const grid =
        document.querySelector("#ffCalGrid");

    if (!grid || grid.dataset.ready === "true") {

        return;

    }

    grid.dataset.ready = "true";

    document
        .querySelector("#ffCalPrev")
        ?.addEventListener("click", () => shiftCalendarMonth(-1));

    document
        .querySelector("#ffCalNext")
        ?.addEventListener("click", () => shiftCalendarMonth(1));

    document
        .querySelector("#ffCalToday")
        ?.addEventListener("click", () => selectCalendarDate(calendarTodayISO()));

    document
        .querySelector("#ffCalAdd")
        ?.addEventListener("click", () => {

            openEventModal(financeCalendarState.selected);

        });

    grid.addEventListener("click", event => {

        const cell =
            event.target.closest("[data-cal-date]");

        if (cell) {

            selectCalendarDate(cell.dataset.calDate, true);

        }

    });

    /* Teclado: flechas = día/semana, Inicio/Fin = primer/último día del mes */

    grid.addEventListener("keydown", event => {

        const cell =
            event.target.closest("[data-cal-date]");

        if (!cell) {

            return;

        }

        const steps = {

            ArrowLeft: -1,

            ArrowRight: 1,

            ArrowUp: -7,

            ArrowDown: 7

        };

        if (!(event.key in steps)) {

            return;

        }

        event.preventDefault();

        const date =
            new Date(`${cell.dataset.calDate}T00:00:00`);

        date.setDate(date.getDate() + steps[event.key]);

        selectCalendarDate(
            calendarISO(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            ),
            true
        );

    });

}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeFinanceCalendar
    );

} else {

    initializeFinanceCalendar();

}
