
"use strict";

/*
  GG + LO · CORRECTIVO DIRECCIÓN / LOCALES V2

  Ejecutar:
  node corregir-direccion-locales.cjs

  Requiere el instalador anterior de Locales.
  Sin archivos .bak.
  Sin dependencias nuevas.
  Recuperación en memoria si falla la escritura.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = process.cwd();

const gg = fs.existsSync(
  path.join(root, "sistema.html")
);

const lo = fs.existsSync(
  path.join(root, "public/dashboard.html")
);

if (gg === lo) {
  throw Error(
    "Ejecuta este archivo en la raíz de GG o de LO."
  );
}

const out = new Map();

const exists = p =>
  fs.existsSync(path.join(root, p));

function read(p) {
  if (!exists(p)) {
    throw Error(
      "Falta " + p +
      ". Primero instala Locales y Departamentos V1."
    );
  }

  return fs.readFileSync(
    path.join(root, p),
    "utf8"
  );
}

function put(p, source) {
  out.set(p, source);
}

function link(html, href) {
  const tag =
    '<link rel="stylesheet" href="' +
    href + '">';

  if (html.includes('href="' + href + '"')) {
    return html;
  }

  if (!html.includes("</head>")) {
    throw Error("Falta </head>: " + href);
  }

  return html.replace(
    "</head>",
    tag + "\n</head>"
  );
}

function endTag(html, at, tag) {
  const regex = new RegExp(
    "<\\/?" + tag + "\\b[^>]*>",
    "gi"
  );

  regex.lastIndex = at;

  let depth = 0;
  let match;

  while ((match = regex.exec(html))) {
    depth += /^<\//.test(match[0]) ? -1 : 1;

    if (depth === 0) {
      return match.index;
    }
  }

  throw Error(
    "No pude cerrar " + tag + " desde " + at
  );
}

/* =====================================================
   GRUPO GUTIÉRREZ · ÓRBITA DE DIEZ MÓDULOS
===================================================== */

