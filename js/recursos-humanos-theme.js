// =========================================================
// GRUPO GUTIERREZ
// RH · TEMA OSCURO / CLARO
// =========================================================

(() => {

    "use strict";


    const STORAGE_KEY =
        "gg_rh_theme";


    const root =
        document.documentElement;


    document.addEventListener(
        "DOMContentLoaded",
        initializeTheme
    );


    // =====================================================
    // START
    // =====================================================

    function initializeTheme() {


        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        applyTheme(

            saved ===
            "light"

                ?

                "light"

                :

                "dark"

        );


        injectThemeButton();

    }


    // =====================================================
    // BOTÓN
    // =====================================================

    function injectThemeButton() {


        const actions =
            document.querySelector(
                ".module-header-actions"
            );


        const backButton =
            document.getElementById(
                "backToSystem"
            );


        if (
            !actions
            ||
            document.getElementById(
                "rhThemeToggle"
            )
        ) {

            return;

        }


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.id =
            "rhThemeToggle";


        button.className =
            `
            module-button
            rh-theme-button
            `;


        button.setAttribute(
            "aria-label",
            "Cambiar tema de Recursos Humanos"
        );


        button.innerHTML = `

            <span
                class="rh-theme-icon"
                aria-hidden="true"
            >
                ☀
            </span>

            <span class="rh-theme-copy">
                Claro
            </span>

        `;


        if (
            backButton
        ) {

            actions.insertBefore(
                button,
                backButton
            );

        }

        else {

            actions.appendChild(
                button
            );

        }


        button.addEventListener(

            "click",

            () => {


                const next =

                    root.dataset
                        .rhTheme ===
                    "light"

                        ?

                        "dark"

                        :

                        "light";


                applyTheme(
                    next
                );


                localStorage.setItem(
                    STORAGE_KEY,
                    next
                );

            }

        );


        refreshButton();

    }


    // =====================================================
    // APLICAR
    // =====================================================

    function applyTheme(
        theme
    ) {


        root.dataset
            .rhTheme =
            theme;


        root.style
            .colorScheme =
            theme;


        const meta =
            document.querySelector(
                'meta[name="theme-color"]'
            );


        if (
            meta
        ) {

            meta.setAttribute(

                "content",

                theme ===
                "light"

                    ?

                    "#eef2f5"

                    :

                    "#080b0f"

            );

        }


        refreshButton();

    }


    // =====================================================
    // BOTÓN
    // =====================================================

    function refreshButton() {


        const button =
            document.getElementById(
                "rhThemeToggle"
            );


        if (
            !button
        ) {

            return;

        }


        const light =
            root.dataset
                .rhTheme ===
            "light";


        button
            .querySelector(
                ".rh-theme-icon"
            )
            .textContent =

            light
                ?
                "☾"
                :
                "☀";


        button
            .querySelector(
                ".rh-theme-copy"
            )
            .textContent =

            light
                ?
                "Oscuro"
                :
                "Claro";


        button.title =

            light
                ?
                "Cambiar a modo oscuro"
                :
                "Cambiar a modo claro";

    }

})();