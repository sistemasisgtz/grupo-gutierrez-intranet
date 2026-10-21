
"use strict";

// ========================================================
// GRUPO GUTIÉRREZ
// INSTALADOR AUTOMÁTICO DE VENTAS PLUS
//
// Compatible con: desarrollo grupo(10)
//
// Integra:
// - Cotizaciones y sus borradores
// - Remisiones manuales y desde cotización
// - ODC
// - Datos adicionales de empresas
// - Nuevos campos en PDF
// - Enlaces del CSS y JS adicionales
//
// NO ejecuta SQL.
// NO modifica Supabase.
// NO borra datos comerciales.
//
// Crea copias .bak de todos los archivos modificados.
// ========================================================

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = __dirname;

const names = [
    "js/ventas-cotizaciones.js",
    "js/ventas-remisiones.js",
    "js/ventas-odc.js",
    "js/ventas-catalogos.js",
    "js/ventas-pdf.js",
    "ventas.html"
];

// ========================================================
// 1. LEER ARCHIVOS ORIGINALES
// ========================================================

const files = Object.fromEntries(
    names.map(name => {

        const file = path.join(root, name);

        if (!fs.existsSync(file)) {
            throw Error(
                `No encontré el archivo: ${name}`
            );
        }

        return [
            name,

            fs.readFileSync(file, "utf8")
                .replace(/\r\n/g, "\n")
        ];
    })
);

// Revisar que ya existan los archivos nuevos
// que te pasé en los pasos anteriores.

for (
    const name of [
        "js/ventas-plus.js",
        "css/ventas-plus.css"
    ]
) {

    if (!fs.existsSync(path.join(root, name))) {

        throw Error(
            `Primero crea este archivo: ${name}`
        );
    }
}

// ========================================================
// 2. FUNCIONES DE REEMPLAZO SEGURO
// ========================================================

function changeOne(source, from, to, label) {

    if (!source.includes(from)) {

        throw Error(
            `No encontré el bloque: ${label}`
        );
    }

    if (
        source.indexOf(from) !==
        source.lastIndexOf(from)
    ) {

        throw Error(
            `Encontré varias coincidencias: ${label}`
        );
    }

    return source.replace(from, to);
}

function segment(filename, begin, end, fn) {

    const source = files[filename];

    const a = source.indexOf(begin);

    if (a < 0) {

        throw Error(
            `No encontré la función: ${begin}`
        );
    }

    const b = end
        ? source.indexOf(
            end,
            a + begin.length
        )
        : source.length;

    if (b < 0) {

        throw Error(
            `No encontré el final: ${end}`
        );
    }

    const oldPart = source.slice(a, b);

    const newPart = fn(oldPart);

    files[filename] =
        source.slice(0, a) +
        newPart +
        source.slice(b);
}

// ========================================================
// 3. MODIFICAR GUARDADO DE DOCUMENTOS
//
// Mantiene las RPC originales.
// Después conecta los campos adicionales
// y limpia el borrador correspondiente.
// ========================================================

function patchSave(
    filename,
    begin,
    end,
    rpc,
    kind
) {

    segment(
        filename,
        begin,
        end,

        src => {

            const expression = new RegExp(
                "const\\s*\\{\\s*error\\s*\\}" +
                "\\s*=\\s*await s\\.db\\.rpc\\(" +
                "\\s*\"" + rpc + "\""
            );

            if (!expression.test(src)) {

                throw Error(
                    `No encontré RPC ${rpc} en ${begin}`
                );
            }

            src = src.replace(
                expression,

                `const beganAt = new Date().toISOString();
        const {data,error}=await s.db.rpc("${rpc}"`
            );

            src = changeOne(
                src,

                `if(error)throw error;

        s.closeModal();`,

                `if(error)throw error;

        await GGSalesPlus.saved(
            "${kind}",
            data,
            id,
            beganAt
        );

        s.closeModal();`,

                `${begin}: guardar cambios`
            );

            return src;
        }
    );
}

// ========================================================
// 4. COTIZACIONES
// ========================================================

{
    const f = "js/ventas-cotizaciones.js";

    // Conectar borradores, alta rápida
    // de productos y remisión detalle.

    segment(
        f,
        "function openQuoteForm(",
        "function openCopySelector(",

        src => changeOne(
            src,

            `            renderTotals();
        }`,

            `            renderTotals();

            GGSalesPlus.mount("quote", {
                base: editing ? base : null,
                isCopy: copy,
                addLine
            });
        }`,

            "Cotizaciones: abrir formulario"
        )
    );

    // Guardar campos adicionales al terminar
    // correctamente la RPC original.

    patchSave(
        f,
        "async function saveQuote(",
        "function options(",
        "sales_save_quote",
        "quote"
    );
}

