/*
==========================================
FinanceFlow
Archivo: goals.js

Gestiona las metas financieras.
==========================================
*/

let selectedGoalId = null;

let editingGoalId = null;

/**
 * Devuelve todas las metas.
 */
function getGoals() {

    return userData.goals;

}


/**
 * Devuelve las metas activas.
 */
function getActiveGoals() {

    return userData.goals.filter(
        goal => goal.active
    );

}


/**
 * Busca una meta.
 */
function getGoalById(id) {

    if (id === null || id === undefined) {

        return undefined;

    }

    return userData.goals.find(
        goal =>
            String(goal.id) ===
            String(id)
    );

}


/**
 * Calcula el porcentaje de una meta.
 */
function getGoalPercentage(goal) {

    if (!goal || goal.target <= 0) {

        return 0;

    }


    return Math.min(

        100,

        calculatePercentage(
            goal.saved,
            goal.target
        )

    );

}


/**
 * Agrega dinero a una meta.
 */
function addToGoal(goalId, amount) {

    const goal = getGoalById(goalId);

    if (!goal) {

        throw new Error("La meta no existe.");

    }


    if (amount <= 0) {

        throw new Error(
            "El monto debe ser mayor que cero."
        );

    }


    goal.saved = Math.min(

        goal.target,

        goal.saved + Number(amount)

    );

    saveFinanceFlowData();
    return goal;

}


/**
 * Determina si una meta fue completada.
 */
function isGoalCompleted(goal) {

    return goal.saved >= goal.target;

}

/* ==========================================
   PÁGINA DE METAS
========================================== */

function renderGoalsPage() {

    renderGoalsSummary();

    renderGoalsList();

}

function renderGoalsSummary() {

    const container =
        document.querySelector(
            "#goalsSummary"
        );


    if (!container) {

        return;

    }


    const goals =
        getActiveGoals();


    const totalSaved =
        goals.reduce(
            (sum, goal) =>
                sum + Number(goal.saved || 0),
            0
        );


    const totalTarget =
        goals.reduce(
            (sum, goal) =>
                sum + Number(goal.target || 0),
            0
        );


    const completed =
        goals.filter(
            goal =>
                Number(goal.saved || 0) >=
                Number(goal.target || 0)
        ).length;


    const overallProgress =
        totalTarget > 0
            ? (totalSaved / totalTarget) * 100
            : 0;


    container.innerHTML = `

        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Metas activas
            </div>

            <div class="accounts-summary-value">
                ${goals.length}
            </div>

        </div>


        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Ahorrado
            </div>

            <div class="accounts-summary-value">
                ${formatMoney(totalSaved)}
            </div>

        </div>


        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Objetivo total
            </div>

            <div class="accounts-summary-value">
                ${formatMoney(totalTarget)}
            </div>

        </div>


        <div class="accounts-summary-item">

            <div class="accounts-summary-label">
                Completadas
            </div>

            <div class="accounts-summary-value">
                ${completed}
            </div>

        </div>

    `;

}

