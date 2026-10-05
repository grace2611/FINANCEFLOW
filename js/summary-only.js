/*
==========================================
FinanceFlow — summary-only.js
==========================================
Solo controla las 7 tarjetas del resumen.
No renderiza sidebar, header, gráficos,
movimientos, cuentas, metas completas, etc.
==========================================
*/

function renderSummaryOnly() {

    // 1. Disponible
    const availableElement =
        document.querySelector("#availableBalance");

    if (availableElement) {
        availableElement.textContent =
            formatMoney(getAvailableBalance());
    }


    // 2. Patrimonio
    const totalElement =
        document.querySelector("#totalBalance");

    if (totalElement) {
        totalElement.textContent =
            formatMoney(getTotalBalance());
    }


    // 3, 4 y 5. Ingresos, gastos y ahorro
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

    const savings = income - expenses;

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


    // 6. Crédito utilizado
    const creditElement =
        document.querySelector("#dashboardCreditUsed");

    if (creditElement) {

        const card =
            getPrimaryCreditCard();

        if (!card) {
            creditElement.textContent = "S/ 0.00";
        } else {
            creditElement.textContent =
                formatMoney(card.used);

            const title =
                creditElement
                    .closest(".summary-card")
                    ?.querySelector(".card-title");

            if (title) {
                title.textContent =
                    card.name;
            }
        }
    }


    // 7. Meta principal
    const goalElement =
        document.querySelector("#dashboardGoalSaved");

    if (goalElement) {

        const goal =
            getActiveGoals()[0];

        if (!goal) {
            goalElement.textContent = "S/ 0.00";
        } else {

            goalElement.textContent =
                formatMoney(goal.saved);

            const title =
                goalElement
                    .closest(".summary-card")
                    ?.querySelector(".card-title");

            if (title) {
                title.textContent =
                    goal.name;
            }
        }
    }
}


document.addEventListener(
    "DOMContentLoaded",
    renderSummaryOnly
);
