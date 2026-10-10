/*
==========================================
FinanceFlow
Archivo: dashboard-carousels.js

Carruseles 3D del dashboard: "Mis metas" (vertical)
y "Mis tarjetas" + gráfico de distribución (donut).

Este archivo:
- NO modifica data.js, goals.js ni credit.js.
- Lee siempre userData.goals y userData.creditCards
  en vivo (nunca copia ni cachea los datos).
- Se sincroniza envolviendo la función global
  renderDashboard(), que ya se invoca en toda la app
  cada vez que se crea, edita o elimina una meta o
  una tarjeta.
==========================================
*/

(function () {

    /* ==========================================
       UTILIDADES COMPARTIDAS
    ========================================== */

    function ffcMoney(value) {

        if (typeof formatMoney === "function") {

            return formatMoney(value || 0);

        }

        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN"
        }).format(value || 0);

    }


    function ffcSafeText(value) {

        if (typeof escapeHTML === "function") {

            return escapeHTML(value == null ? "" : value);

        }

        return String(value == null ? "" : value);

    }


    // Hash simple y estable para generar valores decorativos
    // (color, ícono, últimos dígitos) siempre iguales para la
    // misma meta/tarjeta, sin inventar datos reales.
    function ffcHash(value) {

        const str = String(value || "");
        let hash = 0;

        for (let i = 0; i < str.length; i++) {

            hash = (hash * 31 + str.charCodeAt(i)) >>> 0;

        }

        return hash;

    }


    const FFC_GOAL_PALETTE = [
        "#6757e8", "#0b8f78", "#d67a28", "#d34d76", "#3f72c8",
        "#0e9e94", "#b0389a", "#2f8a3c", "#c2410c", "#4338ca"
    ];

    const FFC_GOAL_ICONS = [
        "🎯", "💰", "✈️", "🏠", "🚗", "💻", "📚", "🛡️", "🎓", "💳"
    ];

    const FFC_CARD_PALETTE = [
        { color: "#087f43", gradient: "linear-gradient(135deg,#0d7a40,#079447 55%,#006c38)" },
        { color: "#0754a6", gradient: "linear-gradient(135deg,#082f6b,#0754a6 55%,#06336e)" },
        { color: "#7d20c1", gradient: "linear-gradient(135deg,#741bb7,#8d25d5 50%,#5b1591)" },
        { color: "#00966b", gradient: "linear-gradient(135deg,#008d61,#00a976 55%,#007c58)" },
        { color: "#d51c3b", gradient: "linear-gradient(135deg,#c8102e,#e31b3b 50%,#a90824)" },
        { color: "#b45309", gradient: "linear-gradient(135deg,#92400e,#d97706 55%,#78350f)" },
        { color: "#0e7490", gradient: "linear-gradient(135deg,#155e75,#0891b2 55%,#164e63)" },
        { color: "#7c3aed", gradient: "linear-gradient(135deg,#5b21b6,#7c3aed 55%,#4c1d95)" }
    ];


    /* ============================================================
       MÓDULO 1 — METAS / CARRUSEL VERTICAL 3D
       ============================================================ */
    const FFCGoals = (function () {

        const viewport = document.getElementById("ffcGoalsViewport");
        const track = document.getElementById("ffcGoalsTrack");
        const currentGoalEl = document.getElementById("ffcCurrentGoal");
        const totalGoalsEl = document.getElementById("ffcTotalGoals");
        const prevButton = document.getElementById("ffcPrevGoal");
        const nextButton = document.getElementById("ffcNextGoal");
        const dotsWrap = document.getElementById("ffcGoalDots");
        const controlsWrap = document.getElementById("ffcGoalControlsWrap");
        const scrollHint = document.getElementById("ffcScrollHint");

        if (!viewport || !track || !prevButton || !nextButton || !dotsWrap) {

            return { render: function () {} };

        }

        let activeIndex = 0;
        let pointerStartY = 0;
        let pointerCurrentY = 0;
        let dragging = false;
        let wheelLock = false;
        let bound = false;


        function getGoals() {

            if (typeof userData === "undefined" || !Array.isArray(userData.goals)) {

                return [];

            }

            return userData.goals.filter(function (goal) {

                return goal && goal.active !== false;

            });

        }


        function percent(saved, target) {

            const numTarget = Number(target) || 0;

            if (numTarget <= 0) {

                return 0;

            }

            return Math.min(100, Math.round((Number(saved) / numTarget) * 100));

        }


        function decorate(goal, index) {

            return {
                name: goal.name || "Meta",
                description: goal.description || "",
                saved: Number(goal.saved) || 0,
                target: Number(goal.target) || 0,
                icon: FFC_GOAL_ICONS[index % FFC_GOAL_ICONS.length],
                color: FFC_GOAL_PALETTE[index % FFC_GOAL_PALETTE.length],
                tag: "META"
            };

        }


        function createGoals(goals) {

            totalGoalsEl.textContent = String(goals.length).padStart(2, "0");

            track.innerHTML = goals.map(function (goal, index) {

                const g = decorate(goal, index);
                const pct = percent(g.saved, g.target);
                const remaining = Math.max(g.target - g.saved, 0);

                return (
                    '<article class="ffc-goal-card-wrap">' +
                        '<div class="ffc-goal-card" data-index="' + index + '" data-position="hidden" ' +
                             'style="--accent:' + g.color + ';--progress:' + pct + '%">' +
                            '<div class="ffc-goal-top">' +
                                '<div>' +
                                    '<span class="ffc-goal-tag">' + g.tag + '</span>' +
                                    '<h2 class="ffc-goal-title">' + ffcSafeText(g.name) + '</h2>' +
                                    '<p class="ffc-goal-description">' + ffcSafeText(g.description) + '</p>' +
                                '</div>' +
                                '<div class="ffc-goal-icon" aria-hidden="true">' + g.icon + '</div>' +
                            '</div>' +
                            '<div class="ffc-goal-body">' +
                                '<div class="ffc-progress-heading">' +
                                    '<span>Progreso</span>' +
                                    '<span class="ffc-progress-percent">' + pct + '%</span>' +
                                '</div>' +
                                '<div class="ffc-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" ' +
                                     'aria-valuenow="' + pct + '" aria-label="Progreso de ' + ffcSafeText(g.name) + '">' +
                                    '<div class="ffc-progress-fill"></div>' +
                                '</div>' +
                                '<div class="ffc-progress-caption"><span>Ahorrado</span><span>Meta</span></div>' +
                            '</div>' +
                            '<div class="ffc-goal-footer">' +
                                '<div>' +
                                    '<span class="ffc-money-label">Ahorrado</span>' +
                                    '<strong class="ffc-money-value">' + ffcMoney(g.saved) + '</strong>' +
                                '</div>' +
                                '<div class="ffc-target">' +
                                    '<span class="ffc-money-label">Meta</span>' +
                                    '<strong class="ffc-money-value">' + ffcMoney(g.target) + '</strong>' +
                                '</div>' +
                            '</div>' +
                            '<span class="ffc-goal-status">Faltan ' + ffcMoney(remaining) + '</span>' +
                            '<span class="ffc-goal-number">' + String(index + 1).padStart(2, "0") + '</span>' +
                        '</div>' +
                    '</article>'
                );

            }).join("");

        }


        function createDots(goals) {

            dotsWrap.innerHTML = goals.map(function (_, index) {

                return '<button class="ffc-goal-dot' + (index === 0 ? " active" : "") + '" type="button" ' +
                       'data-goal="' + index + '" aria-label="Ver meta ' + (index + 1) + '"></button>';

            }).join("");

            dotsWrap.querySelectorAll(".ffc-goal-dot").forEach(function (dot) {

                dot.addEventListener("click", function () {

                    goTo(Number(dot.dataset.goal));

                });

            });

        }


        function updateCarousel() {

            const cards = Array.prototype.slice.call(track.querySelectorAll(".ffc-goal-card"));
            const total = cards.length;

            if (total === 0) {

                return;

            }

            if (total === 1) {

                cards[0].dataset.position = "1";
                cards[0].setAttribute("aria-hidden", "false");

                const wrapper = cards[0].closest(".ffc-goal-card-wrap");

                if (wrapper) {

                    wrapper.style.zIndex = "30";

                }

            } else {

                cards.forEach(function (card, index) {

                    const previousIndex = (activeIndex - 1 + total) % total;
                    const nextIndex = (activeIndex + 1) % total;

                    let position = "hidden";

                    if (index === previousIndex) position = "0";
                    if (index === activeIndex) position = "1";
                    if (index === nextIndex) position = "2";

                    card.dataset.position = position;

                    const wrapper = card.closest(".ffc-goal-card-wrap");

                    if (wrapper) {

                        wrapper.style.zIndex =
                            position === "1" ? "30" :
                            (position === "0" || position === "2") ? "10" :
                            "0";

                    }

                    card.setAttribute("aria-hidden", position !== "1" ? "true" : "false");

                });

            }

            currentGoalEl.textContent = String(activeIndex + 1).padStart(2, "0");

            dotsWrap.querySelectorAll(".ffc-goal-dot").forEach(function (dot, index) {

                dot.classList.toggle("active", index === activeIndex);

            });

        }


        function goTo(index) {

            const goals = getGoals();
            const total = goals.length;

            if (!total) {

                return;

            }

            activeIndex = ((index % total) + total) % total;
            updateCarousel();

        }


        function bindEvents() {

            if (bound) {

                return;

            }

            bound = true;

            prevButton.addEventListener("click", function () { goTo(activeIndex - 1); });
            nextButton.addEventListener("click", function () { goTo(activeIndex + 1); });

            viewport.setAttribute("tabindex", "0");

            viewport.addEventListener("keydown", function (event) {

                if (event.key === "ArrowUp" || event.key === "ArrowLeft") {

                    event.preventDefault();
                    goTo(activeIndex - 1);

                }

                if (event.key === "ArrowDown" || event.key === "ArrowRight") {

                    event.preventDefault();
                    goTo(activeIndex + 1);

                }

            });

            viewport.addEventListener("wheel", function (event) {

                if (Math.abs(event.deltaY) < 10 || wheelLock) {

                    return;

                }

                event.preventDefault();
                wheelLock = true;

                goTo(activeIndex + (event.deltaY > 0 ? 1 : -1));

                window.setTimeout(function () { wheelLock = false; }, 520);

            }, { passive: false });

            viewport.addEventListener("pointerdown", function (event) {

                if (event.target.closest("button")) {

                    return;

                }

                dragging = true;
                pointerStartY = event.clientY;
                pointerCurrentY = event.clientY;

                viewport.setPointerCapture(event.pointerId);

            });

            viewport.addEventListener("pointermove", function (event) {

                if (dragging) {

                    pointerCurrentY = event.clientY;

                }

            });

            viewport.addEventListener("pointerup", function (event) {

                if (!dragging) {

                    return;

                }

                const distance = pointerCurrentY - pointerStartY;
                dragging = false;

                if (Math.abs(distance) >= 55) {

                    goTo(activeIndex + (distance < 0 ? 1 : -1));

                }

                try { viewport.releasePointerCapture(event.pointerId); } catch (_) {}

            });

            viewport.addEventListener("pointercancel", function () { dragging = false; });

        }


        function render() {

            const goals = getGoals();

            if (!goals.length) {

                track.innerHTML =
                    '<div class="ffc-goals-empty">' +
                        '<span class="ffc-goals-empty-icon">🎯</span>' +
                        '<h4>Aún no tienes metas</h4>' +
                        '<p>Crea una meta de ahorro para verla aquí.</p>' +
                    '</div>';

                dotsWrap.innerHTML = "";
                currentGoalEl.textContent = "00";
                totalGoalsEl.textContent = "00";

                if (controlsWrap) controlsWrap.style.display = "none";
                if (scrollHint) scrollHint.style.display = "none";

                return;

            }

            if (controlsWrap) controlsWrap.style.display = "";
            if (scrollHint) scrollHint.style.display = "";

            if (activeIndex >= goals.length) {

                activeIndex = 0;

            }

            createGoals(goals);
            createDots(goals);
            bindEvents();
            updateCarousel();

            requestAnimationFrame(function () {

                track.querySelectorAll(".ffc-progress-fill").forEach(function (fill) {

                    const parent = fill.closest(".ffc-goal-card");
                    const progress = parent ? parent.style.getPropertyValue("--progress") : "0%";

                    fill.style.width = progress;

                });

            });

        }


        return { render: render };

    })();


    /* ============================================================
       MÓDULO 2 — TARJETAS 3D + DONUT
       ============================================================ */
    const FFCCards = (function () {

        const track = document.getElementById("ffcCardsTrack");
        const carousel = document.getElementById("ffcCardsCarousel");
        const prevButton = document.getElementById("ffcPrevCard");
        const nextButton = document.getElementById("ffcNextCard");
        const dotsContainer = document.getElementById("ffcCarouselDots");

        const currentCardEl = document.getElementById("ffcCurrentCard");
        const totalCardsEl = document.getElementById("ffcTotalCards");

        const activeBankEl = document.getElementById("ffcActiveBank");
        const activeBankIconEl = document.getElementById("ffcActiveBankIcon");
        const activeCardNameEl = document.getElementById("ffcActiveCardName");
        const activeAvailableEl = document.getElementById("ffcActiveAvailable");
        const activeLastDigitsEl = document.getElementById("ffcActiveLastDigits");

        const donutSegments = document.getElementById("ffcDonutSegments");
        const donutPercentageEl = document.getElementById("ffcDonutPercentage");
        const donutCenterLabelEl = document.getElementById("ffcDonutCenterLabel");
        const donutAmountEl = document.getElementById("ffcDonutAmount");
        const distributionStatusEl = document.getElementById("ffcDistributionStatus");
        const distributionLegend = document.getElementById("ffcDistributionLegend");

        const donutWrap = carousel ? carousel.querySelector(".ffc-donut-wrap") : null;
        const activeCardInfo = document.querySelector(".ffc-active-card-info");

        if (!track || !carousel || !prevButton || !nextButton || !dotsContainer) {

            return { render: function () {} };

        }

        let activeIndex = 0;
        let isAnimating = false;
        let pointerStartX = 0;
        let pointerCurrentX = 0;
        let isDragging = false;
        let bound = false;


        function getCards() {

            if (typeof userData === "undefined") {

                return [];

            }

            const creditCards = Array.isArray(userData.creditCards)
                ? userData.creditCards.filter(function (card) {
                    return card && card.active !== false;
                })
                : [];

            // Se muestran TODAS: primero tus cuentas (Yape, bancos, efectivo...)
            // y después tus tarjetas de crédito.
            const accounts = Array.isArray(userData.accounts)
                ? userData.accounts.filter(function (account) {
                    return account && account.active !== false;
                })
                : [];

            return accounts.map(function (account) {

                return Object.assign({ __ffcSource: "account" }, account);

            }).concat(creditCards.map(function (card) {

                return Object.assign({ __ffcSource: "credit" }, card);

            }));

        }


        // Genera un degradado de dos tonos a partir de un color plano,
        // para que las cuentas (que ya traen su propio color) luzcan
        // como una tarjeta sin necesidad de inventar una paleta nueva.
        function ffcShade(hex, percent) {

            const clean = String(hex || "#6d5dfc").replace("#", "");
            const full = clean.length === 3
                ? clean.split("").map(function (ch) { return ch + ch; }).join("")
                : clean;

            const num = parseInt(full, 16);

            if (isNaN(num)) {

                return hex || "#6d5dfc";

            }

            let r = (num >> 16) & 0xff;
            let g = (num >> 8) & 0xff;
            let b = num & 0xff;

            r = Math.max(0, Math.min(255, Math.round(r + (percent < 0 ? r : 255 - r) * percent)));
            g = Math.max(0, Math.min(255, Math.round(g + (percent < 0 ? g : 255 - g) * percent)));
            b = Math.max(0, Math.min(255, Math.round(b + (percent < 0 ? b : 255 - b) * percent)));

            return "#" + [r, g, b].map(function (channel) {
                return channel.toString(16).padStart(2, "0");
            }).join("");

        }


        function decorate(card, index) {

            const digits = String(ffcHash(card.id || card.name || index))
                .padStart(4, "0")
                .slice(-4);

            const holderName =
                (typeof userData !== "undefined" && userData.profile && userData.profile.name) ||
                "TITULAR";

            if (card.__ffcSource === "account") {

                const balance = Math.max(Number(card.balance) || 0, 0);
                const baseColor = card.color || FFC_CARD_PALETTE[
                    ffcHash(card.id || card.name || index) % FFC_CARD_PALETTE.length
                ].color;

                return {
                    bank: card.name || "Cuenta",
                    type: card.description || "Cuenta",
                    number: "••••  ••••  ••••  " + digits,
                    holder: String(holderName).toUpperCase(),
                    paymentLabel: "TIPO",
                    paymentValue: card.type === "wallet" ? "Billetera digital" :
                                  card.type === "bank" ? "Cuenta bancaria" :
                                  card.type === "cash" ? "Efectivo" : "Cuenta",
                    available: balance,
                    used: 0,
                    limit: balance,
                    icon: card.icon || (card.name || "C").trim().charAt(0).toUpperCase(),
                    color: baseColor,
                    gradient: "linear-gradient(135deg," + ffcShade(baseColor, -0.35) + "," +
                               baseColor + " 55%," + ffcShade(baseColor, -0.55) + ")"
                };

            }

            const palette = FFC_CARD_PALETTE[
                ffcHash(card.id || card.name || index) % FFC_CARD_PALETTE.length
            ];

            const limit = Number(card.limit) || 0;
            const used = Number(card.used) || 0;
            const available = Math.max(limit - used, 0);

            return {
                bank: card.name || "Tarjeta",
                type: "Tarjeta de crédito",
                number: "••••  ••••  ••••  " + digits,
                holder: String(holderName).toUpperCase(),
                paymentLabel: "PAGO",
                paymentValue: card.paymentDay
                    ? (typeof describeCreditPaymentRange === "function"
                        ? describeCreditPaymentRange(card).replace("Del día ", "Días ").replace(" al ", "→")
                        : "Día " + card.paymentDay)
                    : "—",
                available: available,
                used: used,
                limit: limit,
                icon: (card.name || "T").trim().charAt(0).toUpperCase(),
                color: palette.color,
                gradient: palette.gradient
            };

        }


        // Métrica usada para repartir el donut entre tarjetas:
        // fondos disponibles (límite - utilizado) de cada tarjeta.
        function ffcMetric(card) {

            return card.available;

        }


        function createCards(cards) {

            track.innerHTML = "";

            cards.forEach(function (rawCard, index) {

                const card = decorate(rawCard, index);
                const cardElement = document.createElement("article");

                cardElement.className = "ffc-bank-card";
                cardElement.dataset.index = index;
                cardElement.style.background = card.gradient;

                cardElement.innerHTML =
                    '<div class="ffc-card-content">' +
                        '<div>' +
                            '<div class="ffc-card-top">' +
                                '<div>' +
                                    '<div class="ffc-bank-name">' + ffcSafeText(card.bank) + '</div>' +
                                    '<div class="ffc-card-type">' + ffcSafeText(card.type) + '</div>' +
                                '</div>' +
                                '<div class="ffc-chip"></div>' +
                            '</div>' +
                            '<div class="ffc-contactless"><span></span><span></span><span></span></div>' +
                            '<div class="ffc-card-number">' + card.number + '</div>' +
                        '</div>' +
                        '<div class="ffc-card-bottom">' +
                            '<div class="ffc-card-holder">' +
                                '<span>TITULAR</span>' +
                                '<strong>' + ffcSafeText(card.holder) + '</strong>' +
                            '</div>' +
                            '<div class="ffc-card-expiry">' +
                                '<span>' + ffcSafeText(card.paymentLabel) + '</span>' +
                                '<strong>' + ffcSafeText(card.paymentValue) + '</strong>' +
                            '</div>' +
                            '<div class="ffc-card-logo">' + ffcSafeText(card.bank) + '</div>' +
                        '</div>' +
                    '</div>';

                cardElement.addEventListener("click", function () {

                    if (isDragging) {

                        return;

                    }

                    const clickedIndex = Number(cardElement.dataset.index);

                    if (clickedIndex !== activeIndex) {

                        goToCard(clickedIndex);

                    }

                });

                track.appendChild(cardElement);

            });

        }


        function createDots(cards) {

            dotsContainer.innerHTML = "";

            cards.forEach(function (_, index) {

                const dot = document.createElement("button");

                dot.className = "ffc-carousel-dot";
                dot.type = "button";
                dot.setAttribute("aria-label", "Mostrar tarjeta " + (index + 1));

                dot.addEventListener("click", function () {

                    goToCard(index);

                });

                dotsContainer.appendChild(dot);

            });

        }


        function createLegend(cards) {

            distributionLegend.innerHTML = "";

            cards.forEach(function (rawCard, index) {

                const card = decorate(rawCard, index);
                const item = document.createElement("div");

                item.className = "ffc-legend-item";
                item.dataset.index = index;

                item.innerHTML =
                    '<div class="ffc-legend-left">' +
                        '<span class="ffc-legend-dot" style="background:' + card.color + '"></span>' +
                        '<span class="ffc-legend-name">' + ffcSafeText(card.bank) + '</span>' +
                    '</div>' +
                    '<span class="ffc-legend-value">' + ffcMoney(ffcMetric(card)) + '</span>';

                item.addEventListener("click", function () {

                    goToCard(index);

                });

                distributionLegend.appendChild(item);

            });

        }


        function getRelativePosition(index, total) {

            let difference = index - activeIndex;

            if (difference > total / 2) difference -= total;
            if (difference < -total / 2) difference += total;

            return difference;

        }


        function updateCarousel(cards) {

            const cardEls = track.querySelectorAll(".ffc-bank-card");
            const total = cardEls.length;

            cardEls.forEach(function (card, index) {

                const relative = getRelativePosition(index, total);

                if (relative === 0) {

                    card.classList.add("is-active");
                    card.classList.remove("is-side", "is-far");
                    card.style.transform = "translateX(0px) translateZ(80px) rotateY(0deg) scale(1)";
                    card.style.zIndex = 10;

                } else if (relative === 1) {

                    card.classList.remove("is-active", "is-far");
                    card.classList.add("is-side");
                    card.style.transform = "translateX(245px) translateZ(-100px) rotateY(-27deg) scale(.86)";
                    card.style.zIndex = 7;

                } else if (relative === -1) {

                    card.classList.remove("is-active", "is-far");
                    card.classList.add("is-side");
                    card.style.transform = "translateX(-245px) translateZ(-100px) rotateY(27deg) scale(.86)";
                    card.style.zIndex = 7;

                } else if (relative === 2) {

                    card.classList.remove("is-active", "is-side");
                    card.classList.add("is-far");
                    card.style.transform = "translateX(430px) translateZ(-220px) rotateY(-42deg) scale(.68)";
                    card.style.zIndex = 4;

                } else if (relative === -2) {

                    card.classList.remove("is-active", "is-side");
                    card.classList.add("is-far");
                    card.style.transform = "translateX(-430px) translateZ(-220px) rotateY(42deg) scale(.68)";
                    card.style.zIndex = 4;

                } else {

                    const direction = relative > 0 ? 1 : -1;

                    card.classList.remove("is-active", "is-side");
                    card.classList.add("is-far");
                    card.style.transform =
                        "translateX(" + (direction * 570) + "px) translateZ(-300px) rotateY(" +
                        (direction * -50) + "deg) scale(.52)";
                    card.style.zIndex = 1;

                }

            });

            updateActiveInformation(cards);
            updateDots();
            updateDonut(cards);

        }


        function updateActiveInformation(cards) {

            if (!cards.length) {

                return;

            }

            const card = decorate(cards[activeIndex], activeIndex);

            activeBankEl.textContent = card.bank;
            activeBankIconEl.textContent = card.icon;
            activeBankIconEl.style.background = card.gradient;
            activeCardNameEl.textContent = card.type;
            activeAvailableEl.textContent = ffcMoney(card.available);

            const digits = card.number.replace(/[\s•]/g, "").slice(-4);
            activeLastDigitsEl.textContent = "•••• " + digits;

            currentCardEl.textContent = String(activeIndex + 1).padStart(2, "0");
            totalCardsEl.textContent = String(cards.length).padStart(2, "0");

            distributionStatusEl.textContent = card.bank;

        }


        function updateDonut(cards) {

            if (!cards.length) {

                donutSegments.innerHTML = "";
                donutPercentageEl.textContent = "0%";
                donutCenterLabelEl.textContent = "—";
                donutAmountEl.textContent = ffcMoney(0);

                return;

            }

            const decorated = cards.map(decorate);

            let metricFn = ffcMetric;
            let total = decorated.reduce(function (sum, card) {

                return sum + metricFn(card);

            }, 0);

            // Si ninguna tarjeta tiene fondos disponibles, se reparte
            // el donut según el crédito utilizado para no dejarlo vacío.
            if (total <= 0) {

                metricFn = function (card) { return card.used; };

                total = decorated.reduce(function (sum, card) {

                    return sum + metricFn(card);

                }, 0);

            }

            // Último respaldo: reparte el donut en partes iguales.
            if (total <= 0) {

                metricFn = function () { return 1; };
                total = decorated.length;

            }

            const radius = 78;
            const circumference = 2 * Math.PI * radius;
            let accumulated = 0;

            donutSegments.innerHTML = "";

            decorated.forEach(function (card, index) {

                const percentage = metricFn(card) / total;
                const length = percentage * circumference;

                const segment = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "circle"
                );

                segment.classList.add("ffc-donut-segment");
                segment.classList.add(index === activeIndex ? "is-active" : "is-muted");
                segment.style.color = card.color;
                segment.setAttribute("cx", "110");
                segment.setAttribute("cy", "110");
                segment.setAttribute("r", radius);
                segment.setAttribute("stroke", card.color);
                segment.style.strokeDasharray = length + " " + (circumference - length);
                segment.style.strokeDashoffset = String(-accumulated);

                donutSegments.appendChild(segment);

                accumulated += length;

            });

            const activeCard = decorated[activeIndex];
            const activePercentage = Math.round((metricFn(activeCard) / total) * 100);

            donutPercentageEl.textContent = activePercentage + "%";
            donutCenterLabelEl.textContent = activeCard.bank;
            donutAmountEl.textContent = ffcMoney(metricFn(activeCard));

            distributionLegend.querySelectorAll(".ffc-legend-item").forEach(function (item, index) {

                item.classList.toggle("is-active", index === activeIndex);
                item.classList.toggle("is-muted", index !== activeIndex);

            });

            if (donutWrap) {

                donutWrap.classList.remove("is-changing");
                void donutWrap.offsetWidth;
                donutWrap.classList.add("is-changing");

            }

            if (activeCardInfo) {

                activeCardInfo.classList.remove("is-changing");
                void activeCardInfo.offsetWidth;
                activeCardInfo.classList.add("is-changing");

            }

        }


        function updateDots() {

            dotsContainer.querySelectorAll(".ffc-carousel-dot").forEach(function (dot, index) {

                dot.classList.toggle("active", index === activeIndex);

            });

        }


        function goToCard(index) {

            const cards = getCards();

            if (!cards.length || isAnimating) {

                return;

            }

            activeIndex = ((index % cards.length) + cards.length) % cards.length;
            isAnimating = true;

            updateCarousel(cards);

            window.setTimeout(function () { isAnimating = false; }, 700);

        }


        function nextCard() { goToCard(activeIndex + 1); }
        function previousCard() { goToCard(activeIndex - 1); }


        function isTypingInField(target) {

            if (!target) return false;

            const tag = target.tagName ? target.tagName.toLowerCase() : "";

            return tag === "input" || tag === "textarea" || tag === "select" ||
                   target.isContentEditable === true;

        }


        function bindEvents() {

            if (bound) {

                return;

            }

            bound = true;

            nextButton.addEventListener("click", nextCard);
            prevButton.addEventListener("click", previousCard);

            document.addEventListener("keydown", function (event) {

                const dashboardView = document.getElementById("dashboardView");
                const dashboardActive = dashboardView && dashboardView.classList.contains("active");

                if (!dashboardActive || isTypingInField(event.target)) {

                    return;

                }

                if (event.key === "ArrowRight") nextCard();
                if (event.key === "ArrowLeft") previousCard();

            });

            carousel.addEventListener("pointerdown", function (event) {

                if (event.target.closest(".ffc-carousel-button")) {

                    return;

                }

                isDragging = true;
                pointerStartX = event.clientX;
                pointerCurrentX = event.clientX;

                carousel.setPointerCapture(event.pointerId);

            });

            carousel.addEventListener("pointermove", function (event) {

                if (!isDragging) {

                    return;

                }

                pointerCurrentX = event.clientX;

            });

            carousel.addEventListener("pointerup", function (event) {

                if (!isDragging) {

                    return;

                }

                const distance = pointerCurrentX - pointerStartX;
                isDragging = false;

                const swipeThreshold = 60;

                if (distance < -swipeThreshold) {

                    nextCard();

                } else if (distance > swipeThreshold) {

                    previousCard();

                }

                try { carousel.releasePointerCapture(event.pointerId); } catch (_) {}

            });

            carousel.addEventListener("pointercancel", function () { isDragging = false; });

        }


        function render() {

            const cards = getCards();

            if (!cards.length) {

                track.innerHTML =
                    '<div class="ffc-cards-empty">' +
                        '<span class="ffc-cards-empty-icon">💳</span>' +
                        '<h4>Sin tarjetas activas</h4>' +
                        '<p>Cuando agregues una tarjeta aparecerá aquí.</p>' +
                    '</div>';

                dotsContainer.innerHTML = "";
                distributionLegend.innerHTML = "";
                donutSegments.innerHTML = "";

                currentCardEl.textContent = "00";
                totalCardsEl.textContent = "00";
                donutPercentageEl.textContent = "0%";
                donutCenterLabelEl.textContent = "—";
                donutAmountEl.textContent = ffcMoney(0);
                distributionStatusEl.textContent = "—";

                activeBankEl.textContent = "—";
                activeBankIconEl.textContent = "—";
                activeBankIconEl.style.background = "#cbd5e1";
                activeCardNameEl.textContent = "Sin tarjetas activas";
                activeAvailableEl.textContent = ffcMoney(0);
                activeLastDigitsEl.textContent = "•••• ----";

                return;

            }

            if (activeIndex >= cards.length) {

                activeIndex = 0;

            }

            createCards(cards);
            createDots(cards);
            createLegend(cards);
            bindEvents();
            updateCarousel(cards);

        }


        return { render: render };

    })();


    /* ============================================================
       SINCRONIZACIÓN CON EL RESTO DE LA APP
       ============================================================ */

    function ffcRenderAll() {

        FFCGoals.render();
        FFCCards.render();

    }


    function ffcInit() {

        ffcRenderAll();

        if (typeof window.renderDashboard === "function" && !window.renderDashboard.__ffcWrapped) {

            const originalRenderDashboard = window.renderDashboard;

            const wrapped = function () {

                const result = originalRenderDashboard.apply(this, arguments);

                ffcRenderAll();

                return result;

            };

            wrapped.__ffcWrapped = true;
            window.renderDashboard = wrapped;

        }

    }


    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", ffcInit);

    } else {

        ffcInit();

    }

})();