function renderGoalsList() {

    const container =
        document.querySelector(
            "#goalsGrid"
        );


    if (!container) {

        return;

    }


    const goals =
        getActiveGoals();


    if (!goals.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="empty-icon">
                    🎯
                </span>

                <h4>
                    Todavía no tienes metas
                </h4>

                <p>
                    Crea tu primera meta y empieza a construirla poco a poco.
                </p>

                <button
                    class="btn-primary"
                    id="emptyGoalButton">

                    + Crear mi primera meta

                </button>

            </div>

        `;

        initializeGoalButtons();

        return;

    }


    container.innerHTML =
        goals.map(
            goal => {

                const target =
                    Number(goal.target || 0);


                const saved =
                    Number(goal.saved || 0);


                const percentage =
                    target > 0
                        ? Math.min(
                            (saved / target) * 100,
                            100
                        )
                        : 0;


                const remaining =
                    Math.max(
                        target - saved,
                        0
                    );


                const completed =
                    percentage >= 100;


                return `

                    <article class="card goal-page-card">

                        <div class="card-header">

                            <div>

                                <span class="card-icon">
                                    🎯
                                </span>

                                <h3>
                                    ${escapeHTML(goal.name)}
                                </h3>

                            </div>


                            <span class="goal-percentage">
                                ${Math.round(percentage)}%
                            </span>

                        </div>


                        <div class="card-body">

                            <p class="card-description">
                                ${
                                    escapeHTML(
                                        goal.description ||
                                        "Tu próximo objetivo."
                                    )
                                }
                            </p>


                            <div class="progress-bar">

                                <div
                                    class="progress-fill"
                                    style="width: ${percentage}%">
                                </div>

                            </div>


                            <div class="goal-footer">

                                <span>

                                    Ahorrado:

                                    <strong>
                                        ${formatMoney(saved)}
                                    </strong>

                                </span>


                                <span>

                                    Meta:

                                    <strong>
                                        ${formatMoney(target)}
                                    </strong>

                                </span>

                            </div>

                            <div class="goal-manage-actions">

                                <button
                                    type="button"
                                    class="account-action"
                                    data-goal-edit="${escapeHTML(goal.id)}">

                                    Editar

                                </button>

                                <button
                                    type="button"
                                    class="account-action is-danger"
                                    data-goal-delete="${escapeHTML(goal.id)}">

                                    Eliminar

                                </button>

                            </div>

                            ${
                                completed
                                ? `
                                    <div class="goal-completed">

                                        🎉
                                        ¡Meta completada!

                                    </div>
                                `
                                : `
                                    <div class="goal-actions">

                                        <div class="goal-remaining">

                                            Te faltan
                                            <strong>
                                                ${formatMoney(remaining)}
                                            </strong>

                                            para alcanzar esta meta.

                                        </div>

                                        <button
                                            type="button"
                                            class="btn-primary goal-add-money"
                                            data-goal-id="${goal.id}">

                                            + Agregar ahorro

                                        </button>

                                    </div>
                                `
                            }

                        </div>

                    </article>

                `;

            }
        ).join("");

}

function initializeGoalButtons() {

    const button =
        document.querySelector(
            "#emptyGoalButton"
        );


    if (!button) {

        return;

    }


    button.onclick =
        openGoalModal;

}

function openGoalModal(goalId) {

    const modal =
        document.querySelector(
            "#goalModal"
        );


    if (!modal) {

        console.warn(
            "FinanceFlow: goalModal no encontrado"
        );

        return;

    }

    /* goalId solo es un id real al editar; al crear llega un evento */

    const goal =
        (typeof goalId === "string" || typeof goalId === "number")
            ? getGoalById(goalId)
            : null;

    editingGoalId =
        goal ? goal.id : null;

    document.querySelector("#goalForm")?.reset();

    const setText = (selector, text) => {

        const element = document.querySelector(selector);

        if (element) {

            element.textContent = text;

        }

    };

    setText("#goalFormError", "");

    setText("#goalModalTitle", goal ? "Editar meta" : "Nueva meta");

    setText(
        "#goalModal button[type='submit']",
        goal ? "Guardar cambios" : "Crear meta"
    );

    setText(
        "label[for='goalInitialSaved']",
        goal ? "Ahorrado hasta ahora" : "Ahorro inicial"
    );

    if (goal) {

        document.querySelector("#goalName").value = goal.name || "";

        document.querySelector("#goalTargetInput").value = goal.target;

        document.querySelector("#goalInitialSaved").value = goal.saved;

        document.querySelector("#goalDescription").value =
            goal.description || "";

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


    const nameInput =
        document.querySelector(
            "#goalName"
        );


    if (nameInput) {

        nameInput.focus();

    }

}

function closeGoalModal() {

    const modal =
        document.querySelector(
            "#goalModal"
        );


    if (!modal) {

        return;

    }


    editingGoalId = null;

    closeModalSafely(modal);

}

function initializeGoalForm() {

    console.log("✅ initializeGoalForm SE EJECUTÓ");

    const openButton =
        document.querySelector(
            "#openGoalModal"
        );


    const closeButton =
        document.querySelector(
            "#closeGoalModal"
        );


    const cancelButton =
        document.querySelector(
            "#cancelGoal"
        );


    const form =
        document.querySelector(
            "#goalForm"
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            openGoalModal
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeGoalModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeGoalModal
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            handleGoalSubmit
        );

    }

}

function createGoal(goalData) {

    if (!goalData) {

        throw new Error(
            "No se proporcionaron datos para crear la meta."
        );

    }


    const name =
        String(
            goalData.name || ""
        ).trim();


    const target =
        Number(
            goalData.target
        );


    const saved =
        Number(
            goalData.saved || 0
        );


    const description =
        String(
            goalData.description || ""
        ).trim();


    if (!name) {

        throw new Error(
            "El nombre de la meta es obligatorio."
        );

    }


    if (
        !Number.isFinite(target) ||
        target <= 0
    ) {

        throw new Error(
            "El objetivo debe ser mayor a cero."
        );

    }


    if (
        !Number.isFinite(saved) ||
        saved < 0
    ) {

        throw new Error(
            "El ahorro inicial no puede ser negativo."
        );

    }


    if (saved > target) {

        throw new Error(
            "El ahorro inicial no puede superar el objetivo."
        );

    }


    const newGoal = {

        id:
            `goal_${Date.now()}`,

        name,

        target,

        saved,

        description,

        active:
            true,

        createdAt:
            new Date().toISOString()

    };


    userData.goals.push(
        newGoal
    );

    saveFinanceFlowData();
    return newGoal;

}

/**
 * Edita una meta existente.
 */
function updateGoal(id, data) {

    const goal = getGoalById(id);

    if (!goal) {

        throw new Error("La meta no existe.");

    }

    const name = String(data.name || "").trim();

    const target = Number(data.target);

    const saved = Number(data.saved);

    if (!name) {

        throw new Error("Ingresa un nombre para la meta.");

    }

    if (!Number.isFinite(target) || target <= 0) {

        throw new Error("El objetivo debe ser mayor a S/ 0.");

    }

    if (!Number.isFinite(saved) || saved < 0) {

        throw new Error("El ahorro no puede ser negativo.");

    }

    if (saved > target) {

        throw new Error("Lo ahorrado no puede superar el objetivo.");

    }

    goal.name = name;

    goal.target = target;

    goal.saved = saved;

    goal.description = String(data.description || "").trim();

    saveFinanceFlowData();

    return goal;

}


/**
 * Elimina una meta.
 */
function deleteGoal(id) {

    userData.goals =
        userData.goals.filter(
            goal => String(goal.id) !== String(id)
        );

    saveFinanceFlowData();

}


/**
 * Refresca todo lo que muestra metas
 * (página Metas, dashboard y carrusel).
 */
function refreshGoalDependentUI() {

    if (typeof refreshFinanceFlowUI === "function") {

        refreshFinanceFlowUI();

        return;

    }

    renderGoalsPage();

    renderDashboard();

}


/* Botones Editar / Eliminar de cada meta */

document.addEventListener("click", event => {

    const editButton =
        event.target.closest("[data-goal-edit]");

    if (editButton) {

        openGoalModal(editButton.dataset.goalEdit);

        return;

    }

    const deleteButton =
        event.target.closest("[data-goal-delete]");

    if (!deleteButton) {

        return;

    }

    const goal =
        getGoalById(deleteButton.dataset.goalDelete);

    if (
        !goal ||
        !confirm(`¿Eliminar la meta "${goal.name}"? Se perderá lo ahorrado registrado en ella.`)
    ) {

        return;

    }

    deleteGoal(goal.id);

    refreshGoalDependentUI();

    if (typeof showNotification === "function") {

        showNotification("Meta eliminada.", "success");

    }

});


function handleGoalSubmit(event) {

    event.preventDefault();


    const name =
        document.querySelector(
            "#goalName"
        ).value.trim();


const targetInput = document.querySelector("#goalTargetInput");

console.log(
    "🔎 Valor de goalTarget:",
    targetInput ? targetInput.value : "NO EXISTE"
);

const target =
    Number(
        targetInput ? targetInput.value : NaN
    );

console.log(
    "🔎 Target convertido:",
    target
);

    const saved =
        Number(
            document.querySelector(
                "#goalInitialSaved"
            ).value
        );


    const description =
        document.querySelector(
            "#goalDescription"
        ).value.trim();


    const error =
        document.querySelector(
            "#goalFormError"
        );


    error.textContent = "";


    if (!name) {

        error.textContent =
            "Ingresa un nombre para la meta.";

        return;

    }


    if (!Number.isFinite(target) || target <= 0) {

        error.textContent =
            "El objetivo debe ser mayor a S/ 0.";

        return;

    }


    if (!Number.isFinite(saved) || saved < 0) {

        error.textContent =
            "El ahorro inicial no puede ser negativo.";

        return;

    }


    if (saved > target) {

        error.textContent =
            "El ahorro inicial no puede superar el objetivo.";

        return;

    }

    if (editingGoalId !== null) {

        try {

            updateGoal(editingGoalId, { name, target, saved, description });

        } catch (err) {

            error.textContent = err.message;

            return;

        }

        closeGoalModal();

        refreshGoalDependentUI();

        return;

    }

    createGoal({

        name,

        target,

        saved,

        description

    });

    closeGoalModal();


    document
        .querySelector("#goalForm")
        ?.reset();


    renderGoalsPage();


    renderDashboard();


    initializeGoalButtons();

}

function openGoalSavingModal(goalId) {

    const goal =
        userData.goals.find(
            item =>
                String(item.id) ===
                String(goalId)
        );


    if (!goal) {

        console.error(
            "❌ No se encontró la meta:",
            goalId
        );

        return;

    }


    selectedGoalId =
        goal.id;


    const modal =
        document.querySelector(
            "#goalSavingModal"
        );

    const name =
        document.querySelector(
            "#goalSavingName"
        );

    const amount =
        document.querySelector(
            "#goalSavingAmount"
        );

    const error =
        document.querySelector(
            "#goalSavingFormError"
        );


    if (!modal) {

        console.error(
            "❌ No se encontró #goalSavingModal"
        );

        return;

    }


    if (name) {

        name.textContent =
            goal.name;

    }


    if (amount) {

        amount.value = "";

    }


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


    if (amount) {

        amount.focus();

    }

}


/* ==========================================
   CERRAR MODAL DE AHORRO
========================================== */

function closeGoalSavingModal() {

    const modal =
        document.querySelector(
            "#goalSavingModal"
        );


    if (!modal) {

        return;

    }


    /*
    IMPORTANTE:
    Quitamos el foco antes de poner
    aria-hidden="true".
    */

    if (
        document.activeElement &&
        modal.contains(
            document.activeElement
        )
    ) {

        document.activeElement.blur();

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

    selectedGoalId =
        null;

}

/* ==========================================
   INICIALIZAR FORMULARIO DE AHORRO
========================================== */

function initializeGoalSavingForm() {

    console.log(
        "🎯 Inicializando sistema de ahorro de metas"
    );


    const closeButton =
        document.querySelector(
            "#closeGoalSavingModal"
        );


    const cancelButton =
        document.querySelector(
            "#cancelGoalSaving"
        );


    const form =
        document.querySelector(
            "#goalSavingForm"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeGoalSavingModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeGoalSavingModal
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            handleGoalSavingSubmit
        );

    }

}


/* ==========================================
   BOTONES "AGREGAR AHORRO"
========================================== */

function initializeGoalSavingButtons() {

    console.log(
        "🔘 Inicializando botones de ahorro"
    );


    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".goal-add-money"
                );


            if (!button) {

                return;

            }


            const goalId =
                button.dataset.goalId;


            console.log(
                "💰 Botón Agregar ahorro:",
                goalId
            );


            /*
            Evitamos continuar si el botón
            no tiene un ID real.
            */

            if (!goalId) {

                console.error(
                    "❌ El botón no tiene data-goal-id."
                );

                return;

            }


            openGoalSavingModal(
                goalId
            );

        }
    );

}


/* ==========================================
   GUARDAR AHORRO
========================================== */

function handleGoalSavingSubmit(event) {

    event.preventDefault();

    console.log(
        "🟢 SUBMIT DEL AHORRO EJECUTADO"
    );
    
    const error =
        document.querySelector(
            "#goalSavingFormError"
        );


    const amountInput =
        document.querySelector(
            "#goalSavingAmount"
        );


    const amount =
        Number(
            amountInput.value
        );


    if (error) {

        error.textContent = "";

    }


    /*
    VALIDAR MONTO
    */

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        if (error) {

            error.textContent =
                "Ingresa un monto válido.";

        }

        return;

    }


    /*
    BUSCAR META
    */

    const goal =
        userData.goals.find(
            item =>
                String(item.id) ===
                String(selectedGoalId)
        );


    if (!goal) {

        if (error) {

            error.textContent =
                "No se encontró la meta.";

        }

        console.error(
            "❌ No se encontró la meta seleccionada:",
            selectedGoalId
        );

        return;

    }


    /*
    VALORES ACTUALES
    */

    const target =
        Number(
            goal.target || 0
        );


    const saved =
        Number(
            goal.saved || 0
        );


    const remaining =
        target - saved;


    /*
    META YA COMPLETADA
    */

    if (remaining <= 0) {

        if (error) {

            error.textContent =
                "Esta meta ya está completada.";

        }

        return;

    }


    /*
    NO PERMITIR SUPERAR LA META
    */

    if (amount > remaining) {

        if (error) {

            error.textContent =
                `Solo necesitas ${formatMoney(remaining)} para completar esta meta.`;

        }

        return;

    }


    /*
    ACTUALIZAR AHORRO
    */

    addToGoal(
        selectedGoalId,
        amount
    );


    console.log(
        "💰 Ahorro agregado:",
        amount
    );


    console.log(
        "🎯 Nuevo progreso:",
        getGoalById(selectedGoalId).saved,
        "/",
        getGoalById(selectedGoalId).target
    );


    /*
    CERRAR MODAL
    */

    closeGoalSavingModal();


    /*
    ACTUALIZAR INTERFAZ
    */

    renderGoalsPage();

    renderDashboard();


    /*
    NOTIFICACIÓN
    */

    if (
        typeof showNotification ===
        "function"
    ) {

        showNotification(
            `Has agregado ${formatMoney(amount)} a ${goal.name}.`,
            "success"
        );

    }

}
