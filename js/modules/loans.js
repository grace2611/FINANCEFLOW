/*
==========================================
FinanceFlow
Archivo: loans.js

Módulo de préstamos.

Responsabilidades:
- Crear préstamos
- Consultar préstamos
- Filtrar préstamos
- Marcar préstamos como pagados
- Eliminar préstamos
- Renderizar resumen
- Renderizar próximos vencimientos

No realiza lógica visual global.
==========================================
*/


/* ==========================================
   OBTENER PRÉSTAMOS
========================================== */

function getLoans() {

    if (!Array.isArray(userData.loans)) {
        userData.loans = [];
    }

    return userData.loans.filter(
        loan => loan.status !== "cancelled"
    );
}


/* ==========================================
   OBTENER PRÉSTAMO POR ID
========================================== */

function getLoanById(id) {

    return getLoans().find(
        loan =>
            String(loan.id) === String(id)
    );
}


/* ==========================================
   CREAR PRÉSTAMO
========================================== */

function createLoan(data) {

    if (!data) {
        throw new Error(
            "No se recibieron los datos del préstamo."
        );
    }


    const person =
        String(data.person || "")
            .trim();


    const amount =
        Number(data.amount);


    const interest =
        Number(data.interest || 0);


    const dueDate =
        String(data.dueDate || "");


    const type =
        data.type === "to_pay"
            ? "to_pay"
            : "to_receive";


    if (!person) {

        throw new Error(
            "Escribe la persona relacionada con el préstamo."
        );

    }


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "El monto debe ser mayor que cero."
        );

    }


    if (
        !Number.isFinite(interest) ||
        interest < 0
    ) {

        throw new Error(
            "El interés no puede ser negativo."
        );

    }


    if (!dueDate) {

        throw new Error(
            "Selecciona una fecha de vencimiento."
        );

    }


    const nextId =
        userData.loans.length > 0
            ? Math.max(
                ...userData.loans.map(
                    loan =>
                        Number(loan.id) || 0
                )
            ) + 1
            : 1;


    const loan = {

        id: nextId,

        person,

        amount,

        interest,

        dueDate,

        type,

        status: "pending"

    };


    userData.loans.push(
        loan
    );

    saveFinanceFlowData();
    return loan;
}


/* ==========================================
   MARCAR PRÉSTAMO COMO PAGADO
========================================== */

function markLoanAsPaid(id) {

    const loan =
        getLoanById(id);


    if (!loan) {

        throw new Error(
            "El préstamo no existe."
        );

    }


    if (loan.status === "paid") {

        return loan;

    }


    loan.status = "paid";

    saveFinanceFlowData();
    return loan;
}


/* ==========================================
   CANCELAR PRÉSTAMO
========================================== */

function cancelLoan(id) {

    const loan =
        getLoanById(id);


    if (!loan) {

        throw new Error(
            "El préstamo no existe."
        );

    }


    loan.status =
        "cancelled";

    saveFinanceFlowData();
    return loan;
}


/* ==========================================
   TOTAL A RECIBIR
========================================== */

function getLoansToReceiveTotal() {

    return getLoans()
        .filter(
            loan =>
                loan.type === "to_receive" &&
                loan.status === "pending"
        )
        .reduce(
            (total, loan) =>
                total +
                Number(loan.amount || 0) +
                Number(loan.interest || 0),
            0
        );

}


/* ==========================================
   TOTAL A PAGAR
========================================== */

function getLoansToPayTotal() {

    return getLoans()
        .filter(
            loan =>
                loan.type === "to_pay" &&
                loan.status === "pending"
        )
        .reduce(
            (total, loan) =>
                total +
                Number(loan.amount || 0) +
                Number(loan.interest || 0),
            0
        );

}


/* ==========================================
   PRÉSTAMOS PENDIENTES
========================================== */

function getPendingLoans() {

    return getLoans()
        .filter(
            loan =>
                loan.status === "pending"
        );

}


/* ==========================================
   FORMATEAR FECHA
========================================== */

