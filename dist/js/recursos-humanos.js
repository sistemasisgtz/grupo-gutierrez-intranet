// =========================================================
// GRUPO GUTIERREZ
// RECURSOS HUMANOS
// =========================================================

(() => {

    "use strict";


    // =====================================================
    // CLIENT
    // =====================================================

    const db =
        window.ggSupabase;


    const $ =
        id =>
            document.getElementById(
                id
            );


    // =====================================================
    // STATE
    // =====================================================

    let currentUser =
        null;


    let positions =
        [];


    let employees =
        [];


    let systemUsers =
        [];


    let editingEmployeeId =
        null;


    let editingPositionId =
        null;


    let chatEmployeeId =
        null;


    // =====================================================
    // DOM
    // =====================================================

    const employeeModal =
        $("employeeModal");


    const positionsModal =
        $("positionsModal");


    const systemUsersModal =
        $("systemUsersModal");


    const employeeForm =
        $("employeeForm");


    const positionForm =
        $("positionForm");


    const employeesTableBody =
        $("employeesTableBody");


    const emptyEmployees =
        $("emptyEmployees");


    const employeeChat =
        $("employeeChat");


    const chatBackdrop =
        $("chatBackdrop");


    // =====================================================
    // START
    // =====================================================

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );


    async function initialize() {


        if (
            !db
        ) {

            window.location.href =
                "index.html";

            return;

        }


        // Usamos getUser para obtener el usuario
        // validado por Supabase Auth.

        const {
            data,
            error
        } =
            await db.auth
                .getUser();


        if (
            error
            ||
            !data?.user
        ) {

            window.location.replace(
                "index.html"
            );

            return;

        }


        currentUser =
            data.user;


        $("rhCurrentUser")
            .textContent =
            currentUser.email
            ||
            "Usuario";


        bindEvents();


        await Promise.all([

            loadPositions(),

            loadSystemUsers()

        ]);


        await loadEmployees();

    }


    // =====================================================
    // EVENTS
    // =====================================================

    function bindEvents() {


        $("backToSystem")
            .addEventListener(
                "click",
                () => {

                    window.location.href =
                        "sistema.html";

                }
            );


        $("employeesButton")
            .addEventListener(
                "click",
                () => {

                    openEmployeeModal();

                }
            );


        $("positionsButton")
            .addEventListener(
                "click",
                () => {

                    openPositionsModal();

                }
            );


        $("filtersToggle")
            .addEventListener(
                "click",
                () => {

                    $("employeeFilters")
                        .classList
                        .toggle(
                            "open"
                        );

                }
            );


        $("clearFilters")
            .addEventListener(
                "click",
                clearFilters
            );


        $("employeeSearch")
            .addEventListener(
                "input",
                renderEmployees
            );


        [
            "filterPayroll",
            "filterName",
            "filterCompany",
            "filterPosition",
            "filterReportsTo",
            "filterImssMonth",
            "filterSeniorityMonth",
            "filterAgreementMonth",
            "filterBirthdayMonth",
            "filterSystemEmail",
            "filterActive"

        ].forEach(
            id => {

                $(id).addEventListener(
                    "input",
                    renderEmployees
                );


                $(id).addEventListener(
                    "change",
                    renderEmployees
                );

            }
        );


        employeeForm
            .addEventListener(
                "submit",
                saveEmployee
            );


        positionForm
            .addEventListener(
                "submit",
                savePosition
            );


        $("systemEmailButton")
            .addEventListener(
                "click",
                openSystemUsersModal
            );


        $("unlinkSystemEmail")
            .addEventListener(
                "click",
                () => {

                    $("employeeSystemAuthId")
                        .value =
                        "";


                    $("selectedSystemEmail")
                        .textContent =
                        "Sin correo vinculado";

                }
            );


        $("systemUserSearch")
            .addEventListener(
                "input",
                renderSystemUsers
            );


        $("closeEmployeeChat")
            .addEventListener(
                "click",
                closeEmployeeChat
            );


        chatBackdrop
            .addEventListener(
                "click",
                closeEmployeeChat
            );


        $("sendEmployeeUpdate")
            .addEventListener(
                "click",
                saveEmployeeUpdate
            );


        $("employeeChatInput")
            .addEventListener(

                "keydown",

                event => {

                    if (
                        event.key ===
                        "Enter"

                        &&

                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        saveEmployeeUpdate();

                    }

                }

            );


        document
            .querySelectorAll(
                "[data-close-modal]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            closeModal(
                                button.dataset
                                    .closeModal
                            );

                        }
                    );

                }
            );


        // =================================================
        // EMPLOYEE ROW ACTIONS
        // =================================================

        employeesTableBody
            .addEventListener(

                "click",

                event => {


                    const editButton =
                        event.target
                            .closest(
                                "[data-edit-employee]"
                            );


                    if (
                        editButton
                    ) {

                        const employee =
                            getEmployee(
                                editButton.dataset
                                    .editEmployee
                            );


                        if (
                            employee
                        ) {

                            openEmployeeModal(
                                employee
                            );

                        }


                        return;

                    }


                    const chatButton =
                        event.target
                            .closest(
                                "[data-chat-employee]"
                            );


                    if (
                        chatButton
                    ) {

                        openEmployeeChat(
                            chatButton.dataset
                                .chatEmployee
                        );


                        return;

                    }


                    const deleteButton =
                        event.target
                            .closest(
                                "[data-delete-employee]"
                            );


                    if (
                        deleteButton
                    ) {

                        deleteEmployee(
                            deleteButton.dataset
                                .deleteEmployee
                        );

                    }

                }

            );


        // =================================================
        // POSITION ACTIONS
        // =================================================

        $("positionsList")
            .addEventListener(

                "click",

                event => {


                    const editButton =
                        event.target
                            .closest(
                                "[data-edit-position]"
                            );


                    if (
                        editButton
                    ) {

                        editPosition(
                            editButton.dataset
                                .editPosition
                        );


                        return;

                    }


                    const deleteButton =
                        event.target
                            .closest(
                                "[data-delete-position]"
                            );


                    if (
                        deleteButton
                    ) {

                        deletePosition(
                            deleteButton.dataset
                                .deletePosition
                        );

                    }

                }

            );


        // =================================================
        // AUTH USERS
        // =================================================

        $("systemUsersList")
            .addEventListener(

                "click",

                event => {


                    const button =
                        event.target
                            .closest(
                                "[data-select-system-user]"
                            );


                    if (
                        !button
                        ||
                        button.disabled
                    ) {

                        return;

                    }


                    selectSystemUser(
                        button.dataset
                            .selectSystemUser
                    );

                }

            );


        // =================================================
        // COLOR
        // =================================================

        $("employeeColorPicker")
            .addEventListener(

                "click",

                event => {


                    const button =
                        event.target
                            .closest(
                                "[data-color]"
                            );


                    if (
                        !button
                    ) {

                        return;

                    }


                    setEmployeeColor(
                        button.dataset
                            .color
                    );

                }

            );


        document.addEventListener(

            "keydown",

            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeEmployeeChat();

                }

            }

        );

    }


    // =====================================================
    // POSITIONS
    // =====================================================

    async function loadPositions() {


        const {
            data,
            error
        } =
            await db
                .from(
                    "hr_positions"
                )
                .select(
                    `
                    id,
                    position_key,
                    name,
                    reports_to_position_id,
                    created_at,
                    updated_at
                    `
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

            console.error(
                error
            );

            return;

        }


        positions =
            data
            ||
            [];


        populatePositionSelects();

        renderPositions();

    }


    function populatePositionSelects() {


        const targets = [

            $("employeePosition"),

            $("employeeReportsTo"),

            $("filterPosition"),

            $("filterReportsTo")

        ];


        targets.forEach(
            select => {

                if (
                    !select
                ) {

                    return;

                }


                const firstOption =
                    select.options[0]
                        ?.outerHTML
                    ||
                    `<option value="">Todos</option>`;


                select.innerHTML =
                    firstOption;


                positions.forEach(
                    position => {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            position.id;


                        option.textContent =
                            `${position.position_key} · ${position.name}`;


                        select.appendChild(
                            option
                        );

                    }
                );

            }
        );


        populatePositionReportsTo();

    }


    function populatePositionReportsTo() {


        const select =
            $("positionReportsTo");


        select.innerHTML = `
            <option value="">
                Sin superior
            </option>
        `;


        positions
            .filter(
                position =>
                    position.id !==
                    editingPositionId
            )
            .forEach(
                position => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        position.id;


                    option.textContent =
                        `${position.position_key} · ${position.name}`;


                    select.appendChild(
                        option
                    );

                }
            );

    }


    function openPositionsModal() {


        resetPositionForm();

        renderPositions();

        positionsModal
            .classList
            .add(
                "active"
            );

    }


    function resetPositionForm() {


        editingPositionId =
            null;


        positionForm.reset();


        $("savePositionButton")
            .textContent =
            "Agregar";


        $("positionFormMessage")
            .textContent =
            "";


        populatePositionReportsTo();

    }


    async function savePosition(
        event
    ) {


        event.preventDefault();


        const key =
            $("positionKey")
                .value
                .trim();


        const name =
            $("positionName")
                .value
                .trim();


        const reportsTo =
            emptyToNull(
                $("positionReportsTo")
                    .value
            );


        if (
            !key
            ||
            !name
        ) {

            showFormMessage(
                "positionFormMessage",
                "Completa la clave y el puesto."
            );

            return;

        }


        $("savePositionButton")
            .disabled =
            true;


        try {


            let error;


            if (
                editingPositionId
            ) {

                const result =
                    await db
                        .from(
                            "hr_positions"
                        )
                        .update({

                            position_key:
                                key,

                            name:
                                name,

                            reports_to_position_id:
                                reportsTo

                        })
                        .eq(
                            "id",
                            editingPositionId
                        );


                error =
                    result.error;

            }

            else {

                const result =
                    await db
                        .from(
                            "hr_positions"
                        )
                        .insert({

                            position_key:
                                key,

                            name:
                                name,

                            reports_to_position_id:
                                reportsTo

                        });


                error =
                    result.error;

            }


            if (
                error
            ) {

                throw error;

            }


            await loadPositions();

            await loadEmployees();

            resetPositionForm();

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            showFormMessage(
                "positionFormMessage",
                error.message
                ||
                "No fue posible guardar el puesto."
            );

        }

        finally {

            $("savePositionButton")
                .disabled =
                false;

        }

    }


    function editPosition(
        positionId
    ) {


        const position =
            positions.find(
                item =>
                    item.id ===
                    positionId
            );


        if (
            !position
        ) {

            return;

        }


        editingPositionId =
            position.id;


        populatePositionReportsTo();


        $("positionKey")
            .value =
            position.position_key
            ||
            "";


        $("positionName")
            .value =
            position.name
            ||
            "";


        $("positionReportsTo")
            .value =
            position.reports_to_position_id
            ||
            "";


        $("savePositionButton")
            .textContent =
            "Guardar cambios";

    }


    async function deletePosition(
        positionId
    ) {


        const position =
            positions.find(
                item =>
                    item.id ===
                    positionId
            );


        if (
            !position
        ) {

            return;

        }


        const confirmed =
            window.confirm(
                `¿Eliminar el puesto "${position.name}"?`
            );


        if (
            !confirmed
        ) {

            return;

        }


        const {
            error
        } =
            await db
                .from(
                    "hr_positions"
                )
                .delete()
                .eq(
                    "id",
                    positionId
                );


        if (
            error
        ) {

            console.error(
                error
            );

            return;

        }


        await loadPositions();

        await loadEmployees();

    }


    function renderPositions() {


        $("positionCount")
            .textContent =
            positions.length;


        if (
            !positions.length
        ) {

            $("positionsList")
                .innerHTML = `
                    <div class="rh-empty visible">
                        <strong>
                            Sin puestos registrados
                        </strong>
                    </div>
                `;

            return;

        }


        $("positionsList")
            .innerHTML =
            positions
                .map(
                    position => {


                        const parent =
                            getPosition(
                                position
                                    .reports_to_position_id
                            );


                        return `
                            <div class="rh-position-item">

                                <span class="rh-position-key">
                                    ${escapeHtml(
                                        position.position_key
                                    )}
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        position.name
                                    )}
                                </strong>

                                <small>
                                    ${
                                        parent
                                            ?
                                            `Reporta a ${escapeHtml(parent.name)}`
                                            :
                                            "Sin superior"
                                    }
                                </small>

                                <div class="rh-row-actions">

                                    <button
                                        type="button"
                                        class="rh-icon-button"
                                        data-edit-position="${position.id}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        class="rh-icon-button delete"
                                        data-delete-position="${position.id}"
                                    >
                                        ×
                                    </button>

                                </div>

                            </div>
                        `;

                    }
                )
                .join(
                    ""
                );

    }


    // =====================================================
    // AUTH SYSTEM USERS
    // =====================================================

    async function loadSystemUsers() {


        const {
            data,
            error
        } =
            await db.rpc(
                "list_system_auth_users"
            );


        if (
            error
        ) {

            console.error(
                error
            );

            systemUsers =
                [];

            return;

        }


        systemUsers =
            data
            ||
            [];

    }


    function openSystemUsersModal() {


        $("systemUserSearch")
            .value =
            "";


        renderSystemUsers();


        systemUsersModal
            .classList
            .add(
                "active"
            );

    }


    function renderSystemUsers() {


        const query =
            normalize(
                $("systemUserSearch")
                    .value
            );


        const currentEmployeeId =
            editingEmployeeId;


        const filtered =
            systemUsers
                .filter(
                    user =>
                        !query
                        ||
                        normalize(
                            user.email
                        )
                        .includes(
                            query
                        )
                );


        $("systemUsersList")
            .innerHTML =
            filtered
                .map(
                    user => {


                        const linkedEmployee =
                            employees.find(
                                employee =>
                                    employee
                                        .system_auth_user_id
                                    ===
                                    user.user_id
                            );


                        const unavailable =
                            linkedEmployee
                            &&
                            linkedEmployee.id
                            !==
                            currentEmployeeId;


                        return `
                            <div class="rh-system-user-item">

                                <div>

                                    <strong>
                                        ${escapeHtml(
                                            user.email
                                        )}
                                    </strong>

                                    <small>
                                        ${
                                            unavailable
                                                ?
                                                `Ligado a ${escapeHtml(linkedEmployee.full_name)}`
                                                :
                                                "Disponible"
                                        }
                                    </small>

                                </div>

                                <button
                                    type="button"
                                    class="module-button"
                                    data-select-system-user="${user.user_id}"
                                    ${
                                        unavailable
                                            ?
                                            "disabled"
                                            :
                                            ""
                                    }
                                >
                                    Vincular
                                </button>

                            </div>
                        `;

                    }
                )
                .join(
                    ""
                );

    }


    function selectSystemUser(
        userId
    ) {


        const user =
            systemUsers.find(
                item =>
                    item.user_id ===
                    userId
            );


        if (
            !user
        ) {

            return;

        }


        $("employeeSystemAuthId")
            .value =
            user.user_id;


        $("selectedSystemEmail")
            .textContent =
            user.email;


        closeModal(
            "systemUsersModal"
        );

    }


    // =====================================================
    // EMPLOYEES
    // =====================================================

    async function loadEmployees() {


        const {
            data,
            error
        } =
            await db
                .from(
                    "hr_employees"
                )
                .select(
                    `
                    id,
                    payroll_number,
                    full_name,
                    company,
                    position_id,
                    reports_to_position_id,
                    imss_entry_date,
                    seniority_date,
                    agreement_letter_date,
                    birthday,
                    label_color,
                    active,
                    intranet_username,
                    system_auth_user_id,
                    created_by,
                    created_at,
                    updated_at
                    `
                )
                .order(
                    "full_name",
                    {
                        ascending:
                            true
                    }
                );


        if (
            error
        ) {

            console.error(
                error
            );

            return;

        }


        employees =
            data
            ||
            [];


        renderMetrics();

        renderEmployees();

        renderSystemUsers();

    }


    function openEmployeeModal(
        employee = null
    ) {


        employeeForm.reset();


        editingEmployeeId =
            employee?.id
            ||
            null;


        $("employeeFormMessage")
            .textContent =
            "";


        $("employeeModalTitle")
            .textContent =
            employee
                ?
                "Editar empleado"
                :
                "Nuevo empleado";


        $("employeeActive")
            .checked =
            employee
                ?
                Boolean(
                    employee.active
                )
                :
                true;


        $("employeePayroll")
            .value =
            employee?.payroll_number
            ||
            "";


        $("employeeName")
            .value =
            employee?.full_name
            ||
            "";


        $("employeeCompany")
            .value =
            employee?.company
            ||
            "";


        $("employeePosition")
            .value =
            employee?.position_id
            ||
            "";


        $("employeeReportsTo")
            .value =
            employee?.reports_to_position_id
            ||
            "";


        $("employeeImssDate")
            .value =
            employee?.imss_entry_date
            ||
            "";


        $("employeeSeniorityDate")
            .value =
            employee?.seniority_date
            ||
            "";


        $("employeeAgreementDate")
            .value =
            employee?.agreement_letter_date
            ||
            "";


        $("employeeBirthday")
            .value =
            employee?.birthday
            ||
            "";


        $("employeeIntranetUsername")
            .value =
            employee?.intranet_username
            ||
            "";


        $("employeeIntranetPassword")
            .value =
            "";


        $("employeeSystemAuthId")
            .value =
            employee?.system_auth_user_id
            ||
            "";


        const linkedUser =
            getSystemUser(
                employee?.system_auth_user_id
            );


        $("selectedSystemEmail")
            .textContent =
            linkedUser?.email
            ||
            "Sin correo vinculado";


        setEmployeeColor(
            employee?.label_color
            ||
            "#5F87B8"
        );


        employeeModal
            .classList
            .add(
                "active"
            );

    }


    async function saveEmployee(
        event
    ) {


        event.preventDefault();


        const username =
            $("employeeIntranetUsername")
                .value
                .trim();


        const password =
            $("employeeIntranetPassword")
                .value;


        if (
            !username
        ) {

            showFormMessage(
                "employeeFormMessage",
                "Asigna un usuario de intranet."
            );

            return;

        }


        if (
            !editingEmployeeId
            &&
            !password
        ) {

            showFormMessage(
                "employeeFormMessage",
                "Asigna la contraseña inicial de intranet."
            );

            return;

        }


        const employeeData = {

            payroll_number:
                $("employeePayroll")
                    .value
                    .trim(),

            full_name:
                $("employeeName")
                    .value
                    .trim(),

            company:
                $("employeeCompany")
                    .value,

            position_id:
                emptyToNull(
                    $("employeePosition")
                        .value
                ),

            reports_to_position_id:
                emptyToNull(
                    $("employeeReportsTo")
                        .value
                ),

            imss_entry_date:
                emptyToNull(
                    $("employeeImssDate")
                        .value
                ),

            seniority_date:
                emptyToNull(
                    $("employeeSeniorityDate")
                        .value
                ),

            agreement_letter_date:
                emptyToNull(
                    $("employeeAgreementDate")
                        .value
                ),

            birthday:
                emptyToNull(
                    $("employeeBirthday")
                        .value
                ),

            label_color:
                $("employeeLabelColor")
                    .value,

            active:
                $("employeeActive")
                    .checked,

            system_auth_user_id:
                emptyToNull(
                    $("employeeSystemAuthId")
                        .value
                ),

            intranet_username:
                username

        };


        if (
            !employeeData
                .payroll_number
            ||
            !employeeData
                .full_name
            ||
            !employeeData
                .company
        ) {

            showFormMessage(
                "employeeFormMessage",
                "Completa nómina, nombre y empresa."
            );

            return;

        }


        const saveButton =
            $("saveEmployeeButton");


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Guardando...";


        let createdEmployeeId =
            null;


        try {


            let employeeId;


            if (
                editingEmployeeId
            ) {

                const {
                    error
                } =
                    await db
                        .from(
                            "hr_employees"
                        )
                        .update(
                            employeeData
                        )
                        .eq(
                            "id",
                            editingEmployeeId
                        );


                if (
                    error
                ) {

                    throw error;

                }


                employeeId =
                    editingEmployeeId;

            }

            else {

                employeeData.created_by =
                    currentUser.id;


                const {
                    data,
                    error
                } =
                    await db
                        .from(
                            "hr_employees"
                        )
                        .insert(
                            employeeData
                        )
                        .select(
                            "id"
                        )
                        .single();


                if (
                    error
                ) {

                    throw error;

                }


                employeeId =
                    data.id;


                createdEmployeeId =
                    employeeId;

            }


            // =============================================
            // CREDENCIAL INTRANET
            // =============================================

            const {
                error:
                    credentialError
            } =
                await db.rpc(
                    "set_hr_employee_intranet_credentials",
                    {

                        p_employee_id:
                            employeeId,

                        p_username:
                            username,

                        p_password:
                            password
                            ||
                            null

                    }
                );


            if (
                credentialError
            ) {

                throw credentialError;

            }


            closeModal(
                "employeeModal"
            );


            await loadEmployees();

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            // Si falló la credencial justo después
            // de crear el empleado, limpiamos
            // el registro recién creado.

            if (
                createdEmployeeId
            ) {

                await db
                    .from(
                        "hr_employees"
                    )
                    .delete()
                    .eq(
                        "id",
                        createdEmployeeId
                    );

            }


            showFormMessage(
                "employeeFormMessage",
                error.message
                ||
                "No fue posible guardar el empleado."
            );

        }

        finally {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "Guardar empleado";

        }

    }


    async function deleteEmployee(
        employeeId
    ) {


        const employee =
            getEmployee(
                employeeId
            );


        if (
            !employee
        ) {

            return;

        }


        const confirmed =
            window.confirm(

                `¿Eliminar a ${employee.full_name}?\n\n` +

                "También se eliminarán sus actualizaciones."

            );


        if (
            !confirmed
        ) {

            return;

        }


        const {
            error
        } =
            await db
                .from(
                    "hr_employees"
                )
                .delete()
                .eq(
                    "id",
                    employeeId
                );


        if (
            error
        ) {

            console.error(
                error
            );

            return;

        }


        await loadEmployees();

    }


    // =====================================================
    // RENDER EMPLOYEES
    // =====================================================

    function renderEmployees() {


        const filtered =
            getFilteredEmployees();


        $("employeeCountLabel")
            .textContent =
            `${filtered.length} ${
                filtered.length === 1
                    ?
                    "empleado"
                    :
                    "empleados"
            }`;


        updateFilterCount();


        if (
            !filtered.length
        ) {

            employeesTableBody
                .innerHTML =
                "";


            emptyEmployees
                .classList
                .add(
                    "visible"
                );


            return;

        }


        emptyEmployees
            .classList
            .remove(
                "visible"
            );


        employeesTableBody
            .innerHTML =
            filtered
                .map(
                    employee =>
                        employeeRow(
                            employee
                        )
                )
                .join(
                    ""
                );

    }


    function employeeRow(
        employee
    ) {


        const position =
            getPosition(
                employee.position_id
            );


        const reportsTo =
            getPosition(
                employee
                    .reports_to_position_id
            );


        const systemUser =
            getSystemUser(
                employee
                    .system_auth_user_id
            );


        const initials =
            getInitials(
                employee.full_name
            );


        return `

            <tr
                style="
                    --employee-label:
                    ${escapeHtml(
                        employee.label_color
                        ||
                        "#5F87B8"
                    )}
                "
            >

                <td>

                    <div class="rh-employee-cell">

                        <div class="rh-employee-avatar">
                            ${escapeHtml(
                                initials
                            )}
                        </div>

                        <div class="rh-employee-copy">

                            <strong>
                                ${escapeHtml(
                                    employee.full_name
                                )}
                            </strong>

                            <small>
                                Nómina ${
                                    escapeHtml(
                                        employee.payroll_number
                                    )
                                }
                                ·
                                ${
                                    escapeHtml(
                                        employee.intranet_username
                                        ||
                                        "sin usuario"
                                    )
                                }
                            </small>

                        </div>

                    </div>

                </td>


                <td>

                    <span class="rh-company-pill">
                        ${escapeHtml(
                            employee.company
                        )}
                    </span>

                </td>


                <td>
                    ${
                        position
                            ?
                            escapeHtml(
                                position.name
                            )
                            :
                            "—"
                    }
                </td>


                <td>
                    ${
                        reportsTo
                            ?
                            escapeHtml(
                                reportsTo.name
                            )
                            :
                            "—"
                    }
                </td>


                <td>
                    ${formatDate(
                        employee.imss_entry_date
                    )}
                </td>


                <td>
                    ${formatDate(
                        employee.seniority_date
                    )}
                </td>


                <td>
                    ${formatBirthday(
                        employee.birthday
                    )}
                </td>


                <td>

                    ${
                        systemUser
                            ?
                            `
                                <span
                                    class="
                                        rh-system-pill
                                        linked
                                    "
                                >
                                    ${escapeHtml(
                                        systemUser.email
                                    )}
                                </span>
                            `
                            :
                            `
                                <span
                                    class="rh-system-pill"
                                >
                                    Sin vincular
                                </span>
                            `
                    }

                </td>


                <td>

                    <span
                        class="
                            rh-status-pill
                            ${
                                employee.active
                                    ?
                                    "active"
                                    :
                                    "inactive"
                            }
                        "
                    >
                        ${
                            employee.active
                                ?
                                "Activo"
                                :
                                "Inactivo"
                        }
                    </span>

                </td>


                <td>

                    <div class="rh-row-actions">

                        <button
                            type="button"
                            class="
                                rh-icon-button
                                chat
                            "
                            data-chat-employee="${employee.id}"
                            title="Seguimiento"
                        >
                            Chat
                        </button>

                        <button
                            type="button"
                            class="rh-icon-button"
                            data-edit-employee="${employee.id}"
                            title="Editar"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            class="
                                rh-icon-button
                                delete
                            "
                            data-delete-employee="${employee.id}"
                            title="Eliminar"
                        >
                            ×
                        </button>

                    </div>

                </td>

            </tr>

        `;

    }


    // =====================================================
    // FILTERS
    // =====================================================

    function getFilteredEmployees() {


        const globalQuery =
            normalize(
                $("employeeSearch")
                    .value
            );


        const payroll =
            normalize(
                $("filterPayroll")
                    .value
            );


        const name =
            normalize(
                $("filterName")
                    .value
            );


        const company =
            $("filterCompany")
                .value;


        const position =
            $("filterPosition")
                .value;


        const reportsTo =
            $("filterReportsTo")
                .value;


        const imssMonth =
            $("filterImssMonth")
                .value;


        const seniorityMonth =
            $("filterSeniorityMonth")
                .value;


        const agreementMonth =
            $("filterAgreementMonth")
                .value;


        const birthdayMonth =
            $("filterBirthdayMonth")
                .value;


        const systemEmail =
            $("filterSystemEmail")
                .value;


        const active =
            $("filterActive")
                .value;


        return employees.filter(
            employee => {


                const employeePosition =
                    getPosition(
                        employee.position_id
                    );


                const employeeReportsTo =
                    getPosition(
                        employee
                            .reports_to_position_id
                    );


                const authUser =
                    getSystemUser(
                        employee
                            .system_auth_user_id
                    );


                const searchable =
                    normalize(
                        [
                            employee.payroll_number,
                            employee.full_name,
                            employee.company,
                            employee.intranet_username,
                            employeePosition?.name,
                            employeeReportsTo?.name,
                            authUser?.email
                        ]
                        .filter(
                            Boolean
                        )
                        .join(
                            " "
                        )
                    );


                if (
                    globalQuery
                    &&
                    !searchable
                        .includes(
                            globalQuery
                        )
                ) {

                    return false;

                }


                if (
                    payroll
                    &&
                    !normalize(
                        employee
                            .payroll_number
                    )
                    .includes(
                        payroll
                    )
                ) {

                    return false;

                }


                if (
                    name
                    &&
                    !normalize(
                        employee.full_name
                    )
                    .includes(
                        name
                    )
                ) {

                    return false;

                }


                if (
                    company
                    &&
                    employee.company
                    !==
                    company
                ) {

                    return false;

                }


                if (
                    position
                    &&
                    employee.position_id
                    !==
                    position
                ) {

                    return false;

                }


                if (
                    reportsTo
                    &&
                    employee
                        .reports_to_position_id
                    !==
                    reportsTo
                ) {

                    return false;

                }


                if (
                    imssMonth
                    &&
                    !dateMatchesMonth(
                        employee.imss_entry_date,
                        imssMonth
                    )
                ) {

                    return false;

                }


                if (
                    seniorityMonth
                    &&
                    !dateMatchesMonth(
                        employee.seniority_date,
                        seniorityMonth
                    )
                ) {

                    return false;

                }


                if (
                    agreementMonth
                    &&
                    !dateMatchesMonth(
                        employee.agreement_letter_date,
                        agreementMonth
                    )
                ) {

                    return false;

                }


                if (
                    birthdayMonth
                    &&
                    !birthdayMatchesMonth(
                        employee.birthday,
                        birthdayMonth
                    )
                ) {

                    return false;

                }


                if (
                    systemEmail ===
                    "linked"

                    &&

                    !employee
                        .system_auth_user_id
                ) {

                    return false;

                }


                if (
                    systemEmail ===
                    "unlinked"

                    &&

                    employee
                        .system_auth_user_id
                ) {

                    return false;

                }


                if (
                    active !==
                    ""

                    &&

                    employee.active
                    !==
                    (
                        active ===
                        "true"
                    )
                ) {

                    return false;

                }


                return true;

            }
        );

    }


    function clearFilters() {


        $("employeeSearch")
            .value =
            "";


        [
            "filterPayroll",
            "filterName",
            "filterCompany",
            "filterPosition",
            "filterReportsTo",
            "filterImssMonth",
            "filterSeniorityMonth",
            "filterAgreementMonth",
            "filterBirthdayMonth",
            "filterSystemEmail",
            "filterActive"

        ].forEach(
            id => {

                $(id).value =
                    "";

            }
        );


        renderEmployees();

    }


    function updateFilterCount() {


        const values = [

            $("filterPayroll").value,
            $("filterName").value,
            $("filterCompany").value,
            $("filterPosition").value,
            $("filterReportsTo").value,
            $("filterImssMonth").value,
            $("filterSeniorityMonth").value,
            $("filterAgreementMonth").value,
            $("filterBirthdayMonth").value,
            $("filterSystemEmail").value,
            $("filterActive").value

        ];


        const count =
            values.filter(
                Boolean
            ).length;


        $("activeFilterCount")
            .textContent =
            count;

    }


    // =====================================================
    // METRICS
    // =====================================================

    function renderMetrics() {


        const activeEmployees =
            employees.filter(
                employee =>
                    employee.active
            );


        const month =
            currentMonth();


        const currentMonthNumber =
            month.slice(
                5,
                7
            );


        const newThisMonth =
            activeEmployees.filter(
                employee =>
                    employee
                        .imss_entry_date
                    ?.slice(
                        0,
                        7
                    )
                    ===
                    month
            ).length;


        const birthdays =
            activeEmployees.filter(
                employee =>
                    employee.birthday
                    &&
                    employee.birthday
                        .slice(
                            5,
                            7
                        )
                    ===
                    currentMonthNumber
            ).length;


        const unlinked =
            activeEmployees.filter(
                employee =>
                    !employee
                        .system_auth_user_id
            ).length;


        const jd =
            activeEmployees.filter(
                employee =>
                    employee.company ===
                    "JD"
            ).length;


        const isgtz =
            activeEmployees.filter(
                employee =>
                    employee.company ===
                    "ISGTZ"
            ).length;


        const lo =
            activeEmployees.filter(
                employee =>
                    employee.company ===
                    "LO"
            ).length;


        $("metricActive")
            .textContent =
            activeEmployees.length;


        $("metricNew")
            .textContent =
            newThisMonth;


        $("metricBirthdays")
            .textContent =
            birthdays;


        $("metricUnlinked")
            .textContent =
            unlinked;


        $("metricCompanies")
            .textContent =
            `JD ${jd} · ISGTZ ${isgtz} · LO ${lo}`;

    }


    // =====================================================
    // COLOR
    // =====================================================

    function setEmployeeColor(
        color
    ) {


        $("employeeLabelColor")
            .value =
            color;


        $("employeeColorPicker")
            .querySelectorAll(
                "[data-color]"
            )
            .forEach(
                button => {

                    button.classList
                        .toggle(
                            "selected",
                            button.dataset
                                .color
                            ===
                            color
                        );

                }
            );

    }


    // =====================================================
    // CHAT
    // =====================================================

    async function openEmployeeChat(
        employeeId
    ) {


        const employee =
            getEmployee(
                employeeId
            );


        if (
            !employee
        ) {

            return;

        }


        chatEmployeeId =
            employee.id;


        $("chatEmployeeName")
            .textContent =
            employee.full_name;


        $("chatEmployeeMeta")
            .textContent =
            `${employee.company} · Nómina ${employee.payroll_number}`;


        employeeChat
            .classList
            .add(
                "active"
            );


        chatBackdrop
            .classList
            .add(
                "active"
            );


        document.body.style
            .overflow =
            "hidden";


        $("employeeChatInput")
            .value =
            "";


        await loadEmployeeUpdates();

    }


    function closeEmployeeChat() {


        employeeChat
            .classList
            .remove(
                "active"
            );


        chatBackdrop
            .classList
            .remove(
                "active"
            );


        document.body.style
            .overflow =
            "";


        chatEmployeeId =
            null;

    }


    async function loadEmployeeUpdates() {


        if (
            !chatEmployeeId
        ) {

            return;

        }


        const {
            data,
            error
        } =
            await db
                .from(
                    "hr_employee_updates"
                )
                .select(
                    `
                    id,
                    employee_id,
                    body,
                    created_by_email,
                    created_at
                    `
                )
                .eq(
                    "employee_id",
                    chatEmployeeId
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                );


        if (
            error
        ) {

            console.error(
                error
            );

            return;

        }


        renderEmployeeUpdates(
            data
            ||
            []
        );

    }


    function renderEmployeeUpdates(
        updates
    ) {


        const container =
            $("employeeChatMessages");


        if (
            !updates.length
        ) {

            container.innerHTML = `
                <div class="rh-chat-empty">
                    Aún no hay actualizaciones.<br>
                    Escribe la primera nota.
                </div>
            `;

            return;

        }


        container.innerHTML =
            updates
                .map(
                    update => `

                        <article class="rh-note">

                            <p>
                                ${escapeHtml(
                                    update.body
                                )}
                            </p>

                            <div class="rh-note-footer">

                                <span>
                                    ${escapeHtml(
                                        update
                                            .created_by_email
                                    )}
                                </span>

                                <span>
                                    ${formatDateTime(
                                        update.created_at
                                    )}
                                </span>

                            </div>

                        </article>

                    `
                )
                .join(
                    ""
                );


        container.scrollTop =
            container.scrollHeight;

    }


    async function saveEmployeeUpdate() {


        const text =
            $("employeeChatInput")
                .value
                .trim();


        if (
            !chatEmployeeId
            ||
            !text
        ) {

            return;

        }


        $("sendEmployeeUpdate")
            .disabled =
            true;


        try {


            const {
                error
            } =
                await db
                    .from(
                        "hr_employee_updates"
                    )
                    .insert({

                        employee_id:
                            chatEmployeeId,

                        body:
                            text,

                        created_by_user_id:
                            currentUser.id,

                        created_by_email:
                            currentUser.email
                            ||
                            "usuario"

                    });


            if (
                error
            ) {

                throw error;

            }


            $("employeeChatInput")
                .value =
                "";


            await loadEmployeeUpdates();

        }

        catch (
            error
        ) {

            console.error(
                error
            );

        }

        finally {

            $("sendEmployeeUpdate")
                .disabled =
                false;

        }

    }


    // =====================================================
    // MODALS
    // =====================================================

    function closeModal(
        modalId
    ) {


        const modal =
            $(modalId);


        if (
            modal
        ) {

            modal.classList
                .remove(
                    "active"
                );

        }

    }


    // =====================================================
    // HELPERS
    // =====================================================

    function getEmployee(
        id
    ) {

        return employees.find(
            employee =>
                employee.id ===
                id
        );

    }


    function getPosition(
        id
    ) {

        if (
            !id
        ) {

            return null;

        }


        return positions.find(
            position =>
                position.id ===
                id
        )
        ||
        null;

    }


    function getSystemUser(
        userId
    ) {

        if (
            !userId
        ) {

            return null;

        }


        return systemUsers.find(
            user =>
                user.user_id ===
                userId
        )
        ||
        null;

    }


    function emptyToNull(
        value
    ) {


        const normalized =
            String(
                value
                ??
                ""
            )
            .trim();


        return normalized
            ?
            normalized
            :
            null;

    }


    function normalize(
        value
    ) {


        return String(
            value
            ??
            ""
        )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

    }


    function dateMatchesMonth(
        date,
        month
    ) {


        if (
            !date
            ||
            !month
        ) {

            return false;

        }


        return date.slice(
            0,
            7
        )
        ===
        month;

    }


    function birthdayMatchesMonth(
        date,
        month
    ) {


        if (
            !date
            ||
            !month
        ) {

            return false;

        }


        return date.slice(
            5,
            7
        )
        ===
        month.slice(
            5,
            7
        );

    }


    function currentMonth() {


        const date =
            new Date();


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth()
                +
                1
            )
            .padStart(
                2,
                "0"
            );


        return `${year}-${month}`;

    }


    function formatDate(
        value
    ) {


        if (
            !value
        ) {

            return "—";

        }


        const [
            year,
            month,
            day
        ] =
            value.split(
                "-"
            );


        return `${day}/${month}/${year}`;

    }


    function formatBirthday(
        value
    ) {


        if (
            !value
        ) {

            return "—";

        }


        const [
            ,
            month,
            day
        ] =
            value.split(
                "-"
            );


        return `${day}/${month}`;

    }


    function formatDateTime(
        value
    ) {


        if (
            !value
        ) {

            return "";

        }


        return new Intl.DateTimeFormat(
            "es-MX",
            {

                dateStyle:
                    "medium",

                timeStyle:
                    "short"

            }
        )
        .format(
            new Date(
                value
            )
        );

    }


    function getInitials(
        name
    ) {


        return String(
            name
            ||
            ""
        )
        .trim()
        .split(
            /\s+/
        )
        .slice(
            0,
            2
        )
        .map(
            part =>
                part[0]
                ||
                ""
        )
        .join(
            ""
        )
        .toUpperCase();

    }


    function showFormMessage(
        id,
        message
    ) {


        $(id).textContent =
            message;

    }


    function escapeHtml(
        value
    ) {


        return String(
            value
            ??
            ""
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

    }

})();