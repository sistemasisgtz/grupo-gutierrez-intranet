// =========================================================
// GRUPO GUTIERREZ
// MI INTRANET / YO
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
    // STATE
    // =====================================================

    let dashboard =
        null;


    let profile =
        null;


    let policy =
        null;


    let entitlements =
        [];


    let vacationDays =
        [];


    let vacationRequests =
        [];


    let notifications =
        [];


    // =====================================================
    // START
    // =====================================================

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );


    async function initialize() {


        const token =
            getToken();


        if (
            !db
            ||
            !token
        ) {

            returnToHome();

            return;

        }


        const expiresAt =
            sessionStorage.getItem(
                "gg_intranet_expires_at"
            );


        if (
            expiresAt
            &&
            new Date(
                expiresAt
            )
            <=
            new Date()
        ) {

            clearSession();

            returnToHome();

            return;

        }


        bindEvents();


        try {


            const {
                data,
                error
            } =
                await db.rpc(
                    "intranet_get_dashboard",
                    {

                        p_session_token:
                            token

                    }
                );


            if (
                error
            ) {

                throw error;

            }


            if (
                !data?.profile
            ) {

                throw new Error(
                    "Perfil no disponible."
                );

            }


            dashboard =
                data;


            profile =
                data.profile;


            policy =
                data.policy
                ||
                {};


            entitlements =
                data.entitlements
                ||
                [];


            vacationDays =
                data.vacation_days
                ||
                [];


            vacationRequests =
                data.vacation_requests
                ||
                [];


            notifications =
                data.notifications
                ||
                [];


            renderDashboard();


            $("yoLoading")
                .classList
                .add(
                    "hidden"
                );


            $("yoContent")
                .classList
                .add(
                    "ready"
                );

        }

        catch (
            error
        ) {

            console.error(
                "[YO DASHBOARD]",
                error
            );


            clearSession();

            returnToHome();

        }

    }


    // =====================================================
    // EVENTS
    // =====================================================

    function bindEvents() {


        $("yoLogout")
            .addEventListener(
                "click",
                logout
            );


        $("yoNotificationButton")
            .addEventListener(

                "click",

                event => {


                    event.stopPropagation();


                    const panel =
                        $("yoNotificationsPanel");


                    const open =
                        !panel.classList
                            .contains(
                                "open"
                            );


                    panel.classList
                        .toggle(
                            "open",
                            open
                        );


                    $("yoNotificationButton")
                        .setAttribute(
                            "aria-expanded",
                            open
                                ?
                                "true"
                                :
                                "false"
                        );

                }

            );


        document.addEventListener(

            "click",

            event => {


                const wrap =
                    event.target.closest(
                        ".yo-notification-wrap"
                    );


                if (
                    wrap
                ) {

                    return;

                }


                $("yoNotificationsPanel")
                    .classList
                    .remove(
                        "open"
                    );


                $("yoNotificationButton")
                    .setAttribute(
                        "aria-expanded",
                        "false"
                    );

            }

        );

    }


    // =====================================================
    // RENDER
    // =====================================================

    function renderDashboard() {


        renderProfile();


        const ledger =
            buildVacationLedger();


        renderVacations(
            ledger
        );


        renderAuthorizedVacations();


        renderNotifications();

    }


    // =====================================================
    // PROFILE
    // =====================================================

    function renderProfile() {


        const position =
            profile.position_name
            ||
            "Sin puesto asignado";


        const entryDate =
            getSeniorityDate();


        const seniority =
            calculateSeniority(
                entryDate
            );


        $("yoEmployeeName")
            .textContent =
            profile.full_name
            ||
            "Empleado";


        $("yoEmployeePosition")
            .textContent =
            position;


        $("yoEmployeeCompany")
            .textContent =
            profile.company
            ||
            "—";


        $("yoPosition")
            .textContent =
            position;


        $("yoSeniority")
            .textContent =
            formatSeniority(
                seniority
            );


        $("yoEntryDate")
            .textContent =
            formatLongDate(
                entryDate
            );


        $("yoInitials")
            .textContent =
            getInitials(
                profile.full_name
            );


        if (
            profile.label_color
        ) {

            document.documentElement
                .style
                .setProperty(
                    "--employee-color",
                    profile.label_color
                );

        }

    }


    // =====================================================
    // VACATIONS
    // =====================================================

    function renderVacations(
        ledger
    ) {


        animateNumber(
            $("yoAvailableDays"),
            ledger.availableNow
        );


        animateNumber(
            $("yoPeriodDays"),
            ledger.currentEntitlement
        );


        animateNumber(
            $("yoAccumulatedDays"),
            ledger.accumulated
        );


        animateNumber(
            $("yoEnjoyedDays"),
            ledger.enjoyed
        );


        if (
            ledger.nextEarly
        ) {

            $("yoNextUnlockDays")
                .textContent =
                `+${
                    formatNumber(
                        ledger
                            .nextEarly
                            .earlyDays
                    )
                } días`;


            $("yoNextUnlockDate")
                .textContent =
                formatLongDate(
                    ledger
                        .nextEarly
                        .earlyReleaseDate
                );

        }

        else {

            $("yoNextUnlockDays")
                .textContent =
                "—";


            $("yoNextUnlockDate")
                .textContent =
                "Sin próximo desbloqueo";

        }

    }


    // =====================================================
    // AUTHORIZED VACATIONS
    // =====================================================

    function renderAuthorizedVacations() {


        const today =
            todayISO();


        const future =
            vacationRequests

                .filter(
                    request =>
                        request.end_date >=
                        today
                )

                .sort(
                    (
                        first,
                        second
                    ) =>
                        first.start_date
                            .localeCompare(
                                second.start_date
                            )
                );


        if (
            !future.length
        ) {

            $("yoAuthorizedVacations")
                .innerHTML = `

                    <div class="yo-authorized-empty">

                        No tienes vacaciones futuras
                        registradas actualmente.

                    </div>

                `;


            return;

        }


        $("yoAuthorizedVacations")
            .innerHTML =
            future
                .map(
                    (
                        request,
                        index
                    ) => {


                        const ongoing =
                            request.start_date <=
                            today

                            &&

                            request.end_date >=
                            today;


                        return `

                            <article
                                class="yo-authorized-card"
                                style="
                                    animation-delay:
                                    ${
                                        .05
                                        +
                                        (
                                            index
                                            *
                                            .06
                                        )
                                    }s;
                                "
                            >

                                <span>
                                    ${
                                        ongoing
                                            ?
                                            "EN CURSO"
                                            :
                                            "AUTORIZADAS"
                                    }
                                </span>


                                <strong>
                                    ${
                                        formatDateRange(
                                            request.start_date,
                                            request.end_date
                                        )
                                    }
                                </strong>


                                <p>

                                    ${
                                        request.days_count
                                    }

                                    ${
                                        Number(
                                            request.days_count
                                        )
                                        ===
                                        1
                                            ?
                                            "día laboral"
                                            :
                                            "días laborales"
                                    }

                                    ${
                                        request.notes
                                            ?
                                            ` · ${
                                                escapeHtml(
                                                    request.notes
                                                )
                                            }`
                                            :
                                            ""
                                    }

                                </p>

                            </article>

                        `;

                    }
                )
                .join(
                    ""
                );

    }


    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    function renderNotifications() {


        const badge =
            $("yoNotificationBadge");


        const unread =
            notifications.length;


        badge.textContent =
            unread;


        badge.classList
            .toggle(
                "empty",
                unread ===
                0
            );


        if (
            !notifications.length
        ) {

            return;

        }


        // Cuando hagamos la pestaña de Noticias RH,
        // aquí renderizaremos las publicaciones.

    }


    // =====================================================
    // VACATION LEDGER
    //
    // MISMA LÓGICA UTILIZADA POR RH.
    // =====================================================

    function buildVacationLedger() {


        const baseDate =
            getSeniorityDate();


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
                        ??
                        6
                    )
                );


            const grantDeadline =
                addMonthsISO(
                    fullReleaseDate,
                    Number(
                        policy
                            .grant_window_months
                        ??
                        6
                    )
                );


            const prescriptionDate =
                addMonthsISO(
                    grantDeadline,
                    Number(
                        policy
                            .claim_window_months
                        ??
                        12
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
                        ??
                        .5
                    ),

                earlyReleaseDate,

                fullReleaseDate,

                grantDeadline,

                prescriptionDate,

                allocated:
                    0

            });

        }


        const allDates =
            vacationDays

                .map(
                    day =>
                        day.vacation_date
                )

                .sort();


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
                    period
                ) {

                    period.allocated +=
                        1;

                }

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


        const enjoyed =
            vacationDays.filter(
                day =>
                    day.vacation_date <=
                    today
            ).length;


        const scheduled =
            vacationDays.filter(
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
            [
                ...periods
            ]
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
                        nextFull
                            .entitlement
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

            currentEntitlement

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


    function getEntitlementDays(
        serviceYear
    ) {


        const bracket =
            entitlements.find(
                item =>
                    serviceYear >=
                    Number(
                        item.service_year_from
                    )

                    &&

                    serviceYear <=
                    Number(
                        item.service_year_to
                    )
            );


        if (
            bracket
        ) {

            return Number(
                bracket
                    .vacation_days
            );

        }


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
            Number(
                lastBracket
                    .service_year_to
            )
        ) {


            const blocks =
                Math.ceil(

                    (
                        serviceYear
                        -
                        Number(
                            lastBracket
                                .service_year_to
                        )
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


    function emptyLedger() {


        return {

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

            currentEntitlement:
                0,

            nextEarly:
                null,

            nextFull:
                null

        };

    }


    // =====================================================
    // LOGOUT
    //
    // NO HACEMOS supabase.auth.signOut().
    // El login de Sistema es independiente.
    // =====================================================

    async function logout() {


        const token =
            getToken();


        try {


            if (
                token
                &&
                db
            ) {

                await db.rpc(
                    "intranet_logout",
                    {

                        p_session_token:
                            token

                    }
                );

            }

        }

        catch (
            error
        ) {

            console.error(
                "[INTRANET LOGOUT]",
                error
            );

        }


        clearSession();


        window.location.replace(
            "index.html"
        );

    }


    // =====================================================
    // SESSION
    // =====================================================

    function getToken() {


        return sessionStorage
            .getItem(
                "gg_intranet_token"
            );

    }


    function clearSession() {


        sessionStorage.removeItem(
            "gg_intranet_token"
        );


        sessionStorage.removeItem(
            "gg_intranet_expires_at"
        );

    }


    function returnToHome() {


        window.location.replace(
            "index.html"
        );

    }


    // =====================================================
    // SENIORITY
    // =====================================================

    function getSeniorityDate() {


        return profile?.seniority_date
            ||
            profile?.imss_entry_date
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


    function formatSeniority(
        value
    ) {


        return `${
            value.years
        } ${
            value.years ===
            1
                ?
                "año"
                :
                "años"
        }, ${
            value.months
        } ${
            value.months ===
            1
                ?
                "mes"
                :
                "meses"
        } y ${
            value.days
        } ${
            value.days ===
            1
                ?
                "día"
                :
                "días"
        }`;

    }


    // =====================================================
    // NUMBER ANIMATION
    // =====================================================

    function animateNumber(
        element,
        target
    ) {


        const finalValue =
            Number(
                target
                ||
                0
            );


        const duration =
            850;


        const start =
            performance.now();


        function frame(
            now
        ) {


            const progress =
                Math.min(
                    1,
                    (
                        now
                        -
                        start
                    )
                    /
                    duration
                );


            const eased =
                1
                -
                Math.pow(
                    1 - progress,
                    3
                );


            const current =
                finalValue
                *
                eased;


            element.textContent =
                Number.isInteger(
                    finalValue
                )
                    ?
                    Math.round(
                        current
                    )
                    :
                    current.toFixed(
                        1
                    );


            if (
                progress <
                1
            ) {

                requestAnimationFrame(
                    frame
                );

            }

        }


        requestAnimationFrame(
            frame
        );

    }


    // =====================================================
    // DATE HELPERS
    // =====================================================

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
            12
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


    function formatLongDate(
        iso
    ) {


        if (
            !iso
        ) {

            return "Sin fecha registrada";

        }


        return new Intl
            .DateTimeFormat(
                "es-MX",
                {

                    day:
                        "numeric",

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


    function formatDateRange(
        start,
        end
    ) {


        if (
            start ===
            end
        ) {

            return formatLongDate(
                start
            );

        }


        const startText =
            new Intl
                .DateTimeFormat(
                    "es-MX",
                    {
                        day:
                            "numeric",

                        month:
                            "short"
                    }
                )
                .format(
                    parseISODate(
                        start
                    )
                );


        return `${
            startText
        } — ${
            formatLongDate(
                end
            )
        }`;

    }


    // =====================================================
    // GENERAL HELPERS
    // =====================================================

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


    function roundDays(
        value
    ) {


        return Math.round(
            (
                Number(
                    value
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