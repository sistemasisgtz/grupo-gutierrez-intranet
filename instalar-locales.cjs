
"use strict";

/*
 GRUPO GUTIÉRREZ / INGENIERÍA LO
 LOCALES Y DEPARTAMENTOS V1

 node instalar-locales.cjs

 Instala según el proyecto detectado.
 No genera respaldos .bak.
 Recupera archivos modificados si falla la instalación.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = process.cwd();
const isGG = fs.existsSync(path.join(ROOT, "sistema.html"));
const isLO = fs.existsSync(path.join(ROOT, "public/dashboard.html"));

if (isGG === isLO) {
  throw Error(
    "Ejecuta el instalador en la raíz de GG o LO."
  );
}

const BASE = isGG ? "" : "public/";
const writes = new Map();

function get(name) {
  const p = path.join(ROOT, name);
  if (!fs.existsSync(p)) {
    throw Error("Archivo no encontrado: " + name);
  }
  return fs.readFileSync(p, "utf8");
}

function put(name, contents) {
  writes.set(name, contents);
}

function before(text, anchor, addition) {
  if (text.includes(addition.trim())) return text;
  if (!text.includes(anchor)) {
    throw Error("No encontré " + anchor);
  }
  return text.replace(anchor, addition + "\n" + anchor);
}

/* =======================================================
   ESTILOS DE LAS DOS APLICACIONES
======================================================= */

const appCSS = String.raw`
:root {
  --blue:#2C638E;
  --ice:#EAF5FC;
  --orange:#ED975B;
  --ink:#1C3548;
  --muted:#6B8090;
  --line:#DCE8F0;
}
* {box-sizing:border-box}
body.ld-body {
  margin:0;
  min-height:100vh;
  font-family:Inter,Arial,sans-serif;
  color:var(--ink);
  background:
    radial-gradient(circle at 8% 4%,#D5EEFF99,transparent 36%),
    radial-gradient(circle at 90% 12%,#FFE4CF88,transparent 38%),
    #F7FAFC;
}
button,input,select,textarea {font:inherit}
button {cursor:pointer}
button:disabled {opacity:.55;cursor:not-allowed}
a {color:inherit;text-decoration:none}
.ld-wrap {width:min(1320px,calc(100% - 40px));margin:auto}
.ld-header {
  background:#FFFFFFD9;
  border-bottom:1px solid var(--line);
  backdrop-filter:blur(18px);
}
.ld-header-inner {
  min-height:75px;display:flex;align-items:center;
  justify-content:space-between;gap:20px;
}
.ld-brand {font-size:21px;font-weight:900;color:var(--blue)}
.ld-brand span {color:var(--orange)}
.ld-back {
  border:1px solid var(--line);
  padding:11px 17px;border-radius:12px;
  font-size:13px;background:white;
}
.ld-main {padding:39px 0 80px}
.ld-eyebrow {
  color:#6386A5;
  font-size:11px;font-weight:800;
  letter-spacing:.19em;
}
.ld-hero {
  display:flex;align-items:center;
  justify-content:space-between;gap:24px;
  margin-bottom:30px;
}
.ld-hero h1 {
  margin:9px 0;
  font-size:clamp(35px,5vw,61px);
  letter-spacing:-.055em;line-height:1.08;
}
.ld-hero p {
  color:var(--muted);
  font-size:15px;line-height:1.6;
  margin:0;
}
.ld-toolbar {
  display:flex;flex-wrap:wrap;
  align-items:center;gap:10px;
  margin:20px 0 27px;
}
.ld-btn {
  display:inline-flex;align-items:center;
  justify-content:center;gap:9px;
  min-height:46px;padding:12px 18px;
  border-radius:13px;
  background:white;color:var(--ink);
  border:1px solid var(--line);
  font-weight:750;
  box-shadow:0 5px 18px #234A6A0B;
}
.ld-btn:hover {
  transform:translateY(-2px);
  box-shadow:0 10px 25px #234A6A16;
}
.ld-primary {
  background:var(--blue);
  border-color:var(--blue);color:white;
}
.ld-accent {
  background:#FFF0E4;
  border-color:#F5D8BF;
  color:#96552D;
}
.ld-search {
  padding:13px 17px;border-radius:14px;
  border:1px solid var(--line);
  background:white;min-height:46px;
  flex:1;min-width:185px;
}
.ld-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:20px;
}
.ld-card {
  background:#FFFFFFE8;
  border:1px solid #E1EAF0;
  border-radius:24px;
  padding:22px;
  box-shadow:0 14px 40px #2C638E0C;
  transition:transform .22s,box-shadow .22s;
  min-width:0;
}
.ld-card:hover {
  transform:translateY(-4px);
  box-shadow:0 20px 45px #2C638E18;
}
.ld-art {
  height:155px;
  display:grid;place-items:center;
  background:linear-gradient(130deg,#EAF5FF,#FFF5EB);
  border-radius:17px;
  margin-bottom:17px;
  overflow:hidden;
}
.ld-art svg {height:128px;width:80%}
.ld-card h2 {
  margin:0 0 7px;
  font-size:21px;letter-spacing:-.03em;
}
.ld-address {
  color:var(--muted);
  font-size:13px;min-height:35px;
}
.ld-pill {
  display:inline-flex;align-items:center;
  border-radius:999px;padding:7px 11px;
  font-size:11px;font-weight:800;
  background:#EAF4FC;color:#477399;
}
.ld-meta {
  margin:14px 0;
  padding:13px;border-radius:13px;
  background:#F5F9FC;
}
.ld-meta strong,.ld-meta small {
  display:block;
}
.ld-meta small {margin-top:6px;color:var(--blue)}
.ld-card select {
  width:100%;
  border:1px solid var(--line);
  border-radius:11px;padding:11px;
  background:white;margin-top:9px;
}
.ld-card-actions {
  display:flex;flex-wrap:wrap;
  gap:8px;margin-top:15px;
}
.ld-count {
  display:inline-grid;place-items:center;
  min-width:21px;height:21px;
  padding:0 5px;
  border-radius:50%;
  background:#EF765E;color:white;
  font-size:11px;font-weight:800;
}
.ld-tabs {display:flex;gap:8px;flex-wrap:wrap}
.ld-tabs button {
  padding:11px 17px;border-radius:13px;
  border:1px solid var(--line);
  background:white;color:var(--muted);
  font-weight:750;
}
.ld-tabs .selected {
  background:var(--blue);
  color:white;border-color:var(--blue);
}
.ld-task-card {
  background:white;
  border:1px solid var(--line);
  border-left:5px solid var(--orange);
  padding:19px;border-radius:17px;
  margin-bottom:13px;
}
.ld-task-card.done {
  opacity:.63;
  border-left-color:#9DB8AA;
}
.ld-task-card p {line-height:1.5}
.ld-task-card small {color:var(--muted)}
.ld-empty {
  grid-column:1/-1;
  text-align:center;
  padding:70px 25px;
  border:2px dashed #CEDFEB;
  border-radius:24px;
  background:#FFFFFFA8;
  color:var(--muted);
}
.ld-overlay {
  position:fixed;inset:0;
  z-index:99999;
  background:#12283BB8;
  backdrop-filter:blur(8px);
  display:grid;place-items:center;
  padding:16px;
}
.ld-modal {
  width:min(1050px,100%);
  max-height:min(93vh,950px);
  overflow:auto;
  border-radius:26px;
  background:#FFFFFF;
  box-shadow:0 40px 130px #10273F4D;
}
.ld-modal-head {
  display:flex;justify-content:space-between;
  align-items:center;gap:15px;
  padding:24px 30px;
  border-bottom:1px solid var(--line);
  position:sticky;top:0;z-index:2;
  background:#FFFFFFF2;
}
.ld-modal-head h2 {
  margin:0;font-size:25px;
  letter-spacing:-.035em;
}
.ld-close {
  border:0;border-radius:50%;
  width:41px;height:41px;
  background:#F0F5F9;
  font-size:23px;
}
.ld-modal-body {padding:27px 30px 35px}
.ld-form {display:grid;gap:16px}
.ld-form label {display:grid;gap:7px;font-weight:750}
.ld-form input,.ld-form select,
.ld-form textarea {
  width:100%;padding:13px 14px;
  border:1px solid #CCDCE7;
  border-radius:12px;background:white;
  color:var(--ink);
}
.ld-form textarea {
  min-height:85px;resize:vertical;
}
.ld-two {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:22px;
}
.ld-manager-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:12px;
  margin-bottom:23px;
}
.ld-person-tile {
  padding:17px;border:1px solid var(--line);
  border-radius:18px;background:white;
  min-width:0;
  text-align:center;
}
.ld-avatar {
  margin:0 auto 10px;
  width:66px;height:66px;
  display:grid;place-items:center;
  border-radius:22px;
  font-size:31px;
}
.ld-person-tile strong {
  display:block;overflow-wrap:anywhere;
}
.ld-person-tile small {
  display:block;color:var(--muted);
  margin:7px 0;
}
.ld-colors {
  display:grid;
  grid-template-columns:repeat(12,1fr);
  gap:7px;
}
.ld-color {
  display:block;
  width:100%;aspect-ratio:1;
  border-radius:10px;cursor:pointer;
  border:2px solid #FFFFFF;
  box-shadow:0 0 0 1px #CBD9E4;
}
.ld-color input {display:none}
.ld-color:has(input:checked) {
  outline:3px solid var(--blue);
}
.ld-drop {
  display:grid;place-items:center;
  text-align:center;gap:8px;
  border:2px dashed #9BBFD9;
  background:#F0F8FF;
  padding:30px;border-radius:17px;
  cursor:pointer;
}
.ld-drop.dragging {background:#DCEFFF}
.ld-doc {
  display:flex;justify-content:space-between;
  gap:10px;align-items:center;
  padding:9px 0;
  border-bottom:1px solid var(--line);
}
.ld-icons {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:10px;
}
.ld-icon-option {
  display:grid;place-items:center;
  padding:12px;border:1px solid var(--line);
  border-radius:15px;cursor:pointer;
  background:#F7FAFD;
}
.ld-icon-option svg {width:100px;height:82px}
.ld-icon-option input {accent-color:var(--blue)}
.ld-split {
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:20px;
}
.ld-panel {
  background:#F7FAFD;
  border:1px solid var(--line);
  border-radius:17px;padding:18px;
  min-width:0;
}
.ld-panel h3 {margin:0 0 15px}
.ld-list {display:grid;gap:10px}
.ld-task-line {
  padding:14px;border:1px solid var(--line);
  border-radius:13px;background:white;
}
.ld-task-line.done {opacity:.57}
.ld-task-line p {margin:7px 0;line-height:1.5}
.ld-row-actions {
  display:flex;gap:7px;
  flex-wrap:wrap;margin-top:9px;
}
.ld-row-actions button {
  padding:8px 10px;border:1px solid var(--line);
  border-radius:9px;background:white;
}
.ld-post {
  padding:13px;background:white;
  border:1px solid var(--line);
  border-radius:13px;margin-bottom:11px;
}
.ld-post small {
  display:block;color:var(--muted);
  margin-bottom:6px;overflow-wrap:anywhere;
}
.ld-photo {
  max-width:120px;max-height:100px;
  object-fit:cover;
  border-radius:9px;margin:7px;
}
.ld-water-row {
  display:grid;
  grid-template-columns:1fr 1fr 1fr auto;
  gap:10px;align-items:center;
  padding:12px;border-bottom:1px solid var(--line);
}
.ld-water-row small {color:var(--muted)}
.ld-water-value {font-weight:850;color:var(--blue)}
.ld-msg {
  position:fixed;z-index:100001;
  bottom:20px;left:50%;
  transform:translateX(-50%);
  background:#1B3F5C;color:white;
  padding:13px 22px;border-radius:14px;
  box-shadow:0 20px 50px #0003;
  max-width:calc(100% - 30px);
}
@media(max-width:950px) {
  .ld-grid {grid-template-columns:repeat(2,minmax(0,1fr))}
  .ld-manager-grid {grid-template-columns:repeat(2,minmax(0,1fr))}
  .ld-colors {grid-template-columns:repeat(6,1fr)}
}
@media(max-width:680px) {
  .ld-wrap {width:calc(100% - 24px)}
  .ld-grid,.ld-two,.ld-split {
    grid-template-columns:1fr;
  }
  .ld-hero {align-items:flex-start;flex-direction:column}
  .ld-manager-grid {grid-template-columns:repeat(2,minmax(0,1fr))}
  .ld-modal-head {padding:18px}
  .ld-modal-body {padding:18px}
  .ld-water-row {grid-template-columns:1fr 1fr}
  .ld-card {padding:16px}
}
@media(prefers-reduced-motion:reduce) {
  * {animation:none!important;transition:none!important}
}
`;

