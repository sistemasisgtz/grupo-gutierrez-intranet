// =========================================================
// GRUPO GUTIERREZ
// ALMACÉN · MOVIMIENTOS
// =========================================================

(() => {

    "use strict";


    let wh;

    let selectedProductId =
        null;


    ready(
        init
    );


    function ready(
        callback
    ) {

        if (
            window.GGWarehouse
                ?.state
                ?.ready
        ) {

            callback();

        }

        else {

            document.addEventListener(
                "ggwarehouse:ready",
                callback,
                {
                    once:
                        true
                }
            );

        }

    }


    function init() {


        wh =
            window.GGWarehouse;


        bindEvents();

        renderRecentMovements();


        document.addEventListener(
            "ggwarehouse:movements",
            renderRecentMovements
        );


        document.addEventListener(
            "ggwarehouse:refresh",
            renderRecentMovements
        );

    }


    function bindEvents() {


        document
            .getElementById(
                "openIncomeMovement"
            )
            ?.addEventListener(

                "click",

                () =>
                    openMovementModal(
                        "ingreso"
                    )

            );


        document
            .getElementById(
                "openOutcomeMovement"
            )
            ?.addEventListener(

                "click",

                () =>
                    openMovementModal(
                        "egreso"
                    )

            );

    }


    function renderRecentMovements() {


        if (
            !wh
        ) {

            return;

        }


        const host =
            document.getElementById(
                "warehouseRecentMovements"
            );


        const count =
            document.getElementById(
                "warehouseRecentMovementCount"
            );


        if (
            !host
        ) {

            return;

        }


        const items =
            wh.state.recentMovements
            ||
            [];


        if (
            count
        ) {

            count.textContent =

                `${items.length} ${
                    items.length ===
                    1
                        ?
                        "registro"
                        :
                        "registros"
                }`;

        }


        if (
            !items.length
        ) {

            host.innerHTML = `

                <div class="warehouse-empty">
                    Todavía no hay movimientos de almacén.
                </div>

            `;

            return;

        }


        host.innerHTML =
            items
                .map(
                    item => {


                        const product =
                            wh.state.products
                                .find(
                                    p =>
                                        p.id ===
                                        item.product_id
                                );


                        const isIn =
                            item.movement_type ===
                            "ingreso";


                        return `

                            <article class="warehouse-feed-item">

                                <span
                                    class="
                                        warehouse-feed-badge
                                        ${
                                            isIn
                                                ?
                                                "in"
                                                :
                                                "out"
                                        }
                                    "
                                >
                                    ${
                                        isIn
                                            ?
                                            "INGRESO"
                                            :
                                            "EGRESO"
                                    }
                                </span>


                                <div class="warehouse-feed-copy">

                                    <strong>
                                        ${
                                            wh.escapeHtml(

                                                product

                                                    ?

                                                    `${product.folio} · ${product.description_main}`

                                                    :

                                                    "Producto"

                                            )
                                        }
                                    </strong>

                                    <small>

                                        ${
                                            isIn
                                                ?
                                                "+"
                                                :
                                                "−"
                                        }

                                        ${
                                            wh.formatQty(
                                                item.quantity
                                            )
                                        }

                                        ${
                                            wh.escapeHtml(
                                                product?.unit
                                                ||
                                                ""
                                            )
                                        }

                                        · Stock

                                        ${
                                            wh.formatQty(
                                                item.stock_before
                                            )
                                        }

                                        →

                                        ${
                                            wh.formatQty(
                                                item.stock_after
                                            )
                                        }

                                    </small>

                                </div>


                                <div class="warehouse-feed-meta">

                                    ${
                                        wh.escapeHtml(
                                            item.requested_by_email
                                            ||
                                            "Usuario"
                                        )
                                    }

                                    <br>

                                    ${
                                        wh.formatDateTime(
                                            item.created_at
                                        )
                                    }

                                </div>


                            </article>

                        `;

                    }
                )
                .join(
                    ""
                );

    }


    function openMovementModal(
        type
    ) {


        selectedProductId =
            null;


        const isIncome =
            type ===
            "ingreso";


        wh.openModal({

            kicker:

                isIncome

                    ?

                    "ENTRADA DE MATERIAL"

                    :

                    "SALIDA DE MATERIAL",

            title:

                isIncome

                    ?

                    "Nuevo ingreso"

                    :

                    "Nuevo egreso",

            body: `

                <form id="warehouseMovementForm">


                    <div class="warehouse-form-grid">


                        ${
                            isIncome

                            ?

                            `

                                <div class="warehouse-form-field">

                                    <label>
                                        Proveedor
                                    </label>

                                    <input
                                        id="whMoveSupplier"
                                        placeholder="Opcional"
                                    >

                                </div>


                                <div class="warehouse-form-field">

                                    <label>
                                        Factura
                                    </label>

                                    <input
                                        id="whMoveInvoice"
                                        placeholder="Opcional"
                                    >

                                </div>

                            `

                            :

                            `

                                <div class="warehouse-form-field">

                                    <label>
                                        Cliente
                                    </label>

                                    <input
                                        id="whMoveCustomer"
                                        placeholder="Opcional por ahora"
                                    >

                                </div>


                                <div class="warehouse-form-field">

                                    <label>
                                        Remisión
                                    </label>

                                    <input
                                        id="whMoveRemision"
                                        placeholder="Opcional"
                                    >

                                </div>

                            `
                        }


                        <div
                            class="
                                warehouse-form-field
                                full
                                warehouse-product-picker
                            "
                        >

                            <label>
                                Producto *
                            </label>

                            <input
                                id="whMoveProductSearch"
                                autocomplete="off"
                                placeholder="Busca por código, folio o descripción..."
                            >

                            <div
                                id="whMoveProductResults"
                                class="warehouse-product-results"
                            >
                            </div>

                            <div id="whMoveSelectedProduct">
                            </div>

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                ${
                                    isIncome
                                        ?
                                        "Cantidad a ingresar"
                                        :
                                        "Cantidad a sacar"
                                }
                                *
                            </label>

                            <input
                                id="whMoveQuantity"
                                type="number"
                                min="0.001"
                                step="0.001"
                                required
                            >

                        </div>


                        ${
                            isIncome

                            ?

                            `

                                <div class="warehouse-form-field">

                                    <label>
                                        Solicita
                                    </label>

                                    <input
                                        value="${
                                            wh.escapeHtml(
                                                wh.userEmail()
                                            )
                                        }"
                                        disabled
                                    >

                                </div>

                            `

                            :

                            `

                                <div class="warehouse-form-field full">

                                    <label>
                                        Motivo *
                                    </label>

                                    <textarea
                                        id="whMoveReason"
                                        required
                                        placeholder="Motivo de la salida..."
                                    ></textarea>

                                </div>


                                <div class="warehouse-form-field full">

                                    <label>
                                        Solicita
                                    </label>

                                    <input
                                        value="${
                                            wh.escapeHtml(
                                                wh.userEmail()
                                            )
                                        }"
                                        disabled
                                    >

                                </div>

                            `
                        }


                    </div>


                    <div
                        id="whMovementMessage"
                        class="warehouse-form-message"
                    >
                    </div>


                </form>

            `,

            footer: `

                <button
                    type="button"
                    class="module-button"
                    data-wh-close-movement
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    form="warehouseMovementForm"
                    class="
                        module-button
                        ${
                            isIncome

                                ?

                                "module-button-primary"

                                :

                                "module-button-orange"
                        }
                    "
                >
                    ${
                        isIncome
                            ?
                            "Registrar ingreso"
                            :
                            "Registrar egreso"
                    }
                </button>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "[data-wh-close-movement]"
                        )
                        ?.addEventListener(
                            "click",
                            wh.closeModal
                        );


                    root
                        .querySelector(
                            "#whMoveProductSearch"
                        )
                        ?.addEventListener(
                            "input",
                            renderProductResults
                        );


                    root
                        .querySelector(
                            "#whMoveProductResults"
                        )
                        ?.addEventListener(
                            "click",
                            selectProductFromResults
                        );


                    root
                        .querySelector(
                            "#warehouseMovementForm"
                        )
                        ?.addEventListener(

                            "submit",

                            event =>
                                saveMovement(
                                    event,
                                    type
                                )

                        );


                    renderProductResults();

                }

        });

    }


    function renderProductResults() {


        const host =
            document.getElementById(
                "whMoveProductResults"
            );


        const input =
            document.getElementById(
                "whMoveProductSearch"
            );


        if (
            !host
            ||
            !input
        ) {

            return;

        }


        const search =
            wh.normalize(
                input.value
            );


        const products =
            wh.state.products

                .filter(
                    product =>
                        product.active
                )

                .filter(
                    product => {


                        if (
                            !search
                        ) {

                            return true;

                        }


                        const text =
                            wh.normalize(

                                `${product.folio} ${product.code} ${product.description_main}`

                            );


                        return text.includes(
                            search
                        );

                    }
                )

                .slice(
                    0,
                    10
                );


        host.innerHTML =

            products.length

                ?

                products
                    .map(
                        product => `

                            <button
                                type="button"
                                class="warehouse-product-result"
                                data-wh-select-move-product="${product.id}"
                            >

                                <span>

                                    <strong>
                                        ${
                                            wh.escapeHtml(
                                                product.folio
                                            )
                                        }
                                        ·
                                        ${
                                            wh.escapeHtml(
                                                product.description_main
                                            )
                                        }
                                    </strong>

                                    <small>
                                        ${
                                            wh.escapeHtml(
                                                product.code
                                            )
                                        }
                                        ·
                                        ${
                                            wh.escapeHtml(
                                                wh.getBrand(
                                                    product.brand_id
                                                )
                                                ?.name
                                                ||
                                                "Sin marca"
                                            )
                                        }
                                    </small>

                                </span>

                                <small>
                                    ${
                                        wh.formatQty(
                                            product.stock
                                        )
                                    }
                                    ${
                                        wh.escapeHtml(
                                            product.unit
                                            ||
                                            "PZA"
                                        )
                                    }
                                </small>

                            </button>

                        `
                    )
                    .join(
                        ""
                    )

                :

                `

                    <div class="warehouse-empty">
                        No se encontraron productos.
                    </div>

                `;

    }


    function selectProductFromResults(
        event
    ) {


        const button =
            event.target.closest(
                "[data-wh-select-move-product]"
            );


        if (
            !button
        ) {

            return;

        }


        selectedProductId =
            button.dataset
                .whSelectMoveProduct;


        const product =
            wh.state.products
                .find(
                    item =>
                        item.id ===
                        selectedProductId
                );


        if (
            !product
        ) {

            return;

        }


        const input =
            document.getElementById(
                "whMoveProductSearch"
            );


        const results =
            document.getElementById(
                "whMoveProductResults"
            );


        const selected =
            document.getElementById(
                "whMoveSelectedProduct"
            );


        input.value =
            `${product.folio} · ${product.code}`;


        results.innerHTML =
            "";


        selected.innerHTML = `

            <div class="warehouse-selected-product">

                <strong>
                    ${
                        wh.escapeHtml(
                            product.description_main
                        )
                    }
                </strong>

                <small>

                    Stock actual:

                    ${
                        wh.formatQty(
                            product.stock
                        )
                    }

                    ${
                        wh.escapeHtml(
                            product.unit
                            ||
                            "PZA"
                        )
                    }

                    ·

                    ${
                        wh.escapeHtml(
                            product.location
                            ||
                            "Sin ubicación"
                        )
                    }

                </small>

            </div>

        `;

    }


    async function saveMovement(
        event,
        type
    ) {


        event.preventDefault();


        const message =
            document.getElementById(
                "whMovementMessage"
            );


        const submit =
            document.querySelector(
                '[type="submit"][form="warehouseMovementForm"]'
            );


        const quantity =
            Number(
                document
                    .getElementById(
                        "whMoveQuantity"
                    )
                    .value
                ||
                0
            );


        const reason =
            document
                .getElementById(
                    "whMoveReason"
                )
                ?.value
                .trim()
            ||
            null;


        if (
            !selectedProductId
        ) {

            message.textContent =
                "Selecciona un producto de la lista.";

            return;

        }


        if (
            quantity <=
            0
        ) {

            message.textContent =
                "La cantidad debe ser mayor a cero.";

            return;

        }


        if (
            type ===
            "egreso"

            &&

            !reason
        ) {

            message.textContent =
                "El motivo es obligatorio para un egreso.";

            return;

        }


        submit.disabled =
            true;


        submit.textContent =
            "Registrando...";


        message.textContent =
            "";


        try {

            const {
                error
            } =
                await wh.db.rpc(

                    "warehouse_register_movement",

                    {

                        p_movement_type:
                            type,

                        p_product_id:
                            selectedProductId,

                        p_quantity:
                            quantity,

                        p_supplier:
                            document
                                .getElementById(
                                    "whMoveSupplier"
                                )
                                ?.value
                                .trim()
                            ||
                            null,

                        p_invoice:
                            document
                                .getElementById(
                                    "whMoveInvoice"
                                )
                                ?.value
                                .trim()
                            ||
                            null,

                        p_customer:
                            document
                                .getElementById(
                                    "whMoveCustomer"
                                )
                                ?.value
                                .trim()
                            ||
                            null,

                        p_remision:
                            document
                                .getElementById(
                                    "whMoveRemision"
                                )
                                ?.value
                                .trim()
                            ||
                            null,

                        p_reason:
                            reason

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            await Promise.all([

                wh.reloadProducts(),

                wh.reloadRecentMovements()

            ]);


            wh.closeModal();


            wh.toast(

                type ===
                "ingreso"

                    ?

                    "Ingreso registrado y stock actualizado."

                    :

                    "Egreso registrado y stock actualizado."

            );


            document.dispatchEvent(

                new CustomEvent(
                    "ggwarehouse:history-refresh"
                )

            );

        }

        catch (
            error
        ) {

            console.error(
                "[MOVIMIENTO]",
                error
            );


            message.textContent =
                String(
                    error?.message
                    ||
                    error
                );

        }

        finally {

            submit.disabled =
                false;


            submit.textContent =

                type ===
                "ingreso"

                    ?

                    "Registrar ingreso"

                    :

                    "Registrar egreso";

        }

    }

})();