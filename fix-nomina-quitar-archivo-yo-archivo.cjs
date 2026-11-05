
'use strict';

/*
 GRUPO GUTIÉRREZ
 FIX NÓMINA: QUITAR PDF + ARCHIVO EN YO

 Ejecutar desde la raíz:
 node fix-nomina-quitar-archivo-yo-archivo.cjs

 Sin dependencias adicionales.
 Sin .bak ni carpetas de backup.
 No modifica SQL ni documentos enviados.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();
const target = p => path.join(root, p);
const edits = new Map();

function requireText(p) {
  if (!fs.existsSync(target(p))) {
    throw Error(
      'Falta ' + p +
      '. Ejecuta desde la raíz de Grupo Gutiérrez.'
    );
  }

  return fs.readFileSync(target(p), 'utf8');
}

function createOnly(p, content) {
  const normalized = content.trim() + '\n';

  if (
    fs.existsSync(target(p)) &&
    requireText(p) !== normalized
  ) {
    throw Error(
      'El archivo ' + p +
      ' ya existe y tiene cambios. No se sobrescribe.'
    );
  }

  edits.set(p, normalized);
}

// ===================================================
// 1. QUITAR PDF DE LA CARGA ANTES DE ENVIAR
// ===================================================

let payroll = requireText('js/gg-payroll.js');

if (!payroll.includes('GG_NOMINA_REMOVE_V1')) {

  if (
    !/state\.rows\.forEach\(\(row,\s*index\)\s*=>/
      .test(payroll)
  ) {
    throw Error(
      'La lista de Nómina cambió; ' +
      'no encontré el recorrido de archivos.'
    );
  }

  const anchor = /\broot\.append\(item\);/g;

  if ([...payroll.matchAll(anchor)].length !== 1) {
    throw Error(
      'No encontré un único punto para ' +
      'agregar el botón de quitar.'
    );
  }

  payroll = payroll.replace(
    anchor,
    `/* GG_NOMINA_REMOVE_V1 */

    if (!state.sent && !state.batchId) {

      const remove =
        document.createElement('button');

      remove.type = 'button';
      remove.className = 'gg-payroll-remove';
      remove.textContent = '✕ Quitar';

      remove.setAttribute(
        'aria-label',
        'Quitar ' + row.file.name + ' de la carga'
      );

      remove.disabled = state.busy;

      remove.onclick = event => {
        event.preventDefault();
        event.stopPropagation();

        if (
          state.busy ||
          state.batchId ||
          state.sent
        ) return;

        state.rows.splice(index, 1);

        render();

        note(
          'PDF retirado de la selección. ' +
          'No se enviará.'
        );
      };

      item.append(remove);
    }

    root.append(item);`
  );
}

// ===================================================
// 2. CREAR SECCIÓN PERMANENTE EN YO
// ===================================================

let yo = requireText('yo.html');

if (!yo.includes('id="yoPayrollArchive"')) {

  const contentPos =
    yo.indexOf('id="yoContent"');

  const footerPos =
    yo.indexOf('<footer class="yo-footer">');

  const closePos =
    yo.lastIndexOf('</div>', footerPos);

  if (
    contentPos < 0 ||
    footerPos < 0 ||
    closePos < contentPos
  ) {
    throw Error(
      'No pude localizar el final del contenido ' +
      'de YO. Se canceló.'
    );
  }

  const section = `
        <!-- GG_NOMINA_ARCHIVE_V1 -->

        <section
          id="yoPayrollArchive"
          class="gg-payroll-archive"
          aria-labelledby="yoPayrollArchiveTitle"
        >

          <div class="gg-payroll-archive-head">

            <div>
              <span>
                MI INTRANET / DOCUMENTOS PRIVADOS
              </span>

              <h2 id="yoPayrollArchiveTitle">
                Recibos de nómina<span
                  class="gg-archive-dot">.</span>
              </h2>

              <p>
                Tu historial personal de recibos,
                organizado por notificación.
              </p>
            </div>

            <button
              id="yoPayrollArchiveRefresh"
              type="button"
            >
              ↻ Actualizar
            </button>

          </div>

          <div
            id="yoPayrollArchiveStatus"
            class="gg-payroll-archive-status"
            role="status"
          ></div>

          <div
            id="yoPayrollArchiveList"
            class="gg-payroll-archive-list"
          ></div>

        </section>

        `;

  yo =
    yo.slice(0, closePos) +
    section +
    yo.slice(closePos);
}

// ===================================================
// 3. CONECTAR ESTILOS Y SCRIPT
// ===================================================

const cssTag =
  '<link rel="stylesheet" ' +
  'href="css/gg-payroll-archive.css?v=1">';

if (!yo.includes('gg-payroll-archive.css')) {
  if (!yo.includes('</head>')) {
    throw Error('Falta </head> en yo.html.');
  }

  yo = yo.replace(
    '</head>',
    '    ' + cssTag + '\n</head>'
  );
}

const jsTag =
  '<script src="js/gg-payroll-yo-archive.js?v=1">' +
  '</script>';

if (!yo.includes('gg-payroll-yo-archive.js')) {
  if (!yo.includes('</body>')) {
    throw Error('Falta </body> en yo.html.');
  }

  yo = yo.replace(
    '</body>',
    '    ' + jsTag + '\n</body>'
  );
}

// Conservar la campanita ya existente.

if (!yo.includes('gg-payroll-yo.js')) {
  throw Error(
    'No se encontró la integración ' +
    'de Nómina en YO.'
  );
}

// Conectar también el CSS del botón Quitar.

let nominaPage = requireText('nomina.html');

if (!nominaPage.includes('gg-payroll-archive.css')) {

  if (!nominaPage.includes('</head>')) {
    throw Error('Falta </head> en nomina.html.');
  }

  nominaPage = nominaPage.replace(
    '</head>',
    '  ' + cssTag + '\n</head>'
  );
}

// ===================================================
// 4. CSS: QUITAR ARCHIVOS + ARCHIVO EN YO
// ===================================================

const css = String.raw`

