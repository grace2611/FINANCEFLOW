/*
==========================================
FinanceFlow
Archivo: app.js

Punto de entrada de la aplicación.
==========================================
*/



/* ==========================================
   CUENTAS DEL FORMULARIO
========================================== */

function renderMovementAccounts() {

    const select =
        document.querySelector(
            "#movementAccount"
        );


    if (!select) {

        return;

    }


    const accounts =
        getAvailableAccounts();


    select.innerHTML =
        accounts.map(account => `

            <option value="${account.id}">

                ${escapeHTML(account.icon)}
                ${escapeHTML(account.name)}
                · ${formatMoney(account.balance)}

            </option>

        `).join("");

}


/* ==========================================
   MODAL
========================================== */

function openMovementModal() {

    const modal =
        document.querySelector(
            "#movementModal"
        );

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


    document.querySelector(
        "#movementDescription"
    ).focus();

}


function closeMovementModal() {

    const modal =
        document.querySelector(
            "#movementModal"
        );


    if (!modal) {

        return;

    }


    /*
    ==========================================
    DEVOLVER EL FOCO ANTES DE OCULTAR EL MODAL
    ==========================================
    */

    const activeElement =
        document.activeElement;


    if (
        activeElement &&
        modal.contains(activeElement)
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


    clearMovementForm();

}


/* ==========================================
   LIMPIAR FORMULARIO
========================================== */

function clearMovementForm() {

    const form =
        document.querySelector(
            "#movementForm"
        );


    form.reset();


    const date =
    document.querySelector(
        "#movementDate"
    );


    date.value =
        getLocalDateString();

    const error =
        document.querySelector(
            "#movementFormError"
        );


    error.textContent = "";


    renderMovementAccounts();

}


/* ==========================================
   FORMULARIO
========================================== */

function initializeMovementForm() {

    const openButtons =
        document.querySelectorAll(
            ".js-open-movement-modal"
        );


    const closeButton =
        document.querySelector(
            "#closeMovementModal"
        );


    const cancelButton =
        document.querySelector(
            "#cancelMovement"
        );


    const modal =
        document.querySelector(
            "#movementModal"
        );


    const form =
        document.querySelector(
            "#movementForm"
        );

    if (
        !openButtons.length ||
        !closeButton ||
        !cancelButton ||
        !modal ||
        !form
    ) {
        return;
    }

    openButtons.forEach(button => {

        button.addEventListener(
            "click",
            openMovementModal
        );

    });

    closeButton.addEventListener(
        "click",
        closeMovementModal
    );


    cancelButton.addEventListener(
        "click",
        closeMovementModal
    );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeMovementModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.classList.contains("is-open")
            ) {

                closeMovementModal();

            }

        }
    );


    form.addEventListener(
        "submit",
        handleMovementSubmit
    );


    clearMovementForm();

}


/* ==========================================
   GUARDAR MOVIMIENTO
========================================== */

function handleMovementSubmit(event) {

    event.preventDefault();


    const error =
        document.querySelector(
            "#movementFormError"
        );


    error.textContent = "";


    const data = {

        type:
            document.querySelector(
                "#movementType"
            ).value,

        description:
            document.querySelector(
                "#movementDescription"
            ).value.trim(),

        category:
            document.querySelector(
                "#movementCategory"
            ).value,

        accountId:
            document.querySelector(
                "#movementAccount"
            ).value,

        amount:
            document.querySelector(
                "#movementAmount"
            ).value,

        date:
            document.querySelector(
                "#movementDate"
            ).value

    };


    try {
  
        addMovement(data);


        closeMovementModal();


        refreshFinanceFlowUI();


        showNotification(
            "Movimiento registrado correctamente.",
            "success"
        );

    } catch (err) {

        error.textContent =
            err.message;

    }

}


/* ==========================================
   NOTIFICACIÓN
========================================== */

function showNotification(
    message,
    type = "success"
) {

    let notification =
        document.querySelector(
            "#financeNotification"
        );


    if (!notification) {

        notification =
            document.createElement("div");

        notification.id =
            "financeNotification";

        document.body.appendChild(
            notification
        );

    }


    notification.className =
        `finance-notification ${type}`;


    notification.textContent =
        message;


    requestAnimationFrame(() => {

        notification.classList.add(
            "show"
        );

    });


    setTimeout(() => {

        notification.classList.remove(
            "show"
        );

    }, 2800);

}

/* ==========================================
   SIDEBAR · ABRIR / CERRAR
========================================== */

function initializeSidebarToggle() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const toggleButton =
        document.querySelector(
            "#sidebarToggle"
        );

    const toggleIcon =
        document.querySelector(
            "#sidebarToggleIcon"
        );

    if (
        !sidebar ||
        !toggleButton ||
        !toggleIcon
    ) {
        return;
    }


    if (
        toggleButton.dataset.initialized ===
        "true"
    ) {
        return;
    }


    toggleButton.addEventListener(
        "click",
        () => {

            const collapsed =
                document.body.classList.toggle(
                    "sidebar-collapsed"
                );


            if (collapsed) {

                toggleIcon.textContent =
                    "▶";

                toggleButton.setAttribute(
                    "aria-label",
                    "Abrir barra lateral"
                );

                toggleButton.setAttribute(
                    "title",
                    "Abrir barra lateral"
                );

            } else {

                toggleIcon.textContent =
                    "◀";

                toggleButton.setAttribute(
                    "aria-label",
                    "Cerrar barra lateral"
                );

                toggleButton.setAttribute(
                    "title",
                    "Cerrar barra lateral"
                );

            }

        }
    );


    toggleButton.dataset.initialized =
        "true";

}

/* ==========================================
   NAVEGACIÓN
========================================== */

/* ==========================================
   CAMBIAR DE VISTA
========================================== */