function formatLoanDate(dateString) {

    if (!dateString) {
        return "Sin fecha";
    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    if (Number.isNaN(date.getTime())) {
        return "Fecha inválida";
    }


    return new Intl.DateTimeFormat(
        "es-PE",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


/* ==========================================
   ESTADO DEL VENCIMIENTO
========================================== */

function getLoanDueStatus(loan) {

    if (!loan) {
        return "unknown";
    }


    if (loan.status === "paid") {
        return "paid";
    }


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const dueDate =
        new Date(
            `${loan.dueDate}T00:00:00`
        );


    if (
        Number.isNaN(
            dueDate.getTime()
        )
    ) {
        return "unknown";
    }


    const difference =
        dueDate.getTime() -
        today.getTime();


    const days =
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (days < 0) {
        return "overdue";
    }


    if (days === 0) {
        return "today";
    }


    if (days <= 7) {
        return "soon";
    }


    return "future";
}


/* ==========================================
   TEXTO DEL VENCIMIENTO
========================================== */

function getLoanDueLabel(loan) {

    const status =
        getLoanDueStatus(
            loan
        );


    if (status === "paid") {
        return "Pagado";
    }


    if (status === "overdue") {
        return "Vencido";
    }


    if (status === "today") {
        return "Vence hoy";
    }


    if (status === "soon") {
        return "Vence pronto";
    }


    if (status === "future") {
        return "Pendiente";
    }


    return "Sin fecha";
}


/* ==========================================
   FILTRAR PRÉSTAMOS
========================================== */

function filterLoans() {

    const typeFilter =
        document.querySelector(
            "#loanFilterType"
        );


    const statusFilter =
        document.querySelector(
            "#loanFilterStatus"
        );


    const searchInput =
        document.querySelector(
            "#loanFilterSearch"
        );


    const type =
        typeFilter?.value ||
        "all";


    const status =
        statusFilter?.value ||
        "all";


    const search =
        searchInput?.value
            .trim()
            .toLowerCase() ||
        "";


    return getLoans()
        .filter(loan => {

            if (
                type !== "all" &&
                loan.type !== type
            ) {
                return false;
            }


            if (
                status !== "all" &&
                loan.status !== status
            ) {
                return false;
            }


            if (search) {

                const person =
                    String(
                        loan.person || ""
                    ).toLowerCase();


                if (
                    !person.includes(
                        search
                    )
                ) {
                    return false;
                }

            }


            return true;

        });

}


/* ==========================================
   RENDERIZAR RESUMEN
========================================== */

function renderLoansSummary() {

    const container =
        document.querySelector(
            "#loansSummary"
        );


    if (!container) {
        return;
    }


    const toReceive =
        getLoansToReceiveTotal();


    const toPay =
        getLoansToPayTotal();


    const pending =
        getPendingLoans()
            .length;


    container.innerHTML = `

        <article class="card summary-card">

            <div class="card-header">

                <span class="card-icon">
                    💰
                </span>

                <span class="card-title">
                    Por recibir
                </span>

            </div>

            <div class="card-body">

                <h2>
                    ${formatMoney(
                        toReceive
                    )}
                </h2>

                <p class="card-description">
                    Dinero pendiente de recibir.
                </p>

            </div>

        </article>


        <article class="card summary-card">

            <div class="card-header">

                <span class="card-icon">
                    💳
                </span>

                <span class="card-title">
                    Por pagar
                </span>

            </div>

            <div class="card-body">

                <h2>
                    ${formatMoney(
                        toPay
                    )}
                </h2>

                <p class="card-description">
                    Dinero pendiente de pagar.
                </p>

            </div>

        </article>


        <article class="card summary-card">

            <div class="card-header">

                <span class="card-icon">
                    📋
                </span>

                <span class="card-title">
                    Pendientes
                </span>

            </div>

            <div class="card-body">

                <h2>
                    ${pending}
                </h2>

                <p class="card-description">
                    Préstamos pendientes.
                </p>

            </div>

        </article>

    `;

}


/* ==========================================
   RENDERIZAR LISTA
========================================== */

function renderLoansList() {

    const container =
        document.querySelector(
            "#loansList"
        );


    if (!container) {
        return;
    }


    const loans =
        filterLoans();


    if (!loans.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="empty-icon">
                    💰
                </span>

                <h4>
                    No hay préstamos
                </h4>

                <p>
                    Aquí aparecerán tus préstamos pendientes.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        loans.map(
            loan => {

                const total =
                    Number(
                        loan.amount || 0
                    ) +
                    Number(
                        loan.interest || 0
                    );


                const dueStatus =
                    getLoanDueStatus(
                        loan
                    );


                const dueLabel =
                    getLoanDueLabel(
                        loan
                    );


                const typeLabel =
                    loan.type === "to_receive"
                        ? "Me deben"
                        : "Debo";


                const typeIcon =
                    loan.type === "to_receive"
                        ? "💰"
                        : "💳";


                return `

                    <article
                        class="loan-item"
                        data-loan-id="${loan.id}">

                        <div class="loan-main">

                            <div class="loan-icon">

                                ${typeIcon}

                            </div>


                            <div class="loan-info">

                                <h4>
                                    ${escapeHTML(
                                        loan.person
                                    )}
                                </h4>

                                <p>

                                    ${typeLabel}

                                    · Vence
                                    ${formatLoanDate(
                                        loan.dueDate
                                    )}

                                </p>

                            </div>

                        </div>


                        <div class="loan-amount">

                            <strong>
                                ${formatMoney(
                                    total
                                )}
                            </strong>

                            <span
                                class="loan-status ${dueStatus}">
                                ${dueLabel}
                            </span>

                        </div>


                        <div class="loan-actions">

                            ${
                                loan.status === "pending"
                                ? `
                                    <button
                                        type="button"
                                        class="btn-secondary"
                                        data-loan-action="paid"
                                        data-loan-id="${loan.id}">

                                        Marcar pagado

                                    </button>
                                `
                                : ""
                            }

                            <button
                                type="button"
                                class="btn-secondary"
                                data-loan-action="cancel"
                                data-loan-id="${loan.id}">

                                Eliminar

                            </button>

                        </div>

                    </article>

                `;

            }
        ).join("");

}


/* ==========================================
   RENDERIZAR PRÓXIMOS VENCIMIENTOS
========================================== */

function renderLoansUpcoming() {

    const container =
        document.querySelector(
            "#loansUpcoming"
        );


    if (!container) {
        return;
    }


    const upcoming =
        getPendingLoans()
            .filter(
                loan =>
                    loan.dueDate
            )
            .sort(
                (a, b) =>
                    new Date(
                        `${a.dueDate}T00:00:00`
                    ) -
                    new Date(
                        `${b.dueDate}T00:00:00`
                    )
            )
            .slice(
                0,
                5
            );


    if (!upcoming.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="empty-icon">
                    📅
                </span>

                <h4>
                    No hay vencimientos próximos
                </h4>

                <p>
                    Tus próximos préstamos aparecerán aquí.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        upcoming.map(
            loan => {

                const total =
                    Number(
                        loan.amount || 0
                    ) +
                    Number(
                        loan.interest || 0
                    );


                const typeLabel =
                    loan.type === "to_receive"
                        ? "Por recibir"
                        : "Por pagar";


                return `

                    <div class="loan-upcoming-item">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    loan.person
                                )}
                            </strong>

                            <span>
                                ${typeLabel}
                                ·
                                ${formatLoanDate(
                                    loan.dueDate
                                )}
                            </span>

                        </div>


                        <strong>
                            ${formatMoney(
                                total
                            )}
                        </strong>

                    </div>

                `;

            }
        ).join("");

}


/* ==========================================
   RENDERIZAR TODA LA PÁGINA
========================================== */

function renderLoansPage() {

    renderLoansSummary();

    renderLoansList();

    renderLoansUpcoming();

}


/* ==========================================
   ABRIR MODAL
========================================== */

function openLoanModal() {

    const modal =
        document.querySelector(
            "#loanModal"
        );


    const form =
        document.querySelector(
            "#loanForm"
        );


    if (!modal || !form) {
        return;
    }


    form.reset();


    const dateInput =
        document.querySelector(
            "#loanDueDate"
        );


    if (dateInput) {

        const today =
            new Date();


        today.setDate(
            today.getDate() + 7
        );


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                today.getDate()
            ).padStart(
                2,
                "0"
            );


        dateInput.value =
            `${year}-${month}-${day}`;

    }


    const error =
        document.querySelector(
            "#loanFormError"
        );


    if (error) {
        error.textContent = "";
    }


    modal.hidden = false;


    modal.classList.add(
        "is-open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    const personInput =
        document.querySelector(
            "#loanPerson"
        );


    if (personInput) {
        personInput.focus();
    }

}


/* ==========================================
   CERRAR MODAL
========================================== */

function closeLoanModal() {

    const modal =
        document.querySelector(
            "#loanModal"
        );


    if (!modal) {
        return;
    }


    const activeElement =
        document.activeElement;


    if (
        activeElement &&
        modal.contains(
            activeElement
        )
    ) {

        activeElement.blur();

    }


    modal.classList.remove(
        "is-open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    modal.hidden = true;


    document.body.classList.remove(
        "modal-open"
    );


    const form =
        document.querySelector(
            "#loanForm"
        );


    if (form) {
        form.reset();
    }


    const error =
        document.querySelector(
            "#loanFormError"
        );


    if (error) {
        error.textContent = "";
    }

}


/* ==========================================
   FORMULARIO
========================================== */

function initializeLoanModal() {

    const modal =
        document.querySelector(
            "#loanModal"
        );


    const form =
        document.querySelector(
            "#loanForm"
        );


    const openButton =
        document.querySelector(
            "#openLoanModal"
        );


    const closeButton =
        document.querySelector(
            "#closeLoanModal"
        );


    const cancelButton =
        document.querySelector(
            "#cancelLoan"
        );


    if (
        !modal ||
        !form
    ) {

        return;

    }


    if (openButton) {

        openButton.addEventListener(
            "click",
            openLoanModal
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeLoanModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeLoanModal
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeLoanModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.classList.contains(
                    "is-open"
                )
            ) {

                closeLoanModal();

            }

        }
    );


    form.addEventListener(
        "submit",
        handleLoanSubmit
    );

}


/* ==========================================
   GUARDAR PRÉSTAMO
========================================== */

function handleLoanSubmit(event) {

    event.preventDefault();


    const error =
        document.querySelector(
            "#loanFormError"
        );


    if (error) {
        error.textContent = "";
    }


    try {

        createLoan({

            type:
                document.querySelector(
                    "#loanType"
                ).value,

            person:
                document.querySelector(
                    "#loanPerson"
                ).value,

            amount:
                document.querySelector(
                    "#loanAmount"
                ).value,

            interest:
                document.querySelector(
                    "#loanInterest"
                ).value,

            dueDate:
                document.querySelector(
                    "#loanDueDate"
                ).value

        });


        closeLoanModal();


        renderLoansPage();


        if (
            typeof refreshFinanceFlowUI ===
            "function"
        ) {

            refreshFinanceFlowUI();

        }


        showNotification(
            "Préstamo registrado correctamente.",
            "success"
        );


    } catch (err) {

        if (error) {

            error.textContent =
                err.message;

        }

    }

}


/* ==========================================
   ACCIONES DE PRÉSTAMOS
========================================== */

function initializeLoanActions() {

    const container =
        document.querySelector(
            "#loansList"
        );


    if (!container) {
        return;
    }


    if (
        container.dataset.actionsInitialized ===
        "true"
    ) {

        return;

    }


    container.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-loan-action]"
                );


            if (!button) {
                return;
            }


            const id =
                button.dataset.loanId;


            const action =
                button.dataset.loanAction;


            if (!id) {
                return;
            }


            try {

                if (
                    action === "paid"
                ) {

                    const confirmed =
                        window.confirm(
                            "¿Marcar este préstamo como pagado?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    markLoanAsPaid(
                        id
                    );


                    renderLoansPage();


                    if (
                        typeof refreshFinanceFlowUI ===
                        "function"
                    ) {

                        refreshFinanceFlowUI();

                    }


                    showNotification(
                        "Préstamo marcado como pagado.",
                        "success"
                    );


                    return;

                }


                if (
                    action === "cancel"
                ) {

                    const confirmed =
                        window.confirm(
                            "¿Seguro que quieres eliminar este préstamo?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    cancelLoan(
                        id
                    );


                    renderLoansPage();


                    if (
                        typeof refreshFinanceFlowUI ===
                        "function"
                    ) {

                        refreshFinanceFlowUI();

                    }


                    showNotification(
                        "Préstamo eliminado correctamente.",
                        "success"
                    );

                }

            } catch (err) {

                showNotification(
                    err.message,
                    "error"
                );

            }

        }
    );


    container.dataset.actionsInitialized =
        "true";

}


/* ==========================================
   FILTROS
========================================== */

function initializeLoanFilters() {

    const typeFilter =
        document.querySelector(
            "#loanFilterType"
        );


    const statusFilter =
        document.querySelector(
            "#loanFilterStatus"
        );


    const searchInput =
        document.querySelector(
            "#loanFilterSearch"
        );


    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            renderLoansPage
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderLoansPage
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderLoansPage
        );

    }

}