// =========================================================
// GRUPO GUTIERREZ
// HOME
// =========================================================

(() => {

    "use strict";


    // =====================================================
    // DOM
    // =====================================================

    const buttons =
        document.querySelectorAll(
            "[data-entry]"
        );

    const transition =
        document.getElementById(
            "pageTransition"
        );

    const transitionTitle =
        document.getElementById(
            "transitionTitle"
        );

    const toast =
        document.getElementById(
            "homeToast"
        );

    let toastTimer =
        null;


    // =====================================================
    // ENTRADA DE PÁGINA
    // =====================================================

    window.requestAnimationFrame(
        () => {
            window.requestAnimationFrame(
                () => {
                    document.body.classList.add(
                        "page-ready"
                    );
                }
            );
        }
    );


    // =====================================================
    // ROUTES
    // =====================================================

    const ROUTES = {
        sistema: null,
        yo: null
    };


    // =====================================================
    // BUTTONS
    // =====================================================

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const entry =
                        button.dataset.entry;

                    handleEntry(
                        entry
                    );
                }
            );


            // ---------------------------------------------
            // BRILLO LOCAL SIGUIENDO EL MOUSE
            // NO MUEVE EL FONDO DE LA PÁGINA.
            // ---------------------------------------------

            button.addEventListener(
                "pointermove",
                event => {

                    const rect =
                        button.getBoundingClientRect();

                    const x =
                        event.clientX - rect.left;

                    const y =
                        event.clientY - rect.top;

                    button.style.setProperty(
                        "--mouse-x",
                        `${x}px`
                    );

                    button.style.setProperty(
                        "--mouse-y",
                        `${y}px`
                    );
                }
            );

            button.addEventListener(
                "pointerleave",
                () => {
                    button.style.setProperty(
                        "--mouse-x",
                        "50%"
                    );

                    button.style.setProperty(
                        "--mouse-y",
                        "50%"
                    );
                }
            );
        }
    );


    // =====================================================
    // HANDLE ENTRY
    // =====================================================

    async function handleEntry(
        entry
    ) {

        if (!entry) {
            return;
        }

        const normalized =
            String(entry)
                .trim()
                .toLowerCase();

        const route =
            ROUTES[normalized];


        if (!route) {

            const name =
                normalized === "sistema"
                    ? "Sistema"
                    : "Yo";

            showToast(
                `${name}: listo para construir el siguiente módulo.`
            );

            playMiniTransition(
                name
            );

            return;
        }


        await navigateTo(
            route,
            normalized === "sistema"
                ? "Accediendo al sistema"
                : "Preparando tu espacio"
        );
    }


    // =====================================================
    // MINI TRANSITION
    // =====================================================

    async function playMiniTransition(
        label
    ) {

        if (!transition) {
            return;
        }

        transitionTitle.textContent =
            label === "Sistema"
                ? "Sistema"
                : "Espacio personal";

        transition.classList.add(
            "active"
        );

        await delay(
            520
        );

        transition.classList.remove(
            "active"
        );
    }


    // =====================================================
    // REAL NAVIGATION
    // =====================================================

    async function navigateTo(
        url,
        message
    ) {

        if (!transition) {
            window.location.href = url;
            return;
        }

        transitionTitle.textContent =
            message;

        transition.classList.add(
            "active"
        );

        await delay(
            420
        );

        window.location.href =
            url;
    }


    // =====================================================
    // TOAST
    // =====================================================

    function showToast(
        message
    ) {

        if (!toast) {
            return;
        }

        toast.textContent =
            message;

        toast.classList.add(
            "show"
        );

        clearTimeout(
            toastTimer
        );

        toastTimer =
            window.setTimeout(
                () => {
                    toast.classList.remove(
                        "show"
                    );
                },
                2600
            );
    }


    // =====================================================
    // DELAY
    // =====================================================

    function delay(
        milliseconds
    ) {
        return new Promise(
            resolve => {
                window.setTimeout(
                    resolve,
                    milliseconds
                );
            }
        );
    }

})();
