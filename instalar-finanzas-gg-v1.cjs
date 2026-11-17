'use strict';

/*
 * GRUPO GUTIÉRREZ
 * Presupuesto semanal / Finanzas
 * Autorización Presupuesto
 * Relación de facturas
 * Selector de cotizaciones para pagos
 *
 * Ejecutar desde la raíz del proyecto:
 * node instalar-finanzas-gg-v1.cjs
 *
 * No crea archivos .bak.
 * Comprueba la integridad y restaura en memoria
 * los archivos modificados si falla la escritura.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const zlib = require('node:zlib');

const PAYLOAD =
  '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';
const SHA = '0985428225ca4a0262d80b102276c3f8c43b53bd3a1e2ad394885e415cbdc234';

function unpack() {
  const raw = zlib.brotliDecompressSync(
    Buffer.from(PAYLOAD, 'base64')
  );
  const digest = crypto.createHash('sha256')
    .update(raw).digest('hex');
  if (digest !== SHA) {
    throw Error('Instalador incompleto: SHA-256 no coincide');
  }
  return JSON.parse(raw.toString('utf8'));
}

const assets = unpack();
const root = process.cwd();
const at = n => path.join(root, n);
const required = [
  'sistema.html',
  'js/sistema.js',
  'solicitudes-pago.html'
];

for (const n of required) {
  if (!fs.existsSync(at(n))) {
    throw Error('Falta ' + n + '. Ejecuta desde desarrollo grupo.');
  }
}

const before = new Map();
for (const n of required) {
  before.set(n, fs.readFileSync(at(n)));
}

const edits = new Map();

function unique(source, re, label) {
  const matches = [...source.matchAll(re)];
  if (matches.length !== 1) {
    throw Error(
      label + ': esperaba 1 coincidencia; hay ' +
      matches.length + '. Sin modificar archivos.'
    );
  }
  return matches[0];
}

let routes = before.get('js/sistema.js').toString();

if (!routes.includes('"presupuesto-semanal"')) {
  const index = unique(
    routes,
    /"cultura-organizacional"\s*:/g,
    'Ruta Cultura'
  ).index;

  routes = routes.slice(0, index) + `
    "presupuesto-semanal": {
      name:"Presupuesto semanal / Finanzas",
      url:"presupuesto-semanal.html"
    },
    "autorizacion-presupuesto": {
      name:"Autorización Presupuesto",
      url:"autorizacion-presupuesto.html"
    },
    "relacion-facturas": {
      name:"Relación de facturas",
      url:"relacion-facturas.html"
    },
  ` + routes.slice(index);
}

edits.set('js/sistema.js', routes);

let dashboard = before.get('sistema.html').toString();

if (!dashboard.includes('WF_GG_TILES_V1')) {
  const tiles = [
    [
      'presupuesto-semanal',
      'Presupuesto semanal / Finanzas',
      'Planeación y envío de presupuestos',
      '▤'
    ],
    [
      'autorizacion-presupuesto',
      'Autorización Presupuesto',
      'Autorizar LO e ISGTZ/JD',
      '✓'
    ],
    [
      'relacion-facturas',
      'Relación de facturas',
      'CFDI y aplicación de pagos',
      '▥'
    ]
  ];

  const section = '<!-- WF_GG_TILES_V1 -->\n' +
    tiles.map(([id, label, description, icon], i) => `
      <div class="module-shell" style="--delay:${.85+i*.05}s">
        <button class="module-card" type="button" data-module="${id}">
          <span class="card-top">
            <span class="card-icon">${icon}</span>
            <span class="card-serial">F${i+1}</span>
          </span>
          <span class="card-content">
            <span class="card-eyebrow">OPERACIÓN · FINANZAS</span>
            <strong class="card-title">${label}</strong>
            <span class="card-description">${description}</span>
          </span>
          <span class="card-footer">
            <span class="card-meta">NUEVO</span>
            <span class="card-arrow">↗</span>
          </span>
        </button>
      </div>
    `).join('\n');

  const anchor = unique(
    dashboard,
    /<!-- GG_TEC_INSTALADO_V1 -->/g,
    'Ancla Tecnologías'
  );

  dashboard =
    dashboard.slice(0, anchor.index) +
    section +
    dashboard.slice(anchor.index);
}

edits.set('sistema.html', dashboard);

let requests = before.get('solicitudes-pago.html').toString();

if (!requests.includes('WF_GG_PICKER_V1')) {
  unique(requests, /<\/body>/gi, 'Cierre de Solicitudes');

  requests = requests.replace(
    /<\/body>/i,
    `<!-- WF_GG_PICKER_V1 -->
    <link rel="stylesheet" href="css/wf-quote-picker.css?v=1">
    <script src="js/wf-gg-quote-picker.js?v=1"></script>
    </body>`
  );
}

edits.set('solicitudes-pago.html', requests);

const quoteCSS = `
.wf-picker-launch{
  display:inline-flex;margin:8px 0;padding:8px 11px;
  border:1px solid #738eaa55;border-radius:10px;
  background:#243a4b;color:#eaf5ff;font-size:11px;
  cursor:pointer
}
.wf-qp-shade{
  position:fixed;inset:0;background:#030a12d9;
  backdrop-filter:blur(10px)
}
#wfQuotePicker{
  position:fixed;inset:0;z-index:90000;
  display:grid;place-items:center;padding:16px
}
.wf-qp-dialog{
  position:relative;width:min(730px,100%);
  max-height:90vh;overflow:auto;
  background:#122236;color:#e9f1fb;
  border:1px solid #516e8b66;border-radius:22px;
  padding:27px;box-shadow:0 25px 90px #0008
}
.wf-qp-close{
  float:right;border:0;color:white;
  background:transparent;cursor:pointer
}
.wf-qp-eyebrow{
  letter-spacing:.16em;font-size:10px;color:#8ec4f1
}
.wf-qp-dialog h2{font-size:26px}
.wf-qp-dialog p{color:#9bb2ca;font-size:12px}
.wf-qp-filters{
  display:grid;grid-template-columns:1fr 1fr;gap:9px
}
.wf-qp-filters input,.wf-qp-filters select{
  width:100%;border:1px solid #456681;
  background:#1d3549;color:#fff;
  border-radius:9px;padding:11px
}
.wf-qp-results{
  margin-top:16px;max-height:45vh;overflow:auto
}
.wf-qp-result{
  width:100%;display:flex;justify-content:space-between;
  align-items:center;margin:6px 0;gap:10px;padding:13px;
  border:1px solid #45668155;border-radius:12px;
  background:#192d40;color:#ecf6ff;
  text-align:left;cursor:pointer
}
.wf-qp-result span{display:grid;gap:6px}
.wf-qp-result small{color:#a1b8ce}
.wf-qp-result strong{white-space:nowrap}
@media(max-width:550px){
  .wf-qp-filters{grid-template-columns:1fr}
  .wf-qp-result{flex-wrap:wrap}
}
`;

function page(mode,title) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} · Grupo Gutiérrez</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/wf-ui.css?v=1">
</head>
<body data-scope="GG" data-mode="${mode}">
  <div id="wfApp"></div>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase-client.js"></script>
  <script src="js/wf-ui.js?v=1"></script>
</body>
</html>`;
}

const generated = {
  'js/wf-ui.js': assets['wf-ui.js'],
  'css/wf-ui.css': assets['wf-ui.css'],
  'js/wf-gg-quote-picker.js': assets['wf-gg-quote-picker.js'],
  'css/wf-quote-picker.css': quoteCSS,
  'presupuesto-semanal.html':
    page('budget','Presupuesto semanal'),
  'autorizacion-presupuesto.html':
    page('approval','Autorización Presupuesto'),
  'relacion-facturas.html':
    page('invoices','Relación de facturas')
};

for (const [name, value] of Object.entries(generated)) {
  if (fs.existsSync(at(name))) {
    const old = fs.readFileSync(at(name));
    if (old.toString() !== value) {
      throw Error(
        name + ' ya existe con contenido distinto. Sin sobrescribir.'
      );
    }
    before.set(name, old);
  } else {
    before.set(name, null);
  }
  edits.set(name, value);
}

for (const [name, value] of edits) {
  if (name.endsWith('.js')) {
    new vm.Script(value,{filename:name});
  }
  if (name.endsWith('.html') && !/<\/html>/i.test(value)) {
    throw Error('HTML incompleto: '+name);
  }
}

const applied = [];

try {
  for (const [name, value] of edits) {
    const data = Buffer.from(value);
    const old = before.get(name);

    if (old?.equals(data)) continue;

    fs.mkdirSync(path.dirname(at(name)),{recursive:true});
    applied.push(name);
    fs.writeFileSync(at(name),data);
  }
} catch (e) {
  for (const name of applied.reverse()) {
    try {
      const old = before.get(name);
      if (old===null) {
        fs.rmSync(at(name),{force:true});
      } else {
        fs.writeFileSync(at(name),old);
      }
    } catch (restoreError) {
      console.error(
        'No se pudo restaurar:',name,restoreError.message
      );
    }
  }
  throw e;
}

console.log('✓ Grupo Gutiérrez: módulos instalados');
console.log('✓ Archivos modificados:',applied.length);
console.log('✓ Sin backups .bak');
console.log('✓ Sin modificar Nómina, YO o funciones de Finanzas');