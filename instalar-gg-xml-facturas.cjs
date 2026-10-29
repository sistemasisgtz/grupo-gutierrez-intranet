
'use strict';

// =====================================================
// GRUPO GUTIÉRREZ · XML Y FACTURAS
// INSTALADOR COMPLETO
//
// Ejecutar junto a sistema.html.
// SIN archivos .bak.
// =====================================================

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;

const mark = 'GG_XML_FACTURAS_20261028_V1';

const files = {
  system: 'sistema.html',
  routes: 'js/sistema.js',
  cssSystem: 'css/sistema.css',
  vite: 'vite.config.js',
  page: 'xml-facturas.html',
  css: 'css/xml-facturas.css',
  js: 'js/xml-facturas.js'
};

// =====================================================
// 1. PÁGINA HTML
// =====================================================

const html = String.raw`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport"
        content="width=device-width,initial-scale=1">

  <title>XML y Facturas · Grupo Gutiérrez</title>

  <link rel="preconnect"
        href="https://fonts.googleapis.com">

  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">

  <link rel="stylesheet" href="css/sistema.css">
  <link rel="stylesheet" href="css/xml-facturas.css">
</head>

<body class="gxf-page">

  <div class="atmosphere" aria-hidden="true">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>
    <div class="ambient ambient-three"></div>
    <div class="atmosphere-noise"></div>
  </div>

  <main class="gxf-shell">

    <header class="gxf-top">

      <a href="sistema.html" class="gxf-back">
        ← Sistema Central
      </a>

      <span>
        GRUPO GUTIÉRREZ · CONTROL DOCUMENTAL
      </span>

      <button id="gxfTheme"
              class="gxf-btn"
              type="button">
        ☀ Modo claro
      </button>

    </header>

    <section class="gxf-hero">

      <div>
        <span class="gxf-eyebrow">
          CFDI · ARCHIVO DIGITAL
        </span>

        <h1>
          XML <em>y Facturas.</em>
        </h1>

        <p>
          Importa facturas emitidas, revisa todos
          sus datos fiscales y partidas, y consérvalas
          para los siguientes módulos del sistema.
        </p>
      </div>

      <button id="gxfAdd"
              class="gxf-btn gxf-primary"
              type="button">
        ＋ Agregar factura
      </button>

    </section>

    <div id="gxfStats" class="gxf-stats"></div>

    <section class="gxf-panel">

      <div class="gxf-panel-head">
        <div>
          <span class="gxf-eyebrow">
            HISTORIAL ORGANIZADO
          </span>
          <h2>Registro de facturas</h2>
        </div>

        <button id="gxfRefresh"
                class="gxf-btn"
                type="button">
          ↻ Actualizar
        </button>
      </div>

      <div class="gxf-tabs">

        <button type="button"
                class="active"
                data-gxf-section="active">
          Activas
        </button>

        <button type="button"
                data-gxf-section="hidden">
          Ocultas
        </button>

      </div>

      <div class="gxf-filters">

        <label>
          Buscar folio, UUID, cliente, RFC o correo
          <input id="gxfSearch"
                 type="search"
                 placeholder="Buscar en el registro...">
        </label>

        <label>
          Cargadas desde
          <input id="gxfFrom" type="date">
        </label>

        <label>
          Cargadas hasta
          <input id="gxfTo" type="date">
        </label>

        <button type="button"
                id="gxfClear"
                class="gxf-btn">
          Limpiar
        </button>

      </div>

      <p id="gxfMessage"
         class="gxf-message"
         role="status">
        Consultando tu sesión…
      </p>

      <div class="gxf-table-wrap">
        <table class="gxf-table">

          <thead>
            <tr>
              <th>Factura</th>
              <th>Receptor</th>
              <th>RFC receptor</th>
              <th>Emisión</th>
              <th>Total fiscal</th>
              <th>Fecha de carga</th>
              <th>Cargada por</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody id="gxfRows"></tbody>

        </table>
      </div>

      <div class="gxf-pagination">

        <span id="gxfPageText">—</span>

        <div>
          <button id="gxfPrev"
                  class="gxf-btn"
                  type="button">
            ← Anterior
          </button>

          <button id="gxfNext"
                  class="gxf-btn"
                  type="button">
            Siguiente →
          </button>
        </div>

      </div>

    </section>

    <footer class="gxf-footer">
      GRUPO GUTIÉRREZ · El XML fiscal original
      se conserva sin alteraciones
    </footer>

  </main>

  <dialog id="gxfImportDialog"
          class="gxf-dialog"
          aria-label="Importar factura XML">

    <div class="gxf-dialog-body">

      <header class="gxf-dialog-head">

        <div>
          <span class="gxf-eyebrow">
            NUEVA IMPORTACIÓN
          </span>

          <h2>Agregar factura</h2>
        </div>

        <button type="button"
                class="gxf-btn"
                data-gxf-close="import">
          ✕ Cerrar
        </button>

      </header>

      <div id="gxfDrop"
           class="gxf-drop"
           role="button"
           tabindex="0">

        <span class="gxf-drop-icon">⇧</span>

        <strong>
          Arrastra aquí tu XML CFDI
        </strong>

        <small>
          O haz clic para seleccionar un archivo ·
          Máximo 2 MB · CFDI de ingreso 3.3/4.0
        </small>

        <input id="gxfFile"
               type="file"
               accept=".xml,text/xml,application/xml"
               hidden>

      </div>

      <div id="gxfPreview" hidden></div>

      <p id="gxfImportMessage"
         class="gxf-message"
         role="status"></p>

      <div class="gxf-dialog-actions">

        <button id="gxfSave"
                type="button"
                class="gxf-btn gxf-primary"
                disabled>
          Guardar factura y partidas
        </button>

      </div>

    </div>

  </dialog>

  <dialog id="gxfDetailDialog"
          class="gxf-dialog"
          aria-label="Detalle de factura">

    <div class="gxf-dialog-body">

      <header class="gxf-dialog-head">

        <div>
          <span class="gxf-eyebrow">
            CONSULTA DEL REGISTRO
          </span>

          <h2>Detalle de factura</h2>
        </div>

        <button class="gxf-btn"
                data-gxf-close="detail"
                type="button">
          ✕ Cerrar
        </button>

      </header>

      <div id="gxfDetail"></div>

      <div class="gxf-dialog-actions">

        <button id="gxfDownloadXml"
                class="gxf-btn"
                type="button">
          ↓ Descargar XML original
        </button>

      </div>

    </div>

  </dialog>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase-client.js"></script>
  <script src="js/xml-facturas.js"></script>

</body>
</html>`;

// =====================================================
// 2. CSS DEL MÓDULO
// =====================================================

