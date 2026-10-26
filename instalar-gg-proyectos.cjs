
'use strict';

// ====================================================
// GRUPO GUTIÉRREZ
// INSTALADOR - CONTROL FINANCIERO / PROYECTOS
//
// Ejecutar en la raíz del proyecto.
// ANTES crear los archivos JS y CSS indicados.
//
// Modifica solo control-financiero.html.
// Genera respaldo automático.
// No duplica instalaciones.
// ====================================================

const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;

const htmlFile = path.join(
    root,
    'control-financiero.html'
);

const jsFile = path.join(
    root,
    'js',
    'control-financiero-proyectos.js'
);

const cssFile = path.join(
    root,
    'css',
    'control-financiero-proyectos.css'
);

const MARK =
    'GG_CF_PROYECTOS_20261026';

// ====================================================
// 1. VALIDAR ARCHIVOS
// ====================================================

for (const file of [
    htmlFile,
    jsFile,
    cssFile
]) {

    if (!fs.existsSync(file)) {

        throw Error(
            'Falta archivo: ' +
            path.relative(root, file)
        );
    }
}

// Validar sintaxis del JavaScript nuevo.

require('node:vm').runInNewContext(
    'new Function(' +
    JSON.stringify(
        fs.readFileSync(jsFile, 'utf8')
    ) +
    ')'
);

// Leer HTML original.

const old = fs.readFileSync(
    htmlFile,
    'utf8'
);

if (old.includes(MARK)) {

    throw Error(
        'La pestaña Proyectos ya está instalada. ' +
        'No modifiqué nada.'
    );
}

// Conservar saltos de línea de Windows.

const nl = old.includes('\r\n')
    ? '\r\n'
    : '\n';

let html = old.replace(
    /\r\n/g,
    '\n'
);

// ====================================================
// 2. REEMPLAZO CONTROLADO
// ====================================================

function replaceOnce(
    re,
    replacement,
    label
) {

    const matches = [
        ...html.matchAll(
            new RegExp(
                re.source,
                re.flags.includes('g')
                    ? re.flags
                    : re.flags + 'g'
            )
        )
    ];

    if (matches.length !== 1) {

        throw Error(
            label +
            ': esperaba 1 ancla, encontré ' +
            matches.length +
            '. No modifiqué nada.'
        );
    }

    html = html.replace(
        re,
        replacement
    );
}

// ====================================================
// 3. NUEVO BOTÓN DE PESTAÑA
// ====================================================

replaceOnce(

    /<\/nav>\s*<!--\s*=+\s*SOLICITUDES/,

    `
    <button
        type="button"
        class="finance-tab"
        data-finance-tab="proyectos"
    >
        <span class="finance-tab-dot"></span>
        Proyectos
    </button>

    </nav>

    <!-- =========================================
         SOLICITUDES
    `,

    'Menú de pestañas'
);

// ====================================================
// 4. HTML COMPLETO DEL MÓDULO
// ====================================================

