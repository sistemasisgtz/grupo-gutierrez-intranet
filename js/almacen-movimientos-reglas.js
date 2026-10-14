// =========================================================
// GRUPO GUTIERREZ
// ALMACÉN · REGLAS DE INGRESOS
// PROVEEDOR + FACTURA OBLIGATORIOS
// =========================================================

(() => {

    "use strict";


    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    function init() {


        const root =
            document.getElementById(
                "warehouseModalRoot"
            );


        if (
            !root
        ) {

            return;

        }


        const observer =
            new MutationObserver(
                enhanceIncomeForm
            );


        observer.observe(
            root,
            {

                childList:
                    true,

                subtree:
                    true

            }
        );


        enhanceIncomeForm();

    }


    function enhanceIncomeForm() {


        const form =
            document.getElementById(
                "warehouseMovementForm"
            );


        const supplier =
            document.getElementById(
                "whMoveSupplier"
            );


        const invoice =
            document.getElementById(
                "whMoveInvoice"
            );


        // Si estos campos no existen,
        // estamos en el popup de Egreso.

        if (
            !form
            ||
            !supplier
            ||
            !invoice
            ||
            form.dataset
                .incomeRulesReady ===
                "true"
        ) {

            return;

        }


        form.dataset.incomeRulesReady =
            "true";


        configureRequiredField(

            supplier,

            "Proveedor *",

            "Proveedor obligatorio"

        );


        configureRequiredField(

            invoice,

            "Factura *",

            "Factura obligatoria"

        );


        // =================================================
        // VALIDACIÓN EXTRA
        // =================================================

        form.addEventListener(

            "submit",

            event => {


                const supplierValue =
                    supplier.value
                        .trim();


                const invoiceValue =
                    invoice.value
                        .trim();


                const message =
                    document.getElementById(
                        "whMovementMessage"
                    );


                if (
                    !supplierValue
                ) {

                    event.preventDefault();

                    event.stopImmediatePropagation();


                    if (
                        message
                    ) {

                        message.textContent =
                            "El proveedor es obligatorio para registrar un ingreso.";

                    }


                    supplier.focus();


                    return;

                }


                if (
                    !invoiceValue
                ) {

                    event.preventDefault();

                    event.stopImmediatePropagation();


                    if (
                        message
                    ) {

                        message.textContent =
                            "La factura es obligatoria para registrar un ingreso.";

                    }


                    invoice.focus();

                }

            },

            true

        );


        supplier.addEventListener(
            "input",
            clearMovementMessage
        );


        invoice.addEventListener(
            "input",
            clearMovementMessage
        );

    }


    function configureRequiredField(
        input,
        labelText,
        placeholder
    ) {


        input.required =
            true;


        input.setAttribute(
            "aria-required",
            "true"
        );


        input.placeholder =
            placeholder;


        const field =
            input.closest(
                ".warehouse-form-field"
            );


        const label =
            field?.querySelector(
                "label"
            );


        if (
            label
        ) {

            label.textContent =
                labelText;

        }

    }


    function clearMovementMessage() {


        const message =
            document.getElementById(
                "whMovementMessage"
            );


        if (
            message
        ) {

            message.textContent =
                "";

        }

    }

})();