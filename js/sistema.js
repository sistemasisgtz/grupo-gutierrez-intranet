// =========================================================
// GRUPO GUTIERREZ
// SISTEMA CENTRAL
// =========================================================

(() => {

    "use strict";


    // =====================================================
    // ROUTES
    //
    // TODAVÍA NO EXISTEN LOS MÓDULOS.
    // LOS VAMOS CONECTANDO UNO POR UNO.
    // =====================================================

    const MODULES = {

        "recursos-humanos": {

            name:
                "Recursos Humanos",

            short:
                "RH",

            description:
                "Personal y organización",

            route:
    "recursos-humanos.html"

        },

        "cotizaciones": {

            name:
                "Cotizaciones",

            short:
                "CT",

            description:
                "Costos y propuestas",

            route:
                null

        },

"almacen": {

    name:
        "Almacén",

    short:
        "AL",

    description:
        "Existencias y movimientos",

    route:
        "almacen.html"

},

        "cobranza": {

            name:
                "Cobranza",

            short:
                "CB",

            description:
                "Cartera y seguimiento",

            route:
                null

        },

        "ventas": {

            name:
                "Ventas",

            short:
                "VT",

            description:
                "Comercial y clientes",

            route:
                null

        }

    };


    // =====================================================
    // DOM
    // =====================================================

    const userEmail =
        document.getElementById(
            "systemUserEmail"
        );


    const logoutButton =
        document.getElementById(
            "systemLogoutButton"
        );


    const toast =
        document.getElementById(
            "systemToast"
        );


    const mobileModules =
        document.getElementById(
            "mobileModules"
        );


    const transition =
        document.getElementById(
            "moduleTransition"
        );


    const transitionTitle =
        document.getElementById(
            "moduleTransitionTitle"
        );


    let toastTimer =
        null;


    // =====================================================
    // INIT
    // =====================================================

    async function initializeSystem() {


        if (
            !window.ggSupabase
        ) {

            window.location.href =
                "index.html";


            return;

        }


        // =================================================
        // SESSION
        // =================================================

        const {
            data: {
                session
            },
            error
        } =
            await window.ggSupabase
                .auth
                .getSession();


        if (
            error
            ||
            !session
        ) {

            window.location.replace(
                "index.html"
            );


            return;

        }


        // =================================================
        // USER
        // =================================================

        userEmail.textContent =
            session.user.email
            ||
            "Usuario";


        // =================================================
        // MOBILE VERSION
        // =================================================

        createMobileModules();


        // =================================================
        // BUTTONS
        // =================================================

        bindModuleButtons();


        // =================================================
        // LOGOUT
        // =================================================

        logoutButton.addEventListener(

            "click",

            logout

        );


        // =================================================
        // SI CIERRAN SESIÓN EN OTRA PESTAÑA
        // =================================================

        window.ggSupabase
            .auth
            .onAuthStateChange(

                (
                    event,
                    sessionNow
                ) => {


                    if (
                        event ===
                        "SIGNED_OUT"

                        ||

                        !sessionNow
                    ) {

                        window.location.replace(
                            "index.html"
                        );

                    }

                }

            );

    }


    // =====================================================
    // MOBILE MODULES
    // =====================================================

    function createMobileModules() {


        mobileModules.innerHTML =

            Object
                .entries(
                    MODULES
                )
                .map(

                    (
                        [
                            key,
                            module
                        ],

                        index

                    ) => `

                        <button
                            type="button"
                            class="module-node-mobile"
                            data-module="${key}"
                        >

                            <span class="module-node-icon">
                                ${module.short}
                            </span>


                            <span class="module-node-copy">

                                <strong>
                                    ${module.name}
                                </strong>

                                <small>
                                    ${module.description}
                                </small>

                            </span>


                            <span class="module-node-arrow">
                                ↗
                            </span>


                            <span class="module-node-index">
                                ${String(
                                    index + 1
                                ).padStart(
                                    2,
                                    "0"
                                )}
                            </span>

                        </button>

                    `

                )
                .join(
                    ""
                );

    }


    // =====================================================
    // MODULE EVENTS
    // =====================================================

    function bindModuleButtons() {


        document.addEventListener(

            "click",

            event => {


                const button =
                    event.target.closest(
                        "[data-module]"
                    );


                if (
                    !button
                ) {

                    return;

                }


                const moduleId =
                    button.dataset
                        .module;


                openModule(
                    moduleId
                );

            }

        );

    }


    // =====================================================
    // OPEN MODULE
    // =====================================================

    async function openModule(
        moduleId
    ) {


        const module =
            MODULES[
                moduleId
            ];


        if (
            !module
        ) {

            return;

        }


        // =================================================
        // TODAVÍA NO EXISTE
        // =================================================

        if (
            !module.route
        ) {


            showToast(

                `${module.name}: listo para construir.`

            );


            await playTransition(

                module.name,

                430

            );


            return;

        }


        // =================================================
        // REAL ROUTE
        // =================================================

        transitionTitle.textContent =
            module.name;


        transition.classList
            .add(
                "active"
            );


        await delay(
            360
        );


        window.location.href =
            module.route;

    }


    // =====================================================
    // TRANSITION PREVIEW
    // =====================================================

    async function playTransition(

        title,

        duration

    ) {


        transitionTitle.textContent =
            title;


        transition.classList
            .add(
                "active"
            );


        await delay(
            duration
        );


        transition.classList
            .remove(
                "active"
            );

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    async function logout() {


        logoutButton.disabled =
            true;


        logoutButton.textContent =
            "...";


        try {


            await window.ggSupabase
                .auth
                .signOut();


        }

        catch (
            error
        ) {

            console.error(
                error
            );

        }


        window.location.replace(
            "index.html"
        );

    }


    // =====================================================
    // TOAST
    // =====================================================

    function showToast(
        message
    ) {


        toast.textContent =
            message;


        toast.classList
            .add(
                "show"
            );


        clearTimeout(
            toastTimer
        );


        toastTimer =
            window.setTimeout(

                () => {

                    toast.classList
                        .remove(
                            "show"
                        );

                },

                2400

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


    // =====================================================
    // START
    // =====================================================

    initializeSystem();

})();