const css = String.raw`

/* XML Y FACTURAS · GLASS ATELIER */

.gxf-page {
  --fg:#f1f6fb;
  --muted:#9eafc1;
  --panel:rgba(25,32,43,.88);
  --line:rgba(213,232,249,.15);
  --input:#172231;
  --accent:#a9d5ee;
  --tint:rgba(255,255,255,.04);
  --good:#9ce4c6;
  --warn:#f2c783;

  min-height:100vh;
  color:var(--fg);
  font:13px 'DM Sans',sans-serif;
}

.gxf-page * {
  box-sizing:border-box;
}

.gxf-shell {
  position:relative;
  z-index:2;
  max-width:1550px;
  margin:auto;
  padding:0 clamp(16px,3vw,42px) 50px;
}

.gxf-top {
  min-height:82px;
  display:flex;
  gap:14px;
  align-items:center;
  justify-content:space-between;
  border-bottom:1px solid var(--line);
  font-size:10px;
  font-weight:800;
  letter-spacing:.12em;
  color:var(--muted);
}

.gxf-top .gxf-btn {
  margin-left:auto;
}

.gxf-back {
  color:var(--accent);
  font-size:12px;
  letter-spacing:0;
}

.gxf-hero {
  padding:40px 0 27px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:24px;
}

.gxf-eyebrow {
  color:var(--accent);
  font-size:10px;
  letter-spacing:.16em;
  font-weight:800;
}

.gxf-hero h1 {
  font:800 clamp(32px,4vw,56px)/1.1 Manrope,sans-serif;
  letter-spacing:-.06em;
  margin:11px 0;
}

.gxf-hero h1 em {
  font-style:normal;
  color:var(--accent);
}

.gxf-hero p {
  color:var(--muted);
  line-height:1.7;
  max-width:720px;
}

.gxf-btn {
  appearance:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  background:var(--input);
  border:1px solid var(--line);
  color:var(--fg);
  padding:10px 14px;
  border-radius:11px;
  cursor:pointer;
  font:700 12px 'DM Sans',sans-serif;
  white-space:nowrap;
}

.gxf-btn:hover {
  filter:brightness(1.15);
  border-color:var(--accent);
}

.gxf-btn:disabled {
  opacity:.45;
  cursor:default;
}

.gxf-primary {
  background:linear-gradient(120deg,#527c9f,#8eabc4);
  color:#fff;
  border:1px solid #9cbbd3;
  box-shadow:0 9px 24px #203d6130;
}

.gxf-stats {
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:12px;
  margin-bottom:18px;
}

.gxf-stat,
.gxf-panel {
  border:1px solid var(--line);
  background:var(--panel);
  backdrop-filter:blur(19px);
  box-shadow:0 18px 44px #0002;
  border-radius:19px;
}

.gxf-stat {
  padding:20px;
}

.gxf-stat small {
  color:var(--muted);
  display:block;
  font-size:10px;
  text-transform:uppercase;
  letter-spacing:.07em;
  font-weight:800;
}

.gxf-stat strong {
  font:800 clamp(19px,2vw,28px) Manrope,sans-serif;
  display:block;
  margin-top:10px;
  overflow-wrap:anywhere;
}

.gxf-panel {
  padding:20px;
}

.gxf-panel-head,
.gxf-dialog-head {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:18px;
}

.gxf-panel-head h2,
.gxf-dialog-head h2 {
  font:800 23px Manrope,sans-serif;
  letter-spacing:-.035em;
  margin:7px 0;
}

.gxf-tabs {
  display:flex;
  gap:7px;
  padding:15px 0;
  border-bottom:1px solid var(--line);
}

.gxf-tabs button {
  border:1px solid transparent;
  border-radius:11px;
  background:transparent;
  color:var(--muted);
  padding:10px 16px;
  font-weight:800;
  cursor:pointer;
}

.gxf-tabs .active {
  background:var(--tint);
  border-color:var(--line);
  color:var(--fg);
}

.gxf-filters {
  display:grid;
  grid-template-columns:2fr 1fr 1fr auto;
  gap:12px;
  align-items:end;
  padding:16px 0;
}

.gxf-filters label,
.gxf-field {
  display:grid;
  gap:7px;
  min-width:0;
  font-size:11px;
  font-weight:750;
  color:var(--muted);
}

.gxf-page input,
.gxf-page textarea {
  color:var(--fg);
  background:var(--input);
  border:1px solid var(--line);
  border-radius:9px;
  padding:9px 11px;
  min-width:0;
  max-width:100%;
  font:500 12px 'DM Sans',sans-serif;
}

.gxf-page input:focus,
.gxf-page textarea:focus {
  outline:2px solid var(--accent);
}

.gxf-page input[type=date] {
  min-height:37px;
}

.gxf-page input[type=number] {
  width:110px;
}

.gxf-page textarea {
  width:100%;
  resize:vertical;
  min-height:70px;
}

.gxf-message {
  color:var(--muted);
  font-size:12px;
  line-height:1.6;
  min-height:19px;
}

.gxf-message.error {
  color:#f4a9a2;
}

.gxf-table-wrap {
  overflow:auto;
  max-height:65vh;
  border:1px solid var(--line);
  border-radius:12px;
}

.gxf-table {
  border-collapse:separate;
  border-spacing:0;
  min-width:1060px;
  width:100%;
  font-size:12px;
}

.gxf-table th {
  position:sticky;
  top:0;
  background:var(--input);
  z-index:1;
  text-align:left;
  padding:13px;
  font-size:10px;
  text-transform:uppercase;
  letter-spacing:.04em;
  color:var(--accent);
  white-space:nowrap;
}

.gxf-table td {
  padding:14px 13px;
  border-top:1px solid var(--line);
  color:var(--fg);
  vertical-align:top;
}

.gxf-table tbody tr:nth-child(even) {
  background:var(--tint);
}

.gxf-table tbody tr:hover {
  background:rgba(114,166,201,.11);
}

.gxf-table td small {
  display:block;
  color:var(--muted);
  margin-top:5px;
}

.gxf-chip {
  display:inline-block;
  padding:5px 8px;
  border-radius:100px;
  border:1px solid var(--line);
  background:var(--tint);
  font-size:10px;
  font-weight:700;
}

.gxf-chip.good {
  color:var(--good);
}

.gxf-chip.warn {
  color:var(--warn);
}

.gxf-actions {
  display:flex;
  gap:6px;
  white-space:nowrap;
}

.gxf-actions button {
  padding:8px 10px;
}

.gxf-pagination {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  color:var(--muted);
  padding-top:17px;
}

.gxf-pagination>div {
  display:flex;
  gap:7px;
}

.gxf-footer {
  text-align:center;
  padding:30px;
  color:var(--muted);
  font-size:11px;
}

/* POPUPS */

.gxf-dialog {
  width:min(1200px,96vw);
  max-width:96vw;
  max-height:92vh;
  border-radius:22px;
  border:1px solid var(--line);
  color:var(--fg);
  background:var(--panel);
  box-shadow:0 34px 90px #0009;
  padding:0;
  overflow:auto;
}

.gxf-dialog::backdrop {
  background:rgba(5,11,20,.78);
  backdrop-filter:blur(5px);
}

.gxf-dialog-body {
  padding:clamp(17px,2.5vw,30px);
}

.gxf-dialog-head {
  padding-bottom:17px;
  border-bottom:1px solid var(--line);
}

.gxf-dialog-actions {
  display:flex;
  justify-content:flex-end;
  border-top:1px solid var(--line);
  padding-top:16px;
  margin-top:16px;
}

.gxf-drop {
  display:grid;
  justify-items:center;
  gap:9px;
  border:2px dashed var(--accent);
  border-radius:15px;
  padding:25px 15px;
  background:var(--tint);
  margin:19px 0;
  cursor:pointer;
  text-align:center;
}

.gxf-drop.dragging {
  background:rgba(108,164,196,.18);
}

.gxf-drop small {
  color:var(--muted);
}

.gxf-drop-icon {
  font-size:27px;
  color:var(--accent);
}

.gxf-preview-head {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
}

.gxf-amount {
  font:800 27px Manrope,sans-serif;
  color:var(--good);
}

.gxf-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:10px;
  margin:13px 0;
}

.gxf-kv {
  padding:13px;
  border:1px solid var(--line);
  border-radius:12px;
  background:var(--tint);
  min-width:0;
}

.gxf-kv small {
  display:block;
  color:var(--muted);
  font-size:10px;
  margin-bottom:6px;
}

.gxf-kv strong {
  overflow-wrap:anywhere;
  font-size:12px;
}

.gxf-edit-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:11px;
  margin:16px 0;
}

.gxf-edit-grid input {
  width:100%;
}

.gxf-subtitle {
  margin:20px 0 9px;
  font:800 16px Manrope,sans-serif;
}

.gxf-table .gxf-description {
  white-space:normal;
  min-width:290px;
}

.gxf-items {
  overflow-x:auto;
  border:1px solid var(--line);
  border-radius:12px;
}

.gxf-items .gxf-table {
  min-width:920px;
}

.gxf-items input[type=text] {
  width:100%;
  min-width:230px;
}

.gxf-tip {
  border:1px solid var(--line);
  background:var(--tint);
  border-radius:11px;
  padding:12px;
  margin:12px 0;
  color:var(--muted);
  line-height:1.6;
  font-size:11px;
}

.gxf-tip strong {
  color:var(--fg);
}

.gxf-empty {
  padding:35px;
  text-align:center;
  color:var(--muted);
}

.gxf-detail-items {
  max-height:48vh;
  overflow:auto;
}

/* MODO CLARO */

html[data-gxf-theme=light] {
  color-scheme:light;
  background:#eaf2f8;
}

html[data-gxf-theme=light] .gxf-page {
  --fg:#223d54;
  --muted:#687f93;
  --panel:rgba(255,255,255,.94);
  --line:rgba(60,99,132,.19);
  --input:#f3f8fc;
  --accent:#346c94;
  --tint:rgba(200,221,239,.27);
  --good:#247957;
  --warn:#a66f1b;

  background:radial-gradient(
    ellipse at top,
    #fff,
    #e9f2f8 70%
  );
}

html[data-gxf-theme=light] .atmosphere {
  opacity:.16;
}

/* RESPONSIVE */

@media(max-width:1050px) {
  .gxf-stats {
    grid-template-columns:repeat(2,1fr);
  }

  .gxf-filters {
    grid-template-columns:repeat(2,1fr);
  }

  .gxf-filters>.gxf-btn {
    align-self:end;
  }

  .gxf-edit-grid,
  .gxf-grid {
    grid-template-columns:repeat(2,1fr);
  }
}

@media(max-width:650px) {
  .gxf-hero,
  .gxf-panel-head {
    flex-direction:column;
    align-items:stretch;
  }

  .gxf-top {
    flex-wrap:wrap;
    padding:12px 0;
  }

  .gxf-stats,
  .gxf-filters,
  .gxf-edit-grid,
  .gxf-grid {
    grid-template-columns:1fr;
  }

  .gxf-panel {
    padding:13px;
  }

  .gxf-dialog-body {
    padding:15px;
  }

  .gxf-hero {
    padding:25px 0;
  }

  .gxf-pagination {
    flex-wrap:wrap;
  }
}
`;

