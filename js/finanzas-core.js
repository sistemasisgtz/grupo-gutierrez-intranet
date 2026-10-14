// =========================================================
// GRUPO GUTIERREZ
// FINANZAS · CORE COMPARTIDO
// =========================================================

(() => {

    "use strict";


    const db =
        window.ggSupabase;


    const state = {

        session:
            null,

        user:
            null,

        isAdmin:
            false,

        rules:
            [],

        myGroups:
            [],

        currentGroupId:
            null

    };


    let toastTimer =
        null;


    window.GGFinance = {

        db,

        state,

        init:
            initialize,

        refreshBase,

        loadRules,

        loadMyGroups,

        loadGroupEntries,

        getRule,

        unique,

        normalize,

        escapeHtml,

        money,

        number,

        date,

        dateTime,

        todayISO,

        addDaysISO,

        authorizationLabel,

        paymentLabel,

        typeLabel,

        toast,

        openModal,

        closeModal

    };


    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );


    let initialized =
        false;


    async function initialize() {


        if (
            initialized
        ) {

            return;

        }


        initialized =
            true;


        if (
            !db
        ) {

            window.location.replace(
                "index.html"
            );

            return;

        }


        const {
            data: {
                session
            },
            error
        } =
            await db
                .auth
                .getSession();


        if (
            error
            ||
            !session
        ) {

            window.location.replace(
                "index.html"
            );

            return;

        }


        state.session =
            session;


        state.user =
            session.user;


        document
            .querySelectorAll(
                "[data-finance-user-email]"
            )
            .forEach(
                node => {

                    node.textContent =
                        state.user.email
                        ||
                        "Usuario";

                }
            );


        document
            .querySelectorAll(
                "[data-back-system]"
            )
            .forEach(
                button => {

                    button.addEventListener(

                        "click",

                        () => {

                            window.location.href =
                                "sistema.html";

                        }

                    );

                }
            );


        try {

            await refreshBase();

        }

        catch (
            loadError
        ) {

            console.error(
                "[FINANZAS CORE]",
                loadError
            );


            toast(
                "No se pudo inicializar Finanzas.",
                true
            );

        }


        document.dispatchEvent(

            new CustomEvent(
                "ggfinance:ready"
            )

        );


        db.auth
            .onAuthStateChange(

                (
                    event,
                    sessionNow
                ) => {

                    if (
                        event ===
                        "SIGNED_OUT"
                        ||
                        !sessionNow
                    ) {

                        window.location.replace(
                            "index.html"
                        );

                    }

                }

            );

    }


    async function refreshBase() {


        const [
            rules,
            groups,
            admin
        ] =
            await Promise.all([

                loadRules(),

                loadMyGroups(),

                db.rpc(
                    "finance_is_admin"
                )

            ]);


        if (
            admin.error
        ) {

            throw admin.error;

        }


        state.isAdmin =
            Boolean(
                admin.data
            );


        return {
            rules,
            groups,
            isAdmin:
                state.isAdmin
        };

    }


    async function loadRules() {


        const {
            data,
            error
        } =
            await db
                .from(
                    "finance_catalog_rules"
                )
                .select(
                    "*"
                )
                .eq(
                    "active",
                    true
                )
                .order(
                    "area_group"
                )
                .order(
                    "classification"
                )
                .order(
                    "category"
                );


        if (
            error
        ) {

            throw error;

        }


        state.rules =
            data
            ||
            [];


        return state.rules;

    }


    async function loadMyGroups() {


        const {
            data,
            error
        } =
            await db.rpc(
                "finance_my_groups"
            );


        if (
            error
        ) {

            throw error;

        }


        state.myGroups =
            data
            ||
            [];


        if (
            state.currentGroupId
            &&
            !state.myGroups.some(
                group =>
                    group.group_id ===
                    state.currentGroupId
            )
        ) {

            state.currentGroupId =
                null;

        }


        if (
            !state.currentGroupId
            &&
            state.myGroups.length
        ) {

            state.currentGroupId =
                state.myGroups[0]
                    .group_id;

        }


        return state.myGroups;

    }


    async function loadGroupEntries(
        groupId
    ) {


        if (
            !groupId
        ) {

            return [];

        }


        const {
            data,
            error
        } =
            await db
                .from(
                    "finance_group_catalog_entries"
                )
                .select(
                    "*"
                )
                .eq(
                    "group_id",
                    groupId
                )
                .eq(
                    "active",
                    true
                )
                .order(
                    "entry_type"
                )
                .order(
                    "name"
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


    function getRule(
        id
    ) {


        return (
            state.rules.find(
                rule =>
                    rule.id ===
                    id
            )
            ||
            null
        );

    }


    function unique(
        values
    ) {


        return [

            ...new Set(

                values
                    .filter(
                        value =>
                            value !==
                            null
                            &&
                            value !==
                            undefined
                            &&
                            value !==
                            ""
                    )

            )

        ];

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


    function money(
        value
    ) {


        return new Intl
            .NumberFormat(
                "es-MX",
                {
                    style:
                        "currency",

                    currency:
                        "MXN",

                    maximumFractionDigits:
                        2
                }
            )
            .format(
                Number(
                    value
                    ||
                    0
                )
            );

    }


    function number(
        value
    ) {


        return new Intl
            .NumberFormat(
                "es-MX",
                {
                    maximumFractionDigits:
                        2
                }
            )
            .format(
                Number(
                    value
                    ||
                    0
                )
            );

    }


    function date(
        value
    ) {


        if (
            !value
        ) {

            return "—";

        }


        const target =
            /^\d{4}-\d{2}-\d{2}$/
                .test(
                    String(
                        value
                    )
                )

                ?

                new Date(
                    `${value}T12:00:00`
                )

                :

                new Date(
                    value
                );


        return new Intl
            .DateTimeFormat(
                "es-MX",
                {
                    dateStyle:
                        "medium"
                }
            )
            .format(
                target
            );

    }


    function dateTime(
        value
    ) {


        if (
            !value
        ) {

            return "—";

        }


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
                new Date(
                    value
                )
            );

    }


    function todayISO() {


        const now =
            new Date();


        const local =
            new Date(
                now.getTime()
                -
                now.getTimezoneOffset()
                *
                60000
            );


        return local
            .toISOString()
            .slice(
                0,
                10
            );

    }


    function addDaysISO(
        iso,
        days
    ) {


        const dateValue =
            new Date(
                `${iso}T12:00:00`
            );


        dateValue.setDate(
            dateValue.getDate()
            +
            Number(
                days
                ||
                0
            )
        );


        const local =
            new Date(
                dateValue.getTime()
                -
                dateValue.getTimezoneOffset()
                *
                60000
            );


        return local
            .toISOString()
            .slice(
                0,
                10
            );

    }


    function authorizationLabel(
        status
    ) {


        return ({

            pending:
                "Pendiente",

            authorized:
                "Autorizada",

            rejected:
                "No autorizada"

        })[
            status
        ]
        ||
        status
        ||
        "Pendiente";

    }


    function paymentLabel(
        confirmed
    ) {


        return confirmed
            ?
            "Pagado"
            :
            "Sin pagar";

    }


    function typeLabel(
        value
    ) {


        return String(
            value
            ||
            ""
        )
        .toUpperCase();

    }


    function toast(
        message,
        error = false
    ) {


        const node =
            document.querySelector(
                "[data-finance-toast]"
            );


        if (
            !node
        ) {

            return;

        }


        node.textContent =
            message;


        node.classList.toggle(
            "error",
            Boolean(
                error
            )
        );


        node.classList.add(
            "show"
        );


        window.clearTimeout(
            toastTimer
        );


        toastTimer =
            window.setTimeout(

                () => {

                    node.classList
                        .remove(
                            "show"
                        );

                },

                3000

            );

    }


    function openModal({
        kicker =
            "FINANZAS",
        title =
            "",
        body =
            "",
        footer =
            "",
        wide =
            false,
        extraWide =
            false,
        onOpen =
            null
    }) {


        const root =
            document.querySelector(
                "[data-finance-modal-root]"
            );


        if (
            !root
        ) {

            return null;

        }


        root.innerHTML = `

            <div class="finance-modal-backdrop">

                <section
                    class="
                        finance-modal
                        ${
                            wide
                                ?
                                "wide"
                                :
                                ""
                        }
                        ${
                            extraWide
                                ?
                                "extra-wide"
                                :
                                ""
                        }
                    "
                    role="dialog"
                    aria-modal="true"
                >

                    <header class="finance-modal-header">

                        <div>

                            <span>
                                ${
                                    escapeHtml(
                                        kicker
                                    )
                                }
                            </span>

                            <h3>
                                ${
                                    escapeHtml(
                                        title
                                    )
                                }
                            </h3>

                        </div>

                        <button
                            type="button"
                            class="finance-modal-close"
                            data-finance-close-modal
                        >
                            ×
                        </button>

                    </header>

                    <div class="finance-modal-body">
                        ${body}
                    </div>

                    ${
                        footer

                            ?

                            `
                                <footer class="finance-modal-footer">
                                    ${footer}
                                </footer>
                            `

                            :

                            ""
                    }

                </section>

            </div>

        `;


        root
            .querySelector(
                "[data-finance-close-modal]"
            )
            ?.addEventListener(
                "click",
                closeModal
            );


        if (
            typeof onOpen ===
            "function"
        ) {

            onOpen(
                root
            );

        }


        return root;

    }


    function closeModal() {


        const root =
            document.querySelector(
                "[data-finance-modal-root]"
            );


        if (
            root
        ) {

            root.innerHTML =
                "";

        }

    }

})();