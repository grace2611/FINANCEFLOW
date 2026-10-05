/*
==========================================
FinanceFlow
Archivo: credit.js

Gestiona tarjetas de crédito.
==========================================
*/


function getCreditCards() {

    return userData.creditCards;

}


function getActiveCreditCards() {

    return userData.creditCards.filter(
        card => card.active
    );

}


function getPrimaryCreditCard() {

    return getActiveCreditCards()[0] || null;

}


function getCreditUsed() {

    const card = getPrimaryCreditCard();

    return card ? card.used : 0;

}


function getCreditLimit() {

    const card = getPrimaryCreditCard();

    return card ? card.limit : 0;

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