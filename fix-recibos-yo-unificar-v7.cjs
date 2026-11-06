
'use strict';

/*
 GRUPO GUTIÉRREZ — NÓMINA YO V7
 Unifica la campanita y el archivo permanente.

 Ejecutar:
 node fix-recibos-yo-unificar-v7.cjs

 Sin SQL, sin backups y sin dependencias externas.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = process.cwd();

const files = {
  bell: 'js/gg-payroll-yo.js',
  archive: 'js/gg-payroll-yo-archive.js',
  html: 'yo.html'
};

const abs = p => path.join(ROOT, p);
const current = {};

for (const [key, name] of Object.entries(files)) {
  if (!fs.existsSync(abs(name))) {
    throw Error(
      'No encontré ' + name +
      '. Ejecuta desde desarrollo grupo.'
    );
  }

  current[key] = fs.readFileSync(
    abs(name),
    'utf8'
  );
}

// =============================================
// 1. COMPARTIR LAS FUNCIONES DE LA CAMPANITA
// =============================================

let bell = current.bell;

const marker =
  'GG_PAYROLL_YO_SHARED_BRIDGE_V7';

if (!bell.includes(marker)) {

  for (const expression of [
    /\blet\s+receipts\s*=\s*\[\s*\]/,
    /\basync\s+function\s+refresh\s*\(/,
    /\basync\s+function\s+openReceipt\s*\(/
  ]) {

    if (!expression.test(bell)) {
      throw Error(
        'La campanita tiene otra versión. ' +
        'No modifiqué nada: ' + expression
      );
    }
  }

  const close = /\}\)\(\);\s*$/;

  if (!close.test(bell)) {
    throw Error(
      'No pude localizar el cierre ' +
      'de la campanita. Sin cambios.'
    );
  }

  const bridge = `
/* ${marker} */

// La sección inferior utilizará exactamente
// la misma lista y el mismo abridor de PDF.

window.ggPayrollYoBridge = Object.freeze({

  list: () =>
    Array.isArray(receipts)
      ? receipts.slice()
      : [],

  refresh: () => refresh(),

  open: (receipt, button) =>
    openReceipt(receipt, button)

});
`;

  bell = bell.replace(
    close,
    bridge + '\n})();\n'
  );
}

// =============================================
// 2. VALIDAR HISTORIAL EXISTENTE
// =============================================

const oldArchive = current.archive;

if (
  !oldArchive.includes(
    'GG_NOMINA_ARCHIVE_V1'
  ) &&
  !oldArchive.includes(
    'GG_PAYROLL_YO_ARCHIVE_UNIFIED_V7'
  )
) {

  throw Error(
    'No encontré el historial de Nómina ' +
    'conocido. Sin cambios.'
  );
}

// =============================================
// 3. NUEVO HISTORIAL UNIFICADO
// =============================================

const archive = String.raw`
/* GG_PAYROLL_YO_ARCHIVE_UNIFIED_V7 */

