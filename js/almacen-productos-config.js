// =========================================================
// GRUPO GUTIERREZ
// ALMACÉN · EXTENSIÓN PRODUCTOS
// UNIDADES + TIPO + FOLIO BLOQUEADO
// =========================================================

(() => {

    "use strict";


    let wh =
        null;


    let units =
        [];


    let editingUnitId =
        null;


    let modalObserver =
        null;


    let tableObserver =
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

            return;

        }


        document.addEventListener(

            "ggwarehouse:ready",

            callback,

            {
                once:
                    true
            }

        );

    }


    async function init() {


        wh =
            window.GGWarehouse;


        injectToolbarControls();

        bindProductTypeFilter();

        observeProductModal();

        observeProductTable();


        try {

            await loadUnits();

        }

        catch (
            error
        ) {

            console.error(
                "[ALMACÉN UNIDADES]",
                error
            );


            wh.toast(
                "No se pudieron cargar las unidades de medida.",
                true
            );

        }


        decorateAndFilterProducts();


        document.addEventListener(

            "ggwarehouse:products",

            () => {

                window.setTimeout(
                    decorateAndFilterProducts,
                    0
                );

            }

        );


        document.addEventListener(

            "ggwarehouse:refresh",

            async () => {


                try {

                    await loadUnits();

                }

                catch (
                    error
                ) {

                    console.error(
                        "[ALMACÉN UNIDADES]",
                        error
                    );

                }


                window.setTimeout(
                    decorateAndFilterProducts,
                    0
                );

            }

        );

    }


    // =====================================================
    // CONTROLES
    // =====================================================

    function injectToolbarControls() {


        const brandsButton =
            document.getElementById(
                "warehouseBrandsButton"
            );


        const newProductButton =
            document.getElementById(
                "warehouseNewProductButton"
            );


        const actionRow =
            newProductButton
                ?.closest(
                    ".warehouse-action-row"
                );


        // =================================================
        // BOTÓN UNIDADES
        // =================================================

        if (
            actionRow
            &&
            !document.getElementById(
                "warehouseUnitsButton"
            )
        ) {


            const unitsButton =
                document.createElement(
                    "button"
                );


            unitsButton.type =
                "button";


            unitsButton.id =
                "warehouseUnitsButton";


            unitsButton.className =
                "module-button";


            unitsButton.textContent =
                "Unidades";


            unitsButton.addEventListener(
                "click",
                openUnitsModal
            );


            if (
                brandsButton
                &&
                brandsButton.parentElement ===
                actionRow
            ) {

                brandsButton.insertAdjacentElement(
                    "afterend",
                    unitsButton
                );

            }

            else {

                actionRow.insertBefore(
                    unitsButton,
                    newProductButton
                );

            }

        }


        // =================================================
        // FILTRO TIPO
        // =================================================

        const search =
            document.getElementById(
                "warehouseProductSearch"
            );


        const toolbar =
            search
                ?.closest(
                    ".warehouse-toolbar"
                );


        if (
            toolbar
        ) {


            toolbar.classList.add(
                "warehouse-products-toolbar"
            );


            if (
                !document.getElementById(
                    "warehouseProductTypeFilter"
                )
            ) {


                const select =
                    document.createElement(
                        "select"
                    );


                select.id =
                    "warehouseProductTypeFilter";


                select.setAttribute(
                    "aria-label",
                    "Filtrar por tipo de producto"
                );


                select.innerHTML = `

                    <option value="">
                        Todos los tipos
                    </option>

                    <option value="insumo">
                        Insumos
                    </option>

                    <option value="general">
                        Generales
                    </option>

                `;


                const statusFilter =
                    document.getElementById(
                        "warehouseProductStatusFilter"
                    );


                if (
                    statusFilter
                    &&
                    statusFilter.parentElement ===
                    toolbar
                ) {

                    statusFilter.insertAdjacentElement(
                        "beforebegin",
                        select
                    );

                }

                else {

                    toolbar.appendChild(
                        select
                    );

                }

            }

        }

    }


    function bindProductTypeFilter() {


        document
            .getElementById(
                "warehouseProductTypeFilter"
            )
            ?.addEventListener(

                "change",

                decorateAndFilterProducts

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


                const node =
                    document.getElementById(
                        id
                    );


                if (
                    !node
                ) {

                    return;

                }


                node.addEventListener(

                    "input",

                    () => {

                        window.setTimeout(
                            decorateAndFilterProducts,
                            0
                        );

                    }

                );


                node.addEventListener(

                    "change",

                    () => {

                        window.setTimeout(
                            decorateAndFilterProducts,
                            0
                        );

                    }

                );

            }
        );

    }


    // =====================================================
    // UNIDADES DE MEDIDA
    // =====================================================

    async function loadUnits() {


        const {
            data,
            error
        } =
            await wh.db
                .from(
                    "warehouse_units"
                )
                .select(
                    "*"
                )
                .order(
                    "name",
                    {
                        ascending:
                            true
                    }
                );


        if (
            error
        ) {

            throw error;

        }


        units =
            data
            ||
            [];


        window.GGWarehouseUnits = {

            getAll:
                () =>
                    units.map(
                        item => ({
                            ...item
                        })
                    ),

            reload:
                loadUnits

        };


        refreshOpenProductUnitSelect();

    }


    function openUnitsModal() {


        editingUnitId =
            null;


        wh.openModal({

            kicker:
                "CATÁLOGO",

            title:
                "Unidades de medida",

            body: `

                <form id="whUnitForm">


                    <div class="warehouse-form-grid">


                        <div class="warehouse-form-field">

                            <label>
                                Nombre *
                            </label>

                            <input
                                id="whUnitName"
                                required
                                placeholder="Ej. Pieza"
                            >

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Abreviatura *
                            </label>

                            <input
                                id="whUnitAbbreviation"
                                required
                                maxlength="20"
                                placeholder="Ej. PZA"
                            >

                        </div>


                    </div>


                    <div
                        id="whUnitMessage"
                        class="warehouse-form-message"
                    >
                    </div>


                    <button
                        type="submit"
                        class="
                            module-button
                            module-button-primary
                        "
                    >
                        Guardar unidad
                    </button>


                </form>


                <div
                    id="whUnitList"
                    class="warehouse-catalog-list"
                >
                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "#whUnitForm"
                        )
                        ?.addEventListener(
                            "submit",
                            saveUnit
                        );


                    root
                        .querySelector(
                            "#whUnitList"
                        )
                        ?.addEventListener(
                            "click",
                            handleUnitListClick
                        );


                    renderUnitList();

                }

        });

    }


    function renderUnitList() {


        const host =
            document.getElementById(
                "whUnitList"
            );


        if (
            !host
        ) {

            return;

        }


        if (
            !units.length
        ) {

            host.innerHTML = `

                <div class="warehouse-empty">
                    No hay unidades de medida.
                </div>

            `;


            return;

        }


        host.innerHTML =
            units
                .map(
                    unit => `

                        <article class="warehouse-catalog-item">


                            <div>

                                <strong>
                                    ${
                                        wh.escapeHtml(
                                            unit.name
                                        )
                                    }
                                </strong>

                                <small>
                                    ${
                                        wh.escapeHtml(
                                            unit.abbreviation
                                        )
                                    }
                                </small>

                            </div>


                            <div class="warehouse-table-actions">

                                <button
                                    type="button"
                                    class="warehouse-mini-button"
                                    data-edit-unit="${unit.id}"
                                >
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    class="
                                        warehouse-mini-button
                                        danger
                                    "
                                    data-delete-unit="${unit.id}"
                                >
                                    Borrar
                                </button>

                            </div>


                        </article>

                    `
                )
                .join(
                    ""
                );

    }


    function handleUnitListClick(
        event
    ) {


        const edit =
            event.target.closest(
                "[data-edit-unit]"
            );


        const remove =
            event.target.closest(
                "[data-delete-unit]"
            );


        if (
            edit
        ) {


            const unit =
                units.find(
                    item =>
                        item.id ===
                        edit.dataset
                            .editUnit
                );


            if (
                !unit
            ) {

                return;

            }


            editingUnitId =
                unit.id;


            const name =
                document.getElementById(
                    "whUnitName"
                );


            const abbreviation =
                document.getElementById(
                    "whUnitAbbreviation"
                );


            if (
                name
            ) {

                name.value =
                    unit.name
                    ||
                    "";

            }


            if (
                abbreviation
            ) {

                abbreviation.value =
                    unit.abbreviation
                    ||
                    "";

            }


            name?.focus();

        }


        if (
            remove
        ) {

            void deleteUnit(
                remove.dataset
                    .deleteUnit
            );

        }

    }


    async function saveUnit(
        event
    ) {


        event.preventDefault();


        const form =
            event.currentTarget;


        const message =
            document.getElementById(
                "whUnitMessage"
            );


        const name =
            document
                .getElementById(
                    "whUnitName"
                )
                ?.value
                .trim()
            ||
            "";


        const abbreviation =
            document
                .getElementById(
                    "whUnitAbbreviation"
                )
                ?.value
                .trim()
                .toUpperCase()
            ||
            "";


        if (
            !name
            ||
            !abbreviation
        ) {

            if (
                message
            ) {

                message.textContent =
                    "Nombre y abreviatura son obligatorios.";

            }

            return;

        }


        try {


            const {
                error
            } =
                await wh.db.rpc(

                    "warehouse_save_unit",

                    {

                        p_unit_id:
                            editingUnitId,

                        p_name:
                            name,

                        p_abbreviation:
                            abbreviation

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            editingUnitId =
                null;


            form.reset();


            await loadUnits();


            renderUnitList();


            wh.toast(
                "Unidad de medida guardada."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[UNIDAD]",
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


    async function deleteUnit(
        unitId
    ) {


        const unit =
            units.find(
                item =>
                    item.id ===
                    unitId
            );


        if (
            !unit
        ) {

            return;

        }


        if (
            !window.confirm(

                `¿Borrar la unidad ${unit.name} (${unit.abbreviation})?\n\nLos productos que ya la usan conservarán su unidad actual.`

            )
        ) {

            return;

        }


        try {


            const {
                error
            } =
                await wh.db.rpc(

                    "warehouse_delete_unit",

                    {
                        p_unit_id:
                            unitId
                    }

                );


            if (
                error
            ) {

                throw error;

            }


            if (
                editingUnitId ===
                unitId
            ) {

                editingUnitId =
                    null;

            }


            await loadUnits();


            renderUnitList();


            wh.toast(
                "Unidad eliminada."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[UNIDAD]",
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
    // OBSERVAR MODAL PRODUCTO
    // =====================================================

    function observeProductModal() {


        const root =
            document.getElementById(
                "warehouseModalRoot"
            );


        if (
            !root
        ) {

            return;

        }


        modalObserver =
            new MutationObserver(
                enhanceProductModal
            );


        modalObserver.observe(
            root,
            {

                childList:
                    true,

                subtree:
                    true

            }
        );


        enhanceProductModal();

    }


    function enhanceProductModal() {


        const form =
            document.getElementById(
                "warehouseProductForm"
            );


        if (
            !form
            ||
            form.dataset
                .whExtraReady ===
                "true"
        ) {

            return;

        }


        form.dataset.whExtraReady =
            "true";


        lockFolioField();

        replaceUnitInput();

        injectProductTypeField();


        // Captura antes del submit original.
        // Así no tenemos que reemplazar almacen-productos.js.

        form.addEventListener(

            "submit",

            saveProductExtended,

            true

        );

    }


    // =====================================================
    // FOLIO BLOQUEADO
    // =====================================================

    function lockFolioField() {


        const folio =
            document.getElementById(
                "whProductFolio"
            );


        if (
            !folio
        ) {

            return;

        }


        folio.readOnly =
            true;


        folio.classList.add(
            "warehouse-folio-locked"
        );


        folio.setAttribute(
            "aria-readonly",
            "true"
        );


        folio.title =
            "El folio se genera automáticamente y no puede modificarse.";


        const help =
            folio
                .closest(
                    ".warehouse-form-field"
                )
                ?.querySelector(
                    ".warehouse-form-help"
                );


        if (
            help
        ) {

            help.textContent =
                "Folio consecutivo automático. Una vez creado no puede modificarse.";

        }

    }


    // =====================================================
    // UNIDAD COMO SELECT
    // =====================================================

    function replaceUnitInput() {


        const oldInput =
            document.getElementById(
                "whProductUnit"
            );


        if (
            !oldInput
            ||
            oldInput.tagName ===
            "SELECT"
        ) {

            return;

        }


        const currentValue =
            String(
                oldInput.value
                ||
                ""
            )
            .trim()
            .toUpperCase();


        const product =
            findProductByCurrentFolio();


        const select =
            document.createElement(
                "select"
            );


        select.id =
            "whProductUnit";


        select.required =
            true;


        select.dataset.currentUnitId =
            product?.unit_id
            ||
            "";


        oldInput.replaceWith(
            select
        );


        fillProductUnitSelect(

            select,

            product?.unit_id
            ||
            null,

            currentValue

        );

    }


    function refreshOpenProductUnitSelect() {


        const select =
            document.getElementById(
                "whProductUnit"
            );


        if (
            !select
            ||
            select.tagName !==
            "SELECT"
        ) {

            return;

        }


        const product =
            findProductByCurrentFolio();


        fillProductUnitSelect(

            select,

            product?.unit_id
            ||
            select.dataset
                .currentUnitId
            ||
            null,

            product?.unit
            ||
            select.dataset
                .legacyUnit
            ||
            ""

        );

    }


    function fillProductUnitSelect(
        select,
        selectedUnitId,
        legacyValue
    ) {


        const legacy =
            String(
                legacyValue
                ||
                ""
            )
            .trim()
            .toUpperCase();


        const legacyExists =
            units.some(
                unit =>
                    String(
                        unit.abbreviation
                        ||
                        ""
                    )
                    .toUpperCase() ===
                    legacy
            );


        select.dataset.legacyUnit =
            legacy;


        select.innerHTML = `

            <option value="">
                Selecciona unidad...
            </option>

            ${
                units
                    .map(
                        unit => `

                            <option
                                value="${unit.id}"
                                data-abbreviation="${
                                    wh.escapeHtml(
                                        unit.abbreviation
                                    )
                                }"
                                ${
                                    selectedUnitId ===
                                    unit.id

                                        ?

                                        "selected"

                                        :

                                        (
                                            !selectedUnitId
                                            &&
                                            legacy
                                            &&
                                            String(
                                                unit.abbreviation
                                            )
                                            .toUpperCase() ===
                                            legacy

                                                ?

                                                "selected"

                                                :

                                                ""
                                        )
                                }
                            >

                                ${
                                    wh.escapeHtml(
                                        unit.name
                                    )
                                }

                                ·

                                ${
                                    wh.escapeHtml(
                                        unit.abbreviation
                                    )
                                }

                            </option>

                        `
                    )
                    .join(
                        ""
                    )
            }

            ${
                legacy
                &&
                !legacyExists

                    ?

                    `
                        <option
                            value="legacy:${wh.escapeHtml(legacy)}"
                            data-abbreviation="${wh.escapeHtml(legacy)}"
                            ${
                                !selectedUnitId

                                    ?

                                    "selected"

                                    :

                                    ""
                            }
                        >
                            ${wh.escapeHtml(legacy)}
                            · unidad anterior
                        </option>
                    `

                    :

                    ""
            }

        `;

    }


    // =====================================================
    // TIPO DE PRODUCTO
    // =====================================================

    function injectProductTypeField() {


        if (
            document.getElementById(
                "whProductType"
            )
        ) {

            return;

        }


        const brand =
            document.getElementById(
                "whProductBrand"
            );


        const brandField =
            brand
                ?.closest(
                    ".warehouse-form-field"
                );


        const product =
            findProductByCurrentFolio();


        const field =
            document.createElement(
                "div"
            );


        field.className =
            "warehouse-form-field";


        field.innerHTML = `

            <label>
                Tipo de producto *
            </label>

            <select
                id="whProductType"
                required
            >

                <option
                    value="general"
                    ${
                        (
                            product?.product_type
                            ||
                            "general"
                        ) ===
                        "general"

                            ?

                            "selected"

                            :

                            ""
                    }
                >
                    General
                </option>

                <option
                    value="insumo"
                    ${
                        product?.product_type ===
                        "insumo"

                            ?

                            "selected"

                            :

                            ""
                    }
                >
                    Insumo
                </option>

            </select>

            <small class="warehouse-form-help">
                Insumo = material de consumo.
                General = producto regular del catálogo.
            </small>

        `;


        if (
            brandField
        ) {

            brandField.insertAdjacentElement(
                "afterend",
                field
            );

        }

        else {

            formGrid()
                ?.appendChild(
                    field
                );

        }

    }


    function formGrid() {


        return document.querySelector(
            "#warehouseProductForm .warehouse-form-grid"
        );

    }


    // =====================================================
    // ENCONTRAR PRODUCTO EDITADO POR FOLIO
    // =====================================================

    function findProductByCurrentFolio() {


        if (
            !wh
        ) {

            return null;

        }


        const folio =
            document
                .getElementById(
                    "whProductFolio"
                )
                ?.value
                .trim()
            ||
            "";


        if (
            !folio
        ) {

            return null;

        }


        const target =
            wh.normalize(
                folio
            );


        return (
            wh.state.products
                .find(
                    product =>
                        wh.normalize(
                            product.folio
                        ) ===
                        target
                )
            ||
            null
        );

    }


    // =====================================================
    // GUARDAR PRODUCTO V2
    // =====================================================

    async function saveProductExtended(
        event
    ) {


        event.preventDefault();

        event.stopImmediatePropagation();


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


        const folio =
            document
                .getElementById(
                    "whProductFolio"
                )
                ?.value
                .trim()
            ||
            "";


        const code =
            document
                .getElementById(
                    "whProductCode"
                )
                ?.value
                .trim()
            ||
            "";


        const description =
            document
                .getElementById(
                    "whProductMain"
                )
                ?.value
                .trim()
            ||
            "";


        const unitSelect =
            document.getElementById(
                "whProductUnit"
            );


        const selectedUnitOption =
            unitSelect
                ?.selectedOptions
                ?.[0];


        const rawUnitValue =
            unitSelect?.value
            ||
            "";


        const legacyUnit =
            rawUnitValue.startsWith(
                "legacy:"
            )

                ?

                rawUnitValue.substring(
                    7
                )

                :

                null;


        const unitId =
            legacyUnit

                ?

                null

                :

                (
                    rawUnitValue
                    ||
                    null
                );


        const unitText =
            legacyUnit

                ?

                legacyUnit

                :

                (
                    selectedUnitOption
                        ?.dataset
                        ?.abbreviation

                    ||

                    ""
                );


        const existingProduct =
            findProductByCurrentFolio();


        if (
            !folio
            ||
            !code
            ||
            !description
        ) {

            setMessage(
                message,
                "Folio, código y descripción principal son obligatorios."
            );

            return;

        }


        if (
            !unitText
        ) {

            setMessage(
                message,
                "Selecciona una unidad de medida."
            );

            return;

        }


        const payload = {

            p_product_id:
                existingProduct?.id
                ||
                null,

            p_folio:
                folio,

            p_code:
                code,

            p_description_main:
                description,

            p_description_long:
                document
                    .getElementById(
                        "whProductLong"
                    )
                    ?.value
                    .trim()
                ||
                null,

            p_category_id:
                document
                    .getElementById(
                        "whProductCategory"
                    )
                    ?.value
                ||
                null,

            p_brand_id:
                document
                    .getElementById(
                        "whProductBrand"
                    )
                    ?.value
                ||
                null,

            p_location:
                document
                    .getElementById(
                        "whProductLocation"
                    )
                    ?.value
                    .trim()
                ||
                null,

            p_unit_id:
                unitId,

            p_unit:
                unitText,

            p_minimum_stock:
                Number(
                    document
                        .getElementById(
                            "whProductMinimum"
                        )
                        ?.value
                    ||
                    0
                ),

            p_unit_cost:

                document
                    .getElementById(
                        "whProductCost"
                    )
                    ?.value ===
                ""

                    ?

                    null

                    :

                    Number(
                        document
                            .getElementById(
                                "whProductCost"
                            )
                            ?.value
                        ||
                        0
                    ),

            p_label_color:
                form
                    .querySelector(
                        'input[name="whProductColor"]:checked'
                    )
                    ?.value
                ||
                wh.LABELS[0].value,

            p_product_type:
                document
                    .getElementById(
                        "whProductType"
                    )
                    ?.value
                ||
                "general"

        };


        if (
            submit
        ) {

            submit.disabled =
                true;


            submit.textContent =
                "Guardando...";

        }


        setMessage(
            message,
            ""
        );


        try {


            const {
                error
            } =
                await wh.db.rpc(

                    "warehouse_save_product_v2",

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

                existingProduct

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
                "[PRODUCTO EXTENDIDO]",
                error
            );


            setMessage(

                message,

                friendlyError(
                    error
                )

            );

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

                    existingProduct

                        ?

                        "Guardar cambios"

                        :

                        "Dar de alta";

            }

        }

    }


    // =====================================================
    // TABLA / FILTRO TIPO
    // =====================================================

    function observeProductTable() {


        const body =
            document.getElementById(
                "warehouseProductsBody"
            );


        if (
            !body
        ) {

            return;

        }


        tableObserver =
            new MutationObserver(
                decorateAndFilterProducts
            );


        tableObserver.observe(
            body,
            {
                childList:
                    true
            }
        );

    }


    function decorateAndFilterProducts() {


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


        const typeFilter =
            document
                .getElementById(
                    "warehouseProductTypeFilter"
                )
                ?.value
            ||
            "";


        const rows =
            [
                ...body.querySelectorAll(
                    "tr"
                )
            ];


        let visible =
            0;


        rows.forEach(
            row => {


                const edit =
                    row.querySelector(
                        "[data-wh-edit-product]"
                    );


                if (
                    !edit
                ) {

                    return;

                }


                const productId =
                    edit.dataset
                        .whEditProduct;


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


                decorateProductRow(
                    row,
                    product
                );


                const show =

                    !typeFilter

                    ||

                    (
                        product.product_type
                        ||
                        "general"
                    ) ===
                    typeFilter;


                row.hidden =
                    !show;


                if (
                    show
                ) {

                    visible +=
                        1;

                }

            }
        );


        const count =
            document.getElementById(
                "warehouseProductCount"
            );


        if (
            count
            &&
            rows.some(
                row =>
                    row.querySelector(
                        "[data-wh-edit-product]"
                    )
            )
        ) {

            count.textContent =
                `${visible} ${
                    visible ===
                    1
                        ?
                        "producto"
                        :
                        "productos"
                }`;

        }

    }


    function decorateProductRow(
        row,
        product
    ) {


        const productCell =
            row.cells?.[3];


        if (
            !productCell
            ||
            productCell.querySelector(
                "[data-wh-product-type-chip]"
            )
        ) {

            return;

        }


        const chip =
            document.createElement(
                "span"
            );


        chip.dataset.whProductTypeChip =
            "true";


        const type =
            product.product_type
            ||
            "general";


        chip.className =
            `warehouse-product-type-chip ${type}`;


        chip.textContent =

            type ===
            "insumo"

                ?

                "INSUMO"

                :

                "GENERAL";


        productCell.appendChild(
            chip
        );

    }


    // =====================================================
    // HELPERS
    // =====================================================

    function setMessage(
        node,
        text
    ) {


        if (
            node
        ) {

            node.textContent =
                text;

        }

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


        const normalized =
            text.toLowerCase();


        if (
            normalized.includes(
                "duplicate"
            )

            ||

            normalized.includes(
                "unique"
            )
        ) {

            return "Ya existe un registro con esos datos.";

        }


        if (
            normalized.includes(
                "folio"
            )

            &&

            normalized.includes(
                "modific"
            )
        ) {

            return "El folio no puede modificarse después del alta.";

        }


        return text;

    }

})();