function showView(viewName) {

    const pageTitles = {

        dashboard:
            "Dashboard",

        accounts:
            "Cuentas",

        movements:
            "Movimientos",

        goals:
            "Metas",

        calendar:
            "Calendario",

        credit:
            "Crédito",

        analysis:
            "Análisis",

        reports:
            "Reportes",

        settings:
            "Configuración",

        loans:
            "Préstamos"

    };


    const pageTitle =
        document.querySelector(
            "#pageTitle"
        );


    if (pageTitle) {

        pageTitle.textContent =
            pageTitles[viewName] ||
            "FinanceFlow";

    }    

    console.log(
        "Navegación:",
        viewName
    );


    /*
    ==========================================
    VISTAS DISPONIBLES
    ==========================================
    */

    const views = {

        dashboard:
            document.querySelector(
                "#dashboardView"
            ),

        accounts:
            document.querySelector(
                "#accountsView"
            ),

        movements:
            document.querySelector(
                "#movementsView"
            ),

        goals:
            document.querySelector(
                "#goalsView"
            ),

        calendar:
            document.querySelector(
                "#calendarView"
            ),

        credit:
            document.querySelector(
                "#creditView"
            ),

        analysis:
            document.querySelector(
                "#analysisView"
            ),

        reports:
            document.querySelector(
                "#reportsView"
            ),

        settings:
            document.querySelector(
                "#settingsView"
            ),

        loans:
            document.querySelector(
                "#loansView"
            )
    };


    /*
    ==========================================
    VALIDAR VISTA SOLICITADA
    ==========================================
    */

    const targetView =
        views[viewName];


    if (!targetView) {

        console.warn(
            `La vista "${viewName}" no existe en el HTML.`
        );

        return;

    }


    /*
    ==========================================
    OCULTAR TODAS LAS VISTAS
    ==========================================
    */

    Object.values(views).forEach(
        view => {

            if (!view) {

                return;

            }

            view.hidden = true;

            view.classList.remove(
                "active"
            );

        }
    );


    /*
    ==========================================
    MOSTRAR VISTA SOLICITADA
    ==========================================
    */

    targetView.hidden = false;

    targetView.classList.add(
        "active"
    );


    const sidebarItems =
        document.querySelectorAll(
            ".sidebar-menu li[data-view]"
        );


    sidebarItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.view ===
                viewName
            );

        }
    );


    /*
    ==========================================
    RENDERIZADO ESPECÍFICO
    ==========================================
    */
    switch (viewName) {

        case "dashboard":

            if (
                typeof renderDashboard ===
                "function"
            ) {

                renderDashboard();

            }

            break;


        case "accounts":

            if (
                typeof renderAccountsPage ===
                "function"
            ) {

                renderAccountsPage();

            }

            break;


        case "movements":

            if (
                typeof renderMovementsPage ===
                "function"
            ) {

                renderMovementsPage();

            }

            break;


        case "goals":

            if (
                typeof renderGoalsPage ===
                "function"
            ) {

                renderGoalsPage();

            }

            break;

        case "calendar":

            if (
                typeof renderCalendar ===
                "function"
            ) {

                renderCalendar();

            }

            break;       

        case "credit":

            if (
                typeof renderCreditPage ===
                "function"
            ) {

                renderCreditPage();

            }

            break;

        case "loans":

            if (
                typeof renderLoansPage ===
                "function"
            ) {

                renderLoansPage();

            }

            break;

        case "analysis":

            if (
                typeof renderAnalysisPage ===
                "function"
            ) {

                renderAnalysisPage();

            }

            break;

        case "reports":

            if (
                typeof renderReportsPage ===
                "function"
            ) {

                renderReportsPage();

            }

            break;

        case "settings":

            if (
                typeof renderSettingsPage ===
                "function"
            ) {

                renderSettingsPage();

            }

            break;

    }

}

/* ==========================================
   SISTEMA DE NOTIFICACIONES
========================================== */


/* ==========================================
   CREAR NOTIFICACIÓN
========================================== */