// =====================================================
// 3. JAVASCRIPT DEL NAVEGADOR
//
// Se genera desde una función para evitar errores
// de template literals anidados en el .cjs.
// =====================================================

function browserApp() {

  'use strict';

  const db = window.ggSupabase;

  const $ = id =>
    document.getElementById(id);

  const esc = v =>
    String(v ?? '').replace(
      /[&<>"']/g,
      c => ({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      }[c])
    );

  const num = v => Number(v) || 0;

  const money = v =>
    new Intl.NumberFormat(
      'es-MX',
      {
        style:'currency',
        currency:'MXN'
      }
    ).format(num(v));

  const fmt = v =>
    v
      ? new Date(v).toLocaleString(
          'es-MX',
          {
            dateStyle:'medium',
            timeStyle:'short'
          }
        )
      : '—';

  const val = (n,a) =>
    n?.getAttribute(a) || '';

  const direct = (n,name,ns) =>
    [...(n?.children || [])].find(
      x => x.localName===name &&
           x.namespaceURI===ns
    ) || null;

  const children = (n,name,ns) =>
    [...(n?.children || [])].filter(
      x => x.localName===name &&
           x.namespaceURI===ns
    );

  const attrs = el =>
    Object.fromEntries(
      [...(el?.attributes || [])]
        .filter(
          x => ![
            'Sello',
            'Certificado',
            'SelloCFD',
            'SelloSAT'
          ].includes(x.localName)
        )
        .map(x => [x.localName,x.value])
    );

  let section='active';
  let page=0;
  let rows=[];
  let total=0;
  let draft=null;
  let rawXml='';
  let currentDetail=null;
  let mayWrite=false;
  let searchTimer;
  let fetchVersion=0;

  const setMsg=(id,t,error=false)=>{
    $(id).textContent=t;
    $(id).classList.toggle('error',error);
  };

  // =================================================
  // TEMA
  // =================================================

  function theme(t) {

    const chosen =
      t==='light' ? 'light' : 'dark';

    document.documentElement.dataset.gxfTheme=
      chosen;

    $('gxfTheme').textContent=
      chosen==='dark'
        ? '☀ Modo claro'
        : '☾ Modo oscuro';

    try {

      localStorage.setItem(
        'gg-xml-theme',
        chosen
      );

    } catch(_) {
      // El tema funciona aunque no haya storage.
    }
  }

  // =================================================
  // LECTOR XML / CFDI
  // =================================================

  function parseXML(content) {

    if (
      content.length > 2_000_000 ||
      /<!\s*(DOCTYPE|ENTITY)\b/i.test(content)
    ) {

      throw Error(
        'Archivo demasiado grande o con entidades/DOCTYPE no admitidos.'
      );
    }

    const doc = new DOMParser().parseFromString(
      content,
      'application/xml'
    );

    if(doc.querySelector('parsererror')) {
      throw Error('XML mal formado.');
    }

    const root=doc.documentElement;
    const ns=root.namespaceURI;

    if (
      root.localName !== 'Comprobante' ||
      ![
        'http://www.sat.gob.mx/cfd/4',
        'http://www.sat.gob.mx/cfd/3'
      ].includes(ns)
    ) {
      throw Error(
        'Se requiere un CFDI XML 3.3 o 4.0.'
      );
    }

    if(val(root,'TipoDeComprobante') !== 'I') {

      throw Error(
        'Este módulo importa facturas de ingreso (tipo I).'
      );
    }

    const issuer=direct(root,'Emisor',ns);
    const receiver=direct(root,'Receptor',ns);

    const concepts=children(
      direct(root,'Conceptos',ns),
      'Concepto',
      ns
    );

    const stamp=
      doc.getElementsByTagNameNS(
        'http://www.sat.gob.mx/TimbreFiscalDigital',
        'TimbreFiscalDigital'
      )[0];

    if(
      !issuer ||
      !receiver ||
      !stamp ||
      !concepts.length ||
      concepts.length>400
    ) {
      throw Error(
        'CFDI incompleto, sin timbre o con más de 400 conceptos.'
      );
    }

    const uuid=val(stamp,'UUID').toUpperCase();

    if(
      !/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(uuid)
    ) {
      throw Error('UUID fiscal inválido.');
    }

    const taxNode=direct(root,'Impuestos',ns);

    function taxes(node) {

      const box=direct(node,'Impuestos',ns);

      return ['Traslados','Retenciones'].flatMap(
        group =>
          children(
            direct(box,group,ns),
            group==='Traslados'
              ? 'Traslado'
              : 'Retencion',
            ns
          ).map(t=>({
            type:group==='Traslados'
              ? 'traslado'
              : 'retencion',

            ...attrs(t)
          }))
      );
    }

    const items=concepts.map((c,i)=>({

      lineNo:i+1,

      code:val(c,'ClaveProdServ'),

      unitCode:val(c,'ClaveUnidad'),

      unit:val(c,'Unidad'),

      sku:val(c,'NoIdentificacion'),

      description:val(c,'Descripcion'),

      quantity:num(val(c,'Cantidad')),

      unitPrice:num(val(c,'ValorUnitario')),

      amount:num(val(c,'Importe')),

      discount:num(val(c,'Descuento')),

      taxObject:val(c,'ObjetoImp'),

      taxes:taxes(c)

    }));

    const original={

      uuid,

      version:val(root,'Version'),

      series:val(root,'Serie'),

      folio:val(root,'Folio'),

      issuedAt:val(root,'Fecha'),

      stampedAt:val(stamp,'FechaTimbrado'),

      issuerName:val(issuer,'Nombre'),

      issuerRfc:val(issuer,'Rfc'),

      issuerRegime:val(issuer,'RegimenFiscal'),

      receiverName:val(receiver,'Nombre'),

      receiverRfc:val(receiver,'Rfc'),

      receiverRegime:
        val(receiver,'RegimenFiscalReceptor'),

      receiverPostal:
        val(receiver,'DomicilioFiscalReceptor'),

      use:val(receiver,'UsoCFDI'),

      currency:val(root,'Moneda')||'MXN',

      exchangeRate:val(root,'TipoCambio'),

      receiptType:val(root,'TipoDeComprobante'),

      paymentMethod:val(root,'MetodoPago'),

      paymentForm:val(root,'FormaPago'),

      exportType:val(root,'Exportacion'),

      place:val(root,'LugarExpedicion'),

      subtotal:num(val(root,'SubTotal')),

      discount:num(val(root,'Descuento')),

      total:num(val(root,'Total')),

      taxTransferred:
        num(val(taxNode,'TotalImpuestosTrasladados')),

      taxWithheld:
        num(val(taxNode,'TotalImpuestosRetenidos')),

      certNumber:val(root,'NoCertificado'),

      satCertNumber:val(stamp,'NoCertificadoSAT'),

      certifierRfc:val(stamp,'RfcProvCertif'),

      taxes:taxes(root),

      extra:attrs(root),

      complements:[
        ...doc.getElementsByTagNameNS(
          ns,
          'Complemento'
        )
      ].flatMap(
        x => [...x.children].map(
          k => k.localName
        )
      )

    };

    if(
      !original.issuerRfc ||
      !original.receiverRfc ||
      !original.issuedAt ||
      !val(root,'Total') ||
      !Number.isFinite(Number(val(root,'Total'))) ||
      original.total<0
    ) {
      throw Error(
        'Datos fiscales esenciales incompletos.'
      );
    }

    return {
      original,
      items
    };
  }

  // =================================================
  // COMPONENTES DE LA VISTA PREVIA
  // =================================================

  function kv(label,value) {

    return (
      '<div class="gxf-kv">' +
        '<small>'+esc(label)+'</small>' +
        '<strong>'+esc(value??'—')+'</strong>' +
      '</div>'
    );
  }

  function field(name,label,value,type='text') {

    return (
      '<label class="gxf-field">' +
        esc(label) +
        '<input data-head="'+name+'"' +
        ' type="'+type+'"' +
        ' value="'+esc(value||'')+'"' +
        ' maxlength="220">' +
      '</label>'
    );
  }

  function itemTax(taxes) {

    return taxes.map(
      t=>esc(
        (
          t.type==='traslado'
            ? 'Traslado '
            : 'Retención '
        ) +
        (t.Impuesto||'') +
        ' ' +
        (t.TasaOCuota||'') +
        ' $' +
        (t.Importe||'0')
      )
    ).join(' / ')||'—';
  }

  // =================================================
  // VISTA PREVIA COMPLETA
  // =================================================

  function preview() {

    const o=draft.original;

    const initialTotal=
      o.subtotal -
      o.discount +
      o.taxTransferred -
      o.taxWithheld;

    const mismatch=
      Math.abs(initialTotal-o.total)>.03;

    $('gxfPreview').hidden=false;

    $('gxfPreview').innerHTML=`

      <div class="gxf-preview-head">

        <div>
          <span class="gxf-chip good">
            XML leído · CFDI ${esc(o.version)}
          </span>

          <h3 class="gxf-subtitle">
            Factura
            ${esc(
              (o.series+'-'+o.folio).replace(/^-/, '')
            )}
          </h3>
        </div>

        <strong class="gxf-amount">
          ${money(o.total)}
        </strong>

      </div>

      <div class="gxf-grid">

        ${kv('Emisor',o.issuerName)}
        ${kv('RFC emisor',o.issuerRfc)}
        ${kv('Régimen emisor',o.issuerRegime)}
        ${kv('Receptor',o.receiverName)}
        ${kv('RFC receptor',o.receiverRfc)}

        ${kv(
          'Régimen receptor / CP',
          (o.receiverRegime||'—')+
          ' / '+
          (o.receiverPostal||'—')
        )}

        ${kv('Fecha emisión',o.issuedAt)}
        ${kv('Timbrado',o.stampedAt)}
        ${kv('UUID',o.uuid)}

        ${kv(
          'Método / forma pago',
          (o.paymentMethod||'—')+
          ' / '+
          (o.paymentForm||'—')
        )}

        ${kv(
          'Uso CFDI / Lugar',
          (o.use||'—')+
          ' / '+
          (o.place||'—')
        )}

        ${kv(
          'Moneda / Tipo cambio',
          (o.currency||'—')+
          ' / '+
          (o.exchangeRate||'—')
        )}

        ${kv('Subtotal',money(o.subtotal))}
        ${kv('Descuento',money(o.discount))}

        ${kv(
          'Impuestos trasladados',
          money(o.taxTransferred)
        )}

        ${kv('Retenciones',money(o.taxWithheld))}
        ${kv('TOTAL FISCAL',money(o.total))}
        ${kv('Certificado SAT',o.satCertNumber)}

      </div>

      <div class="gxf-tip">

        <strong>Fuente fiscal protegida.</strong>

        Los ajustes siguientes son de uso interno
        y NO cambian el XML original, el UUID,
        los RFC ni los importes fiscales timbrados.

        ${
          mismatch
            ? '<strong>Revisa: el cálculo simple de impuestos no coincide con el total declarado.</strong>'
            : 'La suma general del comprobante es consistente.'
        }

      </div>

      <h3 class="gxf-subtitle">
        Datos internos editables
      </h3>

      <div class="gxf-edit-grid">

        ${field('series','Serie mostrada',o.series)}
        ${field('folio','Folio mostrado',o.folio)}

        ${field(
          'receiverName',
          'Cliente mostrado',
          o.receiverName
        )}

        ${field(
          'issuerName',
          'Emisor mostrado',
          o.issuerName
        )}

        ${field(
          'reference',
          'Folio proyecto / referencia interna',
          ''
        )}

        ${field(
          'notes',
          'Notas internas',
          ''
        )}

      </div>

      <h3 class="gxf-subtitle">
        Partidas del CFDI (${draft.items.length})
      </h3>

      <div class="gxf-items">

        <table class="gxf-table">

          <thead>
            <tr>
              <th># / Código SAT</th>
              <th>Descripción interna editable</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Precio unitario</th>
              <th>Importe interno</th>
              <th>Impuestos originales</th>
            </tr>
          </thead>

          <tbody>

            ${
              draft.items.map((it,i)=>`

                <tr>

                  <td>
                    ${i+1}

                    <small>
                      ${esc(it.code)}
                      /
                      ${esc(it.sku||'—')}
                    </small>
                  </td>

                  <td>
                    <input
                      type="text"
                      data-line="${i}"
                      data-field="description"
                      maxlength="2000"
                      value="${esc(it.description)}"
                    >
                  </td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      data-line="${i}"
                      data-field="quantity"
                      value="${it.quantity}"
                    >
                  </td>

                  <td>
                    ${esc(it.unit||it.unitCode)}
                  </td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      data-line="${i}"
                      data-field="unitPrice"
                      value="${it.unitPrice}"
                    >
                  </td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      data-line="${i}"
                      data-field="amount"
                      value="${it.amount}"
                    >
                  </td>

                  <td>
                    ${itemTax(it.taxes)}
                  </td>

                </tr>

              `).join('')
            }

          </tbody>
        </table>

      </div>

      <div class="gxf-tip">

        Se conservarán <strong>dos versiones</strong>:

        el concepto extraído del XML y el ajuste interno
        que captures.

        El importe fiscal de la factura no se recalcula
        al editar partidas internas.

        Otros módulos podrán elegir cuál utilizar.

      </div>

      <h3 class="gxf-subtitle">
        Impuestos y complementos
      </h3>

      <div class="gxf-grid">

        ${kv(
          'Traslados / Retenciones',
          itemTax(o.taxes)
        )}

        ${kv(
          'Complementos',
          o.complements.join(', ')||'—'
        )}

        ${kv(
          'Serie certificado emisor',
          o.certNumber
        )}

      </div>
    `;

    $('gxfSave').disabled=false;
  }

  // =================================================
  // CARGAR XML
  // =================================================

  async function onFile(file) {

    if(!file) return;

    $('gxfSave').disabled=true;

    try {

      if(file.size>2_000_000) {
        throw Error('Máximo 2 MB por factura.');
      }

      if(!/\.xml$/i.test(file.name)) {
        throw Error('Selecciona un archivo .xml.');
      }

      rawXml=await file.text();

      draft=parseXML(rawXml);

      preview();

      setMsg(
        'gxfImportMessage',
        'Listo para revisar y guardar. No se ha enviado nada a Supabase.'
      );

    } catch(e) {

      draft=null;
      rawXml='';

      $('gxfPreview').hidden=true;

      setMsg(
        'gxfImportMessage',
        e.message,
        true
      );
    }
  }

  // =================================================
  // GUARDAR FACTURA Y PARTIDAS
  // =================================================

  async function save() {

    if(!draft || !mayWrite) return;

    const display={};

    for(
      const input of
      $('gxfPreview').querySelectorAll('[data-head]')
    ) {

      display[input.dataset.head]=
        input.value.trim();
    }

    const items=draft.items.map(
      it=>({

        source:it,

        edited:{
          description:it.description,
          quantity:it.quantity,
          unitPrice:it.unitPrice,
          amount:it.amount
        }

      })
    );

    for(
      const input of
      $('gxfPreview').querySelectorAll('[data-line]')
    ) {

      const row=items[Number(input.dataset.line)];

      if(!row) {
        throw Error('Partida fuera de rango.');
      }

      const f=input.dataset.field;

      const isNum=f!=='description';

      if(
        isNum &&
        (
          input.value.trim()==='' ||
          !Number.isFinite(Number(input.value)) ||
          Number(input.value)<0
        )
      ) {

        setMsg(
          'gxfImportMessage',
          'Corrige los importes y cantidades de las partidas.',
          true
        );

        return;
      }

      row.edited[f]=
        isNum
          ? Number(input.value)
          : input.value.trim();
    }

    $('gxfSave').disabled=true;

    setMsg(
      'gxfImportMessage',
      'Guardando factura y '+items.length+' partidas…'
    );

    try {

      const {error}=await db.rpc(
        'gg_xml_import',
        {
          p_xml:rawXml,
          p_original:draft.original,
          p_display:display,
          p_items:items
        }
      );

      if(error) throw error;

      $('gxfImportDialog').close();

      draft=null;
      rawXml='';

      page=0;
      section='active';

      setActiveTab();

      await load();

      setMsg(
        'gxfMessage',
        'Factura y partidas guardadas correctamente.'
      );

    } catch(e) {

      setMsg(
        'gxfImportMessage',
        'No se guardó: '+e.message,
        true
      );

    } finally {

      $('gxfSave').disabled=false;
    }
  }

  // =================================================
  // FILTROS Y REGISTRO
  // =================================================

  function setActiveTab() {

    document
      .querySelectorAll('[data-gxf-section]')
      .forEach(
        b=>b.classList.toggle(
          'active',
          b.dataset.gxfSection===section
        )
      );
  }

  function stats(data) {

    $('gxfStats').innerHTML=[

      ['Facturas activas',data.active_count||0],

      ['Facturas ocultas',data.hidden_count||0],

      ['En este filtro',data.total||0],

      ['Página actual',page+1]

    ].map(
      ([l,v])=>

        '<article class="gxf-stat">'+
          '<small>'+esc(l)+'</small>'+
          '<strong>'+esc(v)+'</strong>'+
        '</article>'

    ).join('');
  }

  async function load() {

    const serial=++fetchVersion;

    setMsg(
      'gxfMessage',
      'Consultando registro de facturas…'
    );

    let data,error;

    try {

      ({
        data,
        error
      }=await db.rpc(
        'gg_xml_list',
        {
          p_hidden:section==='hidden',

          p_search:
            $('gxfSearch').value.trim(),

          p_from:
            $('gxfFrom').value||null,

          p_to:
            $('gxfTo').value||null,

          p_page:page
        }
      ));

    } catch(e) {

      if(serial===fetchVersion) {
        setMsg('gxfMessage',e.message,true);
      }

      return;
    }

    if(serial!==fetchVersion) return;

    if(error) {

      setMsg('gxfMessage',error.message,true);

      return;
    }

    rows=data?.items||[];

    total=Number(data?.total)||0;

    stats(data||{});

    $('gxfRows').innerHTML=
      rows.length

      ? rows.map(r=>`

          <tr>

            <td>

              <strong>
                ${esc(
                  (r.serie||'')+'-'+(r.folio||'')
                )}
              </strong>

              <small>
                ${esc(r.fiscal_uuid)}
              </small>

            </td>

            <td>${esc(r.receiver_name)}</td>

            <td>${esc(r.receiver_rfc)}</td>

            <td>${esc(r.issued_at)}</td>

            <td>

              <strong>
                ${money(r.total)}
              </strong>

              <small>
                ${esc(r.currency)}
              </small>

            </td>

            <td>
              ${esc(fmt(r.created_at))}
            </td>

            <td>
              ${esc(r.created_email)}
            </td>

            <td>

              <div class="gxf-actions">

                <button
                  class="gxf-btn"
                  data-detail="${esc(r.id)}"
                  type="button">
                  Ver
                </button>

                ${
                  mayWrite

                    ? `
                      <button
                        class="gxf-btn"
                        data-hide="${esc(r.id)}"
                        type="button">

                        ${
                          r.hidden
                            ? 'Restaurar'
                            : 'Ocultar'
                        }

                      </button>
                    `

                    : ''
                }

              </div>

            </td>

          </tr>

        `).join('')

      : `
          <tr>
            <td colspan="8" class="gxf-empty">
              Todavía no hay facturas en esta sección
              con esos filtros.
            </td>
          </tr>
        `;

    $('gxfPageText').textContent=
      total

        ? `${
            page*25+1
          }–${
            Math.min((page+1)*25,total)
          } de ${total}`

        : '0 resultados';

    $('gxfPrev').disabled=page===0;

    $('gxfNext').disabled=(page+1)*25>=total;

    setMsg(
      'gxfMessage',
      'Haz clic en «Ver» para consultar conceptos y descargar el XML original. Filtro por fecha de carga.'
    );
  }

  // =================================================
  // PARTIDAS DEL REGISTRO
  // =================================================

  function itemList(record) {

    return (
      '<div class="gxf-items gxf-detail-items">' +
      '<table class="gxf-table">' +

      '<thead><tr>'+

      '<th># / Clave SAT</th>'+
      '<th>Descripción (interna)</th>'+
      '<th>Cantidad</th>'+
      '<th>Unidad</th>'+
      '<th>Precio</th>'+
      '<th>Importe</th>'+
      '<th>Impuestos originales</th>'+

      '</tr></thead>'+

      '<tbody>'+

      record.items.map(r=>{

        const s=r.original_data||{};

        const e=r.edited_data||{};

        return `

          <tr>

            <td>

              ${r.line_no}

              <small>
                ${esc(s.code)}
              </small>

            </td>

            <td class="gxf-description">

              ${esc(e.description??s.description)}

              ${
                e.description!==s.description

                  ? '<small>Original: '+
                    esc(s.description)+
                    '</small>'

                  : ''
              }

            </td>

            <td>
              ${esc(e.quantity??s.quantity)}
            </td>

            <td>
              ${esc(s.unit||s.unitCode)}
            </td>

            <td>
              ${money(e.unitPrice??s.unitPrice)}
            </td>

            <td>
              ${money(e.amount??s.amount)}
            </td>

            <td>
              ${itemTax(s.taxes||[])}
            </td>

          </tr>

        `;

      }).join('')+

      '</tbody></table></div>'
    );
  }

  // =================================================
  // POPUP DE FACTURA GUARDADA
  // =================================================

  async function showDetail(id) {

    setMsg(
      'gxfMessage',
      'Abriendo factura…'
    );

    const {data,error}=await db.rpc(
      'gg_xml_detail',
      {
        p_id:id
      }
    );

    if(error) {

      setMsg(
        'gxfMessage',
        error.message,
        true
      );

      return;
    }

    currentDetail=data;

    const a=data.invoice;

    const o=a.original_data||{};

    const d=a.display_data||{};

    $('gxfDetail').innerHTML=`

      <div class="gxf-preview-head">

        <h3 class="gxf-subtitle">
          ${esc(d.series??o.series)}-${esc(d.folio??o.folio)}
        </h3>

        <strong class="gxf-amount">
          ${money(a.total)}
        </strong>

      </div>

      <div class="gxf-grid">

        ${kv('UUID',a.fiscal_uuid)}
        ${kv('Fecha de emisión',o.issuedAt)}
        ${kv('Timbrado',o.stampedAt)}

        ${kv(
          'Emisor',
          d.issuerName??o.issuerName
        )}

        ${kv('RFC emisor',a.issuer_rfc)}

        ${kv(
          'Receptor',
          d.receiverName??o.receiverName
        )}

        ${kv('RFC receptor',a.receiver_rfc)}

        ${kv(
          'Subtotal fiscal',
          money(o.subtotal)
        )}

        ${kv(
          'IVA / otros traslados',
          money(o.taxTransferred)
        )}

        ${kv(
          'Retenciones',
          money(o.taxWithheld)
        )}

        ${kv(
          'Total fiscal',
          money(a.total)
        )}

        ${kv('Moneda',a.currency)}

        ${kv(
          'Método / Forma',
          o.paymentMethod+' / '+o.paymentForm
        )}

        ${kv('Uso CFDI',o.use)}
        ${kv('Fecha de carga',fmt(a.created_at))}
        ${kv('Cargada por',a.created_email)}
        ${kv('Referencia interna',d.reference||'—')}
        ${kv('Notas',d.notes||'—')}

      </div>

      <div class="gxf-tip">

        <strong>
          Documento original intacto.
        </strong>

        Los datos ajustados para uso interno
        se muestran como tales.

        Puedes descargar el XML original
        para revisar el documento fiscal.

      </div>

      <h3 class="gxf-subtitle">
        Partidas (${data.items.length})
      </h3>

      ${itemList(data)}

      <h3 class="gxf-subtitle">
        Impuestos y timbrado
      </h3>

      <div class="gxf-grid">

        ${kv(
          'Impuestos del CFDI',
          itemTax(o.taxes||[])
        )}

        ${kv(
          'Complementos',
          (o.complements||[]).join(', ')||'—'
        )}

        ${kv(
          'Certificado emisor',
          o.certNumber
        )}

        ${kv(
          'Certificado SAT',
          o.satCertNumber
        )}

        ${kv(
          'PAC',
          o.certifierRfc
        )}

      </div>
    `;

    $('gxfDetailDialog').showModal();
  }

  // =================================================
  // OCULTAR / RESTAURAR
  // =================================================

  async function toggleHide(id) {

    const hide=section==='active';

    if(
      !confirm(
        hide
          ? '¿Ocultar esta factura del registro activo?'
          : '¿Restaurar esta factura al registro activo?'
      )
    ) {
      return;
    }

    const {error}=await db.rpc(
      'gg_xml_set_hidden',
      {
        p_id:id,
        p_hidden:hide
      }
    );

    if(error) {

      setMsg(
        'gxfMessage',
        error.message,
        true
      );

      return;
    }

    await load();
  }

  // =================================================
  // DESCARGAR XML ORIGINAL
  // =================================================

  function downloadOriginal() {

    if(!currentDetail?.invoice?.original_xml) {
      return;
    }

    const a=currentDetail.invoice;

    const objectUrl=URL.createObjectURL(
      new Blob(
        [a.original_xml],
        {
          type:'application/xml;charset=utf-8'
        }
      )
    );

    const link=document.createElement('a');

    link.href=objectUrl;

    link.download=
      'CFDI_'+a.fiscal_uuid+'.xml';

    document.body.append(link);

    link.click();

    link.remove();

    setTimeout(
      ()=>URL.revokeObjectURL(objectUrl),
      1000
    );
  }

  // =================================================
  // INICIALIZAR
  // =================================================

  async function init() {

    if(!db) {

      setMsg(
        'gxfMessage',
        'Error: cliente Supabase no cargado.',
        true
      );

      return;
    }

    const {data,error}=await db.auth.getUser();

    if(error||!data?.user) {

      location.replace('index.html');

      return;
    }

    // Permisos de lectura y escritura.

    const [r,w]=await Promise.all([

      db.rpc(
        'gg_xml_allowed',
        {p_write:false}
      ),

      db.rpc(
        'gg_xml_allowed',
        {p_write:true}
      )

    ]);

    if(r.error||r.data!==true) {

      setMsg(
        'gxfMessage',
        'Tu cuenta no tiene permiso para consultar XML y Facturas. Solicita acceso a Finanzas.',
        true
      );

      $('gxfAdd').hidden=true;

      return;
    }

    mayWrite=!w.error&&w.data===true;

    $('gxfAdd').hidden=!mayWrite;

    // Tema.

    try {

      theme(
        localStorage.getItem('gg-xml-theme')||
        'dark'
      );

    } catch(_) {

      theme('dark');
    }

    $('gxfTheme').addEventListener(
      'click',
      ()=>theme(
        document.documentElement.dataset.gxfTheme==='dark'
          ? 'light'
          : 'dark'
      )
    );

    // Abrir importación.

    $('gxfAdd').addEventListener(
      'click',
      ()=>{

        $('gxfFile').value='';

        $('gxfPreview').hidden=true;

        $('gxfPreview').replaceChildren();

        $('gxfSave').disabled=true;

        draft=null;
        rawXml='';

        setMsg(
          'gxfImportMessage',
          'Selecciona un XML para empezar.'
        );

        $('gxfImportDialog').showModal();
      }
    );

    // Cerrar ventanas.

    document
      .querySelectorAll('[data-gxf-close]')
      .forEach(
        b=>b.addEventListener(
          'click',
          ()=>$(

            b.dataset.gxfClose==='import'
              ? 'gxfImportDialog'
              : 'gxfDetailDialog'

          ).close()
        )
      );

    // Zona de arrastre.

    $('gxfDrop').addEventListener(
      'click',
      ()=>$('gxfFile').click()
    );

    $('gxfDrop').addEventListener(
      'keydown',
      e=>{

        if(
          e.key==='Enter' ||
          e.key===' '
        ) {

          e.preventDefault();

          $('gxfFile').click();
        }
      }
    );

    $('gxfFile').addEventListener(
      'change',
      e=>onFile(e.target.files?.[0])
    );

    $('gxfDrop').addEventListener(
      'dragover',
      e=>{

        e.preventDefault();

        $('gxfDrop').classList.add('dragging');
      }
    );

    $('gxfDrop').addEventListener(
      'dragleave',
      ()=>$('gxfDrop').classList.remove('dragging')
    );

    $('gxfDrop').addEventListener(
      'drop',
      e=>{

        e.preventDefault();

        $('gxfDrop').classList.remove('dragging');

        onFile(e.dataTransfer.files?.[0]);
      }
    );

    // Guardar.

    $('gxfSave').addEventListener(
      'click',
      ()=>save().catch(
        e=>setMsg(
          'gxfImportMessage',
          e.message,
          true
        )
      )
    );

    $('gxfDownloadXml').addEventListener(
      'click',
      downloadOriginal
    );

    // Acciones del registro.

    $('gxfRows').addEventListener(
      'click',
      e=>{

        const view=e.target.closest(
          '[data-detail]'
        );

        const hide=e.target.closest(
          '[data-hide]'
        );

        if(view) {
          showDetail(view.dataset.detail);
        }

        if(hide) {
          toggleHide(hide.dataset.hide);
        }
      }
    );

    // Activas / Ocultas.

    document
      .querySelectorAll('[data-gxf-section]')
      .forEach(
        b=>b.addEventListener(
          'click',
          ()=>{

            section=b.dataset.gxfSection;

            page=0;

            setActiveTab();

            load();
          }
        )
      );

    // Filtros.

    $('gxfRefresh').addEventListener(
      'click',
      load
    );

    $('gxfClear').addEventListener(
      'click',
      ()=>{

        $('gxfSearch').value='';
        $('gxfFrom').value='';
        $('gxfTo').value='';

        page=0;

        load();
      }
    );

    $('gxfSearch').addEventListener(
      'input',
      ()=>{

        clearTimeout(searchTimer);

        searchTimer=setTimeout(
          ()=>{

            page=0;

            load();
          },
          300
        );
      }
    );

    ['gxfFrom','gxfTo'].forEach(
      id=>$(id).addEventListener(
        'change',
        ()=>{

          page=0;

          load();
        }
      )
    );

    // Paginación.

    $('gxfPrev').addEventListener(
      'click',
      ()=>{

        page=Math.max(0,page-1);

        load();
      }
    );

    $('gxfNext').addEventListener(
      'click',
      ()=>{

        page++;

        load();
      }
    );

    // Sesión.

    db.auth.onAuthStateChange(
      ev=>{

        if(ev==='SIGNED_OUT') {
          location.replace('index.html');
        }
      }
    );

    await load();
  }

  if(document.readyState==='loading') {

    document.addEventListener(
      'DOMContentLoaded',
      ()=>init().catch(
        e=>setMsg(
          'gxfMessage',
          e.message,
          true
        )
      ),
      {once:true}
    );

  } else {

    init().catch(
      e=>setMsg(
        'gxfMessage',
        e.message,
        true
      )
    );
  }
}

// =====================================================
// 4. GENERAR JAVASCRIPT
// =====================================================

const js=
  '('+browserApp.toString()+')();\n';

// =====================================================
// 5. VALIDACIÓN DE ARCHIVOS
// =====================================================

const existing=[
  files.system,
  files.routes,
  files.cssSystem,
  files.vite
];

const fresh=[
  files.page,
  files.css,
  files.js
];

for(const file of existing) {

  if(!fs.existsSync(path.join(root,file))) {

    throw Error(
      'Falta '+file+
      '. Ejecuta junto a sistema.html.'
    );
  }
}

for(const file of fresh) {

  if(fs.existsSync(path.join(root,file))) {

    throw Error(
      'Ya existe '+file+
      '. No se sobrescribe.'
    );
  }
}

const originals=new Map();
const edited=new Map();

for(const f of existing) {

  const v=fs.readFileSync(
    path.join(root,f),
    'utf8'
  );

  if(v.includes(mark)) {

    throw Error(
      'El módulo ya se encuentra instalado.'
    );
  }

  originals.set(f,v);

  edited.set(
    f,
    v.replace(/\r\n/g,'\n')
  );
}

// =====================================================
// 6. REEMPLAZOS CONTROLADOS
// =====================================================

function replaceOnce(file,regex,value,label) {

  const text=edited.get(file);

  const hits=[
    ...text.matchAll(
      new RegExp(
        regex.source,

        regex.flags.includes('g')
          ? regex.flags
          : regex.flags+'g'
      )
    )
  ];

  if(hits.length!==1) {

    throw Error(
      label+
      ': esperaba 1 coincidencia, encontré '+
      hits.length+
      '. Sin cambios.'
    );
  }

  edited.set(
    file,
    text.replace(regex,value)
  );
}

// =====================================================
// 7. TARJETA DE SISTEMA CENTRAL
// =====================================================

const originalCards=[
  ...edited.get(files.system).matchAll(
    /data-module="([^"]+)"/g
  )
].length;

