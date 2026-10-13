// =========================================================
// GRUPO GUTIERREZ
// RH · VACACIONES COMPACTAS
// =========================================================

(() => {

    "use strict";


    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );


    function initialize() {


        const host =
            document.getElementById(
                "vacationsApp"
            );


        if (
            !host
        ) {

            return;

        }


        attachToGrid();


        const hostObserver =
            new MutationObserver(
                () => {

                    attachToGrid();

                }
            );


        hostObserver.observe(
            host,
            {
                childList:
                    true,

                subtree:
                    true
            }
        );

    }


    // =====================================================
    // CONECTAR GRID
    // =====================================================

    function attachToGrid() {


        const grid =
            document.getElementById(
                "rvEmployeeGrid"
            );


        if (
            !grid
            ||
            grid.dataset
                .rvCompactBound ===
                "true"
        ) {

            return;

        }


        grid.dataset
            .rvCompactBound =
            "true";


        compactAllCards(
            grid
        );


        // Cada vez que el buscador o los filtros
        // vuelven a pintar las tarjetas,
        // volvemos a compactarlas.

        const observer =
            new MutationObserver(
                () => {

                    compactAllCards(
                        grid
                    );

                }
            );


        observer.observe(
            grid,
            {
                childList:
                    true,

                subtree:
                    false
            }
        );


        // =================================================
        // BOTÓN VER DETALLE
        // =================================================

        grid.addEventListener(

            "click",

            event => {


                const button =
                    event.target.closest(
                        "[data-rv-details-toggle]"
                    );


                if (
                    !button
                ) {

                    return;

                }


                // Evitamos que el botón abra
                // el administrador de vacaciones.

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();


                const card =
                    button.closest(
                        ".rv-employee-card"
                    );


                if (
                    !card
                ) {

                    return;

                }


                const open =
                    !card.classList
                        .contains(
                            "details-open"
                        );


                card.classList.toggle(
                    "details-open",
                    open
                );


                button.setAttribute(
                    "aria-expanded",
                    String(
                        open
                    )
                );


                const label =
                    button.querySelector(
                        ".rv-details-toggle-label"
                    );


                if (
                    label
                ) {

                    label.textContent =
                        open
                            ?
                            "Ocultar detalle"
                            :
                            "Ver detalle";

                }

            },

            true

        );

    }


    // =====================================================
    // TODAS LAS TARJETAS
    // =====================================================

    function compactAllCards(
        grid
    ) {


        grid
            .querySelectorAll(
                `
                .rv-employee-card:
                not([data-rv-compact-ready])
                `
                .replace(
                    /\s+/g,
                    ""
                )
            )
            .forEach(
                compactCard
            );

    }


    // =====================================================
    // TARJETA
    // =====================================================

    function compactCard(
        card
    ) {


        const top =
            card.querySelector(
                ".rv-employee-top"
            );


        const seniority =
            card.querySelector(
                ".rv-seniority"
            );


        const stats =
            card.querySelector(
                ".rv-card-stats"
            );


        const future =
            card.querySelector(
                ".rv-future-row"
            );


        const footer =
            card.querySelector(
                ".rv-card-footer"
            );


        if (
            !top
            ||
            !seniority
        ) {

            card.dataset
                .rvCompactReady =
                "true";

            return;

        }


        // =================================================
        // BOTÓN
        // =================================================

        const toggle =
            document.createElement(
                "button"
            );


        toggle.type =
            "button";


        toggle.className =
            "rv-details-toggle";


        toggle.dataset
            .rvDetailsToggle =
            "true";


        toggle.setAttribute(
            "aria-expanded",
            "false"
        );


        toggle.innerHTML = `

            <span
                class="rv-details-toggle-label"
            >
                Ver detalle
            </span>

            <span
                class="rv-details-toggle-arrow"
                aria-hidden="true"
            >
                ⌄
            </span>

        `;


        // =================================================
        // CONTENEDOR COLAPSABLE
        // =================================================

        const details =
            document.createElement(
                "div"
            );


        details.className =
            "rv-employee-details";


        [

            seniority,

            stats,

            future,

            footer

        ]
        .forEach(
            element => {

                if (
                    element
                ) {

                    details.appendChild(
                        element
                    );

                }

            }
        );


        top.insertAdjacentElement(
            "afterend",
            toggle
        );


        toggle.insertAdjacentElement(
            "afterend",
            details
        );


        card.dataset
            .rvCompactReady =
            "true";

    }

})();