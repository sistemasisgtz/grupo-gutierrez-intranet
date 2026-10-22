// =========================================================
// GRUPO GUTIERREZ
// SOLICITUDES DE PAGO
// =========================================================

(() => {

    "use strict";


    let fin =
        null;


    const state = {

        groupEntries:
            [],

        requests:
            []

    };


    document.addEventListener(
        "ggfinance:ready",
        init,
        {
            once:
                true
        }
    );


    function init() {


        fin =
            window.GGFinance;


        bindTabs();

        bindActions();

        bindFilters();

        renderTypeFilters();


        if (
            !fin.state.myGroups.length
        ) {

            showNoGroup();

            return;

        }


        showWorkspace();

        renderGroupSelector();

        loadCurrentGroup();

    }


    // =====================================================
    // TABS
    // =====================================================

    function bindTabs() {


        document
            .querySelectorAll(
                "[data-finance-tab]"
            )
            .forEach(
                button => {

                    button.addEventListener(

                        "click",

                        () => {

                            const target =
                                button.dataset
                                    .financeTab;


                            document
                                .querySelectorAll(
                                    "[data-finance-tab]"
                                )
                                .forEach(
                                    item => {

                                        item.classList.toggle(

                                            "active",

                                            item ===
                                            button

                                        );

                                    }
                                );


                            document
                                .querySelectorAll(
                                    "[data-finance-panel]"
                                )
                                .forEach(
                                    panel => {

                                        panel.classList.toggle(

                                            "active",

                                            panel.dataset
                                                .financePanel ===
                                                target

                                        );

                                    }
                                );

                        }

                    );

                }
            );

    }


    // =====================================================
    // EVENTOS
    // =====================================================

    function bindActions() {


        document
            .getElementById(
                "paymentRefresh"
            )
            ?.addEventListener(
                "click",
                refreshAll
            );


        document
            .getElementById(
                "paymentRequestAccess"
            )
            ?.addEventListener(
                "click",
                openAccessRequestModal
            );


        document
            .getElementById(
                "paymentGroupSelect"
            )
            ?.addEventListener(

                "change",

                event => {

                    fin.state.currentGroupId =
                        event.target.value;


                    loadCurrentGroup();

                }

            );


        document
            .getElementById(
                "paymentRequestersButton"
            )
            ?.addEventListener(

                "click",

                () =>
                    openCatalogModal(
                        "requester"
                    )

            );


        document
            .getElementById(
                "paymentProvidersButton"
            )
            ?.addEventListener(

                "click",

                () =>
                    openCatalogModal(
                        "provider"
                    )

            );


        document
            .getElementById(
                "paymentClientsButton"
            )
            ?.addEventListener(

                "click",

                () =>
                    openCatalogModal(
                        "client"
                    )

            );


        document
            .getElementById(
                "paymentNewRequest"
            )
            ?.addEventListener(
                "click",
                openNewRequestModal
            );


        document
            .getElementById(
                "paymentGroupRequests"
            )
            ?.addEventListener(
                "click",
                handleRequestTableClick
            );


        document
            .getElementById(
                "paymentMyRequests"
            )
            ?.addEventListener(
                "click",
                handleRequestTableClick
            );

    }


    function bindFilters() {


        [

            "paymentGroupSearch",

            "paymentGroupAuthorizationFilter",

            "paymentGroupPaidFilter",

            "paymentGroupTypeFilter",

            "paymentGroupDateFrom",

            "paymentGroupDateTo",

            "paymentMySearch",

            "paymentMyAuthorizationFilter",

            "paymentMyPaidFilter",

            "paymentMyTypeFilter",

            "paymentMyDateFrom",

            "paymentMyDateTo"

        ]
        .forEach(
            id => {

                const node =
                    document.getElementById(
                        id
                    );


                node?.addEventListener(
                    "input",
                    renderAll
                );


                node?.addEventListener(
                    "change",
                    renderAll
                );

            }
        );

    }


    // =====================================================
    // SIN GRUPO
    // =====================================================

    function showNoGroup() {


        document
            .getElementById(
                "paymentNoGroup"
            )
            ?.classList
            .add(
                "active"
            );


        document
            .getElementById(
                "paymentWorkspace"
            )
            ?.classList
            .add(
                "hidden"
            );


        const context =
            document.getElementById(
                "paymentGroupContext"
            );


        if (
            context
        ) {

            context.style.display =
                "none";

        }

    }


    function showWorkspace() {


        document
            .getElementById(
                "paymentNoGroup"
            )
            ?.classList
            .remove(
                "active"
            );


        document
            .getElementById(
                "paymentWorkspace"
            )
            ?.classList
            .remove(
                "hidden"
            );


        const context =
            document.getElementById(
                "paymentGroupContext"
            );


        if (
            context
        ) {

            context.style.display =
                "";

        }

    }


    // =====================================================
    // GRUPOS
    // =====================================================

    function renderGroupSelector() {


        const select =
            document.getElementById(
                "paymentGroupSelect"
            );


        if (
            !select
        ) {

            return;

        }


        select.innerHTML =
            fin.state.myGroups
                .map(
                    group => `

                        <option
                            value="${group.group_id}"
                            ${
                                group.group_id ===
                                fin.state.currentGroupId

                                    ?

                                    "selected"

                                    :

                                    ""
                            }
                        >
                            ${
                                fin.escapeHtml(
                                    group.group_name
                                )
                            }
                            ·
                            ${
                                fin.escapeHtml(
                                    group.prefix
                                )
                            }
                        </option>

                    `
                )
                .join(
                    ""
                );

    }


    function currentGroup() {


        return (
            fin.state.myGroups
                .find(
                    group =>
                        group.group_id ===
                        fin.state.currentGroupId
                )
            ||
            null
        );

    }


    async function refreshAll() {


        try {

            await fin.loadMyGroups();


            if (
                !fin.state.myGroups.length
            ) {

                showNoGroup();

                return;

            }


            showWorkspace();

            renderGroupSelector();


            await loadCurrentGroup();


            fin.toast(
                "Solicitudes actualizadas."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[SOLICITUDES REFRESH]",
                error
            );


            fin.toast(
                error.message
                ||
                "No se pudo actualizar.",
                true
            );

        }

    }


    async function loadCurrentGroup() {


        if (
            !fin.state.currentGroupId
        ) {

            return;

        }


        try {

            const [
                entries,
                requests
            ] =
                await Promise.all([

                    fin.loadGroupEntries(
                        fin.state.currentGroupId
                    ),

                    loadRequests(
                        fin.state.currentGroupId
                    )

                ]);


            state.groupEntries =
                entries;


            state.requests =
                requests;


            renderAll();

        }

        catch (
            error
        ) {

            console.error(
                "[SOLICITUDES LOAD]",
                error
            );


            fin.toast(
                "No se pudieron cargar las solicitudes.",
                true
            );

        }

    }


    async function loadRequests(
        groupId
    ) {


        const {
            data,
            error
        } =
            await fin.db
                .from(
                    "finance_payment_requests"
                )
                .select(
                    "*"
                )
                .eq(
                    "group_id",
                    groupId
                )
                .order(
                    "request_date",
                    {
                        ascending:
                            false
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (
            error
        ) {

            throw error;

        }


        return data
        ||
        [];

    }


    // =====================================================
    // FILTRO TIPO
    // =====================================================

    function renderTypeFilters() {


        const types =
            fin.unique(

                fin.state.rules
                    .map(
                        rule =>
                            rule.movement_type
                    )

            );


        [

            "paymentGroupTypeFilter",

            "paymentMyTypeFilter"

        ]
        .forEach(
            id => {

                const select =
                    document.getElementById(
                        id
                    );


                if (
                    !select
                ) {

                    return;

                }


                select.innerHTML = `

                    <option value="">
                        Todos los tipos
                    </option>

                    ${
                        types
                            .map(
                                type => `

                                    <option value="${
                                        fin.escapeHtml(
                                            type
                                        )
                                    }">
                                        ${
                                            fin.escapeHtml(
                                                type
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

            }
        );

    }


    // =====================================================
    // RENDER GENERAL
    // =====================================================

    function renderAll() {


        renderMetrics();

        renderGroupRequests();

        renderMyRequests();

    }


    function renderMetrics() {


        const requests =
            state.requests;


        setText(
            "paymentMetricTotal",
            requests.length
        );


        setText(

            "paymentMetricPending",

            requests.filter(
                request =>
                    request.authorization_status ===
                    "pending"
            ).length

        );


        setText(

            "paymentMetricAuthorized",

            requests.filter(
                request =>

                    request.authorization_status ===
                    "authorized"

                    &&

                    !request.payment_confirmed
            ).length

        );


        setText(

            "paymentMetricPaid",

            requests.filter(
                request =>
                    request.payment_confirmed
            ).length

        );

    }


    function renderGroupRequests() {


        const filtered =
            filterRequests(

                state.requests,

                "paymentGroup"

            );


        renderRequestTable(

            "paymentGroupRequests",

            "paymentGroupCount",

            filtered

        );

    }


    function renderMyRequests() {


        const mine =
            state.requests
                .filter(
                    request =>
                        request.created_by ===
                        fin.state.user.id
                );


        const filtered =
            filterRequests(

                mine,

                "paymentMy"

            );


        renderRequestTable(

            "paymentMyRequests",

            "paymentMyCount",

            filtered

        );

    }


    function filterRequests(
        requests,
        prefix
    ) {


        const search =
            fin.normalize(
                document
                    .getElementById(
                        `${prefix}Search`
                    )
                    ?.value
            );


        const authorization =
            document
                .getElementById(
                    `${prefix}AuthorizationFilter`
                )
                ?.value
            ||
            "";


        const paid =
            document
                .getElementById(
                    `${prefix}PaidFilter`
                )
                ?.value
            ||
            "";


        const type =
            document
                .getElementById(
                    `${prefix}TypeFilter`
                )
                ?.value
            ||
            "";


        const from =
            document
                .getElementById(
                    `${prefix}DateFrom`
                )
                ?.value
            ||
            "";


        const to =
            document
                .getElementById(
                    `${prefix}DateTo`
                )
                ?.value
            ||
            "";


        return requests.filter(
            request => {


                if (
                    authorization

                    &&

                    request.authorization_status !==
                    authorization
                ) {

                    return false;

                }


                if (
                    paid ===
                    "paid"

                    &&

                    !request.payment_confirmed
                ) {

                    return false;

                }


                if (
                    paid ===
                    "unpaid"

                    &&

                    request.payment_confirmed
                ) {

                    return false;

                }


                if (
                    type

                    &&

                    request.movement_type !==
                    type
                ) {

                    return false;

                }


                if (
                    from

                    &&

                    request.request_date <
                    from
                ) {

                    return false;

                }


                if (
                    to

                    &&

                    request.request_date >
                    to
                ) {

                    return false;

                }


                if (
                    search
                ) {


                    const haystack =
                        fin.normalize(

                            [

                                request.request_folio,

                                request.group_name_snapshot,

                                request.company_name,

                                request.movement_type,

                                request.area_group,

                                request.classification,

                                request.category,

                                request.behavior,

                                request.requester_name,

                                request.provider_name,

                                request.client_name,

                                request.oc_rem,

                                request.project,

                                request.invoice_folio,

                                request.invoice_concept,

                                request.payment_method_requested,

                                request.additional_comments,

                                request.created_by_email

                            ]
                            .join(
                                " "
                            )

                        );


                    if (
                        !haystack.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );

    }


    // =====================================================
    // TABLA
    // =====================================================

    function renderRequestTable(
        hostId,
        countId,
        requests
    ) {


        const host =
            document.getElementById(
                hostId
            );


        if (
            !host
        ) {

            return;

        }


        setText(

            countId,

            `${requests.length} ${
                requests.length ===
                1
                    ?
                    "solicitud"
                    :
                    "solicitudes"
            }`

        );


        if (
            !requests.length
        ) {

            host.innerHTML = `

                <div class="finance-empty">

                    No hay solicitudes que coincidan
                    con los filtros.

                </div>

            `;


            return;

        }


        host.innerHTML = `

            <table class="finance-table">

                <thead>

                    <tr>

                        <th>Autorizado</th>

                        <th>Fecha autorización</th>

                        <th>Pago</th>

                        <th>Fecha pago</th>

                        <th>Fecha solicitud</th>

                        <th>ID</th>

                        <th>Empresa / Grupo</th>

                        <th>Tipo</th>

                        <th>Área agrupadora</th>

                        <th>Clasificación</th>

                        <th>Categoría</th>

                        <th>Comportamiento</th>

                        <th>Solicitante</th>

                        <th>Proveedor</th>

                        <th>Cliente</th>

                        <th>OC / REM</th>

                        <th>Proyecto</th>

                        <th>Folio factura</th>

                        <th>Concepto factura</th>

                        <th>Factura Finanzas</th>

                        <th>Importe solicitado</th>

                        <th>Importe real</th>

                        <th>Vencimiento</th>

                        <th>Método</th>

                        <th>Solicitado por</th>

                        <th>Comentarios</th>

                        <th>Semana pago</th>

                        <th>Mes pago</th>

                        <th>Año pago</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        requests
                            .map(
                                renderRequestRow
                            )
                            .join(
                                ""
                            )
                    }

                </tbody>

            </table>

        `;

    }


    function renderRequestRow(
        request
    ) {


        const authClass =
            request.authorization_status ===
            "authorized"

                ?

                "authorized"

                :

                (
                    request.authorization_status ===
                    "rejected"

                        ?

                        "rejected"

                        :

                        "pending"
                );


        return `

            <tr data-payment-request="${request.id}">


                <td>

                    <span
                        class="finance-status ${authClass}"
                    >
                        ${
                            fin.escapeHtml(
                                fin.authorizationLabel(
                                    request.authorization_status
                                )
                            )
                        }
                    </span>

                </td>


                <td>
                    ${
                        fin.dateTime(
                            request.authorization_date
                        )
                    }
                </td>


                <td>

                    <span
                        class="
                            finance-status
                            ${
                                request.payment_confirmed

                                    ?

                                    "paid"

                                    :

                                    "no"
                            }
                        "
                    >
                        ${
                            request.payment_confirmed

                                ?

                                "Pagado"

                                :

                                "Sin pagar"
                        }
                    </span>

                </td>


                <td>
                    ${
                        fin.date(
                            request.payment_date
                        )
                    }
                </td>


                <td>
                    ${
                        fin.date(
                            request.request_date
                        )
                    }
                </td>


                <td>

                    <strong>
                        ${
                            fin.escapeHtml(
                                request.request_folio
                            )
                        }
                    </strong>

                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.group_name_snapshot
                        )
                    }
                </td>


                <td>

                    <span
                        class="finance-type"
                        data-type="${
                            fin.escapeHtml(
                                request.movement_type
                            )
                        }"
                    >
                        ${
                            fin.escapeHtml(
                                request.movement_type
                            )
                        }
                    </span>

                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.area_group
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.classification
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.category
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.behavior
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.requester_name
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.provider_name
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.client_name
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.oc_rem
                            ||
                            "—"
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.project
                            ||
                            "—"
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.invoice_folio
                            ||
                            "—"
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.invoice_concept
                            ||
                            "—"
                        )
                    }
                </td>


                <td>

                    <span
                        class="
                            finance-status
                            ${
                                request.finance_invoice_received

                                    ?

                                    "yes"

                                    :

                                    "no"
                            }
                        "
                    >

                        ${
                            request.finance_invoice_received

                                ?

                                "Sí"

                                :

                                "No"
                        }

                    </span>

                </td>


                <td class="finance-money">

                    ${
                        fin.money(
                            request.requested_amount
                        )
                    }

                </td>


                <td class="finance-money">

                    ${
                        request.actual_amount ===
                        null

                            ?

                            "—"

                            :

                            fin.money(
                                request.actual_amount
                            )
                    }

                </td>


                <td>
                    ${
                        fin.date(
                            request.due_date
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.payment_method_requested
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.created_by_email
                        )
                    }
                </td>


                <td>
                    ${
                        fin.escapeHtml(
                            request.additional_comments
                            ||
                            "—"
                        )
                    }
                </td>


                <td>
                    ${
                        request.payment_week
                        ??
                        "—"
                    }
                </td>


                <td>
                    ${
                        request.payment_month
                        ??
                        "—"
                    }
                </td>


                <td>
                    ${
                        request.payment_year
                        ??
                        "—"
                    }
                </td>


            </tr>

        `;

    }


    function handleRequestTableClick(
        event
    ) {


        const row =
            event.target.closest(
                "[data-payment-request]"
            );


        if (
            !row
        ) {

            return;

        }


        const request =
            state.requests
                .find(
                    item =>
                        item.id ===
                        row.dataset
                            .paymentRequest
                );


        if (
            request
        ) {

            openRequestDetail(
                request
            );

        }

    }


    // =====================================================
    // DETALLE / IMPORTE REAL
    // =====================================================

    function openRequestDetail(
        request
    ) {


        const canEditAmount =

            !request.payment_confirmed

            &&

            request.authorization_status !==
            "rejected";


        fin.openModal({

            kicker:
                request.request_folio,

            title:
                "Detalle de solicitud",

            wide:
                true,

            body: `

                <div class="finance-form-grid">


                    ${detailField(
                        "Grupo",
                        request.group_name_snapshot
                    )}


                    ${detailField(
                        "Tipo",
                        request.movement_type
                    )}


                    ${detailField(
                        "Área agrupadora",
                        request.area_group
                    )}


                    ${detailField(
                        "Clasificación",
                        request.classification
                    )}


                    ${detailField(
                        "Categoría",
                        request.category
                    )}


                    ${detailField(
                        "Comportamiento",
                        request.behavior
                    )}


                    ${detailField(
                        "Solicitante",
                        request.requester_name
                    )}


                    ${detailField(
                        "Proveedor",
                        request.provider_name
                    )}


                    ${detailField(
                        "Cliente",
                        request.client_name
                    )}


                    ${detailField(
                        "OC / REM",
                        request.oc_rem
                        ||
                        "—"
                    )}


                    ${detailField(
                        "Proyecto",
                        request.project
                        ||
                        "—"
                    )}


                    ${detailField(
                        "Folio factura",
                        request.invoice_folio
                        ||
                        "—"
                    )}


                    ${detailField(
                        "Concepto factura",
                        request.invoice_concept
                        ||
                        "—",
                        true
                    )}


                    ${detailField(
                        "Importe solicitado",
                        fin.money(
                            request.requested_amount
                        )
                    )}


                    <div class="finance-field">

                        <label>
                            Importe real
                        </label>

                        <input
                            id="paymentDetailActualAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            value="${
                                request.actual_amount
                                ??
                                ""
                            }"
                            ${
                                canEditAmount

                                    ?

                                    ""

                                    :

                                    "disabled"
                            }
                        >

                        <small class="finance-help">

                            ${
                                canEditAmount

                                    ?

                                    "Puede capturarse después del alta."

                                    :

                                    "El importe ya no puede modificarse desde Solicitudes."
                            }

                        </small>

                    </div>


                    ${detailField(
                        "Fecha solicitud",
                        fin.date(
                            request.request_date
                        )
                    )}


                    ${detailField(
                        "Fecha vencimiento",
                        fin.date(
                            request.due_date
                        )
                    )}


                    ${detailField(
                        "Método solicitado",
                        request.payment_method_requested
                    )}


                    ${detailField(
                        "Autorización",
                        fin.authorizationLabel(
                            request.authorization_status
                        )
                    )}


                    ${detailField(
                        "Fecha autorización",
                        fin.dateTime(
                            request.authorization_date
                        )
                    )}


                    ${detailField(
                        "Pago",
                        request.payment_confirmed
                            ?
                            "Confirmado"
                            :
                            "Pendiente"
                    )}


                    ${detailField(
                        "Fecha de pago",
                        fin.date(
                            request.payment_date
                        )
                    )}


                    ${detailField(
                        "Factura Finanzas",
                        request.finance_invoice_received
                            ?
                            "Sí"
                            :
                            "No"
                    )}


                    ${detailField(
                        "Solicitado por",
                        request.created_by_email
                    )}


                    ${detailField(
                        "Comentarios",
                        request.additional_comments
                        ||
                        "—",
                        true
                    )}


                </div>


                <div
                    id="paymentDetailMessage"
                    class="finance-form-message"
                >
                </div>

            `,

            footer:

                canEditAmount

                    ?

                    `

                        <button
                            type="button"
                            class="finance-button"
                            data-payment-close-detail
                        >
                            Cerrar
                        </button>

                        <button
                            type="button"
                            class="finance-button primary"
                            data-payment-save-actual
                        >
                            Guardar importe real
                        </button>

                    `

                    :

                    `

                        <button
                            type="button"
                            class="finance-button primary"
                            data-payment-close-detail
                        >
                            Cerrar
                        </button>

                    `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "[data-payment-close-detail]"
                        )
                        ?.addEventListener(
                            "click",
                            fin.closeModal
                        );


                    root
                        .querySelector(
                            "[data-payment-save-actual]"
                        )
                        ?.addEventListener(

                            "click",

                            () =>
                                saveActualAmount(
                                    request
                                )

                        );

                }

        });

    }


    async function saveActualAmount(
        request
    ) {


        const input =
            document.getElementById(
                "paymentDetailActualAmount"
            );


        const message =
            document.getElementById(
                "paymentDetailMessage"
            );


        const value =
            input?.value ===
            ""

                ?

                null

                :

                Number(
                    input.value
                );


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_member_update_actual_amount",

                    {

                        p_request_id:
                            request.id,

                        p_actual_amount:
                            value

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            fin.closeModal();


            await loadCurrentGroup();


            fin.toast(
                "Importe real actualizado."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[IMPORTE REAL]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    error.message
                    ||
                    "No se pudo guardar.";

            }

        }

    }


    // =====================================================
    // SOLICITAR ACCESO
    // =====================================================

    function openAccessRequestModal() {


        fin.openModal({

            kicker:
                "SOLICITUD DE ACCESO",

            title:
                "Solicitar grupo de pago",

            body: `

                <div class="finance-field">

                    <label>
                        Mensaje para Finanzas
                    </label>

                    <textarea
                        id="paymentAccessMessage"
                        placeholder="Ej. Favor de agregarme al grupo LO."
                    ></textarea>

                    <small class="finance-help">
                        Finanzas recibirá tu correo automáticamente.
                    </small>

                </div>

                <div
                    id="paymentAccessMessageError"
                    class="finance-form-message"
                >
                </div>

            `,

            footer: `

                <button
                    type="button"
                    class="finance-button"
                    data-payment-access-cancel
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    class="finance-button primary"
                    data-payment-access-send
                >
                    Enviar solicitud
                </button>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "[data-payment-access-cancel]"
                        )
                        ?.addEventListener(
                            "click",
                            fin.closeModal
                        );


                    root
                        .querySelector(
                            "[data-payment-access-send]"
                        )
                        ?.addEventListener(
                            "click",
                            sendAccessRequest
                        );

                }

        });

    }


    async function sendAccessRequest() {


        const message =
            document
                .getElementById(
                    "paymentAccessMessage"
                )
                ?.value
                .trim()
            ||
            null;


        const errorNode =
            document.getElementById(
                "paymentAccessMessageError"
            );


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_request_group_access",

                    {
                        p_message:
                            message
                    }

                );


            if (
                error
            ) {

                throw error;

            }


            fin.closeModal();


            fin.toast(
                "Solicitud enviada a Finanzas."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[ACCESS REQUEST]",
                error
            );


            if (
                errorNode
            ) {

                errorNode.textContent =
                    error.message;

            }

        }

    }


    // =====================================================
    // CATÁLOGOS
    // =====================================================

    function catalogConfig(
        type
    ) {


        return ({

            requester: {

                title:
                    "Solicitantes",

                singular:
                    "solicitante",

                reference:
                    "Referencia / área"

            },

            provider: {

                title:
                    "Proveedores",

                singular:
                    "proveedor",

                reference:
                    "RFC / referencia"

            },

            client: {

                title:
                    "Clientes",

                singular:
                    "cliente",

                reference:
                    "RFC / referencia"

            }

        })[
            type
        ];

    }


    function openCatalogModal(
        type
    ) {


        const config =
            catalogConfig(
                type
            );


        if (
            !config
        ) {

            return;

        }


        fin.openModal({

            kicker:
                currentGroup()?.group_name
                ||
                "GRUPO",

            title:
                config.title,

            wide:
                true,

            body: `

                <form id="paymentCatalogForm">

                    <input
                        type="hidden"
                        id="paymentCatalogId"
                    >


                    <div class="finance-form-grid">


                        <div class="finance-field">

                            <label>
                                Nombre *
                            </label>

                            <input
                                id="paymentCatalogName"
                                required
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                ${
                                    fin.escapeHtml(
                                        config.reference
                                    )
                                }
                            </label>

                            <input id="paymentCatalogReference">

                        </div>


                    </div>


                    <div
                        id="paymentCatalogMessage"
                        class="finance-form-message"
                    >
                    </div>


                    <button
                        type="submit"
                        class="finance-button primary"
                    >
                        Guardar ${
                            fin.escapeHtml(
                                config.singular
                            )
                        }
                    </button>


                </form>


                <div
                    id="paymentCatalogList"
                    class="finance-catalog-list"
                >
                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "#paymentCatalogForm"
                        )
                        ?.addEventListener(

                            "submit",

                            event =>
                                saveCatalogEntry(
                                    event,
                                    type
                                )

                        );


                    root
                        .querySelector(
                            "#paymentCatalogList"
                        )
                        ?.addEventListener(

                            "click",

                            event =>
                                handleCatalogListClick(
                                    event,
                                    type
                                )

                        );


                    renderCatalogList(
                        type
                    );

                }

        });

    }


    function renderCatalogList(
        type
    ) {


        const host =
            document.getElementById(
                "paymentCatalogList"
            );


        if (
            !host
        ) {

            return;

        }


        const entries =
            state.groupEntries
                .filter(
                    item =>
                        item.entry_type ===
                        type
                );


        if (
            !entries.length
        ) {

            host.innerHTML = `

                <div class="finance-empty">

                    Aún no hay registros.

                </div>

            `;


            return;

        }


        host.innerHTML =
            entries
                .map(
                    entry => `

                        <article class="finance-catalog-item">


                            <div>

                                <strong>
                                    ${
                                        fin.escapeHtml(
                                            entry.name
                                        )
                                    }
                                </strong>

                                <small>
                                    ${
                                        fin.escapeHtml(
                                            entry.reference
                                            ||
                                            "Sin referencia"
                                        )
                                    }
                                </small>

                            </div>


                            <div class="finance-inline-actions">

                                <button
                                    type="button"
                                    class="finance-mini-button"
                                    data-edit-catalog-entry="${entry.id}"
                                >
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    class="finance-mini-button danger"
                                    data-delete-catalog-entry="${entry.id}"
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


    function handleCatalogListClick(
        event,
        type
    ) {


        const edit =
            event.target.closest(
                "[data-edit-catalog-entry]"
            );


        const remove =
            event.target.closest(
                "[data-delete-catalog-entry]"
            );


        if (
            edit
        ) {


            const entry =
                state.groupEntries
                    .find(
                        item =>
                            item.id ===
                            edit.dataset
                                .editCatalogEntry
                    );


            if (
                !entry
            ) {

                return;

            }


            document
                .getElementById(
                    "paymentCatalogId"
                )
                .value =
                entry.id;


            document
                .getElementById(
                    "paymentCatalogName"
                )
                .value =
                entry.name
                ||
                "";


            document
                .getElementById(
                    "paymentCatalogReference"
                )
                .value =
                entry.reference
                ||
                "";

        }


        if (
            remove
        ) {

            deleteCatalogEntry(

                remove.dataset
                    .deleteCatalogEntry,

                type

            );

        }

    }


    async function saveCatalogEntry(
        event,
        type
    ) {


        event.preventDefault();


        const form =
            event.currentTarget;


        const id =
            document
                .getElementById(
                    "paymentCatalogId"
                )
                ?.value
            ||
            null;


        const name =
            document
                .getElementById(
                    "paymentCatalogName"
                )
                ?.value
                .trim()
            ||
            "";


        const reference =
            document
                .getElementById(
                    "paymentCatalogReference"
                )
                ?.value
                .trim()
            ||
            null;


        const message =
            document.getElementById(
                "paymentCatalogMessage"
            );


        if (
            !name
        ) {

            return;

        }


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_save_group_catalog_entry",

                    {

                        p_entry_id:
                            id,

                        p_group_id:
                            fin.state.currentGroupId,

                        p_entry_type:
                            type,

                        p_name:
                            name,

                        p_reference:
                            reference

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            state.groupEntries =
                await fin.loadGroupEntries(
                    fin.state.currentGroupId
                );


            form.reset();


            document
                .getElementById(
                    "paymentCatalogId"
                )
                .value =
                "";


            renderCatalogList(
                type
            );


            fin.toast(
                "Registro guardado."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[CATÁLOGO]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    error.message
                    ||
                    "No se pudo guardar.";

            }

        }

    }


    async function deleteCatalogEntry(
        id,
        type
    ) {


        const entry =
            state.groupEntries
                .find(
                    item =>
                        item.id ===
                        id
                );


        if (
            !entry
        ) {

            return;

        }


        if (
            !window.confirm(
                `¿Eliminar "${entry.name}"?`
            )
        ) {

            return;

        }


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_delete_group_catalog_entry",

                    {
                        p_entry_id:
                            id
                    }

                );


            if (
                error
            ) {

                throw error;

            }


            state.groupEntries =
                await fin.loadGroupEntries(
                    fin.state.currentGroupId
                );


            renderCatalogList(
                type
            );


            fin.toast(
                "Registro eliminado."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[DELETE CATALOG]",
                error
            );


            fin.toast(
                error.message
                ||
                "No se pudo eliminar.",
                true
            );

        }

    }


    // =====================================================
    // NUEVA SOLICITUD
    // =====================================================

    function openNewRequestModal() {


        const group =
            currentGroup();


        if (
            !group
        ) {

            return;

        }


        const requesters =
            entriesOf(
                "requester"
            );


        const providers =
            entriesOf(
                "provider"
            );


        const clients =
            entriesOf(
                "client"
            );


        if (
            !requesters.length
            ||
            !providers.length
            ||
            !clients.length
        ) {

            fin.toast(
                "Primero da de alta al menos un solicitante, proveedor y cliente.",
                true
            );

            return;

        }


        const today =
            fin.todayISO();


        fin.openModal({

            kicker:
                group.group_name,

            title:
                "Nueva solicitud",

            extraWide:
                true,

            body: `

                <form id="paymentNewRequestForm">


                    <div class="finance-form-grid">


                        <div class="finance-field">

                            <label>
                                Fecha de solicitud
                            </label>

                            <input
                                id="paymentRequestDate"
                                type="date"
                                value="${today}"
                                readonly
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                ID
                            </label>

                            <input
                                value="${
                                    fin.escapeHtml(
                                        group.prefix
                                    )
                                }-AUTOMÁTICO"
                                readonly
                            >

                            <small class="finance-help">
                                El consecutivo definitivo se genera al enviar.
                            </small>

                        </div>


                        <div class="finance-field">

                            <label>
                                Grupo
                            </label>

                            <input
                                value="${
                                    fin.escapeHtml(
                                        group.group_name
                                    )
                                }"
                                readonly
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Tipo de movimiento
                            </label>

                            <input
                                id="paymentMovementType"
                                readonly
                                placeholder="Se asignará automáticamente"
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Área agrupadora *
                            </label>

                            <select
                                id="paymentArea"
                                required
                            >
                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Clasificación *
                            </label>

                            <select
                                id="paymentClassification"
                                required
                            >
                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Categoría *
                            </label>

                            <select
                                id="paymentCategory"
                                required
                            >
                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Comportamiento
                            </label>

                            <input
                                id="paymentBehavior"
                                readonly
                                placeholder="Automático"
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Solicitante *
                            </label>

                            <select
                                id="paymentRequester"
                                required
                            >

                                ${entryOptions(
                                    requesters
                                )}

                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Proveedor *
                            </label>

                            <select
                                id="paymentProvider"
                                required
                            >

                                ${entryOptions(
                                    providers
                                )}

                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Cliente *
                            </label>

                            <select
                                id="paymentClient"
                                required
                            >

                                ${entryOptions(
                                    clients
                                )}

                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                OC / REM
                            </label>

                            <input id="paymentOcRem">

                        </div>


                        <div class="finance-field">

                            <label>
                                Proyecto
                            </label>

                            <input
                                id="paymentProject"
                                placeholder="Proyecto / obra / referencia"
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Folio factura
                            </label>

                            <input id="paymentInvoiceFolio">

                        </div>


                        <div class="finance-field full">

                            <label>
                                Concepto factura
                            </label>

                            <textarea id="paymentInvoiceConcept"></textarea>

                        </div>


                        <div class="finance-field">

                            <label>
                                Importe solicitado *
                            </label>

                            <input
                                id="paymentRequestedAmount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                required
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Importe real
                            </label>

                            <input
                                value="Se captura después del alta"
                                disabled
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Fecha de vencimiento
                            </label>

                            <input
                                id="paymentDueDate"
                                type="date"
                                value="${
                                    fin.addDaysISO(
                                        today,
                                        4
                                    )
                                }"
                                readonly
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Método solicitado *
                            </label>

                            <select
                                id="paymentMethod"
                                required
                            >

                                <option value="">
                                    Selecciona...
                                </option>

                                ${paymentMethodOptions()}

                            </select>

                        </div>


                        <div class="finance-field full">

                            <label>
                                Comentarios adicionales
                            </label>

                            <textarea id="paymentComments"></textarea>

                        </div>


                    </div>


                    <div
                        id="paymentNewRequestMessage"
                        class="finance-form-message"
                    >
                    </div>


                </form>

            `,

            footer: `

                <button
                    type="button"
                    class="finance-button"
                    data-payment-new-cancel
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    form="paymentNewRequestForm"
                    class="finance-button primary"
                >
                    Enviar solicitud
                </button>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "[data-payment-new-cancel]"
                        )
                        ?.addEventListener(
                            "click",
                            fin.closeModal
                        );


                    root
                        .querySelector(
                            "#paymentNewRequestForm"
                        )
                        ?.addEventListener(
                            "submit",
                            saveNewRequest
                        );


                    document
                        .getElementById(
                            "paymentArea"
                        )
                        ?.addEventListener(
                            "change",
                            refreshClassification
                        );


                    document
                        .getElementById(
                            "paymentClassification"
                        )
                        ?.addEventListener(
                            "change",
                            refreshCategory
                        );


                    document
                        .getElementById(
                            "paymentCategory"
                        )
                        ?.addEventListener(
                            "change",
                            refreshAutomaticRule
                        );


                    initializeRuleCascade();

                }

        });

    }


    function initializeRuleCascade() {


        const area =
            document.getElementById(
                "paymentArea"
            );


        if (
            !area
        ) {

            return;

        }


        const areas =
            fin.unique(

                fin.state.rules
                    .map(
                        rule =>
                            rule.area_group
                    )

            );


        area.innerHTML = `

            <option value="">
                Selecciona...
            </option>

            ${
                areas
                    .map(
                        value => `

                            <option value="${
                                fin.escapeHtml(
                                    value
                                )
                            }">
                                ${
                                    fin.escapeHtml(
                                        value
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


        refreshClassification();

    }


    function refreshClassification() {


        const area =
            document
                .getElementById(
                    "paymentArea"
                )
                ?.value
            ||
            "";


        const classification =
            document.getElementById(
                "paymentClassification"
            );


        if (
            !classification
        ) {

            return;

        }


        const values =
            fin.unique(

                fin.state.rules
                    .filter(
                        rule =>
                            rule.area_group ===
                            area
                    )
                    .map(
                        rule =>
                            rule.classification
                    )

            );


        classification.innerHTML = `

            <option value="">
                Selecciona...
            </option>

            ${
                values
                    .map(
                        value => `

                            <option value="${
                                fin.escapeHtml(
                                    value
                                )
                            }">
                                ${
                                    fin.escapeHtml(
                                        value
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


        refreshCategory();

    }


    function refreshCategory() {


        const area =
            document
                .getElementById(
                    "paymentArea"
                )
                ?.value
            ||
            "";


        const classification =
            document
                .getElementById(
                    "paymentClassification"
                )
                ?.value
            ||
            "";


        const category =
            document.getElementById(
                "paymentCategory"
            );


        if (
            !category
        ) {

            return;

        }


        const values =
            fin.unique(

                fin.state.rules
                    .filter(
                        rule =>

                            rule.area_group ===
                            area

                            &&

                            rule.classification ===
                            classification
                    )
                    .map(
                        rule =>
                            rule.category
                    )

            );


        category.innerHTML = `

            <option value="">
                Selecciona...
            </option>

            ${
                values
                    .map(
                        value => `

                            <option value="${
                                fin.escapeHtml(
                                    value
                                )
                            }">
                                ${
                                    fin.escapeHtml(
                                        value
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


        refreshAutomaticRule();

    }


    function selectedRule() {


        const area =
            document
                .getElementById(
                    "paymentArea"
                )
                ?.value
            ||
            "";


        const classification =
            document
                .getElementById(
                    "paymentClassification"
                )
                ?.value
            ||
            "";


        const category =
            document
                .getElementById(
                    "paymentCategory"
                )
                ?.value
            ||
            "";


        return (
            fin.state.rules
                .find(
                    rule =>

                        rule.area_group ===
                        area

                        &&

                        rule.classification ===
                        classification

                        &&

                        rule.category ===
                        category
                )
            ||
            null
        );

    }


    function refreshAutomaticRule() {


        const rule =
            selectedRule();


        const movement =
            document.getElementById(
                "paymentMovementType"
            );


        const behavior =
            document.getElementById(
                "paymentBehavior"
            );


        if (
            movement
        ) {

            movement.value =
                rule?.movement_type
                ||
                "";

        }


        if (
            behavior
        ) {

            behavior.value =
                rule?.behavior
                ||
                "";

        }

    }


    async function saveNewRequest(
        event
    ) {


        event.preventDefault();


        const message =
            document.getElementById(
                "paymentNewRequestMessage"
            );


        const submit =
            event.currentTarget
                .querySelector(
                    'button[type="submit"]'
                )
            ||
            document.querySelector(
                '[type="submit"][form="paymentNewRequestForm"]'
            );


        const rule =
            selectedRule();


        if (
            !rule
        ) {

            if (
                message
            ) {

                message.textContent =
                    "Selecciona Área, Clasificación y Categoría.";

            }

            return;

        }


        const amount =
            Number(
                document
                    .getElementById(
                        "paymentRequestedAmount"
                    )
                    ?.value
                ||
                0
            );


        if (
            amount <=
            0
        ) {

            if (
                message
            ) {

                message.textContent =
                    "El importe solicitado debe ser mayor a cero.";

            }

            return;

        }


        if (
            submit
        ) {

            submit.disabled =
                true;

        }


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_create_payment_request",

                    {

                        p_group_id:
                            fin.state.currentGroupId,

                        p_catalog_rule_id:
                            rule.id,

                        p_requester_entry_id:
                            valueOf(
                                "paymentRequester"
                            ),

                        p_provider_entry_id:
                            valueOf(
                                "paymentProvider"
                            ),

                        p_client_entry_id:
                            valueOf(
                                "paymentClient"
                            ),

                        p_oc_rem:
                            valueOf(
                                "paymentOcRem"
                            )
                            ||
                            null,

                        p_project:
                            valueOf(
                                "paymentProject"
                            )
                            ||
                            null,

                        p_invoice_folio:
                            valueOf(
                                "paymentInvoiceFolio"
                            )
                            ||
                            null,

                        p_invoice_concept:
                            valueOf(
                                "paymentInvoiceConcept"
                            )
                            ||
                            null,

                        p_requested_amount:
                            amount,

                        p_payment_method_requested:
                            valueOf(
                                "paymentMethod"
                            ),

                        p_additional_comments:
                            valueOf(
                                "paymentComments"
                            )
                            ||
                            null

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            fin.closeModal();


            await loadCurrentGroup();


            fin.toast(
                "Solicitud enviada correctamente."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[NUEVA SOLICITUD]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    error.message
                    ||
                    "No se pudo enviar.";

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

            }

        }

    }


    // =====================================================
    // HELPERS
    // =====================================================

    function entriesOf(
        type
    ) {


        return state.groupEntries
            .filter(
                entry =>
                    entry.entry_type ===
                    type
            );

    }


    function entryOptions(
        entries
    ) {


        return `

            <option value="">
                Selecciona...
            </option>

            ${
                entries
                    .map(
                        entry => `

                            <option value="${entry.id}">
                                ${
                                    fin.escapeHtml(
                                        entry.name
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

    }


    function paymentMethodOptions() {


        return [

            "T. Debito",

            "T. Crédito",

            "Transferencia",

            "Efectivo",

            "Cheque",

            "Crédito",

            "NC",

            "Domiciliado",

            "TC Domiciliado",

            "Comisión"

        ]
        .map(
            method => `

                <option value="${
                    fin.escapeHtml(
                        method
                    )
                }">
                    ${
                        fin.escapeHtml(
                            method
                        )
                    }
                </option>

            `
        )
        .join(
            ""
        );

    }


    function detailField(
        label,
        value,
        full = false
    ) {


        return `

            <div
                class="
                    finance-field
                    ${
                        full
                            ?
                            "full"
                            :
                            ""
                    }
                "
            >

                <label>
                    ${
                        fin.escapeHtml(
                            label
                        )
                    }
                </label>

                <input
                    value="${
                        fin.escapeHtml(
                            value
                            ??
                            "—"
                        )
                    }"
                    readonly
                >

            </div>

        `;

    }


    function valueOf(
        id
    ) {


        return document
            .getElementById(
                id
            )
            ?.value
            ?.trim()
        ||
        "";

    }


    function setText(
        id,
        value
    ) {


        const node =
            document.getElementById(
                id
            );


        if (
            node
        ) {

            node.textContent =
                value;

        }

    }

})();