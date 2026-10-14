// =========================================================
// GRUPO GUTIERREZ
// ALMACÉN · REPORTE EXCEL DE PRODUCTOS
// =========================================================

(() => {

    "use strict";


    let wh =
        null;


    let libraryPromise =
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


    function init() {


        wh =
            window.GGWarehouse;


        injectReportButton();

    }


    // =====================================================
    // BOTÓN
    // =====================================================

    function injectReportButton() {


        if (
            document.getElementById(
                "warehouseProductsExcelButton"
            )
        ) {

            return;

        }


        // Por si quedó alguna versión anterior.

        document
            .getElementById(
                "warehouseProductsPdfButton"
            )
            ?.remove();


        const newProductButton =
            document.getElementById(
                "warehouseNewProductButton"
            );


        const actionRow =
            newProductButton
                ?.closest(
                    ".warehouse-action-row"
                );


        if (
            !actionRow
            ||
            !newProductButton
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
            "warehouseProductsExcelButton";


        button.className =
            "module-button warehouse-report-button";


        button.innerHTML =
            "<span>↓</span> Descargar Excel";


        button.addEventListener(
            "click",
            downloadProductsExcel
        );


        actionRow.insertBefore(
            button,
            newProductButton
        );

    }


    // =====================================================
    // GENERAR EXCEL
    // =====================================================

    async function downloadProductsExcel(
        event
    ) {


        const button =
            event.currentTarget;


        const original =
            button.innerHTML;


        button.disabled =
            true;


        button.textContent =
            "Generando Excel...";


        try {


            await ensureExcelLibrary();


            const products =
                getFilteredProducts();


            if (
                !products.length
            ) {

                wh.toast(
                    "No hay productos para incluir en el reporte.",
                    true
                );

                return;

            }


            const generatedAt =
                new Date();


            const workbook =
                XLSX.utils.book_new();


            workbook.Props = {

                Title:
                    "Reporte de Productos · Almacén",

                Subject:
                    "Inventario de productos",

                Author:
                    "Grupo Gutierrez",

                Company:
                    "Grupo Gutierrez",

                CreatedDate:
                    generatedAt

            };


            // =================================================
            // HOJA PRODUCTOS
            // =================================================

            const rows =
                buildProductRows(
                    products
                );


            const productsSheet =
                XLSX.utils.json_to_sheet(

                    rows,

                    {

                        header: [

                            "Etiqueta",

                            "Folio",

                            "Código",

                            "Descripción principal",

                            "Descripción larga",

                            "Tipo",

                            "Categoría",

                            "Marca",

                            "Ubicación",

                            "Unidad",

                            "Stock",

                            "Stock mínimo",

                            "Costo unitario",

                            "Valor inventario",

                            "Estado"

                        ]

                    }

                );


            productsSheet["!cols"] = [

                {
                    wch:
                        15
                },

                {
                    wch:
                        16
                },

                {
                    wch:
                        18
                },

                {
                    wch:
                        38
                },

                {
                    wch:
                        48
                },

                {
                    wch:
                        12
                },

                {
                    wch:
                        22
                },

                {
                    wch:
                        20
                },

                {
                    wch:
                        22
                },

                {
                    wch:
                        12
                },

                {
                    wch:
                        14
                },

                {
                    wch:
                        14
                },

                {
                    wch:
                        16
                },

                {
                    wch:
                        18
                },

                {
                    wch:
                        12
                }

            ];


            productsSheet["!autofilter"] = {

                ref:
                    productsSheet["!ref"]

            };


            applyNumberFormats(
                productsSheet,
                rows.length
            );


            // =================================================
            // HOJA RESUMEN
            // =================================================

            const summarySheet =
                buildSummarySheet(

                    products,

                    generatedAt

                );


            XLSX.utils.book_append_sheet(
                workbook,
                summarySheet,
                "Resumen"
            );


            XLSX.utils.book_append_sheet(
                workbook,
                productsSheet,
                "Productos"
            );


            const date =
                generatedAt
                    .toISOString()
                    .slice(
                        0,
                        10
                    );


            XLSX.writeFile(

                workbook,

                `almacen-productos-${date}.xlsx`,

                {
                    compression:
                        true
                }

            );


            wh.toast(
                "Reporte Excel generado."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[REPORTE EXCEL PRODUCTOS]",
                error
            );


            wh.toast(
                "No se pudo generar el Excel.",
                true
            );

        }

        finally {


            button.disabled =
                false;


            button.innerHTML =
                original;

        }

    }


    // =====================================================
    // FILAS
    // =====================================================

    function buildProductRows(
        products
    ) {


        return products.map(
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


                const cost =

                    product.unit_cost ==
                    null

                        ?

                        null

                        :

                        Number(
                            product.unit_cost
                        );


                const label =
                    wh.LABELS
                        ?.find(
                            item =>
                                item.value ===
                                product.label_color
                        )
                        ?.name
                    ||
                    product.label_color
                    ||
                    "Sin etiqueta";


                return {

                    "Etiqueta":
                        label,

                    "Folio":
                        product.folio
                        ||
                        "",

                    "Código":
                        product.code
                        ||
                        "",

                    "Descripción principal":
                        product.description_main
                        ||
                        "",

                    "Descripción larga":
                        product.description_long
                        ||
                        "",

                    "Tipo":

                        product.product_type ===
                        "insumo"

                            ?

                            "Insumo"

                            :

                            "General",

                    "Categoría":
                        wh.getCategory(
                            product.category_id
                        )
                        ?.name
                        ||
                        "",

                    "Marca":
                        wh.getBrand(
                            product.brand_id
                        )
                        ?.name
                        ||
                        "",

                    "Ubicación":
                        product.location
                        ||
                        "",

                    "Unidad":
                        product.unit
                        ||
                        "",

                    "Stock":
                        stock,

                    "Stock mínimo":
                        minimum,

                    "Costo unitario":
                        cost,

                    "Valor inventario":
                        stock
                        *
                        Number(
                            cost
                            ||
                            0
                        ),

                    "Estado":

                        product.active

                            ?

                            (
                                minimum >
                                0

                                &&

                                stock <=
                                minimum

                                    ?

                                    "Stock bajo"

                                    :

                                    "Activo"
                            )

                            :

                            "Archivado"

                };

            }
        );

    }


    // =====================================================
    // RESUMEN
    // =====================================================

    function buildSummarySheet(
        products,
        generatedAt
    ) {


        const active =
            products.filter(
                product =>
                    product.active
            );


        const totalStock =
            active.reduce(

                (
                    sum,
                    product
                ) =>

                    sum
                    +
                    Number(
                        product.stock
                        ||
                        0
                    ),

                0

            );


        const inventoryValue =
            active.reduce(

                (
                    sum,
                    product
                ) =>

                    sum
                    +
                    Number(
                        product.stock
                        ||
                        0
                    )
                    *
                    Number(
                        product.unit_cost
                        ||
                        0
                    ),

                0

            );


        const lowStock =
            active.filter(
                product => {


                    const minimum =
                        Number(
                            product.minimum_stock
                            ||
                            0
                        );


                    return (

                        minimum >
                        0

                        &&

                        Number(
                            product.stock
                            ||
                            0
                        ) <=
                        minimum

                    );

                }
            ).length;


        const insumos =
            products.filter(
                product =>

                    (
                        product.product_type
                        ||
                        "general"
                    ) ===
                    "insumo"
            ).length;


        const generales =
            products.filter(
                product =>

                    (
                        product.product_type
                        ||
                        "general"
                    ) ===
                    "general"
            ).length;


        const data = [

            [
                "GRUPO GUTIERREZ · ALMACÉN"
            ],

            [
                "Reporte de productos"
            ],

            [],

            [
                "Generado",
                formatDateTime(
                    generatedAt
                )
            ],

            [
                "Filtros aplicados",
                getFilterDescription()
            ],

            [],

            [
                "Productos incluidos",
                products.length
            ],

            [
                "Insumos",
                insumos
            ],

            [
                "Generales",
                generales
            ],

            [
                "Unidades en stock",
                totalStock
            ],

            [
                "Productos en stock bajo",
                lowStock
            ],

            [
                "Valor del inventario",
                inventoryValue
            ]

        ];


        const sheet =
            XLSX.utils.aoa_to_sheet(
                data
            );


        sheet["!cols"] = [

            {
                wch:
                    28
            },

            {
                wch:
                    70
            }

        ];


        if (
            sheet["B10"]
        ) {

            sheet["B10"].z =
                "#,##0.000";

        }


        if (
            sheet["B12"]
        ) {

            sheet["B12"].z =
                "$#,##0.00";

        }


        return sheet;

    }


    // =====================================================
    // FORMATOS NUMÉRICOS
    // =====================================================

    function applyNumberFormats(
        sheet,
        rowCount
    ) {


        for (

            let row = 2;

            row <=
            rowCount + 1;

            row += 1

        ) {


            const stockCell =
                sheet[
                    `K${row}`
                ];


            const minCell =
                sheet[
                    `L${row}`
                ];


            const costCell =
                sheet[
                    `M${row}`
                ];


            const valueCell =
                sheet[
                    `N${row}`
                ];


            if (
                stockCell
            ) {

                stockCell.z =
                    "#,##0.000";

            }


            if (
                minCell
            ) {

                minCell.z =
                    "#,##0.000";

            }


            if (
                costCell
            ) {

                costCell.z =
                    "$#,##0.00";

            }


            if (
                valueCell
            ) {

                valueCell.z =
                    "$#,##0.00";

            }

        }

    }


    // =====================================================
    // RESPETAR FILTROS DE PRODUCTOS
    // =====================================================

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


        const type =
            document
                .getElementById(
                    "warehouseProductTypeFilter"
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


        return wh.state.products
            .filter(
                product => {


                    const decorated =
                        wh.decorateProduct(
                            product
                        );


                    const haystack =
                        wh.normalize(

                            [

                                product.folio,

                                product.code,

                                product.description_main,

                                product.description_long,

                                product.location,

                                decorated.category?.name,

                                decorated.brand?.name

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
                        type
                        &&
                        (
                            product.product_type
                            ||
                            "general"
                        ) !==
                        type
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


                        const minimum =
                            Number(
                                product.minimum_stock
                                ||
                                0
                            );


                        if (
                            !product.active

                            ||

                            minimum <=
                            0

                            ||

                            Number(
                                product.stock
                                ||
                                0
                            )
                            >
                            minimum
                        ) {

                            return false;

                        }

                    }


                    return true;

                }
            );

    }


    // =====================================================
    // DESCRIPCIÓN DE FILTROS
    // =====================================================

    function getFilterDescription() {


        const parts =
            [];


        const search =
            document
                .getElementById(
                    "warehouseProductSearch"
                )
                ?.value
                .trim();


        if (
            search
        ) {

            parts.push(
                `Búsqueda: ${search}`
            );

        }


        addSelectedFilter(
            parts,
            "warehouseProductCategoryFilter",
            "Categoría"
        );


        addSelectedFilter(
            parts,
            "warehouseProductBrandFilter",
            "Marca"
        );


        addSelectedFilter(
            parts,
            "warehouseProductLabelFilter",
            "Etiqueta"
        );


        addSelectedFilter(
            parts,
            "warehouseProductTypeFilter",
            "Tipo"
        );


        addSelectedFilter(
            parts,
            "warehouseProductStatusFilter",
            "Estado"
        );


        return parts.length

            ?

            parts.join(
                " · "
            )

            :

            "Sin filtros";

    }


    function addSelectedFilter(
        parts,
        id,
        label
    ) {


        const select =
            document.getElementById(
                id
            );


        if (
            !select
            ||
            !select.value
        ) {

            return;

        }


        const text =
            select
                .selectedOptions
                ?.[0]
                ?.textContent
                ?.trim();


        if (
            text
        ) {

            parts.push(
                `${label}: ${text}`
            );

        }

    }


    // =====================================================
    // CARGAR SHEETJS SOLO CUANDO SE NECESITA
    // =====================================================

    async function ensureExcelLibrary() {


        if (
            window.XLSX
        ) {

            return;

        }


        if (
            libraryPromise
        ) {

            return libraryPromise;

        }


        libraryPromise =
            loadScript(

                "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"

            );


        try {

            await libraryPromise;


            if (
                !window.XLSX
            ) {

                throw new Error(
                    "SheetJS no quedó disponible."
                );

            }

        }

        catch (
            error
        ) {

            libraryPromise =
                null;


            throw error;

        }

    }


    function loadScript(
        src
    ) {


        return new Promise(
            (
                resolve,
                reject
            ) => {


                const existing =
                    document.querySelector(
                        `script[src="${src}"]`
                    );


                if (
                    existing
                ) {


                    if (
                        window.XLSX
                    ) {

                        resolve();

                        return;

                    }


                    existing.addEventListener(

                        "load",

                        resolve,

                        {
                            once:
                                true
                        }

                    );


                    existing.addEventListener(

                        "error",

                        reject,

                        {
                            once:
                                true
                        }

                    );


                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    src;


                script.async =
                    true;


                script.addEventListener(

                    "load",

                    resolve,

                    {
                        once:
                            true
                    }

                );


                script.addEventListener(

                    "error",

                    reject,

                    {
                        once:
                            true
                    }

                );


                document.head.appendChild(
                    script
                );

            }
        );

    }


    function formatDateTime(
        value
    ) {


        return new Intl
            .DateTimeFormat(

                "es-MX",

                {

                    dateStyle:
                        "medium",

                    timeStyle:
                        "short"

                }

            )
            .format(
                value
            );

    }

})();