/* =======================================================
   NAVEGACIÓN GG Y LO
======================================================= */

const ggLayoutCSS = String.raw`
/* DIRECCIÓN · REACOMODO RESPONSIVE GG */
body .workspace {
  min-height:0!important;
  padding:335px 0 40px!important;
}
body .workspace .workspace-heading {
  top:8px!important;
}
body .workspace .workspace-side {
  top:55px!important;
}
body .workspace .hero {
  position:absolute!important;
  left:50%!important;
  top:145px!important;
  width:min(520px,90%)!important;
  transform:translateX(-50%)!important;
  text-align:center!important;
}
body .workspace .gg-orbit {
  inset:0 0 auto!important;
  height:300px!important;
  opacity:.48;
}
body .workspace .module-grid {
  position:relative!important;
  inset:auto!important;
  width:100%;
  display:grid!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:15px!important;
  pointer-events:auto!important;
}
body .workspace .module-shell,
body .workspace .module-shell:nth-child(n) {
  position:relative!important;
  inset:auto!important;
  left:auto!important;right:auto!important;
  top:auto!important;bottom:auto!important;
  transform:none!important;
  translate:none!important;
  margin:0!important;
  width:100%!important;
  min-width:0!important;
  height:155px!important;
  grid-column:auto!important;
  grid-row:auto!important;
}
body .workspace .module-card {
  width:100%!important;
  height:100%!important;
  min-width:0!important;
}
body .workspace .card-title {
  font-size:clamp(13px,1.3vw,19px)!important;
  overflow-wrap:anywhere;
}
body .workspace .slot-direccion .module-card {
  border-color:#80D1F077;
  background:
    linear-gradient(135deg,#69C4EA1E,#F28B4317),
    #141A21;
}
@media(max-width:1250px) {
  body .workspace .module-grid {
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
  }
}
@media(max-width:950px) {
  body .workspace .module-grid {
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
  }
}
@media(max-width:700px) {
  body .workspace {padding-top:290px!important}
  body .workspace .hero {top:90px!important}
  body .workspace .module-grid {
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }
  body .workspace .module-shell,
  body .workspace .module-shell:nth-child(n) {
    height:135px!important;
  }
}
@media(max-width:430px) {
  body .workspace .module-grid {
    grid-template-columns:1fr!important;
  }
  body .workspace .module-shell,
  body .workspace .module-shell:nth-child(n) {
    height:120px!important;
  }
}
`;

