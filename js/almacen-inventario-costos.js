// =========================================================
// GRUPO GUTIERREZ
// ALMACÉN · INVENTARIO + COSTOS
// =========================================================

(() => {

    "use strict";


    let wh;


    const inventoryDraft =
        new Map();


    const costDraft =
        new Map();


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

        refreshFilters();

        renderInventory();

        renderCosts();

        loadInventoryRequests();


        document.addEventListener(

            "ggwarehouse:products",

            () => {

                refreshFilters();

                renderInventory();

                renderCosts();

            }

        );


        document.addEventListener(
            "ggwarehouse:catalogs",
            refreshFilters
        );


        document.addEventListener(

            "ggwarehouse:refresh",

            () => {

                refreshFilters();

                renderInventory();

                renderCosts();

                loadInventoryRequests();

            }

        );

    }


    function bindEvents() {


        [

            "warehouseInventorySearch",

            "warehouseInventoryCategoryFilter",

            "warehouseInventoryDifferenceFilter"

        ]
        .forEach(
            id => {


                document
                    .getElementById(
                        id
                    )
                    ?.addEventListener(
                        "input",
                        renderInventory
                    );


                document
                    .getElementById(
                        id
                    )
                    ?.addEventListener(
                        "change",
                        renderInventory
                    );

            }
        );


        [

            "warehouseCostSearch",

            "warehouseCostBrandFilter",

            "warehouseCostChangedFilter"

        ]
        .forEach(
            id => {


                document
                    .getElementById(
                        id
                    )
                    ?.addEventListener(
                        "input",
                        renderCosts
                    );


                document
                    .getElementById(
                        id
                    )
                    ?.addEventListener(
                        "change",
                        renderCosts
                    );

            }
        );


        document
            .getElementById(
                "warehouseInventoryBody"
            )
            ?.addEventListener(
                "input",
                handleInventoryInput
            );


        document
            .getElementById(
                "warehouseCostsBody"
            )
            ?.addEventListener(
                "input",
                handleCostInput
            );


        document
            .getElementById(
                "warehouseRequestInventoryApproval"
            )
            ?.addEventListener(
                "click",
                openInventoryRequestModal
            );


        document
            .getElementById(
                "warehouseApplyCosts"
            )
            ?.addEventListener(
                "click",
                applyCostChanges
            );

    }


    function refreshFilters() {


        fillSelect(

            "warehouseInventoryCategoryFilter",

            wh.state.categories,

            "Todas las categorías"

        );


        fillSelect(

            "warehouseCostBrandFilter",

            wh.state.brands,

            "Todas las marcas"

        );

    }


    function fillSelect(
        id,
        items,
        label
    ) {


        const select =
            document.getElementById(
                id
            );


        if (
            !select
        ) {

            return;

        }


        const current =
            select.value;


        select.innerHTML = `

            <option value="">
                ${label}
            </option>

            ${
                items
                    .map(
                        item => `

                            <option value="${item.id}">
                                ${
                                    wh.escapeHtml(
                                        item.name
                                    )
                                }
                            </option>

                        `
                    )
                    .join(
                        ""
                    )
            }

        `;


        select.value =
            current;

    }


    // =====================================================
    // INVENTARIO
    // =====================================================

    function getInventoryProducts() {


        const search =
            wh.normalize(
                document
                    .getElementById(
                        "warehouseInventorySearch"
                    )
                    ?.value
            );


        const category =
            document
                .getElementById(
                    "warehouseInventoryCategoryFilter"
                )
                ?.value
            ||
            "";


        const difference =
            document
                .getElementById(
                    "warehouseInventoryDifferenceFilter"
                )
                ?.value
            ||
            "";


        return wh
            .state
            .products

            .filter(
                product =>
                    product.active
            )

            .map(
                wh.decorateProduct
            )

            .filter(
                product => {


                    const text =
                        wh.normalize(

                            `${product.folio} ${product.code} ${product.description_main} ${product.brand?.name} ${product.location}`

                        );


                    if (
                        search
                        &&
                        !text.includes(
                            search
                        )
                    ) {

                        return false;

                    }


                    if (
                        category
                        &&
                        product.category_id !==
                        category
                    ) {

                        return false;

                    }


                    if (
                        difference ===
                        "changed"

                        &&

                        !inventoryDraft.has(
                            product.id
                        )
                    ) {

                        return false;

                    }


                    if (
                        difference ===
                        "low"
                    ) {


                        const min =
                            Number(
                                product.minimum_stock
                                ||
                                0
                            );


                        if (
                            min <=
                            0

                            ||

                            Number(
                                product.stock
                                ||
                                0
                            )
                            >
                            min
                        ) {

                            return false;

                        }

                    }


                    return true;

                }
            );

    }


    function renderInventory() {


        if (
            !wh
        ) {

            return;

        }


        const body =
            document.getElementById(
                "warehouseInventoryBody"
            );


        if (
            !body
        ) {

            return;

        }


        const products =
            getInventoryProducts();


        if (
            !products.length
        ) {

            body.innerHTML = `

                <tr>

                    <td colspan="9">

                        <div class="warehouse-empty">
                            No hay productos para mostrar.
                        </div>

                    </td>

                </tr>

            `;


            updateInventoryButton();

            return;

        }


        body.innerHTML =
            products
                .map(
                    product => {


                        const current =
                            Number(
                                product.stock
                                ||
                                0
                            );


                        const draft =

                            inventoryDraft.has(
                                product.id
                            )

                                ?

                                inventoryDraft.get(
                                    product.id
                                )

                                :

                                current;


                        const delta =
                            Number(
                                draft
                            )
                            -
                            current;


                        const deltaClass =

                            delta >
                            0

                                ?

                                "positive"

                                :

                                delta <
                                0

                                    ?

                                    "negative"

                                    :

                                    "neutral";


                        const direction =

                            delta >
                            0

                                ?

                                "Entrada"

                                :

                                delta <
                                0

                                    ?

                                    "Salida"

                                    :

                                    "Sin cambio";


                        return `

                            <tr
                                data-inventory-product="${product.id}"
                            >


                                <td>

                                    <strong>
                                        ${
                                            wh.escapeHtml(
                                                product.folio
                                            )
                                        }
                                    </strong>

                                </td>


                                <td>
                                    ${
                                        wh.escapeHtml(
                                            product.code
                                        )
                                    }
                                </td>


                                <td>

                                    <strong>
                                        ${
                                            wh.escapeHtml(
                                                product.description_main
                                            )
                                        }
                                    </strong>

                                    <small>
                                        ${
                                            wh.escapeHtml(
                                                product.category?.name
                                                ||
                                                "Sin categoría"
                                            )
                                        }
                                    </small>

                                </td>


                                <td>
                                    ${
                                        wh.escapeHtml(
                                            product.brand?.name
                                            ||
                                            "—"
                                        )
                                    }
                                </td>


                                <td>
                                    ${
                                        wh.escapeHtml(
                                            product.location
                                            ||
                                            "—"
                                        )
                                    }
                                </td>


                                <td>

                                    <strong>

                                        ${
                                            wh.formatQty(
                                                current
                                            )
                                        }

                                        ${
                                            wh.escapeHtml(
                                                product.unit
                                                ||
                                                "PZA"
                                            )
                                        }

                                    </strong>

                                </td>


                                <td>

                                    <input
                                        class="warehouse-inline-input"
                                        data-inventory-new
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value="${draft}"
                                    >

                                </td>


                                <td data-inventory-direction>

                                    <span
                                        class="
                                            warehouse-delta
                                            ${deltaClass}
                                        "
                                    >
                                        ${direction}
                                    </span>

                                </td>


                                <td data-inventory-delta>

                                    <span
                                        class="
                                            warehouse-delta
                                            ${deltaClass}
                                        "
                                    >

                                        ${
                                            delta >
                                            0
                                                ?
                                                "+"
                                                :
                                                ""
                                        }

                                        ${
                                            wh.formatQty(
                                                delta
                                            )
                                        }

                                    </span>

                                </td>


                            </tr>

                        `;

                    }
                )
                .join(
                    ""
                );


        updateInventoryButton();

    }


    function handleInventoryInput(
        event
    ) {


        const input =
            event.target.closest(
                "[data-inventory-new]"
            );


        if (
            !input
        ) {

            return;

        }


        const row =
            input.closest(
                "[data-inventory-product]"
            );


        const product =
            wh.state.products
                .find(
                    item =>
                        item.id ===
                        row?.dataset
                            .inventoryProduct
                );


        if (
            !product
        ) {

            return;

        }


        const value =
            Number(
                input.value
            );


        const current =
            Number(
                product.stock
                ||
                0
            );


        if (
            !Number.isFinite(
                value
            )

            ||

            value <
            0

            ||

            Math.abs(
                value
                -
                current
            )
            <
            0.000001
        ) {

            inventoryDraft.delete(
                product.id
            );

        }

        else {

            inventoryDraft.set(
                product.id,
                value
            );

        }


        const draft =

            inventoryDraft.has(
                product.id
            )

                ?

                inventoryDraft.get(
                    product.id
                )

                :

                current;


        const delta =
            draft
            -
            current;


        const deltaClass =

            delta >
            0

                ?

                "positive"

                :

                delta <
                0

                    ?

                    "negative"

                    :

                    "neutral";


        const direction =

            delta >
            0

                ?

                "Entrada"

                :

                delta <
                0

                    ?

                    "Salida"

                    :

                    "Sin cambio";


        row
            .querySelector(
                "[data-inventory-direction]"
            )
            .innerHTML = `

                <span
                    class="
                        warehouse-delta
                        ${deltaClass}
                    "
                >
                    ${direction}
                </span>

            `;


        row
            .querySelector(
                "[data-inventory-delta]"
            )
            .innerHTML = `

                <span
                    class="
                        warehouse-delta
                        ${deltaClass}
                    "
                >

                    ${
                        delta >
                        0
                            ?
                            "+"
                            :
                            ""
                    }

                    ${
                        wh.formatQty(
                            delta
                        )
                    }

                </span>

            `;


        updateInventoryButton();

    }


    function updateInventoryButton() {


        const button =
            document.getElementById(
                "warehouseRequestInventoryApproval"
            );


        const count =
            document.getElementById(
                "warehouseInventoryChangesCount"
            );


        if (
            button
        ) {

            button.disabled =
                inventoryDraft.size ===
                0;

        }


        if (
            count
        ) {

            count.textContent =
                inventoryDraft.size;

        }

    }


    function openInventoryRequestModal() {


        if (
            !inventoryDraft.size
        ) {

            return;

        }


        const items =
            [

                ...inventoryDraft.entries()

            ]
            .map(
                (
                    [
                        id,
                        newStock
                    ]
                ) => {

                    const product =
                        wh.state.products
                            .find(
                                item =>
                                    item.id ===
                                    id
                            );


                    return {
                        product,
                        newStock
                    };

                }
            )
            .filter(
                item =>
                    item.product
            );


        wh.openModal({

            kicker:
                "INVENTARIO FÍSICO",

            title:
                "Pedir autorización",

            body: `

                <div class="warehouse-catalog-list">

                    ${
                        items
                            .map(
                                ({
                                    product,
                                    newStock
                                }) => `

                                    <article class="warehouse-catalog-item">

                                        <div>

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
                                                    wh.formatQty(
                                                        product.stock
                                                    )
                                                }

                                                →

                                                ${
                                                    wh.formatQty(
                                                        newStock
                                                    )
                                                }

                                                ${
                                                    wh.escapeHtml(
                                                        product.unit
                                                        ||
                                                        "PZA"
                                                    )
                                                }

                                                · diferencia

                                                ${
                                                    newStock
                                                    -
                                                    Number(
                                                        product.stock
                                                    )
                                                    >
                                                    0
                                                        ?
                                                        "+"
                                                        :
                                                        ""
                                                }

                                                ${
                                                    wh.formatQty(

                                                        newStock
                                                        -
                                                        Number(
                                                            product.stock
                                                        )

                                                    )
                                                }

                                            </small>

                                        </div>

                                    </article>

                                `
                            )
                            .join(
                                ""
                            )
                    }

                </div>


                <div
                    class="warehouse-form-field"
                    style="margin-top:12px"
                >

                    <label>
                        Nota para autorización
                    </label>

                    <textarea
                        id="whInventoryRequestNote"
                        placeholder="Opcional: conteo, motivo, observaciones..."
                    ></textarea>

                </div>


                <div
                    class="warehouse-security-note"
                    style="margin-top:12px"
                >

                    <span>
                        ⌁
                    </span>

                    <div>

                        <strong>
                            No cambiará stock todavía
                        </strong>

                        <p>
                            La solicitud quedará pendiente
                            hasta enlazar el rol autorizador.
                        </p>

                    </div>

                </div>


                <div
                    id="whInventoryRequestMessage"
                    class="warehouse-form-message"
                >
                </div>

            `,

            footer: `

                <button
                    type="button"
                    class="module-button"
                    data-close-inventory-request
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    class="
                        module-button
                        module-button-primary
                    "
                    id="whSendInventoryRequest"
                >
                    Enviar solicitud
                </button>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "[data-close-inventory-request]"
                        )
                        ?.addEventListener(
                            "click",
                            wh.closeModal
                        );


                    root
                        .querySelector(
                            "#whSendInventoryRequest"
                        )
                        ?.addEventListener(
                            "click",
                            sendInventoryRequest
                        );

                }

        });

    }


    async function sendInventoryRequest(
        event
    ) {


        const button =
            event.currentTarget;


        const message =
            document.getElementById(
                "whInventoryRequestMessage"
            );


        const items =
            [

                ...inventoryDraft.entries()

            ]
            .map(
                (
                    [
                        productId,
                        newStock
                    ]
                ) => ({

                    product_id:
                        productId,

                    new_stock:
                        Number(
                            newStock
                        )

                })
            );


        button.disabled =
            true;


        button.textContent =
            "Enviando...";


        try {

            const {
                error
            } =
                await wh.db.rpc(

                    "warehouse_create_inventory_request",

                    {

                        p_items:
                            items,

                        p_note:
                            document
                                .getElementById(
                                    "whInventoryRequestNote"
                                )
                                ?.value
                                .trim()
                            ||
                            null

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            inventoryDraft.clear();


            wh.closeModal();


            renderInventory();


            await loadInventoryRequests();


            wh.toast(
                "Solicitud de inventario enviada. Quedó pendiente de autorización."
            );

        }

        catch (
            error
        ) {

            console.error(
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

            button.disabled =
                false;


            button.textContent =
                "Enviar solicitud";

        }

    }


    async function loadInventoryRequests() {


        if (
            !wh
        ) {

            return;

        }


        const host =
            document.getElementById(
                "warehouseInventoryRequests"
            );


        if (
            !host
        ) {

            return;

        }


        const {
            data,
            error
        } =
            await wh.db

                .from(
                    "warehouse_inventory_requests"
                )

                .select(
                    "*"
                )

                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                )

                .limit(
                    10
                );


        if (
            error
        ) {

            console.error(
                error
            );


            host.innerHTML = `

                <div class="warehouse-empty">
                    No se pudieron cargar las solicitudes.
                </div>

            `;


            return;

        }


        const items =
            data
            ||
            [];


        if (
            !items.length
        ) {

            host.innerHTML = `

                <div class="warehouse-empty">
                    No hay solicitudes de inventario.
                </div>

            `;


            return;

        }


        host.innerHTML =
            items
                .map(
                    item => `

                        <article class="warehouse-request-card">

                            <div>

                                <strong>
                                    ${
                                        wh.escapeHtml(
                                            item.requested_by_email
                                            ||
                                            "Usuario"
                                        )
                                    }
                                </strong>

                                <p>

                                    ${
                                        wh.formatDateTime(
                                            item.created_at
                                        )
                                    }

                                    ${
                                        item.request_note

                                            ?

                                            ` · ${
                                                wh.escapeHtml(
                                                    item.request_note
                                                )
                                            }`

                                            :

                                            ""
                                    }

                                </p>

                            </div>

                            <span
                                class="
                                    warehouse-status-pill
                                    ${item.status}
                                "
                            >
                                ${
                                    statusText(
                                        item.status
                                    )
                                }
                            </span>

                        </article>

                    `
                )
                .join(
                    ""
                );

    }


    // =====================================================
    // COSTOS
    // =====================================================

    function getCostProducts() {


        const search =
            wh.normalize(
                document
                    .getElementById(
                        "warehouseCostSearch"
                    )
                    ?.value
            );


        const brand =
            document
                .getElementById(
                    "warehouseCostBrandFilter"
                )
                ?.value
            ||
            "";


        const mode =
            document
                .getElementById(
                    "warehouseCostChangedFilter"
                )
                ?.value
            ||
            "";


        return wh
            .state
            .products

            .filter(
                product =>
                    product.active
            )

            .map(
                wh.decorateProduct
            )

            .filter(
                product => {


                    const text =
                        wh.normalize(

                            `${product.folio} ${product.code} ${product.description_main} ${product.brand?.name}`

                        );


                    if (
                        search
                        &&
                        !text.includes(
                            search
                        )
                    ) {

                        return false;

                    }


                    if (
                        brand
                        &&
                        product.brand_id !==
                        brand
                    ) {

                        return false;

                    }


                    if (
                        mode ===
                        "changed"

                        &&

                        !costDraft.has(
                            product.id
                        )
                    ) {

                        return false;

                    }


                    if (
                        mode ===
                        "without"

                        &&

                        product.unit_cost !=
                        null
                    ) {

                        return false;

                    }


                    return true;

                }
            );

    }


    function renderCosts() {


        if (
            !wh
        ) {

            return;

        }


        const body =
            document.getElementById(
                "warehouseCostsBody"
            );


        if (
            !body
        ) {

            return;

        }


        const products =
            getCostProducts();


        const inventoryValue =
            wh.state.products

                .filter(
                    product =>
                        product.active
                )

                .reduce(

                    (
                        sum,
                        product
                    ) => {


                        const cost =

                            costDraft.has(
                                product.id
                            )

                                ?

                                costDraft.get(
                                    product.id
                                )

                                :

                                product.unit_cost;


                        return (
                            sum

                            +

                            Number(
                                product.stock
                                ||
                                0
                            )

                            *

                            Number(
                                cost
                                ||
                                0
                            )
                        );

                    },

                    0

                );


        document
            .getElementById(
                "warehouseCostInventoryValue"
            )
            .textContent =
            wh.formatMoney(
                inventoryValue
            );


        if (
            !products.length
        ) {

            body.innerHTML = `

                <tr>

                    <td colspan="7">

                        <div class="warehouse-empty">
                            No hay productos para mostrar.
                        </div>

                    </td>

                </tr>

            `;


            updateCostButton();

            return;

        }


        body.innerHTML =
            products
                .map(
                    product => {


                        const currentCost =

                            product.unit_cost ==
                            null

                                ?

                                null

                                :

                                Number(
                                    product.unit_cost
                                );


                        const value =

                            costDraft.has(
                                product.id
                            )

                                ?

                                costDraft.get(
                                    product.id
                                )

                                :

                                currentCost;


                        const total =

                            Number(
                                product.stock
                                ||
                                0
                            )

                            *

                            Number(
                                value
                                ||
                                0
                            );


                        const changed =
                            costDraft.has(
                                product.id
                            );


                        return `

                            <tr
                                data-cost-product="${product.id}"
                            >


                                <td>

                                    <strong>
                                        ${
                                            wh.escapeHtml(
                                                product.folio
                                            )
                                        }
                                    </strong>

                                </td>


                                <td>
                                    ${
                                        wh.escapeHtml(
                                            product.code
                                        )
                                    }
                                </td>


                                <td>

                                    <strong>
                                        ${
                                            wh.escapeHtml(
                                                product.description_main
                                            )
                                        }
                                    </strong>

                                </td>


                                <td>
                                    ${
                                        wh.escapeHtml(
                                            product.brand?.name
                                            ||
                                            "—"
                                        )
                                    }
                                </td>


                                <td>

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

                                </td>


                                <td>

                                    <input
                                        class="
                                            warehouse-inline-input
                                            warehouse-cost-input
                                            ${
                                                changed
                                                    ?
                                                    "warehouse-cost-changed"
                                                    :
                                                    ""
                                            }
                                        "
                                        data-cost-input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value="${
                                            value
                                            ??
                                            ""
                                        }"
                                        placeholder="0.00"
                                    >

                                </td>


                                <td data-cost-total>

                                    <strong>
                                        ${
                                            wh.formatMoney(
                                                total
                                            )
                                        }
                                    </strong>

                                </td>


                            </tr>

                        `;

                    }
                )
                .join(
                    ""
                );


        updateCostButton();

    }


    function handleCostInput(
        event
    ) {


        const input =
            event.target.closest(
                "[data-cost-input]"
            );


        if (
            !input
        ) {

            return;

        }


        const row =
            input.closest(
                "[data-cost-product]"
            );


        const product =
            wh.state.products
                .find(
                    item =>
                        item.id ===
                        row?.dataset
                            .costProduct
                );


        if (
            !product
        ) {

            return;

        }


        const newCost =

            input.value ===
            ""

                ?

                null

                :

                Number(
                    input.value
                );


        const oldCost =

            product.unit_cost ==
            null

                ?

                null

                :

                Number(
                    product.unit_cost
                );


        const same =

            (
                newCost ==
                null

                &&

                oldCost ==
                null
            )

            ||

            (
                newCost !=
                null

                &&

                oldCost !=
                null

                &&

                Math.abs(
                    newCost
                    -
                    oldCost
                )
                <
                0.000001
            );


        if (
            same

            ||

            (
                newCost !=
                null

                &&

                (
                    !Number.isFinite(
                        newCost
                    )

                    ||

                    newCost <
                    0
                )
            )
        ) {

            costDraft.delete(
                product.id
            );

        }

        else {

            costDraft.set(
                product.id,
                newCost
            );

        }


        input.classList.toggle(
            "warehouse-cost-changed",
            costDraft.has(
                product.id
            )
        );


        const effective =

            costDraft.has(
                product.id
            )

                ?

                costDraft.get(
                    product.id
                )

                :

                oldCost;


        row
            .querySelector(
                "[data-cost-total]"
            )
            .innerHTML = `

                <strong>
                    ${
                        wh.formatMoney(

                            Number(
                                product.stock
                                ||
                                0
                            )

                            *

                            Number(
                                effective
                                ||
                                0
                            )

                        )
                    }
                </strong>

            `;


        updateCostButton();

        updateCostSummaryOnly();

    }


    function updateCostSummaryOnly() {


        const inventoryValue =
            wh.state.products

                .filter(
                    product =>
                        product.active
                )

                .reduce(

                    (
                        sum,
                        product
                    ) => {


                        const cost =

                            costDraft.has(
                                product.id
                            )

                                ?

                                costDraft.get(
                                    product.id
                                )

                                :

                                product.unit_cost;


                        return (
                            sum

                            +

                            Number(
                                product.stock
                                ||
                                0
                            )

                            *

                            Number(
                                cost
                                ||
                                0
                            )
                        );

                    },

                    0

                );


        document
            .getElementById(
                "warehouseCostInventoryValue"
            )
            .textContent =
            wh.formatMoney(
                inventoryValue
            );

    }


    function updateCostButton() {


        const button =
            document.getElementById(
                "warehouseApplyCosts"
            );


        const count =
            document.getElementById(
                "warehouseCostChangesCount"
            );


        if (
            button
        ) {

            button.disabled =
                costDraft.size ===
                0;

        }


        if (
            count
        ) {

            count.textContent =
                costDraft.size;

        }

    }


    async function applyCostChanges() {


        if (
            !costDraft.size
        ) {

            return;

        }


        if (
            !window.confirm(

                `Se aplicarán ${costDraft.size} cambios de costo y quedarán en historial. ¿Continuar?`

            )
        ) {

            return;

        }


        const button =
            document.getElementById(
                "warehouseApplyCosts"
            );


        const items =
            [

                ...costDraft.entries()

            ]
            .map(
                (
                    [
                        productId,
                        unitCost
                    ]
                ) => ({

                    product_id:
                        productId,

                    unit_cost:

                        unitCost ==
                        null

                            ?

                            ""

                            :

                            Number(
                                unitCost
                            )

                })
            );


        button.disabled =
            true;


        button.textContent =
            "Aplicando...";


        try {

            const {
                data,
                error
            } =
                await wh.db.rpc(

                    "warehouse_apply_cost_changes",

                    {
                        p_items:
                            items
                    }

                );


            if (
                error
            ) {

                throw error;

            }


            costDraft.clear();


            await wh.reloadProducts();


            renderCosts();


            document.dispatchEvent(

                new CustomEvent(
                    "ggwarehouse:history-refresh"
                )

            );


            wh.toast(
                `${data || 0} costos actualizados.`
            );

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            wh.toast(
                String(
                    error?.message
                    ||
                    error
                ),
                true
            );

        }

        finally {

            button.textContent =
                `Aplicar cambios · ${costDraft.size}`;


            updateCostButton();

        }

    }


    function statusText(
        status
    ) {


        return ({

            pending:
                "Pendiente",

            approved:
                "Autorizada",

            rejected:
                "Rechazada",

            cancelled:
                "Cancelada"

        })[
            status
        ]
        ||
        status;

    }

})();