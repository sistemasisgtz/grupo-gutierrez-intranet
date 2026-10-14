// =========================================================
// GRUPO GUTIERREZ
// SISTEMA CENTRAL · ACCESOS FINANZAS
// =========================================================

(() => {

    "use strict";


    // =====================================================
    // NUEVOS MÓDULOS
    // =====================================================

    const MODULES = {

        "solicitudes-pago": {

            name:
                "Solicitudes de Pago",

            short:
                "SP",

            description:
                "Solicitudes y seguimiento de pagos",

            route:
                "solicitudes-pago.html",

            index:
                "06"

        },


        "control-financiero": {

            name:
                "Control Financiero",

            short:
                "CF",

            description:
                "Autorizaciones, pagos y análisis",

            route:
                "control-financiero.html",

            index:
                "07",

            adminOnly:
                true

        }

    };


    // =====================================================
    // STATE
    // =====================================================

    let isFinanceAdmin =
        false;


    let toastTimer =
        null;


    let mobileObserver =
        null;


    // =====================================================
    // INIT
    // =====================================================

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );


    async function initialize() {


        if (
            !window.ggSupabase
        ) {

            return;

        }


        // =================================================
        // SESSION
        // =================================================

        const {
            data: {
                session
            }
        } =
            await window.ggSupabase
                .auth
                .getSession();


        if (
            !session
        ) {

            return;

        }


        // =================================================
        // EVENTOS
        // =================================================

        bindNewModuleClicks();


        // =================================================
        // MOBILE
        // =================================================

        watchMobileModules();

        ensureMobileModules();


        // =================================================
        // VALIDAR SI ES ADMIN FINANZAS
        // =================================================

        try {

            const {
                data,
                error
            } =
                await window.ggSupabase
                    .rpc(
                        "finance_is_admin"
                    );


            if (
                error
            ) {

                throw error;

            }


            isFinanceAdmin =
                Boolean(
                    data
                );

        }

        catch (
            error
        ) {

            console.error(

                "[SISTEMA FINANZAS] No se pudo validar acceso de Finanzas:",

                error

            );


            isFinanceAdmin =
                false;

        }


        applyFinanceAccessState();

    }


    // =====================================================
    // CLIC EN NUEVOS MÓDULOS
    // =====================================================

    function bindNewModuleClicks() {


        document.addEventListener(

            "click",

            event => {


                const button =
                    event.target.closest(

                        `
                            [data-module="solicitudes-pago"],
                            [data-module="control-financiero"]
                        `

                    );


                if (
                    !button
                ) {

                    return;

                }


                // Evitamos que sistema.js intente procesar
                // estos módulos porque son extensiones nuevas.

                event.preventDefault();

                event.stopPropagation();


                const moduleId =
                    button.dataset
                        .module;


                const module =
                    MODULES[
                        moduleId
                    ];


                if (
                    !module
                ) {

                    return;

                }


                // =========================================
                // CONTROL FINANCIERO SOLO FINANZAS
                // =========================================

                if (
                    module.adminOnly

                    &&

                    !isFinanceAdmin
                ) {

                    showToast(

                        "Control Financiero: acceso exclusivo para usuarios autorizados de Finanzas."

                    );


                    return;

                }


                openModule(
                    module
                );

            },

            true

        );

    }


    // =====================================================
    // MOBILE
    // =====================================================

    function watchMobileModules() {


        const host =
            document.getElementById(
                "mobileModules"
            );


        if (
            !host
        ) {

            return;

        }


        mobileObserver =
            new MutationObserver(

                () => {

                    ensureMobileModules();

                    applyFinanceAccessState();

                }

            );


        mobileObserver.observe(

            host,

            {
                childList:
                    true
            }

        );

    }


    function ensureMobileModules() {


        const host =
            document.getElementById(
                "mobileModules"
            );


        if (
            !host
        ) {

            return;

        }


        Object
            .entries(
                MODULES
            )
            .forEach(
                (
                    [
                        key,
                        module
                    ]
                ) => {


                    // =====================================
                    // EVITAR DUPLICADOS
                    // =====================================

                    if (
                        host.querySelector(
                            `[data-module="${key}"]`
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


                    button.className =
                        "module-node-mobile finance-module-mobile";


                    button.dataset.module =
                        key;


                    button.innerHTML = `

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
                            ${module.index}
                        </span>

                    `;


                    host.appendChild(
                        button
                    );

                }
            );

    }


    // =====================================================
    // PERMISOS CONTROL FINANCIERO
    // =====================================================

    function applyFinanceAccessState() {


        document
            .querySelectorAll(
                '[data-module="control-financiero"]'
            )
            .forEach(
                button => {


                    const copy =
                        button.querySelector(
                            ".module-node-copy small"
                        );


                    const arrow =
                        button.querySelector(
                            ".module-node-arrow"
                        );


                    button.classList.toggle(

                        "finance-module-locked",

                        !isFinanceAdmin

                    );


                    button.setAttribute(

                        "aria-disabled",

                        String(
                            !isFinanceAdmin
                        )

                    );


                    if (
                        copy
                    ) {

                        copy.textContent =

                            isFinanceAdmin

                                ?

                                "Autorizaciones, pagos y análisis"

                                :

                                "Acceso exclusivo Finanzas";

                    }


                    if (
                        arrow
                    ) {

                        arrow.textContent =

                            isFinanceAdmin

                                ?

                                "↗"

                                :

                                "⌾";

                    }

                }
            );

    }


    // =====================================================
    // ABRIR MÓDULO
    // =====================================================

    async function openModule(
        module
    ) {


        const transition =
            document.getElementById(
                "moduleTransition"
            );


        const title =
            document.getElementById(
                "moduleTransitionTitle"
            );


        if (
            title
        ) {

            title.textContent =
                module.name;

        }


        if (
            transition
        ) {

            transition.classList.add(
                "active"
            );

        }


        await delay(
            360
        );


        window.location.href =
            module.route;

    }


    // =====================================================
    // TOAST
    // =====================================================

    function showToast(
        message
    ) {


        const toast =
            document.getElementById(
                "systemToast"
            );


        if (
            !toast
        ) {

            return;

        }


        toast.textContent =
            message;


        toast.classList.add(
            "show"
        );


        window.clearTimeout(
            toastTimer
        );


        toastTimer =
            window.setTimeout(

                () => {

                    toast.classList.remove(
                        "show"
                    );

                },

                3000

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