/* GG NÓMINA: QUITAR PDF */

.n-row {
  grid-template-columns:
    minmax(145px,1fr)
    minmax(175px,1fr)
    112px auto;
}

.n-row .gg-payroll-remove {
  border: 1px solid #d7878d65;
  background: #b4374212;
  color: #e38c92;
  padding: 9px 12px;
  border-radius: 11px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 750;
  white-space: nowrap;
  cursor: pointer;
}

.n-row .gg-payroll-remove:hover {
  background: #b4374226;
}

.n-row .gg-payroll-remove:disabled {
  opacity: .45;
  cursor: default;
}

@media(max-width:850px) {
  .n-row {
    grid-template-columns:
      minmax(0,1fr)
      minmax(0,1fr);
  }

  .n-row .gg-payroll-remove {
    justify-self: start;
  }
}

/* ARCHIVO PERSONAL DE YO */

.gg-payroll-archive {
  margin-top: 48px;
  padding: 28px;
  border: 1px solid #344c64;
  border-radius: 25px;
  background: #111c2ae8;
  box-shadow: 0 20px 65px #0005;
  color: #e9f5ff;
  animation: ggArchiveIn .55s ease both;
}

.gg-payroll-archive-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.gg-payroll-archive-head span {
  font-size: 10px;
  letter-spacing: .15em;
  font-weight: 800;
  color: #77bfe8;
}

.gg-payroll-archive-head h2 {
  margin: 9px 0;
  font-size: clamp(26px,3.4vw,42px);
  letter-spacing: -.055em;
  font-weight: 850;

  background: linear-gradient(
    100deg,
    #ecf7ff,
    #70c9f1,
    #c5baff,
    #ecf7ff
  );

  background-size: 250% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;

  animation:
    ggArchiveLiquid 11s ease-in-out
    infinite alternate;
}

.gg-payroll-archive-head p {
  margin: 0;
  font-size: 12px;
  color: #acbfd0;
}

.gg-archive-dot {
  color: #6bc7fb !important;
}