const orbitGG = String.raw`
/* GG · 10 MÓDULOS · ÓRBITA RESPONSIVE V2 */

body .workspace {
  position: relative !important;
  min-height: 940px !important;
  overflow: visible !important;
  padding: 0 !important;
}

body .workspace .module-grid {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  transform: none !important;
  pointer-events: none !important;
}

body .workspace .module-shell,
body .workspace .module-shell:nth-child(n) {
  position: absolute !important;
  left: var(--ox) !important;
  top: var(--oy) !important;
  right: auto !important;
  bottom: auto !important;
  margin: 0 !important;
  grid-area: auto !important;
  translate: none !important;
  transform: translate(-50%, -50%) !important;
  width: clamp(155px, 16vw, 215px) !important;
  height: 126px !important;
  min-height: 0 !important;
  pointer-events: auto !important;
  z-index: 9 !important;
}

body .workspace .module-shell .module-card {
  height: 100% !important;
  width: 100% !important;
  min-height: 0 !important;
  padding: 14px !important;
}

body .workspace .module-shell .card-title {
  font-size: clamp(13px, 1.3vw, 18px) !important;
  line-height: 1.2 !important;
  overflow-wrap: anywhere;
}

body .workspace .hero {
  position: absolute !important;
  top: 51% !important;
  left: 50% !important;
  right: auto !important;
  bottom: auto !important;
  transform: translate(-50%, -50%) !important;
  width: min(420px, 43%) !important;
  text-align: center !important;
  z-index: 4 !important;
  pointer-events: none !important;
}

body .workspace .workspace-heading {
  position: absolute !important;
  top: 4px !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 12 !important;
}

body .workspace .gg-orbit {
  position: absolute !important;
  inset: 6% 7% !important;
  width: auto !important;
  height: auto !important;
  opacity: .55 !important;
  pointer-events: none !important;
}

/* Posiciones alrededor del título central */

body .workspace .slot-sales {
  --ox: 50%;
  --oy: 8%;
}

body .workspace .slot-people {
  --ox: 74%;
  --oy: 17%;
}

body .workspace .slot-warehouse {
  --ox: 88%;
  --oy: 37%;
}

body .workspace .slot-payments {
  --ox: 88%;
  --oy: 63%;
}

body .workspace .slot-finance {
  --ox: 74%;
  --oy: 83%;
}

body .workspace .slot-collections {
  --ox: 50%;
  --oy: 92%;
}

body .workspace .slot-profile-notif {
  --ox: 26%;
  --oy: 83%;
}

body .workspace .slot-xml {
  --ox: 12%;
  --oy: 63%;
}

body .workspace .slot-sistemas {
  --ox: 12%;
  --oy: 37%;
}

body .workspace .slot-direccion {
  --ox: 26%;
  --oy: 17%;
}

body .workspace .slot-direccion .module-card {
  border: 1px solid #80d8f477 !important;
  background:
    linear-gradient(
      125deg,
      #7dd8ef22,
      #ffb87e16
    ),
    #17202a !important;
}

/* Ventanas medianas: órbita ovalada */

@media (max-width: 1020px) {
  body .workspace {
    min-height: 1050px !important;
  }

  body .workspace .module-shell,
  body .workspace .module-shell:nth-child(n) {
    width: min(43vw, 245px) !important;
    height: 120px !important;
  }

  body .workspace .hero {
    top: 55% !important;
    width: min(500px, 88%) !important;
  }

  body .workspace .slot-sales {
    --ox: 27%;
    --oy: 9%;
  }

  body .workspace .slot-people {
    --ox: 73%;
    --oy: 9%;
  }

  body .workspace .slot-warehouse {
    --ox: 27%;
    --oy: 24%;
  }

  body .workspace .slot-payments {
    --ox: 73%;
    --oy: 24%;
  }

  body .workspace .slot-finance {
    --ox: 27%;
    --oy: 38%;
  }

  body .workspace .slot-collections {
    --ox: 73%;
    --oy: 38%;
  }

  body .workspace .slot-profile-notif {
    --ox: 27%;
    --oy: 75%;
  }

  body .workspace .slot-xml {
    --ox: 73%;
    --oy: 75%;
  }

  body .workspace .slot-sistemas {
    --ox: 27%;
    --oy: 90%;
  }

  body .workspace .slot-direccion {
    --ox: 73%;
    --oy: 90%;
  }
}

@media (max-width: 500px) {
  body .workspace {
    min-height: 1010px !important;
  }

  body .workspace .module-shell,
  body .workspace .module-shell:nth-child(n) {
    height: 109px !important;
    padding: 0 !important;
  }

  body .workspace .module-shell .module-card {
    padding: 10px !important;
  }

  body .workspace .module-shell .card-title {
    font-size: 13px !important;
  }

  body .workspace .module-shell .card-description {
    font-size: 10px !important;
    line-height: 1.15 !important;
  }

  body .workspace .hero {
    top: 55% !important;
    width: 94% !important;
  }
}
`;

/* =====================================================
   LO · ÓRBITA DE NUEVE MÓDULOS
===================================================== */

