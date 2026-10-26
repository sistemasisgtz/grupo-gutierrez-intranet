
'use strict';

// =====================================================
// GRUPO GUTIÉRREZ
// CONTROL FINANCIERO - AJUSTES PROYECTOS V2
//
// Ejecutar junto a control-financiero.html,
// DESPUÉS de ejecutar el SQL indicado.
//
// - Materiales = todo pago que no sea MO
// - Eliminar cotización manual
// - Estatus administrativo directo desde LO
// - Solicitudes: filtro Con proyecto Sí/No
//
// Respaldos, validaciones y rollback.
// =====================================================

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;

const MARK = 'GG_CF_AJUSTES_20261026_V2';

const HTML = 'control-financiero.html';

const PROJECTS =
  'js/control-financiero-proyectos.js';

const REQUESTS =
  'js/control-financiero-solicitudes.js';

const CSS =
  'css/control-financiero-proyectos.css';

const targets = [
  HTML,
  PROJECTS,
  REQUESTS,
  CSS
];

if (!fs.existsSync(path.join(root, HTML))) {

  throw Error(
    'Coloca este .cjs en la raíz de Grupo Gutiérrez.'
  );

}

const original = new Map();
const modified = new Map();

// =====================================================
// 1. REVISAR ARCHIVOS
// =====================================================

for (const file of targets) {

  const full = path.join(root, file);

  if (!fs.existsSync(full)) {

    throw Error(
      'No existe: ' + file
    );

  }

  const content =
    fs.readFileSync(full, 'utf8');

  if (content.includes(MARK)) {

    throw Error(
      'Ya se instaló: ' + file
    );

  }

  original.set(file, content);

  modified.set(
    file,
    content.replace(/\r\n/g, '\n')
  );

}

// =====================================================
// 2. REEMPLAZOS VALIDADOS
// =====================================================

function change(
  file,
  description,
  regex,
  replacement
) {

  const source =
    modified.get(file);

  const flags =
    regex.flags.includes('g')
      ? regex.flags
      : regex.flags + 'g';

  const hits = [
    ...source.matchAll(
      new RegExp(regex.source, flags)
    )
  ];

  if (hits.length !== 1) {

    throw Error(
      `${description}: esperaba 1 coincidencia ` +
      `en ${file}; encontré ${hits.length}. ` +
      'No se modificó nada.'
    );

  }

  const next =
    source.replace(
      regex,
      replacement
    );

  if (next === source) {

    throw Error(
      'No se aplicó: ' + description
    );

  }

  modified.set(file, next);

}

// =====================================================
// 3. PROYECTOS
// TODO LO QUE NO SEA MO ES MATERIALES
// =====================================================

