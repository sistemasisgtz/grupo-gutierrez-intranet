(() => {

"use strict";

const db=
    window.ggSupabase;


let requests=
    [];


document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    if (
        !db
    ) {

        return;

    }


    injectTab();

    await load();

}


function injectTab() {

    const bar =
        document.querySelector(
            "[data-module-tabs] .module-tabbar"
        );


    const content =
        document.querySelector(
            "[data-module-tabs] .module-tab-content"
        );


    if (
        !bar
        ||
        !content
        ||
        bar.querySelector(
            '[data-module-tab="solicitudes-material"]'
        )
    ) {

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "module-tab";


    button.dataset.moduleTab =
        "solicitudes-material";


    button.setAttribute(
        "aria-selected",
        "false"
    );


    button.innerHTML = `

        <span class="module-tab-dot">
        </span>

        <span>
            Solicitudes de Material
        </span>

    `;


    bar.appendChild(
        button
    );


    const panel =
        document.createElement(
            "section"
        );


    panel.className =
        "module-tab-panel warehouse-panel warehouse-material-panel";


    panel.dataset.modulePanel =
        "solicitudes-material";


    panel.innerHTML = `

        <div
            class="
                warehouse-section-heading
                warehouse-section-heading-actions
            "
        >

            <div>

                <span class="warehouse-eyebrow">
                    VENTAS → ALMACÉN
                </span>

                <h2>
                    Solicitudes de Material
                </h2>

                <p>
                    Recibe solicitudes,
                    separa material y confirma el surtido.
                </p>

            </div>


            <button
                type="button"
                class="module-button"
                id="warehouseMatRefresh"
            >
                ↻ Actualizar
            </button>

        </div>


        <div class="warehouse-material-filters">

            <input
                id="warehouseMatSearch"
                type="search"
                placeholder="Buscar folio o usuario..."
            >

            <select id="warehouseMatStatus">

                <option value="">
                    Todos los estatus
                </option>

                <option value="pending">
                    Pendiente
                </option>

                <option value="separated">
                    Separado
                </option>

                <option value="supplied">
                    Surtido
                </option>

            </select>

            <input
                id="warehouseMatFrom"
                type="date"
            >

            <input
                id="warehouseMatTo"
                type="date"
            >

        </div>


        <section class="warehouse-surface">

            <div class="warehouse-surface-header">

                <div>

                    <span>
                        SOLICITUDES
                    </span>

                    <strong id="warehouseMatCount">
                        0
                    </strong>

                </div>

            </div>


            <div
                id="warehouseMatList"
                class="warehouse-material-list"
            >
            </div>

        </section>

    `;


    content.appendChild(
        panel
    );


    button.addEventListener(

        "click",

        () =>
            activate(
                "solicitudes-material"
            )

    );


    document
        .getElementById(
            "warehouseMatRefresh"
        )
        .onclick =
        load;


    [
        "warehouseMatSearch",
        "warehouseMatStatus",
        "warehouseMatFrom",
        "warehouseMatTo"
    ]
    .forEach(
        id => {

            const node =
                document.getElementById(
                    id
                );


            node.oninput =
                render;


            node.onchange =
                render;

        }
    );


    document
        .getElementById(
            "warehouseMatList"
        )
        .onclick =
        listClick;

}


function activate(
    key
) {

    document
        .querySelectorAll(
            "[data-module-tab]"
        )
        .forEach(
            button => {

                const active =
                    button.dataset
                        .moduleTab ===
                    key;


                button.classList.toggle(
                    "active",
                    active
                );


                button.setAttribute(
                    "aria-selected",
                    String(
                        active
                    )
                );

            }
        );


    document
        .querySelectorAll(
            "[data-module-panel]"
        )
        .forEach(
            panel => {

                panel.classList.toggle(

                    "active",

                    panel.dataset
                        .modulePanel ===
                        key

                );

            }
        );

}


async function load() {

    const {
        data,
        error
    } =
        await db
            .from(
                "sales_material_requests"
            )
            .select(`
                *,
                sales_material_request_items (*)
            `)
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

        toast(
            error.message,
            true
        );

        return;

    }


    requests =
        data
        ||
        [];


    render();

}


function render() {

    const host =
        document.getElementById(
            "warehouseMatList"
        );


    if (
        !host
    ) {

        return;

    }


    const search =
        normalize(
            value(
                "warehouseMatSearch"
            )
        );


    const status =
        value(
            "warehouseMatStatus"
        );


    const from =
        value(
            "warehouseMatFrom"
        );


    const to =
        value(
            "warehouseMatTo"
        );


    const rows =
        requests.filter(
            request => {


                if (
                    status
                    &&
                    request.status !==
                    status
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
                    &&
                    !normalize(
                        `
                            ${request.folio}
                            ${request.created_by_email}
                            ${request.status}
                        `
                    )
                    .includes(
                        search
                    )
                ) {

                    return false;

                }


                return true;

            }
        );


    document
        .getElementById(
            "warehouseMatCount"
        )
        .textContent =
        `${rows.length} solicitud${
            rows.length === 1
                ?
                ""
                :
                "es"
        }`;


    host.innerHTML =
        rows.length

            ?

            rows
                .map(
                    request => `

                        <article class="warehouse-material-card">


                            <div class="warehouse-material-top">

                                <div>

                                    <span>
                                        ${
                                            escapeHtml(
                                                request.folio
                                            )
                                        }
                                    </span>

                                    <strong>
                                        ${
                                            escapeHtml(
                                                request.created_by_email
                                            )
                                        }
                                    </strong>

                                    <small>
                                        ${
                                            formatDate(
                                                request.request_date
                                            )
                                        }
                                        ·
                                        ${
                                            request
                                                .sales_material_request_items
                                                ?.length
                                            ||
                                            0
                                        }
                                        partidas
                                    </small>

                                </div>


                                <span
                                    class="
                                        warehouse-material-status
                                        ${request.status}
                                    "
                                >
                                    ${
                                        statusLabel(
                                            request.status
                                        )
                                    }
                                </span>

                            </div>


                            <div class="warehouse-material-items">

                                ${
                                    (
                                        request
                                            .sales_material_request_items
                                        ||
                                        []
                                    )
                                    .sort(
                                        (
                                            a,
                                            b
                                        ) =>
                                            a.position
                                            -
                                            b.position
                                    )
                                    .map(
                                        item => `

                                            <div>

                                                <strong>
                                                    ${
                                                        escapeHtml(
                                                            item.code_snapshot
                                                        )
                                                    }
                                                </strong>

                                                <span>
                                                    ${
                                                        escapeHtml(
                                                            item.description_snapshot
                                                        )
                                                    }
                                                </span>

                                                <em>
                                                    ${
                                                        item.requested_quantity
                                                    }
                                                    ${
                                                        escapeHtml(
                                                            item.unit_snapshot
                                                            ||
                                                            ""
                                                        )
                                                    }
                                                </em>

                                            </div>

                                        `
                                    )
                                    .join(
                                        ""
                                    )
                                }

                            </div>


                            <div class="warehouse-material-actions">

                                <select
                                    data-mat-status="${request.id}"
                                    ${
                                        request.status ===
                                        "supplied"

                                            ?

                                            "disabled"

                                            :

                                            ""
                                    }
                                >

                                    <option
                                        value="pending"
                                        ${
                                            request.status ===
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
                                        value="separated"
                                        ${
                                            request.status ===
                                            "separated"

                                                ?

                                                "selected"

                                                :

                                                ""
                                        }
                                    >
                                        Separado
                                    </option>

                                    <option
                                        value="supplied"
                                        ${
                                            request.status ===
                                            "supplied"

                                                ?

                                                "selected"

                                                :

                                                ""
                                        }
                                    >
                                        Surtido
                                    </option>

                                </select>


                                <button
                                    type="button"
                                    class="module-button"
                                    data-mat-save="${request.id}"
                                    ${
                                        request.status ===
                                        "supplied"

                                            ?

                                            "disabled"

                                            :

                                            ""
                                    }
                                >
                                    Guardar estatus
                                </button>


                                ${
                                    [
                                        "separated",
                                        "supplied"
                                    ]
                                    .includes(
                                        request.status
                                    )

                                        ?

                                        `
                                            <button
                                                type="button"
                                                class="module-button"
                                                data-mat-pdf="${request.id}"
                                            >
                                                PDF
                                            </button>
                                        `

                                        :

                                        ""
                                }

                            </div>


                        </article>

                    `
                )
                .join(
                    ""
                )

            :

            `
                <div class="warehouse-material-empty">
                    Sin solicitudes.
                </div>
            `;

}


async function listClick(
    event
) {

    const save =
        event.target.closest(
            "[data-mat-save]"
        );


    const pdf =
        event.target.closest(
            "[data-mat-pdf]"
        );


    if (
        save
    ) {

        const id =
            save.dataset
                .matSave;


        const status =
            document
                .querySelector(
                    `[data-mat-status="${id}"]`
                )
                ?.value;


        if (
            status ===
            "supplied"

            &&

            !confirm(
                "Al marcar Surtido se descontará el material del stock de Almacén. ¿Continuar?"
            )
        ) {

            return;

        }


        try {

            const {
                error
            } =
                await db.rpc(

                    "sales_warehouse_set_material_request_status",

                    {
                        p_request_id:
                            id,

                        p_status:
                            status
                    }

                );


            if (
                error
            ) {

                throw error;

            }


            await load();


            toast(

                status ===
                "supplied"

                    ?

                    "Solicitud surtida y stock actualizado."

                    :

                    "Estatus actualizado."

            );

        }

        catch (
            error
        ) {

            toast(
                error.message,
                true
            );

        }

    }


    if (
        pdf
    ) {

        const request =
            requests.find(
                item =>
                    item.id ===
                    pdf.dataset
                        .matPdf
            );


        if (
            request
        ) {

            await makePdf(
                request
            );

        }

    }

}


/* =========================================================
   PDF ALMACÉN
========================================================= */

let pdfPromise =
    null;


async function ensurePdf() {

    if (
        window.jspdf
        ?.jsPDF
    ) {

        return;

    }


    if (
        !pdfPromise
    ) {

        pdfPromise =
            new Promise(

                (
                    resolve,
                    reject
                ) => {

                    const script =
                        document.createElement(
                            "script"
                        );


                    script.src =
                        "https://unpkg.com/jspdf@4.2.1/dist/jspdf.umd.min.js";


                    script.onload =
                        resolve;


                    script.onerror =
                        reject;


                    document.head.appendChild(
                        script
                    );

                }

            );

    }


    await pdfPromise;

}


async function makePdf(
    request
) {

    await ensurePdf();


    const {
        jsPDF
    } =
        window.jspdf;


    const doc =
        new jsPDF({
            unit:
                "mm",

            format:
                "letter"
        });


    const width =
        doc.internal.pageSize
            .getWidth();


    const margin =
        12;


    let y =
        13;


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        17
    );


    doc.text(
        "GRUPO GUTIERREZ",
        margin,
        y
    );


    doc.setFontSize(
        13
    );


    doc.text(
        "SURTIDO DE MATERIAL",
        width - margin,
        y,
        {
            align:
                "right"
        }
    );


    doc.setFontSize(
        9
    );


    doc.text(
        request.folio,
        width - margin,
        y + 6,
        {
            align:
                "right"
        }
    );


    y +=
        18;


    doc.setDrawColor(
        210
    );


    doc.roundedRect(
        margin,
        y,
        width - 2 * margin,
        25,
        2,
        2
    );


    pair(
        "Solicitó",
        request.created_by_email,
        margin + 3,
        y + 6
    );


    pair(
        "Fecha solicitud",
        formatDate(
            request.request_date
        ),
        margin + 3,
        y + 12
    );


    pair(
        "Estatus",
        statusLabel(
            request.status
        ),
        margin + 100,
        y + 6
    );


    pair(
        "Atendió",
        request.resolved_by_email
        ||
        "—",
        margin + 100,
        y + 12
    );


    y +=
        32;


    doc.setFillColor(
        31,
        42,
        53
    );


    doc.rect(
        margin,
        y,
        width - 2 * margin,
        7,
        "F"
    );


    doc.setTextColor(
        255
    );


    doc.text(
        "CLAVE",
        margin + 2,
        y + 4.7
    );


    doc.text(
        "DESCRIPCIÓN",
        margin + 35,
        y + 4.7
    );


    doc.text(
        "CANTIDAD",
        width - margin - 2,
        y + 4.7,
        {
            align:
                "right"
        }
    );


    doc.setTextColor(
        25
    );


    y +=
        7;


    for (
        const item
        of
        (
            request
                .sales_material_request_items
            ||
            []
        )
        .sort(
            (
                a,
                b
            ) =>
                a.position
                -
                b.position
        )
    ) {

        const lines =
            doc.splitTextToSize(
                item.description_snapshot
                ||
                "",
                105
            );


        const height =
            Math.max(
                7,
                lines.length
                *
                3
                +
                2
            );


        if (
            y + height >
            265
        ) {

            doc.addPage();

            y =
                12;

        }


        doc.text(
            item.code_snapshot
            ||
            "",
            margin + 2,
            y + 4
        );


        doc.text(
            lines,
            margin + 35,
            y + 4
        );


        doc.text(
            `${item.requested_quantity} ${item.unit_snapshot || ""}`,
            width - margin - 2,
            y + 4,
            {
                align:
                    "right"
            }
        );


        doc.setDrawColor(
            230
        );


        doc.line(
            margin,
            y + height,
            width - margin,
            y + height
        );


        y +=
            height;

    }


    doc.save(
        `${request.folio}.pdf`
    );


    function pair(
        label,
        value,
        x,
        y
    ) {

        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.text(
            `${label}:`,
            x,
            y
        );


        doc.setFont(
            "helvetica",
            "normal"
        );


        doc.text(
            String(
                value
            ),
            x + 23,
            y
        );

    }

}


/* =========================================================
   HELPERS
========================================================= */

function toast(
    message,
    error =
        false
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
        error
    );


    node.classList.add(
        "show"
    );


    setTimeout(

        () => {

            node.classList.remove(
                "show"
            );

        },

        3200

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


function normalize(
    value
) {

    return String(
        value
        ||
        ""
    )
    .normalize(
        "NFD"
    )
    .replace(
        /[\u0300-\u036f]/g,
        ""
    )
    .toLowerCase();

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
    );

}


function statusLabel(
    status
) {

    return ({

        pending:
            "Pendiente",

        separated:
            "Separado",

        supplied:
            "Surtido"

    })[
        status
    ]
    ||
    status;

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
                `${value}T12:00:00`
            )
        );

}

})();