const orbitLO = String.raw`
/* LO · 9 MÓDULOS · ÓRBITA CIRCULAR */

body .lo-orbit {
  position: relative !important;
  display: block !important;
  grid-template-columns: none !important;
  grid-template-rows: none !important;
  min-height: 900px !important;
  height: 900px !important;
  width: 100% !important;
  padding: 0 !important;
  transform: none !important;
  overflow: visible !important;
}

body .lo-orbit .lo-module-card,
body .lo-orbit .lo-module-card:nth-child(n) {
  position: absolute !important;
  left: var(--ox) !important;
  top: var(--oy) !important;
  right: auto !important;
  bottom: auto !important;
  transform: translate(-50%, -50%) !important;
  translate: none !important;
  margin: 0 !important;
  grid-column: auto !important;
  grid-row: auto !important;
  width: clamp(160px, 17vw, 220px) !important;
  min-width: 0 !important;
  min-height: 115px !important;
  height: 130px !important;
  z-index: 9 !important;
}

body .lo-orbit .lo-orbit-center {
  position: absolute !important;
  left: 50% !important;
  top: 51% !important;
  right: auto !important;
  bottom: auto !important;
  transform: translate(-50%, -50%) !important;
  translate: none !important;
  margin: 0 !important;
  grid-area: auto !important;
  z-index: 5 !important;
  pointer-events: none !important;
}

body .lo-orbit .lo-orbit-ring {
  pointer-events: none !important;
}

/* Posiciones de las nueve tarjetas */

body .lo-orbit .lo-module-1 {
  --ox: 50%;
  --oy: 9%;
}

body .lo-orbit .lo-module-2 {
  --ox: 77%;
  --oy: 18%;
}

body .lo-orbit .lo-module-3 {
  --ox: 88%;
  --oy: 39%;
}

body .lo-orbit .lo-module-4 {
  --ox: 82%;
  --oy: 68%;
}

body .lo-orbit .lo-module-5 {
  --ox: 65%;
  --oy: 88%;
}

body .lo-orbit .lo-module-6 {
  --ox: 35%;
  --oy: 88%;
}

body .lo-orbit .lo-module-7 {
  --ox: 18%;
  --oy: 68%;
}

body .lo-orbit .lo-module-8 {
  --ox: 12%;
  --oy: 39%;
}

body .lo-orbit .lo-module-9 {
  --ox: 23%;
  --oy: 18%;
}

body .lo-orbit #localesDepartamentosButton {
  border-color: #8cc8eb !important;
  background:
    linear-gradient(
      145deg,
      #eaf7ff,
      #fff2e7
    ) !important;
}

/* Órbita para ventanas medianas y pequeñas */

@media (max-width: 1000px) {
  body .lo-orbit {
    height: 1050px !important;
    min-height: 1050px !important;
  }

  body .lo-orbit .lo-module-card,
  body .lo-orbit .lo-module-card:nth-child(n) {
    width: min(43vw, 245px) !important;
    height: 116px !important;
    min-height: 0 !important;
  }

  body .lo-orbit .lo-orbit-center {
    top: 57% !important;
  }

  body .lo-orbit .lo-module-1 {
    --ox: 50%;
    --oy: 8%;
  }

  body .lo-orbit .lo-module-2 {
    --ox: 27%;
    --oy: 22%;
  }

  body .lo-orbit .lo-module-3 {
    --ox: 73%;
    --oy: 22%;
  }

  body .lo-orbit .lo-module-4 {
    --ox: 27%;
    --oy: 36%;
  }

  body .lo-orbit .lo-module-5 {
    --ox: 73%;
    --oy: 36%;
  }

  body .lo-orbit .lo-module-6 {
    --ox: 27%;
    --oy: 76%;
  }

  body .lo-orbit .lo-module-7 {
    --ox: 73%;
    --oy: 76%;
  }

  body .lo-orbit .lo-module-8 {
    --ox: 27%;
    --oy: 90%;
  }

  body .lo-orbit .lo-module-9 {
    --ox: 73%;
    --oy: 90%;
  }
}

@media (max-width: 520px) {
  body .lo-orbit {
    height: 990px !important;
    min-height: 990px !important;
  }

  body .lo-orbit .lo-module-card,
  body .lo-orbit .lo-module-card:nth-child(n) {
    height: 103px !important;
    font-size: 12px !important;
    padding: 10px !important;
  }

  body .lo-orbit .lo-module-copy strong {
    font-size: 12px !important;
    overflow-wrap: anywhere;
  }

  body .lo-orbit .lo-module-copy small {
    font-size: 10px !important;
  }
}
`;

/* =====================================================
   DIRECCIÓN Y LOCALES · ACABADO VISUAL
===================================================== */

