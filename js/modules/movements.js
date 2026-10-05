/*
==========================================
FinanceFlow
Archivo: movements.js

Gestiona los movimientos financieros.

Responsabilidades:
- Crear movimientos
- Obtener movimientos
- Eliminar movimientos
- Actualizar saldos de cuentas
- Calcular ingresos y gastos
==========================================
*/

function getMovements() {

    return userData.movements;

}


/**
 * Devuelve los movimientos ordenados
 * del más reciente al más antiguo.
 */
function getSortedMovements() {

    return [...userData.movements].sort((a, b) => {

        return new Date(b.date) - new Date(a.date);

    });

}


/**
 * Busca un movimiento por ID.
 */
function getMovementById(id) {

    if (
        id === null ||
        id === undefined ||
        id === ""
    ) {

        return undefined;

    }


    return userData.movements.find(
        movement =>
            String(movement.id) ===
            String(id)
    );

}

/**
 * Registra un nuevo movimiento.
 */
function addMovement(data) {

    const validTypes = [
        "income",
        "expense"
    ];


    if (!validTypes.includes(data.type)) {

        throw new Error(
            "El tipo de movimiento no es válido."
        );

    }


    const description =
        String(data.description || "").trim();


    if (!description) {

        throw new Error(
            "La descripción del movimiento es obligatoria."
        );

    }

    const amount =
        Number(data.amount);


    if (
        !Number.isFinite(amount)
    ) {

        throw new Error(
            "El monto debe ser un número válido."
        );

    }


    if (amount <= 0) {

        throw new Error(
            "El monto debe ser mayor que cero."
        );

    }

    const movementDate =
        String(
            data.date ||
            getLocalDateString()
        ).trim();


    const parsedDate =
        new Date(movementDate);


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {

        throw new Error(
            "La fecha del movimiento no es válida."
        );

    }

    const account =
        getAccountById(
            data.accountId
        );

    if (!account) {

        throw new Error("La cuenta seleccionada no existe.");

    }

    if (!account.active) {

        throw new Error(
            `${account.name} está inactiva y no puede recibir nuevos movimientos.`
        );

    }

    /*
    ==========================================
    GASTO
    ==========================================
    */

    if (data.type === "expense") {

        if (!account.available) {

            throw new Error(
                `${account.name} no está disponible para gastos.`
            );

        }

        if (account.balance < amount) {

            throw new Error(
                `Saldo insuficiente en ${account.name}.`
            );

        }

        account.balance -= amount;

    }


    /*
    ==========================================
    INGRESO
    ==========================================
    */

    if (data.type === "income") {

        account.balance += amount;

    }


    const movement = {

        id: generateId(),

        description: description,

        category: data.category,

        type: data.type,

        amount: amount,

        accountId: account.id,

    date:
        movementDate

    };


    userData.movements.push(movement);

    saveFinanceFlowData();
    return movement;

}


/**
 * Elimina un movimiento.
 *
 * Al eliminarlo se revierte
 * el efecto sobre la cuenta.
 */

function deleteMovement(id) {

    const index =
        userData.movements.findIndex(
            movement =>
                String(movement.id) ===
                String(id)
        );


    if (index === -1) {

        throw new Error(
            "El movimiento no existe."
        );

    }


    const movement =
        userData.movements[index];


    /*
    ==========================================
    TRANSFERENCIA
    ==========================================
    */

    if (
        movement.type === "transfer"
    ) {

        const fromAccount =
            getAccountById(
                movement.fromAccountId
            );


        const toAccount =
            getAccountById(
                movement.toAccountId
            );


        if (fromAccount) {

            fromAccount.balance +=
                Number(movement.amount);

        }


        if (toAccount) {

            toAccount.balance -=
                Number(movement.amount);

        }

    }


    /*
    ==========================================
    INGRESO / GASTO
    ==========================================
    */

    else {

        const account =
            getAccountById(
                movement.accountId
            );


        if (!account) {

            throw new Error(
                "La cuenta del movimiento no existe."
            );

        }


        if (
            movement.type === "income"
        ) {

            account.balance -=
                Number(movement.amount);

        }


        if (
            movement.type === "expense"
        ) {

            account.balance +=
                Number(movement.amount);

        }

    }


    /*
    ==========================================
    ELIMINAR MOVIMIENTO
    ==========================================
    */

    userData.movements.splice(
        index,
        1
    );

    saveFinanceFlowData();
    return true;

}

/**
 * Calcula el total de ingresos.
 */
function getTotalIncome() {

    return userData.movements

        .filter(movement => movement.type === "income")
        .reduce(
            (total, movement) => total + movement.amount,
            0
        );

}


/**
 * Calcula el total de gastos.
 */
function getTotalExpenses() {

    return userData.movements

        .filter(movement => movement.type === "expense")

        .reduce(
            (total, movement) => total + movement.amount,
            0
        );

}


/**
 * Obtiene movimientos del mes actual.
 */