const panel = `

<!-- ${MARK} -->

<section
    class="finance-panel ggp"
    data-finance-panel="proyectos"
>

    <div class="ggp-hero">

        <div>

            <span class="ggp-eyebrow">
                CONCILIACIÓN · GRUPO GUTIÉRREZ × INGENIERÍA LO
            </span>

            <h2>
                Control de Proyectos
            </h2>

            <p>
                Solicitudes efectivamente pagadas contra
                gasto real de LO. Cruce por folio definitivo
                de Administración, sin crear relaciones
                entre solicitudes y proyectos.
            </p>

        </div>

        <div class="ggp-hero-actions">

            <button
                type="button"
                class="ggp-button"
                id="ggProjReload"
            >
                ↻ Sincronizar
            </button>

            <button
                type="button"
                class="ggp-button primary"
                id="ggProjExcel"
            >
                ↓ Excel filtrado
            </button>

        </div>

    </div>

    <div class="ggp-legend">

        <span>
            <i class="ggp-dot"></i>
            Control Financiero / Pagos
        </span>

        <span>
            <i class="ggp-dot lo"></i>
            Ingeniería LO / Gasto real
        </span>

        <span>
            <i class="ggp-dot diff"></i>
            Diferencia detectada (ambos importes)
        </span>

    </div>

    <div
        class="ggp-stats"
        id="ggProjStats"
    ></div>

    <section class="ggp-filter-panel">

        <div class="ggp-filter-title">
            ⌕ Explorar, conciliar y filtrar
        </div>

        <div class="ggp-filters">

            <label>
                Buscar proyecto, folio o factura

                <input
                    id="ggProjSearch"
                    type="search"
                    placeholder="Buscar…"
                >
            </label>

            <label>
                Estatus del proyecto

                <select id="ggProjStatus">
                    <option value="">
                        Todos los estatus
                    </option>

                    <option>Proceso</option>
                    <option>Remisionado</option>
                    <option>Terminado</option>
                </select>
            </label>

            <label>
                Año de PAGO

                <select id="ggProjYear">
                    <option value="">
                        Todos los años
                    </option>
                </select>
            </label>

            <label>
                Mes de PAGO

                <select id="ggProjMonth">
                    <option value="">
                        Todos los meses
                    </option>
                </select>
            </label>

            <label>
                Pago desde

                <input
                    id="ggProjFrom"
                    type="date"
                >
            </label>

            <label>
                Pago hasta

                <input
                    id="ggProjTo"
                    type="date"
                >
            </label>

            <label>
                Actividad de pago

                <select id="ggProjMovement">

                    <option value="">
                        Con y sin pagos
                    </option>

                    <option value="yes">
                        Con pagos
                    </option>

                    <option value="no">
                        Sin pagos
                    </option>

                </select>
            </label>

            <label>
                Conciliación

                <select id="ggProjReconcile">

                    <option value="">
                        Todos
                    </option>

                    <option value="diff">
                        Con diferencias
                    </option>

                    <option value="ok">
                        Sin diferencias
                    </option>

                    <option value="unmapped">
                        Campos o rubros por revisar
                    </option>

                </select>
            </label>

            <label>
                Ordenar

                <select id="ggProjSort">

                    <option value="">
                        Folio
                    </option>

                    <option value="total">
                        Mayor monto pagado
                    </option>

                    <option value="balance">
                        Menor saldo
                    </option>

                    <option value="difference">
                        Diferencias primero
                    </option>

                    <option value="recent">
                        Alta en Administración (reciente)
                    </option>

                </select>
            </label>

        </div>

        <div class="ggp-filter-bottom">

            <span id="ggProjLastSync">
                Aún sin sincronizar
            </span>

            <button
                type="button"
                class="ggp-button"
                id="ggProjClear"
            >
                Limpiar filtros
            </button>

        </div>

    </section>

    <div
        class="ggp-inline-note"
        id="ggProjMessage"
    >
        Abre esta pestaña para sincronizar los datos.
    </div>

    <section class="ggp-table-surface">

        <div class="ggp-table-head">

            <div>

                <strong>
                    Comparativo por folio definitivo
                </strong>

                <small>
                    Haz clic en una fila para ver los pagos
                    confirmados de ese proyecto.
                </small>

            </div>

            <strong id="ggProjCount">
                —
            </strong>

        </div>

        <div
            class="ggp-scroll"
            id="ggProjTable"
        >

            <div class="ggp-noresults">
                Cargando módulo…
            </div>

        </div>

    </section>

</section>

`;

// ====================================================
// 5. INSERTAR PANEL ANTES DE CERRAR CONTENIDO
// ====================================================

replaceOnce(

    /(\s*)<\/section>\s*<\/div>\s*<footer class="finance-footer">/,

    `
${panel}
            </section>
        </div>

        <footer class="finance-footer">`,

    'Contenido de pestañas'
);

// ====================================================
// 6. CARGAR CSS
// ====================================================

replaceOnce(

    /<link rel="stylesheet" href="css\/finanzas-ajustes\.css">/,

    `
<link rel="stylesheet" href="css/finanzas-ajustes.css">

<link
    rel="stylesheet"
    href="css/control-financiero-proyectos.css"
>`,

    'Import CSS'
);

// ====================================================
// 7. CARGAR JAVASCRIPT
// ====================================================

replaceOnce(

    /<script src="js\/finanzas-graficas-fix\.js"><\/script>/,

    `
<script src="js/finanzas-graficas-fix.js"></script>

<script src="js/control-financiero-proyectos.js"></script>`,

    'Import JS'
);

// ====================================================
// 8. VALIDACIÓN FINAL
// ====================================================

if (
    !html.includes(MARK) ||
    !html.includes(
        'data-finance-panel="proyectos"'
    ) ||
    !html.includes(
        'data-finance-tab="proyectos"'
    )
) {

    throw Error(
        'Validación final HTML falló; no se modificó nada.'
    );
}

// ====================================================
// 9. RESPALDO
// ====================================================

const backup =
    htmlFile +
    '.' +
    new Date()
        .toISOString()
        .replace(/[:.]/g, '-') +
    '.bak';

fs.writeFileSync(
    backup,
    old,
    {
        flag: 'wx'
    }
);

// ====================================================
// 10. ESCRIBIR DE FORMA ATÓMICA
// ====================================================

const temporary =
    htmlFile + '.tmp-gg-proyectos';

try {

    fs.writeFileSync(
        temporary,
        html.replace(/\n/g, nl),
        {
            flag: 'wx'
        }
    );

    fs.renameSync(
        temporary,
        htmlFile
    );

} catch (e) {

    if (fs.existsSync(temporary)) {
        fs.unlinkSync(temporary);
    }

    throw e;
}

// ====================================================
// 11. RESULTADO
// ====================================================

console.log(
    '✅ Proyectos instalado en Control Financiero.'
);

console.log(
    '✅ Respaldo: ' +
    path.basename(backup)
);

console.log(
    '✅ Solo cambió control-financiero.html.'
);

console.log(
    '✅ Sin tocar Solicitudes ni Ingeniería LO.'
);

console.log(
    'Recarga con Ctrl+Shift+R; abre Control Financiero > Proyectos.'
);
