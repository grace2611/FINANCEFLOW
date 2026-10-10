/*
==========================================
FinanceFlow
Archivo: ui.js

Controla la representación visual.
No contiene cálculos financieros.
==========================================
*/


/* ==========================================
   HEADER
========================================== */
function renderGreeting() {

    const element =
        document.querySelector(
            "#greeting"
        );

    if (!element) {

        return;

    }

    const name =
        userData?.profile?.name ||
        "Usuario";

    const hour =
        new Date().getHours();

    let greeting = "Buenas noches";

    if (hour < 12) {

        greeting = "Buenos días";

    } else if (hour < 19) {

        greeting = "Buenas tardes";

    }

    element.textContent =
        `${greeting}, ${name} 👋`;

}

function renderCurrentDate() {

    const element =
        document.querySelector(
            "#dashboardHeroDate"
        );


    if (!element) {

        return;

    }


    element.textContent =
        new Intl.DateTimeFormat(
            "es-PE",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(
            new Date()
        );

}


/* ==========================================
   RESUMEN
========================================== */

function renderAvailableBalance() {

    const element =
        document.querySelector(
            "#availableBalance"
        );


    if (!element) {

        return;

    }


    element.textContent =
        formatMoney(
            getAvailableBalance()
        );

}


function renderTotalBalance() {

    const element =
        document.querySelector("#totalBalance");
            if (!element) {

                return;

            }

    element.textContent =
        formatMoney(getTotalBalance());

}

function renderDashboardSummary() {

    const incomeElement =
        document.querySelector("#dashboardIncome");

    const expensesElement =
        document.querySelector("#dashboardExpenses");

    const savingsElement =
        document.querySelector("#dashboardSavings");


    const movements =
        getCurrentMonthMovements();


    const income =
        movements
            .filter(movement => movement.type === "income")
            .reduce(
                (total, movement) =>
                    total + Number(movement.amount || 0),
                0
            );


    const expenses =
        movements
            .filter(movement => movement.type === "expense")
            .reduce(
                (total, movement) =>
                    total + Number(movement.amount || 0),
                0
            );


    const savings =
        income - expenses;


    if (incomeElement) {

        incomeElement.textContent =
            formatMoney(income);

    }


    if (expensesElement) {

        expensesElement.textContent =
            formatMoney(expenses);

    }


    if (savingsElement) {

        savingsElement.textContent =
            formatMoney(savings);

    }


    if (typeof updateIncomeExpenseChart === "function") {

        updateIncomeExpenseChart(income, expenses);

    }


    if (typeof updateBudgetTrackerUI === "function") {

        updateBudgetTrackerUI(income, expenses);

    }

}

function renderCreditCard() {

    const element =
        document.querySelector(
            "#dashboardCreditUsed"
        );
        if (!element) {

            return;

        }    
    const card =
        getPrimaryCreditCard();

    if (!card) {

        element.textContent = "S/ 0.00";

        return;

    }

    element.textContent =
        formatMoney(card.used);


    const title =
        element
            .closest(".summary-card")
            ?.querySelector(".card-title");


    if (title) {

        title.textContent =
            card.name;

    }

}


function renderGoalSummary() {

    const goal =
        getActiveGoals()[0];

    if (!goal) {

        return;

    }

    const saved =
        document.querySelector(
            "#dashboardGoalSaved"
        );

            if (!saved) {

                return;

            }

    saved.textContent =
        formatMoney(goal.saved);


    const title =
        saved
            .closest(".summary-card")
            ?.querySelector(".card-title");


    if (title) {

        title.textContent =
            goal.name;

    }

}


/* ==========================================
   META
========================================== */

function renderGoal() {

    const goal =
        getActiveGoals()[0];

    if (!goal) {

        return;

    }


    const percentage =
        getGoalPercentage(goal);


    const percentageElement =
        document.querySelector("#goalPercentage");

    const progress =
        document.querySelector("#goalProgress");

    const current =
        document.querySelector("#goalCurrent");

    const target =
        document.querySelector("#goalTarget");

        if (
            !percentageElement ||
            !progress ||
            !current ||
            !target
        ) {

            return;

        }


    percentageElement.textContent =
        `${Math.round(percentage)}%`;


    progress.style.width =
        `${percentage}%`;


    current.textContent =
        formatMoney(goal.saved);


    target.textContent =
        formatMoney(goal.target);


    const title =
        document.querySelector(".goal-header h4");

    if (title) {

        title.textContent =
            goal.name;

    }

}

/* ==========================================
   MOVIMIENTOS
========================================== */

function renderRecentMovements() {

    const container =
        document.querySelector(
            "#recentMovements"
        );


    if (!container) {

        return;

    }


    const movements =
        getSortedMovements().slice(0, 30);


    if (!movements.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="empty-icon">
                    📭
                </span>

                <h4>
                    Aún no hay movimientos
                </h4>

                <p>
                    Cuando registres ingresos o gastos aparecerán aquí.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        movements.map(movement => {

            const account =
                getAccountById(
                    movement.accountId
                );


            let sign = "-";

            if (movement.type === "income") {

                sign = "+";

            }

            if (movement.type === "transfer") {

                sign = "↔";

            }

            let className =
                "transaction-expense";


            if (movement.type === "income") {

                className =
                    "transaction-income";

            }


            if (movement.type === "transfer") {

                className =
                    "transaction-transfer";

            }


            return `

                <div class="movement-item">

                    <div class="movement-info">

                        <div class="movement-icon">
                            ${
                                movement.type === "income"
                                    ? "💰"
                                    : movement.type === "transfer"
                                        ? "🔄"
                                        : "💸"
                            }
                        </div>

                        <div>

                            <div class="movement-name">
                                ${escapeHTML(movement.description)}
                            </div>

                            <div class="movement-date">

                                ${formatDate(
                                    new Date(movement.date + "T00:00:00")
                                )}

                                ·

                               ${
                                    movement.type === "transfer"

                                        ? `
                                            ${escapeHTML(
                                                getAccountById(
                                                    movement.fromAccountId
                                                )?.name || "Cuenta"
                                            )}

                                            →

                                            ${escapeHTML(
                                                getAccountById(
                                                    movement.toAccountId
                                                )?.name || "Cuenta"
                                            )}
                                        `

                                        : escapeHTML(
                                            account?.name || "Cuenta"
                                        )
                                }

                            </div>

                        </div>

                    </div>

                    <strong class="movement-amount ${className}">

                        ${sign}${formatMoney(movement.amount)}

                    </strong>

                </div>

            `;

        }).join("");

}


/* ==========================================
   TABLA
========================================== */

function renderTransactionsTable() {

    const table =
        document.querySelector(
            "#transactionsTable"
        );


    if (!table) {

        return;

    }


    const movements =
        getSortedMovements();


    if (!movements.length) {

        table.innerHTML = `

            <tr>

                <td colspan="5">

                    No existen movimientos registrados.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        movements.map(movement => {

            const typeLabel =
                movement.type === "income"
                    ? "Ingreso"
                    : "Gasto";


            const sign =
                movement.type === "income"
                    ? "+"
                    : "-";


            const className =
                movement.type === "income"
                    ? "transaction-income"
                    : "transaction-expense";


            return `

                <tr>

                    <td>
                        ${formatDate(
                            new Date(movement.date + "T00:00:00")
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            movement.description
                        )}
                    </td>

                    <td>

                        <span class="category-tag">
                            ${escapeHTML(
                                movement.category
                            )}
                        </span>

                    </td>

                    <td>
                        ${typeLabel}
                    </td>

                    <td class="${className}">

                        ${sign}${formatMoney(
                            movement.amount
                        )}

                    </td>

                </tr>

            `;

        }).join("");

}


/* ==========================================
   GRÁFICO DE DISTRIBUCIÓN
========================================== */

function renderAccountsChart() {

    const canvas =
        document.querySelector(
            "#accountsChart"
        );


    if (!canvas) {

        return;

    }


    const context =
        canvas.getContext("2d");


    const accounts =
        getActiveAccounts()
            .filter(account => account.balance > 0);


    const total =
        accounts.reduce(
            (sum, account) =>
                sum + account.balance,
            0
        );


    const width =
        canvas.parentElement.clientWidth;


    canvas.width =
        Math.max(width - 10, 280);

    canvas.height = 260;


    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    if (!accounts.length || total <= 0) {

        context.font =
            "15px Segoe UI";

        context.fillStyle =
            "#64748B";

        context.textAlign =
            "center";

        context.fillText(
            "Aún no hay dinero para mostrar.",
            canvas.width / 2,
            130
        );

        return;

    }


    const centerX =
        90;

    const centerY =
        130;

    const radius =
        75;


    let startAngle =
        -Math.PI / 2;


    accounts.forEach(account => {

        const percentage =
            account.balance / total;


        const endAngle =
            startAngle +
            percentage * Math.PI * 2;


        context.beginPath();

        context.moveTo(
            centerX,
            centerY
        );

        context.arc(
            centerX,
            centerY,
            radius,
            startAngle,
            endAngle
        );

        context.closePath();

        context.fillStyle =
            account.color;

        context.fill();


        startAngle =
            endAngle;

    });


    /*
    Centro blanco
    */

    context.beginPath();

    context.arc(
        centerX,
        centerY,
        42,
        0,
        Math.PI * 2
    );

    context.fillStyle =
        "#FFFFFF";

    context.fill();


    /*
    Leyenda
    */

    accounts.forEach(
        (account, index) => {

            const y =
                35 + index * 45;


            context.fillStyle =
                account.color;

            context.fillRect(
                180,
                y - 10,
                12,
                12
            );


            context.fillStyle =
                "#0F172A";

            context.font =
                "600 13px Segoe UI";

            context.textAlign =
                "left";

            context.fillText(
                account.name,
                200,
                y
            );


            context.fillStyle =
                "#64748B";

            context.font =
                "12px Segoe UI";

            context.fillText(
                `${formatMoney(account.balance)} · ${Math.round((account.balance / total) * 100)}%`,
                200,
                y + 18
            );

        }
    );

}

/* ==========================================
   GASTOS POR CATEGORÍA
========================================== */

function renderExpensesCategoryChart() {

    const canvas =
        document.querySelector(
            "#expensesCategoryChart"
        );

    if (!canvas) {

        return;

    }

    const context =
        canvas.getContext("2d");

    const movements =
        getCurrentMonthMovements();

    const expensesByCategory = {};

    movements
        .filter(
            movement =>
                movement.type === "expense"
        )
        .forEach(
            movement => {

                const category =
                    movement.category ||
                    "Otros";

                if (
                    !expensesByCategory[
                        category
                    ]
                ) {

                    expensesByCategory[
                        category
                    ] = 0;

                }

                expensesByCategory[
                    category
                ] += Number(
                    movement.amount
                );

            }
        );

    const categories =
        Object.entries(
            expensesByCategory
        );

    const width =
        canvas.parentElement.clientWidth;

    canvas.width =
        Math.max(
            width - 10,
            280
        );

    canvas.height = 280;

    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (!categories.length) {

        context.font =
            "15px Segoe UI";

        context.fillStyle =
            "#64748B";

        context.textAlign =
            "center";

        context.fillText(
            "Aún no hay gastos para mostrar.",
            canvas.width / 2,
            140
        );

        return;

    }

    const total =
        categories.reduce(
            (sum, [, amount]) =>
                sum + amount,
            0
        );

    const centerX =
        Math.min(
            105,
            canvas.width * 0.28
        );

    const centerY = 140;

    const radius = 82;

    const colors = [
        "#2563EB",
        "#16A34A",
        "#F59E0B",
        "#DC2626",
        "#7C3AED",
        "#0891B2",
        "#DB2777",
        "#64748B"
    ];

    let startAngle =
        -Math.PI / 2;

    categories.forEach(
        ([category, amount], index) => {

            const percentage =
                amount / total;

            const endAngle =
                startAngle +
                percentage *
                Math.PI *
                2;

            context.beginPath();

            context.moveTo(
                centerX,
                centerY
            );

            context.arc(
                centerX,
                centerY,
                radius,
                startAngle,
                endAngle
            );

            context.closePath();

            context.fillStyle =
                colors[
                    index %
                    colors.length
                ];

            context.fill();

            startAngle =
                endAngle;

        }
    );

    /*
    Centro de la dona
    */

    context.beginPath();

    context.arc(
        centerX,
        centerY,
        45,
        0,
        Math.PI * 2
    );

    context.fillStyle =
        "#FFFFFF";

    context.fill();

    /*
    Total
    */

    context.fillStyle =
        "#0F172A";

    context.font =
        "700 14px Segoe UI";

    context.textAlign =
        "center";

    context.fillText(
        formatMoney(total),
        centerX,
        centerY + 5
    );

    /*
    Leyenda
    */

    categories.forEach(
        ([category, amount], index) => {

            const y =
                35 + index * 32;

            const color =
                colors[
                    index %
                    colors.length
                ];
            const percentage =
                amount / total;

            context.fillStyle =
                color;

            context.fillRect(
                canvas.width * 0.52,
                y - 9,
                11,
                11
            );

            context.fillStyle =
                "#0F172A";

            context.font =
                "600 12px Segoe UI";

            context.textAlign =
                "left";

            context.fillText(
                category,
                canvas.width * 0.52 + 18,
                y
            );

            context.fillStyle =
                "#64748B";

            context.font =
                "11px Segoe UI";

            context.fillText(
                `${formatMoney(amount)} · ${Math.round(percentage * 100)}%`,
                canvas.width * 0.52 + 18,
                y + 15
            );

        }
    );

}

/* ==========================================
   GRÁFICO MENSUAL
========================================== */

function renderMonthlyChart() {

    const canvas =
        document.querySelector(
            "#monthlyChart"
        );


    if (!canvas) {

        return;

    }


    const context =
        canvas.getContext("2d");


    const movements =
        getCurrentMonthMovements();


    const income =
        movements
            .filter(m => m.type === "income")
            .reduce(
                (sum, m) => sum + m.amount,
                0
            );


    const expenses =
        movements
            .filter(m => m.type === "expense")
            .reduce(
                (sum, m) => sum + m.amount,
                0
            );


    const width =
        canvas.parentElement.clientWidth;


    canvas.width =
        Math.max(width - 10, 280);

    canvas.height =
        260;


    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    const max =
        Math.max(
            income,
            expenses,
            100
        );


    const chartHeight =
        170;


    const baseY =
        215;


    const barWidth =
        Math.min(
            90,
            canvas.width / 5
        );


    const incomeHeight =
        (income / max) *
        chartHeight;


    const expenseHeight =
        (expenses / max) *
        chartHeight;


    /*
    INGRESOS
    */

    context.fillStyle =
        "#16A34A";

    context.fillRect(

        canvas.width * 0.28,

        baseY - incomeHeight,

        barWidth,

        incomeHeight

    );


    /*
    GASTOS
    */

    context.fillStyle =
        "#DC2626";

    context.fillRect(

        canvas.width * 0.62,

        baseY - expenseHeight,

        barWidth,

        expenseHeight

    );


    context.fillStyle =
        "#0F172A";

    context.font =
        "600 13px Segoe UI";

    context.textAlign =
        "center";


    context.fillText(
        "Ingresos",
        canvas.width * 0.28 + barWidth / 2,
        240
    );


    context.fillText(
        "Gastos",
        canvas.width * 0.62 + barWidth / 2,
        240
    );


    context.fillStyle =
        "#64748B";


    context.font =
        "12px Segoe UI";


    context.fillText(
        formatMoney(income),
        canvas.width * 0.28 + barWidth / 2,
        baseY - incomeHeight - 10
    );


    context.fillText(
        formatMoney(expenses),
        canvas.width * 0.62 + barWidth / 2,
        baseY - expenseHeight - 10
    );

}

/* ==========================================
   EVOLUCIÓN FINANCIERA
========================================== */

function renderFinancialEvolutionChart() {

    const canvas =
        document.querySelector(
            "#financialEvolutionChart"
        );

    if (!canvas) {

        return;

    }

    const context =
        canvas.getContext("2d");

    const movements =
        Array.isArray(userData?.movements)
            ? userData.movements
            : [];

    const months = [];

    const now =
        new Date();

    for (
        let i = 5;
        i >= 0;
        i--
    ) {

        const date =
            new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

        months.push({
            year:
                date.getFullYear(),

            month:
                date.getMonth(),

            label:
                date.toLocaleDateString(
                    "es-PE",
                    {
                        month: "short"
                    }
                ),

            income: 0,

            expenses: 0,

            savings: 0

        });

    }

    movements.forEach(
        movement => {

            if (!movement.date) {

                return;

            }

            const date =
                new Date(
                    movement.date
                );

            const monthData =
                months.find(
                    item =>
                        item.year ===
                            date.getFullYear()
                        &&
                        item.month ===
                            date.getMonth()
                );

            if (!monthData) {

                return;

            }

            const amount =
                Number(
                    movement.amount
                ) || 0;

            if (
                movement.type ===
                "income"
            ) {

                monthData.income +=
                    amount;

            }

            if (
                movement.type ===
                "expense"
            ) {

                monthData.expenses +=
                    amount;

            }

        }
    );

    months.forEach(
        month => {

            month.savings =
                month.income -
                month.expenses;

        }
    );

    const width =
        canvas.parentElement.clientWidth;

    canvas.width =
        Math.max(
            width - 10,
            280
        );

    canvas.height = 300;

    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const max =
        Math.max(
            ...months.map(
                month =>
                    Math.max(
                        month.income,
                        month.expenses,
                        Math.abs(
                            month.savings
                        )
                    )
            ),
            100
        );

    const paddingLeft = 45;

    const paddingRight = 20;

    const paddingTop = 25;

    const paddingBottom = 45;

    const chartWidth =
        canvas.width -
        paddingLeft -
        paddingRight;

    const chartHeight =
        canvas.height -
        paddingTop -
        paddingBottom;

    /*
    Líneas horizontales
    */

    context.strokeStyle =
        "#E2E8F0";

    context.lineWidth = 1;

    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            paddingTop +
            (chartHeight / 4) * i;

        context.beginPath();

        context.moveTo(
            paddingLeft,
            y
        );

        context.lineTo(
            canvas.width -
                paddingRight,
            y
        );

        context.stroke();

    }

    /*
    Función para dibujar líneas
    */

    function drawLine(
        property,
        color
    ) {

        context.beginPath();

        months.forEach(
            (month, index) => {

                const x =
                    paddingLeft +
                    (
                        chartWidth /
                        (months.length - 1)
                    ) *
                    index;

                const value =
                    Math.max(
                        month[property],
                        0
                    );

                const y =
                    paddingTop +
                    chartHeight -
                    (
                        value /
                        max
                    ) *
                    chartHeight;

                if (index === 0) {

                    context.moveTo(
                        x,
                        y
                    );

                }
                else {

                    context.lineTo(
                        x,
                        y
                    );

                }

            }
        );

        context.strokeStyle =
            color;

        context.lineWidth = 3;

        context.stroke();

        /*
        Puntos
        */

        months.forEach(
            (month, index) => {

                const x =
                    paddingLeft +
                    (
                        chartWidth /
                        (months.length - 1)
                    ) *
                    index;

                const value =
                    Math.max(
                        month[property],
                        0
                    );

                const y =
                    paddingTop +
                    chartHeight -
                    (
                        value /
                        max
                    ) *
                    chartHeight;

                context.beginPath();

                context.arc(
                    x,
                    y,
                    4,
                    0,
                    Math.PI * 2
                );

                context.fillStyle =
                    color;

                context.fill();

            }
        );

    }

    /*
    INGRESOS
    */

    drawLine(
        "income",
        "#16A34A"
    );

    /*
    GASTOS
    */

    drawLine(
        "expenses",
        "#DC2626"
    );

    /*
    AHORRO
    */

    drawLine(
        "savings",
        "#2563EB"
    );

    /*
    Meses
    */

    context.fillStyle =
        "#64748B";

    context.font =
        "11px Segoe UI";

    context.textAlign =
        "center";

    months.forEach(
        (month, index) => {

            const x =
                paddingLeft +
                (
                    chartWidth /
                    (months.length - 1)
                ) *
                index;

            context.fillText(
                month.label,
                x,
                canvas.height -
                    18
            );

        }
    );

    /*
    Leyenda
    */

    const legend = [
        {
            label: "Ingresos",
            color: "#16A34A"
        },
        {
            label: "Gastos",
            color: "#DC2626"
        },
        {
            label: "Ahorro",
            color: "#2563EB"
        }
    ];

    legend.forEach(
        (item, index) => {

            const x =
                paddingLeft +
                index * 100;

            context.fillStyle =
                item.color;

            context.fillRect(
                x,
                5,
                10,
                10
            );

            context.fillStyle =
                "#475569";

            context.font =
                "11px Segoe UI";

            context.textAlign =
                "left";

            context.fillText(
                item.label,
                x + 16,
                14
            );

        }
    );

}

/* ==========================================
   DASHBOARD COMPLETO
========================================== */

function renderDashboard() {

    renderGreeting();

    renderCurrentDate();

    renderAvailableBalance();

    renderTotalBalance();

    renderDashboardSummary();

    renderCreditCard();

    renderGoalSummary();

    renderGoal();

    renderRecentMovements();

    if (typeof renderUpcomingEvents === "function") {

        renderUpcomingEvents();

    }

    renderTransactionsTable();

    renderAccountsChart();

    renderMonthlyChart();

    renderExpensesCategoryChart();

    renderFinancialEvolutionChart();

}
/* ==========================================
   VISTA DE CUENTAS
========================================== */


function getAccountTypeLabel(type) {

    const labels = {

        bank: "Banco",

        wallet: "Billetera digital",

        cash: "Efectivo",

        savings: "Ahorro"

    };


    return labels[type] || "Cuenta";

}

function getFilteredAccounts(
    accounts
) {

    const typeFilter =
        document.querySelector(
            "#accountTypeFilter"
        )?.value || "all";


    const availabilityFilter =
        document.querySelector(
            "#accountAvailabilityFilter"
        )?.value || "all";


    return accounts.filter(
        account => {

            const matchesType =
                typeFilter === "all" ||
                account.type ===
                    typeFilter;


            const matchesAvailability =
                availabilityFilter === "all" ||
                (
                    availabilityFilter ===
                    "available" &&
                    account.available === true
                ) ||
                (
                    availabilityFilter ===
                    "unavailable" &&
                    account.available === false
                );


            return (
                matchesType &&
                matchesAvailability
            );

        }
    );

}

function renderAccountsPage() {

    const summary =
        document.querySelector(
            "#accountsSummary"
        );


    const grid =
        document.querySelector(
            "#accountsGrid"
        );


    if (!summary || !grid) {

        return;

    }

    const accounts = getAccounts();


    const filteredAccounts =
        getFilteredAccounts(
            accounts
        );


    const total =
        getTotalBalance();


    const available =
        getAvailableBalance();


    summary.innerHTML = `

        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Patrimonio
            </div>

            <div class="accounts-summary-value">
                ${formatMoney(total)}
            </div>

        </div>


        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Disponible
            </div>

            <div class="accounts-summary-value">
                ${formatMoney(available)}
            </div>

        </div>


        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Cuentas activas
            </div>

            <div class="accounts-summary-value">
                ${accounts.length}
            </div>

        </div>

    `;

    if (!filteredAccounts.length) {

        grid.innerHTML = `

            <div class="empty-state">

                <span class="empty-icon">
                    🏦
                </span>

                <h4>
                    No encontramos cuentas
                </h4>

                <p>
                    No existen cuentas que coincidan con los filtros seleccionados.
                </p>

            </div>

        `;

        return;

    }

    grid.innerHTML =
        filteredAccounts.map(account => `

            <article
                class="account-card"
                data-account-id="${account.id}">

                <div class="account-card-header">

                    <div class="account-card-info">

                        <div
                            class="account-icon"
                            style="background:${account.color}20">

                            ${escapeHTML(account.icon)}

                        </div>


                        <div>

                            <div class="account-name">

                                ${escapeHTML(account.name)}

                            </div>

                            <div class="account-type">

                                ${getAccountTypeLabel(
                                    account.type
                                )}

                            </div>

                        </div>

                    </div>


                    <span class="account-status">

                        ${account.active ? "● Activa" : "● Inactiva"}

                    </span>

                </div>


                <div class="account-balance">

                    ${formatMoney(account.balance)}

                </div>


                <div class="account-description">

                    ${
                        escapeHTML(
                            account.description ||
                            "Sin descripción"
                        )
                    }

                </div>


                <div class="account-card-actions">

                    <button
                        class="account-action"
                        data-action="edit-account"
                        data-id="${account.id}">

                        Editar

                    </button>

                    ${account.active
                        ? (
                            Number(account.balance) === 0
                                ? `
                                    <button
                                        type="button"
                                        data-action="deactivate-account"
                                        data-id="${account.id}"
                                    >
                                        Desactivar
                                    </button>
                                `
                                : ""
                        )
                        : `
                            <button
                                type="button"
                                data-action="reactivate-account"
                                data-id="${account.id}"
                            >
                                Reactivar
                            </button>
                        `
                    }

                </div>

            </article>

        `).join("");

}