function getCurrentMonthMovements() {

    const now = new Date();

    const currentMonth = now.getMonth();

    const currentYear = now.getFullYear();


    return userData.movements.filter(movement => {

        const date = new Date(movement.date);

        return (

            date.getMonth() === currentMonth &&

            date.getFullYear() === currentYear

        );

    });

}


/**
 * Obtiene ingresos del mes actual.
 */
function getCurrentMonthIncome() {

    return getCurrentMonthMovements()

        .filter(movement => movement.type === "income")

        .reduce(
            (total, movement) => total + movement.amount,
            0
        );

}


/**
 * Obtiene gastos del mes actual.
 */
function getCurrentMonthExpenses() {

    return getCurrentMonthMovements()

        .filter(movement => movement.type === "expense")

        .reduce(
            (total, movement) => total + movement.amount,
            0
        );

}

/* ==========================================
   TRANSFERENCIAS
========================================== */


/**
 * Transfiere dinero entre dos cuentas.
 *
 * Una transferencia:
 *
 * Cuenta origen
 *       ↓
 *    - monto
 *
 * Cuenta destino
 *       ↓
 *    + monto
 *
 * No se considera ingreso ni gasto.
 */
function transferMoney(data) {

    const fromAccount =
        getAccountById(data.fromAccountId);


    const toAccount =
        getAccountById(data.toAccountId);


    const amount =
        Number(data.amount);


    if (!fromAccount) {

        throw new Error(
            "La cuenta de origen no existe."
        );

    }


    if (!toAccount) {

        throw new Error(
            "La cuenta de destino no existe."
        );

    }

    if (
        String(fromAccount.id) ===
        String(toAccount.id)
    ) {

        throw new Error(
            "La cuenta de origen y destino deben ser diferentes."
        );

    }

    if (!fromAccount.active) {

        throw new Error(
            "La cuenta de origen está inactiva."
        );

    }


    if (!toAccount.active) {

        throw new Error(
            "La cuenta de destino está inactiva."
        );

    }


    if (
        Number.isNaN(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "El monto debe ser mayor que cero."
        );

    }

    const transferDate =
        String(
            data.date ||
            getLocalDateString()
        ).trim();


    const parsedDate =
        new Date(
            `${transferDate}T00:00:00`
        );


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {

        throw new Error(
            "La fecha de la transferencia no es válida."
        );

    }

    if (fromAccount.balance < amount) {

        throw new Error(
            `Saldo insuficiente en ${fromAccount.name}.`
        );

    }


    /*
    ==========================================
    ACTUALIZAR CUENTAS
    ==========================================
    */

    fromAccount.balance -= amount;

    toAccount.balance += amount;


    /*
    ==========================================
    REGISTRAR OPERACIÓN
    ==========================================
    */

    const transfer = {

        id: generateId(),

        type: "transfer",

        description:
            data.description?.trim() ||
            `Transferencia a ${toAccount.name}`,

        category: "Transferencia",

        amount: amount,

        accountId: fromAccount.id,

        fromAccountId: fromAccount.id,

        toAccountId: toAccount.id,

        date:
            transferDate

    };


    userData.movements.push(
        transfer
    );


    return transfer;

}

/* ==========================================
   PÁGINA DE MOVIMIENTOS
========================================== */

function renderMovementsPage() {

    renderMovementsSummary();

    renderMovementAccountFilter();

    renderMovementsList();

}
function renderMovementsSummary() {

    const container =
        document.querySelector(
            "#movementsSummary"
        );


    if (!container) {

        return;

    }


    const movements =
        getMovements();


    const income =
        movements
            .filter(
                movement =>
                    movement.type === "income"
            )
            .reduce(
                (sum, movement) =>
                    sum + movement.amount,
                0
            );


    const expenses =
        movements
            .filter(
                movement =>
                    movement.type === "expense"
            )
            .reduce(
                (sum, movement) =>
                    sum + movement.amount,
                0
            );


    const balance =
        income - expenses;


    container.innerHTML = `

        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Ingresos
            </div>

            <div class="accounts-summary-value">
                ${formatMoney(income)}
            </div>

        </div>


        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Gastos
            </div>

            <div class="accounts-summary-value">
                ${formatMoney(expenses)}
            </div>

        </div>


        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Balance del período
            </div>

            <div class="accounts-summary-value">
                ${formatMoney(balance)}
            </div>

        </div>


        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Movimientos
            </div>

            <div class="accounts-summary-value">
                ${movements.length}
            </div>

        </div>

    `;

}

function renderMovementAccountFilter() {

    const select =
        document.querySelector(
            "#movementFilterAccount"
        );


    if (!select) {

        return;

    }


    const accounts =
        getActiveAccounts();


    select.innerHTML = `

        <option value="all">
            Todas las cuentas
        </option>

    `;


    accounts.forEach(
        account => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                account.id;


            option.textContent =
                account.name;


            select.appendChild(
                option
            );

        }
    );

}