if(originalCards<5||originalCards>20) {

  throw Error(
    'Cantidad inesperada de tarjetas: '+
    originalCards
  );
}

const next=String(
  originalCards+1
).padStart(2,'0');

const card=String.raw`

<!-- GG_XML_FACTURAS_20261028_V1 -->

<div class="module-shell slot-xml"
     style="--delay:.46s">

  <button
    type="button"
    class="module-card card-xml"
    data-module="xml-facturas"
  >

    <span class="card-top">

      <span class="card-icon">

        <svg viewBox="0 0 24 24"
             aria-hidden="true">

          <path
            d="M6 2h9l4 4v16H6zM15 2v5h5M9 12h7M9 16h5"
          />

        </svg>

      </span>

      <span class="card-serial">
        ${next} / ${next}
      </span>

    </span>

    <span class="card-content">

      <span class="card-eyebrow">
        ARCHIVO FISCAL · CFDI
      </span>

      <strong class="card-title">
        XML y Facturas
      </strong>

      <span class="card-description">
        Importación de CFDI, conceptos
        y registro de facturas.
      </span>

    </span>

    <span class="card-footer">

      <span class="card-meta">
        DOCUMENTOS · XML
      </span>

      <span class="card-arrow">
        ↗
      </span>

    </span>

  </button>

</div>
`;