const polish = String.raw`
/* LOCALES Y DEPARTAMENTOS · REFRESCO PREMIUM V2 */

body.ld-body {
  background:
    radial-gradient(
      ellipse at 0% 0%,
      #e9f4fc 0,
      transparent 40%
    ),
    radial-gradient(
      ellipse at 95% 10%,
      #fff1e6 0,
      transparent 30%
    ),
    #f8fafc !important;
  color: #243e53 !important;
  font-size: 15px;
}

.ld-header {
  background: #fff !important;
  border-bottom: 1px solid #e5edf3 !important;
}

.ld-header-inner {
  min-height: 86px !important;
}

.ld-brand {
  letter-spacing: -.045em;
  font-weight: 850 !important;
  color: #1d537e !important;
}

.ld-main {
  padding-top: 46px !important;
}

.ld-hero {
  margin-bottom: 28px !important;
}

.ld-hero h1 {
  font-weight: 820 !important;
  letter-spacing: -.06em !important;
  color: #193f5e;
}

.ld-hero p {
  font-size: 16px !important;
  color: #728697 !important;
}

.ld-toolbar {
  gap: 12px !important;
}

.ld-btn {
  border-radius: 12px !important;
  min-height: 46px;
  transition:
    transform .2s,
    box-shadow .2s !important;
}

.ld-primary {
  background: #245d88 !important;
  border-color: #245d88 !important;
  color: #fff !important;
}

.ld-btn:hover {
  transform: translateY(-2px);
}

.ld-card,
.ld-modal,
.ld-panel {
  border: 1px solid #e1eaf0 !important;
  box-shadow: 0 12px 42px #1e507d0a !important;
}

.ld-card {
  border-radius: 22px !important;
  padding: 23px !important;
}

.ld-card h2 {
  font-size: 22px !important;
  font-weight: 750;
}

.ld-art {
  background:
    linear-gradient(145deg, #f0f7fc, #fff5ed) !important;
  border-radius: 18px !important;
}

.ld-meta {
  background: #f5f9fc !important;
  border-radius: 14px !important;
  padding: 16px !important;
}

.ld-modal {
  border-radius: 24px !important;
}

.ld-modal-head {
  background: #fff !important;
}

.ld-modal-body {
  font-size: 15px !important;
}

.ld-form input,
.ld-form select,
.ld-form textarea {
  min-height: 48px !important;
  font-size: 16px !important;
}

.ld-person-tile {
  border-radius: 18px !important;
  transition: transform .2s;
}

.ld-person-tile:hover {
  transform: translateY(-2px);
}

.ld-drop {
  min-height: 125px;
  border-radius: 17px !important;
}

.ld-task-card {
  border-radius: 17px !important;
}

.ld-msg {
  z-index: 2147483647 !important;
}

#ldFixError {
  padding: 12px 15px;
  margin: 12px 0;
  background: #fff0ed;
  border: 1px solid #edbbb3;
  border-radius: 11px;
  color: #9b392f;
  font-weight: 650;
}

/* Dirección minimalista */

.dir-main {
  max-width: 1150px;
  margin: 0 auto;
  padding: 70px 22px;
}

.dir-kicker {
  color: #447ca6;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .22em;
  text-transform: uppercase;
}

.dir-title {
  font-size: clamp(54px, 8vw, 96px);
  line-height: 1.05;
  margin: 14px 0;
  letter-spacing: -.07em;
  color: #173e5d;
}

.dir-title em {
  font-style: normal;
  color: #e6a06e;
}

.dir-desc {
  font-size: 18px;
  line-height: 1.7;
  color: #687f91;
  max-width: 660px;
}

.dir-divider {
  height: 1px;
  background: #e0eaf1;
  margin: 50px 0 35px;
}

.dir-feature {
  display: flex;
  align-items: center;
  gap: 35px;
  background: #fff;
  border: 1px solid #dce8f1;
  border-radius: 26px;
  padding: 35px;
  box-shadow: 0 16px 48px #1c51710b;
  text-decoration: none;
  color: inherit;
  transition: transform .2s;
}

.dir-feature:hover {
  transform: translateY(-4px);
}

.dir-art {
  width: 205px;
  max-width: 35%;
  flex: none;
  border-radius: 22px;
  background:
    linear-gradient(140deg, #eaf6fc, #fff0e4);
  padding: 20px;
}

.dir-art svg {
  width: 100%;
  height: auto;
}

.dir-feature h2 {
  font-size: clamp(25px, 4vw, 36px);
  letter-spacing: -.045em;
  color: #1e4a6a;
  margin: 9px 0;
}

.dir-feature p {
  color: #728799;
  line-height: 1.6;
}

.dir-go {
  display: inline-block;
  margin-top: 12px;
  background: #245e8b;
  border-radius: 12px;
  padding: 14px 20px;
  color: white;
  font-weight: 750;
}

.dir-soon {
  margin-top: 18px;
  color: #9aa9b4;
  font-size: 14px;
}

@media (max-width: 600px) {
  .dir-main {
    padding: 40px 16px;
  }

  .dir-feature {
    padding: 22px;
    flex-direction: column;
    align-items: flex-start;
  }

  .dir-art {
    max-width: 100%;
    width: 100%;
    max-height: 210px;
  }

  .ld-card {
    padding: 16px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ld-btn,
  .ld-card,
  .dir-feature {
    transition: none !important;
  }
}
`;