function renderMovementsList() {

    const container =
        document.querySelector(
            "#movementsList"
        );


    if (!container) {

        return;

    }


    const typeFilter =
        document.querySelector(
            "#movementFilterType"
        )?.value || "all";


    const accountFilter =
        document.querySelector(
            "#movementFilterAccount"
        )?.value || "all";


    const categoryFilter =
        document.querySelector(
            "#movementFilterCategory"
        )?.value || "all";


    const search =
        document.querySelector(
            "#movementFilterSearch"
        )?.value
        .trim()
        .toLowerCase() || "";


    let movements =
        getMovements();


    /*
    ==========================================
    FILTRO POR TIPO
    ==========================================
    */

    if (typeFilter !== "all") {

        movements =
            movements.filter(
                movement =>
                    movement.type === typeFilter
            );

    }


    /*
    ==========================================
    FILTRO POR CUENTA
    ==========================================
    */

    if (accountFilter !== "all") {

        movements =
            movements.filter(
                movement =>
                    movement.accountId === Number(accountFilter)
            );

    }


    /*
    ==========================================
    FILTRO POR CATEGORÍA
    ==========================================
    */

    if (categoryFilter !== "all") {

        movements =
            movements.filter(
                movement =>
                    movement.category === categoryFilter
            );

    }


    /*
    ==========================================
    BUSCADOR
    ==========================================
    */

    if (search) {

        movements =
            movements.filter(
                movement => {

                    const description =
                        String(
                            movement.description || ""
                        )
                        .toLowerCase();


                    const category =
                        String(
                            movement.category || ""
                        )
                        .toLowerCase();


                    return (
                        description.includes(search) ||
                        category.includes(search)
                    );

                }
            );

    }


    /*
    ==========================================
    ORDENAR
    ==========================================
    */

    movements.sort(
        (a, b) =>
            new Date(b.date) -
            new Date(a.date)
    );


    /*
    ==========================================
    SIN RESULTADOS
    ==========================================
    */

    if (!movements.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="empty-icon">
                    📭
                </span>

                <h4>
                    No encontramos movimientos
                </h4>

                <p>
                    Prueba cambiando los filtros o registra un nuevo movimiento.
                </p>

            </div>

        `;

        return;

    }


    /*
    ==========================================
    RENDERIZAR
    ==========================================
    */

    container.innerHTML =
        movements.map(
            movement => {

                const isIncome =
                    movement.type === "income";

                const isExpense =
                    movement.type === "expense";

                const isTransfer =
                    movement.type === "transfer";


                let sign = "";

                let typeLabel = "";

                let icon = "";

                if (isIncome) {

                    sign = "+";
                    typeLabel = "Ingreso";
                    icon = "💰";

                }
                else if (isExpense) {

                    sign = "-";
                    typeLabel = "Gasto";
                    icon = "💸";

                }
                else if (isTransfer) {

                    sign = "↔";
                    typeLabel = "Transferencia";
                    icon = "🔄";

                }

                const account =
                    getAccountById(
                        movement.accountId
                    );

                const fromAccount =
                    isTransfer
                        ? getAccountById(
                            movement.fromAccountId
                        )
                        : null;

                const toAccount =
                    isTransfer
                        ? getAccountById(
                            movement.toAccountId
                        )
                        : null;    

                return `

                    <article
                        class="movement-item">

                        <div class="movement-item-main">

                            <div class="movement-icon">

                                ${icon}

                            </div>

                            <div>

                                <strong>
                                    ${
                                        escapeHTML(
                                            movement.description
                                        )
                                    }
                                </strong>


                                <p>

                                    ${
                                        escapeHTML(
                                            movement.category
                                        )
                                    }

                                    ·

                                    ${
                                        isTransfer
                                        ? `${escapeHTML(fromAccount?.name || "Cuenta")} → ${escapeHTML(toAccount?.name || "Cuenta")}`
                                        : escapeHTML(
                                            account?.name ||
                                            "Cuenta"
                                        )
                                    }

                                    ·

                                    ${movement.date}

                                </p>

                            </div>

                        </div>


                        <div class="movement-item-amount">

                            <strong class="${
                                isIncome
                                ? "movement-income"
                                : isExpense
                                ? "movement-expense"
                                : ""
                            }">

                                ${sign}
                                ${formatMoney(
                                    movement.amount
                                )}

                            </strong>


                            <span>
                                ${typeLabel}
                            </span>

                        </div>

                    </article>

                `;

            }
        ).join("");

}

function initializeMovementFilters() {

    const filters =
        document.querySelectorAll(
            "#movementFilterType, " +
            "#movementFilterAccount, " +
            "#movementFilterCategory"
        );


    filters.forEach(
        filter => {

            if (
                filter.dataset.financeflowInitialized === "true"
            ) {

                return;

            }


            filter.addEventListener(
                "change",
                renderMovementsList
            );


            filter.dataset.financeflowInitialized =
                "true";

        }
    );


    const search =
        document.querySelector(
            "#movementFilterSearch"
        );


    if (
        search &&
        search.dataset.financeflowInitialized !== "true"
    ) {

        search.addEventListener(
            "input",
            renderMovementsList
        );


        search.dataset.financeflowInitialized =
            "true";

    }

}