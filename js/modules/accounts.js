/*
==========================================
FinanceFlow
Archivo: accounts.js
Versión: 0.2.0

Gestiona las cuentas del usuario.

Responsabilidades:
- Obtener cuentas
- Buscar cuentas
- Calcular saldos
- Crear cuentas
- Editar cuentas
- Desactivar cuentas
==========================================
*/


/* ==========================================
   CONSULTAS
========================================== */


/**
 * Devuelve todas las cuentas.
 */
function getAccounts() {

    return userData.accounts;

}


/**
 * Busca una cuenta por ID.
 */
function getAccountById(id) {

    if (
        id === null ||
        id === undefined ||
        id === ""
    ) {

        return undefined;

    }


    return userData.accounts.find(
        account =>
            String(account.id) ===
            String(id)
    );

}


/**
 * Devuelve las cuentas activas.
 */
function getActiveAccounts() {

    return userData.accounts.filter(
        account => account.active
    );

}


/**
 * Devuelve las cuentas disponibles
 * para realizar gastos.
 */
function getAvailableAccounts() {

    return userData.accounts.filter(
        account =>
            account.active &&
            account.available
    );

}


/* ==========================================
   SALDOS
========================================== */


/**
 * Calcula el dinero disponible.
 */
function getAvailableBalance() {

    return getAvailableAccounts().reduce(
        (total, account) => {

            return total + Number(account.balance);

        },
        0
    );

}


/**
 * Calcula el patrimonio total.
 */
function getTotalBalance() {

    return getActiveAccounts().reduce(
        (total, account) => {

            return total + Number(account.balance);

        },
        0
    );

}


/**
 * Devuelve el saldo de una cuenta.
 */
function getAccountBalance(id) {

    const account =
        getAccountById(id);


    return account
        ? Number(account.balance)
        : 0;

}


/* ==========================================
   CREAR CUENTA
========================================== */


/**
 * Crea una nueva cuenta.
 */
function createAccount(data) {

    const name =
        data.name.trim();


    if (!name) {

        throw new Error(
            "El nombre de la cuenta es obligatorio."
        );

    }


    const initialBalance =
        Number(data.balance);


    if (
        Number.isNaN(initialBalance) ||
        initialBalance < 0
    ) {

        throw new Error(
            "El saldo inicial no es válido."
        );

    }


    const duplicated =
        userData.accounts.some(
            account =>
                account.active &&
                account.name.toLowerCase() ===
                name.toLowerCase()
        );


    if (duplicated) {

        throw new Error(
            "Ya existe una cuenta con ese nombre."
        );

    }


    const account = {

        id: generateId(),

        name: name,

        type: data.type || "bank",

        description:
            data.description?.trim() || "",

        balance:
            initialBalance,

        icon:
            data.icon || "🏦",

        color:
            data.color || "#2563EB",

        available:
            Boolean(data.available),

        active: true

    };


    userData.accounts.push(account);

    saveFinanceFlowData();
    return account;

}


/* ==========================================
   EDITAR CUENTA
========================================== */


/**
 * Edita los datos básicos de una cuenta.
 *
 * El saldo NO se modifica aquí.
 * Los movimientos y transferencias
 * son responsables de modificarlo.
 */
function updateAccount(id, data) {

    const account =
        getAccountById(id);


    if (!account) {

        throw new Error(
            "La cuenta no existe."
        );

    }


    if (data.name !== undefined) {

        const name =
            data.name.trim();


        if (!name) {

            throw new Error(
                "El nombre de la cuenta es obligatorio."
            );

        }


        const duplicated =
            userData.accounts.some(
                other =>
                    other.id !== account.id &&
                    other.active &&
                    other.name.toLowerCase() ===
                    name.toLowerCase()
            );


        if (duplicated) {

            throw new Error(
                "Ya existe otra cuenta con ese nombre."
            );

        }


        account.name = name;

    }


    if (data.type !== undefined) {

        account.type =
            data.type;

    }


    if (data.description !== undefined) {

        account.description =
            data.description.trim();

    }


    if (data.icon !== undefined) {

        account.icon =
            data.icon;

    }


    if (data.color !== undefined) {

        account.color =
            data.color;

    }


    if (data.available !== undefined) {

        account.available =
            Boolean(data.available);

    }

    saveFinanceFlowData();
    return account;

}


/* ==========================================
   DESACTIVAR CUENTA
========================================== */


/**
 * Desactiva una cuenta.
 *
 * No la elimina físicamente.
 */
function deactivateAccount(id) {

    const account =
        getAccountById(id);


    if (!account) {

        throw new Error(
            "La cuenta no existe."
        );

    }

    if (
        Number(account.balance) !== 0
    ) {

        throw new Error(
            "No puedes desactivar una cuenta que todavía tiene saldo."
        );

    }


    account.active = false;

    account.available = false;

    saveFinanceFlowData();
    return true;

}


/* ==========================================
   REACTIVAR CUENTA
========================================== */
function reactivateAccount(id) {

    const account =
        getAccountById(id);


    if (!account) {

        throw new Error(
            "La cuenta no existe."
        );

    }


    account.active = true;

    saveFinanceFlowData();
    return account;

}

/**
 * Cuentas que pueden ser origen
 * de una transferencia.
 */
function getTransferSourceAccounts() {
    return userData.accounts.filter(
        account => account.active && Number(account.balance) > 0
    );
}


/**
 * Cuentas que pueden ser destino
 * de una transferencia.
 */
function getTransferDestinationAccounts() {
    return userData.accounts.filter(
        account => account.active
    );
}