const loLayoutCSS = String.raw`
/* NUEVE MÓDULOS · LO RESPONSIVE */
.lo-dashboard-body .lo-orbit {
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  grid-template-rows:auto!important;
  gap:18px!important;
  min-height:0!important;
  height:auto!important;
  padding:35px 0 50px!important;
  justify-items:stretch!important;
}
.lo-dashboard-body .lo-orbit-center {
  position:relative!important;
  inset:auto!important;
  grid-column:1/-1!important;
  grid-row:1!important;
  justify-self:center!important;
  transform:none!important;
  translate:none!important;
  margin:10px auto 25px!important;
}
.lo-dashboard-body .lo-orbit .lo-module-card {
  position:relative!important;
  inset:auto!important;
  left:auto!important;right:auto!important;
  top:auto!important;bottom:auto!important;
  width:100%!important;
  height:auto!important;
  min-height:130px!important;
  transform:none!important;
  translate:none!important;
  grid-column:auto!important;
  grid-row:auto!important;
  min-width:0!important;
}
.lo-dashboard-body .lo-orbit .lo-module-card:hover {
  translate:0 -4px!important;
}
.lo-dashboard-body #localesDepartamentosButton {
  border-color:#77AFDB;
  background:linear-gradient(145deg,#E5F5FF,#FFF4EB);
}
.lo-dashboard-body #localesDepartamentosButton
.lo-module-copy strong {
  overflow-wrap:anywhere;
}
@media(max-width:1000px) {
  .lo-dashboard-body .lo-orbit {
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }
}
@media(max-width:620px) {
  .lo-dashboard-body .lo-orbit {
    grid-template-columns:1fr!important;
  }
  .lo-dashboard-body .lo-orbit .lo-module-card {
    min-height:110px!important;
  }
}
`;

/* =======================================================
   HTML DE LOCALES Y DEPARTAMENTOS
======================================================= */

function makeAppHTML(mode) {
  return String.raw`
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport"
 content="width=device-width,initial-scale=1">
<title>Locales y Departamentos</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
 rel="stylesheet">
<link rel="stylesheet" href="css/ld-ui.css">
</head>
<body class="ld-body" data-mode="${mode}">
<header class="ld-header">
  <div class="ld-wrap ld-header-inner">
    <a class="ld-brand" href="${mode === "gg"
      ? "direccion.html" : "dashboard.html"}">
      ${mode === "gg" ? "GG" : "LO"}<span>✳</span>
      <small style="font-size:12px;font-weight:500">
        LOCALES Y DEPARTAMENTOS
      </small>
    </a>
    <a class="ld-back" href="${mode === "gg"
      ? "direccion.html" : "dashboard.html"}">
      ← Volver al menú
    </a>
  </div>
</header>
<main class="ld-wrap ld-main">
  <section class="ld-hero">
    <div>
      <div class="ld-eyebrow">
        ${mode === "gg" ? "DIRECCIÓN · PATRIMONIO"
          : "INGENIERÍA LO · SEGUIMIENTO"}
      </div>
      <h1>Locales y Departamentos<span
       style="color:#ED975B">.</span></h1>
      <p>${mode === "gg"
        ? "Tus bienes, responsables y tareas en un solo lugar."
        : "Pendientes de los inmuebles. Reporta avances con claridad."}</p>
    </div>
    <div aria-hidden="true" style="font-size:65px">🏘️</div>
  </section>

  <div id="ldApp" aria-live="polite">
    <div class="ld-empty">
      Conectando con Supabase...
    </div>
  </div>
</main>
<div id="ldModalHost"></div>
<div id="ldToastHost"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
<script src="js/ld-app.js"></script>
</body>
</html>`;
}

/* =======================================================
   DIRECCIÓN · MENÚ BLANCO CON AZUL Y NARANJA
======================================================= */

const directionHTML = String.raw`
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dirección · Grupo Gutiérrez</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
 rel="stylesheet">
<link rel="stylesheet" href="css/ld-ui.css">
</head>
<body class="ld-body">
<header class="ld-header">
  <div class="ld-wrap ld-header-inner">
    <a class="ld-brand" href="sistema.html">
      GRUPO GUTIÉRREZ<span> ✳</span>
    </a>
    <a class="ld-back" href="sistema.html">← Módulos</a>
  </div>
</header>
<main class="ld-wrap ld-main" id="directionRoot">
  <div class="ld-empty">Verificando acceso a Dirección...</div>
</main>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
<script>
(async () => {
  const root = document.getElementById("directionRoot");
  const db = window.ggSupabase;

  try {
    const { data: user } = await db.auth.getUser();

    if (!user?.user) {
      location.replace("index.html");
      return;
    }

    const { data, error } = await db.rpc(
      "gg_module_access",{p_module:"direccion"}
    );

    if (error) throw error;

    if (data !== true) {
      root.innerHTML = "";
      const title = document.createElement("h1");
      title.textContent = "Acceso restringido";
      const msg = document.createElement("p");
      msg.textContent =
        "No tienes acceso a Dirección. Solicítalo a Sistemas.";
      const button = document.createElement("button");
      button.className = "ld-btn ld-primary";
      button.textContent = "Solicitar acceso";
      button.onclick = async () => {
        button.disabled = true;
        const {error} = await db.rpc(
          "gg_sistemas_request_access",
          {p_module:"direccion"}
        );
        msg.textContent = error
          ? error.message
          : "Solicitud enviada a Sistemas.";
      };
      root.append(title,msg,button);
      return;
    }

    root.innerHTML = \`
      <section class="ld-hero">
        <div>
          <div class="ld-eyebrow">
            GRUPO GUTIÉRREZ · ADMINISTRACIÓN CENTRAL
          </div>
          <h1>Dirección<span
            style="color:#ED975B">.</span></h1>
          <p>Todo lo importante, organizado y a tu alcance.</p>
        </div>
        <div style="font-size:70px" aria-hidden="true">🏛️</div>
      </section>
      <div class="ld-grid">
        <a class="ld-card"
           href="locales-departamentos.html"
           style="display:block">
          <div class="ld-art" style="font-size:70px">🏘️</div>
          <span class="ld-pill">PATRIMONIO</span>
          <h2 style="margin-top:15px">
            Locales y Departamentos
          </h2>
          <p class="ld-address">
            Bienes, responsables, expedientes,
            pendientes y registros de agua.
          </p>
          <span class="ld-btn ld-primary" style="margin-top:20px">
            Entrar al módulo →
          </span>
        </a>
        <div class="ld-card" style="opacity:.55">
          <div class="ld-art" style="font-size:65px">✨</div>
          <span class="ld-pill">PRÓXIMAMENTE</span>
          <h2 style="margin-top:15px">Más herramientas</h2>
          <p class="ld-address">
            Dirección crecerá contigo.
          </p>
        </div>
      </div>\`;
  } catch(e) {
    root.textContent = "No se pudo verificar el acceso: " +
      e.message;
  }
})();
</script>
</body>
</html>
`;