/* =====================================================
   NUEVO HTML DE DIRECCIÓN
===================================================== */

const direction = String.raw`
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta
    name="viewport"
    content="width=device-width,initial-scale=1"
  >

  <title>Dirección · Grupo Gutiérrez</title>

  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
    rel="stylesheet"
  >

  <link rel="stylesheet" href="css/ld-ui.css">
</head>

<body class="ld-body">

  <header class="ld-header">
    <div class="ld-wrap ld-header-inner">

      <a class="ld-brand" href="sistema.html">
        GRUPO GUTIÉRREZ <span>✳</span>
      </a>

      <a class="ld-back" href="sistema.html">
        ← Volver a módulos
      </a>

    </div>
  </header>

  <main id="dirRoot" class="dir-main">
    <div class="ld-empty">
      Verificando permiso de Dirección…
    </div>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase-client.js"></script>
  <script src="js/ld-direccion-v2.js"></script>

</body>
</html>
`;

/* =====================================================
   DIRECCIÓN · VERIFICACIÓN DE ACCESO Y MENÚ
===================================================== */

const directionJS = String.raw`
(async () => {
  "use strict";

  const root =
    document.getElementById("dirRoot");

  try {
    const db = window.ggSupabase;

    if (!db) {
      throw Error(
        "No se encontró la conexión a Supabase."
      );
    }

    const {
      data: user,
      error: authError
    } = await db.auth.getUser();

    if (authError || !user?.user) {
      location.replace("index.html");
      return;
    }

    const { data: allowed, error } =
      await db.rpc(
        "gg_module_access",
        { p_module: "direccion" }
      );

    if (error) throw error;

    if (allowed !== true) {
      root.replaceChildren();

      const title =
        document.createElement("h1");

      title.className = "dir-title";
      title.textContent = "Acceso restringido";

      const description =
        document.createElement("p");

      description.className = "dir-desc";
      description.textContent =
        "Solicita autorización al departamento de Sistemas.";

      const button =
        document.createElement("button");

      button.className = "ld-btn ld-primary";
      button.textContent = "Solicitar acceso";

      button.onclick = async () => {
        button.disabled = true;

        const { error: requestError } =
          await db.rpc(
            "gg_sistemas_request_access",
            { p_module: "direccion" }
          );

        description.textContent = requestError
          ? requestError.message
          : "Solicitud enviada correctamente a Sistemas.";

        if (requestError) {
          button.disabled = false;
        }
      };

      root.append(
        title,
        description,
        button
      );

      return;
    }

    root.innerHTML = [
      '<div class="dir-kicker">',
      'GRUPO GUTIÉRREZ / ADMINISTRACIÓN CENTRAL',
      '</div>',

      '<h1 class="dir-title">',
      'Dirección<em>.</em>',
      '</h1>',

      '<p class="dir-desc">',
      'Un espacio tranquilo y organizado para administrar ',
      'el patrimonio, consultar responsables y dar ',
      'seguimiento a cada inmueble.',
      '</p>',

      '<div class="dir-divider"></div>',

      '<a class="dir-feature" href="locales-departamentos.html">',

      '<div class="dir-art">',
      '<svg viewBox="0 0 180 160" fill="none">',
      '<rect x="18" y="57" width="63" height="81" ',
      'rx="5" fill="#c8e3f3"/>',

      '<path d="M10 57 49 24 89 57" ',
      'stroke="#6198bc" stroke-width="10" ',
      'stroke-linejoin="round"/>',

      '<rect x="92" y="32" width="67" height="106" ',
      'rx="5" fill="#f7d9be"/>',

      '<rect x="106" y="48" width="16" height="17" ',
      'rx="3" fill="white"/>',

      '<rect x="130" y="48" width="16" height="17" ',
      'rx="3" fill="white"/>',

      '<rect x="106" y="77" width="16" height="17" ',
      'rx="3" fill="white"/>',

      '<rect x="130" y="77" width="16" height="17" ',
      'rx="3" fill="white"/>',

      '<rect x="35" y="86" width="26" height="52" ',
      'rx="3" fill="#719bb8"/>',

      '<rect x="118" y="111" width="18" height="27" ',
      'rx="3" fill="#c59a77"/>',

      '<path d="M8 141h164" stroke="#8bb4ca" ',
      'stroke-width="5" stroke-linecap="round"/>',
      '</svg>',
      '</div>',

      '<div>',
      '<div class="dir-kicker">PATRIMONIO</div>',
      '<h2>Locales y Departamentos</h2>',

      '<p>',
      'Responsables, bienes, expedientes, pendientes ',
      'enviados a LO y lecturas de agua, todo en un solo lugar.',
      '</p>',

      '<span class="dir-go">',
      'Abrir administración →',
      '</span>',
      '</div>',

      '</a>',

      '<p class="dir-soon">',
      'Próximamente agregaremos más herramientas ',
      'de Dirección.',
      '</p>'
    ].join("");

  } catch (error) {
    root.textContent =
      "No se pudo abrir Dirección: " +
      error.message;
  }
})();
`;