function createNotification(data) {

    if (!Array.isArray(userData.notifications)) {

        userData.notifications = [];

    }


    if (!data || !data.message) {

        return null;

    }


    const notification = {

        id:
            `notification_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        type:
            data.type ||
            "info",

        title:
            data.title ||
            "FinanceFlow",

        message:
            data.message,

        date:
            new Date().toISOString(),

        read:
            false

    };


    userData.notifications.unshift(
        notification
    );


    /*
    ==========================================
    EVITAR ACUMULACIÓN INNECESARIA
    ==========================================
    */

    if (
        userData.notifications.length > 50
    ) {

        userData.notifications =
            userData.notifications.slice(
                0,
                50
            );

    }


    renderNotifications();


    return notification;

}


/* ==========================================
   MOTOR AUTOMÁTICO DE ALERTAS
========================================== */


/* ==========================================
   COMPROBAR SI YA EXISTE
========================================== */

function notificationAlreadyExists(
    type,
    referenceId
) {

    const notifications =
        getNotifications();


    return notifications.some(
        notification =>

            notification.type === type &&

            notification.referenceId ===
                String(referenceId)

    );

}


/* ==========================================
   CREAR ALERTA ÚNICA
========================================== */

function createUniqueNotification(data) {

    if (!data || !data.message) {

        return null;

    }


    const referenceId =
        data.referenceId !== undefined
            ? String(data.referenceId)
            : null;


    if (
        referenceId &&
        notificationAlreadyExists(
            data.type,
            referenceId
        )
    ) {

        return null;

    }


    const notification =
        createNotification({

            type:
                data.type,

            title:
                data.title,

            message:
                data.message

        });


    if (
        notification &&
        referenceId
    ) {

        notification.referenceId =
            referenceId;

    }


    return notification;

}


/* ==========================================
   ALERTAS DE PRÉSTAMOS
========================================== */

function checkLoanNotifications() {

    if (
        !Array.isArray(
            userData.loans
        )
    ) {

        return;

    }


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    userData.loans.forEach(
        loan => {

            if (
                loan.status !==
                "pending"
            ) {

                return;

            }


            if (!loan.dueDate) {

                return;

            }


            const dueDate =
                new Date(
                    `${loan.dueDate}T00:00:00`
                );


            if (
                Number.isNaN(
                    dueDate.getTime()
                )
            ) {

                return;

            }


            /*
            ==================================
            PRÉSTAMO VENCIDO
            ==================================
            */

            if (
                dueDate <
                today
            ) {

                createUniqueNotification({

                    type:
                        "loan",

                    title:
                        "Préstamo vencido",

                    message:
                        `El préstamo de ${loan.person} por S/ ${Number(loan.amount).toFixed(2)} está vencido.`,

                    referenceId:
                        `overdue_${loan.id}`

                });


                return;

            }


            /*
            ==================================
            PRÉSTAMO PARA HOY
            ==================================
            */

            if (
                dueDate.getTime() ===
                today.getTime()
            ) {

                createUniqueNotification({

                    type:
                        "loan",

                    title:
                        "Préstamo vence hoy",

                    message:
                        `Hoy vence el préstamo de ${loan.person} por S/ ${Number(loan.amount).toFixed(2)}.`,

                    referenceId:
                        `today_${loan.id}`

                });


                return;

            }


            /*
            ==================================
            PRÉSTAMO PRÓXIMO
            ==================================
            */

            const difference =
                dueDate.getTime() -
                today.getTime();


            const days =
                Math.ceil(
                    difference /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                );


            if (
                days <= 3
            ) {

                createUniqueNotification({

                    type:
                        "loan",

                    title:
                        "Préstamo próximo",

                    message:
                        `El préstamo de ${loan.person} por S/ ${Number(loan.amount).toFixed(2)} vence en ${days} día${days === 1 ? "" : "s"}.`,

                    referenceId:
                        `upcoming_${loan.id}_${days}`

                });

            }

        }
    );

}


/* ==========================================
   ALERTAS DE CRÉDITO
========================================== */

function checkCreditNotifications() {

    if (
        !Array.isArray(
            userData.creditCards
        )
    ) {

        return;

    }


    userData.creditCards.forEach(
        card => {

            if (
                card.active === false
            ) {

                return;

            }


            const limit =
                Number(card.limit) || 0;


            const used =
                Number(card.used) || 0;


            if (
                limit <= 0
            ) {

                return;

            }


            const percentage =
                (
                    used /
                    limit
                ) * 100;


            /*
            ==================================
            MÁS DEL 70%
            ==================================
            */

            if (
                percentage >= 70
            ) {

                createUniqueNotification({

                    type:
                        "credit",

                    title:
                        "Crédito elevado",

                    message:
                        `Has utilizado el ${percentage.toFixed(0)}% de tu crédito en ${card.name}.`,

                    referenceId:
                        `credit_70_${card.id}`

                });

            }


            /*
            ==================================
            MÁS DEL 90%
            ==================================
            */

            if (
                percentage >= 90
            ) {

                createUniqueNotification({

                    type:
                        "warning",

                    title:
                        "Crédito casi agotado",

                    message:
                        `Tu tarjeta ${card.name} tiene un uso del ${percentage.toFixed(0)}%.`,

                    referenceId:
                        `credit_90_${card.id}`

                });

            }

        }
    );

}


/* ==========================================
   ALERTAS DE METAS
========================================== */

function checkGoalNotifications() {

    if (
        !Array.isArray(
            userData.goals
        )
    ) {

        return;

    }


    userData.goals.forEach(
        goal => {

            if (
                goal.active === false
            ) {

                return;

            }


            const target =
                Number(goal.target) || 0;


            const saved =
                Number(goal.saved) || 0;


            if (
                target <= 0
            ) {

                return;

            }


            const percentage =
                (
                    saved /
                    target
                ) * 100;


            /*
            ==================================
            META COMPLETADA
            ==================================
            */

            if (
                percentage >= 100
            ) {

                createUniqueNotification({

                    type:
                        "goal",

                    title:
                        "¡Meta completada! 🎉",

                    message:
                        `Has alcanzado tu meta "${goal.name}".`,

                    referenceId:
                        `goal_100_${goal.id}`

                });


                return;

            }


            /*
            ==================================
            80%
            ==================================
            */

            if (
                percentage >= 80
            ) {

                createUniqueNotification({

                    type:
                        "goal",

                    title:
                        "¡Gran progreso! 🎯",

                    message:
                        `Has alcanzado el ${percentage.toFixed(0)}% de tu meta "${goal.name}".`,

                    referenceId:
                        `goal_80_${goal.id}`

                });

            }

        }
    );

}


/* ==========================================
   EJECUTAR TODAS LAS COMPROBACIONES
========================================== */

function checkFinancialNotifications() {

    checkLoanNotifications();

    checkCreditNotifications();

    checkGoalNotifications();

    if (typeof checkEventNotifications === "function") {

        checkEventNotifications();

    }

    renderNotifications();

}

/* ==========================================
   OBTENER NOTIFICACIONES
========================================== */

function getNotifications() {

    if (!Array.isArray(userData.notifications)) {

        userData.notifications = [];

    }


    return userData.notifications;

}


/* ==========================================
   CONTAR NO LEÍDAS
========================================== */

function getUnreadNotificationsCount() {

    return getNotifications()
        .filter(
            notification =>
                notification.read !== true
        )
        .length;

}


/* ==========================================
   RENDERIZAR NOTIFICACIONES
========================================== */

function renderNotifications() {

    const list =
        document.querySelector(
            "#notificationsList"
        );


    const badge =
        document.querySelector(
            "#notificationsBadge"
        );


    if (!list) {

        return;

    }


    const notifications =
        getNotifications();


    /*
    ==========================================
    CONTADOR
    ==========================================
    */

    const unreadCount =
        getUnreadNotificationsCount();


    if (badge) {

        badge.textContent =
            unreadCount;

        badge.hidden =
            unreadCount === 0;

    }


    /*
    ==========================================
    LISTA VACÍA
    ==========================================
    */

    if (!notifications.length) {

        list.innerHTML = `

            <div class="empty-state">

                <span class="empty-icon">
                    🔔
                </span>

                <h4>
                    No tienes notificaciones
                </h4>

                <p>
                    Aquí aparecerán tus avisos financieros.
                </p>

            </div>

        `;

        return;

    }


    list.innerHTML =
        notifications
            .map(
                notification => {

                    const unreadClass =
                        notification.read
                            ? ""
                            : "is-unread";


                    const icon =
                        getNotificationIcon(
                            notification.type
                        );


                    return `

                        <article
                            class="notification-item ${unreadClass}"
                            data-notification-id="${notification.id}">

                            <div class="notification-icon">

                                ${icon}

                            </div>


                            <div class="notification-content">

                                <strong>

                                    ${escapeHTML(
                                        notification.title
                                    )}

                                </strong>


                                <p>

                                    ${escapeHTML(
                                        notification.message
                                    )}

                                </p>


                                <small>

                                    ${formatNotificationDate(
                                        notification.date
                                    )}

                                </small>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


/* ==========================================
   ICONO
========================================== */

function getNotificationIcon(type) {

    const icons = {

        success: "✅",

        warning: "⚠️",

        error: "🚨",

        goal: "🎯",

        loan: "💰",

        credit: "💳",

        event: "📅",

        movement: "💸",

        info: "🔔"

    };


    return (
        icons[type] ||
        icons.info
    );

}


/* ==========================================
   FECHA DE NOTIFICACIÓN
========================================== */

function formatNotificationDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return new Intl.DateTimeFormat(
        "es-PE",
        {

            day: "numeric",

            month: "short",

            hour: "2-digit",

            minute: "2-digit"

        }
    ).format(date);

}


/* ==========================================
   MARCAR TODAS COMO LEÍDAS
========================================== */

function markAllNotificationsRead() {

    getNotifications()
        .forEach(
            notification => {

                notification.read =
                    true;

            }
        );


    renderNotifications();

}


/* ==========================================
   MARCAR UNA COMO LEÍDA
========================================== */

function markNotificationRead(
    id
) {

    const notification =
        getNotifications()
            .find(
                item =>
                    String(item.id) ===
                    String(id)
            );


    if (!notification) {

        return;

    }


    notification.read =
        true;


    renderNotifications();

}


/* ==========================================
   TOGGLE DEL PANEL
========================================== */

function toggleNotificationsPanel() {

    const button =
        document.querySelector(
            "#notificationsButton"
        );


    const panel =
        document.querySelector(
            "#notificationsPanel"
        );


    if (!button || !panel) {

        return;

    }


    const isOpen =
        !panel.hidden;


    panel.hidden =
        isOpen;


    button.setAttribute(
        "aria-expanded",
        String(!isOpen)
    );


    if (!isOpen) {

        positionNotificationsPanel();

    }

}


/* ==========================================
   POSICIÓN DEL PANEL (ventana flotante)
   Se coloca justo debajo de la campanita y
   por encima de todo el contenido.
========================================== */

function positionNotificationsPanel() {

    const button =
        document.querySelector(
            "#notificationsButton"
        );

    const panel =
        document.querySelector(
            "#notificationsPanel"
        );

    if (!button || !panel || panel.hidden) {

        return;

    }

    const rect =
        button.getBoundingClientRect();

    const right =
        Math.max(
            12,
            window.innerWidth - rect.right
        );

    panel.style.setProperty(
        "--np-top",
        `${Math.round(rect.bottom + 10)}px`
    );

    panel.style.setProperty(
        "--np-right",
        `${Math.round(right)}px`
    );

}

window.addEventListener(
    "resize",
    positionNotificationsPanel
);

window.addEventListener(
    "scroll",
    positionNotificationsPanel,
    true
);


/* ==========================================
   CERRAR PANEL
========================================== */

function closeNotificationsPanel() {

    const button =
        document.querySelector(
            "#notificationsButton"
        );


    const panel =
        document.querySelector(
            "#notificationsPanel"
        );


    if (!button || !panel) {

        return;

    }


    panel.hidden =
        true;


    button.setAttribute(
        "aria-expanded",
        "false"
    );

}


/* ==========================================
   INICIALIZAR NOTIFICACIONES
========================================== */

function initializeNotifications() {

    const button =
        document.querySelector(
            "#notificationsButton"
        );


    const markReadButton =
        document.querySelector(
            "#markNotificationsRead"
        );


    const panel =
        document.querySelector(
            "#notificationsPanel"
        );


    if (!button || !panel) {

        return;

    }


    if (
        button.dataset.notificationsInitialized ===
        "true"
    ) {

        return;

    }


    /*
    El panel se mueve al <body> para que flote sobre
    toda la página: dentro del encabezado quedaba
    atrapado (recortado y tapado por otras tarjetas).
    */

    document.body.appendChild(panel);


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleNotificationsPanel();

        }
    );


    if (markReadButton) {

        markReadButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                markAllNotificationsRead();

            }
        );

    }


    panel.addEventListener(
        "click",
        event => {

            const item =
                event.target.closest(
                    "[data-notification-id]"
                );


            if (!item) {

                return;

            }


            markNotificationRead(
                item.dataset.notificationId
            );

        }
    );


    document.addEventListener(
        "click",
        event => {

            const container =
                document.querySelector(
                    "#headerNotifications"
                );


            if (
                container &&
                !container.contains(
                    event.target
                ) &&
                !panel.contains(
                    event.target
                )
            ) {

                closeNotificationsPanel();

            }

        }
    );


    button.dataset.notificationsInitialized =
        "true";


    renderNotifications();

}

