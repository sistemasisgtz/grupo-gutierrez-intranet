// =========================================================
// GRUPO GUTIERREZ
// SISTEMA CENTRAL · VENTAS V2
// Elimina acceso independiente de Cotizaciones
// y dirige Ventas al nuevo módulo ventas.html
// =========================================================

(() => {

    "use strict";


    // =====================================================
    // STATE
    // =====================================================

    let mobileObserver =
        null;


    let syncScheduled =
        false;


    // =====================================================
    // INIT
    // =====================================================

    document.addEventListener(

        "DOMContentLoaded",

        initialize,

        {
            once:
                true
        }

    );


    function initialize() {


        // Primera limpieza del DOM.

        syncSystemModules();


        // Vigilar únicamente cambios DIRECTOS
        // en la lista móvil.
        //
        // IMPORTANTE:
        // NO usamos subtree:true.
        //
        // De esa forma cambiar el texto "01", "02", etc.
        // jamás vuelve a disparar el observer.

        observeMobileModules();


        // Interceptar acceso a Ventas.

        bindSalesAccess();

    }


    // =====================================================
    // SINCRONIZAR MÓDULOS
    // =====================================================

    function syncSystemModules() {


        removeQuotesModule();


        renumberModules();

    }


    // =====================================================
    // ELIMINAR COTIZACIONES
    // =====================================================

    function removeQuotesModule() {


        document
            .querySelectorAll(
                '[data-module="cotizaciones"]'
            )
            .forEach(
                node => {

                    node.remove();

                }
            );

    }


    // =====================================================
    // RENUMERAR
    // =====================================================

    function renumberModules() {


        const numbers = {

            "recursos-humanos":
                "01",

            "almacen":
                "02",

            "cobranza":
                "03",

            "ventas":
                "04",

            "solicitudes-pago":
                "05",

            "control-financiero":
                "06"

        };


        Object
            .entries(
                numbers
            )
            .forEach(
                (
                    [
                        moduleId,
                        number
                    ]
                ) => {


                    document
                        .querySelectorAll(

                            `
                                [data-module="${moduleId}"]
                                .module-node-index
                            `

                        )
                        .forEach(
                            node => {


                                // MUY IMPORTANTE:
                                // Solo escribimos si realmente cambió.
                                //
                                // Esto evita mutaciones innecesarias.

                                if (
                                    node.textContent.trim() !==
                                    number
                                ) {

                                    node.textContent =
                                        number;

                                }

                            }
                        );

                }
            );

    }


    // =====================================================
    // OBSERVAR LISTA MÓVIL
    // =====================================================

    function observeMobileModules() {


        const host =
            document.getElementById(
                "mobileModules"
            );


        if (
            !host
        ) {

            return;

        }


        if (
            mobileObserver
        ) {

            mobileObserver.disconnect();

        }


        mobileObserver =
            new MutationObserver(

                () => {


                    scheduleSync();

                }

            );


        mobileObserver.observe(

            host,

            {

                // ÚNICAMENTE hijos directos.
                //
                // Si sistema.js o sistema-finanzas.js
                // agrega/quita botones, reaccionamos.
                //
                // Cambiar textos internos NO dispara esto.

                childList:
                    true

            }

        );

    }


    // =====================================================
    // SINCRONIZACIÓN CONTROLADA
    // =====================================================

    function scheduleSync() {


        if (
            syncScheduled
        ) {

            return;

        }


        syncScheduled =
            true;


        requestAnimationFrame(

            () => {


                syncScheduled =
                    false;


                syncSystemModules();

            }

        );

    }


    // =====================================================
    // ACCESO A VENTAS
    // =====================================================

    function bindSalesAccess() {


        document.addEventListener(

            "click",

            event => {


                const button =
                    event.target.closest(
                        '[data-module="ventas"]'
                    );


                if (
                    !button
                ) {

                    return;

                }


                // Evitamos que sistema.js procese
                // la ruta anterior del módulo Ventas.

                event.preventDefault();

                event.stopPropagation();


                openSalesModule();

            },

            true

        );

    }


    // =====================================================
    // ABRIR VENTAS
    // =====================================================

    function openSalesModule() {


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
                "Ventas";

        }


        if (
            transition
        ) {

            transition.classList.add(
                "active"
            );

        }


        window.setTimeout(

            () => {


                window.location.href =
                    "ventas.html";

            },

            320

        );

    }

})();