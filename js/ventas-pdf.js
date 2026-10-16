(() => {

    "use strict";


    let s =
        null;


    let libPromise =
        null;


    // =========================================================
    // PALETA CORPORATIVA
    // =========================================================

    const C = {

        navy:
            [
                43,
                61,
                75
            ],

        steel:
            [
                70,
                94,
                111
            ],

        pale:
            [
                236,
                241,
                244
            ],

        paleBlue:
            [
                226,
                234,
                239
            ],

        line:
            [
                199,
                209,
                216
            ],

        text:
            [
                40,
                48,
                54
            ],

        muted:
            [
                104,
                117,
                126
            ],

        white:
            [
                255,
                255,
                255
            ]

    };


    // =========================================================
    // API PÚBLICA
    // =========================================================

    window.GGSalesPDF = {

        quote,

        remission,

        purchaseOrder,

        materialRequest

    };


    document.addEventListener(

        "ggsales:ready",

        () => {

            s =
                window.GGSales;

        }

    );


    // =========================================================
    // JSPDF
    // =========================================================

    async function ensureLib() {


        if (
            window.jspdf
            ?.jsPDF
        ) {

            return;

        }


        if (
            !libPromise
        ) {

            libPromise =
                new Promise(

                    (
                        resolve,
                        reject
                    ) => {


                        const src =
                            "https://unpkg.com/jspdf@4.2.1/dist/jspdf.umd.min.js";


                        const old =
                            document.querySelector(

                                `script[src="${src}"]`

                            );


                        if (
                            old
                        ) {

                            old.addEventListener(

                                "load",

                                resolve,

                                {
                                    once:
                                        true
                                }

                            );


                            old.addEventListener(

                                "error",

                                reject,

                                {
                                    once:
                                        true
                                }

                            );


                            return;

                        }


                        const script =
                            document.createElement(
                                "script"
                            );


                        script.src =
                            src;


                        script.async =
                            true;


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


        await libPromise;


        if (
            !window.jspdf
            ?.jsPDF
        ) {

            throw new Error(
                "No se pudo cargar jsPDF."
            );

        }

    }


    // =========================================================
    // DOCUMENTO CARTA
    // =========================================================

    function createDoc() {


        const {
            jsPDF
        } =
            window.jspdf;


        return new jsPDF({

            orientation:
                "portrait",

            unit:
                "mm",

            format:
                "letter",

            compress:
                true

        });

    }


    function layout(
        doc
    ) {


        const width =
            doc.internal
                .pageSize
                .getWidth();


        const height =
            doc.internal
                .pageSize
                .getHeight();


        const margin =
            12;


        return {

            width,

            height,

            margin,


            contentWidth:

                width
                -
                margin
                *
                2,


            contentBottom:

                height
                -
                15

        };

    }


    // =========================================================
    // COTIZACIÓN
    // =========================================================

    async function quote(
        id
    ) {


        await ensureLib();


        const {
            data: q,
            error
        } =
            await s.db
                .from(
                    "sales_quotes"
                )
                .select(
                    "*"
                )
                .eq(
                    "id",
                    id
                )
                .single();


        if (
            error
        ) {

            throw error;

        }


        const {
            data: items,
            error: itemError
        } =
            await s.db
                .from(
                    "sales_quote_items"
                )
                .select(
                    "*"
                )
                .eq(
                    "quote_id",
                    id
                )
                .order(
                    "position"
                );


        if (
            itemError
        ) {

            throw itemError;

        }


        await renderCommercialPdf({

            kind:
                "COTIZACIÓN",

            folio:
                q.folio,

            date:
                q.quote_date,

            status:
                q.status,

            agent:
                q.agent_snapshot,

            client:
                q.client_snapshot,

            company:
                q.company_snapshot,

            format:
                q.format_snapshot,

            items:
                items
                ||
                [],

            ivaEnabled:
                q.iva_enabled,

            ivaRate:
                q.iva_rate,

            source:
                null,

            filename:
                `${q.folio}.pdf`

        });

    }


    // =========================================================
    // REMISIÓN
    // =========================================================

    async function remission(
        id
    ) {


        await ensureLib();


        const {
            data: r,
            error
        } =
            await s.db
                .from(
                    "sales_remissions"
                )
                .select(
                    "*"
                )
                .eq(
                    "id",
                    id
                )
                .single();


        if (
            error
        ) {

            throw error;

        }


        const {
            data: items,
            error: itemError
        } =
            await s.db
                .from(
                    "sales_remission_items"
                )
                .select(
                    "*"
                )
                .eq(
                    "remission_id",
                    id
                )
                .order(
                    "position"
                );


        if (
            itemError
        ) {

            throw itemError;

        }


        await renderCommercialPdf({

            kind:
                "REMISIÓN",

            folio:
                r.folio,

            date:
                r.remission_date,

            status:
                r.status,

            agent:
                r.agent_snapshot,

            client:
                r.client_snapshot,

            company:
                r.company_snapshot,

            format:
                r.format_snapshot,

            items:
                items
                ||
                [],

            ivaEnabled:
                r.iva_enabled,

            ivaRate:
                r.iva_rate,

            source:
                r.source_quote_folio
                ||
                null,

            filename:
                `${r.folio}.pdf`

        });

    }


    // =========================================================
    // ODC
    // =========================================================

    async function purchaseOrder(
        id
    ) {


        await ensureLib();


        const {
            data: order,
            error
        } =
            await s.db
                .from(
                    "sales_purchase_orders"
                )
                .select(
                    "*"
                )
                .eq(
                    "id",
                    id
                )
                .single();


        if (
            error
        ) {

            throw error;

        }


        const {
            data: items,
            error: itemError
        } =
            await s.db
                .from(
                    "sales_purchase_order_items"
                )
                .select(
                    "*"
                )
                .eq(
                    "purchase_order_id",
                    id
                )
                .order(
                    "position"
                );


        if (
            itemError
        ) {

            throw itemError;

        }


        await renderPurchaseOrderPdf(

            order,

            items
            ||
            []

        );

    }


    // =========================================================
    // PDF COTIZACIÓN / REMISIÓN
    // =========================================================

    async function renderCommercialPdf(
        data
    ) {


        const doc =
            createDoc();


        const l =
            layout(
                doc
            );


        const logo =
            await asset(

                data.company
                    ?.logo_path

            );


        const signature =
            await asset(

                data.format
                    ?.signature_path

            );


        let y =
            drawMainHeader(

                doc,

                l,

                data,

                logo

            );


        y =
            drawCommercialInfo(

                doc,

                l,

                data,

                y

            );


        if (
            data.format
                ?.remission_text
        ) {

            y =
                drawCompactNote(

                    doc,

                    l,

                    data,

                    y,

                    "REFERENCIA / REMISIÓN",

                    data.format
                        .remission_text

                );

        }


        y =
            drawSectionTitle(

                doc,

                l,

                data,

                y,

                "PARTIDAS"

            );


        y =
            drawItemsTable(

                doc,

                l,

                data,

                data.items,

                data.format
                    ?.line_fields

                ||

                defaultFields(),

                y

            );


        y =
            drawTotals(

                doc,

                l,

                data,

                data.items,

                data.ivaEnabled,

                data.ivaRate,

                y

            );


        if (
            data.format
                ?.conditions
        ) {

            y =
                drawLongTextSection(

                    doc,

                    l,

                    data,

                    y,

                    "   ",

                    data.format
                        .conditions

                );

        }


        drawSignatureAtBottom(

            doc,

            l,

            data,

            signature,

            y

        );


        addFooters(

            doc,

            l,

            data.kind,

            data.folio

        );


        doc.save(
            data.filename
        );

    }


    // =========================================================
    // PDF ODC
    // =========================================================

    async function renderPurchaseOrderPdf(
        order,
        items
    ) {


        const doc =
            createDoc();


        const l =
            layout(
                doc
            );


        const data = {

            kind:
                "ORDEN DE COMPRA",

            folio:
                order.folio,

            company:
                order.company_snapshot,

            status:
                order.status

        };


        const logo =
            await asset(

                order.company_snapshot
                    ?.logo_path

            );


        let y =
            drawMainHeader(

                doc,

                l,

                data,

                logo

            );


        y =
            drawPurchaseOrderInfo(

                doc,

                l,

                order,

                y

            );


        y =
            drawSectionTitle(

                doc,

                l,

                data,

                y,

                "PARTIDAS"

            );


        y =
            drawItemsTable(

                doc,

                l,

                data,

                items,

                {

                    quantity:
                        true,

                    unit:
                        false,

                    code:
                        true,

                    description:
                        true,

                    unit_price:
                        true,

                    amount:
                        true,

                    currency:
                        true

                },

                y

            );


        y =
            drawTotals(

                doc,

                l,

                data,

                items,

                false,

                0,

                y

            );


        if (
            order.instructions
        ) {

            y =
                drawLongTextSection(

                    doc,

                    l,

                    data,

                    y,

                    "INSTRUCCIONES",

                    order.instructions

                );

        }


        addFooters(

            doc,

            l,

            data.kind,

            data.folio

        );


        doc.save(
            `${order.folio}.pdf`
        );

    }


    // =========================================================
    // HEADER PRINCIPAL
    // =========================================================

    function drawMainHeader(
        doc,
        l,
        data,
        logo
    ) {


        doc.setFillColor(
            ...C.navy
        );


        doc.rect(

            0,

            0,

            l.width,

            4,

            "F"

        );


        const logoX =
            l.margin;


        const logoY =
            8;


        const logoW =
            34;


        const logoH =
            17;


        doc.setFillColor(
            ...C.pale
        );


        doc.setDrawColor(
            ...C.line
        );


        doc.roundedRect(

            logoX,

            logoY,

            logoW,

            logoH,

            2,

            2,

            "FD"

        );


        if (
            logo
        ) {

            drawImageContain(

                doc,

                logo,

                logoX
                +
                2,

                logoY
                +
                2,

                logoW
                -
                4,

                logoH
                -
                4

            );

        }

        else {

            doc.setTextColor(
                ...C.steel
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(
                9
            );


            doc.text(

                "GG",

                logoX
                +
                logoW
                /
                2,

                logoY
                +
                10.8,

                {
                    align:
                        "center"
                }

            );

        }


        doc.setTextColor(
            ...C.text
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.setFontSize(
            12.5
        );


        doc.text(

            text(

                data.company
                    ?.name

                ||

                "EMPRESA"

            ),

            logoX
            +
            logoW
            +
            5,

            14

        );


        doc.setFont(
            "helvetica",
            "normal"
        );


        doc.setFontSize(
            6.3
        );


        doc.setTextColor(
            ...C.muted
        );


        doc.text(

            "GRUPO GUTIERREZ · DOCUMENTO COMERCIAL",

            logoX
            +
            logoW
            +
            5,

            19

        );


        doc.setTextColor(
            ...C.navy
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.setFontSize(
            14
        );


        doc.text(

            data.kind,

            l.width
            -
            l.margin,

            13,

            {
                align:
                    "right"
            }

        );


        doc.setFontSize(
            9.5
        );


        doc.setTextColor(
            ...C.steel
        );


        doc.text(

            data.folio,

            l.width
            -
            l.margin,

            19,

            {
                align:
                    "right"
            }

        );


        drawStatusChip(

            doc,

            statusLabel(
                data.status
            ),

            l.width
            -
            l.margin
            -
            32,

            22,

            32

        );


        doc.setDrawColor(
            ...C.line
        );


        doc.setLineWidth(
            .35
        );


        doc.line(

            l.margin,

            30,

            l.width
            -
            l.margin,

            30

        );


        return 35;

    }


    // =========================================================
    // HEADER PÁGINAS SIGUIENTES
    // =========================================================

    function drawContinuationHeader(
        doc,
        l,
        data
    ) {


        doc.setFillColor(
            ...C.navy
        );


        doc.rect(

            0,

            0,

            l.width,

            4,

            "F"

        );


        doc.setTextColor(
            ...C.text
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.setFontSize(
            9
        );


        doc.text(

            `${data.kind} · ${data.folio}`,

            l.margin,

            12

        );


        doc.setFont(
            "helvetica",
            "normal"
        );


        doc.setFontSize(
            6.2
        );


        doc.setTextColor(
            ...C.muted
        );


        doc.text(

            text(

                data.company
                    ?.name

                ||

                "GRUPO GUTIERREZ"

            ),

            l.width
            -
            l.margin,

            12,

            {
                align:
                    "right"
            }

        );


        doc.setDrawColor(
            ...C.line
        );


        doc.line(

            l.margin,

            16,

            l.width
            -
            l.margin,

            16

        );


        return 21;

    }


    // =========================================================
    // ESTATUS
    // =========================================================

    function drawStatusChip(
        doc,
        label,
        x,
        y,
        width
    ) {


        doc.setFillColor(
            ...C.paleBlue
        );


        doc.roundedRect(

            x,

            y,

            width,

            5.5,

            2.75,

            2.75,

            "F"

        );


        doc.setTextColor(
            ...C.steel
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.setFontSize(
            5.5
        );


        doc.text(

            text(
                label
            )
                .toUpperCase(),

            x
            +
            width
            /
            2,

            y
            +
            3.7,

            {
                align:
                    "center"
            }

        );

    }


    // =========================================================
    // DATOS COTIZACIÓN / REMISIÓN
    // USUARIO / CORREO NO SE IMPRIME
    // =========================================================

    function drawCommercialInfo(
        doc,
        l,
        data,
        y
    ) {


        const fields =
            data.format
                ?.client_fields

            ||

            {};


        const client =
            data.client

            ||

            {};


        const left =
            [];


        if (
            fields.legal_name !==
            false
        ) {

            left.push([
                "Cliente",
                client.legal_name
                ||
                "—"
            ]);

        }


        if (
            fields.rfc
        ) {

            left.push([
                "RFC",
                client.rfc
                ||
                "—"
            ]);

        }


        if (
            fields.address
        ) {

            left.push([
                "Dirección",
                client.address
                ||
                "—"
            ]);

        }


        if (
            fields.email
        ) {

            left.push([
                "Correo",
                client.email
                ||
                "—"
            ]);

        }


        if (
            fields.phone
        ) {

            left.push([
                "Teléfono",
                client.phone
                ||
                "—"
            ]);

        }


        if (
            fields.contact

            &&

            client.contacts?.[0]
        ) {


            const c =
                client.contacts[
                    0
                ];


            left.push([

                "Contacto",

                [
                    c.name,
                    c.title,
                    c.phone,
                    c.email
                ]
                    .filter(
                        Boolean
                    )
                    .join(
                        " · "
                    )

            ]);

        }


        // IMPORTANTE:
        // NO mostramos usuario ni correo del creador.

        const right = [

            [
                "Fecha",

                s.date(
                    data.date
                )
            ],

            [
                "Agente",

                data.agent
                ||
                "—"
            ],

            [
                "Interno",

                statusLabel(
                    data.status
                )
            ]

        ];


        if (
            data.source
        ) {

            right.push([
                "Cotización",
                data.source
            ]);

        }


        return drawTwoCards(

            doc,

            l,

            data,

            y,

            "DATOS DEL CLIENTE",

            left,

            "DATOS DEL DOCUMENTO",

            right

        );

    }


    // =========================================================
    // DATOS ODC
    // USUARIO / CORREO NO SE IMPRIME
    // =========================================================

    function drawPurchaseOrderInfo(
        doc,
        l,
        order,
        y
    ) {


        const supplier =
            order.supplier_snapshot

            ||

            {};


        const left = [

            [
                "Proveedor",

                supplier.legal_name
                ||
                "—"
            ],

            [
                "RFC",

                supplier.rfc
                ||
                "—"
            ],

            [
                "Dirección",

                supplier.address
                ||
                "—"
            ],

            [
                "Contacto",

                [
                    supplier.contact_name,
                    supplier.contact_phone,
                    supplier.contact_email
                ]
                    .filter(
                        Boolean
                    )
                    .join(
                        " · "
                    )

                ||

                "—"
            ]

        ];


        // IMPORTANTE:
        // NO mostramos correo del usuario creador.

        const right = [

            [
                "Fecha",

                s.date(
                    order.order_date
                )
            ],

            [
                "Agente",

                order.agent_snapshot
                ||
                "—"
            ],

            [
                "Estatus",

                statusLabel(
                    order.status
                )
            ]

        ];


        return drawTwoCards(

            doc,

            l,

            {

                kind:
                    "ORDEN DE COMPRA",

                folio:
                    order.folio,

                company:
                    order.company_snapshot

            },

            y,

            "DATOS DEL PROVEEDOR",

            left,

            "DATOS DE LA ORDEN",

            right

        );

    }


    // =========================================================
    // TARJETAS DE INFORMACIÓN
    // =========================================================

    function drawTwoCards(
        doc,
        l,
        data,
        y,
        leftTitle,
        leftEntries,
        rightTitle,
        rightEntries
    ) {


        const gap =
            4;


        const leftWidth =
            118;


        const rightWidth =

            l.contentWidth
            -
            leftWidth
            -
            gap;


        const height =
            Math.max(

                measureCard(

                    doc,

                    leftEntries,

                    leftWidth

                ),

                measureCard(

                    doc,

                    rightEntries,

                    rightWidth

                )

            );


        if (
            y
            +
            height
            >
            l.contentBottom
        ) {

            doc.addPage();


            y =
                drawContinuationHeader(

                    doc,

                    l,

                    data

                );

        }


        drawInfoCard(

            doc,

            l.margin,

            y,

            leftWidth,

            height,

            leftTitle,

            leftEntries

        );


        drawInfoCard(

            doc,

            l.margin
            +
            leftWidth
            +
            gap,

            y,

            rightWidth,

            height,

            rightTitle,

            rightEntries

        );


        return y
            +
            height
            +
            5;

    }


    function measureCard(
        doc,
        entries,
        width
    ) {


        let height =
            14;


        for (
            const [
                ,
                value
            ]
            of entries
        ) {


            const lines =
                doc.splitTextToSize(

                    text(
                        value
                    ),

                    Math.max(

                        20,

                        width
                        -
                        34

                    )

                );


            height +=
                Math.max(

                    4.2,

                    lines.length
                    *
                    3.05
                    +
                    .5

                );

        }


        return Math.max(
            28,
            height
        );

    }


    function drawInfoCard(
        doc,
        x,
        y,
        width,
        height,
        title,
        entries
    ) {


        doc.setFillColor(
            ...C.pale
        );


        doc.setDrawColor(
            ...C.line
        );


        doc.roundedRect(

            x,

            y,

            width,

            height,

            2,

            2,

            "FD"

        );


        doc.setFillColor(
            ...C.paleBlue
        );


        doc.roundedRect(

            x,

            y,

            width,

            6,

            2,

            2,

            "F"

        );


        doc.rect(

            x,

            y
            +
            3,

            width,

            3,

            "F"

        );


        doc.setTextColor(
            ...C.navy
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.setFontSize(
            6
        );


        doc.text(

            title,

            x
            +
            3,

            y
            +
            4.2

        );


        let rowY =
            y
            +
            10;


        for (
            const [
                label,
                value
            ]
            of entries
        ) {


            const valueX =
                x
                +
                28;


            const lines =
                doc.splitTextToSize(

                    text(
                        value
                    ),

                    Math.max(

                        18,

                        width
                        -
                        32

                    )

                );


            doc.setTextColor(
                ...C.muted
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(
                5.7
            );


            doc.text(

                `${label}:`,

                x
                +
                3,

                rowY

            );


            doc.setTextColor(
                ...C.text
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(
                6.2
            );


            doc.text(

                lines,

                valueX,

                rowY

            );


            rowY +=
                Math.max(

                    4.2,

                    lines.length
                    *
                    3.05
                    +
                    .5

                );

        }

    }


    // =========================================================
    // REFERENCIA / REMISIÓN
    // =========================================================

    function drawCompactNote(
        doc,
        l,
        data,
        y,
        title,
        value
    ) {


        const lines =
            wrapPreservingBreaks(

                doc,

                value,

                l.contentWidth
                -
                8

            );


        const height =
            Math.max(

                13,

                9
                +
                lines.length
                *
                3.05

            );


        if (
            y
            +
            height
            >
            l.contentBottom
        ) {

            doc.addPage();


            y =
                drawContinuationHeader(

                    doc,

                    l,

                    data

                );

        }


        doc.setFillColor(
            ...C.pale
        );


        doc.setDrawColor(
            ...C.line
        );


        doc.roundedRect(

            l.margin,

            y,

            l.contentWidth,

            height,

            2,

            2,

            "FD"

        );


        doc.setTextColor(
            ...C.steel
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.setFontSize(
            5.8
        );


        doc.text(

            title,

            l.margin
            +
            4,

            y
            +
            5

        );


        doc.setTextColor(
            ...C.text
        );


        doc.setFont(
            "helvetica",
            "normal"
        );


        doc.setFontSize(
            6.2
        );


        doc.text(

            lines,

            l.margin
            +
            4,

            y
            +
            9

        );


        return y
            +
            height
            +
            5;

    }


    // =========================================================
    // CONDICIONES / INSTRUCCIONES
    // =========================================================

    function drawLongTextSection(
        doc,
        l,
        data,
        y,
        title,
        value
    ) {


        const lines =
            wrapPreservingBreaks(

                doc,

                value,

                l.contentWidth
                -
                8

            );


        let index =
            0;


        while (
            index
            <
            lines.length
        ) {


            y =
                drawSectionTitle(

                    doc,

                    l,

                    data,

                    y,

                    index ===
                    0

                        ?

                        title

                        :

                        `${title} · CONTINUACIÓN`

                );


            const available =

                l.contentBottom
                -
                y
                -
                2;


            const maxLines =
                Math.max(

                    1,

                    Math.floor(

                        (
                            available
                            -
                            7
                        )
                        /
                        3.15

                    )

                );


            const chunk =
                lines.slice(

                    index,

                    index
                    +
                    maxLines

                );


            const boxHeight =

                7
                +
                chunk.length
                *
                3.15;


            doc.setFillColor(
                ...C.pale
            );


            doc.setDrawColor(
                ...C.line
            );


            doc.roundedRect(

                l.margin,

                y,

                l.contentWidth,

                boxHeight,

                2,

                2,

                "FD"

            );


            doc.setTextColor(
                ...C.text
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(
                6.2
            );


            doc.text(

                chunk,

                l.margin
                +
                4,

                y
                +
                5

            );


            y +=
                boxHeight
                +
                5;


            index +=
                chunk.length;


            if (
                index
                <
                lines.length
            ) {

                doc.addPage();


                y =
                    drawContinuationHeader(

                        doc,

                        l,

                        data

                    );

            }

        }


        return y;

    }


    // =========================================================
    // TÍTULO DE SECCIÓN
    // =========================================================

    function drawSectionTitle(
        doc,
        l,
        data,
        y,
        title
    ) {


        if (
            y
            +
            22
            >
            l.contentBottom
        ) {

            doc.addPage();


            y =
                drawContinuationHeader(

                    doc,

                    l,

                    data

                );

        }


        doc.setFillColor(
            ...C.navy
        );


        doc.roundedRect(

            l.margin,

            y,

            42,

            6.5,

            1.5,

            1.5,

            "F"

        );


        doc.setTextColor(
            ...C.white
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.setFontSize(
            5.8
        );


        doc.text(

            title,

            l.margin
            +
            3,

            y
            +
            4.4

        );


        doc.setDrawColor(
            ...C.line
        );


        doc.line(

            l.margin
            +
            46,

            y
            +
            3.25,

            l.width
            -
            l.margin,

            y
            +
            3.25

        );


        return y
            +
            9;

    }


    // =========================================================
    // CAMPOS DEFAULT
    // =========================================================

    function defaultFields() {


        return {

            quantity:
                true,

            unit:
                true,

            code:
                true,

            description:
                true,

            unit_price:
                true,

            amount:
                true,

            currency:
                true

        };

    }


    // =========================================================
    // COLUMNAS
    // =========================================================

    function buildColumns(
        fields,
        totalWidth
    ) {


        const definitions = [

            {

                key:
                    "quantity",

                label:
                    "CANT.",

                enabled:
                    fields.quantity !==
                    false,

                width:
                    14,

                align:
                    "right"

            },

            {

                key:
                    "unit_text",

                label:
                    "UNID.",

                enabled:
                    Boolean(
                        fields.unit
                    ),

                width:
                    15,

                align:
                    "left"

            },

            {

                key:
                    "code",

                label:
                    "CLAVE",

                enabled:
                    Boolean(
                        fields.code
                    ),

                width:
                    21,

                align:
                    "left"

            },

            {

                key:
                    "description",

                label:
                    "DESCRIPCIÓN",

                enabled:
                    fields.description !==
                    false,

                width:
                    0,

                flex:
                    true,

                align:
                    "left"

            },

            {

                key:
                    "unit_price",

                label:
                    "P. UNIT.",

                enabled:
                    Boolean(
                        fields.unit_price
                    ),

                width:
                    25,

                align:
                    "right"

            },

            {

                key:
                    "line_total",

                label:
                    "IMPORTE",

                enabled:
                    Boolean(
                        fields.amount
                    ),

                width:
                    27,

                align:
                    "right"

            },

            {

                key:
                    "currency",

                label:
                    "MON.",

                enabled:
                    Boolean(
                        fields.currency
                    ),

                width:
                    14,

                align:
                    "center"

            }

        ];


        const columns =
            definitions.filter(

                column =>
                    column.enabled

            );


        const flex =
            columns.filter(

                column =>
                    column.flex

            );


        const fixed =
            columns
                .filter(

                    column =>
                        !column.flex

                )
                .reduce(

                    (
                        sum,
                        column
                    ) =>
                        sum
                        +
                        column.width,

                    0

                );


        if (
            flex.length
        ) {


            const each =

                Math.max(

                    45,

                    totalWidth
                    -
                    fixed

                )
                /
                flex.length;


            flex.forEach(

                column => {

                    column.width =
                        each;

                }

            );

        }

        else {


            const factor =

                totalWidth
                /
                (
                    fixed
                    ||
                    1
                );


            columns.forEach(

                column => {

                    column.width *=
                        factor;

                }

            );

        }


        return columns;

    }


    // =========================================================
    // TABLA PARTIDAS
    // =========================================================

    function drawItemsTable(
        doc,
        l,
        data,
        items,
        fields,
        y
    ) {


        const columns =
            buildColumns(

                fields,

                l.contentWidth

            );


        y =
            drawTableHeader(

                doc,

                l,

                columns,

                y

            );


        items.forEach(

            (
                item,
                index
            ) => {


                const prepared =
                    prepareRow(

                        doc,

                        columns,

                        item

                    );


                const rowHeight =
                    Math.max(

                        6.3,

                        prepared.maxLines
                        *
                        3
                        +
                        2

                    );


                if (
                    y
                    +
                    rowHeight
                    >
                    l.contentBottom
                ) {

                    doc.addPage();


                    y =
                        drawContinuationHeader(

                            doc,

                            l,

                            data

                        );


                    y =
                        drawTableHeader(

                            doc,

                            l,

                            columns,

                            y

                        );

                }


                if (
                    index
                    %
                    2 ===
                    0
                ) {

                    doc.setFillColor(

                        247,

                        249,

                        250

                    );


                    doc.rect(

                        l.margin,

                        y,

                        l.contentWidth,

                        rowHeight,

                        "F"

                    );

                }


                doc.setTextColor(
                    ...C.text
                );


                doc.setFont(
                    "helvetica",
                    "normal"
                );


                doc.setFontSize(
                    6.15
                );


                let x =
                    l.margin;


                prepared.cells.forEach(

                    cell => {


                        const column =
                            cell.column;


                        const textX =

                            column.align ===
                            "right"

                                ?

                                x
                                +
                                column.width
                                -
                                2

                                :

                                column.align ===
                                "center"

                                    ?

                                    x
                                    +
                                    column.width
                                    /
                                    2

                                    :

                                    x
                                    +
                                    2;


                        doc.text(

                            cell.lines,

                            textX,

                            y
                            +
                            4.1,

                            {
                                align:
                                    column.align
                            }

                        );


                        x +=
                            column.width;

                    }

                );


                doc.setDrawColor(
                    ...C.line
                );


                doc.setLineWidth(
                    .18
                );


                doc.line(

                    l.margin,

                    y
                    +
                    rowHeight,

                    l.width
                    -
                    l.margin,

                    y
                    +
                    rowHeight

                );


                y +=
                    rowHeight;

            }

        );


        return y
            +
            4;

    }


    // =========================================================
    // HEADER TABLA
    // =========================================================

    function drawTableHeader(
        doc,
        l,
        columns,
        y
    ) {


        doc.setFillColor(
            ...C.navy
        );


        doc.rect(

            l.margin,

            y,

            l.contentWidth,

            7,

            "F"

        );


        doc.setTextColor(
            ...C.white
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.setFontSize(
            5.7
        );


        let x =
            l.margin;


        columns.forEach(

            column => {


                const textX =

                    column.align ===
                    "right"

                        ?

                        x
                        +
                        column.width
                        -
                        2

                        :

                        column.align ===
                        "center"

                            ?

                            x
                            +
                            column.width
                            /
                            2

                            :

                            x
                            +
                            2;


                doc.text(

                    column.label,

                    textX,

                    y
                    +
                    4.65,

                    {
                        align:
                            column.align
                    }

                );


                x +=
                    column.width;

            }

        );


        return y
            +
            7;

    }


    // =========================================================
    // RENGLÓN
    // =========================================================

    function prepareRow(
        doc,
        columns,
        item
    ) {


        let maxLines =
            1;


        const cells =
            columns.map(

                column => {


                    const raw =
                        cellValue(

                            item,

                            column.key

                        );


                    const lines =

                        column.key ===
                        "description"

                            ?

                            doc.splitTextToSize(

                                raw,

                                Math.max(

                                    18,

                                    column.width
                                    -
                                    4

                                )

                            )

                            :

                            [
                                raw
                            ];


                    maxLines =
                        Math.max(

                            maxLines,

                            lines.length

                        );


                    return {

                        column,

                        lines

                    };

                }

            );


        return {

            cells,

            maxLines

        };

    }


    function cellValue(
        item,
        key
    ) {


        if (
            key ===
            "quantity"
        ) {

            return formatQuantity(
                item.quantity
            );

        }


        if (
            key ===
            "unit_price"
        ) {

            return formatNumber(
                item.unit_price
            );

        }


        if (
            key ===
            "line_total"
        ) {


            const total =

                item.line_total

                ??

                (
                    Number(
                        item.quantity
                        ||
                        0
                    )
                    *
                    Number(
                        item.unit_price
                        ||
                        0
                    )
                );


            return formatNumber(
                total
            );

        }


        return text(

            item[
                key
            ]

            ||

            ""

        );

    }


    // =========================================================
    // TOTALES
    // =========================================================

    function drawTotals(
        doc,
        l,
        data,
        items,
        ivaEnabled,
        ivaRate,
        y
    ) {


        const currencies = [

            ...new Set(

                items.map(

                    item =>
                        item.currency
                        ||
                        "M.N."

                )

            )

        ];


        for (
            const currency
            of currencies
        ) {


            const subtotal =
                items
                    .filter(

                        item =>

                            (
                                item.currency
                                ||
                                "M.N."
                            )
                            ===
                            currency

                    )
                    .reduce(

                        (
                            sum,
                            item
                        ) => {


                            return sum
                                +
                                Number(

                                    item.line_total

                                    ??

                                    (
                                        Number(
                                            item.quantity
                                            ||
                                            0
                                        )
                                        *
                                        Number(
                                            item.unit_price
                                            ||
                                            0
                                        )
                                    )

                                );

                        },

                        0

                    );


            const iva =

                ivaEnabled

                    ?

                    subtotal
                    *
                    Number(
                        ivaRate
                        ||
                        0
                    )

                    :

                    0;


            const total =
                subtotal
                +
                iva;


            const boxHeight =

                ivaEnabled

                    ?

                    26

                    :

                    20;


            if (
                y
                +
                boxHeight
                >
                l.contentBottom
            ) {

                doc.addPage();


                y =
                    drawContinuationHeader(

                        doc,

                        l,

                        data

                    );

            }


            const boxWidth =
                72;


            const x =

                l.width
                -
                l.margin
                -
                boxWidth;


            doc.setFillColor(
                ...C.pale
            );


            doc.setDrawColor(
                ...C.line
            );


            doc.roundedRect(

                x,

                y,

                boxWidth,

                boxHeight,

                2,

                2,

                "FD"

            );


            doc.setFillColor(
                ...C.paleBlue
            );


            doc.roundedRect(

                x,

                y,

                boxWidth,

                6,

                2,

                2,

                "F"

            );


            doc.rect(

                x,

                y
                +
                3,

                boxWidth,

                3,

                "F"

            );


            doc.setTextColor(
                ...C.navy
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(
                5.8
            );


            doc.text(

                `RESUMEN ${currency}`,

                x
                +
                3,

                y
                +
                4.2

            );


            let rowY =
                y
                +
                11;


            drawMoneyRow(

                doc,

                x,

                rowY,

                boxWidth,

                "Subtotal",

                subtotal,

                currency,

                false

            );


            rowY +=
                5;


            if (
                ivaEnabled
            ) {

                drawMoneyRow(

                    doc,

                    x,

                    rowY,

                    boxWidth,

                    `IVA ${
                        (
                            Number(
                                ivaRate
                                ||
                                0
                            )
                            *
                            100
                        )
                        .toFixed(
                            0
                        )
                    }%`,

                    iva,

                    currency,

                    false

                );


                rowY +=
                    5;

            }


            drawMoneyRow(

                doc,

                x,

                rowY,

                boxWidth,

                "TOTAL",

                total,

                currency,

                true

            );


            y +=
                boxHeight
                +
                4;

        }


        return y;

    }


    function drawMoneyRow(
        doc,
        x,
        y,
        width,
        label,
        value,
        currency,
        bold
    ) {


        doc.setFont(

            "helvetica",

            bold

                ?

                "bold"

                :

                "normal"

        );


        doc.setFontSize(

            bold

                ?

                7

                :

                6.2

        );


        doc.setTextColor(

            ...(

                bold

                    ?

                    C.navy

                    :

                    C.muted

            )

        );


        doc.text(

            label,

            x
            +
            4,

            y

        );


        doc.setTextColor(
            ...C.text
        );


        doc.text(

            `${formatNumber(value)} ${currency}`,

            x
            +
            width
            -
            4,

            y,

            {
                align:
                    "right"
            }

        );

    }


    // =========================================================
    // FIRMA CENTRADA HASTA ABAJO
    // =========================================================

    function drawSignatureAtBottom(
        doc,
        l,
        data,
        signature,
        currentY
    ) {


        const name =
            data.format
                ?.signer_name

            ||

            "";


        const title =
            data.format
                ?.signer_title

            ||

            "";


        if (
            !signature

            &&

            !name

            &&

            !title
        ) {

            return;

        }


        const top =

            l.height
            -
            53;


        // Si ya hay contenido ocupando el lugar
        // de la firma, creamos una hoja limpia.

        if (
            currentY
            >
            top
            -
            5
        ) {

            doc.addPage();


            drawContinuationHeader(

                doc,

                l,

                data

            );

        }


        const center =

            l.width
            /
            2;


        doc.setTextColor(
            ...C.muted
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.setFontSize(
            5.7
        );


        doc.text(

            "FIRMA",

            center,

            top,

            {
                align:
                    "center"
            }

        );


        if (
            signature
        ) {

            drawImageContain(

                doc,

                signature,

                center
                -
                25,

                top
                +
                3,

                50,

                16

            );

        }


        const lineY =

            top
            +
            22;


        doc.setDrawColor(
            ...C.steel
        );


        doc.setLineWidth(
            .35
        );


        doc.line(

            center
            -
            31,

            lineY,

            center
            +
            31,

            lineY

        );


        doc.setTextColor(
            ...C.text
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.setFontSize(
            7
        );


        doc.text(

            name,

            center,

            lineY
            +
            4.8,

            {
                align:
                    "center"
            }

        );


        doc.setTextColor(
            ...C.muted
        );


        doc.setFont(
            "helvetica",
            "normal"
        );


        doc.setFontSize(
            6
        );


        doc.text(

            title,

            center,

            lineY
            +
            8.6,

            {
                align:
                    "center"
            }

        );

    }


    // =========================================================
    // FOOTER
    // =========================================================

    function addFooters(
        doc,
        l,
        kind,
        folio
    ) {


        const total =
            doc.getNumberOfPages();


        for (
            let page =
                1;

            page <=
            total;

            page++
        ) {


            doc.setPage(
                page
            );


            const y =

                l.height
                -
                8;


            doc.setDrawColor(
                ...C.line
            );


            doc.setLineWidth(
                .25
            );


            doc.line(

                l.margin,

                y
                -
                3,

                l.width
                -
                l.margin,

                y
                -
                3

            );


            doc.setTextColor(
                ...C.muted
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(
                5.4
            );


            doc.text(

                `${kind} · ${folio}`,

                l.margin,

                y

            );


            doc.text(

                "GRUPO GUTIERREZ · DOCUMENTO COMERCIAL",

                l.width
                /
                2,

                y,

                {
                    align:
                        "center"
                }

            );


            doc.text(

                `Página ${page} de ${total}`,

                l.width
                -
                l.margin,

                y,

                {
                    align:
                        "right"
                }

            );

        }

    }


    // =========================================================
    // IMÁGENES
    // =========================================================

    async function asset(
        path
    ) {


        if (
            !path
        ) {

            return null;

        }


        try {


            const data =
                await s.assetDataUrl(
                    path
                );


            return await normalizeImage(
                data
            );

        }

        catch (
            error
        ) {


            console.warn(

                "No se pudo cargar imagen PDF:",

                error

            );


            return null;

        }

    }


    // =========================================================
    // NORMALIZAR IMAGEN
    // JPG / PNG / WEBP → PNG
    // =========================================================

    function normalizeImage(
        dataUrl
    ) {


        return new Promise(

            resolve => {


                if (
                    !dataUrl
                ) {

                    resolve(
                        null
                    );

                    return;

                }


                const image =
                    new Image();


                image.onload =
                    () => {


                        const maxSize =
                            1800;


                        const scale =
                            Math.min(

                                1,

                                maxSize
                                /
                                Math.max(

                                    image.naturalWidth,

                                    image.naturalHeight

                                )

                            );


                        const canvas =
                            document.createElement(
                                "canvas"
                            );


                        canvas.width =
                            Math.max(

                                1,

                                Math.round(

                                    image.naturalWidth
                                    *
                                    scale

                                )

                            );


                        canvas.height =
                            Math.max(

                                1,

                                Math.round(

                                    image.naturalHeight
                                    *
                                    scale

                                )

                            );


                        const context =
                            canvas.getContext(
                                "2d"
                            );


                        context.drawImage(

                            image,

                            0,

                            0,

                            canvas.width,

                            canvas.height

                        );


                        resolve(

                            canvas.toDataURL(
                                "image/png"
                            )

                        );

                    };


                image.onerror =
                    () => {

                        resolve(
                            dataUrl
                        );

                    };


                image.src =
                    dataUrl;

            }

        );

    }


    // =========================================================
    // IMAGEN PROPORCIONAL
    // =========================================================

    function drawImageContain(
        doc,
        dataUrl,
        x,
        y,
        maxWidth,
        maxHeight
    ) {


        try {


            const properties =
                doc.getImageProperties(
                    dataUrl
                );


            const ratio =
                Math.min(

                    maxWidth
                    /
                    properties.width,

                    maxHeight
                    /
                    properties.height

                );


            const width =
                properties.width
                *
                ratio;


            const height =
                properties.height
                *
                ratio;


            doc.addImage(

                dataUrl,

                "PNG",


                x
                +
                (
                    maxWidth
                    -
                    width
                )
                /
                2,


                y
                +
                (
                    maxHeight
                    -
                    height
                )
                /
                2,


                width,

                height,


                undefined,

                "FAST"

            );

        }

        catch (
            error
        ) {


            console.warn(

                "No se pudo colocar imagen en PDF:",

                error

            );

        }

    }


    // =========================================================
    // RESPETAR SALTOS DE LÍNEA
    // =========================================================

    function wrapPreservingBreaks(
        doc,
        value,
        maxWidth
    ) {


        const source =
            text(
                value
            )
                .replace(
                    /\r\n/g,
                    "\n"
                )
                .replace(
                    /\r/g,
                    "\n"
                );


        const output =
            [];


        source
            .split(
                "\n"
            )
            .forEach(

                line => {


                    if (
                        line ===
                        ""
                    ) {

                        output.push(
                            ""
                        );

                        return;

                    }


                    output.push(

                        ...doc.splitTextToSize(

                            line,

                            maxWidth

                        )

                    );

                }

            );


        return output.length

            ?

            output

            :

            [
                ""
            ];

    }


    // =========================================================
    // HELPERS
    // =========================================================

    function text(
        value
    ) {


        return String(

            value
            ??
            ""

        );

    }


    function formatNumber(
        value
    ) {


        return Number(

            value
            ||
            0

        )
            .toLocaleString(

                "es-MX",

                {

                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2

                }

            );

    }


    function formatQuantity(
        value
    ) {


        return Number(

            value
            ||
            0

        )
            .toLocaleString(

                "es-MX",

                {

                    minimumFractionDigits:
                        0,

                    maximumFractionDigits:
                        3

                }

            );

    }


    function statusLabel(
        status
    ) {


        return ({

            pending:
                "Pendiente",

            approved:
                "Aprobada",

            rejected:
                "Rechazada",

            cancelled:
                "Cancelada",

            active:
                "Activa",

            supplied:
                "Surtida",

            separated:
                "Separado"

        })[
            status
        ]

        ||

        status

        ||

        "—";

    }


    // =========================================================
    // SOLICITUD DE MATERIAL
    // ESTA SE CONSERVA COMO ESTABA
    // =========================================================

    async function materialRequest(
        id
    ) {


        await ensureLib();


        const {
            data: request,
            error
        } =
            await s.db
                .from(
                    "sales_material_requests"
                )
                .select(
                    "*"
                )
                .eq(
                    "id",
                    id
                )
                .single();


        if (
            error
        ) {

            throw error;

        }


        const {
            data: items,
            error: itemError
        } =
            await s.db
                .from(
                    "sales_material_request_items"
                )
                .select(
                    "*"
                )
                .eq(
                    "request_id",
                    id
                )
                .order(
                    "position"
                );


        if (
            itemError
        ) {

            throw itemError;

        }


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
            doc.internal
                .pageSize
                .getWidth();


        const height =
            doc.internal
                .pageSize
                .getHeight();


        const margin =
            12;


        let y =
            12;


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

            "SOLICITUD DE MATERIAL",

            width
            -
            margin,

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

            width
            -
            margin,

            y
            +
            6,

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

            width
            -
            margin
            *
            2,

            24,

            1.5,

            1.5

        );


        legacyPair(

            doc,

            "Solicitado por",

            request.created_by_email,

            margin
            +
            3,

            y
            +
            5

        );


        legacyPair(

            doc,

            "Fecha",

            s.date(
                request.request_date
            ),

            margin
            +
            3,

            y
            +
            11

        );


        legacyPair(

            doc,

            "Estatus",

            String(
                request.status
            )
                .toUpperCase(),

            margin
            +
            100,

            y
            +
            5

        );


        if (
            request.resolved_by_email
        ) {

            legacyPair(

                doc,

                "Almacén",

                request.resolved_by_email,

                margin
                +
                100,

                y
                +
                11

            );

        }


        y +=
            30;


        y =
            drawMaterialTable(

                doc,

                items
                ||
                [],

                y,

                margin,

                width,

                height

            );


        doc.setFontSize(
            7
        );


        doc.text(

            `Documento generado: ${
                s.dateTime(
                    new Date()
                        .toISOString()
                )
            }`,

            margin,

            height
            -
            8

        );


        doc.save(
            `${request.folio}.pdf`
        );

    }


    // =========================================================
    // TABLA SOLICITUD MATERIAL
    // =========================================================

    function drawMaterialTable(
        doc,
        items,
        y,
        margin,
        width,
        height
    ) {


        const drawHeader =
            () => {


                doc.setFillColor(

                    31,

                    42,

                    53

                );


                doc.rect(

                    margin,

                    y,

                    width
                    -
                    margin
                    *
                    2,

                    7,

                    "F"

                );


                doc.setTextColor(
                    255
                );


                doc.setFont(
                    "helvetica",
                    "bold"
                );


                doc.setFontSize(
                    6.7
                );


                doc.text(

                    "CANT.",

                    margin
                    +
                    2,

                    y
                    +
                    4.6

                );


                doc.text(

                    "UNID.",

                    margin
                    +
                    24,

                    y
                    +
                    4.6

                );


                doc.text(

                    "CLAVE",

                    margin
                    +
                    48,

                    y
                    +
                    4.6

                );


                doc.text(

                    "DESCRIPCIÓN",

                    margin
                    +
                    78,

                    y
                    +
                    4.6

                );


                doc.setTextColor(
                    25
                );


                y +=
                    7;

            };


        drawHeader();


        for (
            const item
            of items
        ) {


            const lines =
                doc.splitTextToSize(

                    text(
                        item.description_snapshot
                    ),

                    width
                    -
                    margin
                    *
                    2
                    -
                    82

                );


            const rowHeight =
                Math.max(

                    7,

                    lines.length
                    *
                    3.1
                    +
                    2

                );


            if (
                y
                +
                rowHeight
                >
                height
                -
                14
            ) {

                doc.addPage();


                y =
                    12;


                drawHeader();

            }


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(
                6.6
            );


            doc.text(

                formatQuantity(
                    item.requested_quantity
                ),

                margin
                +
                2,

                y
                +
                4

            );


            doc.text(

                text(
                    item.unit_snapshot
                ),

                margin
                +
                24,

                y
                +
                4

            );


            doc.text(

                text(
                    item.code_snapshot
                ),

                margin
                +
                48,

                y
                +
                4

            );


            doc.text(

                lines,

                margin
                +
                78,

                y
                +
                4

            );


            doc.setDrawColor(
                225
            );


            doc.line(

                margin,

                y
                +
                rowHeight,

                width
                -
                margin,

                y
                +
                rowHeight

            );


            y +=
                rowHeight;

        }


        return y;

    }


    function legacyPair(
        doc,
        label,
        value,
        x,
        y
    ) {


        doc.setFontSize(
            6.8
        );


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

            doc.splitTextToSize(

                text(
                    value
                ),

                72

            )[
                0
            ]

            ||

            "",

            x
            +
            18,

            y

        );

    }

})();