function refreshFinanceFlowUI() {

    /*
    ==========================================
    ACTUALIZAR TODA LA INTERFAZ
    ==========================================
    */

    if (
        typeof renderDashboard ===
        "function"
    ) {

        renderDashboard();

    }


    if (
        typeof renderAccountsPage ===
        "function"
    ) {

        renderAccountsPage();

    }


    if (
        typeof renderMovementsPage ===
        "function"
    ) {

        renderMovementsPage();

    }


    if (
        typeof renderGoalsPage ===
        "function"
    ) {

        renderGoalsPage();

    }


    if (
        typeof renderCreditPage ===
        "function"
    ) {

        renderCreditPage();

    }


    if (
        typeof renderCalendar ===
        "function"
    ) {

        renderCalendar();

    }

    if (
        typeof renderLoansPage ===
        "function"
    ) {

        renderLoansPage();

    }


    if (
        typeof renderMovementAccounts ===
        "function"
    ) {

        renderMovementAccounts();

    }


    if (
        typeof renderTransferAccounts ===
        "function"
    ) {

        renderTransferAccounts();

    }

}

/* ==========================================
   NAVEGACIÓN PRINCIPAL
========================================== */
function initializeNavigation() {

    const navigationItems =
        document.querySelectorAll(
            "[data-view]"
        );


    console.log(
        "Elementos de navegación encontrados:",
        navigationItems.length
    );


    navigationItems.forEach(
        item => {

            if (
                item.dataset.navigationInitialized ===
                "true"
            ) {

                return;

            }


            item.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const viewName =
                        this.dataset.view;


                    if (!viewName) {

                        return;

                    }


                    console.log(
                        "Navegación:",
                        viewName
                    );


                    showView(
                        viewName
                    );


                    if (
                        this.closest(
                            ".sidebar-menu"
                        )
                    ) {

                        setActiveNavigation(
                            this
                        );

                    }

                }
            );

            item.dataset.navigationInitialized =
                "true";

        }
    );

}