/* =======================================================
   APLICACIÓN PARA AMBAS EMPRESAS
======================================================= */

const appJS = String.raw`
(() => {
"use strict";

const db = window.ggSupabase;
const mode = document.body.dataset.mode;
const GG = mode === "gg";
const app = document.getElementById("ldApp");
const host = document.getElementById("ldModalHost");

const COLORS = [
 "#DBEBFF","#DFF5EB","#FFE6D6","#FBE2E8",
 "#EEE3FF","#FFF3C8","#DCEEF0","#F4E1D2",
 "#E1E7FA","#F1EDDA","#D6F1F3","#F8DCEA"
];

const ICONS = [
 ["local-small","Local pequeño"],
 ["local-large","Local grande"],
 ["apartment-small","Departamento pequeño"],
 ["apartment-large","Departamento grande"],
 ["house","Casa"],
 ["house-large","Casa grande"]
];

let data = {
 people:[],assets:[],tasks:[],updates:[],water:[],docs:[]
};
let search = "";
let filter = "pendiente";
let selectedFiles = [];

const esc = value => String(value ?? "")
 .replaceAll("&","&amp;")
 .replaceAll("<","&lt;")
 .replaceAll(">","&gt;")
 .replaceAll('"',"&quot;")
 .replaceAll("'","&#39;");

const fmt = date => date
 ? new Date(date).toLocaleString("es-MX")
 : "—";

const $ = selector => document.querySelector(selector);

function toast(message) {
 const el = document.createElement("div");
 el.className = "ld-msg";
 el.textContent = message;
 document.getElementById("ldToastHost").replaceChildren(el);
 setTimeout(() => el.remove(),4500);
}

function art(kind) {
 const big = kind.endsWith("large");
 const apartment = kind.startsWith("apartment");
 const house = kind.startsWith("house");
 const floors = big ? 3 : apartment ? 2 : 1;
 let windows = "";

 for(let row=0;row<floors;row++) {
  for(let col=0;col<(big?3:2);col++) {
   windows += '<rect x="' + (31+col*24) +
    '" y="' + (38+row*23) +
    '" width="12" height="13" rx="2" fill="#FFFFFF"/>';
  }
 }

 return '<svg viewBox="0 0 130 130" role="img" ' +
  'aria-label="' + esc(kind) + '">' +
  '<rect x="6" y="113" width="118" height="5" rx="2" fill="#9EBCCF"/>' +
  (house
   ? '<path d="M17 53 L65 12 L113 53" stroke="#DE9160" ' +
     'stroke-width="11" fill="none" stroke-linejoin="round"/>'
   : '<rect x="20" y="20" width="90" height="12" rx="3" fill="#DFA374"/>') +
  '<rect x="22" y="' + (house?53:29) +
  '" width="86" height="' + (house?61:85) +
  '" rx="4" fill="' +
  (apartment?"#9AC9E8":house?"#F3CFAE":"#B7DDD6") +
  '"/>' + windows +
  '<rect x="57" y="91" width="18" height="23" rx="2" fill="#507B9E"/>' +
  '<circle cx="70" cy="103" r="1.4" fill="#FBE1A5"/>' +
  '</svg>';
}

function modal(title,html) {
 host.innerHTML =
  '<div class="ld-overlay" id="ldOverlay">' +
  '<section class="ld-modal" role="dialog" aria-modal="true">' +
  '<header class="ld-modal-head"><h2>' + esc(title) +
  '</h2><button class="ld-close" data-action="close" ' +
  'aria-label="Cerrar">×</button></header>' +
  '<div class="ld-modal-body">' + html + '</div>' +
  '</section></div>';
 host.querySelector(".ld-overlay").addEventListener(
  "click",e => {
   if(e.target.id === "ldOverlay") close();
  }
 );
}

function close() {
 host.replaceChildren();
 selectedFiles = [];
}

async function call(action,payload) {
 const {data:result,error} = await db.rpc(
  "gg_ld_save",{p_action:action,p_data:payload}
 );
 if(error) throw error;
 return result;
}

async function refresh(quiet=false) {
 const {data:result,error} = await db.rpc("gg_ld_get");
 if(error) throw error;
 data = result;
 render();
 if(!quiet) toast("Datos actualizados");
}

function peopleOptions(value) {
 return '<option value="">Sin responsable</option>' +
 data.people.map(p =>
  '<option value="' + p.id + '"' +
  (p.id === value?' selected':'') + '>' +
  esc(p.full_name) + '</option>'
 ).join("");
}

function contact(asset) {
 return '<div class="ld-meta"><strong>👤 ' +
  esc(asset.responsible_name || "Sin responsable") +
  '</strong><small>☎ ' +
  esc(asset.responsible_phone || "Sin teléfono") +
  '</small></div>';
}

function render() {
 app.innerHTML = GG ? renderGG() : renderLO();
}

function renderGG() {
 const visible = data.assets.filter(a =>
  (a.name+" "+a.address).toLowerCase()
   .includes(search.toLowerCase())
 );

 return '<div class="ld-toolbar">' +
  '<button class="ld-btn ld-primary" data-action="people">' +
  '👥 Responsables</button>' +
  '<button class="ld-btn ld-accent" data-action="assets">' +
  '🏡 Bienes</button>' +
  '<input id="ldSearch" class="ld-search" ' +
  'placeholder="Buscar por nombre o dirección..." value="' +
  esc(search) + '">' +
  '<button class="ld-btn" data-action="refresh">↻ Actualizar</button>' +
  '</div><div class="ld-grid">' +
  (visible.map(a => {
   const tasks = data.tasks.filter(t => t.asset_id === a.id);
   const count = tasks.filter(t => t.status === "pendiente").length;

   return '<article class="ld-card">' +
    '<div class="ld-art">' + art(a.icon) + '</div>' +
    '<span class="ld-pill">' + esc(a.type) + '</span>' +
    '<h2 style="margin-top:12px">' + esc(a.name) + '</h2>' +
    '<p class="ld-address">📍 ' + esc(a.address) + '</p>' +
    contact(a) +
    '<label style="font-size:12px;font-weight:750">' +
    'Responsable asignado</label>' +
    '<select data-responsible="' + a.id + '">' +
    peopleOptions(a.responsible_id) + '</select>' +
    '<div class="ld-card-actions">' +
    '<button class="ld-btn ld-primary" data-action="tasks" ' +
    'data-id="' + a.id + '">🔔 Pendientes ' +
    '<span class="ld-count">' + count + '</span></button>' +
    '<button class="ld-btn" data-action="water" ' +
    'data-id="' + a.id + '">💧 Agua</button>' +
    '<button class="ld-btn" data-action="editAsset" ' +
    'data-id="' + a.id + '">✎</button>' +
    '</div></article>';
  }).join("") ||
  '<div class="ld-empty">Todavía no hay bienes. ' +
  'Pulsa «Bienes» para agregar el primero.</div>') +
  '</div>';
}

function renderLO() {
 const tasks = data.tasks.filter(t => {
  const asset = data.assets.find(a => a.id === t.asset_id);
  const text = (t.title+" "+(asset?.name||"")).toLowerCase();
  return t.status === filter &&
    text.includes(search.toLowerCase());
 });

 const pending = data.tasks.filter(
  t => t.status === "pendiente"
 ).length;

 const done = data.tasks.filter(
  t => t.status === "hecho"
 ).length;

 return '<div class="ld-toolbar">' +
  '<div class="ld-tabs">' +
  '<button data-action="filter" data-filter="pendiente" class="' +
  (filter==="pendiente"?"selected":"") + '">' +
  'Por atender (' + pending + ')</button>' +
  '<button data-action="filter" data-filter="hecho" class="' +
  (filter==="hecho"?"selected":"") + '">' +
  'Terminados (' + done + ')</button></div>' +
  '<input id="ldSearch" class="ld-search" ' +
  'placeholder="Buscar pendientes..." value="' +
  esc(search) + '">' +
  '<button class="ld-btn" data-action="refresh">↻ Actualizar</button>' +
  '</div>' +
  '<div style="max-width:950px">' +
  (tasks.map(t => {
   const a = data.assets.find(x => x.id === t.asset_id);
   return '<article class="ld-task-card ' +
    (t.status==="hecho"?"done":"") + '">' +
    '<div style="display:flex;justify-content:space-between;gap:12px">' +
    '<strong>' + esc(a?.name || "Bien") + '</strong>' +
    '<span class="ld-pill">' + esc(t.status) + '</span></div>' +
    '<p>' + esc(t.title) + '</p>' +
    '<small>📍 ' + esc(a?.address||"") + '</small><br>' +
    '<small>👤 ' + esc(a?.responsible_name||"Sin responsable") +
    ' · ☎ ' + esc(a?.responsible_phone||"Sin teléfono") + '</small>' +
    '<div style="margin-top:13px">' +
    '<button class="ld-btn ld-primary" data-action="loTask" ' +
    'data-id="' + t.id + '">Abrir seguimiento →</button></div>' +
    '</article>';
  }).join("") ||
  '<div class="ld-empty">No hay tareas en esta sección. ✨</div>') +
  '</div>';
}

/* =======================================================
   RESPONSABLES
======================================================= */

function peopleManager(editId=null) {
 const person = data.people.find(p=>p.id===editId);
 const colors = COLORS.map(color =>
  '<label class="ld-color" style="background:' + color + '">' +
  '<input type="radio" name="color" value="' + color + '"' +
  ((person?.color||COLORS[0])===color?' checked':'') +
  '></label>'
 ).join("");

 const tiles = data.people.map(p =>
  '<div class="ld-person-tile">' +
  '<div class="ld-avatar" style="background:' +
  esc(p.color) + '">👤</div>' +
  '<strong>' + esc(p.full_name) + '</strong>' +
  '<small>☎ ' + esc(p.phone) + '</small>' +
  '<button class="ld-btn" data-action="editPerson" ' +
  'data-id="' + p.id + '">Editar</button></div>'
 ).join("");

 const docs = person
  ? data.docs.filter(d=>d.person_id===person.id)
  : [];

 modal("Responsables",
  '<div class="ld-manager-grid">' +
  (tiles||'<p>No hay responsables todavía.</p>') +
  '</div><hr style="border:0;border-top:1px solid #DCE8F0">' +
  '<h3>' + (person?"Modificar responsable":"Nuevo responsable") +
  '</h3>' +
  '<form id="ldPersonForm" class="ld-form">' +
  '<input type="hidden" name="id" value="' +
  esc(person?.id||"") + '">' +
  '<div class="ld-two">' +
  '<label>Nombre completo<input name="full_name" required ' +
  'maxlength="180" value="' + esc(person?.full_name||"") + '">' +
  '</label><label>Número telefónico' +
  '<input name="phone" type="tel" value="' +
  esc(person?.phone||"") + '"></label></div>' +
  '<label>Color de identificación<div class="ld-colors">' +
  colors + '</div></label>' +
  '<label class="ld-drop" id="ldDrop">📁 ' +
  '<strong>Arrastra archivos aquí o pulsa para seleccionar</strong>' +
  '<small>PDF, imágenes y documentos · Máximo 10 MB</small>' +
  '<input id="ldFiles" type="file" multiple ' +
  'accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt" ' +
  'style="display:none"></label>' +
  '<div id="ldFileCount"></div>' +
  '<button class="ld-btn ld-primary" type="submit">' +
  'Guardar responsable</button></form>' +
  (person?'<h3>Expediente</h3>' +
   (docs.map(d =>
    '<div class="ld-doc"><span>📄 ' +
    esc(d.name) + '</span><div>' +
    '<button class="ld-btn" data-action="openDoc" ' +
    'data-path="' + esc(d.storage_path) + '">Ver</button>' +
    '<button class="ld-btn" data-action="deleteDoc" ' +
    'data-id="' + d.id + '">Eliminar</button>' +
    '</div></div>'
   ).join("")||'<p>Aún no hay archivos adjuntos.</p>') +
   '<p><button class="ld-btn" data-action="deletePerson" ' +
   'data-id="' + person.id +
   '">Eliminar responsable</button></p>':"")
 );
}

function assetManager(editId=null) {
 const a = data.assets.find(x=>x.id===editId);
 const icons = ICONS.map(([key,name]) =>
  '<label class="ld-icon-option"><input type="radio" ' +
  'name="icon" value="' + key + '"' +
  ((a?.icon||"local-small")===key?' checked':'') +
  '>' + art(key) +
  '<small>' + name + '</small></label>'
 ).join("");

 modal(a?"Modificar bien":"Bienes",
  '<div class="ld-manager-grid">' +
  data.assets.map(x =>
   '<div class="ld-person-tile">' +
   '<div style="height:80px">' + art(x.icon) + '</div>' +
   '<strong>' + esc(x.name) + '</strong>' +
   '<button class="ld-btn" data-action="editAsset" ' +
   'data-id="' + x.id + '">Editar</button></div>'
  ).join("") + '</div>' +
  '<h3>' + (a?"Modificar":"Dar de alta") + ' bien</h3>' +
  '<form id="ldAssetForm" class="ld-form">' +
  '<input type="hidden" name="id" value="' + esc(a?.id||"") + '">' +
  '<label>Nombre del bien<input name="name" required maxlength="180" ' +
  'value="' + esc(a?.name||"") + '"></label>' +
  '<label>Dirección<textarea name="address">' +
  esc(a?.address||"") + '</textarea></label>' +
  '<label>Tipo<select name="type">' +
  ["local","departamento","casa"].map(x =>
   '<option value="' + x + '"' +
   (a?.type===x?' selected':'') + '>' +
   x + '</option>'
  ).join("") + '</select></label>' +
  '<label>Responsable<select name="responsible_id">' +
  peopleOptions(a?.responsible_id) + '</select></label>' +
  '<strong>Elige una ilustración</strong>' +
  '<div class="ld-icons">' + icons + '</div>' +
  '<button class="ld-btn ld-primary" type="submit">' +
  'Guardar bien</button></form>' +
  (a?'<p><button class="ld-btn" data-action="deleteAsset" ' +
   'data-id="' + a.id +
   '">Eliminar bien</button></p>':"")
 );
}

/* =======================================================
   PENDIENTES Y FORO
======================================================= */

function taskPanel(assetId,taskId=null) {
 const a = data.assets.find(x=>x.id===assetId);
 if(!a) return;

 const tasks = data.tasks.filter(t=>t.asset_id===assetId)
  .sort((x,y) =>
   Number(x.status==="hecho")-Number(y.status==="hecho")
   || new Date(y.created_at)-new Date(x.created_at)
  );

 const selected = data.tasks.find(t=>t.id===taskId)
   || tasks[0];

 const list = tasks.map(t =>
  '<div class="ld-task-line ' +
  (t.status==="hecho"?"done":"") + '">' +
  '<strong>' + esc(t.title) + '</strong>' +
  '<p><span class="ld-pill">' +
  (t.status==="hecho"?"✓ Hecho":"Pendiente") +
  '</span> ' +
  (t.sent_at?'<small>Enviado a LO</small>':
   '<small>Solo Dirección</small>') + '</p>' +
  '<div class="ld-row-actions">' +
  '<button data-action="selectTask" data-id="' +
  t.id + '">Ver foro</button>' +
  (GG
   ? '<button data-action="editTask" data-id="' +
      t.id + '">Modificar</button>' +
      (!t.sent_at
       ? '<button data-action="sendTask" data-id="' +
         t.id + '">Enviar a LO</button>'
       : '')
   : '') +
  '</div></div>'
 ).join("");

 const updates = selected
  ? data.updates.filter(u=>u.task_id===selected.id)
  : [];

 modal("Pendientes · " + a.name,
  '<p class="ld-address">👤 ' +
  esc(a.responsible_name||"Sin responsable") +
  ' · ☎ ' + esc(a.responsible_phone||"Sin teléfono") +
  '</p><div class="ld-split">' +
  '<div class="ld-panel"><h3>📋 Pendientes</h3>' +
  '<div class="ld-list">' + list +
  (tasks.length?"":'<p>No hay pendientes.</p>') +
  '</div>' +
  (GG?'<form id="ldTaskForm" class="ld-form" ' +
   'style="margin-top:20px">' +
   '<input type="hidden" name="asset_id" value="' + a.id + '">' +
   '<label>Nuevo pendiente<textarea name="title" required ' +
   'placeholder="Describe lo que se necesita hacer..."></textarea></label>' +
   '<label>Estatus<select name="status">' +
   '<option value="pendiente">Pendiente</option>' +
   '<option value="hecho">Hecho</option>' +
   '</select></label>' +
   '<button class="ld-btn ld-primary">Agregar pendiente</button>' +
   '</form>':"") +
  '</div><div class="ld-panel">' +
  '<h3>💬 Actualizaciones</h3>' +
  (selected?'<p><strong>' + esc(selected.title) + '</strong></p>' +
   '<span class="ld-pill">' + esc(selected.status) + '</span>' +
   (GG?"":'<form id="ldStatusForm" class="ld-form" ' +
    'style="margin-top:15px">' +
    '<input type="hidden" name="id" value="' +
    selected.id + '">' +
    '<label>Estatus<select name="status">' +
    '<option value="pendiente"' +
    (selected.status==="pendiente"?" selected":"") +
    '>Pendiente</option><option value="hecho"' +
    (selected.status==="hecho"?" selected":"") +
    '>Hecho</option></select></label>' +
    '<button class="ld-btn">Guardar estatus</button></form>') +
   '<div style="margin-top:20px">' +
   updates.map(u =>
    '<div class="ld-post"><small>👤 ' +
    esc(u.author_email) + ' · ' +
    fmt(u.created_at) + '</small>' +
    '<p>' + esc(u.body) + '</p>' +
    '<div>' + (Array.isArray(u.photos)
      ? u.photos.map(path =>
        '<button class="ld-btn" data-action="openPhoto" ' +
        'data-path="' + esc(path) +
        '">📷 Ver fotografía</button>'
       ).join("")
      : "") + '</div></div>'
   ).join("") +
   (updates.length?"":'<p class="ld-address">Sin actualizaciones.</p>') +
   '</div>' +
   (!GG?'<form id="ldPostForm" class="ld-form">' +
    '<input type="hidden" name="task_id" value="' +
    selected.id + '">' +
    '<label>Comentario o retroalimentación' +
    '<textarea name="body" placeholder="Escribe qué se hizo, ' +
    'qué falta o cualquier observación..."></textarea></label>' +
    '<label>Fotografías<input type="file" name="photos" ' +
    'multiple accept="image/jpeg,image/png,image/webp"></label>' +
    '<button class="ld-btn ld-primary">Publicar actualización</button>' +
    '</form>':"")
   :'<p>Selecciona un pendiente para ver su foro.</p>') +
  '</div></div>'
 );
 host.dataset.asset = assetId;
 host.dataset.task = selected?.id||"";
}

function taskEditor(id) {
 const t = data.tasks.find(x=>x.id===id);
 if(!t) return;

 modal("Modificar pendiente",
  '<form id="ldTaskEditForm" class="ld-form">' +
  '<input type="hidden" name="id" value="' + t.id + '">' +
  '<label>Pendiente<textarea name="title" required>' +
  esc(t.title) + '</textarea></label>' +
  '<label>Estatus<select name="status">' +
  '<option value="pendiente"' +
  (t.status==="pendiente"?" selected":"") +
  '>Pendiente</option><option value="hecho"' +
  (t.status==="hecho"?" selected":"") +
  '>Hecho</option></select></label>' +
  '<button class="ld-btn ld-primary">Guardar cambios</button>' +
  '</form><p><button class="ld-btn" data-action="deleteTask" ' +
  'data-id="' + t.id + '">Eliminar pendiente</button></p>'
 );
}

/* =======================================================
   MEDICIONES DE AGUA
======================================================= */

function waterPanel(assetId,editId=null) {
 const a = data.assets.find(x=>x.id===assetId);
 const edit = data.water.find(x=>x.id===editId);

 const readings = data.water
  .filter(x=>x.asset_id===assetId)
  .sort((x,y) =>
   x.reading_date.localeCompare(y.reading_date)
   || x.created_at.localeCompare(y.created_at)
  );

 const rows = readings.map((w,i) => {
  const prev = readings[i-1];
  const delta = prev
   ? (Number(w.reading)-Number(prev.reading)).toFixed(3)
   : "—";

  return '<div class="ld-water-row">' +
   '<span>' + esc(w.reading_date) + '</span>' +
   '<strong>' + Number(w.reading).toFixed(3) + '</strong>' +
   '<span class="ld-water-value">💧 ' +
   delta + '</span>' +
   '<button class="ld-btn" data-action="editWater" ' +
   'data-id="' + w.id + '">Editar</button>' +
   '</div>';
 }).reverse().join("");

 modal("💧 Agua · " + a.name,
  '<p class="ld-address">Registra la lectura del medidor. ' +
  'El consumo se calcula restando la lectura anterior.</p>' +
  '<form id="ldWaterForm" class="ld-form">' +
  '<input type="hidden" name="id" value="' +
  esc(edit?.id||"") + '">' +
  '<input type="hidden" name="asset_id" value="' +
  assetId + '">' +
  '<div class="ld-two">' +
  '<label>Fecha de medición<input type="date" ' +
  'name="reading_date" required value="' +
  (edit?.reading_date||
   new Date().toISOString().slice(0,10)) + '"></label>' +
  '<label>Lectura actual<input type="number" step=".001" ' +
  'min="0" name="reading" required value="' +
  (edit?.reading??"") + '"></label></div>' +
  '<button class="ld-btn ld-primary">Guardar lectura</button>' +
  '</form><h3 style="margin-top:30px">Historial de mediciones</h3>' +
  (rows||'<p>No hay mediciones todavía.</p>') +
  (edit?'<button class="ld-btn" data-action="deleteWater" ' +
   'data-id="' + edit.id + '">Eliminar esta lectura</button>':"")
 );
 host.dataset.asset = assetId;
}

/* =======================================================
   ARCHIVOS PRIVADOS
======================================================= */

async function upload(file,folder,id) {
 if(file.size > 10*1024*1024) {
  throw Error("El archivo excede 10 MB: "+file.name);
 }

 const allowed = [
  "application/pdf","image/jpeg","image/png","image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
 ];

 if(!allowed.includes(file.type)) {
  throw Error("Tipo de archivo no permitido: "+file.name);
 }

 const ext = file.name.split(".").pop()
  .toLowerCase().replace(/[^a-z0-9]/g,"");

 const storagePath = folder + "/" + id + "/" +
  crypto.randomUUID() + "." + ext;

 const {error} = await db.storage
  .from("gg_ld_files")
  .upload(storagePath,file,{
   upsert:false,
   contentType:file.type
  });

 if(error) throw error;
 return storagePath;
}

async function openFile(storagePath) {
 const {data:link,error} = await db.storage
  .from("gg_ld_files")
  .createSignedUrl(storagePath,60);

 if(error) throw error;
 window.open(link.signedUrl,"_blank","noopener");
}

/* =======================================================
   INTERACCIONES Y FORMULARIOS
======================================================= */

document.addEventListener("input",e => {
 if(e.target.id==="ldSearch") {
  search=e.target.value;
  const pos=e.target.selectionStart;
  render();
  const input=$("#ldSearch");
  input.focus();
  input.setSelectionRange(pos,pos);
 }
});

document.addEventListener("change", async e => {
 const id=e.target.dataset.responsible;

 if(id && GG) {
  const a=data.assets.find(x=>x.id===id);
  if(!a)return;

  try {
   await call("asset_save",{
    id:a.id,name:a.name,address:a.address,
    type:a.type,icon:a.icon,
    responsible_id:e.target.value||null
   });
   await refresh(true);
   toast("Responsable asignado.");
  }catch(err){toast(err.message)}
 }

 if(e.target.id==="ldFiles") {
  selectedFiles=[...e.target.files];
  const node=$("#ldFileCount");
  if(node) node.textContent =
   selectedFiles.length+" archivo(s) seleccionado(s)";
 }
});

document.addEventListener("dragover",e => {
 if(e.target.closest("#ldDrop")) {
  e.preventDefault();
  e.target.closest("#ldDrop").classList.add("dragging");
 }
});

document.addEventListener("drop",e => {
 const drop=e.target.closest("#ldDrop");
 if(!drop) return;
 e.preventDefault();
 drop.classList.remove("dragging");
 selectedFiles=[...e.dataTransfer.files];
 const node=$("#ldFileCount");
 if(node)node.textContent =
  selectedFiles.length+" archivo(s) listo(s) para cargar";
});

document.addEventListener("click",async e => {
 const button=e.target.closest("[data-action]");
 if(!button)return;

 const action=button.dataset.action;
 const id=button.dataset.id;
 const storagePath=button.dataset.path;

 try {
  if(action==="close") return close();
  if(action==="people")return peopleManager();
  if(action==="assets")return assetManager();
  if(action==="editPerson")return peopleManager(id);
  if(action==="editAsset")return assetManager(id);
  if(action==="tasks")return taskPanel(id);
  if(action==="water")return waterPanel(id);
  if(action==="editTask")return taskEditor(id);
  if(action==="loTask") {
   const t=data.tasks.find(x=>x.id===id);
   return taskPanel(t.asset_id,id);
  }
  if(action==="selectTask") {
   const t=data.tasks.find(x=>x.id===id);
   return taskPanel(t.asset_id,id);
  }
  if(action==="editWater") {
   const w=data.water.find(x=>x.id===id);
   return waterPanel(w.asset_id,id);
  }
  if(action==="filter") {
   filter=button.dataset.filter;
   return render();
  }
  if(action==="refresh")return await refresh();
  if(action==="openDoc"||action==="openPhoto") {
   return await openFile(storagePath);
  }

  if(action==="sendTask") {
   if(!confirm("¿Enviar este pendiente a LO?"))return;
   await call("task_send",{id});
   await refresh(true);
   const t=data.tasks.find(x=>x.id===id);
   taskPanel(t.asset_id,id);
   return toast("Pendiente enviado a LO.");
  }

  const removes = {
   deletePerson:"person_delete",
   deleteAsset:"asset_delete",
   deleteTask:"task_delete",
   deleteWater:"water_delete",
   deleteDoc:"doc_delete"
  };

  if(removes[action]) {
   if(!confirm("¿Eliminar este registro?"))return;
   await call(removes[action],{id});
   close();
   await refresh(true);
   return toast("Registro eliminado.");
  }
 }catch(err) {
  console.error(err);
  toast(err.message);
 }
});

document.addEventListener("submit",async e => {
 const form=e.target;
 if(!form.id.startsWith("ld"))return;

 e.preventDefault();

 const button=form.querySelector('[type="submit"],button');
 if(button)button.disabled=true;

 const f=new FormData(form);
 const value=name=>String(f.get(name)||"").trim();

 try {
  if(form.id==="ldPersonForm") {
   const result=await call("person_save",{
    id:value("id")||null,
    full_name:value("full_name"),
    phone:value("phone"),
    color:value("color")||COLORS[0]
   });

   for(const file of selectedFiles) {
    const storagePath=await upload(
     file,"responsables",result.id
    );
    await call("doc_add",{
     person_id:result.id,
     name:file.name,
     storage_path:storagePath
    });
   }
   selectedFiles=[];
  }

  if(form.id==="ldAssetForm") {
   await call("asset_save",{
    id:value("id")||null,
    name:value("name"),
    address:value("address"),
    type:value("type"),
    icon:value("icon")||"local-small",
    responsible_id:value("responsible_id")||null
   });
  }

  if(form.id==="ldTaskForm"||
     form.id==="ldTaskEditForm") {
   await call("task_save",{
    id:value("id")||null,
    asset_id:value("asset_id")||null,
    title:value("title"),
    status:value("status")
   });
  }

  if(form.id==="ldWaterForm") {
   await call("water_save",{
    id:value("id")||null,
    asset_id:value("asset_id"),
    reading_date:value("reading_date"),
    reading:value("reading")
   });
  }

  if(form.id==="ldStatusForm") {
   await call("task_update",{
    id:value("id"),status:value("status")
   });
  }

  if(form.id==="ldPostForm") {
   const taskId=value("task_id");
   const photoInput=form.querySelector(
    'input[name="photos"]'
   );

   const photos=[];

   for(const file of [...photoInput.files].slice(0,5)) {
    if(!file.type.startsWith("image/"))
     throw Error("Solo fotografías en actualizaciones.");
    photos.push(await upload(file,"tasks",taskId));
   }

   await call("post_add",{
    task_id:taskId,
    body:value("body"),
    photos
   });
  }

  const taskId=host.dataset.task;
  const assetId=host.dataset.asset;
  const formId=form.id;

  close();
  await refresh(true);

  if(formId==="ldStatusForm"||
     formId==="ldPostForm") {
   const task=data.tasks.find(t=>
    t.id===(taskId||value("id")||value("task_id"))
   );
   if(task)taskPanel(task.asset_id,task.id);
  }

  toast("Guardado correctamente.");
 }catch(err) {
  console.error(err);
  toast("No se guardó: "+err.message);
 }finally {
  if(button)button.disabled=false;
 }
});

/* =======================================================
   SESIÓN Y PERMISOS
======================================================= */

async function start() {
 try {
  if(!db)throw Error("Cliente Supabase no disponible.");

  const {data:user,error}=await db.auth.getUser();
  if(error||!user?.user) {
   location.replace(GG?"index.html":"/");
   return;
  }

  await refresh(true);

  if(GG && data.mode!=="gg") {
   throw Error("Acceso exclusivo de Dirección.");
  }

  if(!GG && data.mode!=="lo") {
   throw Error("No tienes acceso operativo de LO.");
  }
 }catch(err) {
  app.innerHTML="";
  const div=document.createElement("div");
  div.className="ld-empty";
  div.textContent="No fue posible abrir el módulo: "+err.message;
  app.append(div);
 }
}

start();
})();
`;