/* =====================================================
   CORREGIR GUARDADO DE RESPONSABLES Y BIENES

   La causa principal era utilizar form.id.
   Algunos formularios contienen un campo name="id"
   y el navegador puede devolver ese elemento,
   no el identificador de texto del formulario.
===================================================== */

function fixApp(file) {
  let js = read(file);

  js = js.replace(
    /\bform\.id\.startsWith\(/g,
    'form.getAttribute("id").startsWith('
  );

  js = js.replace(
    /\bform\.id\s*===/g,
    'form.getAttribute("id") ==='
  );

  js = js.replace(
    /\bform\.id\s*==/g,
    'form.getAttribute("id") =='
  );

  // RPC correctiva del SQL V2.
  js = js.replace(
    /"gg_ld_save"/g,
    '"gg_ld_v2_save"'
  );

  js = js.replace(
    /'gg_ld_save'/g,
    "'gg_ld_v2_save'"
  );

  if (!js.includes("gg_ld_v2_save")) {
    throw Error(
      "No encontré la llamada RPC en " + file
    );
  }

  if (/form\.id\.startsWith/.test(js)) {
    throw Error(
      "No se corrigió form.id en " + file
    );
  }

  put(file, js);
}

/* =====================================================
   APLICAR CORRECCIONES EN GRUPO GUTIÉRREZ
===================================================== */

if (gg) {
  let home = read("sistema.html");

  // Instalar Dirección si la tarjeta aún falta.
  if (!/data-module=["']direccion["']/.test(home)) {
    const match =
      /<div\b[^>]*class=["'][^"']*\bmodule-grid\b[^"']*["'][^>]*>/i
        .exec(home);

    if (!match) {
      throw Error(
        "No se encontró module-grid de Grupo Gutiérrez."
      );
    }

    const at = endTag(
      home,
      match.index,
      "div"
    );

    const card = String.raw`
<div
  class="module-shell slot-direccion"
  style="--delay:.64s"
>
  <button
    class="module-card card-direccion"
    type="button"
    data-module="direccion"
  >
    <span class="card-top">
      <span class="card-icon">⌂</span>
      <span class="card-serial">10 / 10</span>
    </span>

    <span class="card-content">
      <span class="card-eyebrow">
        ADMINISTRACIÓN
      </span>

      <strong class="card-title">
        Dirección
      </strong>

      <span class="card-description">
        Locales y Departamentos
      </span>
    </span>

    <span class="card-footer">
      <span class="card-meta">
        PATRIMONIO
      </span>
      <span class="card-arrow">↗</span>
    </span>
  </button>
</div>`;

    home =
      home.slice(0, at) +
      "\n" + card + "\n" +
      home.slice(at);
  }

  home = link(
    home,
    "css/gg-orbita-correctiva.css"
  );

  put("sistema.html", home);

  // Dirección dentro de navegación central.
  const navFile = "js/gg-sistemas-nav.js";
  let nav = read(navFile);

  if (
    !/\bdireccion:\s*["']direccion\.html["']/.test(nav)
  ) {
    const anchor =
      /sistemas:\s*["']sistemas\.html["']/;

    if (!anchor.test(nav)) {
      throw Error(
        "No se encontró la ruta de Sistemas."
      );
    }

    nav = nav.replace(
      anchor,
      match =>
        match +
        ',\n    direccion: "direccion.html"'
    );
  }

  put(navFile, nav);

  // Orbital original ahora reconoce diez tarjetas.
  const orbitalFile =
    "js/sistema-orbital.js";

  let orbital = read(orbitalFile);

  orbital = orbital.replace(
    /modules\.length\s*!==\s*(?:8|9)/g,
    "modules.length !== 10"
  );

  put(orbitalFile, orbital);

  // Selector Dirección en Sistemas.
  let systems = read("sistemas.html");

  if (!systems.includes('value="direccion"')) {
    const start =
      systems.indexOf('id="sysModule"');

    const end = start >= 0
      ? systems.indexOf("</select>", start)
      : -1;

    if (end < 0) {
      throw Error(
        "Falta el selector de módulos de Sistemas."
      );
    }

    systems =
      systems.slice(0, end) +
      '<option value="direccion">Dirección</option>\n' +
      systems.slice(end);
  }

  put("sistemas.html", systems);

  // Nuevo diseño de Dirección.
  put("direccion.html", direction);

  put(
    "js/ld-direccion-v2.js",
    directionJS
  );

  // Órbita radial nueva.
  put(
    "css/gg-orbita-correctiva.css",
    orbitGG
  );

  // Mejorar el diseño sin destruir los estilos anteriores.
  const cssFile = "css/ld-ui.css";
  let css = read(cssFile);

  if (!css.includes("REFRESCO PREMIUM V2")) {
    css += "\n" + polish;
  }

  put(cssFile, css);

  // Reparar los formularios existentes.
  fixApp("js/ld-app.js");
}

/* =====================================================
   APLICAR CORRECCIONES EN INGENIERÍA LO
===================================================== */

else {
  let dashboard = read(
    "public/dashboard.html"
  );

  // Eliminar una tarjeta anterior mal insertada
  // para no duplicarla.
  dashboard = dashboard.replace(
    /<button\b(?=[^>]*\bid=["']localesDepartamentosButton["'])[^>]*>[\s\S]*?<\/button>/gi,
    ""
  );

  const match =
    /<section\b[^>]*class=["'][^"']*\blo-orbit\b[^"']*["'][^>]*>/i
      .exec(dashboard);

  if (!match) {
    throw Error(
      "No encontré el círculo lo-orbit de LO."
    );
  }

  const at = endTag(
    dashboard,
    match.index,
    "section"
  );

  const card = String.raw`
<button
  class="lo-module-card lo-module-9"
  id="localesDepartamentosButton"
  type="button"
  style="--delay:650ms"
>
  <span class="lo-module-index">09</span>

  <span class="lo-module-icon">⌂</span>

  <span class="lo-module-copy">
    <strong>
      Locales y Departamentos
    </strong>

    <small>
      Pendientes de Dirección
    </small>
  </span>

  <span class="lo-module-arrow">↗</span>
</button>`;

  dashboard =
    dashboard.slice(0, at) +
    "\n" + card + "\n" +
    dashboard.slice(at);

  dashboard = link(
    dashboard,
    "css/lo-orbita-correctiva.css"
  );

  put(
    "public/dashboard.html",
    dashboard
  );

  // Registrar realmente la ruta en el dashboard.
  let routes = read(
    "public/js/dashboard.js"
  );

  if (
    !/localesDepartamentosButton\s*:/.test(routes)
  ) {
    if (!routes.includes("const routes = {")) {
      throw Error(
        "No encontré el mapa de rutas de LO."
      );
    }

    routes = routes.replace(
      "const routes = {",
      'const routes = {\n' +
      '    localesDepartamentosButton: ' +
      '"locales-departamentos.html",'
    );
  }

  put(
    "public/js/dashboard.js",
    routes
  );

  // Restaurar la órbita de LO.
  put(
    "public/css/lo-orbita-correctiva.css",
    orbitLO
  );

  // Diseño renovado del módulo.
  const cssFile =
    "public/css/ld-ui.css";

  let css = read(cssFile);

  if (!css.includes("REFRESCO PREMIUM V2")) {
    css += "\n" + polish;
  }

  put(cssFile, css);

  // Reparar formularios y conectar SQL correctivo.
  fixApp("public/js/ld-app.js");
}

/* =====================================================
   VALIDACIONES ANTES DE ESCRIBIR
===================================================== */

for (const [name, content] of out) {
  if (!content.trim()) {
    throw Error(
      "Se generó un archivo vacío: " + name
    );
  }

  if (name.endsWith(".js")) {
    new vm.Script(
      content,
      { filename: name }
    );
  }
}

/* =====================================================
   ESCRITURA SEGURA Y RECUPERACIÓN
===================================================== */

const original = new Map();

try {
  for (const [name, content] of out) {
    const destination =
      path.join(root, name);

    original.set(
      destination,
      exists(name)
        ? fs.readFileSync(destination)
        : null
    );

    fs.mkdirSync(
      path.dirname(destination),
      { recursive: true }
    );

    fs.writeFileSync(
      destination,
      content,
      "utf8"
    );
  }

  console.log("");
  console.log("====================================");
  console.log(" GG / LO · CORRECTIVO DIRECCIÓN V2");
  console.log("====================================");
  console.log("");
  console.log("✓ Órbita circular responsive");
  console.log("✓ Sin cuadrículas de módulos");
  console.log("✓ Guardado de formularios corregido");
  console.log("✓ Navegación corregida");
  console.log("✓ Diseño profesional actualizado");
  console.log("✓ Sin archivos .bak");
  console.log("");
  console.log(
    "Proyecto: " +
    (
      gg
        ? "GRUPO GUTIÉRREZ"
        : "INGENIERÍA LO"
    )
  );
  console.log("");
  console.log(
    "Reinicia el servidor y actualiza con Ctrl+F5."
  );
  console.log("");

} catch (error) {
  for (
    const [destination, previous]
    of [...original].reverse()
  ) {
    try {
      if (previous === null) {
        fs.rmSync(
          destination,
          { force: true }
        );
      } else {
        fs.writeFileSync(
          destination,
          previous
        );
      }
    } catch (recoveryError) {
      console.error(
        "No se pudo restaurar:",
        destination,
        recoveryError.message
      );
    }
  }

  throw error;
}