/* ==========================================
   ACCIONES RÁPIDAS DEL DASHBOARD
========================================== */

function initializeQuickActions() {

    const buttons =
        document.querySelectorAll(
            ".quick-actions-row [data-action]"
        );


    if (!buttons.length) {

        return;

    }


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.action;


                if (
                    action ===
                    "new-expense"
                ) {

                    openMovementModal();

                    const type =
                        document.querySelector(
                            "#movementType"
                        );

                    if (type) {

                        type.value =
                            "expense";

                    }

                    return;

                }


                if (
                    action ===
                    "new-income"
                ) {

                    openMovementModal();

                    const type =
                        document.querySelector(
                            "#movementType"
                        );

                    if (type) {

                        type.value =
                            "income";

                    }

                    return;

                }


                if (
                    action ===
                    "new-transfer"
                ) {

                    const transferButton =
                        document.querySelector(
                            "#openTransferModal"
                        );

                    if (transferButton) {

                        transferButton.click();

                    }

                    return;

                }


                if (
                    action ===
                    "new-goal"
                ) {

                    openGoalModal();

                    return;

                }


                if (
                    action ===
                    "new-account"
                ) {

                    const accountButton =
                        document.querySelector(
                            "#openAccountModal"
                        );

                    if (accountButton) {

                        accountButton.click();

                    }

                    return;

                }


                if (
                    action ===
                    "new-event"
                ) {

                    openEventModal();

                }

            }
        );

    });

}

function initializeAccountModal() {

    const openButton =
        document.querySelector(
            "#openAccountModal"
        );


    const modal =
        document.querySelector(
            "#accountModal"
        );


    const closeButton =
        document.querySelector(
            "#closeAccountModal"
        );


    const cancelButton =
        document.querySelector(
            "#cancelAccount"
        );


    const form =
        document.querySelector(
            "#accountForm"
        );


    if (
        !modal ||
        !form
    ) {

        return;

    }


    function openModal() {

        modal.hidden = false;

        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        form.reset();


        const error =
            document.querySelector(
                "#accountFormError"
            );


        if (error) {

            error.textContent = "";

        }

    }


    function closeModal() {

        modal.hidden = true;

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (openButton) {

        openButton.addEventListener(
            "click",
            openModal
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );

    }

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const nameInput =
                document.querySelector(
                    "#accountName"
                );


            const typeInput =
                document.querySelector(
                    "#accountType"
                );


            const balanceInput =
                document.querySelector(
                    "#accountBalance"
                );


            const error =
                document.querySelector(
                    "#accountFormError"
                );


            const name =
                nameInput?.value.trim() ||
                "";


            const type =
                typeInput?.value ||
                "";


            const balance =
                Number(
                    balanceInput?.value
                );


            if (error) {

                error.textContent = "";

            }


            if (!name) {

                if (error) {

                    error.textContent =
                        "Escribe un nombre para la cuenta.";

                }

                nameInput?.focus();

                return;

            }


            if (!type) {

                if (error) {

                    error.textContent =
                        "Selecciona el tipo de cuenta.";

                }

                typeInput?.focus();

                return;

            }


            if (
                !Number.isFinite(balance) ||
                balance < 0
            ) {

                if (error) {

                    error.textContent =
                        "El saldo inicial debe ser un número igual o mayor que cero.";

                }

                balanceInput?.focus();

                return;

            }


            if (
                typeof createAccount !==
                "function"
            ) {

                if (error) {

                    error.textContent =
                        "No se pudo conectar el formulario con el sistema de cuentas.";

                }

                return;

            }


            try {

                createAccount({

                    name,
                    type,
                    balance

                });


                closeModal();


                refreshFinanceFlowUI();


            } catch (accountError) {

                console.error(
                    "Error al crear cuenta:",
                    accountError
                );


                if (error) {

                    error.textContent =
                        accountError.message ||
                        "No se pudo crear la cuenta.";

                }

            }

        }
    );    

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeModal();

            }

        }
    );


    window.openAccountModal =
        openModal;

    window.closeAccountModal =
        closeModal;

}