/* =======================================================
   INYECTAR EN GRUPO GUTIÉRREZ
======================================================= */

if (isGG) {
  let home = get("sistema.html");

  if (!home.includes('data-module="direccion"')) {
    const card = String.raw`
<div class="module-shell slot-direccion"
 style="--delay:.65s">
 <button type="button" class="module-card"
  data-module="direccion">
  <span class="card-top">
    <span class="card-icon">⌂</span>
    <span class="card-serial">10 / 10</span>
  </span>
  <span class="card-content">
    <span class="card-eyebrow">ADMINISTRACIÓN</span>
    <strong class="card-title">Dirección</strong>
    <span class="card-description">
      Locales, departamentos y patrimonio
    </span>
  </span>
  <span class="card-footer">
    <span class="card-meta">GESTIÓN</span>
    <span class="card-arrow">↗</span>
  </span>
 </button>
</div>`;

    const match=/<div\s+class="module-grid"\s*>/i.exec(home);
    if(!match)throw Error("No encontré module-grid en GG.");

    const start=match.index+match[0].length;
    const tags=/<\/?div\b[^>]*>/gi;
    tags.lastIndex=start;
    let depth=1, end=-1, tag;

    while((tag=tags.exec(home))) {
      depth+=/^<div\b/i.test(tag[0])?1:-1;
      if(depth===0) {
        end=tag.index;
        break;
      }
    }

    if(end<0)throw Error("No encontré cierre de module-grid.");

    home=home.slice(0,end)+card+"\n"+home.slice(end);
  }

  home=before(
    home,"</head>",
    '<link rel="stylesheet" href="css/gg-direccion-layout.css">'
  );

  put("sistema.html",home);

  let nav=get("js/gg-sistemas-nav.js");

  if(!nav.includes('direccion: "direccion.html"')) {
    const old='sistemas: "sistemas.html"';

    if(!nav.includes(old)) {
      throw Error("No encontré las rutas de Sistemas GG.");
    }

    nav=nav.replace(
      old,old+',\n    direccion: "direccion.html"'
    );
  }

  put("js/gg-sistemas-nav.js",nav);

  let orbital=get("js/sistema-orbital.js");

  orbital=orbital.replace(
    /modules\.length\s*!==\s*9/g,
    "modules.length !== 10"
  );

  put("js/sistema-orbital.js",orbital);

  let systems=get("sistemas.html");

  if(!systems.includes('value="direccion"')) {
    const match=systems.indexOf("</select>");

    if(match<0)throw Error("No encontré selector de Sistemas.");

    systems=systems.slice(0,match)+
      '<option value="direccion">Dirección</option>\n'+
      systems.slice(match);
  }

  put("sistemas.html",systems);

  put("direccion.html", directionHTML.replaceAll("\\`", "`"));
  put("locales-departamentos.html",makeAppHTML("gg"));
  put("css/gg-direccion-layout.css",ggLayoutCSS);
  put("css/ld-ui.css",appCSS);
  put("js/ld-app.js",appJS);
}

