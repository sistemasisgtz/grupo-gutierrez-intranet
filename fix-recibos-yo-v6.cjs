
'use strict';

/*
 GRUPO GUTIÉRREZ — NÓMINA YO — FIX V6

 Requiere ejecutar primero el SQL:
 gg_payroll_yo_archive_v6

 Ejecutar desde la raíz:
 node fix-recibos-yo-v6.cjs

 Sin .bak, sin dependencias externas.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();

const jsName = 'js/gg-payroll-yo-archive.js';
const htmlName = 'yo.html';

const jsPath = path.join(root, jsName);
const htmlPath = path.join(root, htmlName);

// =============================================
// VALIDAR ARCHIVOS
// =============================================

for (const file of [jsPath, htmlPath]) {
  if (!fs.existsSync(file)) {
    throw new Error(
      'Falta ' +
      path.relative(root, file) +
      '. Ejecuta el fix desde desarrollo grupo.'
    );
  }
}

const oldJS = fs.readFileSync(
  jsPath,
  'utf8'
);

const oldHTML = fs.readFileSync(
  htmlPath,
  'utf8'
);

if (
  !oldJS.includes('GG_NOMINA_ARCHIVE_V1') ||
  !oldJS.includes('GG_NOMINA_VALIDACION_V5') ||
  !oldJS.includes('gg-payroll-download')
) {
  throw new Error(
    'El historial de YO no coincide ' +
    'con las versiones V1/V5. ' +
    'No modifico archivos.'
  );
}

// SEGUNDA EJECUCIÓN SEGURA
if (
  oldJS.includes(
    'GG_PAYROLL_ARCHIVE_CANONICAL_ID_V6'
  )
) {
  console.log(
    '✓ Fix V6 ya instalado. Ningún cambio.'
  );

  process.exit(0);
}

// =============================================
// LOCALIZAR CONSULTA ACTUAL
// =============================================

const call =
  /db\.rpc\(\s*(['"])gg_payroll_yo_list\1\s*,/g;

const callMatches = [
  ...oldJS.matchAll(call)
];

if (callMatches.length !== 1) {
  throw new Error(
    'No encontré una única consulta ' +
    'al historial. Sin cambios. ' +
    'Coincidencias: ' + callMatches.length
  );
}

// =============================================
// LOCALIZAR VALIDACIÓN V5
// =============================================

const idExpr =
  /const\s+originalId\s*=\s*receipt\?\.id\s*\?\?\s*receipt\?\.document_id\s*\?\?\s*receipt\?\.payroll_document_id\s*;/g;

const idMatches = [
  ...oldJS.matchAll(idExpr)
];

if (idMatches.length !== 1) {
  throw new Error(
    'No encontré la validación de ID V5. ' +
    'Sin cambios. Coincidencias: ' +
    idMatches.length
  );
}

// =============================================
// USAR NUEVA CONSULTA SQL SEGURA
// =============================================

let nextJS = oldJS.replace(
  call,
  '/* GG_PAYROLL_ARCHIVE_CANONICAL_ID_V6 */\n' +
  "        db.rpc(\n" +
  "          'gg_payroll_yo_archive_v6',"
);

// Priorizar el identificador explícito
// document_id de la nueva función SQL.

nextJS = nextJS.replace(
  idExpr,

  'const originalId =\n' +
  '      receipt?.document_id ??\n' +
  '      receipt?.id ??\n' +
  '      receipt?.payroll_document_id;'
);

// =============================================
// ACTUALIZAR CACHÉ DE YO
// =============================================

const version =
  /gg-payroll-yo-archive\.js\?v=\d+/g;

const versions = [
  ...oldHTML.matchAll(version)
];

if (versions.length !== 1) {
  throw new Error(
    'No encontré una única referencia ' +
    'versionada en yo.html. Sin cambios.'
  );
}

const nextHTML = oldHTML.replace(
  version,
  'gg-payroll-yo-archive.js?v=6'
);

// =============================================
// VALIDAR JAVASCRIPT
// =============================================

new vm.Script(nextJS, {
  filename: jsName
});

if (
  !nextJS.includes(
    "'gg_payroll_yo_archive_v6'"
  )
) {
  throw new Error(
    'Falló la validación de la nueva consulta.'
  );
}

// =============================================
// ESCRITURA Y RECUPERACIÓN
// =============================================

const writes = [
  [
    jsPath,
    Buffer.from(oldJS, 'utf8'),
    Buffer.from(nextJS, 'utf8')
  ],
  [
    htmlPath,
    Buffer.from(oldHTML, 'utf8'),
    Buffer.from(nextHTML, 'utf8')
  ]
];

const written = [];

try {
  for (const [file, before, after] of writes) {
    if (before.equals(after)) continue;

    written.push([
      file,
      before
    ]);

    fs.writeFileSync(file, after);
  }

} catch (error) {
  for (const [file, before] of written.reverse()) {
    try {
      fs.writeFileSync(file, before);
    } catch (restoreError) {
      console.error(
        'No se pudo restaurar',
        file,
        restoreError.message
      );
    }
  }

  throw error;
}

// =============================================
// RESULTADO
// =============================================

console.log(
  '\n✓ FIX V6: historial conectado ' +
  'al ID real de los PDF.'
);

console.log(
  '✓ Prioridad a document_id, ' +
  'sin perder compatibilidad con id.'
);

console.log(
  '✓ Campanita y otros módulos intactos.'
);

console.log(
  '✓ No se creó ningún respaldo .bak.'
);

console.log(
  '✓ Recarga YO con Ctrl + F5.'
);