(() => {
  'use strict';

  if (window.__ggPayrollArchiveUnifiedV7) {
    return;
  }

  window.__ggPayrollArchiveUnifiedV7 = true;

  const $ = id =>
    document.getElementById(id);

  const bridge = () =>
    window.ggPayrollYoBridge;

  let lastSignature = null;
  let fetching = false;

  function status(message) {
    const element = $(
      'yoPayrollArchiveStatus'
    );

    if (element) {
      element.textContent = message;
    }
  }

  function date(value) {
    if (!value) return 'Sin fecha';

    const d = new Date(value);

    return Number.isNaN(d.getTime())
      ? 'Sin fecha'
      : d.toLocaleDateString(
          'es-MX',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }
        );
  }

  // =========================================
  // MISMA LISTA DE LA CAMPANITA
  // =========================================

  function items() {
    const api = bridge();

    return (
      api &&
      typeof api.list === 'function'
    )
      ? api.list()
      : [];
  }

  // =========================================
  // DIBUJAR HISTORIAL PERMANENTE
  // =========================================

  function paint(force = false) {

    const root = $(
      'yoPayrollArchiveList'
    );

    if (!root) return;

    // Recordar qué grupos están desplegados.
    const expanded = new Set(
      [
        ...root.querySelectorAll(
          'details[open]'
        )
      ].map(
        node => node.dataset.groupKey
      )
    );

    const receipts = items();

    const signature = JSON.stringify(
      receipts.map(
        r => [
          r.id,
          r.title,
          r.file_name,
          r.sent_at,
          r.read_at
        ]
      )
    );

    if (
      !force &&
      signature === lastSignature
    ) return;

    lastSignature = signature;

    root.replaceChildren();

    if (!receipts.length) {

      const empty =
        document.createElement('div');

      empty.className =
        'gg-archive-empty';

      empty.textContent =
        'Todavía no tienes recibos ' +
        'de nómina enviados.';

      root.append(empty);

      status('0 recibos disponibles.');

      return;
    }

    status(
      receipts.length +
      (
        receipts.length === 1
          ? ' recibo disponible.'
          : ' recibos disponibles.'
      )
    );

    // Agrupar por título y fecha de envío.
    const groups = new Map();

    for (const receipt of receipts) {

      const key =
        String(
          receipt.title || 'Nómina'
        ) +
        '|' +
        String(
          receipt.sent_at || ''
        ).slice(0, 10);

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(receipt);
    }

    // =======================================
    // TARJETAS DESPLEGABLES
    // =======================================

    for (
      const [key, groupItems] of groups
    ) {

      const group =
        document.createElement('details');

      group.className =
        'gg-archive-group';

      group.dataset.groupKey = key;
      group.open = expanded.has(key);

      const header =
        document.createElement('summary');

      const left =
        document.createElement('div');

      const title =
        document.createElement('strong');

      title.textContent =
        groupItems[0].title ||
        'Recibos de nómina';

      const info =
        document.createElement('small');

      info.textContent =
        date(groupItems[0].sent_at) +
        ' · ' +
        groupItems.length +
        (
          groupItems.length === 1
            ? ' documento'
            : ' documentos'
        );

      left.append(title, info);
      header.append(left);

      const body =
        document.createElement('div');

      body.className =
        'gg-archive-group-body';

      // =====================================
      // RECIBOS INDIVIDUALES
      // =====================================

      for (const receipt of groupItems) {

        const button =
          document.createElement('button');

        button.type = 'button';
        button.className =
          'gg-archive-file';

        const file =
          document.createElement('span');

        file.textContent =
          '▤ ' +
          (
            receipt.file_name ||
            'Recibo.pdf'
          );

        const action =
          document.createElement('em');

        // Clase utilizada por el abridor
        // original de la campanita.
        action.className =
          'gg-payroll-yo-action';

        action.textContent =
          receipt.read_at
            ? 'Abrir PDF ↗'
            : '● Nuevo · Abrir PDF ↗';

        button.append(
          file,
          action
        );

        // ===================================
        // MISMA APERTURA QUE LA CAMPANITA
        // ===================================

        button.addEventListener(
          'click',
          async () => {

            const api = bridge();

            if (
              !api ||
              typeof api.open !== 'function'
            ) {

              status(
                'La campanita de nómina ' +
                'no está disponible. Recarga YO.'
              );

              return;
            }

            // No se genera otra URL.
            // No se hace una nueva validación
            // de UUID diferente.
            //
            // Se ejecuta EXACTAMENTE el
            // abridor que usa la campanita.

            await api.open(
              receipt,
              button
            );

            const errorText = $(
              'ggPayrollYoFeedback'
            )?.textContent?.trim();

            if (errorText) {
              status(errorText);
            }

            paint(true);
          }
        );

        body.append(button);
      }

      group.append(
        header,
        body
      );

      root.append(group);
    }
  }

  // =========================================
  // ACTUALIZAR USANDO LA CAMPANITA
  // =========================================

  async function refresh() {

    const api = bridge();

    if (
      !api ||
      typeof api.refresh !== 'function'
    ) {

      status(
        'No se encontró la campanita ' +
        'de nómina. Recarga YO.'
      );

      return;
    }

    if (fetching) return;

    fetching = true;

    try {

      // Esta función ejecuta la consulta
      // que YA usa la campanita:
      //
      // gg_payroll_yo_list
      //
      // No utiliza la RPC adicional V6.

      await api.refresh();

      paint(true);

    } catch (error) {

      status(
        'No pudimos actualizar recibos: ' +
        (
          error.message ||
          'Error de conexión'
        )
      );

    } finally {

      fetching = false;
    }
  }

  // =========================================
  // MANTENER AMBAS VISTAS SINCRONIZADAS
  // =========================================

  function start() {

    if (!$('yoPayrollArchiveList')) {
      return;
    }

    $('yoPayrollArchiveRefresh')
      ?.addEventListener(
        'click',
        () => void refresh()
      );

    // Cuando la campanita actualiza sus
    // tarjetas, se actualiza también
    // el historial inferior.

    const bellList = $(
      'yoNotificationsList'
    );

    if (
      bellList &&
      typeof MutationObserver !==
        'undefined'
    ) {

      const observer =
        new MutationObserver(
          () => paint()
        );

      observer.observe(
        bellList,
        {
          childList: true,
          subtree: true
        }
      );
    }

    window.setTimeout(
      () => void refresh(),
      500
    );

    window.setTimeout(
      () => paint(),
      2000
    );

    document.addEventListener(
      'visibilitychange',
      () => {

        if (!document.hidden) {
          paint();
        }
      }
    );
  }

  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      start,
      {once: true}
    );

  } else {

    start();
  }

})();
`.trim() + '\n';

// =============================================
// 4. ACTUALIZAR CACHÉ DE AMBOS SCRIPTS
// =============================================

let html = current.html;

for (const [filename, version] of [
  ['gg-payroll-yo.js', 7],
  ['gg-payroll-yo-archive.js', 7]
]) {

  const pattern = new RegExp(
    '(src\\s*=\\s*["\\\']js/' +
    filename.replace(/\./g, '\\.') +
    ')(?:\\?[^"\\\']*)?(["\\\'])',
    'g'
  );

  const matches = [
    ...html.matchAll(pattern)
  ];

  if (matches.length !== 1) {

    throw Error(
      'No encontré una sola referencia a ' +
      filename +
      ' en yo.html. Coincidencias: ' +
      matches.length
    );
  }

  html = html.replace(
    pattern,
    '$1?v=' + version + '$2'
  );
}

if (
  !html.includes(
    'id="yoPayrollArchiveList"'
  )
) {

  throw Error(
    'No encontré la sección ' +
    'Recibos de nómina en YO. Sin cambios.'
  );
}

// =============================================
// 5. VALIDAR ANTES DE MODIFICAR
// =============================================

new vm.Script(
  bell,
  {filename: files.bell}
);

new vm.Script(
  archive,
  {filename: files.archive}
);

if (!html.includes('</html>')) {

  throw Error(
    'yo.html no está completo.'
  );
}

// =============================================
// 6. ESCRITURA CON RECUPERACIÓN EN MEMORIA
// =============================================

const edits = [
  [files.bell, bell],
  [files.archive, archive],
  [files.html, html]
];

const written = [];

try {

  for (const [name, next] of edits) {

    const key = Object.keys(files).find(
      k => files[k] === name
    );

    if (next === current[key]) {
      continue;
    }

    written.push([
      name,
      fs.readFileSync(abs(name))
    ]);

    fs.writeFileSync(
      abs(name),
      next,
      'utf8'
    );
  }

} catch (error) {

  for (
    const [name, prior] of written.reverse()
  ) {

    try {

      fs.writeFileSync(
        abs(name),
        prior
      );

    } catch (restoreError) {

      console.error(
        'No pude restaurar ' +
        name +
        ': ' +
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
  '\n✓ YO: campanita e historial ' +
  'ahora usan LOS MISMOS recibos.'
);

console.log(
  '✓ El historial utiliza el mismo ' +
  'abridor privado de PDF.'
);

console.log(
  '✓ No toca SQL, Edge Functions, ' +
  'asignaciones ni documentos.'
);

console.log(
  '✓ Archivos modificados: ' +
  written.length +
  '. Sin .bak ni backups.'
);

console.log(
  '✓ Recarga YO con Ctrl+F5.'
);