/* =======================================================
   INYECTAR EN LO
======================================================= */

if (isLO) {
  let dashboard=get("public/dashboard.html");

  if(!dashboard.includes('id="localesDepartamentosButton"')) {
    const start=dashboard.indexOf(
      '<section class="lo-orbit"'
    );

    if(start<0)throw Error("No encontré órbita de LO.");

    const end=dashboard.indexOf("</section>",start);

    if(end<0)throw Error("No encontré cierre de órbita LO.");

    const card=String.raw`
<button class="lo-module-card lo-module-9"
 id="localesDepartamentosButton" type="button">
 <span class="lo-module-index">09</span>
 <span class="lo-module-icon">🏘️</span>
 <span class="lo-module-copy">
   <strong>Locales y Departamentos</strong>
   <small>Pendientes y actualizaciones</small>
 </span>
 <span class="lo-module-arrow">↗</span>
</button>`;

    dashboard=dashboard.slice(0,end)+
      card+"\n"+dashboard.slice(end);
  }

  dashboard=before(
    dashboard,"</head>",
    '<link rel="stylesheet" href="css/lo-locales-layout.css">'
  );

  dashboard=before(
    dashboard,"</body>",
    `<script>
document.getElementById("localesDepartamentosButton")
 ?.addEventListener("click",() => {
  location.href="locales-departamentos.html";
});
</script>`
  );

  put("public/dashboard.html",dashboard);
  put("public/locales-departamentos.html",makeAppHTML("lo"));
  put("public/css/lo-locales-layout.css",loLayoutCSS);
  put("public/css/ld-ui.css",appCSS);
  put("public/js/ld-app.js",appJS);
}

