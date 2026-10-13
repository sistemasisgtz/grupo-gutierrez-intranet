// =========================================================
// GRUPO GUTIERREZ
// ALMACÉN · CORE
// =========================================================

(() => {

    "use strict";


    const db =
        window.ggSupabase;


    const LABELS = [

        {
            name: "Azul Tech",
            value: "#3f8fc0"
        },

        {
            name: "Cian",
            value: "#44aeb7"
        },

        {
            name: "Turquesa",
            value: "#3ca38f"
        },

        {
            name: "Esmeralda",
            value: "#55a873"
        },

        {
            name: "Lima",
            value: "#8aa94c"
        },

        {
            name: "Ámbar",
            value: "#c49a4d"
        },

        {
            name: "Naranja",
            value: "#c76d3d"
        },

        {
            name: "Coral",
            value: "#c85d5d"
        },

        {
            name: "Rosa",
            value: "#bd5e86"
        },

        {
            name: "Magenta",
            value: "#a95ca6"
        },

        {
            name: "Violeta",
            value: "#8170c6"
        },

        {
            name: "Índigo",
            value: "#5f6fba"
        },

        {
            name: "Acero",
            value: "#71828e"
        },

        {
            name: "Hielo",
            value: "#90b7c4"
        }

    ];


    const state = {

        ready:
            false,

        session:
            null,

        user:
            null,

        categories:
            [],

        brands:
            [],

        brandContacts:
            [],

        products:
            [],

        recentMovements:
            []

    };


    let toastTimer =
        null;


    const api = {

        db,

        state,

        LABELS,

        reloadAll,

        reloadProducts,

        reloadCatalogs,

        reloadRecentMovements,

        refreshMetrics,

        decorateProduct,

        getCategory,

        getBrand,

        toast,

        escapeHtml,

        formatMoney,

        formatQty,

        formatDateTime,

        formatDate,

        normalize,

        openModal,

        closeModal,

        userEmail:
            () =>
                state.user?.email
                ||
                "usuario"

    };


    window.GGWarehouse =
        api;


    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );


    async function initialize() {


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


        const emailNode =
            document.getElementById(
                "warehouseUserEmail"
            );


        if (
            emailNode
        ) {

            emailNode.textContent =
                session.user.email
                ||
                "Usuario";

        }


        bindShellEvents();


        try {

            await reloadAll();


            state.ready =
                true;


            document.dispatchEvent(

                new CustomEvent(
                    "ggwarehouse:ready"
                )

            );

        }

        catch (
            errorLoad
        ) {

            console.error(
                "[ALMACÉN CORE]",
                errorLoad
            );


            toast(
                "No se pudo cargar el módulo de Almacén.",
                true
            );

        }


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


    function bindShellEvents() {


        document
            .getElementById(
                "backToSystem"
            )
            ?.addEventListener(

                "click",

                () => {

                    window.location.href =
                        "sistema.html";

                }

            );


        document
            .getElementById(
                "warehouseRefresh"
            )
            ?.addEventListener(

                "click",

                async event => {


                    const button =
                        event.currentTarget;


                    button.disabled =
                        true;


                    button.textContent =
                        "Actualizando...";


                    try {

                        await reloadAll();


                        document.dispatchEvent(

                            new CustomEvent(
                                "ggwarehouse:refresh"
                            )

                        );


                        toast(
                            "Almacén actualizado."
                        );

                    }

                    catch (
                        error
                    ) {

                        console.error(
                            error
                        );


                        toast(
                            "No se pudo actualizar.",
                            true
                        );

                    }

                    finally {

                        button.disabled =
                            false;


                        button.textContent =
                            "↻ Actualizar";

                    }

                }

            );

    }


    async function reloadAll() {


        await Promise.all([

            reloadCatalogs(),

            reloadProducts(),

            reloadRecentMovements()

        ]);


        refreshMetrics();

    }


    async function reloadCatalogs() {


        const [

            categoriesResult,

            brandsResult,

            contactsResult

        ] =
            await Promise.all([

                db
                    .from(
                        "warehouse_categories"
                    )
                    .select(
                        "*"
                    )
                    .order(
                        "name"
                    ),

                db
                    .from(
                        "warehouse_brands"
                    )
                    .select(
                        "*"
                    )
                    .order(
                        "name"
                    ),

                db
                    .from(
                        "warehouse_brand_contacts"
                    )
                    .select(
                        "*"
                    )
                    .order(
                        "sort_order"
                    )

            ]);


        if (
            categoriesResult.error
        ) {

            throw categoriesResult.error;

        }


        if (
            brandsResult.error
        ) {

            throw brandsResult.error;

        }


        if (
            contactsResult.error
        ) {

            throw contactsResult.error;

        }


        state.categories =
            categoriesResult.data
            ||
            [];


        state.brands =
            brandsResult.data
            ||
            [];


        state.brandContacts =
            contactsResult.data
            ||
            [];


        document.dispatchEvent(

            new CustomEvent(
                "ggwarehouse:catalogs"
            )

        );

    }


    async function reloadProducts() {


        const {
            data,
            error
        } =
            await db
                .from(
                    "warehouse_products"
                )
                .select(
                    "*"
                )
                .order(
                    "folio",
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


        state.products =
            data
            ||
            [];


        refreshMetrics();


        document.dispatchEvent(

            new CustomEvent(
                "ggwarehouse:products"
            )

        );

    }


    async function reloadRecentMovements() {


        const {
            data,
            error
        } =
            await db
                .from(
                    "warehouse_movements"
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
                    12
                );


        if (
            error
        ) {

            throw error;

        }


        state.recentMovements =
            data
            ||
            [];


        document.dispatchEvent(

            new CustomEvent(
                "ggwarehouse:movements"
            )

        );

    }


    function refreshMetrics() {


        const active =
            state.products
                .filter(
                    product =>
                        product.active
                );


        const stock =
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


        const low =
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
                        )
                        <=
                        minimum
                    );

                }

            ).length;


        const value =
            active.reduce(

                (
                    sum,
                    product
                ) => {

                    return (
                        sum

                        +

                        (
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
                            )
                        )
                    );

                },

                0

            );


        setText(
            "warehouseMetricProducts",
            active.length
        );


        setText(
            "warehouseMetricStock",
            formatQty(
                stock
            )
        );


        setText(
            "warehouseMetricLow",
            low
        );


        setText(
            "warehouseMetricValue",
            formatMoney(
                value
            )
        );

    }


    function decorateProduct(
        product
    ) {


        return {

            ...product,

            category:
                getCategory(
                    product.category_id
                ),

            brand:
                getBrand(
                    product.brand_id
                )

        };

    }


    function getCategory(
        id
    ) {


        return (
            state.categories
                .find(
                    item =>
                        item.id ===
                        id
                )
            ||
            null
        );

    }


    function getBrand(
        id
    ) {


        return (
            state.brands
                .find(
                    item =>
                        item.id ===
                        id
                )
            ||
            null
        );

    }


    function toast(
        message,
        isError = false
    ) {


        const node =
            document.getElementById(
                "warehouseToast"
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
                isError
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

                () =>
                    node.classList
                        .remove(
                            "show"
                        ),

                2800

            );

    }


    function openModal({

        kicker =
            "ALMACÉN",

        title =
            "",

        body =
            "",

        footer =
            "",

        wide =
            false,

        onOpen =
            null

    }) {


        const root =
            document.getElementById(
                "warehouseModalRoot"
            );


        if (
            !root
        ) {

            return null;

        }


        root.innerHTML = `

            <div
                class="warehouse-modal-backdrop"
                data-wh-modal-backdrop
            >

                <section
                    class="
                        warehouse-modal
                        ${
                            wide
                                ?
                                "wide"
                                :
                                ""
                        }
                    "
                    role="dialog"
                    aria-modal="true"
                >

                    <header class="warehouse-modal-header">

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
                            class="warehouse-modal-close"
                            data-wh-close-modal
                        >
                            ×
                        </button>

                    </header>


                    <div class="warehouse-modal-body">

                        ${
                            body
                        }

                    </div>


                    ${
                        footer

                        ?

                        `
                            <footer class="warehouse-modal-footer">

                                ${
                                    footer
                                }

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
                "[data-wh-close-modal]"
            )
            ?.addEventListener(
                "click",
                closeModal
            );


        // NO cerrar haciendo click en backdrop.


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
            document.getElementById(
                "warehouseModalRoot"
            );


        if (
            root
        ) {

            root.innerHTML =
                "";

        }

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


    function formatMoney(
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


    function formatQty(
        value
    ) {


        return new Intl
            .NumberFormat(
                "es-MX",
                {

                    maximumFractionDigits:
                        3

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


    function formatDateTime(
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


    function formatDate(
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
                        "medium"
                }
            )
            .format(
                new Date(
                    value
                )
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

})();