// ========================================================
// 5. REMISIONES
// ========================================================

{
    const f = "js/ventas-remisiones.js";

    // REMISIÓN DESDE COTIZACIÓN

    segment(
        f,
        "async function openFromQuote(",
        "async function saveFromQuote(",

        src => changeOne(
            src,

            `                    existing?.id||null
                );
        }`,

            `                    existing?.id||null
                );

            GGSalesPlus.mount("remission_quote", {
                base: existing,
                quoteId: quote.id,
                entityId: quote.client_id
            });
        }`,

            "Remisiones: desde cotización"
        )
    );

    // REMISIÓN MANUAL

    segment(
        f,
        "function openStandalone(",
        "function refreshPriceGroups(",

        src => changeOne(
            src,

            `                addStandaloneLine();
            }
        }`,

            `                addStandaloneLine();
            }

            GGSalesPlus.mount("remission_manual", {
                base,
                addLine: addStandaloneLine
            });
        }`,

            "Remisiones: formulario manual"
        )
    );

    // GUARDAR REMISIÓN DESDE COTIZACIÓN

    patchSave(
        f,
        "async function saveFromQuote(",
        "function openStandalone(",
        "sales_save_remission",
        "remission_quote"
    );

    // GUARDAR REMISIÓN MANUAL

    patchSave(
        f,
        "async function saveStandalone(",
        "function options(",
        "sales_save_remission",
        "remission_manual"
    );
}

// ========================================================
// 6. ÓRDENES DE COMPRA
// ========================================================

{
    const f = "js/ventas-odc.js";

    // Conectar borrador y dirección de recoger.

    segment(
        f,
        "function openOrderForm(",
        "function addOrderLine(",

        src => changeOne(
            src,

            `                addOrderLine();
            }
        }`,

            `                addOrderLine();
            }

            GGSalesPlus.mount("odc", {
                base,
                addLine: addOrderLine
            });
        }`,

            "ODC: abrir formulario"
        )
    );

    // Guardar dirección al terminar la RPC.

    patchSave(
        f,
        "async function saveOrder(",
        "async function archive(",
        "sales_save_purchase_order",
        "odc"
    );
}

// ========================================================
// 7. DATOS ADICIONALES DE EMPRESAS
// ========================================================

{
    const f = "js/ventas-catalogos.js";

    // Añadir campo adicional al formulario.

    segment(
        f,
        "function openCompanies()",
        "async function saveCompany(",

        src => changeOne(
            src,

            `                        saveCompany;`,

            `                        saveCompany;

                    GGSalesPlus.mountCompany(root);`,

            "Empresas: formulario"
        )
    );

    // Añadir company_details al guardado.

    segment(
        f,
        "async function saveCompany(",
        "function openFormats(",

        src => {

            const old =
                /logo_path:\s*path\s*\n\s*};/;

            if (!old.test(src)) {

                throw Error(
                    "No encontré el payload de empresa."
                );
            }

            return src.replace(
                old,

                `logo_path: path,

                company_details:
                    value("salesPlusCompanyDetails")

            };`
            );
        }
    );
}

// ========================================================
// 8. PDF DE COTIZACIÓN
// ========================================================

