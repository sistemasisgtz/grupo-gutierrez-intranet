// =========================================================
// GRUPO GUTIERREZ
// RECURSOS HUMANOS
// VACACIONES
// =========================================================

(() => {

    "use strict";


    const db =
        window.ggSupabase;


    const $ =
        id =>
            document.getElementById(
                id
            );


    // =====================================================
    // CONFIGURACIÓN LABORAL
    //
    // 0 = domingo
    // 1 = lunes
    // ...
    // 6 = sábado
    //
    // Actualmente:
    // lunes a viernes.
    //
    // Si también cuentan sábados:
    // new Set([1,2,3,4,5,6])
    // =====================================================

    const WORKING_DAYS =
        new Set([
            1,
            2,
            3,
            4,
            5
        ]);


    // =====================================================
    // STATE
    // =====================================================

    let currentUser =
        null;


    let employees =
        [];


    let positions =
        [];


    let entitlements =
        [];


    let vacationRequests =
        [];


    let vacationDays =
        [];


    let policy = {

        early_release_months:
            6,

        early_release_fraction:
            .5,

        grant_window_months:
            6,

        claim_window_months:
            12

    };


    let selectedEmployeeId =
        null;


    let editingRequestId =
        null;


    let selectedStartDate =
        null;


    let selectedEndDate =
        null;


    let modalCalendarMonth =
        firstOfMonth(
            todayISO()
        );


    let globalCalendarMonth =
        firstOfMonth(
            todayISO()
        );


    // =====================================================
    // START
    // =====================================================

    document.addEventListener(
        "DOMContentLoaded",
        initializeVacations
    );


    async function initializeVacations() {


        if (
            !db
            ||
            !$("vacationsApp")
            ||
            !$("vacationsCalendarApp")
        ) {

            return;

        }


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

            return;

        }


        currentUser =
            data.user;


        buildVacationUI();

        buildVacationModal();

        bindVacationEvents();


        await loadVacationData();

    }


    // =====================================================
    // BUILD MAIN UI
    // =====================================================

    function buildVacationUI() {


        $("vacationsApp")
            .innerHTML = `

                <div class="rv-app">


                    <div class="rv-hero">

                        <div>

                            <span class="rv-eyebrow">
                                RECURSOS HUMANOS · CONTROL DE DESCANSOS
                            </span>

                            <h1>
                                Vacaciones
                            </h1>

                            <p>
                                Disponibilidad, antigüedad,
                                periodos acumulados y programación
                                de vacaciones del personal.
                            </p>

                        </div>


                        <div class="rv-policy-chip">

                            <strong>
                                Política GG
                            </strong>

                            50% del siguiente periodo
                            disponible 6 meses antes

                        </div>

                    </div>


                    <section
                        id="rvGlobalMetrics"
                        class="rv-global-metrics"
                    >
                    </section>


                    <section class="rv-upcoming-section">

                        <div class="rv-section-title">

                            <span>
                                PRÓXIMAS VACACIONES
                            </span>

                            <small>
                                Ordenadas por fecha
                            </small>

                        </div>

                        <div
                            id="rvUpcoming"
                            class="rv-upcoming-grid"
                        >
                        </div>

                    </section>


                    <div class="rv-toolbar">

                        <input
                            id="rvSearch"
                            type="search"
                            placeholder="Buscar empleado, puesto o nómina..."
                        >

                        <select id="rvCompanyFilter">

                            <option value="">
                                Todas las empresas
                            </option>

                            <option value="JD">
                                JD
                            </option>

                            <option value="ISGTZ">
                                ISGTZ
                            </option>

                            <option value="LO">
                                LO
                            </option>

                        </select>


                        <select id="rvBalanceFilter">

                            <option value="">
                                Todos los saldos
                            </option>

                            <option value="available">
                                Con días disponibles
                            </option>

                            <option value="zero">
                                Sin disponibilidad
                            </option>

                            <option value="expired">
                                Con días vencidos
                            </option>

                        </select>

                    </div>


                    <section
                        id="rvEmployeeGrid"
                        class="rv-employee-grid"
                    >
                    </section>


                </div>

            `;


        $("vacationsCalendarApp")
            .innerHTML = `

                <div class="rv-global-calendar-app">

                    <div class="rv-calendar-hero">

                        <div>

                            <span class="rv-eyebrow">
                                RECURSOS HUMANOS
                            </span>

                            <h1>
                                Calendario
                            </h1>

                            <p>
                                Vista general de vacaciones programadas.
                            </p>

                        </div>

                    </div>


                    <div
                        id="rvGlobalCalendar"
                        class="
                            rv-calendar-shell
                            rv-global-calendar
                        "
                    >
                    </div>

                </div>

            `;

    }


    // =====================================================
    // BUILD MODAL
    // =====================================================

    function buildVacationModal() {


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "vacationManagerModal";


        modal.className =
            "module-modal";


        modal.innerHTML = `

            <div
                class="
                    module-modal-card
                    module-modal-wide
                "
            >

                <div class="module-modal-header">

                    <div>

                        <span>
                            VACACIONES
                        </span>

                        <h2 id="rvModalEmployeeName">
                            Empleado
                        </h2>

                    </div>


                    <button
                        type="button"
                        id="rvCloseModal"
                        class="module-modal-close"
                    >
                        ×
                    </button>

                </div>


                <div class="module-modal-body">


                    <div
                        id="rvModalSummary"
                        class="rv-modal-summary"
                    >
                    </div>


                    <div
                        id="rvEmployeeCalendar"
                        class="rv-calendar-shell"
                    >
                    </div>


                    <div class="rv-selection">

                        <div>

                            <span>
                                SELECCIÓN
                            </span>

                            <strong id="rvSelectionLabel">
                                Selecciona el primer día
                            </strong>

                        </div>


                        <button
                            type="button"
                            id="rvClearSelection"
                            class="module-button"
                        >
                            Limpiar
                        </button>

                    </div>


                    <div class="rv-notes">

                        <label for="rvNotes">
                            Nota / comentario
                        </label>

                        <textarea
                            id="rvNotes"
                            placeholder="Opcional..."
                        ></textarea>

                    </div>


                    <div
                        id="rvVacationMessage"
                        class="rv-vacation-message"
                    >
                    </div>


                    <div class="rv-request-section">

                        <div class="rv-section-title">

                            <span>
                                VACACIONES REGISTRADAS
                            </span>

                            <small>
                                Modificar o eliminar
                            </small>

                        </div>

                        <div
                            id="rvRequestList"
                            class="rv-request-list"
                        >
                        </div>

                    </div>


                </div>


                <div class="module-modal-footer">

                    <button
                        type="button"
                        id="rvCancelEdit"
                        class="module-button"
                    >
                        Cancelar edición
                    </button>

                    <button
                        type="button"
                        id="rvSaveVacation"
                        class="
                            module-button
                            module-button-primary
                        "
                    >
                        Agregar vacaciones
                    </button>

                </div>

            </div>

        `;


        document.body
            .appendChild(
                modal
            );

    }


    // =====================================================
    // EVENTS
    // =====================================================

    function bindVacationEvents() {


        $("rvSearch")
            .addEventListener(
                "input",
                renderEmployeeCards
            );


        $("rvCompanyFilter")
            .addEventListener(
                "change",
                renderEmployeeCards
            );


        $("rvBalanceFilter")
            .addEventListener(
                "change",
                renderEmployeeCards
            );


        $("rvEmployeeGrid")
            .addEventListener(

                "click",

                event => {

                    const card =
                        event.target.closest(
                            "[data-vacation-employee]"
                        );


                    if (
                        !card
                    ) {

                        return;

                    }


                    openVacationManager(
                        card.dataset
                            .vacationEmployee
                    );

                }

            );


        $("rvCloseModal")
            .addEventListener(
                "click",
                closeVacationManager
            );


        $("rvClearSelection")
            .addEventListener(
                "click",
                clearVacationSelection
            );


        $("rvCancelEdit")
            .addEventListener(
                "click",
                resetVacationEditor
            );


        $("rvSaveVacation")
            .addEventListener(
                "click",
                saveVacation
            );


        $("rvEmployeeCalendar")
            .addEventListener(

                "click",

                event => {


                    const nav =
                        event.target.closest(
                            "[data-rv-modal-nav]"
                        );


                    if (
                        nav
                    ) {

                        modalCalendarMonth =
                            addMonthsISO(
                                modalCalendarMonth,
                                Number(
                                    nav.dataset
                                        .rvModalNav
                                )
                            );


                        renderEmployeeCalendar();

                        return;

                    }


                    const day =
                        event.target.closest(
                            "[data-rv-select-date]"
                        );


                    if (
                        !day
                        ||
                        day.disabled
                    ) {

                        return;

                    }


                    selectVacationDate(
                        day.dataset
                            .rvSelectDate
                    );

                }

            );


        $("rvRequestList")
            .addEventListener(

                "click",

                event => {


                    const edit =
                        event.target.closest(
                            "[data-edit-vacation]"
                        );


                    if (
                        edit
                    ) {

                        editVacationRequest(
                            edit.dataset
                                .editVacation
                        );

                        return;

                    }


                    const remove =
                        event.target.closest(
                            "[data-delete-vacation]"
                        );


                    if (
                        remove
                    ) {

                        deleteVacationRequest(
                            remove.dataset
                                .deleteVacation
                        );

                    }

                }

            );


        $("rvGlobalCalendar")
            .addEventListener(

                "click",

                event => {

                    const nav =
                        event.target.closest(
                            "[data-rv-global-nav]"
                        );


                    if (
                        !nav
                    ) {

                        return;

                    }


                    globalCalendarMonth =
                        addMonthsISO(
                            globalCalendarMonth,
                            Number(
                                nav.dataset
                                    .rvGlobalNav
                            )
                        );


                    renderGlobalCalendar();

                }

            );

    }


    // =====================================================
    // LOAD DATA
    // =====================================================

    async function loadVacationData() {


        const [
            employeeResult,
            positionResult,
            entitlementResult,
            policyResult,
            requestResult,
            daysResult
        ] =
            await Promise.all([


                db
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
                        birthday,
                        label_color,
                        active
                        `
                    )
                    .order(
                        "full_name"
                    ),


                db
                    .from(
                        "hr_positions"
                    )
                    .select(
                        `
                        id,
                        position_key,
                        name
                        `
                    ),


                db
                    .from(
                        "hr_vacation_entitlements"
                    )
                    .select(
                        `
                        service_year_from,
                        service_year_to,
                        vacation_days
                        `
                    )
                    .order(
                        "service_year_from"
                    ),


                db
                    .from(
                        "hr_vacation_policy"
                    )
                    .select(
                        "*"
                    )
                    .eq(
                        "id",
                        1
                    )
                    .maybeSingle(),


                db
                    .from(
                        "hr_vacation_requests"
                    )
                    .select(
                        `
                        id,
                        employee_id,
                        start_date,
                        end_date,
                        days_count,
                        notes,
                        status,
                        created_by_email,
                        updated_by_email,
                        created_at,
                        updated_at
                        `
                    )
                    .eq(
                        "status",
                        "scheduled"
                    ),


                db
                    .from(
                        "hr_vacation_days"
                    )
                    .select(
                        `
                        id,
                        request_id,
                        employee_id,
                        vacation_date
                        `
                    )
                    .order(
                        "vacation_date"
                    )


            ]);


        [
            employeeResult,
            positionResult,
            entitlementResult,
            requestResult,
            daysResult
        ]
        .forEach(
            result => {

                if (
                    result.error
                ) {

                    console.error(
                        result.error
                    );

                }

            }
        );


        employees =
            employeeResult.data
            ||
            [];


        positions =
            positionResult.data
            ||
            [];


        entitlements =
            entitlementResult.data
            ||
            [];


        vacationRequests =
            requestResult.data
            ||
            [];


        vacationDays =
            daysResult.data
            ||
            [];


        if (
            policyResult.data
        ) {

            policy = {

                ...policy,

                ...policyResult.data

            };

        }


        renderEverything();

    }


    function renderEverything() {


        renderGlobalMetrics();

        renderUpcomingVacations();

        renderEmployeeCards();

        renderGlobalCalendar();


        if (
            selectedEmployeeId
        ) {

            renderVacationModal();

        }

    }


    // =====================================================
    // GLOBAL METRICS
    // =====================================================

    function renderGlobalMetrics() {


        const today =
            todayISO();


        const thirtyDays =
            addDaysISO(
                today,
                30
            );


        const activeEmployees =
            employees.filter(
                employee =>
                    employee.active
            );


        const onVacationToday =
            new Set(
                vacationDays

                    .filter(
                        day =>
                            day.vacation_date ===
                            today
                    )

                    .map(
                        day =>
                            day.employee_id
                    )
            )
            .size;


        const upcomingEmployees =
            new Set(
                vacationRequests

                    .filter(
                        request =>
                            request.start_date >=
                            today

                            &&

                            request.start_date <=
                            thirtyDays
                    )

                    .map(
                        request =>
                            request.employee_id
                    )
            )
            .size;


        const futureDays =
            vacationDays.filter(
                day =>
                    day.vacation_date >
                    today
            ).length;


        const availableDays =
            activeEmployees.reduce(
                (
                    total,
                    employee
                ) => {

                    const ledger =
                        buildVacationLedger(
                            employee
                        );


                    return total
                        +
                        ledger.availableNow;

                },
                0
            );


        $("rvGlobalMetrics")
            .innerHTML = `

                ${globalMetric(
                    "DE VACACIONES HOY",
                    onVacationToday,
                    "empleados"
                )}

                ${globalMetric(
                    "PRÓXIMOS 30 DÍAS",
                    upcomingEmployees,
                    "personas programadas"
                )}

                ${globalMetric(
                    "DÍAS PROGRAMADOS",
                    futureDays,
                    "días reservados"
                )}

                ${globalMetric(
                    "SALDO DISPONIBLE",
                    formatNumber(
                        availableDays
                    ),
                    "días en toda la organización"
                )}

            `;

    }


    function globalMetric(
        label,
        number,
        description
    ) {


        return `

            <article class="rv-global-metric">

                <span>
                    ${label}
                </span>

                <strong>
                    ${number}
                </strong>

                <small>
                    ${description}
                </small>

            </article>

        `;

    }


    // =====================================================
    // UPCOMING
    // =====================================================

    function renderUpcomingVacations() {


        const today =
            todayISO();


        const upcoming =
            vacationRequests

                .filter(
                    request =>
                        request.start_date >=
                        today
                )

                .sort(
                    (
                        a,
                        b
                    ) =>
                        a.start_date
                            .localeCompare(
                                b.start_date
                            )
                )

                .slice(
                    0,
                    10
                );


        if (
            !upcoming.length
        ) {

            $("rvUpcoming")
                .innerHTML = `

                    <div class="rv-upcoming-empty">
                        No hay vacaciones próximas registradas.
                    </div>

                `;


            return;

        }


        $("rvUpcoming")
            .innerHTML =
            upcoming
                .map(
                    request => {


                        const employee =
                            getEmployee(
                                request.employee_id
                            );


                        if (
                            !employee
                        ) {

                            return "";

                        }


                        const position =
                            getPosition(
                                employee.position_id
                            );


                        return `

                            <article
                                class="rv-upcoming-card"
                                style="
                                    --employee-label:
                                    ${
                                        employee.label_color
                                        ||
                                        "#5F87B8"
                                    }
                                "
                            >

                                <strong>
                                    ${escapeHtml(
                                        employee.full_name
                                    )}
                                </strong>

                                <p>
                                    ${
                                        escapeHtml(
                                            position?.name
                                            ||
                                            "Sin puesto"
                                        )
                                    }
                                </p>

                                <span class="rv-upcoming-date">
                                    ${formatDateRange(
                                        request.start_date,
                                        request.end_date
                                    )}
                                </span>

                                <span class="rv-upcoming-days">
                                    ${
                                        request.days_count
                                    }
                                    ${
                                        request.days_count ===
                                        1
                                            ?
                                            "día"
                                            :
                                            "días"
                                    }
                                </span>

                            </article>

                        `;

                    }
                )
                .join(
                    ""
                );

    }


    // =====================================================
    // EMPLOYEE CARDS
    // =====================================================

    function renderEmployeeCards() {


        const query =
            normalize(
                $("rvSearch")
                    .value
            );


        const company =
            $("rvCompanyFilter")
                .value;


        const balanceFilter =
            $("rvBalanceFilter")
                .value;


        const filtered =
            employees

                .filter(
                    employee =>
                        employee.active
                )

                .filter(
                    employee => {


                        const position =
                            getPosition(
                                employee.position_id
                            );


                        const text =
                            normalize(
                                [
                                    employee.full_name,
                                    employee.payroll_number,
                                    employee.company,
                                    position?.name
                                ]
                                .filter(
                                    Boolean
                                )
                                .join(
                                    " "
                                )
                            );


                        if (
                            query
                            &&
                            !text.includes(
                                query
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


                        const ledger =
                            buildVacationLedger(
                                employee
                            );


                        if (
                            balanceFilter ===
                            "available"
                            &&
                            ledger.availableNow <=
                            0
                        ) {

                            return false;

                        }


                        if (
                            balanceFilter ===
                            "zero"
                            &&
                            ledger.availableNow >
                            0
                        ) {

                            return false;

                        }


                        if (
                            balanceFilter ===
                            "expired"
                            &&
                            ledger.expired <=
                            0
                        ) {

                            return false;

                        }


                        return true;

                    }
                );


        if (
            !filtered.length
        ) {

            $("rvEmployeeGrid")
                .innerHTML = `

                    <div class="rv-upcoming-empty">
                        No hay empleados que coincidan con los filtros.
                    </div>

                `;

            return;

        }


        $("rvEmployeeGrid")
            .innerHTML =
            filtered
                .map(
                    employee =>
                        employeeVacationCard(
                            employee
                        )
                )
                .join(
                    ""
                );

    }


    function employeeVacationCard(
        employee
    ) {


        const position =
            getPosition(
                employee.position_id
            );


        const ledger =
            buildVacationLedger(
                employee
            );


        const seniority =
            calculateSeniority(
                getSeniorityDate(
                    employee
                )
            );


        return `

            <article
                class="rv-employee-card"
                data-vacation-employee="${employee.id}"
                style="
                    --employee-label:
                    ${
                        employee.label_color
                        ||
                        "#5F87B8"
                    }
                "
            >

                <div class="rv-employee-top">

                    <div class="rv-employee-avatar">
                        ${getInitials(
                            employee.full_name
                        )}
                    </div>


                    <div class="rv-employee-main">

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
                                    position?.name
                                    ||
                                    "Sin puesto"
                                )
                            }
                        </small>

                    </div>


                    <span class="rv-employee-company">
                        ${escapeHtml(
                            employee.company
                        )}
                    </span>

                </div>


                <div class="rv-seniority">

                    <span>
                        ANTIGÜEDAD
                    </span>

                    <strong>
                        ${formatSeniority(
                            seniority
                        )}
                    </strong>

                </div>


                <div class="rv-card-stats">

                    ${cardStat(
                        "PERIODO",
                        ledger.currentEntitlement
                    )}

                    ${cardStat(
                        "DISPONIBLE",
                        formatNumber(
                            ledger.availableNow
                        ),
                        "available"
                    )}

                    ${cardStat(
                        "ACUMULADO",
                        formatNumber(
                            ledger.accumulated
                        )
                    )}

                    ${cardStat(
                        "DISFRUTADOS",
                        ledger.enjoyed
                    )}

                    ${cardStat(
                        "PROGRAMADOS",
                        ledger.scheduled
                    )}

                    ${cardStat(
                        "VENCIDOS",
                        formatNumber(
                            ledger.expired
                        ),
                        ledger.expired >
                        0
                            ?
                            "warning"
                            :
                            ""
                    )}

                </div>


                <div class="rv-future-row">

                    <div class="rv-future-item">

                        <span>
                            PRÓXIMO DESBLOQUEO
                        </span>

                        <strong>
                            ${
                                ledger.nextEarly
                                    ?
                                    `+${
                                        ledger
                                            .nextEarly
                                            .earlyDays
                                    } · ${
                                        formatShortDate(
                                            ledger
                                                .nextEarly
                                                .earlyReleaseDate
                                        )
                                    }`
                                    :
                                    "—"
                            }
                        </strong>

                    </div>


                    <div class="rv-future-item">

                        <span>
                            PRÓXIMO PERIODO
                        </span>

                        <strong>
                            ${
                                ledger.nextFull
                                    ?
                                    `${
                                        ledger
                                            .nextFull
                                            .entitlement
                                    } días · ${
                                        formatShortDate(
                                            ledger
                                                .nextFull
                                                .fullReleaseDate
                                        )
                                    }`
                                    :
                                    "—"
                            }
                        </strong>

                    </div>

                </div>


                <div class="rv-card-footer">
                    Administrar vacaciones →
                </div>

            </article>

        `;

    }


    function cardStat(
        label,
        value,
        className = ""
    ) {


        return `

            <div
                class="
                    rv-card-stat
                    ${className}
                "
            >

                <span>
                    ${label}
                </span>

                <strong>
                    ${value}
                </strong>

            </div>

        `;

    }


    // =====================================================
    // OPEN MANAGER
    // =====================================================

    function openVacationManager(
        employeeId
    ) {


        selectedEmployeeId =
            employeeId;


        editingRequestId =
            null;


        selectedStartDate =
            null;


        selectedEndDate =
            null;


        $("rvNotes")
            .value =
            "";


        $("rvVacationMessage")
            .textContent =
            "";


        const employee =
            getEmployee(
                employeeId
            );


        if (
            !employee
        ) {

            return;

        }


        $("rvModalEmployeeName")
            .textContent =
            employee.full_name;


        const nextRequest =
            getEmployeeRequests(
                employee.id
            )
            .find(
                request =>
                    request.start_date >=
                    todayISO()
            );


        modalCalendarMonth =
            firstOfMonth(
                nextRequest?.start_date
                ||
                todayISO()
            );


        $("vacationManagerModal")
            .classList
            .add(
                "active"
            );


        renderVacationModal();

    }


    function closeVacationManager() {


        $("vacationManagerModal")
            .classList
            .remove(
                "active"
            );


        selectedEmployeeId =
            null;

    }


    function renderVacationModal() {


        const employee =
            getEmployee(
                selectedEmployeeId
            );


        if (
            !employee
        ) {

            return;

        }


        const ledger =
            buildVacationLedger(
                employee
            );


        $("rvModalSummary")
            .innerHTML = `

                ${modalStat(
                    "DISPONIBLE",
                    formatNumber(
                        ledger.availableNow
                    )
                )}

                ${modalStat(
                    "ACUMULADO",
                    formatNumber(
                        ledger.accumulated
                    )
                )}

                ${modalStat(
                    "DISFRUTADOS",
                    ledger.enjoyed
                )}

                ${modalStat(
                    "PROGRAMADOS",
                    ledger.scheduled
                )}

                ${modalStat(
                    "VENCIDOS",
                    formatNumber(
                        ledger.expired
                    )
                )}

            `;


        renderEmployeeCalendar();

        renderEmployeeRequests();

        updateSelectionLabel();

    }


    function modalStat(
        label,
        value
    ) {


        return `

            <div class="rv-modal-stat">

                <span>
                    ${label}
                </span>

                <strong>
                    ${value}
                </strong>

            </div>

        `;

    }


    // =====================================================
    // EMPLOYEE CALENDAR
    // =====================================================

    function renderEmployeeCalendar() {


        $("rvEmployeeCalendar")
            .innerHTML = `

                ${calendarHeader(
                    modalCalendarMonth,
                    "modal"
                )}

                ${calendarWeekdays()}

                <div class="rv-calendar-grid">

                    ${buildCalendarDays(
                        modalCalendarMonth,
                        true
                    )}

                </div>

            `;

    }


    // =====================================================
    // GLOBAL CALENDAR
    // =====================================================

    function renderGlobalCalendar() {


        $("rvGlobalCalendar")
            .innerHTML = `

                ${calendarHeader(
                    globalCalendarMonth,
                    "global"
                )}

                ${calendarWeekdays()}

                <div class="rv-calendar-grid">

                    ${buildCalendarDays(
                        globalCalendarMonth,
                        false
                    )}

                </div>

            `;

    }


    function calendarHeader(
        month,
        mode
    ) {


        const prevAttribute =
            mode ===
            "modal"
                ?
                "data-rv-modal-nav=\"-1\""
                :
                "data-rv-global-nav=\"-1\"";


        const nextAttribute =
            mode ===
            "modal"
                ?
                "data-rv-modal-nav=\"1\""
                :
                "data-rv-global-nav=\"1\"";


        return `

            <div class="rv-calendar-header">

                <button
                    type="button"
                    class="rv-calendar-nav"
                    ${prevAttribute}
                >
                    ←
                </button>

                <strong>
                    ${formatMonthTitle(
                        month
                    )}
                </strong>

                <button
                    type="button"
                    class="rv-calendar-nav"
                    ${nextAttribute}
                >
                    →
                </button>

            </div>

        `;

    }


    function calendarWeekdays() {


        return `

            <div class="rv-calendar-weekdays">

                <span>DOM</span>
                <span>LUN</span>
                <span>MAR</span>
                <span>MIÉ</span>
                <span>JUE</span>
                <span>VIE</span>
                <span>SÁB</span>

            </div>

        `;

    }


    function buildCalendarDays(
        monthISO,
        selectable
    ) {


        const monthDate =
            parseISODate(
                monthISO
            );


        const first =
            new Date(
                monthDate.getFullYear(),
                monthDate.getMonth(),
                1,
                12
            );


        const calendarStart =
            new Date(
                first
            );


        calendarStart.setDate(
            first.getDate()
            -
            first.getDay()
        );


        const selectedDays =
            new Set(
                getSelectedVacationDates()
            );


        const daysHtml =
            [];


        for (
            let index = 0;
            index < 42;
            index++
        ) {


            const dayDate =
                new Date(
                    calendarStart
                );


            dayDate.setDate(
                calendarStart.getDate()
                +
                index
            );


            const iso =
                dateToISO(
                    dayDate
                );


            const outside =
                dayDate.getMonth()
                !==
                monthDate.getMonth();


            const weekday =
                dayDate.getDay();


            const weekend =
                !WORKING_DAYS
                    .has(
                        weekday
                    );


            const selected =
                selectedDays.has(
                    iso
                );


            const today =
                iso ===
                todayISO();


            const events =
                getVacationEventsForDate(
                    iso
                );


            const classes = [

                "rv-day",

                outside
                    ?
                    "outside"
                    :
                    "",

                weekend
                    ?
                    "weekend"
                    :
                    "",

                selected
                    ?
                    "selected"
                    :
                    "",

                today
                    ?
                    "today"
                    :
                    ""

            ]
            .filter(
                Boolean
            )
            .join(
                " "
            );


            const tag =
                selectable
                    ?
                    "button"
                    :
                    "div";


            const selectAttribute =
                selectable
                    ?
                    `data-rv-select-date="${iso}"`
                    :
                    "";


            const disabled =
                selectable
                &&
                weekend
                    ?
                    "disabled"
                    :
                    "";


            daysHtml.push(`

                <${tag}
                    type="${
                        selectable
                            ?
                            "button"
                            :
                            ""
                    }"
                    class="${classes}"
                    ${selectAttribute}
                    ${disabled}
                >

                    <span class="rv-day-number">
                        ${dayDate.getDate()}
                    </span>

                    <div class="rv-day-events">

                        ${renderCalendarEvents(
                            events
                        )}

                    </div>

                </${tag}>

            `);

        }


        return daysHtml.join(
            ""
        );

    }


    function getVacationEventsForDate(
        date
    ) {


        return vacationDays

            .filter(
                day =>
                    day.vacation_date ===
                    date
            )

            .map(
                day => {

                    const employee =
                        getEmployee(
                            day.employee_id
                        );


                    return {

                        employee,

                        day

                    };

                }
            )

            .filter(
                item =>
                    item.employee
            );

    }


    function renderCalendarEvents(
        events
    ) {


        const visible =
            events.slice(
                0,
                3
            );


        let html =
            visible
                .map(
                    item => `

                        <div
                            class="rv-day-event"
                            style="
                                --employee-label:
                                ${
                                    item.employee
                                        .label_color
                                    ||
                                    "#5F87B8"
                                }
                            "
                            title="${
                                escapeHtml(
                                    item.employee
                                        .full_name
                                )
                            }"
                        >
                            ${
                                escapeHtml(
                                    shortEmployeeName(
                                        item.employee
                                            .full_name
                                    )
                                )
                            }
                        </div>

                    `
                )
                .join(
                    ""
                );


        if (
            events.length >
            3
        ) {

            html += `

                <span class="rv-more-events">
                    +${
                        events.length
                        -
                        3
                    }
                </span>

            `;

        }


        return html;

    }


    // =====================================================
    // DATE SELECTION
    // =====================================================

    function selectVacationDate(
        date
    ) {


        if (
            !selectedStartDate
            ||
            (
                selectedStartDate
                &&
                selectedEndDate
            )
        ) {

            selectedStartDate =
                date;


            selectedEndDate =
                null;

        }

        else {


            if (
                date <
                selectedStartDate
            ) {

                selectedEndDate =
                    selectedStartDate;


                selectedStartDate =
                    date;

            }

            else {

                selectedEndDate =
                    date;

            }

        }


        renderEmployeeCalendar();

        updateSelectionLabel();

    }


    function clearVacationSelection() {


        selectedStartDate =
            null;


        selectedEndDate =
            null;


        editingRequestId =
            null;


        $("rvNotes")
            .value =
            "";


        $("rvVacationMessage")
            .textContent =
            "";


        $("rvSaveVacation")
            .textContent =
            "Agregar vacaciones";


        renderEmployeeCalendar();

        updateSelectionLabel();

    }


    function resetVacationEditor() {


        clearVacationSelection();

    }


    function getSelectedVacationDates() {


        if (
            !selectedStartDate
        ) {

            return [];

        }


        const end =
            selectedEndDate
            ||
            selectedStartDate;


        return getWorkingDatesBetween(
            selectedStartDate,
            end
        );

    }


    function updateSelectionLabel() {


        const selected =
            getSelectedVacationDates();


        if (
            !selectedStartDate
        ) {

            $("rvSelectionLabel")
                .textContent =
                "Selecciona el primer día";


            return;

        }


        if (
            selectedStartDate
            &&
            !selectedEndDate
        ) {

            $("rvSelectionLabel")
                .textContent =
                `${
                    formatShortDate(
                        selectedStartDate
                    )
                } · selecciona fecha final`;


            return;

        }


        $("rvSelectionLabel")
            .textContent =
            `${
                formatShortDate(
                    selectedStartDate
                )
            } → ${
                formatShortDate(
                    selectedEndDate
                )
            } · ${
                selected.length
            } ${
                selected.length ===
                1
                    ?
                    "día laboral"
                    :
                    "días laborales"
            }`;

    }


    // =====================================================
    // SAVE VACATION
    // =====================================================

    async function saveVacation() {


        const employee =
            getEmployee(
                selectedEmployeeId
            );


        if (
            !employee
        ) {

            return;

        }


        if (
            !getSeniorityDate(
                employee
            )
        ) {

            showVacationMessage(
                "Este empleado no tiene fecha de antigüedad ni ingreso IMSS."
            );

            return;

        }


        const selectedDates =
            getSelectedVacationDates();


        if (
            !selectedDates.length
        ) {

            showVacationMessage(
                "Selecciona uno o más días laborales."
            );

            return;

        }


        // =================================================
        // SIMULAR ANTES DE GUARDAR
        // =================================================

        const ledger =
            buildVacationLedger(

                employee,

                {
                    excludeRequestId:
                        editingRequestId,

                    extraDates:
                        selectedDates
                }

            );


        if (
            ledger.unallocatedDates
                .length
        ) {

            showVacationMessage(

                `El periodo seleccionado excede los días disponibles. ` +

                `${ledger.unallocatedDates.length} día(s) no pueden cargarse a ningún periodo vigente.`

            );

            return;

        }


        const saveButton =
            $("rvSaveVacation");


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Guardando...";


        try {


            const {
                error
            } =
                await db.rpc(
                    "save_hr_vacation_request",
                    {

                        p_request_id:
                            editingRequestId
                            ||
                            null,

                        p_employee_id:
                            employee.id,

                        p_dates:
                            selectedDates,

                        p_notes:
                            $("rvNotes")
                                .value
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


            await reloadVacationRecords();


            clearVacationSelection();

            renderEverything();

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            showVacationMessage(
                error.message
                ||
                "No fue posible guardar las vacaciones."
            );

        }

        finally {

            saveButton.disabled =
                false;


            saveButton.textContent =
                editingRequestId
                    ?
                    "Guardar cambios"
                    :
                    "Agregar vacaciones";

        }

    }


    // =====================================================
    // REQUEST LIST
    // =====================================================

    function renderEmployeeRequests() {


        const requests =
            getEmployeeRequests(
                selectedEmployeeId
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.start_date
                        .localeCompare(
                            a.start_date
                        )
            );


        if (
            !requests.length
        ) {

            $("rvRequestList")
                .innerHTML = `

                    <div class="rv-upcoming-empty">
                        Sin vacaciones registradas.
                    </div>

                `;

            return;

        }


        $("rvRequestList")
            .innerHTML =
            requests
                .map(
                    request => `

                        <div class="rv-request">

                            <div>

                                <strong>
                                    ${
                                        formatDateRange(
                                            request.start_date,
                                            request.end_date
                                        )
                                    }
                                    ·
                                    ${
                                        request.days_count
                                    }
                                    ${
                                        request.days_count ===
                                        1
                                            ?
                                            "día"
                                            :
                                            "días"
                                    }
                                </strong>

                                <small>
                                    ${
                                        escapeHtml(
                                            request.notes
                                            ||
                                            "Sin comentario"
                                        )
                                    }
                                </small>

                            </div>


                            <div class="rv-request-actions">

                                <button
                                    type="button"
                                    class="module-button"
                                    data-edit-vacation="${request.id}"
                                >
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    class="
                                        module-button
                                        module-button-danger
                                    "
                                    data-delete-vacation="${request.id}"
                                >
                                    Eliminar
                                </button>

                            </div>

                        </div>

                    `
                )
                .join(
                    ""
                );

    }


    function editVacationRequest(
        requestId
    ) {


        const request =
            vacationRequests.find(
                item =>
                    item.id ===
                    requestId
            );


        if (
            !request
        ) {

            return;

        }


        editingRequestId =
            request.id;


        selectedStartDate =
            request.start_date;


        selectedEndDate =
            request.end_date;


        $("rvNotes")
            .value =
            request.notes
            ||
            "";


        modalCalendarMonth =
            firstOfMonth(
                request.start_date
            );


        $("rvSaveVacation")
            .textContent =
            "Guardar cambios";


        $("rvVacationMessage")
            .textContent =
            "";


        renderEmployeeCalendar();

        updateSelectionLabel();

    }


    async function deleteVacationRequest(
        requestId
    ) {


        const request =
            vacationRequests.find(
                item =>
                    item.id ===
                    requestId
            );


        if (
            !request
        ) {

            return;

        }


        const confirmed =
            window.confirm(

                `¿Eliminar estas vacaciones?\n\n` +

                `${formatDateRange(
                    request.start_date,
                    request.end_date
                )}`

            );


        if (
            !confirmed
        ) {

            return;

        }


        const {
            error
        } =
            await db.rpc(
                "cancel_hr_vacation_request",
                {

                    p_request_id:
                        requestId

                }
            );


        if (
            error
        ) {

            console.error(
                error
            );


            showVacationMessage(
                error.message
                ||
                "No fue posible eliminar las vacaciones."
            );


            return;

        }


        await reloadVacationRecords();


        clearVacationSelection();

        renderEverything();

    }


    // =====================================================
    // RELOAD ONLY VACATIONS
    // =====================================================

    async function reloadVacationRecords() {


        const [
            requestsResult,
            daysResult
        ] =
            await Promise.all([


                db
                    .from(
                        "hr_vacation_requests"
                    )
                    .select(
                        `
                        id,
                        employee_id,
                        start_date,
                        end_date,
                        days_count,
                        notes,
                        status,
                        created_by_email,
                        updated_by_email,
                        created_at,
                        updated_at
                        `
                    )
                    .eq(
                        "status",
                        "scheduled"
                    ),


                db
                    .from(
                        "hr_vacation_days"
                    )
                    .select(
                        `
                        id,
                        request_id,
                        employee_id,
                        vacation_date
                        `
                    )
                    .order(
                        "vacation_date"
                    )


            ]);


        if (
            requestsResult.error
        ) {

            console.error(
                requestsResult.error
            );

        }


        if (
            daysResult.error
        ) {

            console.error(
                daysResult.error
            );

        }


        vacationRequests =
            requestsResult.data
            ||
            [];


        vacationDays =
            daysResult.data
            ||
            [];

    }


    // =====================================================
    // VACATION LEDGER
    // =====================================================

    function buildVacationLedger(

        employee,

        options = {}

    ) {


        const baseDate =
            getSeniorityDate(
                employee
            );


        if (
            !baseDate
        ) {

            return emptyLedger();

        }


        const today =
            todayISO();


        const seniority =
            calculateSeniority(
                baseDate
            );


        const maxYear =
            Math.max(
                seniority.years
                +
                4,
                4
            );


        const periods =
            [];


        for (
            let serviceYear = 1;
            serviceYear <= maxYear;
            serviceYear++
        ) {


            const entitlement =
                getEntitlementDays(
                    serviceYear
                );


            const fullReleaseDate =
                addYearsISO(
                    baseDate,
                    serviceYear
                );


            const earlyReleaseDate =
                addMonthsISO(
                    fullReleaseDate,
                    -Number(
                        policy
                            .early_release_months
                    )
                );


            const grantDeadline =
                addMonthsISO(
                    fullReleaseDate,
                    Number(
                        policy
                            .grant_window_months
                    )
                );


            const prescriptionDate =
                addMonthsISO(
                    grantDeadline,
                    Number(
                        policy
                            .claim_window_months
                    )
                );


            periods.push({

                serviceYear,

                entitlement,

                earlyDays:
                    entitlement
                    *
                    Number(
                        policy
                            .early_release_fraction
                    ),

                earlyReleaseDate,

                fullReleaseDate,

                grantDeadline,

                prescriptionDate,

                allocated:
                    0

            });

        }


        const excludeRequestId =
            options.excludeRequestId
            ||
            null;


        const existingDates =
            vacationDays

                .filter(
                    day =>
                        day.employee_id ===
                        employee.id

                        &&

                        (
                            !excludeRequestId
                            ||
                            day.request_id !==
                            excludeRequestId
                        )
                )

                .map(
                    day =>
                        day.vacation_date
                );


        const extraDates =
            options.extraDates
            ||
            [];


        const allDates =
            [
                ...existingDates,
                ...extraDates
            ]
            .sort();


        const unallocatedDates =
            [];


        allDates.forEach(
            vacationDate => {


                const period =
                    periods.find(
                        item => {


                            if (
                                vacationDate <
                                item.earlyReleaseDate
                            ) {

                                return false;

                            }


                            if (
                                vacationDate >
                                item.prescriptionDate
                            ) {

                                return false;

                            }


                            const released =
                                releasedDaysAt(
                                    item,
                                    vacationDate
                                );


                            return item.allocated
                                <
                                released;

                        }
                    );


                if (
                    !period
                ) {

                    unallocatedDates
                        .push(
                            vacationDate
                        );


                    return;

                }


                period.allocated +=
                    1;

            }
        );


        let availableNow =
            0;


        let accumulated =
            0;


        let expired =
            0;


        periods.forEach(
            period => {


                const releasedNow =
                    releasedDaysAt(
                        period,
                        today
                    );


                if (
                    today >
                    period.prescriptionDate
                ) {

                    expired +=
                        Math.max(
                            0,
                            period.entitlement
                            -
                            period.allocated
                        );


                    return;

                }


                availableNow +=
                    Math.max(
                        0,
                        releasedNow
                        -
                        period.allocated
                    );


                if (
                    today >=
                    period.fullReleaseDate
                ) {

                    accumulated +=
                        Math.max(
                            0,
                            period.entitlement
                            -
                            period.allocated
                        );

                }

            }
        );


        const employeeDays =
            vacationDays.filter(
                day =>
                    day.employee_id ===
                    employee.id
            );


        const enjoyed =
            employeeDays.filter(
                day =>
                    day.vacation_date <=
                    today
            ).length;


        const scheduled =
            employeeDays.filter(
                day =>
                    day.vacation_date >
                    today
            ).length;


        const nextEarly =
            periods.find(
                period =>
                    period.earlyReleaseDate >
                    today
            );


        const nextFull =
            periods.find(
                period =>
                    period.fullReleaseDate >
                    today
            );


        const latestReleased =
            [...periods]
                .reverse()
                .find(
                    period =>
                        period.earlyReleaseDate <=
                        today
                );


        const currentEntitlement =
            latestReleased
                ?
                latestReleased
                    .entitlement
                :
                (
                    nextFull
                        ?
                        nextFull.entitlement
                        :
                        0
                );


        return {

            periods,

            availableNow:
                roundDays(
                    availableNow
                ),

            accumulated:
                roundDays(
                    accumulated
                ),

            expired:
                roundDays(
                    expired
                ),

            enjoyed,

            scheduled,

            nextEarly,

            nextFull,

            currentEntitlement,

            unallocatedDates

        };

    }


    function emptyLedger() {


        return {

            periods:
                [],

            availableNow:
                0,

            accumulated:
                0,

            expired:
                0,

            enjoyed:
                0,

            scheduled:
                0,

            nextEarly:
                null,

            nextFull:
                null,

            currentEntitlement:
                0,

            unallocatedDates:
                []

        };

    }


    function releasedDaysAt(
        period,
        date
    ) {


        if (
            date <
            period.earlyReleaseDate
        ) {

            return 0;

        }


        if (
            date <
            period.fullReleaseDate
        ) {

            return period
                .earlyDays;

        }


        return period
            .entitlement;

    }


    // =====================================================
    // ENTITLEMENT
    // =====================================================

    function getEntitlementDays(
        serviceYear
    ) {


        const bracket =
            entitlements.find(
                item =>
                    serviceYear >=
                    item.service_year_from

                    &&

                    serviceYear <=
                    item.service_year_to
            );


        if (
            bracket
        ) {

            return Number(
                bracket.vacation_days
            );

        }


        // =================================================
        // Si algún empleado rebasa 35 años:
        // continúa la regla de +2 cada 5 años.
        // =================================================

        const lastBracket =
            entitlements[
                entitlements.length
                -
                1
            ];


        if (
            lastBracket
            &&
            serviceYear >
            lastBracket.service_year_to
        ) {


            const blocks =
                Math.ceil(

                    (
                        serviceYear
                        -
                        lastBracket
                            .service_year_to
                    )

                    /

                    5

                );


            return Number(
                lastBracket
                    .vacation_days
            )
            +
            (
                blocks
                *
                2
            );

        }


        return 0;

    }


    // =====================================================
    // EMPLOYEE REQUESTS
    // =====================================================

    function getEmployeeRequests(
        employeeId
    ) {


        return vacationRequests
            .filter(
                request =>
                    request.employee_id ===
                    employeeId
            );

    }


    // =====================================================
    // SENIORITY
    // =====================================================

    function getSeniorityDate(
        employee
    ) {


        return employee.seniority_date
            ||
            employee.imss_entry_date
            ||
            null;

    }


    function calculateSeniority(
        startISO
    ) {


        if (
            !startISO
        ) {

            return {

                years:
                    0,

                months:
                    0,

                days:
                    0

            };

        }


        const today =
            todayISO();


        if (
            startISO >
            today
        ) {

            return {

                years:
                    0,

                months:
                    0,

                days:
                    0

            };

        }


        let years =
            parseISODate(
                today
            )
            .getFullYear()
            -
            parseISODate(
                startISO
            )
            .getFullYear();


        while (
            addYearsISO(
                startISO,
                years
            )
            >
            today
        ) {

            years--;

        }


        let cursor =
            addYearsISO(
                startISO,
                years
            );


        let months =
            0;


        while (
            addMonthsISO(
                cursor,
                months + 1
            )
            <=
            today
        ) {

            months++;

        }


        cursor =
            addMonthsISO(
                cursor,
                months
            );


        let days =
            0;


        while (
            addDaysISO(
                cursor,
                days + 1
            )
            <=
            today
        ) {

            days++;

        }


        return {

            years,

            months,

            days

        };

    }


    // =====================================================
    // WORKING DATES
    // =====================================================

    function getWorkingDatesBetween(
        start,
        end
    ) {


        const dates =
            [];


        let cursor =
            start;


        while (
            cursor <=
            end
        ) {


            const weekday =
                parseISODate(
                    cursor
                )
                .getDay();


            if (
                WORKING_DAYS
                    .has(
                        weekday
                    )
            ) {

                dates.push(
                    cursor
                );

            }


            cursor =
                addDaysISO(
                    cursor,
                    1
                );

        }


        return dates;

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
        )
        ||
        null;

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


    function showVacationMessage(
        message
    ) {


        $("rvVacationMessage")
            .textContent =
            message;

    }


    function formatSeniority(
        value
    ) {


        if (
            !value
        ) {

            return "—";

        }


        return `${
            value.years
        }a ${
            value.months
        }m ${
            value.days
        }d`;

    }


    function shortEmployeeName(
        name
    ) {


        const parts =
            String(
                name
            )
            .trim()
            .split(
                /\s+/
            );


        return parts
            .slice(
                0,
                2
            )
            .join(
                " "
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
            item =>
                item[0]
                ||
                ""
        )
        .join(
            ""
        )
        .toUpperCase();

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


    function todayISO() {


        return dateToISO(
            new Date()
        );

    }


    function parseISODate(
        iso
    ) {


        const [
            year,
            month,
            day
        ] =
            String(
                iso
            )
            .split(
                "-"
            )
            .map(
                Number
            );


        return new Date(
            year,
            month - 1,
            day,
            12,
            0,
            0,
            0
        );

    }


    function dateToISO(
        date
    ) {


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


        const day =
            String(
                date.getDate()
            )
            .padStart(
                2,
                "0"
            );


        return `${year}-${month}-${day}`;

    }


    function firstOfMonth(
        iso
    ) {


        const date =
            parseISODate(
                iso
            );


        return dateToISO(

            new Date(
                date.getFullYear(),
                date.getMonth(),
                1,
                12
            )

        );

    }


    function addDaysISO(
        iso,
        days
    ) {


        const date =
            parseISODate(
                iso
            );


        date.setDate(
            date.getDate()
            +
            days
        );


        return dateToISO(
            date
        );

    }


    function addYearsISO(
        iso,
        years
    ) {


        return addMonthsISO(
            iso,
            years * 12
        );

    }


    function addMonthsISO(
        iso,
        monthsToAdd
    ) {


        const date =
            parseISODate(
                iso
            );


        const originalDay =
            date.getDate();


        const first =
            new Date(
                date.getFullYear(),
                date.getMonth()
                +
                monthsToAdd,
                1,
                12
            );


        const lastDay =
            new Date(
                first.getFullYear(),
                first.getMonth()
                +
                1,
                0,
                12
            )
            .getDate();


        first.setDate(
            Math.min(
                originalDay,
                lastDay
            )
        );


        return dateToISO(
            first
        );

    }


    function formatMonthTitle(
        iso
    ) {


        return new Intl
            .DateTimeFormat(
                "es-MX",
                {
                    month:
                        "long",

                    year:
                        "numeric"
                }
            )
            .format(
                parseISODate(
                    iso
                )
            );

    }


    function formatShortDate(
        iso
    ) {


        if (
            !iso
        ) {

            return "—";

        }


        return new Intl
            .DateTimeFormat(
                "es-MX",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric"
                }
            )
            .format(
                parseISODate(
                    iso
                )
            );

    }


    function formatDateRange(
        start,
        end
    ) {


        if (
            start ===
            end
        ) {

            return formatShortDate(
                start
            );

        }


        return `${
            formatShortDate(
                start
            )
        } — ${
            formatShortDate(
                end
            )
        }`;

    }


    function roundDays(
        number
    ) {


        return Math.round(
            (
                Number(
                    number
                )
                +
                Number.EPSILON
            )
            *
            100
        )
        /
        100;

    }


    function formatNumber(
        value
    ) {


        const number =
            Number(
                value
            );


        return Number.isInteger(
            number
        )
            ?
            String(
                number
            )
            :
            number.toFixed(
                1
            );

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