/* =======================================================
   VALIDACIÓN Y RECUPERACIÓN
======================================================= */

for(const [name,content] of writes) {
  if(name.endsWith(".js")) {
    new vm.Script(content,{filename:name});
  }

  if(!content.trim()) {
    throw Error("Archivo generado vacío: "+name);
  }
}

const previous=new Map();

try {
  for(const [name,content] of writes) {
    const target=path.join(ROOT,name);

    previous.set(
      target,
      fs.existsSync(target)
        ? fs.readFileSync(target)
        : null
    );

    fs.mkdirSync(path.dirname(target),{
      recursive:true
    });

    fs.writeFileSync(target,content,"utf8");
  }

  console.log("");
  console.log("=====================================");
  console.log(" LOCALES Y DEPARTAMENTOS INSTALADO");
  console.log("=====================================");
  console.log("Proyecto:",isGG?"GRUPO GUTIÉRREZ":"LO");
  console.log("✓ Tarjeta incorporada");
  console.log("✓ Diseño responsive");
  console.log("✓ Pantallas y estilos instalados");
  console.log("✓ Datos conectados a Supabase");
  console.log("✓ Archivos privados preparados");
  console.log("✓ Sin respaldos .bak");
  console.log("");
  console.log("Ahora reinicia el servidor local.");
} catch(error) {
  for(const [target,content] of previous) {
    try {
      if(content===null) {
        fs.rmSync(target,{force:true});
      } else {
        fs.writeFileSync(target,content);
      }
    }catch(e) {
      console.error("No se pudo recuperar:",target,e);
    }
  }
  throw error;
}