change(
  PROJECTS,

  'Incluir pagos no-MO en Materiales',

  /return\s+['"]otros['"];\s*\n\s*}/,

  "return 'materiales';\n  }"
);

// Ya no habrá pagos sin clasificar.
// Todos estarán en MO o Materiales.

change(
  PROJECTS,

  'Eliminar bolsa de pagos sin clasificar',

  /const others\s*=\s*requests\.filter\(\s*r\s*=>\s*categoryOf\(r\)\s*===\s*['"]otros['"]\s*\);/,

  'const others = [];'
);

// =====================================================
// 4. ELIMINAR COTIZACIÓN MANUAL
// =====================================================

change(
  PROJECTS,

  'Eliminar cálculo de cotización manual',

  /\s*const quote\s*=\s*p\.quote_manual\s*==\s*null\s*\?\s*null\s*:\s*number\(p\.quote_manual\);/,

  '\n'
);

change(
  PROJECTS,

  'Eliminar comparación de cotización manual',

  /quote:\s*quote\s*!=\s*null\s*&&\s*quoteLo\s*!=\s*null\s*&&\s*Math\.abs\(quote\s*-\s*quoteLo\)\s*>\s*\.01/,

  'quote: false'
);

change(
  PROJECTS,

  'Eliminar cotización manual del cálculo',

  /\n\s{6}quote,\s*\n/,

  '\n'
);

change(
  PROJECTS,

  'Quitar cotización manual de tabla',

  /\$\{cell\(p\.quote,\s*d\.quote\)\}\s*/,

  ''
);

// Conservar la cotización LO sin compararla
// con un campo manual que ya no existirá.

change(
  PROJECTS,

  'Conservar Cotización Proyecto LO',

  /cell\(p\.quoteLo,\s*d\.quote,\s*['"]ggp-lo['"]\)/,

  "cell(p.quoteLo, false, 'ggp-lo')"
);

change(
  PROJECTS,

  'Quitar encabezado de cotización manual',

  /<th>Cotización proyecto<\/th>\s*/,

  ''
);

// Filtro de campos pendientes:
// ya no considera la cotización manual.

change(
  PROJECTS,

  'Actualizar filtro de campos pendientes',

  /p\.others\.length\s*\|\|\s*p\.investment\s*==\s*null\s*\|\|\s*p\.quote\s*==\s*null/,

  'p.investment == null'
);

// =====================================================
// 5. POPUP DE EDICIÓN
// SOLAMENTE FACTURA E INVERSIÓN
// =====================================================

change(
  PROJECTS,

  'Quitar Cotización del popup',

  /\s*<label>\s*Cotización proyecto\s*\(\$\)[\s\S]*?<\/label>/,

  ''
);

change(
  PROJECTS,

  'Quitar Estatus del popup',

  /\s*<label>\s*Estatus proyecto[\s\S]*?<\/label>/,

  ''
);

change(
  PROJECTS,

  'Quitar lectura de cotización manual',

  /\s*const quote\s*=\s*parse\(['"]quote['"]\);/,

  ''
);

change(
  PROJECTS,

  'Validar solamente inversión autorizada',

  /\[investment,\s*quote\]\.some\(/,

  '[investment].some('
);

// Utilizar el RPC nuevo sin los campos retirados.

change(
  PROJECTS,

  'Nueva función para guardar campos manuales',

  /['"]gg_cf_project_save['"]\s*,/,

  "'gg_cf_project_save_v2',"
);

change(
  PROJECTS,

  'Guardar únicamente inversión y factura',

  /p_authorized_investment:\s*investment,\s*p_quote_manual:\s*quote,\s*p_project_status:\s*form\.elements\.status\.value/,

  'p_authorized_investment: investment'
);

// =====================================================
// 6. EXCEL SIN COTIZACIÓN MANUAL
// =====================================================

change(
  PROJECTS,

  'Quitar cotización manual del Excel',

  /\s*['"]Cotización proyecto['"]:\s*p\.quote\s*\?\?\s*['"]['"],/,

  ''
);

// =====================================================
// 7. ESTATUS ADMINISTRATIVO DE LO
// =====================================================

// Reconocer valores reales de Ingeniería LO.

change(
  PROJECTS,

  'Reconocer TERMINADO de LO',

  /p\.project_status\s*===\s*['"]Terminado['"]/,

  "normalized(p.project_status) === 'TERMINADO'"
);

change(
  PROJECTS,

  'Reconocer REMISION de LO',

  /p\.project_status\s*===\s*['"]Remisionado['"]/,

  "normalized(p.project_status) === 'REMISION'"
);

// Etiqueta en el popup de pagos.

change(
  PROJECTS,

  'Clasificación Materiales y otros',

  /['"]Materiales\/Subcontratos['"]/,

  "'Materiales / otros'"
);

// Al sincronizar, consultar el estatus de LO.
// El campo manual histórico ya no determina
// lo que aparece en la tabla.

change(
  PROJECTS,

  'Consultar estatus administrativo desde LO',

  /snapshot\s*=\s*data\s*;/,

  `const { data: loStatuses, error: loStatusError } =
        await fin.db.rpc('gg_cf_project_status_map');

      if (loStatusError) {
        throw loStatusError;
      }

      const statusByFolio = new Map(
        (loStatuses || []).map(item => [
          key(item.folio),
          item.administrative_status || 'SIN ESTATUS'
        ])
      );

      snapshot = {
        ...data,

        projects: data.projects.map(project => ({
          ...project,

          project_status:
            statusByFolio.get(key(project.folio))
            || 'SIN ESTATUS'
        }))
      };`
);

// =====================================================
// 8. FILTROS DE ESTATUS EN PROYECTOS
// =====================================================

change(
  HTML,

  'Opciones reales del Estatus Administrativo LO',

  /<select\s+id="ggProjStatus">[\s\S]*?<\/select>/,

  `<select id="ggProjStatus">

    <option value="">
      Todos los estatus LO
    </option>

    <option value="EN PROCESO">
      EN PROCESO
    </option>

    <option value="TERMINADO">
      TERMINADO
    </option>

    <option value="FAVOR">
      FAVOR
    </option>

    <option value="PENDIENTE POR ADMINISTRACION">
      PENDIENTE POR ADMINISTRACION
    </option>

    <option value="REMISION">
      REMISION
    </option>

    <option value="CANCELADO">
      CANCELADO
    </option>

    <option value="SIN ESTATUS">
      SIN ESTATUS
    </option>

  </select>`
);

// =====================================================
// 9. SOLICITUDES
// NUEVO FILTRO CON PROYECTO: TODOS / SÍ / NO
// =====================================================

change(
  HTML,

  'Agregar filtro de proyecto asignado',

  /<select\s+id="financeRequestPaidFilter">/,

  `<select
      id="financeRequestProjectFilter"
      aria-label="Con proyecto asignado"
  >

    <option value="">
      Con proyecto: Todos
    </option>

    <option value="yes">
      Con proyecto: Sí
    </option>

    <option value="no">
      Con proyecto: No
    </option>

  </select>

  <select id="financeRequestPaidFilter">`
);

// =====================================================
// 10. CONECTAR FILTRO A LA LÓGICA DE SOLICITUDES
// =====================================================

change(
  REQUESTS,

  'Escuchar cambios del nuevo filtro',

  /["']financeRequestPaidFilter["']\s*,/,

  `"financeRequestPaidFilter",
            "financeRequestProjectFilter",`
);

// Leer el valor seleccionado.

change(
  REQUESTS,

  'Leer filtro de proyecto asignado',

  /(const paid\s*=\s*value\(\s*["']financeRequestPaidFilter["']\s*\);)/,

  `$1

        const assigned =
            value("financeRequestProjectFilter");`
);

// Insertar en el filtro real que también utiliza Excel.

change(
  REQUESTS,

  'Filtrar solicitudes con proyecto Sí/No',

  /return state\.requests\.filter\(\s*request\s*=>\s*\{/,

  `return state.requests.filter(request => {

            const hasProject =
                typeof request.project === 'string' &&
                request.project.trim().length > 0;

            if (
                assigned === 'yes' &&
                !hasProject
            ) {
                return false;
            }

            if (
                assigned === 'no' &&
                hasProject
            ) {
                return false;
            }
`
);

// =====================================================
// 11. ESTILOS COMPLEMENTARIOS
// CONSERVAMOS TU CSS PREMIUM ORIGINAL
// =====================================================

modified.set(

  CSS,

  modified.get(CSS) + `

/* =================================================
   ${MARK}
   AJUSTES DE ESTATUS Y FILTRO PROYECTOS
================================================= */

.ggp-table .ggp-status.is-finished {

  background: #214d3c;

  border-color: #4b916f;

  color: #b9f4ce;

}

.ggp-table .ggp-status.is-billed {

  background: #483565;

  border-color: #8062a6;

  color: #e7d2ff;

}

.finance-toolbar #financeRequestProjectFilter {

  min-width: 155px;

}
`
);

// =====================================================
// 12. MARCAS CONTRA INSTALACIÓN DUPLICADA
// =====================================================

modified.set(

  PROJECTS,

  modified.get(PROJECTS) +
  '\n// ' + MARK + '\n'

);

modified.set(

  REQUESTS,

  modified.get(REQUESTS) +
  '\n// ' + MARK + '\n'

);

modified.set(

  HTML,

  modified.get(HTML).replace(

    '</body>',

    `<!-- ${MARK} -->
</body>`

  )

);

// =====================================================
// 13. VALIDACIONES DE JAVASCRIPT
// =====================================================

for (const file of [
  PROJECTS,
  REQUESTS
]) {

  new vm.Script(
    modified.get(file),
    {
      filename: file
    }
  );

}

// Confirmar que las integraciones fundamentales
// están presentes antes de escribir.

if (

  !modified.get(PROJECTS).includes(
    'gg_cf_project_save_v2'
  )

  ||

  !modified.get(PROJECTS).includes(
    'gg_cf_project_status_map'
  )

  ||

  !modified.get(REQUESTS).includes(
    'financeRequestProjectFilter'
  )

  ||

  !modified.get(HTML).includes(
    'financeRequestProjectFilter'
  )

) {

  throw Error(
    'Validación de integridad falló. ' +
    'No se escribió ningún archivo.'
  );

}

// =====================================================
// 14. CREAR RESPALDOS
// =====================================================

const stamp =
  new Date()
    .toISOString()
    .replace(/[:.]/g, '-');

const backupDir =
  path.join(
    root,
    'respaldos-gg-proyectos-ajustes-' +
    stamp
  );

const written = [];

try {

  fs.mkdirSync(
    backupDir,
    {
      recursive: true
    }
  );

  // Respaldar los cuatro archivos ANTES
  // de modificar cualquiera.

  for (const file of targets) {

    const backupFile =
      path.join(
        backupDir,
        file + '.bak'
      );

    fs.mkdirSync(
      path.dirname(backupFile),
      {
        recursive: true
      }
    );

    fs.writeFileSync(
      backupFile,
      original.get(file),
      {
        flag: 'wx'
      }
    );

  }

  // Aplicar código validado.

  for (const file of targets) {

    const oldText =
      original.get(file);

    const ending =
      oldText.includes('\r\n')
        ? '\r\n'
        : '\n';

    const newText =
      modified.get(file)
        .replace(/\n/g, ending);

    fs.writeFileSync(
      path.join(root, file),
      newText,
      'utf8'
    );

    written.push(file);

  }

} catch (error) {

  // Restaurar cualquier archivo que
  // esta ejecución haya alcanzado a cambiar.

  for (const file of written.reverse()) {

    try {

      fs.writeFileSync(
        path.join(root, file),
        original.get(file),
        'utf8'
      );

    } catch (rollbackError) {

      console.error(
        'ERROR RESTAURANDO',
        file,
        rollbackError.message
      );

    }

  }

  throw error;

}

// =====================================================
// 15. TERMINADO
// =====================================================

console.log(
  '\n✅ Ajustes de Control Financiero instalados.'
);

console.log(
  '✅ Materiales = pagos no clasificados como MO.'
);

console.log(
  '✅ Solo Cotización Proyecto LO.'
);

console.log(
  '✅ Estatus Administrativo LO sincronizado.'
);

console.log(
  '✅ Solicitudes: filtro Con proyecto Sí/No.'
);

console.log(
  '✅ El Excel respeta el nuevo filtro.'
);

console.log(
  '✅ Respaldos:',
  path.basename(backupDir)
);

console.log(
  '\nRecarga el navegador con Ctrl + Shift + R.'
);
