// =========================================================
// GRUPO GUTIERREZ
// CONTROL FINANCIERO · SOLICITUDES
// =========================================================

(() => {

    "use strict";


    let fin =
        null;


    const state = {

        groups:
            [],

        users:
            [],

        members:
            [],

        accessRequests:
            [],

        requests:
            []

    };


    window.GGFinanceControl = {

        state,

        reloadRequests,

        getRequests:
            () =>
                state.requests.slice(),

        getGroups:
            () =>
                state.groups.slice(),

        getFilteredRequests

    };


    document.addEventListener(
        "ggfinance:ready",
        init,
        {
            once:
                true
        }
    );


    async function init() {


        fin =
            window.GGFinance;


        bindTabs();

        bindEvents();

        bindFilters();


        if (
            !fin.state.isAdmin
        ) {

            document
                .getElementById(
                    "financeAdminWarning"
                )
                ?.classList
                .add(
                    "active"
                );


            return;

        }


        document
            .getElementById(
                "financeAdminContent"
            )
            ?.classList
            .remove(
                "hidden"
            );


        try {

            await loadAll();


            renderAll();


            document.dispatchEvent(

                new CustomEvent(
                    "ggfinance:control-ready"
                )

            );

        }

        catch (
            error
        ) {

            console.error(
                "[CONTROL FINANCIERO]",
                error
            );


            fin.toast(
                error.message
                ||
                "No se pudo cargar Control Financiero.",
                true
            );

        }

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


                            const tab =
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
                                                tab

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

    function bindEvents() {


        document
            .getElementById(
                "financeControlRefresh"
            )
            ?.addEventListener(
                "click",
                refreshAll
            );


        document
            .getElementById(
                "financeGroupsButton"
            )
            ?.addEventListener(
                "click",
                openGroupsModal
            );


        document
            .getElementById(
                "financeAccessRequestsButton"
            )
            ?.addEventListener(
                "click",
                openAccessRequestsModal
            );


        document
            .getElementById(
                "financeRequestsExcel"
            )
            ?.addEventListener(
                "click",
                exportRequests
            );


        document
            .getElementById(
                "financeRequestsTable"
            )
            ?.addEventListener(
                "click",
                handleRequestClick
            );

    }


    function bindFilters() {


        [

            "financeRequestSearch",

            "financeRequestGroupFilter",

            "financeRequestAuthFilter",

            "financeRequestPaidFilter",

            "financeRequestDateFrom",

            "financeRequestDateTo"

        ]
        .forEach(
            id => {

                const node =
                    document.getElementById(
                        id
                    );


                node?.addEventListener(
                    "input",
                    renderRequests
                );


                node?.addEventListener(
                    "change",
                    renderRequests
                );

            }
        );

    }


    // =====================================================
    // CARGA
    // =====================================================

    async function loadAll() {


        await Promise.all([

            loadGroups(),

            loadUsers(),

            loadMembers(),

            loadAccessRequests(),

            reloadRequests(
                false
            )

        ]);

    }


    async function refreshAll() {


        try {

            await loadAll();


            renderAll();


            dispatchUpdate();


            fin.toast(
                "Control Financiero actualizado."
            );

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            fin.toast(
                "No se pudo actualizar.",
                true
            );

        }

    }


    async function loadGroups() {


        const {
            data,
            error
        } =
            await fin.db
                .from(
                    "finance_groups"
                )
                .select(
                    "*"
                )
                .order(
                    "name"
                );


        if (
            error
        ) {

            throw error;

        }


        state.groups =
            data
            ||
            [];

    }


    async function loadUsers() {


        const {
            data,
            error
        } =
            await fin.db.rpc(
                "finance_list_system_users"
            );


        if (
            error
        ) {

            throw error;

        }


        state.users =
            data
            ||
            [];

    }


    async function loadMembers() {


        const {
            data,
            error
        } =
            await fin.db
                .from(
                    "finance_group_members"
                )
                .select(
                    "*"
                );


        if (
            error
        ) {

            throw error;

        }


        state.members =
            data
            ||
            [];

    }


    async function loadAccessRequests() {


        const {
            data,
            error
        } =
            await fin.db
                .from(
                    "finance_group_access_requests"
                )
                .select(
                    "*"
                )
                .eq(
                    "status",
                    "pending"
                )
                .order(
                    "requested_at",
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


        state.accessRequests =
            data
            ||
            [];

    }


    async function reloadRequests(
        dispatch =
            true
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


        state.requests =
            data
            ||
            [];


        if (
            dispatch
        ) {

            renderRequests();

            dispatchUpdate();

        }


        return state.requests;

    }


    // =====================================================
    // RENDER
    // =====================================================

    function renderAll() {


        renderAccessCount();

        renderGroupFilter();

        renderRequests();

    }


    function renderAccessCount() {


        const node =
            document.getElementById(
                "financeAccessCount"
            );


        if (
            node
        ) {

            node.textContent =
                state.accessRequests.length;

        }

    }


    function renderGroupFilter() {


        const select =
            document.getElementById(
                "financeRequestGroupFilter"
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
                Todos los grupos
            </option>

            ${
                state.groups
                    .filter(
                        group =>
                            group.active
                    )
                    .map(
                        group => `

                            <option value="${group.id}">
                                ${
                                    fin.escapeHtml(
                                        group.name
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


    function getFilteredRequests() {


        const search =
            fin.normalize(
                document
                    .getElementById(
                        "financeRequestSearch"
                    )
                    ?.value
            );


        const group =
            value(
                "financeRequestGroupFilter"
            );


        const auth =
            value(
                "financeRequestAuthFilter"
            );


        const paid =
            value(
                "financeRequestPaidFilter"
            );


        const from =
            value(
                "financeRequestDateFrom"
            );


        const to =
            value(
                "financeRequestDateTo"
            );


        return state.requests.filter(
            request => {


                if (
                    group
                    &&
                    request.group_id !==
                    group
                ) {

                    return false;

                }


                if (
                    auth
                    &&
                    request.authorization_status !==
                    auth
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

                                request.company_name,

                                request.group_name_snapshot,

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

                                request.created_by_email,

                                request.additional_comments

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


    function renderRequests() {


        const host =
            document.getElementById(
                "financeRequestsTable"
            );


        if (
            !host
        ) {

            return;

        }


        const requests =
            getFilteredRequests();


        const count =
            document.getElementById(
                "financeRequestCount"
            );


        if (
            count
        ) {

            count.textContent =
                `${requests.length} ${
                    requests.length ===
                    1
                        ?
                        "solicitud"
                        :
                        "solicitudes"
                }`;

        }


        if (
            !requests.length
        ) {

            host.innerHTML = `

                <div class="finance-empty">
                    No hay solicitudes que coincidan con los filtros.
                </div>

            `;


            return;

        }


        host.innerHTML = `

            <table class="finance-table">

                <thead>

                    <tr>

                        <th>Fecha solicitud</th>

                        <th>ID</th>

                        <th>Empresa</th>

                        <th>Tipo</th>

                        <th>Área</th>

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

                        <th>Autorización</th>

                        <th>Fecha autorización</th>

                        <th>Pago</th>

                        <th>Fecha pago</th>

                        <th>Comentarios</th>

                        <th>Semana</th>

                        <th>Mes</th>

                        <th>Año</th>

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


        return `

            <tr data-finance-request="${request.id}">


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
                            request.company_name
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

                    <span
                        class="
                            finance-status
                            ${
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
                                    )
                            }
                        "
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


    // =====================================================
    // GRUPOS
    // =====================================================

    function openGroupsModal() {


        fin.openModal({

            kicker:
                "CONTROL FINANCIERO",

            title:
                "Grupos de pago",

            extraWide:
                true,

            body: `

                <form id="financeGroupForm">

                    <input
                        type="hidden"
                        id="financeGroupId"
                    >


                    <div class="finance-form-grid">


                        <div class="finance-field">

                            <label>
                                Nombre del grupo *
                            </label>

                            <input
                                id="financeGroupName"
                                required
                                placeholder="Ej. LO"
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Prefijo *
                            </label>

                            <input
                                id="financeGroupPrefix"
                                required
                                maxlength="12"
                                placeholder="Ej. LO"
                            >

                            <small class="finance-help">
                                El prefijo decidirá el ID de los folios.
                                Ejemplo: LO-000001.
                            </small>

                        </div>


                        <div class="finance-field full">

                            <label>
                                Usuarios del grupo
                            </label>

                            <div
                                id="financeGroupUsers"
                                class="finance-checkbox-grid"
                            >
                            </div>

                        </div>


                    </div>


                    <div
                        id="financeGroupMessage"
                        class="finance-form-message"
                    >
                    </div>


                    <div class="finance-inline-actions">

                        <button
                            type="submit"
                            class="finance-button primary"
                        >
                            Guardar grupo
                        </button>

                        <button
                            type="button"
                            class="finance-button"
                            id="financeGroupClear"
                        >
                            Limpiar
                        </button>

                    </div>


                </form>


                <div
                    id="financeGroupList"
                    class="finance-catalog-list"
                >
                </div>

            `,

            onOpen:
                root => {


                    renderUsersCheckboxes();

                    renderGroupList();


                    root
                        .querySelector(
                            "#financeGroupForm"
                        )
                        ?.addEventListener(
                            "submit",
                            saveGroup
                        );


                    root
                        .querySelector(
                            "#financeGroupClear"
                        )
                        ?.addEventListener(
                            "click",
                            clearGroupForm
                        );


                    root
                        .querySelector(
                            "#financeGroupList"
                        )
                        ?.addEventListener(
                            "click",
                            handleGroupListClick
                        );

                }

        });

    }


    function renderUsersCheckboxes(
        selected =
            []
    ) {


        const host =
            document.getElementById(
                "financeGroupUsers"
            );


        if (
            !host
        ) {

            return;

        }


        const selectedSet =
            new Set(
                selected
            );


        host.innerHTML =
            state.users
                .map(
                    user => `

                        <label class="finance-checkbox">

                            <input
                                type="checkbox"
                                value="${user.user_id}"
                                ${
                                    selectedSet.has(
                                        user.user_id
                                    )

                                        ?

                                        "checked"

                                        :

                                        ""
                                }
                            >

                            <span>
                                ${
                                    fin.escapeHtml(
                                        user.email
                                    )
                                }
                            </span>

                        </label>

                    `
                )
                .join(
                    ""
                );

    }


    function renderGroupList() {


        const host =
            document.getElementById(
                "financeGroupList"
            );


        if (
            !host
        ) {

            return;

        }


        host.innerHTML =
            state.groups
                .map(
                    group => {


                        const members =
                            state.members.filter(
                                member =>
                                    member.group_id ===
                                    group.id
                            );


                        return `

                            <article class="finance-catalog-item">

                                <div>

                                    <strong>
                                        ${
                                            fin.escapeHtml(
                                                group.name
                                            )
                                        }
                                    </strong>

                                    <small>

                                        Prefijo:
                                        ${
                                            fin.escapeHtml(
                                                group.prefix
                                            )
                                        }

                                        ·

                                        ${
                                            members.length
                                        }

                                        usuario(s)

                                        ·

                                        ${
                                            group.active
                                                ?
                                                "Activo"
                                                :
                                                "Archivado"
                                        }

                                    </small>

                                </div>


                                <div class="finance-inline-actions">

                                    <button
                                        type="button"
                                        class="finance-mini-button"
                                        data-finance-edit-group="${group.id}"
                                    >
                                        Editar
                                    </button>

                                    ${
                                        group.active

                                            ?

                                            `
                                                <button
                                                    type="button"
                                                    class="finance-mini-button danger"
                                                    data-finance-archive-group="${group.id}"
                                                >
                                                    Archivar
                                                </button>
                                            `

                                            :

                                            ""
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


    function handleGroupListClick(
        event
    ) {


        const edit =
            event.target.closest(
                "[data-finance-edit-group]"
            );


        const archive =
            event.target.closest(
                "[data-finance-archive-group]"
            );


        if (
            edit
        ) {

            const group =
                state.groups.find(
                    item =>
                        item.id ===
                        edit.dataset
                            .financeEditGroup
                );


            if (
                !group
            ) {

                return;

            }


            const members =
                state.members
                    .filter(
                        member =>
                            member.group_id ===
                            group.id
                    )
                    .map(
                        member =>
                            member.user_id
                    );


            document
                .getElementById(
                    "financeGroupId"
                )
                .value =
                group.id;


            document
                .getElementById(
                    "financeGroupName"
                )
                .value =
                group.name;


            document
                .getElementById(
                    "financeGroupPrefix"
                )
                .value =
                group.prefix;


            renderUsersCheckboxes(
                members
            );

        }


        if (
            archive
        ) {

            archiveGroup(
                archive.dataset
                    .financeArchiveGroup
            );

        }

    }


    async function saveGroup(
        event
    ) {


        event.preventDefault();


        const message =
            document.getElementById(
                "financeGroupMessage"
            );


        const id =
            value(
                "financeGroupId"
            )
            ||
            null;


        const name =
            value(
                "financeGroupName"
            );


        const prefix =
            value(
                "financeGroupPrefix"
            );


        const users =
            [

                ...document.querySelectorAll(
                    "#financeGroupUsers input[type='checkbox']:checked"
                )

            ]
            .map(
                input =>
                    input.value
            );


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_admin_save_group",

                    {

                        p_group_id:
                            id,

                        p_name:
                            name,

                        p_prefix:
                            prefix,

                        p_user_ids:
                            users

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            await Promise.all([

                loadGroups(),

                loadMembers()

            ]);


            clearGroupForm();

            renderGroupList();

            renderGroupFilter();


            fin.toast(
                "Grupo guardado."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[SAVE GROUP]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    error.message;

            }

        }

    }


    function clearGroupForm() {


        const form =
            document.getElementById(
                "financeGroupForm"
            );


        form?.reset();


        const id =
            document.getElementById(
                "financeGroupId"
            );


        if (
            id
        ) {

            id.value =
                "";

        }


        renderUsersCheckboxes();

    }


    async function archiveGroup(
        id
    ) {


        const group =
            state.groups.find(
                item =>
                    item.id ===
                    id
            );


        if (
            !group
            ||
            !window.confirm(
                `¿Archivar el grupo ${group.name}?`
            )
        ) {

            return;

        }


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_admin_archive_group",

                    {
                        p_group_id:
                            id
                    }

                );


            if (
                error
            ) {

                throw error;

            }


            await loadGroups();


            renderGroupList();

            renderGroupFilter();


            fin.toast(
                "Grupo archivado."
            );

        }

        catch (
            error
        ) {

            fin.toast(
                error.message,
                true
            );

        }

    }


    // =====================================================
    // SOLICITUDES DE ACCESO
    // =====================================================

    function openAccessRequestsModal() {


        fin.openModal({

            kicker:
                "CONTROL FINANCIERO",

            title:
                "Solicitudes de acceso",

            wide:
                true,

            body: `

                <div id="financeAccessList">
                </div>

            `,

            onOpen:
                root => {


                    renderAccessList();


                    root
                        .querySelector(
                            "#financeAccessList"
                        )
                        ?.addEventListener(
                            "click",
                            handleAccessClick
                        );

                }

        });

    }


    function renderAccessList() {


        const host =
            document.getElementById(
                "financeAccessList"
            );


        if (
            !host
        ) {

            return;

        }


        if (
            !state.accessRequests.length
        ) {

            host.innerHTML = `

                <div class="finance-empty">
                    No hay solicitudes pendientes.
                </div>

            `;


            return;

        }


        host.innerHTML =
            state.accessRequests
                .map(
                    request => `

                        <article class="finance-catalog-item">

                            <div>

                                <strong>
                                    ${
                                        fin.escapeHtml(
                                            request.user_email
                                        )
                                    }
                                </strong>

                                <small>

                                    ${
                                        fin.escapeHtml(
                                            request.message
                                            ||
                                            "Sin mensaje"
                                        )
                                    }

                                    ·

                                    ${
                                        fin.dateTime(
                                            request.requested_at
                                        )
                                    }

                                </small>

                            </div>


                            <div class="finance-inline-actions">

                                <select
                                    data-access-group="${request.id}"
                                >

                                    <option value="">
                                        Selecciona grupo...
                                    </option>

                                    ${
                                        state.groups
                                            .filter(
                                                group =>
                                                    group.active
                                            )
                                            .map(
                                                group => `

                                                    <option value="${group.id}">
                                                        ${
                                                            fin.escapeHtml(
                                                                group.name
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


                                <button
                                    type="button"
                                    class="finance-mini-button"
                                    data-access-approve="${request.id}"
                                >
                                    Autorizar
                                </button>


                                <button
                                    type="button"
                                    class="finance-mini-button danger"
                                    data-access-reject="${request.id}"
                                >
                                    Rechazar
                                </button>

                            </div>

                        </article>

                    `
                )
                .join(
                    ""
                );

    }


    async function handleAccessClick(
        event
    ) {


        const approve =
            event.target.closest(
                "[data-access-approve]"
            );


        const reject =
            event.target.closest(
                "[data-access-reject]"
            );


        if (
            approve
        ) {


            const id =
                approve.dataset
                    .accessApprove;


            const groupId =
                document
                    .querySelector(
                        `[data-access-group="${id}"]`
                    )
                    ?.value;


            if (
                !groupId
            ) {

                fin.toast(
                    "Selecciona el grupo.",
                    true
                );

                return;

            }


            await resolveAccess(

                id,

                groupId,

                "approved"

            );

        }


        if (
            reject
        ) {

            await resolveAccess(

                reject.dataset
                    .accessReject,

                null,

                "rejected"

            );

        }

    }


    async function resolveAccess(
        id,
        groupId,
        decision
    ) {


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_admin_resolve_access",

                    {

                        p_access_request_id:
                            id,

                        p_group_id:
                            groupId,

                        p_decision:
                            decision

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            await Promise.all([

                loadAccessRequests(),

                loadMembers()

            ]);


            renderAccessCount();

            renderAccessList();


            fin.toast(
                decision ===
                "approved"

                    ?

                    "Usuario agregado al grupo."

                    :

                    "Solicitud rechazada."
            );

        }

        catch (
            error
        ) {

            fin.toast(
                error.message,
                true
            );

        }

    }


    // =====================================================
    // SOLICITUD CLICK
    // =====================================================

    function handleRequestClick(
        event
    ) {


        const row =
            event.target.closest(
                "[data-finance-request]"
            );


        if (
            !row
        ) {

            return;

        }


        const request =
            state.requests.find(
                item =>
                    item.id ===
                    row.dataset
                        .financeRequest
            );


        if (
            request
        ) {

            openRequestActions(
                request
            );

        }

    }


    function openRequestActions(
        request
    ) {


        fin.openModal({

            kicker:
                request.request_folio,

            title:
                request.provider_name,

            body: `

                <div class="finance-request-action-head">

                    <strong>
                        ${
                            fin.escapeHtml(
                                request.request_folio
                            )
                        }
                        ·
                        ${
                            fin.money(
                                request.requested_amount
                            )
                        }
                    </strong>

                    <small>

                        ${
                            fin.escapeHtml(
                                request.group_name_snapshot
                            )
                        }

                        ·

                        ${
                            fin.escapeHtml(
                                request.category
                            )
                        }

                    </small>

                </div>


                <div class="finance-choice-grid">


                    <button
                        type="button"
                        class="finance-choice-card"
                        data-finance-action-edit
                    >

                        <strong>
                            Editar datos
                        </strong>

                        <small>
                            Solicitud, clasificación, proveedor,
                            factura, importes y comentarios.
                        </small>

                    </button>


                    <button
                        type="button"
                        class="finance-choice-card"
                        data-finance-action-payment
                    >

                        <strong>
                            Autorizaciones o pagos
                        </strong>

                        <small>
                            Autorizar, rechazar, confirmar factura
                            y registrar pago.
                        </small>

                    </button>


                    <button
                        type="button"
                        class="finance-choice-card"
                        data-finance-action-delete
                    >

                        <strong>
                            Eliminar solicitud
                        </strong>

                        <small>
                            Eliminar el registro conservando
                            auditoría del movimiento.
                        </small>

                    </button>


                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "[data-finance-action-edit]"
                        )
                        ?.addEventListener(

                            "click",

                            () =>
                                openEditRequest(
                                    request
                                )

                        );


                    root
                        .querySelector(
                            "[data-finance-action-payment]"
                        )
                        ?.addEventListener(

                            "click",

                            () =>
                                openAuthorizationPayment(
                                    request
                                )

                        );


                    root
                        .querySelector(
                            "[data-finance-action-delete]"
                        )
                        ?.addEventListener(

                            "click",

                            () =>
                                deleteRequest(
                                    request
                                )

                        );

                }

        });

    }


    // =====================================================
    // EDITAR SOLICITUD
    // =====================================================

    async function openEditRequest(
        request
    ) {


        const entries =
            await fin.loadGroupEntries(
                request.group_id
            );


        const requesters =
            entries.filter(
                item =>
                    item.entry_type ===
                    "requester"
            );


        const providers =
            entries.filter(
                item =>
                    item.entry_type ===
                    "provider"
            );


        const clients =
            entries.filter(
                item =>
                    item.entry_type ===
                    "client"
            );


        fin.openModal({

            kicker:
                request.request_folio,

            title:
                "Editar datos",

            extraWide:
                true,

            body: `

                <form id="financeEditRequestForm">


                    <div class="finance-form-grid">


                        <div class="finance-field">

                            <label>
                                Fecha solicitud *
                            </label>

                            <input
                                id="financeEditRequestDate"
                                type="date"
                                value="${request.request_date}"
                                required
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                ID
                            </label>

                            <input
                                value="${
                                    fin.escapeHtml(
                                        request.request_folio
                                    )
                                }"
                                readonly
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Área agrupadora *
                            </label>

                            <select
                                id="financeEditArea"
                                required
                            >
                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Clasificación *
                            </label>

                            <select
                                id="financeEditClassification"
                                required
                            >
                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Categoría *
                            </label>

                            <select
                                id="financeEditCategory"
                                required
                            >
                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Tipo / comportamiento
                            </label>

                            <input
                                id="financeEditRuleInfo"
                                readonly
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Solicitante *
                            </label>

                            <select
                                id="financeEditRequester"
                                required
                            >
                                ${entryOptions(
                                    requesters,
                                    request.requester_entry_id
                                )}
                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Proveedor *
                            </label>

                            <select
                                id="financeEditProvider"
                                required
                            >
                                ${entryOptions(
                                    providers,
                                    request.provider_entry_id
                                )}
                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Cliente *
                            </label>

                            <select
                                id="financeEditClient"
                                required
                            >
                                ${entryOptions(
                                    clients,
                                    request.client_entry_id
                                )}
                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                OC / REM
                            </label>

                            <input
                                id="financeEditOcRem"
                                value="${
                                    fin.escapeHtml(
                                        request.oc_rem
                                        ||
                                        ""
                                    )
                                }"
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Proyecto
                            </label>

                            <input
                                id="financeEditProject"
                                value="${
                                    fin.escapeHtml(
                                        request.project
                                        ||
                                        ""
                                    )
                                }"
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Folio factura
                            </label>

                            <input
                                id="financeEditInvoiceFolio"
                                value="${
                                    fin.escapeHtml(
                                        request.invoice_folio
                                        ||
                                        ""
                                    )
                                }"
                            >

                        </div>


                        <div class="finance-field full">

                            <label>
                                Concepto factura
                            </label>

                            <textarea id="financeEditInvoiceConcept">${
                                fin.escapeHtml(
                                    request.invoice_concept
                                    ||
                                    ""
                                )
                            }</textarea>

                        </div>


                        <div class="finance-field">

                            <label>
                                Importe solicitado *
                            </label>

                            <input
                                id="financeEditRequestedAmount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value="${request.requested_amount}"
                                required
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Importe real
                            </label>

                            <input
                                id="financeEditActualAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                value="${
                                    request.actual_amount
                                    ??
                                    ""
                                }"
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Método *
                            </label>

                            <select
                                id="financeEditMethod"
                                required
                            >

                                ${paymentMethodOptions(
                                    request.payment_method_requested
                                )}

                            </select>

                        </div>


                        <div class="finance-field">

                            <label class="finance-checkbox">

                                <input
                                    id="financeEditInvoiceReceived"
                                    type="checkbox"
                                    ${
                                        request.finance_invoice_received
                                            ?
                                            "checked"
                                            :
                                            ""
                                    }
                                >

                                Factura recibida por Finanzas

                            </label>

                        </div>


                        <div class="finance-field full">

                            <label>
                                Comentarios
                            </label>

                            <textarea id="financeEditComments">${
                                fin.escapeHtml(
                                    request.additional_comments
                                    ||
                                    ""
                                )
                            }</textarea>

                        </div>


                    </div>


                    <div
                        id="financeEditRequestMessage"
                        class="finance-form-message"
                    >
                    </div>


                </form>

            `,

            footer: `

                <button
                    type="button"
                    class="finance-button"
                    data-finance-edit-cancel
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    form="financeEditRequestForm"
                    class="finance-button primary"
                >
                    Guardar cambios
                </button>

            `,

            onOpen:
                root => {


                    initializeEditCascade(
                        request
                    );


                    root
                        .querySelector(
                            "[data-finance-edit-cancel]"
                        )
                        ?.addEventListener(
                            "click",
                            fin.closeModal
                        );


                    root
                        .querySelector(
                            "#financeEditRequestForm"
                        )
                        ?.addEventListener(

                            "submit",

                            event =>
                                saveEditedRequest(
                                    event,
                                    request
                                )

                        );

                }

        });

    }


    function initializeEditCascade(
        request
    ) {


        const area =
            document.getElementById(
                "financeEditArea"
            );


        area.innerHTML =
            optionList(

                fin.unique(
                    fin.state.rules.map(
                        rule =>
                            rule.area_group
                    )
                ),

                request.area_group

            );


        area.addEventListener(
            "change",
            refreshEditClassification
        );


        document
            .getElementById(
                "financeEditClassification"
            )
            ?.addEventListener(
                "change",
                refreshEditCategory
            );


        document
            .getElementById(
                "financeEditCategory"
            )
            ?.addEventListener(
                "change",
                refreshEditRuleInfo
            );


        refreshEditClassification(
            request.classification,
            request.category
        );

    }


    function refreshEditClassification(
        selectedClassification =
            null,
        selectedCategory =
            null
    ) {


        const area =
            value(
                "financeEditArea"
            );


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


        const select =
            document.getElementById(
                "financeEditClassification"
            );


        select.innerHTML =
            optionList(
                values,
                selectedClassification
            );


        refreshEditCategory(
            selectedCategory
        );

    }


    function refreshEditCategory(
        selectedCategory =
            null
    ) {


        const area =
            value(
                "financeEditArea"
            );


        const classification =
            value(
                "financeEditClassification"
            );


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


        document
            .getElementById(
                "financeEditCategory"
            )
            .innerHTML =
            optionList(
                values,
                selectedCategory
            );


        refreshEditRuleInfo();

    }


    function editRule() {


        const area =
            value(
                "financeEditArea"
            );


        const classification =
            value(
                "financeEditClassification"
            );


        const category =
            value(
                "financeEditCategory"
            );


        return (
            fin.state.rules.find(
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


    function refreshEditRuleInfo() {


        const rule =
            editRule();


        const input =
            document.getElementById(
                "financeEditRuleInfo"
            );


        if (
            input
        ) {

            input.value =
                rule

                    ?

                    `${rule.movement_type} · ${rule.behavior}`

                    :

                    "";

        }

    }


    async function saveEditedRequest(
        event,
        request
    ) {


        event.preventDefault();


        const message =
            document.getElementById(
                "financeEditRequestMessage"
            );


        const rule =
            editRule();


        if (
            !rule
        ) {

            message.textContent =
                "Selecciona una relación financiera válida.";

            return;

        }


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_admin_update_request",

                    {

                        p_request_id:
                            request.id,

                        p_catalog_rule_id:
                            rule.id,

                        p_requester_entry_id:
                            value(
                                "financeEditRequester"
                            ),

                        p_provider_entry_id:
                            value(
                                "financeEditProvider"
                            ),

                        p_client_entry_id:
                            value(
                                "financeEditClient"
                            ),

                        p_oc_rem:
                            value(
                                "financeEditOcRem"
                            )
                            ||
                            null,

                        p_project:
                            value(
                                "financeEditProject"
                            )
                            ||
                            null,

                        p_invoice_folio:
                            value(
                                "financeEditInvoiceFolio"
                            )
                            ||
                            null,

                        p_invoice_concept:
                            value(
                                "financeEditInvoiceConcept"
                            )
                            ||
                            null,

                        p_requested_amount:
                            Number(
                                value(
                                    "financeEditRequestedAmount"
                                )
                            ),

                        p_actual_amount:

                            value(
                                "financeEditActualAmount"
                            ) ===
                            ""

                                ?

                                null

                                :

                                Number(
                                    value(
                                        "financeEditActualAmount"
                                    )
                                ),

                        p_request_date:
                            value(
                                "financeEditRequestDate"
                            ),

                        p_payment_method_requested:
                            value(
                                "financeEditMethod"
                            ),

                        p_finance_invoice_received:
                            document
                                .getElementById(
                                    "financeEditInvoiceReceived"
                                )
                                ?.checked
                            ||
                            false,

                        p_additional_comments:
                            value(
                                "financeEditComments"
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


            await reloadRequests();


            fin.toast(
                "Solicitud actualizada."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[EDIT REQUEST]",
                error
            );


            message.textContent =
                error.message;

        }

    }


    // =====================================================
    // AUTORIZACIÓN / PAGO
    // =====================================================

    function openAuthorizationPayment(
        request
    ) {


        fin.openModal({

            kicker:
                request.request_folio,

            title:
                "Autorizaciones o pagos",

            wide:
                true,

            body: `

                <form id="financeAuthorizationForm">


                    <div class="finance-form-grid">


                        <div class="finance-field">

                            <label>
                                Autorización Finanzas
                            </label>

                            <select id="financeAuthorizationStatus">

                                <option
                                    value="pending"
                                    ${
                                        request.authorization_status ===
                                        "pending"
                                            ?
                                            "selected"
                                            :
                                            ""
                                    }
                                >
                                    Pendiente
                                </option>

                                <option
                                    value="authorized"
                                    ${
                                        request.authorization_status ===
                                        "authorized"
                                            ?
                                            "selected"
                                            :
                                            ""
                                    }
                                >
                                    Autorizada
                                </option>

                                <option
                                    value="rejected"
                                    ${
                                        request.authorization_status ===
                                        "rejected"
                                            ?
                                            "selected"
                                            :
                                            ""
                                    }
                                >
                                    No autorizada
                                </option>

                            </select>

                        </div>


                        <div class="finance-field">

                            <label>
                                Fecha autorización
                            </label>

                            <input
                                value="${
                                    fin.dateTime(
                                        request.authorization_date
                                    )
                                }"
                                readonly
                            >

                            <small class="finance-help">
                                Se registra automáticamente.
                            </small>

                        </div>


                        <div class="finance-field">

                            <label>
                                Importe solicitado
                            </label>

                            <input
                                value="${
                                    fin.money(
                                        request.requested_amount
                                    )
                                }"
                                readonly
                            >

                        </div>


                        <div class="finance-field">

                            <label>
                                Importe real
                            </label>

                            <input
                                id="financeAuthorizationActualAmount"
                                type="number"
                                min="0"
                                step="0.01"
                                value="${
                                    request.actual_amount
                                    ??
                                    ""
                                }"
                            >

                        </div>


                        <div class="finance-field">

                            <label class="finance-checkbox">

                                <input
                                    id="financeAuthorizationInvoice"
                                    type="checkbox"
                                    ${
                                        request.finance_invoice_received
                                            ?
                                            "checked"
                                            :
                                            ""
                                    }
                                >

                                Factura recibida por Finanzas

                            </label>

                        </div>


                        <div class="finance-field">

                            <label class="finance-checkbox">

                                <input
                                    id="financeAuthorizationPaid"
                                    type="checkbox"
                                    ${
                                        request.payment_confirmed
                                            ?
                                            "checked"
                                            :
                                            ""
                                    }
                                >

                                Pago confirmado

                            </label>

                        </div>


                        <div
                            class="finance-field full"
                            id="financeAuthorizationPaymentDateField"
                        >

                            <label>
                                Fecha de pago
                            </label>

                            <input
                                id="financeAuthorizationPaymentDate"
                                type="date"
                                value="${
                                    request.payment_date
                                    ||
                                    fin.todayISO()
                                }"
                            >

                        </div>


                    </div>


                    <div
                        id="financeAuthorizationMessage"
                        class="finance-form-message"
                    >
                    </div>


                </form>

            `,

            footer: `

                <button
                    type="button"
                    class="finance-button"
                    data-finance-authorization-cancel
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    form="financeAuthorizationForm"
                    class="finance-button primary"
                >
                    Guardar
                </button>

            `,

            onOpen:
                root => {


                    const paid =
                        root.querySelector(
                            "#financeAuthorizationPaid"
                        );


                    paid?.addEventListener(
                        "change",
                        refreshPaymentDateVisibility
                    );


                    root
                        .querySelector(
                            "#financeAuthorizationStatus"
                        )
                        ?.addEventListener(
                            "change",
                            refreshPaymentAuthorization
                        );


                    root
                        .querySelector(
                            "[data-finance-authorization-cancel]"
                        )
                        ?.addEventListener(
                            "click",
                            fin.closeModal
                        );


                    root
                        .querySelector(
                            "#financeAuthorizationForm"
                        )
                        ?.addEventListener(

                            "submit",

                            event =>
                                saveAuthorizationPayment(
                                    event,
                                    request
                                )

                        );


                    refreshPaymentDateVisibility();

                    refreshPaymentAuthorization();

                }

        });

    }


    function refreshPaymentAuthorization() {


        const status =
            value(
                "financeAuthorizationStatus"
            );


        const paid =
            document.getElementById(
                "financeAuthorizationPaid"
            );


        if (
            !paid
        ) {

            return;

        }


        if (
            status !==
            "authorized"
        ) {

            paid.checked =
                false;


            paid.disabled =
                true;

        }

        else {

            paid.disabled =
                false;

        }


        refreshPaymentDateVisibility();

    }


    function refreshPaymentDateVisibility() {


        const paid =
            document
                .getElementById(
                    "financeAuthorizationPaid"
                )
                ?.checked
            ||
            false;


        const field =
            document.getElementById(
                "financeAuthorizationPaymentDateField"
            );


        if (
            field
        ) {

            field.style.display =
                paid
                    ?
                    "grid"
                    :
                    "none";

        }

    }


    async function saveAuthorizationPayment(
        event,
        request
    ) {


        event.preventDefault();


        const message =
            document.getElementById(
                "financeAuthorizationMessage"
            );


        const status =
            value(
                "financeAuthorizationStatus"
            );


        const paid =
            document
                .getElementById(
                    "financeAuthorizationPaid"
                )
                ?.checked
            ||
            false;


        const actual =
            value(
                "financeAuthorizationActualAmount"
            );


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_admin_set_authorization_payment",

                    {

                        p_request_id:
                            request.id,

                        p_authorization_status:
                            status,

                        p_finance_invoice_received:
                            document
                                .getElementById(
                                    "financeAuthorizationInvoice"
                                )
                                ?.checked
                            ||
                            false,

                        p_actual_amount:

                            actual ===
                            ""

                                ?

                                null

                                :

                                Number(
                                    actual
                                ),

                        p_payment_confirmed:
                            paid,

                        p_payment_date:

                            paid

                                ?

                                value(
                                    "financeAuthorizationPaymentDate"
                                )

                                :

                                null

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            fin.closeModal();


            if (
                status ===
                "rejected"
            ) {


                const keep =
                    window.confirm(

                        "La solicitud quedó NO AUTORIZADA.\n\nAceptar = conservarla en el registro.\nCancelar = eliminarla del concentrado."

                    );


                if (
                    !keep
                ) {

                    await deleteRequest(
                        request,
                        false
                    );

                    return;

                }

            }


            await reloadRequests();


            fin.toast(
                paid
                    ?
                    "Pago confirmado."
                    :
                    "Autorización actualizada."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[AUTH PAYMENT]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    error.message;

            }

        }

    }


    // =====================================================
    // ELIMINAR
    // =====================================================

    async function deleteRequest(
        request,
        ask =
            true
    ) {


        if (
            ask
            &&
            !window.confirm(

                `¿Eliminar ${request.request_folio}?\n\nEl evento quedará registrado en la auditoría.`

            )
        ) {

            return;

        }


        try {

            const {
                error
            } =
                await fin.db.rpc(

                    "finance_admin_delete_request",

                    {
                        p_request_id:
                            request.id
                    }

                );


            if (
                error
            ) {

                throw error;

            }


            fin.closeModal();


            await reloadRequests();


            fin.toast(
                "Solicitud eliminada."
            );

        }

        catch (
            error
        ) {

            fin.toast(
                error.message,
                true
            );

        }

    }


    // =====================================================
    // EXCEL
    // =====================================================

    async function exportRequests() {


        const requests =
            getFilteredRequests();


        if (
            !requests.length
        ) {

            fin.toast(
                "No hay solicitudes para exportar.",
                true
            );

            return;

        }


        try {

            const date =
                fin.todayISO();


            await window
                .GGFinanceExcel
                .exportRequests(

                    requests,

                    `control-financiero-${date}.xlsx`

                );


            fin.toast(
                "Excel generado."
            );

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            fin.toast(
                error.message
                ||
                "No se pudo generar el Excel.",
                true
            );

        }

    }


    // =====================================================
    // HELPERS
    // =====================================================

    function entryOptions(
        entries,
        selected
    ) {


        return `

            <option value="">
                Selecciona...
            </option>

            ${
                entries
                    .map(
                        entry => `

                            <option
                                value="${entry.id}"
                                ${
                                    entry.id ===
                                    selected

                                        ?

                                        "selected"

                                        :

                                        ""
                                }
                            >
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


    function optionList(
        values,
        selected =
            null
    ) {


        return `

            <option value="">
                Selecciona...
            </option>

            ${
                values
                    .map(
                        value => `

                            <option
                                value="${
                                    fin.escapeHtml(
                                        value
                                    )
                                }"
                                ${
                                    value ===
                                    selected

                                        ?

                                        "selected"

                                        :

                                        ""
                                }
                            >
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

    }


    function paymentMethodOptions(
        selected
    ) {


        const methods = [

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

        ];


        return methods
            .map(
                method => `

                    <option
                        value="${
                            fin.escapeHtml(
                                method
                            )
                        }"
                        ${
                            method ===
                            selected

                                ?

                                "selected"

                                :

                                ""
                        }
                    >
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


    function value(
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


    function dispatchUpdate() {


        document.dispatchEvent(

            new CustomEvent(
                "ggfinance:requests-updated"
            )

        );

    }

})();