replaceOnce(

  files.system,

  /(\s*)<\/div>\s*<\/section>\s*<footer class="site-footer">/,

  (_whole,space)=>
    '\n'+
    card+
    space+
    '</div>\n    </section>\n\n    <footer class="site-footer">',

  'Ubicación de tarjeta'

);

let sys=edited.get(files.system);

sys=sys.replace(

  /(<span class="card-serial">\s*\d{2} \/ )\d{2}(\s*<\/span>)/g,

  (_a,b,c)=>b+next+c

);

sys=sys.replace(
  /(·\s*)\d+\s+módulos/,
  '$1'+next+' módulos'
);

edited.set(files.system,sys);

// =====================================================
// 8. RUTA EN SISTEMA.JS
// =====================================================

replaceOnce(

  files.routes,

  /const ROUTES = Object\.freeze\(\{/,

  `const ROUTES = Object.freeze({

    "xml-facturas": {
      name:"XML y Facturas",
      url:"xml-facturas.html"
    },`,

  'Ruta en sistema.js'

);

// =====================================================
// 9. ENTRADA EN VITE
// =====================================================

replaceOnce(

  files.vite,

  /(\byo\s*:\s*resolve\(\s*__dirname\s*,\s*["']yo\.html["']\s*\))/,

  '$1,\n'+
  '                xmlFacturas: resolve(__dirname,"xml-facturas.html")',

  'Entrada Vite'

);

// =====================================================
// 10. ESTILO DE LA TARJETA
// =====================================================

edited.set(

  files.cssSystem,

  edited.get(files.cssSystem)+String.raw`

/* GG_XML_FACTURAS_20261028_V1 */

.slot-xml {
  grid-column:span 6;
  min-height:255px;
}

.card-xml {
  background:
    radial-gradient(
      circle at 90% 15%,
      rgba(95,171,202,.18),
      transparent 53%
    ),
    rgba(27,43,56,.28);
}

.card-xml .card-title {
  font-size:clamp(23px,2.4vw,31px);
}

@media(max-width:1040px) {
  .slot-xml {
    grid-column:auto;
    min-height:255px;
  }
}

@media(max-width:690px) {
  .slot-xml {
    min-height:230px;
  }
}
`

);

// =====================================================
// 11. VALIDACIONES DE SINTAXIS
// =====================================================

new vm.Script(
  js,
  {
    filename:files.js
  }
);

new vm.Script(
  edited.get(files.routes),
  {
    filename:files.routes
  }
);

if(

  !edited.get(files.system).includes(
    'data-module="xml-facturas"'
  )

  ||

  !edited.get(files.vite).includes(
    'xml-facturas.html'
  )

) {

  throw Error(
    'Validación final falló.'
  );
}

// =====================================================
// 12. INSTALACIÓN SIN BACKUPS AUTOMÁTICOS
// =====================================================

const written=[];
const created=[];

try {

  // Crear archivos nuevos.

  for(
    const [f,contents] of [

      [files.page,html],
      [files.css,css],
      [files.js,js]

    ]
  ) {

    const p=path.join(root,f);

    fs.mkdirSync(
      path.dirname(p),
      {recursive:true}
    );

    fs.writeFileSync(
      p,
      contents,
      {flag:'wx'}
    );

    created.push(p);
  }

  // Modificar archivos existentes.

  for(const [f,v] of edited) {

    const p=path.join(root,f);

    const old=originals.get(f);

    const newline=
      old.includes('\r\n')
        ? '\r\n'
        : '\n';

    const temp=
      p+'.ggxml-'+process.pid+'.tmp';

    fs.writeFileSync(
      temp,
      v.replace(/\n/g,newline),
      {flag:'wx'}
    );

    try {

      fs.renameSync(temp,p);

    } catch(e) {

      fs.rmSync(
        temp,
        {force:true}
      );

      throw e;
    }

    written.push(f);
  }

} catch(e) {

  // Restaurar originales de esta ejecución.

  for(const f of written.reverse()) {

    try {

      fs.writeFileSync(
        path.join(root,f),
        originals.get(f)
      );

    } catch(r) {

      console.error(
        'No se pudo restaurar '+f,
        r.message
      );
    }
  }

  // Retirar archivos nuevos de instalación fallida.

  for(const p of created.reverse()) {

    try {

      fs.rmSync(
        p,
        {force:true}
      );

    } catch(_) {}
  }

  throw e;
}

// =====================================================
// 13. TERMINADO
// =====================================================

console.log(
  '\n✅ XML y Facturas instalado.'
);

console.log(
  '✅ Nueva tarjeta en Sistema Central.'
);

console.log(
  '✅ HTML, CSS, JavaScript y entrada Vite.'
);

console.log(
  '✅ Sin archivos de respaldo .bak.'
);

console.log(
  '\nPrueba: npm run dev y npm run build.'
);
