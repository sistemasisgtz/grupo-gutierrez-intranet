// =========================================================
// GRUPO GUTIERREZ
// ALMACÉN · HISTORIAL GLOBAL
// =========================================================

(() => {

    "use strict";


    let wh;

    let events =
        [];


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


    async function init() {


        wh =
            window.GGWarehouse;


        bindEvents();


        await loadHistory();


        document.addEventListener(
            "ggwarehouse:history-refresh",
            loadHistory
        );


        document.addEventListener(
            "ggwarehouse:refresh",
            loadHistory
        );

    }


    function bindEvents() {


        [

            "warehouseHistorySearch",

            "warehouseHistoryUserFilter",

            "warehouseHistoryTypeFilter",

            "warehouseHistoryDateFrom",

            "warehouseHistoryDateTo"

        ]
        .forEach(
            id => {


                document
                    .getElementById(
                        id
                    )
                    ?.addEventListener(
                        "input",
                        render
                    );


                document
                    .getElementById(
                        id
                    )
                    ?.addEventListener(
                        "change",
                        render
                    );

            }
        );

    }


    async function loadHistory() {


        if (
            !wh
        ) {

            return;

        }


        const [

            productResult,

            toolResult

        ] =
            await Promise.all([

                wh.db
                    .from(
                        "warehouse_product_history"
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
                        750
                    ),

                wh.db
                    .from(
                        "warehouse_tool_history"
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
                        500
                    )

            ]);


        if (
            productResult.error
        ) {

            console.error(
                "[HISTORIAL PRODUCTOS]",
                productResult.error
            );


            wh.toast(
                "No se pudo cargar el historial de productos.",
                true
            );


            return;

        }


        if (
            toolResult.error
        ) {

            console.error(
                "[HISTORIAL HERRAMIENTAS]",
                toolResult.error
            );

        }


        const productEvents =
            (
                productResult.data
                ||
                []
            )
            .map(
                item => ({

                    source:
                        "product",

                    type:
                        item.event_type,

                    subject:

                        `${item.product_folio || "—"} · ${item.product_description || "Producto"}`,

                    subline:

                        `${item.summary}${
                            item.product_code
                                ?
                                ` · ${item.product_code}`
                                :
                                ""
                        }`,

                    user_email:
                        item.user_email,

                    created_at:
                        item.created_at,

                    search:

                        `${item.product_folio || ""} ${item.product_code || ""} ${item.product_description || ""} ${item.summary || ""} ${item.user_email || ""}`

                })
            );


        const toolEvents =
            (
                toolResult.data
                ||
                []
            )
            .map(
                item => ({

                    source:
                        "tool",

                    type:
                        `tool_${item.event_type}`,

                    subject:

                        `${item.tool_name || "Herramienta"}${
                            item.group_name
                                ?
                                ` · ${item.group_name}`
                                :
                                ""
                        }`,

                    subline:

                        `Estatus: ${toolStatusLabel(item.old_status)} → ${toolStatusLabel(item.new_status)}${
                            item.responsible_name
                                ?
                                ` · ${item.responsible_name}`
                                :
                                ""
                        }${
                            item.note
                                ?
                                ` · ${item.note}`
                                :
                                ""
                        }`,

                    user_email:
                        item.user_email,

                    created_at:
                        item.created_at,

                    search:

                        `${item.tool_name || ""} ${item.group_name || ""} ${item.responsible_name || ""} ${item.note || ""} ${item.user_email || ""}`

                })
            );


        events =
            [

                ...productEvents,

                ...toolEvents

            ]
            .sort(

                (
                    a,
                    b
                ) =>

                    new Date(
                        b.created_at
                    )

                    -

                    new Date(
                        a.created_at
                    )

            );


        refreshFilters();

        render();

    }


    function refreshFilters() {


        const userSelect =
            document.getElementById(
                "warehouseHistoryUserFilter"
            );


        const typeSelect =
            document.getElementById(
                "warehouseHistoryTypeFilter"
            );


        const users =
            [

                ...new Set(

                    events
                        .map(
                            item =>
                                item.user_email
                        )
                        .filter(
                            Boolean
                        )

                )

            ]
            .sort();


        const types =
            [

                ...new Set(

                    events
                        .map(
                            item =>
                                item.type
                        )
                        .filter(
                            Boolean
                        )

                )

            ]
            .sort();


        if (
            userSelect
        ) {


            const current =
                userSelect.value;


            userSelect.innerHTML = `

                <option value="">
                    Todos los usuarios
                </option>

                ${
                    users
                        .map(
                            user => `

                                <option
                                    value="${
                                        wh.escapeHtml(
                                            user
                                        )
                                    }"
                                >
                                    ${
                                        wh.escapeHtml(
                                            user
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


            userSelect.value =
                current;

        }


        if (
            typeSelect
        ) {


            const current =
                typeSelect.value;


            typeSelect.innerHTML = `

                <option value="">
                    Todos los movimientos
                </option>

                ${
                    types
                        .map(
                            type => `

                                <option value="${type}">
                                    ${
                                        wh.escapeHtml(
                                            typeLabel(
                                                type
                                            )
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


            typeSelect.value =
                current;

        }

    }


    function render() {


        if (
            !wh
        ) {

            return;

        }


        const host =
            document.getElementById(
                "warehouseHistoryList"
            );


        const count =
            document.getElementById(
                "warehouseHistoryCount"
            );


        if (
            !host
        ) {

            return;

        }


        const search =
            wh.normalize(
                document
                    .getElementById(
                        "warehouseHistorySearch"
                    )
                    ?.value
            );


        const user =
            document
                .getElementById(
                    "warehouseHistoryUserFilter"
                )
                ?.value
            ||
            "";


        const type =
            document
                .getElementById(
                    "warehouseHistoryTypeFilter"
                )
                ?.value
            ||
            "";


        const from =
            document
                .getElementById(
                    "warehouseHistoryDateFrom"
                )
                ?.value
            ||
            "";


        const to =
            document
                .getElementById(
                    "warehouseHistoryDateTo"
                )
                ?.value
            ||
            "";


        const filtered =
            events.filter(
                item => {


                    if (
                        search

                        &&

                        !wh.normalize(
                            item.search
                        )
                        .includes(
                            search
                        )
                    ) {

                        return false;

                    }


                    if (
                        user
                        &&
                        item.user_email !==
                        user
                    ) {

                        return false;

                    }


                    if (
                        type
                        &&
                        item.type !==
                        type
                    ) {

                        return false;

                    }


                    if (
                        from
                    ) {

                        const date =
                            new Date(
                                item.created_at
                            );


                        const start =
                            new Date(
                                `${from}T00:00:00`
                            );


                        if (
                            date <
                            start
                        ) {

                            return false;

                        }

                    }


                    if (
                        to
                    ) {

                        const date =
                            new Date(
                                item.created_at
                            );


                        const end =
                            new Date(
                                `${to}T23:59:59.999`
                            );


                        if (
                            date >
                            end
                        ) {

                            return false;

                        }

                    }


                    return true;

                }
            );


        if (
            count
        ) {

            count.textContent =

                `${filtered.length} ${
                    filtered.length ===
                    1
                        ?
                        "evento"
                        :
                        "eventos"
                }`;

        }


        if (
            !filtered.length
        ) {

            host.innerHTML = `

                <div class="warehouse-empty">
                    No hay eventos que coincidan
                    con los filtros.
                </div>

            `;


            return;

        }


        host.innerHTML =
            filtered
                .map(
                    item => `

                        <article class="warehouse-history-item">


                            <span class="warehouse-history-badge">
                                ${
                                    wh.escapeHtml(
                                        typeShort(
                                            item.type
                                        )
                                    )
                                }
                            </span>


                            <div class="warehouse-history-copy">

                                <strong>
                                    ${
                                        wh.escapeHtml(
                                            item.subject
                                        )
                                    }
                                </strong>

                                <small>
                                    ${
                                        wh.escapeHtml(
                                            item.subline
                                        )
                                    }
                                </small>

                            </div>


                            <div class="warehouse-history-meta">

                                <strong>
                                    ${
                                        wh.escapeHtml(
                                            item.user_email
                                            ||
                                            "Usuario"
                                        )
                                    }
                                </strong>

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
                );

    }


    function typeLabel(
        type
    ) {


        return ({

            product_created:
                "Alta de producto",

            product_updated:
                "Edición de producto",

            product_archived:
                "Producto archivado",

            stock_in:
                "Ingreso",

            stock_out:
                "Egreso",

            inventory_adjustment:
                "Ajuste de inventario",

            cost_updated:
                "Cambio de costo",

            tool_status_changed:
                "Estatus de herramienta"

        })[
            type
        ]
        ||
        type;

    }


    function typeShort(
        type
    ) {


        return ({

            product_created:
                "ALTA",

            product_updated:
                "EDIT",

            product_archived:
                "BAJA",

            stock_in:
                "IN",

            stock_out:
                "OUT",

            inventory_adjustment:
                "INV",

            cost_updated:
                "COSTO",

            tool_status_changed:
                "TOOL"

        })[
            type
        ]
        ||
        "EVT";

    }


    function toolStatusLabel(
        status
    ) {


        return ({

            available:
                "Disponible",

            loan_external:
                "Prestada a externo",

            workshop:
                "En taller",

            lost:
                "Extravío",

            damaged:
                "Daño",

            loan_collaborator:
                "Prestada a colaborador"

        })[
            status
        ]
        ||
        status
        ||
        "—";

    }

})();