#yoPayrollArchiveRefresh {
  padding: 10px 15px;
  color: #9bdfff;
  background: #21354a;
  border: 1px solid #405e78;
  border-radius: 40px;
  cursor: pointer;
  font: 700 12px system-ui;
}

.gg-payroll-archive-status {
  color: #adc4d8;
  font-size: 12px;
  margin: 16px 0;
  min-height: 18px;
}

.gg-payroll-archive-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

/* GRUPOS POR TÍTULO DE NOTIFICACIÓN */

.gg-archive-group {
  border: 1px solid #38516a;
  border-radius: 17px;
  background: #1c2e42;
  overflow: hidden;
}

.gg-archive-group summary {
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 17px 19px;
}

.gg-archive-group summary::-webkit-details-marker {
  display: none;
}

.gg-archive-group summary:after {
  content: '⌄';
  color: #80d1fa;
  font-size: 20px;
}

.gg-archive-group[open] summary:after {
  content: '⌃';
}

.gg-archive-group strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}

.gg-archive-group small {
  display: block;
  color: #a8bfd4;
  font-size: 11px;
  margin-top: 5px;
}

.gg-archive-group-body {
  display: grid;
  gap: 8px;
  padding: 0 13px 13px;
}

/* ARCHIVO INDIVIDUAL */

.gg-archive-file {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  text-align: left;
  padding: 14px;

  background: #152538;
  border: 1px solid #3c526b;
  border-radius: 12px;
  color: #f1f8ff;
  cursor: pointer;
  font: inherit;
}

.gg-archive-file:hover {
  border-color: #83cffe;
  background: #203950;
}

.gg-archive-file span {
  overflow-wrap: anywhere;
  font-size: 12px;
}

.gg-archive-file em {
  color: #8bd8ff;
  font-style: normal;
  font-size: 11px;
  font-weight: 750;
  white-space: nowrap;
}

.gg-archive-file:disabled {
  opacity: .65;
  cursor: progress;
}

.gg-archive-empty {
  border: 1px dashed #476075;
  border-radius: 15px;
  padding: 24px;
  color: #b3c9d7;
  font-size: 12px;
}

/* ANIMACIONES */

@keyframes ggArchiveIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ggArchiveLiquid {
  to {
    background-position: 100% 0;
  }
}

