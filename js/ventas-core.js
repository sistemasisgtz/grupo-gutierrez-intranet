(() => {

    "use strict";


    const db =
        window.ggSupabase;


    const state = {

        session:
            null,

        user:
            null,

        clients:
            [],

        agents:
            [],

        companies:
            [],

        formats:
            [],

        units:
            [],

        productGroups:
            [],

        products:
            [],

        priceGroups:
            [],

        prices:
            [],

        suppliers:
            [],

        supplierProducts:
            []

    };


    let toastTimer =
        null;


    const tables = {

        clients: [
            "sales_clients",
            "legal_name"
        ],

        agents: [
            "sales_agents",
            "name"
        ],

        companies: [
            "sales_companies",
            "name"
        ],

        formats: [
            "sales_formats",
            "name"
        ],

        units: [
            "sales_units",
            "name"
        ],

        productGroups: [
            "sales_product_groups",
            "name"
        ],

        products: [
            "sales_products",
            "code"
        ],

        priceGroups: [
            "sales_price_groups",
            "name"
        ],

        prices: [
            "sales_prices",
            "created_at"
        ],

        suppliers: [
            "sales_suppliers",
            "legal_name"
        ],

        supplierProducts: [
            "sales_supplier_products",
            "code"
        ]

    };


    window.GGSales = {

        db,

        state,

        init,

        refreshBase,

        reload,

        escapeHtml,

        normalize,

        money,

        date,

        dateTime,

        todayISO,

        toast,

        openModal,

        closeModal,

        uploadAsset,

        assetDataUrl,

        unique,

        byId,

        emit

    };


    document.addEventListener(
        "DOMContentLoaded",
        init,
        {
            once:
                true
        }
    );


    async function init() {


        if (
            !db
        ) {

            location.replace(
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

            location.replace(
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
                "[data-sales-user]"
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
            .getElementById(
                "salesBack"
            )
            ?.addEventListener(

                "click",

                () => {

                    location.href =
                        "sistema.html";

                }

            );


        document
            .getElementById(
                "salesTheme"
            )
            ?.addEventListener(
                "click",
                toggleTheme
            );


        applyTheme(

            localStorage.getItem(
                "gg-sales-theme"
            )
            ||
            "dark"

        );


        try {

            await refreshBase();


            emit(
                "ggsales:ready"
            );

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            toast(
                "No se pudo iniciar Ventas.",
                true
            );

        }

    }


    async function refreshBase() {


        await Promise.all(

            Object
                .keys(
                    tables
                )
                .map(
                    reload
                )

        );


        return state;

    }


    async function reload(
        key
    ) {


        const config =
            tables[
                key
            ];


        if (
            !config
        ) {

            return [];

        }


        let query =
            db
                .from(
                    config[0]
                )
                .select(
                    "*"
                );


        if (
            [
                "clients",
                "agents",
                "companies",
                "formats",
                "units",
                "productGroups",
                "products",
                "priceGroups",
                "suppliers",
                "supplierProducts"
            ]
            .includes(
                key
            )
        ) {

            query =
                query.eq(
                    "active",
                    true
                );

        }


        query =
            query.order(
                config[1],
                {
                    ascending:
                        true
                }
            );


        const {
            data,
            error
        } =
            await query;


        if (
            error
        ) {

            throw error;

        }


        state[
            key
        ] =
            data
            ||
            [];


        return state[
            key
        ];

    }


    function byId(
        list,
        id
    ) {


        return (
            state[
                list
            ]
            ||
            []
        )
        .find(
            item =>
                item.id ===
                id
        )
        ||
        null;

    }


    function unique(
        values
    ) {


        return [
            ...new Set(
                (
                    values
                    ||
                    []
                )
                .filter(
                    Boolean
                )
            )
        ];

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


    function money(
        value,
        currency =
            "M.N."
    ) {


        const code =
            currency ===
            "USD"

                ?

                "USD"

                :

                "MXN";


        return new Intl
            .NumberFormat(
                "es-MX",
                {
                    style:
                        "currency",

                    currency:
                        code,

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
                    value
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


        return new Date(

            now.getTime()
            -
            now.getTimezoneOffset()
            *
            60000

        )
        .toISOString()
        .slice(
            0,
            10
        );

    }


    function toast(
        message,
        error =
            false
    ) {


        const node =
            document.getElementById(
                "salesToast"
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
            error
        );


        node.classList.add(
            "show"
        );


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(

                () => {

                    node.classList.remove(
                        "show"
                    );

                },

                3200

            );

    }


    function openModal({
        kicker =
            "VENTAS",
        title =
            "",
        body =
            "",
        footer =
            "",
        wide =
            false,
        xwide =
            false,
        onOpen =
            null
    }) {


        const root =
            document.getElementById(
                "salesModalRoot"
            );


        if (
            !root
        ) {

            return null;

        }


        root.innerHTML = `

            <div class="sales-modal-backdrop">

                <section
                    class="
                        sales-modal
                        ${wide ? "wide" : ""}
                        ${xwide ? "xwide" : ""}
                    "
                >

                    <header>

                        <div>

                            <span>
                                ${escapeHtml(kicker)}
                            </span>

                            <h3>
                                ${escapeHtml(title)}
                            </h3>

                        </div>

                        <button
                            type="button"
                            data-sales-close
                        >
                            ×
                        </button>

                    </header>

                    <div class="sales-modal-body">
                        ${body}
                    </div>

                    ${
                        footer

                            ?

                            `
                                <footer>
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
                "[data-sales-close]"
            )
            ?.addEventListener(
                "click",
                closeModal
            );


        if (
            onOpen
        ) {

            onOpen(
                root
            );

        }


        return root;

    }


    function closeModal() {


        const root =
            document.getElementById(
                "salesModalRoot"
            );


        if (
            root
        ) {

            root.innerHTML =
                "";

        }

    }


    function applyTheme(
        theme
    ) {


        document
            .documentElement
            .dataset
            .salesTheme =
            theme;


        localStorage.setItem(
            "gg-sales-theme",
            theme
        );


        const button =
            document.getElementById(
                "salesTheme"
            );


        if (
            button
        ) {

            button.textContent =

                theme ===
                "light"

                    ?

                    "☾ Oscuro"

                    :

                    "☀ Claro";

        }

    }


    function toggleTheme() {


        applyTheme(

            document
                .documentElement
                .dataset
                .salesTheme ===
            "light"

                ?

                "dark"

                :

                "light"

        );

    }


    async function uploadAsset(
        file,
        folder
    ) {


        if (
            !file
        ) {

            return null;

        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            throw new Error(
                "Solo se permiten imágenes."
            );

        }


        if (
            file.size >
            5
            *
            1024
            *
            1024
        ) {

            throw new Error(
                "La imagen no puede exceder 5 MB."
            );

        }


        const extension =
            (
                file.name
                    .split(
                        "."
                    )
                    .pop()
                ||
                "png"
            )
            .toLowerCase();


        const path =
            `${folder}/${crypto.randomUUID()}.${extension}`;


        const {
            error
        } =
            await db
                .storage
                .from(
                    "sales-assets"
                )
                .upload(
                    path,
                    file,
                    {
                        upsert:
                            false,

                        contentType:
                            file.type
                    }
                );


        if (
            error
        ) {

            throw error;

        }


        return path;

    }


    async function assetDataUrl(
        path
    ) {


        if (
            !path
        ) {

            return null;

        }


        const {
            data,
            error
        } =
            await db
                .storage
                .from(
                    "sales-assets"
                )
                .download(
                    path
                );


        if (
            error
        ) {

            throw error;

        }


        return await new Promise(

            (
                resolve,
                reject
            ) => {

                const reader =
                    new FileReader();


                reader.onload =
                    () =>
                        resolve(
                            reader.result
                        );


                reader.onerror =
                    reject;


                reader.readAsDataURL(
                    data
                );

            }

        );

    }


    function emit(
        name,
        detail =
            {}
    ) {


        document.dispatchEvent(

            new CustomEvent(
                name,
                {
                    detail
                }
            )

        );

    }

})();