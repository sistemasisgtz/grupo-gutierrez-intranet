
'use strict';

/*
 GRUPO GUTIÉRREZ · YO / RECIBOS · FIX V5

 Ejecutar:
 node fix-recibos-yo-v5.cjs

 Sin .bak, sin dependencias externas,
 sin cambios de SQL.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();

const script = path.join(
  root,
  'js',
  'gg-payroll-yo-archive.js'
);

const html = path.join(root, 'yo.html');

// ==========================================
// VALIDAR ARCHIVOS
// ==========================================

for (const file of [script, html]) {
  if (!fs.existsSync(file)) {
    throw Error(
      'No encontré ' +
      path.relative(root, file) +
      '. Ejecuta desde desarrollo grupo.'
    );
  }
}

const oldJS = fs.readFileSync(
  script,
  'utf8'
);

const oldHTML = fs.readFileSync(
  html,
  'utf8'
);

if (
  !oldJS.includes('GG_NOMINA_ARCHIVE_V1') ||
  !oldJS.includes('gg-payroll-download')
) {
  throw Error(
    'El archivo de recibos de YO no coincide ' +
    'con el esperado. Sin cambios.'
  );
}

if (
  !oldHTML.includes(
    'gg-payroll-yo-archive.js'
  )
) {
  throw Error(
    'No encontré el script del historial ' +
    'en yo.html. Sin cambios.'
  );
}

// Evitar aplicación duplicada.

if (
  oldJS.includes(
    'GG_NOMINA_VALIDACION_V5'
  )
) {
  console.log(
    '✓ El FIX V5 ya estaba instalado.'
  );

  process.exit(0);
}

// ==========================================
// LOCALIZAR VALIDACIÓN ANTERIOR
// ==========================================

const method = oldJS.indexOf(
  'async function openPDF('
);

const start = oldJS.indexOf(
  '    const token = session();',
  method
);

const end = oldJS.indexOf(
  '    // Abrir pestaña desde el clic del usuario.',
  start
);

if (
  method < 0 ||
  start < method ||
  end < start ||
  !oldJS.slice(start, end).includes(
    'Sesión o recibo inválido'
  )
) {
  throw Error(
    'La validación actual de YO cambió. ' +
    'No se modificó ningún archivo.'
  );
}

// ==========================================
// NUEVA VALIDACIÓN V5
// ==========================================

const validation = String.raw`
    // GG_NOMINA_VALIDACION_V5

    // Nunca se usa el nombre del empleado
    // para autorizar descargas.
    // El servidor valida al destinatario.

    const rawToken = session();

    const token =
      typeof rawToken === 'string'
        ? rawToken.trim()
        : '';

    // 1. VALIDAR SESIÓN

    if (!token) {
      notice(
        'YO no encontró una sesión activa. ' +
        'Vuelve a iniciar sesión desde la intranet.'
      );

      return;
    }

    if (token.length < 16) {
      notice(
        'La sesión de YO tiene un formato ' +
        'incompleto. Cierra sesión y vuelve a entrar.'
      );

      console.warn(
        '[YO RECIBOS] Token corto; longitud:',
        token.length
      );

      return;
    }

    // 2. VALIDAR RECIBO

    const originalId =
      receipt?.id ??
      receipt?.document_id ??
      receipt?.payroll_document_id;

    const documentId =
      String(originalId ?? '').trim();

    if (!uuid.test(documentId)) {

      // Mostrar únicamente información técnica.
      // No imprimir tokens ni documentos.

      console.warn(
        '[YO RECIBOS] ID no válido:',
        {
          presente: !!documentId,
          longitud: documentId.length,
          tipo: typeof originalId
        }
      );

      notice(
        'El historial recibió un recibo sin ' +
        'identificador válido. ' +
        'Actualizando la lista; vuelve a pulsar ' +
        'Abrir PDF. Si persiste, revisaremos ' +
        'el campo id de gg_payroll_yo_list.'
      );

      try {
        await fetchList();
      } catch (_) {
        // Ya se muestra un aviso.
      }

      return;
    }

`;

let nextJS =
  oldJS.slice(0, start) +
  validation +
  oldJS.slice(end);

// ==========================================
// ACTUALIZAR LA SOLICITUD DEL PDF
// ==========================================

const requestPattern =
  /session_token\s*:\s*token\s*,\s*document_id\s*:\s*receipt\.id\b/g;

const found =
  nextJS.match(requestPattern) || [];

if (found.length !== 1) {
  throw Error(
    'No encontré una única solicitud de PDF ' +
    'para ajustar. Sin cambios.'
  );
}

nextJS = nextJS.replace(
  requestPattern,
  'session_token: token,\n' +
  '              document_id: documentId'
);

// ==========================================
// ACTUALIZAR VERSIÓN DEL SCRIPT
// ==========================================

const versionPattern =
  /gg-payroll-yo-archive\.js\?v=\d+/g;

const versions =
  oldHTML.match(versionPattern) || [];

if (versions.length !== 1) {
  throw Error(
    'No encontré una única referencia ' +
    'versionada al historial. Sin cambios.'
  );
}

const nextHTML = oldHTML.replace(
  versionPattern,
  'gg-payroll-yo-archive.js?v=5'
);

// ==========================================
// VALIDAR JAVASCRIPT
// ==========================================

new vm.Script(nextJS, {
  filename: 'gg-payroll-yo-archive.js'
});

// ==========================================
// GUARDADO CON RECUPERACIÓN EN MEMORIA
// ==========================================

const updates = [
  [script, oldJS, nextJS],
  [html, oldHTML, nextHTML]
];

const touched = [];

try {
  for (const [file, before, after] of updates) {
    if (before === after) continue;

    touched.push([file, before]);

    fs.writeFileSync(
      file,
      after,
      'utf8'
    );
  }
} catch (error) {

  for (const [file, before] of touched.reverse()) {
    try {
      fs.writeFileSync(
        file,
        before,
        'utf8'
      );
    } catch (restoreError) {
      console.error(
        'No pude restaurar',
        file,
        restoreError.message
      );
    }
  }

  throw error;
}

// ==========================================
// RESULTADO
// ==========================================

console.log(
  '\n✓ YO: validación de sesión y recibo separadas.'
);

console.log(
  '✓ Admite id/document_id y espacios accidentales.'
);

console.log(
  '✓ Refresca la lista si llega un ID incorrecto.'
);

console.log(
  '✓ Sin SQL ni redespliegue de Edge Functions.'
);

console.log(
  '✓ Sin respaldos .bak.'
);

console.log(
  '\nRecarga YO con Ctrl+F5.'
);