@media(max-width:620px) {
  .gg-payroll-archive {
    padding: 18px;
  }

  .gg-archive-file {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media(prefers-reduced-motion:reduce) {
  .gg-payroll-archive,
  .gg-payroll-archive-head h2 {
    animation: none !important;
  }
}
`;

// ===================================================
// 5. JAVASCRIPT DEL ARCHIVO PERSONAL
// ===================================================

const archiveJS = String.raw`

/*
 GG_NOMINA_ARCHIVE_V1

 Historial personal en YO.
 Complementa la campanita existente.
*/

(() => {
  'use strict';

  const db = window.ggSupabase;

  const $ = id =>
    document.getElementById(id);

  const session = () =>
    sessionStorage.getItem(
      'gg_intranet_token'
    );

  let busy = false;
  let receipts = [];

  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const fmt = value =>
    value
      ? new Date(value).toLocaleDateString(
          'es-MX',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }
        )
      : '—';

  function notice(message) {
    if ($('yoPayrollArchiveStatus')) {
      $('yoPayrollArchiveStatus').textContent =
        message;
    }
  }

  // ================================================
  // MOSTRAR RECIBOS AGRUPADOS POR NOTIFICACIÓN
  // ================================================

  function paint() {

    const root = $('yoPayrollArchiveList');

    if (!root) return;

    root.replaceChildren();

    if (!receipts.length) {

      const empty =
        document.createElement('div');

      empty.className = 'gg-archive-empty';

      empty.textContent =
        'Todavía no tienes recibos ' +
        'de nómina enviados.';

      root.append(empty);
      return;
    }

    const groups = new Map();

    for (const receipt of receipts) {

      const day =
        (receipt.sent_at || '').slice(0,10);

      const key =
        String(receipt.title || 'Nómina') +
        '|' +
        day;

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(receipt);
    }

    // Crear tarjetas desplegables.

    for (const items of groups.values()) {

      const group =
        document.createElement('details');

      group.className = 'gg-archive-group';

      const top =
        document.createElement('summary');

      const titleBox =
        document.createElement('div');

      const title =
        document.createElement('strong');

      title.textContent =
        items[0].title || 'Recibos de nómina';

      const caption =
        document.createElement('small');

      caption.textContent =
        fmt(items[0].sent_at) +
        ' · ' +
        items.length +
        (
          items.length === 1
            ? ' documento'
            : ' documentos'
        );

      titleBox.append(title, caption);
      top.append(titleBox);

      const body =
        document.createElement('div');

      body.className =
        'gg-archive-group-body';

      // Cada documento se abre con autorización.

      for (const receipt of items) {

        const button =
          document.createElement('button');

        button.type = 'button';
        button.className = 'gg-archive-file';

        const file =
          document.createElement('span');

        file.textContent =
          '▤ ' +
          (receipt.file_name || 'Recibo.pdf');

        const action =
          document.createElement('em');

        action.textContent =
          receipt.read_at
            ? 'Abrir PDF ↗'
            : '● Nuevo · Abrir ↗';

        button.append(file, action);

        button.addEventListener(
          'click',
          event => {
            event.preventDefault();

            void openPDF(
              receipt,
              button
            );
          }
        );

        body.append(button);
      }

      group.append(top, body);
      root.append(group);
    }
  }

  // ================================================
  // CONSULTAR RECIBOS DESDE SUPABASE
  // ================================================

  async function fetchList() {

    if (
      busy ||
      !session() ||
      !db
    ) return;

    busy = true;

    try {

      const {data, error} =
        await db.rpc(
          'gg_payroll_yo_list',
          {
            p_session_token: session()
          }
        );

      if (error) throw error;

      receipts =
        Array.isArray(data) ? data : [];

      paint();

      notice(
        receipts.length +
        (
          receipts.length === 1
            ? ' recibo disponible.'
            : ' recibos disponibles.'
        ) +
        (
          receipts.length >= 200
            ? ' Se muestran los 200 más recientes.'
            : ''
        )
      );

    } catch (error) {

      notice(
        'No se pudo actualizar el historial. ' +
        (error.message || '')
      );

    } finally {
      busy = false;
    }
  }

  // ================================================
  // LEER ERRORES DE LA EDGE FUNCTION
  // ================================================

  async function explain(error) {

    try {

      const body =
        await error?.context
          ?.clone?.()
          .json();

      return (
        body?.error ||
        body?.message ||
        error.message
      );

    } catch {

      return (
        error?.message ||
        'No se pudo abrir el recibo.'
      );
    }
  }

  // ================================================
  // ABRIR PDF PRIVADO
  // ================================================

  async function openPDF(receipt, button) {

    if (button.disabled) return;

    const token = session();

    if (
      !token ||
      token.length < 16 ||
      !uuid.test(
        String(receipt.id || '')
      )
    ) {

      notice(
        'Sesión o recibo inválido. ' +
        'Cierra sesión y vuelve a entrar.'
      );

      return;
    }

    // Abrir pestaña desde el clic del usuario.

    const tab = window.open(
      'about:blank',
      '_blank'
    );

    if (tab) {

      tab.opener = null;

      tab.document.title =
        'Preparando recibo';

      tab.document.body.textContent =
        'Preparando PDF privado…';
    }

    button.disabled = true;

    notice('Autorizando PDF privado…');

    try {

      const {data,error} =
        await db.functions.invoke(
          'gg-payroll-download',
          {
            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              session_token: token,
              document_id: receipt.id
            })
          }
        );

      if (error) throw error;

      if (!data?.url) {
        throw Error(
          data?.error ||
          'No recibimos el enlace privado.'
        );
      }

      // Validar URL antes de abrirla.

      const url = new URL(data.url);
      const base = new URL(db.supabaseUrl);

      if (
        url.protocol !== 'https:' ||
        url.origin !== base.origin ||
        !url.pathname.startsWith(
          '/storage/v1/object/sign/gg-payroll-private/'
        )
      ) {
        throw Error(
          'URL inesperada; se bloqueó por seguridad.'
        );
      }

      if (tab && !tab.closed) {

        tab.location.replace(url.href);

      } else {

        window.location.assign(url.href);
      }

      receipt.read_at =
        receipt.read_at ||
        new Date().toISOString();

      notice('Recibo autorizado.');

      paint();

      void fetchList();

    } catch (error) {

      const message = await explain(error);

      notice(
        'No se pudo abrir el PDF: ' +
        message
      );

      if (tab && !tab.closed) {

        tab.document.body.textContent =
          'No se pudo abrir el PDF: ' +
          message;
      }

    } finally {

      button.disabled = false;
    }
  }

  // ================================================
  // INICIAR ARCHIVO DE YO
  // ================================================

  function start() {

    if (
      !$('yoPayrollArchive') ||
      !$('yoPayrollArchiveList')
    ) return;

    $('yoPayrollArchiveRefresh')
      ?.addEventListener(
        'click',
        () => void fetchList()
      );

    void fetchList();

    document.addEventListener(
      'visibilitychange',
      () => {
        if (!document.hidden) {
          void fetchList();
        }
      }
    );

    setInterval(
      () => {
        if (!document.hidden) {
          void fetchList();
        }
      },
      120000
    );
  }

  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      start,
      {once:true}
    );

  } else {

    start();
  }

})();
`;

// ===================================================
// 6. PREPARAR ARCHIVOS
// ===================================================

createOnly(
  'css/gg-payroll-archive.css',
  css
);

createOnly(
  'js/gg-payroll-yo-archive.js',
  archiveJS
);

edits.set(
  'js/gg-payroll.js',
  payroll
);

edits.set(
  'yo.html',
  yo
);

edits.set(
  'nomina.html',
  nominaPage
);

// ===================================================
// 7. VALIDAR ANTES DE ESCRIBIR
// ===================================================

for (const [p, content] of edits) {

  if (!content.trim()) {
    throw Error('Contenido vacío: ' + p);
  }

  if (p.endsWith('.js')) {

    new vm.Script(
      content,
      {filename:p}
    );
  }

  if (
    p.endsWith('.html') &&
    !content.includes('</html>')
  ) {
    throw Error('HTML incompleto: ' + p);
  }
}

// ===================================================
// 8. ESCRITURA CON RECUPERACIÓN EN MEMORIA
// ===================================================

const originalBytes = new Map();

for (const p of edits.keys()) {

  originalBytes.set(
    p,
    fs.existsSync(target(p))
      ? fs.readFileSync(target(p))
      : null
  );
}

const applied = [];

try {

  for (const [p, content] of edits) {

    if (
      originalBytes.get(p)
        ?.toString('utf8') === content
    ) {
      continue;
    }

    fs.mkdirSync(
      path.dirname(target(p)),
      {recursive:true}
    );

    applied.push(p);

    fs.writeFileSync(
      target(p),
      content,
      'utf8'
    );
  }

} catch (error) {

  for (const p of applied.reverse()) {

    try {

      const old = originalBytes.get(p);

      if (old === null) {

        fs.rmSync(
          target(p),
          {force:true}
        );

      } else {

        fs.writeFileSync(
          target(p),
          old
        );
      }

    } catch (e) {

      console.error(
        'No se pudo restaurar ' + p,
        e.message
      );
    }
  }

  throw error;
}

// ===================================================
// RESULTADO
// ===================================================

console.log(
  '\n✓ Nómina: botón Quitar en cada PDF antes del envío.'
);

console.log(
  '✓ YO: archivo permanente de recibos, además de campanita.'
);

console.log(
  '✓ Archivos actualizados: ' +
  applied.length +
  '. Sin .bak.'
);

console.log(
  '✓ No es necesario ejecutar SQL ni desplegar Edge Functions.'
);
