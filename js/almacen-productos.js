// =========================================================
// GRUPO GUTIERREZ
// ALMACÉN · PRODUCTOS / CATEGORÍAS / MARCAS
// =========================================================

(() => {

    "use strict";


    let wh;

    let editingProductId =
        null;

    let editingCategoryId =
        null;

    let editingBrandId =
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

        refreshFilters();

        renderProducts();


        document.addEventListener(
            "ggwarehouse:products",
            renderProducts
        );


        document.addEventListener(

            "ggwarehouse:catalogs",

            () => {

                refreshFilters();

                renderProducts();

            }

        );


        document.addEventListener(

            "ggwarehouse:refresh",

            () => {

                refreshFilters();

                renderProducts();

            }

        );

    }


    function bindEvents() {


        document
            .getElementById(
                "warehouseCategoriesButton"
            )
            ?.addEventListener(
                "click",
                openCategoriesModal
            );


        document
            .getElementById(
                "warehouseBrandsButton"
            )
            ?.addEventListener(
                "click",
                openBrandsModal
            );


        document
            .getElementById(
                "warehouseNewProductButton"
            )
            ?.addEventListener(

                "click",

                () =>
                    openProductModal(
                        null
                    )

            );


        [

            "warehouseProductSearch",

            "warehouseProductCategoryFilter",

            "warehouseProductBrandFilter",

            "warehouseProductLabelFilter",

            "warehouseProductStatusFilter"

        ]
        .forEach(
            id => {


                document
                    .getElementById(
                        id
                    )
                    ?.addEventListener(
                        "input",
                        renderProducts
                    );


                document
                    .getElementById(
                        id
                    )
                    ?.addEventListener(
                        "change",
                        renderProducts
                    );

            }
        );


        document
            .getElementById(
                "warehouseProductsBody"
            )
            ?.addEventListener(

                "click",

                async event => {


                    const edit =
                        event.target.closest(
                            "[data-wh-edit-product]"
                        );


                    const history =
                        event.target.closest(
                            "[data-wh-product-history]"
                        );


                    const archive =
                        event.target.closest(
                            "[data-wh-archive-product]"
                        );


                    if (
                        edit
                    ) {

                        openProductModal(
                            edit.dataset
                                .whEditProduct
                        );

                    }


                    if (
                        history
                    ) {

                        openProductHistory(
                            history.dataset
                                .whProductHistory
                        );

                    }


                    if (
                        archive
                    ) {

                        await archiveProduct(
                            archive.dataset
                                .whArchiveProduct
                        );

                    }

                }

            );

    }


    function refreshFilters() {


        fillSelect(

            "warehouseProductCategoryFilter",

            wh.state.categories,

            "Todas las categorías"

        );


        fillSelect(

            "warehouseProductBrandFilter",

            wh.state.brands,

            "Todas las marcas"

        );


        const labelSelect =
            document.getElementById(
                "warehouseProductLabelFilter"
            );


        if (
            labelSelect
        ) {


            const current =
                labelSelect.value;


            labelSelect.innerHTML = `

                <option value="">
                    Todas las etiquetas
                </option>

                ${
                    wh.LABELS
                        .map(
                            label => `

                                <option
                                    value="${label.value}"
                                >
                                    ${
                                        wh.escapeHtml(
                                            label.name
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


            labelSelect.value =
                current;

        }

    }


    function fillSelect(
        id,
        items,
        firstText
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
                ${
                    firstText
                }
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


    function getFilteredProducts() {


        const search =
            wh.normalize(
                document
                    .getElementById(
                        "warehouseProductSearch"
                    )
                    ?.value
            );


        const category =
            document
                .getElementById(
                    "warehouseProductCategoryFilter"
                )
                ?.value
            ||
            "";


        const brand =
            document
                .getElementById(
                    "warehouseProductBrandFilter"
                )
                ?.value
            ||
            "";


        const label =
            document
                .getElementById(
                    "warehouseProductLabelFilter"
                )
                ?.value
            ||
            "";


        const status =
            document
                .getElementById(
                    "warehouseProductStatusFilter"
                )
                ?.value
            ||
            "active";


        return wh
            .state
            .products

            .map(
                wh.decorateProduct
            )

            .filter(
                product => {


                    const haystack =
                        wh.normalize(

                            [

                                product.folio,

                                product.code,

                                product.description_main,

                                product.description_long,

                                product.location,

                                product.category?.name,

                                product.brand?.name

                            ]
                            .join(
                                " "
                            )

                        );


                    if (
                        search
                        &&
                        !haystack.includes(
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
                        brand
                        &&
                        product.brand_id !==
                        brand
                    ) {

                        return false;

                    }


                    if (
                        label
                        &&
                        product.label_color !==
                        label
                    ) {

                        return false;

                    }


                    if (
                        status ===
                        "active"

                        &&

                        !product.active
                    ) {

                        return false;

                    }


                    if (
                        status ===
                        "inactive"

                        &&

                        product.active
                    ) {

                        return false;

                    }


                    if (
                        status ===
                        "low"
                    ) {


                        const min =
                            Number(
                                product.minimum_stock
                                ||
                                0
                            );


                        if (
                            !product.active

                            ||

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


    function renderProducts() {


        if (
            !wh
        ) {

            return;

        }


        const body =
            document.getElementById(
                "warehouseProductsBody"
            );


        if (
            !body
        ) {

            return;

        }


        const products =
            getFilteredProducts();


        const countNode =
            document.getElementById(
                "warehouseProductCount"
            );


        if (
            countNode
        ) {

            countNode.textContent =

                `${products.length} ${
                    products.length ===
                    1
                        ?
                        "producto"
                        :
                        "productos"
                }`;

        }


        if (
            !products.length
        ) {

            body.innerHTML = `

                <tr>

                    <td colspan="10">

                        <div class="warehouse-empty">
                            No hay productos que coincidan
                            con los filtros.
                        </div>

                    </td>

                </tr>

            `;


            return;

        }


        body.innerHTML =
            products
                .map(
                    product => {


                        const stock =
                            Number(
                                product.stock
                                ||
                                0
                            );


                        const minimum =
                            Number(
                                product.minimum_stock
                                ||
                                0
                            );


                        const stockClass =

                            stock ===
                            0

                                ?

                                "warehouse-stock-zero"

                                :

                                (
                                    minimum >
                                    0

                                    &&

                                    stock <=
                                    minimum

                                        ?

                                        "warehouse-stock-low"

                                        :

                                        ""
                                );


                        return `

                            <tr>


                                <td>

                                    <span
                                        class="warehouse-label-dot"
                                        style="
                                            background:
                                            ${
                                                product.label_color
                                                ||
                                                "#657682"
                                            };

                                            color:
                                            ${
                                                product.label_color
                                                ||
                                                "#657682"
                                            };
                                        "
                                        title="Etiqueta"
                                    >
                                    </span>

                                </td>


                                <td>

                                    <strong>
                                        ${
                                            wh.escapeHtml(
                                                product.folio
                                            )
                                        }
                                    </strong>

                                    ${
                                        product.active

                                        ?

                                        ""

                                        :

                                        `
                                            <small>
                                                ARCHIVADO
                                            </small>
                                        `
                                    }

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

                                    ${
                                        product.description_long

                                        ?

                                        `
                                            <small>
                                                ${
                                                    wh.escapeHtml(
                                                        product.description_long
                                                    )
                                                }
                                            </small>
                                        `

                                        :

                                        ""
                                    }

                                </td>


                                <td>
                                    ${
                                        wh.escapeHtml(
                                            product.category?.name
                                            ||
                                            "—"
                                        )
                                    }
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

                                    <strong class="${stockClass}">

                                        ${
                                            wh.formatQty(
                                                stock
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

                                    ${
                                        minimum >
                                        0

                                        ?

                                        `
                                            <small>
                                                Mín.
                                                ${
                                                    wh.formatQty(
                                                        minimum
                                                    )
                                                }
                                            </small>
                                        `

                                        :

                                        ""
                                    }

                                </td>


                                <td>

                                    ${
                                        product.unit_cost ==
                                        null

                                            ?

                                            "—"

                                            :

                                            wh.formatMoney(
                                                product.unit_cost
                                            )
                                    }

                                </td>


                                <td>


                                    <div class="warehouse-table-actions">


                                        <button
                                            type="button"
                                            class="warehouse-mini-button"
                                            data-wh-product-history="${product.id}"
                                        >
                                            Historial
                                        </button>


                                        <button
                                            type="button"
                                            class="warehouse-mini-button"
                                            data-wh-edit-product="${product.id}"
                                        >
                                            Editar
                                        </button>


                                        ${
                                            product.active

                                            ?

                                            `
                                                <button
                                                    type="button"
                                                    class="
                                                        warehouse-mini-button
                                                        danger
                                                    "
                                                    data-wh-archive-product="${product.id}"
                                                >
                                                    Eliminar
                                                </button>
                                            `

                                            :

                                            ""
                                        }


                                    </div>


                                </td>


                            </tr>

                        `;

                    }
                )
                .join(
                    ""
                );

    }


    async function openProductModal(
        productId
    ) {


        editingProductId =
            productId
            ||
            null;


        const product =
            productId

                ?

                wh.state.products
                    .find(
                        item =>
                            item.id ===
                            productId
                    )

                :

                null;


        wh.openModal({

            kicker:

                product

                    ?

                    "EDITAR PRODUCTO"

                    :

                    "NUEVO PRODUCTO",

            title:

                product

                    ?

                    product.description_main

                    :

                    "Alta de producto",

            wide:
                true,

            body: `

                <form id="warehouseProductForm">


                    <div class="warehouse-form-grid">


                        <div class="warehouse-form-field">

                            <label>
                                Folio *
                            </label>

                            <input
                                id="whProductFolio"
                                required
                                value="${
                                    wh.escapeHtml(
                                        product?.folio
                                        ||
                                        ""
                                    )
                                }"
                            >

                            <small class="warehouse-form-help">
                                Se propone el siguiente ISGTZ-XXXX,
                                pero puedes escribir cualquier folio.
                            </small>

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Código *
                            </label>

                            <input
                                id="whProductCode"
                                required
                                value="${
                                    wh.escapeHtml(
                                        product?.code
                                        ||
                                        ""
                                    )
                                }"
                            >

                        </div>


                        <div class="warehouse-form-field full">

                            <label>
                                Descripción principal *
                            </label>

                            <input
                                id="whProductMain"
                                required
                                value="${
                                    wh.escapeHtml(
                                        product?.description_main
                                        ||
                                        ""
                                    )
                                }"
                            >

                        </div>


                        <div class="warehouse-form-field full">

                            <label>
                                Descripción larga
                            </label>

                            <textarea id="whProductLong">${
                                wh.escapeHtml(
                                    product?.description_long
                                    ||
                                    ""
                                )
                            }</textarea>

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Categoría
                            </label>

                            <select id="whProductCategory">

                                <option value="">
                                    Sin categoría
                                </option>

                                ${
                                    wh.state.categories
                                        .map(
                                            item => `

                                                <option
                                                    value="${item.id}"
                                                    ${
                                                        product?.category_id ===
                                                        item.id

                                                            ?

                                                            "selected"

                                                            :

                                                            ""
                                                    }
                                                >
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

                            </select>

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Marca
                            </label>

                            <select id="whProductBrand">

                                <option value="">
                                    Sin marca
                                </option>

                                ${
                                    wh.state.brands
                                        .map(
                                            item => `

                                                <option
                                                    value="${item.id}"
                                                    ${
                                                        product?.brand_id ===
                                                        item.id

                                                            ?

                                                            "selected"

                                                            :

                                                            ""
                                                    }
                                                >
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

                            </select>

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Ubicación
                            </label>

                            <input
                                id="whProductLocation"
                                value="${
                                    wh.escapeHtml(
                                        product?.location
                                        ||
                                        ""
                                    )
                                }"
                                placeholder="Ej. Rack A · Nivel 2"
                            >

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Unidad
                            </label>

                            <input
                                id="whProductUnit"
                                value="${
                                    wh.escapeHtml(
                                        product?.unit
                                        ||
                                        "PZA"
                                    )
                                }"
                                placeholder="PZA, M, KG, L..."
                            >

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Stock mínimo
                            </label>

                            <input
                                id="whProductMinimum"
                                type="number"
                                min="0"
                                step="0.001"
                                value="${
                                    product?.minimum_stock
                                    ??
                                    0
                                }"
                            >

                            <small class="warehouse-form-help">
                                Sirve para marcar inventario bajo.
                            </small>

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Valor / costo unitario
                            </label>

                            <input
                                id="whProductCost"
                                type="number"
                                min="0"
                                step="0.01"
                                value="${
                                    product?.unit_cost
                                    ??
                                    ""
                                }"
                            >

                        </div>


                        <div class="warehouse-form-field full">

                            <label>
                                Etiqueta
                            </label>


                            <div class="warehouse-color-grid">

                                ${
                                    wh.LABELS
                                        .map(
                                            (
                                                label,
                                                index
                                            ) => `

                                                <div class="warehouse-color-option">

                                                    <input
                                                        type="radio"
                                                        id="whColor${index}"
                                                        name="whProductColor"
                                                        value="${label.value}"
                                                        ${
                                                            (
                                                                product?.label_color

                                                                ||

                                                                wh.LABELS[0].value
                                                            )
                                                            ===
                                                            label.value

                                                                ?

                                                                "checked"

                                                                :

                                                                ""
                                                        }
                                                    >

                                                    <label
                                                        for="whColor${index}"
                                                        title="${
                                                            wh.escapeHtml(
                                                                label.name
                                                            )
                                                        }"
                                                        style="
                                                            --color:
                                                            ${label.value};
                                                        "
                                                    >
                                                        <i></i>
                                                    </label>

                                                </div>

                                            `
                                        )
                                        .join(
                                            ""
                                        )
                                }

                            </div>

                        </div>


                    </div>


                    <div
                        id="warehouseProductFormMessage"
                        class="warehouse-form-message"
                    >
                    </div>


                </form>

            `,

            footer: `

                <button
                    type="button"
                    class="module-button"
                    data-wh-close-product
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    form="warehouseProductForm"
                    class="
                        module-button
                        module-button-primary
                    "
                >
                    ${
                        product

                            ?

                            "Guardar cambios"

                            :

                            "Dar de alta"
                    }
                </button>

            `,

            onOpen:
                async root => {


                    root
                        .querySelector(
                            "[data-wh-close-product]"
                        )
                        ?.addEventListener(
                            "click",
                            wh.closeModal
                        );


                    root
                        .querySelector(
                            "#warehouseProductForm"
                        )
                        ?.addEventListener(
                            "submit",
                            saveProduct
                        );


                    if (
                        !product
                    ) {

                        try {

                            const {
                                data,
                                error
                            } =
                                await wh.db.rpc(

                                    "warehouse_next_folio",

                                    {
                                        p_prefix:
                                            "ISGTZ"
                                    }

                                );


                            if (
                                error
                            ) {

                                throw error;

                            }


                            const input =
                                root.querySelector(
                                    "#whProductFolio"
                                );


                            if (
                                input
                                &&
                                !input.value
                            ) {

                                input.value =
                                    data
                                    ||
                                    "ISGTZ-0001";

                            }

                        }

                        catch (
                            error
                        ) {

                            console.error(
                                error
                            );

                        }

                    }

                }

        });

    }


    async function saveProduct(
        event
    ) {


        event.preventDefault();


        const form =
            event.currentTarget;


        const message =
            document.getElementById(
                "warehouseProductFormMessage"
            );


        const submit =
            document.querySelector(
                '[type="submit"][form="warehouseProductForm"]'
            );


        const payload = {

            p_product_id:
                editingProductId,

            p_folio:
                document
                    .getElementById(
                        "whProductFolio"
                    )
                    .value
                    .trim(),

            p_code:
                document
                    .getElementById(
                        "whProductCode"
                    )
                    .value
                    .trim(),

            p_description_main:
                document
                    .getElementById(
                        "whProductMain"
                    )
                    .value
                    .trim(),

            p_description_long:
                document
                    .getElementById(
                        "whProductLong"
                    )
                    .value
                    .trim()
                ||
                null,

            p_category_id:
                document
                    .getElementById(
                        "whProductCategory"
                    )
                    .value
                ||
                null,

            p_brand_id:
                document
                    .getElementById(
                        "whProductBrand"
                    )
                    .value
                ||
                null,

            p_location:
                document
                    .getElementById(
                        "whProductLocation"
                    )
                    .value
                    .trim()
                ||
                null,

            p_unit:
                document
                    .getElementById(
                        "whProductUnit"
                    )
                    .value
                    .trim()
                ||
                "PZA",

            p_minimum_stock:
                Number(
                    document
                        .getElementById(
                            "whProductMinimum"
                        )
                        .value
                    ||
                    0
                ),

            p_unit_cost:

                document
                    .getElementById(
                        "whProductCost"
                    )
                    .value ===
                ""

                    ?

                    null

                    :

                    Number(
                        document
                            .getElementById(
                                "whProductCost"
                            )
                            .value
                    ),

            p_label_color:
                form
                    .querySelector(
                        'input[name="whProductColor"]:checked'
                    )
                    ?.value
                ||
                wh.LABELS[0].value

        };


        if (
            !payload.p_folio
            ||
            !payload.p_code
            ||
            !payload.p_description_main
        ) {

            if (
                message
            ) {

                message.textContent =
                    "Folio, código y descripción principal son obligatorios.";

            }

            return;

        }


        if (
            submit
        ) {

            submit.disabled =
                true;


            submit.textContent =
                "Guardando...";

        }


        if (
            message
        ) {

            message.textContent =
                "";

        }


        try {

            const {
                error
            } =
                await wh.db.rpc(

                    "warehouse_save_product",

                    payload

                );


            if (
                error
            ) {

                throw error;

            }


            await wh.reloadProducts();


            wh.closeModal();


            wh.toast(

                editingProductId

                    ?

                    "Producto actualizado."

                    :

                    "Producto dado de alta."

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
                "[PRODUCTO]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    friendlyError(
                        error
                    );

            }

        }

        finally {

            if (
                submit
                &&
                document.body.contains(
                    submit
                )
            ) {

                submit.disabled =
                    false;


                submit.textContent =

                    editingProductId

                        ?

                        "Guardar cambios"

                        :

                        "Dar de alta";

            }

        }

    }


    async function archiveProduct(
        productId
    ) {


        const product =
            wh.state.products
                .find(
                    item =>
                        item.id ===
                        productId
                );


        if (
            !product
        ) {

            return;

        }


        if (
            !window.confirm(

                `¿Archivar ${product.folio} · ${product.description_main}?\n\nNo se borra su historial.`

            )
        ) {

            return;

        }


        try {

            const {
                error
            } =
                await wh.db.rpc(

                    "warehouse_archive_product",

                    {
                        p_product_id:
                            productId
                    }

                );


            if (
                error
            ) {

                throw error;

            }


            await wh.reloadProducts();


            wh.toast(
                "Producto archivado. Su historial se conserva."
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
                error
            );


            wh.toast(
                friendlyError(
                    error
                ),
                true
            );

        }

    }


    async function openProductHistory(
        productId
    ) {


        const product =
            wh.state.products
                .find(
                    item =>
                        item.id ===
                        productId
                );


        if (
            !product
        ) {

            return;

        }


        wh.openModal({

            kicker:
                product.folio,

            title:
                "Historial del producto",

            wide:
                true,

            body: `

                <div id="whProductHistoryModal">

                    <div class="warehouse-empty">
                        Cargando historial...
                    </div>

                </div>

            `

        });


        try {

            const {
                data,
                error
            } =
                await wh.db

                    .from(
                        "warehouse_product_history"
                    )

                    .select(
                        "*"
                    )

                    .eq(
                        "product_id",
                        productId
                    )

                    .order(
                        "created_at",
                        {
                            ascending:
                                false
                        }
                    )

                    .limit(
                        250
                    );


            if (
                error
            ) {

                throw error;

            }


            const host =
                document.getElementById(
                    "whProductHistoryModal"
                );


            if (
                !host
            ) {

                return;

            }


            host.innerHTML =
                renderHistoryRows(
                    data
                    ||
                    []
                );

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            const host =
                document.getElementById(
                    "whProductHistoryModal"
                );


            if (
                host
            ) {

                host.innerHTML = `

                    <div class="warehouse-empty">
                        No se pudo cargar el historial.
                    </div>

                `;

            }

        }

    }


    function renderHistoryRows(
        items
    ) {


        if (
            !items.length
        ) {

            return `

                <div class="warehouse-empty">
                    Todavía no hay movimientos.
                </div>

            `;

        }


        return `

            <div class="warehouse-history-list">

                ${
                    items
                        .map(
                            item => `

                                <article class="warehouse-history-item">

                                    <span class="warehouse-history-badge">
                                        ${
                                            wh.escapeHtml(
                                                historyLabel(
                                                    item.event_type
                                                )
                                            )
                                        }
                                    </span>

                                    <div class="warehouse-history-copy">

                                        <strong>
                                            ${
                                                wh.escapeHtml(
                                                    item.summary
                                                )
                                            }
                                        </strong>

                                        <small>
                                            ${
                                                wh.escapeHtml(
                                                    item.user_email
                                                    ||
                                                    "Usuario"
                                                )
                                            }
                                        </small>

                                    </div>

                                    <div class="warehouse-history-meta">
                                        ${
                                            wh.formatDateTime(
                                                item.created_at
                                            )
                                        }
                                    </div>

                                </article>

                            `
                        )
                        .join(
                            ""
                        )
                }

            </div>

        `;

    }


    // =====================================================
    // CATEGORÍAS
    // =====================================================

    function openCategoriesModal() {


        editingCategoryId =
            null;


        wh.openModal({

            kicker:
                "CATÁLOGO",

            title:
                "Categorías",

            body: `

                <form id="whCategoryForm">

                    <div class="warehouse-form-grid">

                        <div class="warehouse-form-field full">

                            <label>
                                Nombre *
                            </label>

                            <input
                                id="whCategoryName"
                                required
                                placeholder="Ej. Válvulas"
                            >

                        </div>

                        <div class="warehouse-form-field full">

                            <label>
                                Descripción
                            </label>

                            <input
                                id="whCategoryDescription"
                                placeholder="Opcional"
                            >

                        </div>

                    </div>

                    <div
                        class="warehouse-form-message"
                        id="whCategoryMessage"
                    >
                    </div>

                    <button
                        type="submit"
                        class="
                            module-button
                            module-button-primary
                        "
                    >
                        Guardar categoría
                    </button>

                </form>


                <div
                    id="whCategoryList"
                    class="warehouse-catalog-list"
                >
                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "#whCategoryForm"
                        )
                        ?.addEventListener(
                            "submit",
                            saveCategory
                        );


                    root
                        .querySelector(
                            "#whCategoryList"
                        )
                        ?.addEventListener(
                            "click",
                            handleCategoryListClick
                        );


                    renderCategoryList();

                }

        });

    }


    function renderCategoryList() {


        const host =
            document.getElementById(
                "whCategoryList"
            );


        if (
            !host
        ) {

            return;

        }


        host.innerHTML =

            wh.state.categories.length

                ?

                wh.state.categories
                    .map(
                        item => `

                            <article class="warehouse-catalog-item">

                                <div>

                                    <strong>
                                        ${
                                            wh.escapeHtml(
                                                item.name
                                            )
                                        }
                                    </strong>

                                    <small>
                                        ${
                                            wh.escapeHtml(
                                                item.description
                                                ||
                                                "Sin descripción"
                                            )
                                        }
                                    </small>

                                </div>

                                <div class="warehouse-table-actions">

                                    <button
                                        type="button"
                                        class="warehouse-mini-button"
                                        data-edit-category="${item.id}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        class="
                                            warehouse-mini-button
                                            danger
                                        "
                                        data-delete-category="${item.id}"
                                    >
                                        Borrar
                                    </button>

                                </div>

                            </article>

                        `
                    )
                    .join(
                        ""
                    )

                :

                `

                    <div class="warehouse-empty">
                        No hay categorías.
                    </div>

                `;

    }


    function handleCategoryListClick(
        event
    ) {


        const edit =
            event.target.closest(
                "[data-edit-category]"
            );


        const del =
            event.target.closest(
                "[data-delete-category]"
            );


        if (
            edit
        ) {


            const item =
                wh.state.categories
                    .find(
                        category =>
                            category.id ===
                            edit.dataset
                                .editCategory
                    );


            if (
                !item
            ) {

                return;

            }


            editingCategoryId =
                item.id;


            document
                .getElementById(
                    "whCategoryName"
                )
                .value =
                item.name
                ||
                "";


            document
                .getElementById(
                    "whCategoryDescription"
                )
                .value =
                item.description
                ||
                "";

        }


        if (
            del
        ) {

            deleteCategory(
                del.dataset
                    .deleteCategory
            );

        }

    }


    async function saveCategory(
        event
    ) {


        event.preventDefault();


        const form =
            event.currentTarget;


        const name =
            document
                .getElementById(
                    "whCategoryName"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "whCategoryDescription"
                )
                .value
                .trim()
            ||
            null;


        const message =
            document.getElementById(
                "whCategoryMessage"
            );


        if (
            !name
        ) {

            return;

        }


        try {

            let query;


            if (
                editingCategoryId
            ) {

                query =
                    wh.db
                        .from(
                            "warehouse_categories"
                        )
                        .update({

                            name,

                            description

                        })
                        .eq(
                            "id",
                            editingCategoryId
                        );

            }

            else {

                query =
                    wh.db
                        .from(
                            "warehouse_categories"
                        )
                        .insert({

                            name,

                            description,

                            created_by:
                                wh.state.user.id,

                            created_by_email:
                                wh.userEmail()

                        });

            }


            const {
                error
            } =
                await query;


            if (
                error
            ) {

                throw error;

            }


            editingCategoryId =
                null;


            form.reset();


            await wh.reloadCatalogs();


            renderCategoryList();


            wh.toast(
                "Categoría guardada."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[CATEGORÍA]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    friendlyError(
                        error
                    );

            }

        }

    }


    async function deleteCategory(
        id
    ) {


        const item =
            wh.state.categories
                .find(
                    category =>
                        category.id ===
                        id
                );


        if (
            !item

            ||

            !window.confirm(

                `¿Borrar la categoría ${item.name}?\nLos productos conservarán su ficha, pero quedarán sin categoría.`

            )
        ) {

            return;

        }


        try {

            const {
                error
            } =
                await wh.db

                    .from(
                        "warehouse_categories"
                    )

                    .delete()

                    .eq(
                        "id",
                        id
                    );


            if (
                error
            ) {

                throw error;

            }


            await wh.reloadCatalogs();


            renderCategoryList();


            wh.toast(
                "Categoría eliminada."
            );

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            wh.toast(
                friendlyError(
                    error
                ),
                true
            );

        }

    }


    // =====================================================
    // MARCAS
    // =====================================================

    function openBrandsModal() {


        editingBrandId =
            null;


        wh.openModal({

            kicker:
                "CATÁLOGO",

            title:
                "Marcas",

            wide:
                true,

            body: `

                <form id="whBrandForm">

                    <div class="warehouse-form-grid">

                        <div class="warehouse-form-field">

                            <label>
                                Marca *
                            </label>

                            <input
                                id="whBrandName"
                                required
                                placeholder="Ej. LOCK"
                            >

                        </div>

                        <div class="warehouse-form-field">

                            <label>
                                Ubicación
                            </label>

                            <input
                                id="whBrandLocation"
                                placeholder="Ciudad, dirección, sucursal..."
                            >

                        </div>

                        <div class="warehouse-form-field full">

                            <label>
                                Contactos
                            </label>

                            <div id="whBrandContacts">
                            </div>

                            <button
                                type="button"
                                id="whAddBrandContact"
                                class="module-button"
                            >
                                + Contacto
                            </button>

                        </div>

                    </div>

                    <div
                        class="warehouse-form-message"
                        id="whBrandMessage"
                    >
                    </div>

                    <button
                        type="submit"
                        class="
                            module-button
                            module-button-primary
                        "
                    >
                        Guardar marca
                    </button>

                </form>


                <div
                    id="whBrandList"
                    class="warehouse-catalog-list"
                >
                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "#whBrandForm"
                        )
                        ?.addEventListener(
                            "submit",
                            saveBrand
                        );


                    root
                        .querySelector(
                            "#whAddBrandContact"
                        )
                        ?.addEventListener(

                            "click",

                            () =>
                                addContactRow()

                        );


                    root
                        .querySelector(
                            "#whBrandContacts"
                        )
                        ?.addEventListener(

                            "click",

                            event =>

                                event.target
                                    .closest(
                                        "[data-remove-contact]"
                                    )
                                    ?.closest(
                                        ".warehouse-contact-row"
                                    )
                                    ?.remove()

                        );


                    root
                        .querySelector(
                            "#whBrandList"
                        )
                        ?.addEventListener(
                            "click",
                            handleBrandListClick
                        );


                    addContactRow();

                    renderBrandList();

                }

        });

    }


    function addContactRow(
        contact = {}
    ) {


        const host =
            document.getElementById(
                "whBrandContacts"
            );


        if (
            !host
        ) {

            return;

        }


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "warehouse-contact-row";


        row.innerHTML = `

            <div class="warehouse-form-field">

                <label>
                    Nombre
                </label>

                <input
                    data-contact-name
                    value="${
                        wh.escapeHtml(
                            contact.contact_name
                            ||
                            ""
                        )
                    }"
                    placeholder="Contacto"
                >

            </div>


            <div class="warehouse-form-field">

                <label>
                    Teléfono
                </label>

                <input
                    data-contact-phone
                    value="${
                        wh.escapeHtml(
                            contact.phone
                            ||
                            ""
                        )
                    }"
                    placeholder="Teléfono"
                >

            </div>


            <div class="warehouse-form-field">

                <label>
                    Correo
                </label>

                <input
                    data-contact-email
                    type="email"
                    value="${
                        wh.escapeHtml(
                            contact.email
                            ||
                            ""
                        )
                    }"
                    placeholder="correo@empresa.com"
                >

            </div>


            <button
                type="button"
                class="
                    warehouse-mini-button
                    danger
                "
                data-remove-contact
            >
                Quitar
            </button>

        `;


        host.appendChild(
            row
        );

    }


    function renderBrandList() {


        const host =
            document.getElementById(
                "whBrandList"
            );


        if (
            !host
        ) {

            return;

        }


        host.innerHTML =

            wh.state.brands.length

                ?

                wh.state.brands
                    .map(
                        item => {


                            const contacts =
                                wh.state.brandContacts
                                    .filter(
                                        contact =>
                                            contact.brand_id ===
                                            item.id
                                    );


                            return `

                                <article class="warehouse-catalog-item">

                                    <div>

                                        <strong>
                                            ${
                                                wh.escapeHtml(
                                                    item.name
                                                )
                                            }
                                        </strong>

                                        <small>

                                            ${
                                                wh.escapeHtml(
                                                    item.location
                                                    ||
                                                    "Sin ubicación"
                                                )
                                            }

                                            ·

                                            ${
                                                contacts.length
                                            }

                                            ${
                                                contacts.length ===
                                                1
                                                    ?
                                                    "contacto"
                                                    :
                                                    "contactos"
                                            }

                                        </small>

                                    </div>

                                    <div class="warehouse-table-actions">

                                        <button
                                            type="button"
                                            class="warehouse-mini-button"
                                            data-edit-brand="${item.id}"
                                        >
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            class="
                                                warehouse-mini-button
                                                danger
                                            "
                                            data-delete-brand="${item.id}"
                                        >
                                            Borrar
                                        </button>

                                    </div>

                                </article>

                            `;

                        }
                    )
                    .join(
                        ""
                    )

                :

                `

                    <div class="warehouse-empty">
                        No hay marcas.
                    </div>

                `;

    }


    function handleBrandListClick(
        event
    ) {


        const edit =
            event.target.closest(
                "[data-edit-brand]"
            );


        const del =
            event.target.closest(
                "[data-delete-brand]"
            );


        if (
            edit
        ) {


            const brand =
                wh.state.brands
                    .find(
                        item =>
                            item.id ===
                            edit.dataset
                                .editBrand
                    );


            if (
                !brand
            ) {

                return;

            }


            editingBrandId =
                brand.id;


            document
                .getElementById(
                    "whBrandName"
                )
                .value =
                brand.name
                ||
                "";


            document
                .getElementById(
                    "whBrandLocation"
                )
                .value =
                brand.location
                ||
                "";


            const host =
                document.getElementById(
                    "whBrandContacts"
                );


            host.innerHTML =
                "";


            const contacts =
                wh.state.brandContacts
                    .filter(
                        item =>
                            item.brand_id ===
                            brand.id
                    );


            if (
                contacts.length
            ) {

                contacts.forEach(
                    addContactRow
                );

            }

            else {

                addContactRow();

            }

        }


        if (
            del
        ) {

            deleteBrand(
                del.dataset
                    .deleteBrand
            );

        }

    }


    async function saveBrand(
        event
    ) {


        event.preventDefault();


        const form =
            event.currentTarget;


        const name =
            document
                .getElementById(
                    "whBrandName"
                )
                .value
                .trim();


        const location =
            document
                .getElementById(
                    "whBrandLocation"
                )
                .value
                .trim()
            ||
            null;


        const message =
            document.getElementById(
                "whBrandMessage"
            );


        const contacts =
            [

                ...document.querySelectorAll(
                    "#whBrandContacts .warehouse-contact-row"
                )

            ]
            .map(
                (
                    row,
                    index
                ) => ({

                    contact_name:
                        row
                            .querySelector(
                                "[data-contact-name]"
                            )
                            .value
                            .trim(),

                    phone:
                        row
                            .querySelector(
                                "[data-contact-phone]"
                            )
                            .value
                            .trim()
                        ||
                        null,

                    email:
                        row
                            .querySelector(
                                "[data-contact-email]"
                            )
                            .value
                            .trim()
                        ||
                        null,

                    notes:
                        null,

                    sort_order:
                        index

                })
            )
            .filter(
                item =>
                    item.contact_name
            );


        if (
            !name
        ) {

            return;

        }


        try {

            let brandId =
                editingBrandId;


            if (
                brandId
            ) {

                const {
                    error
                } =
                    await wh.db
                        .from(
                            "warehouse_brands"
                        )
                        .update({

                            name,

                            location

                        })
                        .eq(
                            "id",
                            brandId
                        );


                if (
                    error
                ) {

                    throw error;

                }

            }

            else {

                const {
                    data,
                    error
                } =
                    await wh.db
                        .from(
                            "warehouse_brands"
                        )
                        .insert({

                            name,

                            location,

                            created_by:
                                wh.state.user.id,

                            created_by_email:
                                wh.userEmail()

                        })
                        .select(
                            "id"
                        )
                        .single();


                if (
                    error
                ) {

                    throw error;

                }


                brandId =
                    data.id;

            }


            const {
                error:
                    deleteError
            } =
                await wh.db
                    .from(
                        "warehouse_brand_contacts"
                    )
                    .delete()
                    .eq(
                        "brand_id",
                        brandId
                    );


            if (
                deleteError
            ) {

                throw deleteError;

            }


            if (
                contacts.length
            ) {

                const {
                    error:
                        contactsError
                } =
                    await wh.db
                        .from(
                            "warehouse_brand_contacts"
                        )
                        .insert(

                            contacts.map(
                                contact => ({

                                    ...contact,

                                    brand_id:
                                        brandId

                                })
                            )

                        );


                if (
                    contactsError
                ) {

                    throw contactsError;

                }

            }


            editingBrandId =
                null;


            form.reset();


            const contactsHost =
                document.getElementById(
                    "whBrandContacts"
                );


            if (
                contactsHost
            ) {

                contactsHost.innerHTML =
                    "";

            }


            addContactRow();


            await wh.reloadCatalogs();


            renderBrandList();


            wh.toast(
                "Marca guardada."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[MARCA]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    friendlyError(
                        error
                    );

            }

        }

    }


    async function deleteBrand(
        id
    ) {


        const item =
            wh.state.brands
                .find(
                    brand =>
                        brand.id ===
                        id
                );


        if (
            !item

            ||

            !window.confirm(

                `¿Borrar la marca ${item.name}?\nLos productos quedarán sin marca.`

            )
        ) {

            return;

        }


        try {

            const {
                error
            } =
                await wh.db

                    .from(
                        "warehouse_brands"
                    )

                    .delete()

                    .eq(
                        "id",
                        id
                    );


            if (
                error
            ) {

                throw error;

            }


            await wh.reloadCatalogs();


            renderBrandList();


            wh.toast(
                "Marca eliminada."
            );

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            wh.toast(
                friendlyError(
                    error
                ),
                true
            );

        }

    }


    function historyLabel(
        type
    ) {


        return ({

            product_created:
                "ALTA",

            product_updated:
                "EDICIÓN",

            product_archived:
                "BAJA",

            stock_in:
                "INGRESO",

            stock_out:
                "EGRESO",

            inventory_adjustment:
                "INVENTARIO",

            cost_updated:
                "COSTO"

        })[
            type
        ]
        ||
        "EVENTO";

    }


    function friendlyError(
        error
    ) {


        const text =
            String(
                error?.message
                ||
                error
                ||
                "Error"
            );


        if (
            text
                .toLowerCase()
                .includes(
                    "duplicate key"
                )

            ||

            text
                .toLowerCase()
                .includes(
                    "unique"
                )
        ) {

            return "Ya existe un registro con ese folio, código o nombre.";

        }


        return text;

    }

})();