// =========================================================
// GRUPO GUTIERREZ
// FINANZAS · EXPORTACIÓN EXCEL
// =========================================================

(() => {

    "use strict";


    let libraryPromise =
        null;


    window.GGFinanceExcel = {

        exportRequests

    };


    async function exportRequests(
        requests,
        filename =
            "control-financiero.xlsx"
    ) {


        if (
            !requests?.length
        ) {

            throw new Error(
                "No hay solicitudes para exportar."
            );

        }


        await ensureLibrary();


        const rows =
            requests.map(
                request => ({

                    "Fecha solicitud":
                        request.request_date,

                    "ID":
                        request.request_folio,

                    "Empresa":
                        request.company_name,

                    "Grupo":
                        request.group_name_snapshot,

                    "Tipo de movimiento":
                        request.movement_type,

                    "Área agrupadora":
                        request.area_group,

                    "Clasificación":
                        request.classification,

                    "Categoría":
                        request.category,

                    "Comportamiento":
                        request.behavior,

                    "Solicitante":
                        request.requester_name,

                    "Proveedor":
                        request.provider_name,

                    "Cliente":
                        request.client_name,

                    "OC / REM":
                        request.oc_rem
                        ||
                        "",

                    "Proyecto":
                        request.project
                        ||
                        "",

                    "Folio factura":
                        request.invoice_folio
                        ||
                        "",

                    "Concepto factura":
                        request.invoice_concept
                        ||
                        "",

                    "Factura Finanzas":
                        request.finance_invoice_received
                            ?
                            "SI"
                            :
                            "NO",

                    "Importe solicitado":
                        Number(
                            request.requested_amount
                            ||
                            0
                        ),

                    "Importe real":

                        request.actual_amount ===
                        null

                            ?

                            ""

                            :

                            Number(
                                request.actual_amount
                            ),

                    "Fecha vencimiento":
                        request.due_date,

                    "Método solicitado":
                        request.payment_method_requested,

                    "Autorización Finanzas":

                        request.authorization_status ===
                        "authorized"

                            ?

                            "AUTORIZADA"

                            :

                            (
                                request.authorization_status ===
                                "rejected"

                                    ?

                                    "NO AUTORIZADA"

                                    :

                                    "PENDIENTE"
                            ),

                    "Fecha autorización":
                        request.authorization_date
                        ||
                        "",

                    "Confirmación de pago":
                        request.payment_confirmed
                            ?
                            "SI"
                            :
                            "NO",

                    "Fecha pago":
                        request.payment_date
                        ||
                        "",

                    "Semana pago":
                        request.payment_week
                        ??
                        "",

                    "Mes pago":
                        request.payment_month
                        ??
                        "",

                    "Año pago":
                        request.payment_year
                        ??
                        "",

                    "Solicitado por":
                        request.created_by_email,

                    "Autorizado por":
                        request.authorized_by_email
                        ||
                        "",

                    "Comentarios":
                        request.additional_comments
                        ||
                        ""

                })
            );


        const workbook =
            XLSX.utils.book_new();


        const sheet =
            XLSX.utils.json_to_sheet(
                rows
            );


        sheet["!cols"] = [

            { wch: 15 },
            { wch: 16 },
            { wch: 20 },
            { wch: 20 },
            { wch: 18 },
            { wch: 22 },
            { wch: 30 },
            { wch: 34 },
            { wch: 18 },
            { wch: 24 },
            { wch: 28 },
            { wch: 24 },
            { wch: 18 },
            { wch: 24 },
            { wch: 18 },
            { wch: 42 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 18 },
            { wch: 20 },
            { wch: 22 },
            { wch: 22 },
            { wch: 20 },
            { wch: 18 },
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
            { wch: 20 },
            { wch: 24 },
            { wch: 40 }

        ];


        sheet["!autofilter"] = {

            ref:
                sheet["!ref"]

        };


        for (
            let row = 2;
            row <=
            rows.length + 1;
            row += 1
        ) {

            if (
                sheet[
                    `R${row}`
                ]
            ) {

                sheet[
                    `R${row}`
                ].z =
                    "$#,##0.00";

            }


            if (
                sheet[
                    `S${row}`
                ]
                &&
                typeof sheet[
                    `S${row}`
                ].v ===
                "number"
            ) {

                sheet[
                    `S${row}`
                ].z =
                    "$#,##0.00";

            }

        }


        XLSX.utils.book_append_sheet(

            workbook,

            sheet,

            "Solicitudes"

        );


        XLSX.writeFile(

            workbook,

            filename,

            {
                compression:
                    true
            }

        );

    }


    async function ensureLibrary() {


        if (
            window.XLSX
        ) {

            return;

        }


        if (
            libraryPromise
        ) {

            return libraryPromise;

        }


        libraryPromise =
            loadScript(
                "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"
            );


        try {

            await libraryPromise;


            if (
                !window.XLSX
            ) {

                throw new Error(
                    "No se pudo inicializar Excel."
                );

            }

        }

        catch (
            error
        ) {

            libraryPromise =
                null;


            throw error;

        }

    }


    function loadScript(
        src
    ) {


        return new Promise(
            (
                resolve,
                reject
            ) => {


                const existing =
                    document.querySelector(
                        `script[src="${src}"]`
                    );


                if (
                    existing
                ) {

                    if (
                        window.XLSX
                    ) {

                        resolve();

                        return;

                    }


                    existing.addEventListener(
                        "load",
                        resolve,
                        {
                            once:
                                true
                        }
                    );


                    existing.addEventListener(
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


                script.addEventListener(
                    "load",
                    resolve,
                    {
                        once:
                            true
                    }
                );


                script.addEventListener(
                    "error",
                    reject,
                    {
                        once:
                            true
                    }
                );


                document.head.appendChild(
                    script
                );

            }
        );

    }

})();