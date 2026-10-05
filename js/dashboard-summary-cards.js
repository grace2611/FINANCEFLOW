/*
==========================================
FinanceFlow — dashboard-summary-cards.js
==========================================
Lógica exclusiva de las tarjetas nuevas del
Dashboard (FILA 1): efecto flip de la tarjeta
"Ingresos y gastos" y su gráfico comparativo
de barras horizontales con anillo de % gastado.

Proviene de: FinanceFlow_resumen_7_tarjetas

No modifica: cuentas, movimientos, créditos,
metas, sidebar, ni otras vistas.
==========================================
*/


/* ==========================================
   GRÁFICO COMPARATIVO (cara trasera)
========================================== */

function updateIncomeExpenseChart(income, expenses) {

    const incomeValue =
        document.querySelector("#chartIncomeValue");

    const expenseValue =
        document.querySelector("#chartExpenseValue");

    const incomeBar =
        document.querySelector("#chartIncomeBar");

    const expenseBar =
        document.querySelector("#chartExpenseBar");


    if (incomeValue) {
        incomeValue.textContent = formatMoney(income);
    }

    if (expenseValue) {
        expenseValue.textContent = formatMoney(expenses);
    }


    /*
     * La barra más grande representa el 100% del ANCHO.
     * La otra se calcula proporcionalmente.
     */

    const maximum =
        Math.max(income, expenses, 1);

    const incomeWidth =
        Math.max(5, (income / maximum) * 100);

    const expenseWidth =
        Math.max(5, (expenses / maximum) * 100);

    animateChartBarWidth(incomeBar, incomeWidth);
    animateChartBarWidth(expenseBar, expenseWidth);

    updateSpentRing(income, expenses);

}


/* ==========================================
   ANILLO "% GASTADO" + BALANCE DEL MES
========================================== */

function updateSpentRing(income, expenses) {

    const ring =
        document.querySelector("#chartRing");

    const ringArc =
        document.querySelector("#chartSpentRing");

    const percentText =
        document.querySelector("#chartSpentPercent");

    const balanceValue =
        document.querySelector("#chartBalanceValue");

    const balanceHint =
        document.querySelector("#chartBalanceHint");

    /*
     * % del ingreso que ya se gastó.
     * Sin ingresos pero con gastos → 100 % (todo en rojo).
     */

    let percent = 0;

    if (income > 0) {
        percent = (expenses / income) * 100;
    } else if (expenses > 0) {
        percent = 100;
    }

    const shown = Math.round(percent);

    const arc = Math.min(100, Math.max(0, percent));

    if (percentText) {
        percentText.textContent = `${shown}%`;
    }

    if (ring) {
        ring.dataset.level =
            percent <= 60 ? "good" : percent <= 85 ? "warn" : "danger";
    }

    if (ringArc) {

        ringArc.style.strokeDasharray = "0 100";

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                ringArc.style.strokeDasharray = `${arc} 100`;
            });
        });

    }

    const balance = income - expenses;

    if (balanceValue) {
        balanceValue.textContent = formatMoney(balance);
        balanceValue.classList.toggle("is-negative", balance < 0);
    }

    if (balanceHint) {
        balanceHint.textContent =
            income === 0 && expenses === 0
                ? "Sin movimientos"
                : balance < 0
                    ? "Gastas de más"
                    : `${shown}% gastado`;
    }

}


/* ==========================================
   ANIMAR CRECIMIENTO DE UNA BARRA HORIZONTAL
========================================== */

function animateChartBarWidth(barElement, targetWidth) {

    if (!barElement) {
        return;
    }

    barElement.style.width = "0%";

    requestAnimationFrame(function () {

        requestAnimationFrame(function () {

            barElement.style.width = `${targetWidth}%`;

        });

    });

}


/* ==========================================
   EFECTO FLIP
========================================== */

function initializeStatisticsFlip() {

    const flipCard =
        document.querySelector("#incomeExpenseFlipCard");

    const frontButton =
        document.querySelector("#statisticsFlipButton");

    const backButton =
        document.querySelector("#statisticsBackButton");

    if (!flipCard || !frontButton || !backButton) {
        return;
    }

    function showChart() {

        const movements =
            typeof getCurrentMonthMovements === "function"
                ? getCurrentMonthMovements()
                : [];

        const income =
            movements
                .filter(movement => movement.type === "income")
                .reduce((total, movement) => total + Number(movement.amount || 0), 0);

        const expenses =
            movements
                .filter(movement => movement.type === "expense")
                .reduce((total, movement) => total + Number(movement.amount || 0), 0);

        updateIncomeExpenseChart(income, expenses);

        flipCard.classList.add("is-flipped");

    }

    function showSummary() {
        flipCard.classList.remove("is-flipped");
    }

    frontButton.addEventListener("click", showChart);
    backButton.addEventListener("click", showSummary);

    /* También permite volver a la cara original con el mismo botón. */
    flipCard.addEventListener("click", function (event) {

        if (event.target.closest("#statisticsBackButton")) {
            showSummary();
        }

    });

}


/* ==========================================
   INICIO
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        initializeStatisticsFlip();
    }
);