{
    const f = "js/ventas-pdf.js";

    segment(
        f,
        "async function quote(",
        "async function remission(",

        src => changeOne(
            src,

            `            company:
                q.company_snapshot,`,

            `            company:
                q.company_snapshot,

            companyDetails:
                GGSalesPlus.companyDetails(
                    q.format_id,
                    q.company_id,
                    q.company_snapshot
                ),

            remissionDetail:
                q.remission_detail || "",`,

            "PDF: cotización"
        )
    );

    // ====================================================
    // 9. PDF DE REMISIÓN
    // ====================================================

    segment(
        f,
        "async function remission(",
        "async function purchaseOrder(",

        src => changeOne(
            src,

            `            company:
                r.company_snapshot,`,

            `            company:
                r.company_snapshot,

            companyDetails:
                GGSalesPlus.companyDetails(
                    r.format_id,
                    r.company_id,
                    r.company_snapshot
                ),

            deliveryAddress:
                r.delivery_address || "",`,

            "PDF: remisión"
        )
    );

    // ====================================================
    // 10. IMPRIMIR LOS CAMPOS EN EL PDF COMERCIAL
    // ====================================================

    segment(
        f,
        "async function renderCommercialPdf(",
        "async function renderPurchaseOrderPdf(",

        src => {

            const expression =
                /(let y\s*=\s*drawMainHeader\([\s\S]*?\);)(\s*)(y\s*=\s*drawCommercialInfo\()/;

            if (!expression.test(src)) {

                throw Error(
                    "No encontré el encabezado del PDF comercial."
                );
            }

            return src.replace(
                expression,

                `$1

        if (data.companyDetails) {
            y = drawCompactNote(
                doc, l, data, y,
                "DATOS DE LA EMPRESA",
                data.companyDetails
            );
        }

        if (data.remissionDetail) {
            y = drawCompactNote(
                doc, l, data, y,
                "REMISIÓN DETALLE",
                data.remissionDetail
            );
        }

        if (data.deliveryAddress) {
            y = drawCompactNote(
                doc, l, data, y,
                "DIRECCIÓN DE ENTREGA",
                data.deliveryAddress
            );
        }

        $3`
            );
        }
    );

    // ====================================================
    // 11. PDF DE ORDEN DE COMPRA
    // ====================================================

    segment(
        f,
        "async function renderPurchaseOrderPdf(",
        "function drawMainHeader(",

        src => {

            const expression =
                /(let y\s*=\s*drawMainHeader\([\s\S]*?\);)(\s*)(y\s*=\s*drawPurchaseOrderInfo\()/;

            if (!expression.test(src)) {

                throw Error(
                    "No encontré el encabezado del PDF de ODC."
                );
            }

            return src.replace(
                expression,

                `$1

        const companyDetails =
            GGSalesPlus.companyDetails(
                null,
                order.company_id,
                order.company_snapshot
            );

        if (companyDetails) {
            y = drawCompactNote(
                doc, l, data, y,
                "DATOS DE LA EMPRESA",
                companyDetails
            );
        }

        if (order.pickup_address) {
            y = drawCompactNote(
                doc, l, data, y,
                "DIRECCIÓN DE RECOGER",
                order.pickup_address
            );
        }

        $3`
            );
        }
    );
}

// ========================================================
// 12. ENLAZAR LOS ARCHIVOS NUEVOS
//
// Si ya agregaste los enlaces del paso 4,
// no los duplica.
// ========================================================

{
    const f = "ventas.html";

    if (
        !files[f].includes(
            'href="css/ventas-plus.css"'
        )
    ) {

        files[f] = changeOne(
            files[f],

            `<link rel="stylesheet" href="css/ventas-mejoras.css">`,

            `<link rel="stylesheet" href="css/ventas-mejoras.css">
    <link rel="stylesheet" href="css/ventas-plus.css">`,

            "HTML: CSS adicional"
        );
    }

    if (
        !files[f].includes(
            'src="js/ventas-plus.js"'
        )
    ) {

        files[f] = changeOne(
            files[f],

            `<script src="js/ventas-mejoras.js"></script>`,

            `<script src="js/ventas-mejoras.js"></script>
    <script src="js/ventas-plus.js"></script>`,

            "HTML: JS adicional"
        );
    }
}

// ========================================================
// 13. VALIDAR SINTAXIS
//
// Antes de escribir cualquier archivo,
// comprueba que TODOS los JS sean válidos.
// ========================================================

for (
    const name of names.filter(
        name => name.endsWith(".js")
    )
) {

    new vm.Script(
        files[name],
        {
            filename: name
        }
    );

}

// ========================================================
// 14. VERIFICAR RESPALDOS
//
// Si se ejecutó anteriormente, no vuelve
// a modificar los archivos.
// ========================================================

for (const name of names) {

    const target = path.join(root, name);

    const backup = `${target}.bak`;

    if (fs.existsSync(backup)) {

        throw Error(
            `Ya existe respaldo de ${name}. ` +
            "No aplicaré nuevamente los cambios."
        );
    }
}

// ========================================================
// 15. CREAR RESPALDOS .BAK
// ========================================================

for (const name of names) {

    const target = path.join(root, name);

    fs.copyFileSync(
        target,
        `${target}.bak`,
        fs.constants.COPYFILE_EXCL
    );
}

// ========================================================
// 16. APLICAR LAS MODIFICACIONES
// ========================================================

for (const name of names) {

    const target = path.join(root, name);

    fs.writeFileSync(
        target,
        files[name],
        "utf8"
    );

    console.log(
        "✅ MODIFICADO:",
        name
    );
}

console.log(
    "\n============================================"
);

console.log(
    "VENTAS PLUS: INTEGRACIÓN COMPLETADA"
);

console.log(
    "============================================"
);

console.log(
    "Los seis archivos tienen respaldo .bak."
);

console.log(
    "No se modificó ninguna tabla de Supabase."
);

console.log(
    "Prueba los formularios y PDF antes del despliegue."
);