function handleDeactivateAccount(
    accountId
) {

    const account =
        getAccountById(
            accountId
        );


    if (!account) {

        showNotification(
            "La cuenta no existe.",
            "error"
        );

        return;

    }

    if (
        Number(account.balance) !== 0
    ) {

        showNotification(
            "No puedes desactivar una cuenta que todavía tiene saldo.",
            "error"
        );

        return;

    }
    

    const confirmed =
        window.confirm(
            `¿Seguro que quieres desactivar "${account.name}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        deactivateAccount(
            accountId
        );


        refreshFinanceFlowUI();


        showNotification(
            "Cuenta desactivada correctamente.",
            "success"
        );


    } catch (error) {

        console.error(
            "Error al desactivar cuenta:",
            error
        );


        showNotification(
            error.message,
            "error"
        );

    }

}

/* ==========================================
   ACCIONES DE CUENTAS
========================================== */

function initializeAccountActions() {

    const grid =
        document.querySelector(
            "#accountsGrid"
        );


    if (!grid) {

        return;

    }


    if (
        grid.dataset.actionsInitialized ===
        "true"
    ) {

        return;

    }


    grid.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {

                return;

            }


            const action =
                button.dataset.action;


            const accountId =
                button.dataset.id;


            if (!accountId) {

                return;

            }


            if (
                action ===
                "edit-account"
            ) {

                openEditAccountModal(
                    accountId
                );

                return;

            }


            if (
                action ===
                "deactivate-account"
            ) {

                handleDeactivateAccount(
                    accountId
                );

                return;

            }


            if (
                action ===
                "reactivate-account"
            ) {

                try {

                    reactivateAccount(
                        accountId
                    );


                    renderAccountsPage();

                    renderDashboard();

                    renderMovementAccounts();

                    renderTransferAccounts();


                    showNotification(
                        "Cuenta reactivada correctamente.",
                        "success"
                    );

                } catch (error) {

                    console.error(
                        "Error al reactivar cuenta:",
                        error
                    );


                    showNotification(
                        error.message ||
                        "No se pudo reactivar la cuenta.",
                        "error"
                    );

                }


                return;

            }

        }
    );


    grid.dataset.actionsInitialized =
        "true";

}

function initializeAccountFilters() {

    const typeFilter =
        document.querySelector(
            "#accountTypeFilter"
        );


    const availabilityFilter =
        document.querySelector(
            "#accountAvailabilityFilter"
        );


    if (
        !typeFilter &&
        !availabilityFilter
    ) {

        return;

    }


    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            () => {

                renderAccountsPage();

            }
        );

    }


    if (availabilityFilter) {

        availabilityFilter.addEventListener(
            "change",
            () => {

                renderAccountsPage();

            }
        );

    }

}

function setActiveNavigation(activeItem) {

    const navigationItems =
        document.querySelectorAll(
            ".sidebar-menu li[data-view]"
        );


    navigationItems.forEach(
        item => {

            item.classList.remove(
                "active"
            );

        }
    );


    if (
        activeItem &&
        activeItem.closest(
            ".sidebar-menu"
        )
    ) {

        activeItem.classList.add(
            "active"
        );

    }

}

function closeModalSafely(modal) {

    if (!modal) {

        return;

    }


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

}

let editingAccountId = null;

function prepareCreateAccountModal() {

    editingAccountId = null;


    const modalTitle =
        document.querySelector(
            "#accountModalTitle"
        );


    const submitButton =
        document.querySelector(
            "#accountSubmitButton"
        );


    const form =
        document.querySelector(
            "#accountForm"
        );


    const error =
        document.querySelector(
            "#accountFormError"
        );


    if (form) {

        form.reset();

    }


    if (modalTitle) {

        modalTitle.textContent =
            "Nueva cuenta";

    }


    if (submitButton) {

        submitButton.textContent =
            "Crear cuenta";

    }


    if (error) {

        error.textContent = "";

    }

}

/* ==========================================
   FORMULARIO DE CUENTAS
========================================== */
function initializeAccountForm() {

    const openButton =
        document.querySelector(
            "#openAccountModal"
        );


    const closeButton =
        document.querySelector(
            "#closeAccountModal"
        );


    const cancelButton =
        document.querySelector(
            "#cancelAccount"
        );


    const modal =
        document.querySelector(
            "#accountModal"
        );


    const form =
        document.querySelector(
            "#accountForm"
        );


    if (
        !openButton ||
        !modal ||
        !form ||
        !closeButton ||
        !cancelButton
    ) {

        return;

    }

    openButton.addEventListener(
        "click",
        () => {

            prepareCreateAccountModal();


            const balanceInput =
                document.querySelector(
                    "#accountBalance"
                );


            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );


            const title =
                modal.querySelector(
                    "h3"
                );


            if (balanceInput) {

                balanceInput.disabled =
                    false;

            }


            if (submitButton) {

                submitButton.textContent =
                    "Crear cuenta";

            }


            if (title) {

                title.textContent =
                    "Nueva cuenta";

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
                    "#accountName"
                );


            if (nameInput) {

                nameInput.focus();

            }

        }
    );

    closeButton.addEventListener(
        "click",
        closeAccountModal
    );


    cancelButton.addEventListener(
        "click",
        closeAccountModal
    );


    form.addEventListener(
        "submit",
        handleAccountSubmit
    );

}

function openEditAccountModal(accountId) {

    const account =
        getAccountById(
            accountId
        );


    if (!account) {

        showNotification(
            "La cuenta no existe.",
            "error"
        );

        return;

    }


    const modal =
        document.querySelector(
            "#accountModal"
        );


    const nameInput =
        document.querySelector(
            "#accountName"
        );


    const typeInput =
        document.querySelector(
            "#accountType"
        );


    const balanceInput =
        document.querySelector(
            "#accountBalance"
        );


    const descriptionInput =
        document.querySelector(
            "#accountDescription"
        );


    const availableInput =
        document.querySelector(
            "#accountAvailable"
        );


    const modalTitle =
        document.querySelector(
            "#accountModalTitle"
        );


    const submitButton =
        document.querySelector(
            "#accountSubmitButton"
        );


    const error =
        document.querySelector(
            "#accountFormError"
        );


    if (!modal) {

        return;

    }


    editingAccountId =
        account.id;


    if (nameInput) {

        nameInput.value =
            account.name;

    }


    if (typeInput) {

        typeInput.value =
            account.type;

    }


    if (balanceInput) {

        balanceInput.value =
            account.balance;

        /*
        El saldo no se modifica
        desde la edición.
        */

        balanceInput.disabled =
            true;

    }


    if (descriptionInput) {

        descriptionInput.value =
            account.description || "";

    }


    if (availableInput) {

        availableInput.checked =
            Boolean(
                account.available
            );

    }


    if (modalTitle) {

        modalTitle.textContent =
            "Editar cuenta";

    }


    if (submitButton) {

        submitButton.textContent =
            "Guardar cambios";

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


    if (nameInput) {

        nameInput.focus();

    }

}

function closeAccountModal() {

    const modal =
        document.querySelector(
            "#accountModal"
        );


    if (!modal) {

        return;

    }


    /*
    ==========================================
    DEVOLVER EL FOCO ANTES DE OCULTAR EL MODAL
    ==========================================
    */

    const activeElement =
        document.activeElement;


    if (
        activeElement &&
        modal.contains(activeElement)
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
            "#accountForm"
        );


    if (form) {

        form.reset();

    }


    editingAccountId =
        null;


    const balanceInput =
        document.querySelector(
            "#accountBalance"
        );


    const modalTitle =
        document.querySelector(
            "#accountModalTitle"
        );


    const submitButton =
        document.querySelector(
            "#accountSubmitButton"
        );


    const error =
        document.querySelector(
            "#accountFormError"
        );


    if (balanceInput) {

        balanceInput.disabled =
            false;

    }


    if (modalTitle) {

        modalTitle.textContent =
            "Nueva cuenta";

    }


    if (submitButton) {

        submitButton.textContent =
            "Crear cuenta";

    }


    if (error) {

        error.textContent = "";

    }

}

function handleAccountSubmit(event) {

    event.preventDefault();


    const error =
        document.querySelector(
            "#accountFormError"
        );

    if (error) {

        error.textContent = "";

    }

    try {

    /*
    ==========================================
    EDITAR CUENTA
    ==========================================
    */

    if (
        editingAccountId !== null
    ) {

        updateAccount(
            editingAccountId,
            {

                name:
                    document.querySelector(
                        "#accountName"
                    ).value,

                type:
                    document.querySelector(
                        "#accountType"
                    ).value,

                description:
                    document.querySelector(
                        "#accountDescription"
                    ).value,

                available:
                    document.querySelector(
                        "#accountAvailable"
                    ).checked,

                icon:
                    getAccountIcon(
                        document.querySelector(
                            "#accountType"
                        ).value
                    )

            }
        );

        closeAccountModal();


        refreshFinanceFlowUI();


        showNotification(
            "Cuenta actualizada correctamente.",
            "success"
        );


        return;

    }


    /*
    ==========================================
    CREAR CUENTA
    ==========================================
    */

    createAccount({

        name:
            document.querySelector(
                "#accountName"
            ).value,

        type:
            document.querySelector(
                "#accountType"
            ).value,

        balance:
            document.querySelector(
                "#accountBalance"
            ).value,

        description:
            document.querySelector(
                "#accountDescription"
            ).value,

        available:
            document.querySelector(
                "#accountAvailable"
            ).checked,

        icon:
            getAccountIcon(
                document.querySelector(
                    "#accountType"
                ).value
            )

    });

    closeAccountModal();


    refreshFinanceFlowUI();


    showNotification(
        "Cuenta creada correctamente.",
        "success"
    );
    
    } catch (err) {

        error.textContent =
            err.message;

    }

}


function getAccountIcon(type) {

    const icons = {

        bank: "🏦",

        wallet: "📱",

        cash: "💵",

        savings: "🎯"

    };


    return icons[type] || "🏦";

}

function initializeTransferForm() {

    const openButton =
        document.querySelector(
            "#openTransferModal"
        );


    const closeButton =
        document.querySelector(
            "#closeTransferModal"
        );


    const cancelButton =
        document.querySelector(
            "#cancelTransfer"
        );


    const modal =
        document.querySelector(
            "#transferModal"
        );


    const form =
        document.querySelector(
            "#transferForm"
        );


    if (!openButton || !modal || !form) {

        return;

    }

    openButton.addEventListener(
        "click",
        () => {

            renderTransferAccounts();


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


            const amountInput =
                document.querySelector(
                    "#transferAmount"
                );


            if (amountInput) {

                amountInput.focus();

            }

        }
    );

    closeButton.addEventListener(
        "click",
        closeTransferModal
    );


    cancelButton.addEventListener(
        "click",
        closeTransferModal
    );


    form.addEventListener(
        "submit",
        handleTransferSubmit
    );

}


function closeTransferModal() {

    const modal =
        document.querySelector(
            "#transferModal"
        );


    if (!modal) {

        return;

    }


    /*
    ==========================================
    DEVOLVER EL FOCO ANTES DE OCULTAR EL MODAL
    ==========================================
    */

    const activeElement =
        document.activeElement;


    if (
        activeElement &&
        modal.contains(activeElement)
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

    document.querySelector(
        "#transferForm"
    ).reset();


    document.querySelector(
        "#transferFormError"
    ).textContent = "";

}


function renderTransferAccounts() {

    const from =
        document.querySelector(
            "#transferFrom"
        );


    const to =
        document.querySelector(
            "#transferTo"
        );


    if (!from || !to) {

        return;

    }


    const sourceAccounts =
        getTransferSourceAccounts();


    const destinationAccounts =
        getTransferDestinationAccounts();


    from.innerHTML =
        sourceAccounts.map(
            account => `

                <option value="${account.id}">

                    ${escapeHTML(account.icon)}
                    ${escapeHTML(account.name)}
                    · ${formatMoney(account.balance)}

                </option>

            `
        ).join("");


    to.innerHTML =
        destinationAccounts.map(
            account => `

                <option value="${account.id}">

                    ${escapeHTML(account.icon)}
                    ${escapeHTML(account.name)}
                    · ${formatMoney(account.balance)}

                </option>

            `
        ).join("");


    if (sourceAccounts.length > 0) {

        from.value =
            String(
                sourceAccounts[0].id
            );

    }


    const firstDestination =
        destinationAccounts.find(
            account =>
                String(account.id) !==
                String(from.value)
        );


    if (firstDestination) {

        to.value =
            String(
                firstDestination.id
            );

    }

}


function handleTransferSubmit(event) {

    event.preventDefault();


    const error =
        document.querySelector(
            "#transferFormError"
        );


    error.textContent = "";


    try {

        transferMoney({

            fromAccountId:
                document.querySelector(
                    "#transferFrom"
                ).value,

            toAccountId:
                document.querySelector(
                    "#transferTo"
                ).value,

            amount:
                document.querySelector(
                    "#transferAmount"
                ).value,

            date:
                document.querySelector(
                    "#transferDate"
                ).value,

            description:
                document.querySelector(
                    "#transferDescription"
                ).value

        });


        closeTransferModal();


        refreshFinanceFlowUI();


        showNotification(
            "Transferencia realizada correctamente.",
            "success"
        );


    } catch (err) {

        error.textContent =
            err.message;

    }

}

function renderCreditPage() {

    if (
        typeof getPrimaryCreditCard !==
        "function"
    ) {

        return;

    }


    const card =
        getPrimaryCreditCard();


    const usedElement =
        document.querySelector(
            "#creditUsed"
        );


    const limitElement =
        document.querySelector(
            "#creditLimit"
        );


    const availableElement =
        document.querySelector(
            "#creditAvailable"
        );


    const percentageElement =
        document.querySelector(
            "#creditPercentage"
        );


    const cardsContainer =
        document.querySelector(
            "#creditCardsList"
        );


    if (!card) {

        if (usedElement) {

            usedElement.textContent =
                "S/ 0.00";

        }


        if (limitElement) {

            limitElement.textContent =
                "S/ 0.00";

        }


        if (availableElement) {

            availableElement.textContent =
                "S/ 0.00";

        }


        if (percentageElement) {

            percentageElement.textContent =
                "0%";

        }


        if (cardsContainer) {

            cardsContainer.innerHTML = `

                <div class="empty-state">

                    <span class="empty-icon">
                        💳
                    </span>

                    <h4>
                        No tienes tarjetas activas
                    </h4>

                    <p>
                        Cuando agregues una tarjeta aparecerá aquí.
                    </p>

                </div>

            `;

        }


        return;

    }


    const used =
        getCreditUsed();


    const limit =
        getCreditLimit();


    const available =
        getCreditAvailable();


    const percentage =
        getCreditPercentage();


    if (usedElement) {

        usedElement.textContent =
            formatMoney(used);

    }


    if (limitElement) {

        limitElement.textContent =
            formatMoney(limit);

    }


    if (availableElement) {

        availableElement.textContent =
            formatMoney(available);

    }


    if (percentageElement) {

        percentageElement.textContent =
            `${Math.round(percentage)}%`;

    }


    if (cardsContainer) {

        cardsContainer.innerHTML = `

            <article class="card credit-card-detail">

                <div class="card-header">

                    <div>

                        <span class="card-title">

                            ${escapeHTML(
                                card.name
                            )}

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

                            <span>
                                Utilizado
                            </span>

                            <strong>
                                ${formatMoney(used)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Límite
                            </span>

                            <strong>
                                ${formatMoney(limit)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Disponible
                            </span>

                            <strong>
                                ${formatMoney(available)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Uso
                            </span>

                            <strong>
                                ${Math.round(percentage)}%
                            </strong>

                        </div>

                    </div>


                    <div class="credit-progress">

                        <div
                            class="credit-progress-bar"
                            style="width:${Math.min(
                                Math.max(percentage, 0),
                                100
                            )}%">
                        </div>

                    </div>


                    <div class="credit-dates">

                        <div>

                            <span>
                                Cierre
                            </span>

                            <strong>
                                Día ${card.closingDay}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Pago
                            </span>

                            <strong>
                                Día ${card.paymentDay}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Meta mensual
                            </span>

                            <strong>
                                ${formatMoney(
                                    card.monthlyGoal
                                )}
                            </strong>

                        </div>

                    </div>

                </div>

            </article>

        `;

    }

}

/* ==========================================
   ELIMINAR DATOS FINANCIEROS
========================================== */

function clearFinancialData() {

    const confirmed =
        window.confirm(
            "¿Estás seguro de que deseas eliminar todos tus datos financieros? Esta acción no se puede deshacer."
        );


    if (!confirmed) {

        return;

    }


    localStorage.removeItem(
        FINANCEFLOW_STORAGE_KEY
    );


    showNotification(
        "Los datos financieros fueron eliminados.",
        "success"
    );


    setTimeout(
        () => {

            window.location.reload();

        },
        700
    );

}

function renderSettingsPage() {

    const nameInput =
        document.querySelector(
            "#settingsName"
        );

    if (
        nameInput &&
        typeof userData !== "undefined"
    ) {

        nameInput.value =
            userData.profile?.name ||
            "";

    }

}


/* ==========================================
   INICIALIZACIÓN DE FINANCEFLOW
========================================== */
document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "🚀 FinanceFlow iniciado"
        );

        initializeMovementForm();
        initializeAccountForm();
        initializeTransferForm();
        initializeNotifications();

        initializeSidebarToggle();

        initializeGoalButtons();
        initializeGoalForm();
        initializeGoalSavingForm();
        initializeGoalSavingButtons();

        initializeMovementFilters();

        initializeNavigation();
        const clearFinancialDataButton =
            document.querySelector(
                "#clearFinancialData"
            );


        if (clearFinancialDataButton) {

            clearFinancialDataButton.addEventListener(
                "click",
                clearFinancialData
            );

        }

        initializeQuickActions();
        initializeEventModal();

        initializeAccountFilters();
        initializeAccountActions();

        initializeLoanActions();
        initializeLoanFilters();
        initializeLoanModal();

        showView(
            "dashboard"
        );

        renderMovementAccounts();
        renderTransferAccounts();

        renderDashboard();
        renderGoalsPage();
        renderLoansPage();
        checkFinancialNotifications();

    }
);