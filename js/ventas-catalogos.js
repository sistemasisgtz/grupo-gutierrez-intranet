(() => {

    "use strict";


    let s =
        null;


    window.GGSalesCatalogs = {

        openClients,

        openAgents,

        openCompanies,

        openFormats

    };


    document.addEventListener(

        "ggsales:ready",

        () => {

            s =
                window.GGSales;

        }

    );


    function openClients() {


        const rows =
            s.state.clients;


        s.openModal({

            title:
                "Clientes",

            wide:
                true,

            body: `

                <form id="salesClientForm">

                    <input
                        type="hidden"
                        id="salesClientId"
                    >

                    <div class="sales-grid two">

                        ${field(
                            "Razón social *",
                            "salesClientName",
                            "text",
                            true
                        )}

                        ${field(
                            "RFC",
                            "salesClientRfc"
                        )}

                        ${field(
                            "Dirección",
                            "salesClientAddress"
                        )}

                        ${field(
                            "Correo",
                            "salesClientEmail",
                            "email"
                        )}

                        ${field(
                            "Teléfono",
                            "salesClientPhone",
                            "tel"
                        )}


                        <div class="sales-field full">

                            <label>
                                Contactos
                            </label>

                            <div id="salesClientContacts">
                            </div>

                            <button
                                type="button"
                                class="sales-btn ghost"
                                id="salesAddContact"
                            >
                                + Contacto
                            </button>

                        </div>

                    </div>


                    <div
                        class="sales-form-msg"
                        id="salesClientMsg"
                    >
                    </div>


                    <button class="sales-btn primary">
                        Guardar cliente
                    </button>

                </form>


                <div
                    class="sales-list"
                    id="salesClientList"
                >
                    ${clientList(rows)}
                </div>

            `,

            onOpen:
                root => {


                    addContactRow();


                    root
                        .querySelector(
                            "#salesAddContact"
                        )
                        .onclick =
                        () =>
                            addContactRow();


                    root
                        .querySelector(
                            "#salesClientForm"
                        )
                        .onsubmit =
                        saveClient;


                    root
                        .querySelector(
                            "#salesClientList"
                        )
                        .onclick =
                        clientListClick;


                    root.addEventListener(

                        "click",

                        event => {

                            const button =
                                event.target.closest(
                                    "[data-remove-contact]"
                                );


                            if (
                                button
                            ) {

                                button
                                    .closest(
                                        ".sales-contact-row"
                                    )
                                    ?.remove();

                            }

                        }

                    );

                }

        });

    }


    function clientList(
        rows
    ) {


        return rows.length

            ?

            rows
                .map(
                    client => `

                        <article class="sales-list-row">

                            <div>

                                <strong>
                                    ${
                                        s.escapeHtml(
                                            client.legal_name
                                        )
                                    }
                                </strong>

                                <small>
                                    ${
                                        s.escapeHtml(
                                            client.rfc
                                            ||
                                            "Sin RFC"
                                        )
                                    }
                                    ·
                                    ${
                                        s.escapeHtml(
                                            client.email
                                            ||
                                            "Sin correo"
                                        )
                                    }
                                </small>

                            </div>


                            <div>

                                <button
                                    class="sales-mini"
                                    data-edit-client="${client.id}"
                                >
                                    Editar
                                </button>

                                <button
                                    class="sales-mini danger"
                                    data-delete-client="${client.id}"
                                >
                                    Eliminar
                                </button>

                            </div>

                        </article>

                    `
                )
                .join(
                    ""
                )

            :

            `
                <div class="sales-empty">
                    Sin clientes.
                </div>
            `;

    }


    function addContactRow(
        data =
            {}
    ) {


        const host =
            document.getElementById(
                "salesClientContacts"
            );


        if (
            !host
        ) {

            return;

        }


        host.insertAdjacentHTML(

            "beforeend",

            `

                <div class="sales-contact-row">

                    <input
                        placeholder="Nombre"
                        data-contact-name
                        value="${
                            s.escapeHtml(
                                data.name
                                ||
                                ""
                            )
                        }"
                    >

                    <input
                        placeholder="Puesto"
                        data-contact-title
                        value="${
                            s.escapeHtml(
                                data.title
                                ||
                                ""
                            )
                        }"
                    >

                    <input
                        placeholder="Número"
                        data-contact-phone
                        value="${
                            s.escapeHtml(
                                data.phone
                                ||
                                ""
                            )
                        }"
                    >

                    <input
                        placeholder="Correo"
                        data-contact-email
                        value="${
                            s.escapeHtml(
                                data.email
                                ||
                                ""
                            )
                        }"
                    >

                    <button
                        type="button"
                        class="sales-mini danger"
                        data-remove-contact
                    >
                        ×
                    </button>

                </div>

            `

        );

    }


    async function saveClient(
        event
    ) {


        event.preventDefault();


        const message =
            document.getElementById(
                "salesClientMsg"
            );


        try {

            const contacts = [

                ...document.querySelectorAll(
                    ".sales-contact-row"
                )

            ]
            .map(
                row => ({

                    name:
                        row
                            .querySelector(
                                "[data-contact-name]"
                            )
                            .value
                            .trim(),

                    title:
                        row
                            .querySelector(
                                "[data-contact-title]"
                            )
                            .value
                            .trim(),

                    phone:
                        row
                            .querySelector(
                                "[data-contact-phone]"
                            )
                            .value
                            .trim(),

                    email:
                        row
                            .querySelector(
                                "[data-contact-email]"
                            )
                            .value
                            .trim()

                })
            )
            .filter(
                contact =>
                    contact.name
                    ||
                    contact.phone
                    ||
                    contact.email
            );


            const payload = {

                legal_name:
                    value(
                        "salesClientName"
                    ),

                rfc:
                    nullable(
                        value(
                            "salesClientRfc"
                        )
                    ),

                address:
                    nullable(
                        value(
                            "salesClientAddress"
                        )
                    ),

                email:
                    nullable(
                        value(
                            "salesClientEmail"
                        )
                    ),

                phone:
                    nullable(
                        value(
                            "salesClientPhone"
                        )
                    ),

                contacts

            };


            const id =
                value(
                    "salesClientId"
                );


            const query =

                id

                    ?

                    s.db
                        .from(
                            "sales_clients"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            id
                        )

                    :

                    s.db
                        .from(
                            "sales_clients"
                        )
                        .insert(
                            payload
                        );


            const {
                error
            } =
                await query;


            if (
                error
            ) {

                throw error;

            }


            await s.reload(
                "clients"
            );


            s.toast(
                "Cliente guardado."
            );


            openClients();

        }

        catch (
            error
        ) {

            message.textContent =
                error.message;

        }

    }


    function clientListClick(
        event
    ) {


        const edit =
            event.target.closest(
                "[data-edit-client]"
            );


        const remove =
            event.target.closest(
                "[data-delete-client]"
            );


        if (
            edit
        ) {

            const client =
                s.byId(
                    "clients",
                    edit.dataset
                        .editClient
                );


            if (
                !client
            ) {

                return;

            }


            set(
                "salesClientId",
                client.id
            );

            set(
                "salesClientName",
                client.legal_name
            );

            set(
                "salesClientRfc",
                client.rfc
            );

            set(
                "salesClientAddress",
                client.address
            );

            set(
                "salesClientEmail",
                client.email
            );

            set(
                "salesClientPhone",
                client.phone
            );


            const host =
                document.getElementById(
                    "salesClientContacts"
                );


            host.innerHTML =
                "";


            (
                client.contacts?.length

                    ?

                    client.contacts

                    :

                    [
                        {}
                    ]
            )
            .forEach(
                addContactRow
            );

        }


        if (
            remove
        ) {

            archive(

                "sales_clients",

                remove.dataset
                    .deleteClient,

                "clients",

                openClients

            );

        }

    }


    function openAgents() {


        simpleCatalog({

            title:
                "Agentes",

            table:
                "sales_agents",

            state:
                "agents",

            nameCol:
                "name",

            label:
                "Nombre del agente",

            render:
                openAgents

        });

    }


    function simpleCatalog(
        config
    ) {


        s.openModal({

            title:
                config.title,

            body: `

                <form id="salesSimpleForm">

                    <input
                        type="hidden"
                        id="salesSimpleId"
                    >

                    <div class="sales-field">

                        <label>
                            ${config.label} *
                        </label>

                        <input
                            id="salesSimpleName"
                            required
                        >

                    </div>

                    <div
                        id="salesSimpleMsg"
                        class="sales-form-msg"
                    >
                    </div>

                    <button class="sales-btn primary">
                        Guardar
                    </button>

                </form>


                <div
                    class="sales-list"
                    id="salesSimpleList"
                >

                    ${
                        s.state[
                            config.state
                        ]
                        .map(
                            item => `

                                <article class="sales-list-row">

                                    <strong>
                                        ${
                                            s.escapeHtml(
                                                item[
                                                    config.nameCol
                                                ]
                                            )
                                        }
                                    </strong>

                                    <div>

                                        <button
                                            class="sales-mini"
                                            data-edit-simple="${item.id}"
                                        >
                                            Editar
                                        </button>

                                        <button
                                            class="sales-mini danger"
                                            data-delete-simple="${item.id}"
                                        >
                                            Eliminar
                                        </button>

                                    </div>

                                </article>

                            `
                        )
                        .join(
                            ""
                        )
                        ||
                        `
                            <div class="sales-empty">
                                Sin registros.
                            </div>
                        `
                    }

                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "#salesSimpleForm"
                        )
                        .onsubmit =
                        async event => {


                            event.preventDefault();


                            const id =
                                value(
                                    "salesSimpleId"
                                );


                            const payload = {

                                [
                                    config.nameCol
                                ]:
                                    value(
                                        "salesSimpleName"
                                    )

                            };


                            try {

                                const query =

                                    id

                                        ?

                                        s.db
                                            .from(
                                                config.table
                                            )
                                            .update(
                                                payload
                                            )
                                            .eq(
                                                "id",
                                                id
                                            )

                                        :

                                        s.db
                                            .from(
                                                config.table
                                            )
                                            .insert(
                                                payload
                                            );


                                const {
                                    error
                                } =
                                    await query;


                                if (
                                    error
                                ) {

                                    throw error;

                                }


                                await s.reload(
                                    config.state
                                );


                                s.toast(
                                    "Guardado."
                                );


                                config.render();

                            }

                            catch (
                                error
                            ) {

                                document
                                    .getElementById(
                                        "salesSimpleMsg"
                                    )
                                    .textContent =
                                    error.message;

                            }

                        };


                    root
                        .querySelector(
                            "#salesSimpleList"
                        )
                        .onclick =
                        event => {


                            const edit =
                                event.target.closest(
                                    "[data-edit-simple]"
                                );


                            const remove =
                                event.target.closest(
                                    "[data-delete-simple]"
                                );


                            if (
                                edit
                            ) {

                                const item =
                                    s.byId(

                                        config.state,

                                        edit.dataset
                                            .editSimple

                                    );


                                set(
                                    "salesSimpleId",
                                    item.id
                                );


                                set(
                                    "salesSimpleName",
                                    item[
                                        config.nameCol
                                    ]
                                );

                            }


                            if (
                                remove
                            ) {

                                archive(

                                    config.table,

                                    remove.dataset
                                        .deleteSimple,

                                    config.state,

                                    config.render

                                );

                            }

                        };

                }

        });

    }


    function openCompanies() {


        s.openModal({

            title:
                "Empresas emisoras",

            wide:
                true,

            body: `

                <form id="salesCompanyForm">

                    <input
                        type="hidden"
                        id="salesCompanyId"
                    >

                    <input
                        type="hidden"
                        id="salesCompanyLogoOld"
                    >


                    <div class="sales-grid two">

                        ${field(
                            "Nombre de empresa *",
                            "salesCompanyName",
                            "text",
                            true
                        )}


                        <div class="sales-field">

                            <label>
                                Logo
                            </label>

                            <input
                                id="salesCompanyLogo"
                                type="file"
                                accept="image/*"
                            >

                            <small>
                                PNG/JPG/WebP · máximo 5 MB
                            </small>

                        </div>

                    </div>


                    <div
                        class="sales-form-msg"
                        id="salesCompanyMsg"
                    >
                    </div>


                    <button class="sales-btn primary">
                        Guardar empresa
                    </button>

                </form>


                <div
                    class="sales-list"
                    id="salesCompanyList"
                >

                    ${
                        s.state.companies
                            .map(
                                company => `

                                    <article class="sales-list-row">

                                        <div>

                                            <strong>
                                                ${
                                                    s.escapeHtml(
                                                        company.name
                                                    )
                                                }
                                            </strong>

                                            <small>
                                                ${
                                                    company.logo_path

                                                        ?

                                                        "Logo cargado"

                                                        :

                                                        "Sin logo"
                                                }
                                            </small>

                                        </div>


                                        <div>

                                            <button
                                                class="sales-mini"
                                                data-edit-company="${company.id}"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                class="sales-mini danger"
                                                data-delete-company="${company.id}"
                                            >
                                                Eliminar
                                            </button>

                                        </div>

                                    </article>

                                `
                            )
                            .join(
                                ""
                            )
                            ||
                            `
                                <div class="sales-empty">
                                    Sin empresas.
                                </div>
                            `
                    }

                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "#salesCompanyForm"
                        )
                        .onsubmit =
                        saveCompany;

                    GGSalesPlus.mountCompany(root);


                    root
                        .querySelector(
                            "#salesCompanyList"
                        )
                        .onclick =
                        event => {


                            const edit =
                                event.target.closest(
                                    "[data-edit-company]"
                                );


                            const remove =
                                event.target.closest(
                                    "[data-delete-company]"
                                );


                            if (
                                edit
                            ) {

                                const company =
                                    s.byId(

                                        "companies",

                                        edit.dataset
                                            .editCompany

                                    );


                                set(
                                    "salesCompanyId",
                                    company.id
                                );

                                set(
                                    "salesCompanyName",
                                    company.name
                                );

                                set(
                                    "salesCompanyLogoOld",
                                    company.logo_path
                                    ||
                                    ""
                                );

                            }


                            if (
                                remove
                            ) {

                                archive(

                                    "sales_companies",

                                    remove.dataset
                                        .deleteCompany,

                                    "companies",

                                    openCompanies

                                );

                            }

                        };

                }

        });

    }


    async function saveCompany(
        event
    ) {


        event.preventDefault();


        const message =
            document.getElementById(
                "salesCompanyMsg"
            );


        try {

            const file =
                document
                    .getElementById(
                        "salesCompanyLogo"
                    )
                    .files[
                        0
                    ];


            let path =
                value(
                    "salesCompanyLogoOld"
                )
                ||
                null;


            if (
                file
            ) {

                path =
                    await s.uploadAsset(
                        file,
                        "companies"
                    );

            }


            const payload = {

                name:
                    value(
                        "salesCompanyName"
                    ),

                logo_path: path,

                company_details:
                    value("salesPlusCompanyDetails")

            };


            const id =
                value(
                    "salesCompanyId"
                );


            const query =

                id

                    ?

                    s.db
                        .from(
                            "sales_companies"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            id
                        )

                    :

                    s.db
                        .from(
                            "sales_companies"
                        )
                        .insert(
                            payload
                        );


            const {
                error
            } =
                await query;


            if (
                error
            ) {

                throw error;

            }


            await s.reload(
                "companies"
            );


            s.toast(
                "Empresa guardada."
            );


            openCompanies();

        }

        catch (
            error
        ) {

            message.textContent =
                error.message;

        }

    }


    function openFormats(
        type =
            "quote"
    ) {


        const title =

            type ===
            "quote"

                ?

                "Formatos de cotización"

                :

                "Formatos de remisión";


        const rows =
            s.state.formats
                .filter(
                    format =>
                        format.document_type ===
                        type
                );


        s.openModal({

            title,

            xwide:
                true,

            body: `

                <form id="salesFormatForm">

                    <input
                        type="hidden"
                        id="salesFormatId"
                    >

                    <input
                        type="hidden"
                        id="salesFormatSignatureOld"
                    >


                    <div class="sales-grid two">


                        <div class="sales-field">

                            <label>
                                Empresa *
                            </label>

                            <select
                                id="salesFormatCompany"
                                required
                            >
                                ${
                                    options(
                                        s.state.companies,
                                        "id",
                                        "name"
                                    )
                                }
                            </select>

                        </div>


                        ${field(
                            "Nombre del formato *",
                            "salesFormatName",
                            "text",
                            true
                        )}


                        <div class="sales-field full">

                            <label>
                                Datos del cliente que aparecerán
                            </label>

                            <div class="sales-checks">

                                ${checks(
                                    "client",
                                    [
                                        [
                                            "legal_name",
                                            "Razón social"
                                        ],
                                        [
                                            "rfc",
                                            "RFC"
                                        ],
                                        [
                                            "address",
                                            "Dirección"
                                        ],
                                        [
                                            "email",
                                            "Correo"
                                        ],
                                        [
                                            "phone",
                                            "Teléfono"
                                        ],
                                        [
                                            "contact",
                                            "Contacto"
                                        ]
                                    ]
                                )}

                            </div>

                        </div>


                        <div class="sales-field full">

                            <label>
                                Texto “Remisión”
                            </label>

                            <textarea
                                id="salesFormatRemission"
                                rows="3"
                            ></textarea>

                        </div>


                        <div class="sales-field full">

                            <label>
                                Campos de partidas
                            </label>

                            <div class="sales-checks">

                                ${checks(
                                    "line",
                                    [
                                        [
                                            "quantity",
                                            "Cantidad"
                                        ],
                                        [
                                            "unit",
                                            "Unidad"
                                        ],
                                        [
                                            "code",
                                            "Clave"
                                        ],
                                        [
                                            "description",
                                            "Descripción"
                                        ],
                                        [
                                            "unit_price",
                                            "P. Unitario"
                                        ],
                                        [
                                            "amount",
                                            "Importe"
                                        ],
                                        [
                                            "currency",
                                            "Moneda"
                                        ]
                                    ]
                                )}

                            </div>

                        </div>


                        <div class="sales-field full">

                            <label>
                                Condiciones y comentarios
                            </label>

                            <textarea
                                id="salesFormatConditions"
                                rows="8"
                                placeholder="Se respetan saltos de línea."
                            ></textarea>

                        </div>


                        <div class="sales-field">

                            <label>
                                Imagen de firma
                            </label>

                            <input
                                id="salesFormatSignature"
                                type="file"
                                accept="image/*"
                            >

                        </div>


                        ${field(
                            "Nombre de quien firma",
                            "salesFormatSigner"
                        )}

                        ${field(
                            "Puesto de quien firma",
                            "salesFormatSignerTitle"
                        )}


                    </div>


                    <div
                        id="salesFormatMsg"
                        class="sales-form-msg"
                    >
                    </div>


                    <button class="sales-btn primary">
                        Guardar formato
                    </button>

                </form>


                <div
                    class="sales-list"
                    id="salesFormatList"
                >

                    ${
                        rows
                            .map(
                                format => `

                                    <article class="sales-list-row">

                                        <div>

                                            <strong>
                                                ${
                                                    s.escapeHtml(
                                                        format.name
                                                    )
                                                }
                                            </strong>

                                            <small>
                                                ${
                                                    s.escapeHtml(

                                                        s.byId(
                                                            "companies",
                                                            format.company_id
                                                        )
                                                        ?.name
                                                        ||
                                                        "Empresa"

                                                    )
                                                }
                                            </small>

                                        </div>


                                        <div>

                                            <button
                                                class="sales-mini"
                                                data-edit-format="${format.id}"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                class="sales-mini danger"
                                                data-delete-format="${format.id}"
                                            >
                                                Eliminar
                                            </button>

                                        </div>

                                    </article>

                                `
                            )
                            .join(
                                ""
                            )
                            ||
                            `
                                <div class="sales-empty">
                                    Sin formatos.
                                </div>
                            `
                    }

                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "#salesFormatForm"
                        )
                        .onsubmit =
                        event =>
                            saveFormat(
                                event,
                                type
                            );


                    root
                        .querySelector(
                            "#salesFormatList"
                        )
                        .onclick =
                        event =>
                            formatListClick(
                                event,
                                type
                            );

                }

        });

    }


    async function saveFormat(
        event,
        type
    ) {


        event.preventDefault();


        const message =
            document.getElementById(
                "salesFormatMsg"
            );


        try {

            const id =
                value(
                    "salesFormatId"
                );


            const file =
                document
                    .getElementById(
                        "salesFormatSignature"
                    )
                    .files[
                        0
                    ];


            let signature =
                value(
                    "salesFormatSignatureOld"
                )
                ||
                null;


            if (
                file
            ) {

                signature =
                    await s.uploadAsset(
                        file,
                        "signatures"
                    );

            }


            const payload = {

                document_type:
                    type,

                company_id:
                    value(
                        "salesFormatCompany"
                    ),

                name:
                    value(
                        "salesFormatName"
                    ),

                client_fields:
                    readChecks(
                        "client"
                    ),

                line_fields:
                    readChecks(
                        "line"
                    ),

                remission_text:
                    nullable(
                        value(
                            "salesFormatRemission"
                        )
                    ),

                conditions:
                    nullable(

                        document
                            .getElementById(
                                "salesFormatConditions"
                            )
                            .value

                    ),

                signature_path:
                    signature,

                signer_name:
                    nullable(
                        value(
                            "salesFormatSigner"
                        )
                    ),

                signer_title:
                    nullable(
                        value(
                            "salesFormatSignerTitle"
                        )
                    )

            };


            const query =

                id

                    ?

                    s.db
                        .from(
                            "sales_formats"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            id
                        )

                    :

                    s.db
                        .from(
                            "sales_formats"
                        )
                        .insert(
                            payload
                        );


            const {
                error
            } =
                await query;


            if (
                error
            ) {

                throw error;

            }


            await s.reload(
                "formats"
            );


            s.toast(
                "Formato guardado."
            );


            openFormats(
                type
            );

        }

        catch (
            error
        ) {

            message.textContent =
                error.message;

        }

    }


    function formatListClick(
        event,
        type
    ) {


        const edit =
            event.target.closest(
                "[data-edit-format]"
            );


        const remove =
            event.target.closest(
                "[data-delete-format]"
            );


        if (
            edit
        ) {

            const format =
                s.byId(
                    "formats",
                    edit.dataset
                        .editFormat
                );


            set(
                "salesFormatId",
                format.id
            );

            set(
                "salesFormatCompany",
                format.company_id
            );

            set(
                "salesFormatName",
                format.name
            );

            set(
                "salesFormatRemission",
                format.remission_text
            );


            document
                .getElementById(
                    "salesFormatConditions"
                )
                .value =
                format.conditions
                ||
                "";


            set(
                "salesFormatSignatureOld",
                format.signature_path
            );

            set(
                "salesFormatSigner",
                format.signer_name
            );

            set(
                "salesFormatSignerTitle",
                format.signer_title
            );


            Object
                .entries(
                    format.client_fields
                    ||
                    {}
                )
                .forEach(
                    (
                        [
                            key,
                            enabled
                        ]
                    ) => {

                        const node =
                            document.querySelector(

                                `[data-check-group="client"][value="${key}"]`

                            );


                        if (
                            node
                        ) {

                            node.checked =
                                Boolean(
                                    enabled
                                );

                        }

                    }
                );


            Object
                .entries(
                    format.line_fields
                    ||
                    {}
                )
                .forEach(
                    (
                        [
                            key,
                            enabled
                        ]
                    ) => {

                        const node =
                            document.querySelector(

                                `[data-check-group="line"][value="${key}"]`

                            );


                        if (
                            node
                        ) {

                            node.checked =
                                Boolean(
                                    enabled
                                );

                        }

                    }
                );

        }


        if (
            remove
        ) {

            archive(

                "sales_formats",

                remove.dataset
                    .deleteFormat,

                "formats",

                () =>
                    openFormats(
                        type
                    )

            );

        }

    }


    async function archive(
        table,
        id,
        stateKey,
        rerender
    ) {


        if (
            !confirm(
                "¿Eliminar este registro? Se conservará en historial."
            )
        ) {

            return;

        }


        try {

            const {
                error
            } =
                await s.db
                    .from(
                        table
                    )
                    .update({
                        active:
                            false
                    })
                    .eq(
                        "id",
                        id
                    );


            if (
                error
            ) {

                throw error;

            }


            await s.reload(
                stateKey
            );


            s.toast(
                "Registro eliminado."
            );


            rerender();

        }

        catch (
            error
        ) {

            s.toast(
                error.message,
                true
            );

        }

    }


    function field(
        label,
        id,
        type =
            "text",
        required =
            false
    ) {


        return `

            <div class="sales-field">

                <label>
                    ${label}
                </label>

                <input
                    id="${id}"
                    type="${type}"
                    ${required ? "required" : ""}
                >

            </div>

        `;

    }


    function options(
        rows,
        valueField,
        labelField,
        selected =
            ""
    ) {


        return `

            <option value="">
                Selecciona...
            </option>

            ${
                rows
                    .map(
                        row => `

                            <option
                                value="${row[valueField]}"
                                ${
                                    row[valueField] ===
                                    selected

                                        ?

                                        "selected"

                                        :

                                        ""
                                }
                            >
                                ${
                                    s.escapeHtml(
                                        row[labelField]
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


    function checks(
        group,
        items
    ) {


        return items
            .map(
                (
                    [
                        key,
                        label
                    ],
                    index
                ) => `

                    <label>

                        <input
                            type="checkbox"
                            data-check-group="${group}"
                            value="${key}"
                            ${
                                index < 5

                                    ?

                                    "checked"

                                    :

                                    ""
                            }
                        >

                        ${label}

                    </label>

                `
            )
            .join(
                ""
            );

    }


    function readChecks(
        group
    ) {


        const output =
            {};


        document
            .querySelectorAll(
                `[data-check-group="${group}"]`
            )
            .forEach(
                node => {

                    output[
                        node.value
                    ] =
                        node.checked;

                }
            );


        return output;

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


    function nullable(
        value
    ) {


        return value
        ||
        null;

    }


    function set(
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

            node.value =
                value
                ??
                "";

        }

    }

})();