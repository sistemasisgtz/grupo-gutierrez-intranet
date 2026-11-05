
"use strict";

/*
  LO × Grupo Gutiérrez
  Liquid Glass · Locales y Departamentos V1

  Ejecutar el mismo instalador en las dos carpetas.
  Primero ejecutar el SQL en Supabase.

  No crea respaldos .bak.
  No utiliza Base64 ni datos comprimidos.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = process.cwd();
const LO = fs.existsSync(
  path.join(ROOT, "public/dashboard.html")
);
const GG = fs.existsSync(
  path.join(ROOT, "direccion.html")
);

if (LO === GG) {
  throw Error(
    "Ejecuta desde la raíz de LO o Grupo Gutiérrez."
  );
}

const to = f => path.join(ROOT, f);
const pending = new Map();
const before = new Map();

function original(f) {
  if (!fs.existsSync(to(f))) {
    throw Error("Archivo requerido no encontrado: " + f);
  }
  return fs.readFileSync(to(f), "utf8");
}

function put(f, content) {
  pending.set(
    f,
    content.replace(/\r\n/g, "\n").trimEnd() + "\n"
  );
}

function replaceOne(s, from, into, where) {
  if (!s.includes(from)) {
    throw Error(
      "Cambió " + where +
      "; falta referencia: " + from.slice(0, 60)
    );
  }
  return s.replace(from, into);
}

/* ====================================================
   INTERFAZ LO
==================================================== */

const LO_HTML = `
<!doctype html>
<html lang="es" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport"
 content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#f4f9ff">
<title>Bienes & seguimiento · Ingeniería LO</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com"
 crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
 rel="stylesheet">
<link rel="stylesheet" href="css/ld-workspace-v1.css">
</head>
<body>
<div class="w-ambient" aria-hidden="true">
 <i></i><i></i><i></i>
</div>
<header class="w-header">
 <a class="w-logo" href="dashboard.html">
  <span>LO<span class="w-star">✳</span></span>
  <small>INGENIERÍA Y PROYECTOS</small>
 </a>
 <div class="w-head-actions">
  <button id="wTheme" class="w-plain"
   type="button">◐ Apariencia</button>
  <a class="w-plain" href="dashboard.html">
   ← Dashboard
  </a>
 </div>
</header>
<main class="w-shell" id="wShell" hidden>
 <div class="w-kicker">
  LO / PATRIMONIO / WORKSPACE
 </div>
 <div class="w-heading">
  <div>
   <h1>Bienes<span> & </span>seguimiento.</h1>
   <p>Todo lo importante, claro y en su lugar.</p>
  </div>
  <button class="w-refresh" id="wRefresh"
   type="button">↻ Actualizar</button>
 </div>
 <section class="w-metrics" aria-label="Resumen">
  <div><small>BIENES REGISTRADOS</small>
   <strong id="wTotal">—</strong></div>
  <div><small>BIENES CON PENDIENTES</small>
   <strong id="wOpenAssets">—</strong></div>
  <div><small>PENDIENTES ACTIVOS</small>
   <strong id="wOpenTasks">—</strong></div>
  <div><small>TERMINADOS</small>
   <strong id="wDone">—</strong></div>
 </section>
 <nav class="w-tabs" role="tablist">
  <button class="selected" type="button"
   data-tab="pending" role="tab" aria-selected="true">
   Pendientes <span id="wPendingTabCount">0</span>
  </button>
  <button type="button" data-tab="all"
   role="tab" aria-selected="false">
   Todos los bienes <span id="wAllTabCount">0</span>
  </button>
 </nav>
 <section class="w-filters" aria-label="Filtros">
  <label class="w-search">
   ⌕
   <input id="wSearch"
    placeholder="Buscar folio, inmueble, dirección, responsable..."
    autocomplete="off">
  </label>
  <label>TIPO
   <select id="wType">
    <option value="all">Todos los tipos</option>
    <option value="local">Locales</option>
    <option value="departamento">Departamentos</option>
    <option value="casa">Casas</option>
   </select>
  </label>
  <label>ESTATUS
   <select id="wStatus">
    <option value="all">Cualquier estatus</option>
    <option value="pendiente">Pendiente</option>
    <option value="programado">Programado</option>
    <option value="ejecucion">En Ejecución</option>
   </select>
  </label>
  <label>RESPONSABLE
   <select id="wPerson">
    <option value="all">Todos</option>
   </select>
  </label>
 </section>
 <div class="w-section-line">
  <h2 id="wSectionTitle">Bienes con pendientes</h2>
  <span id="wVisible">Cargando…</span>
 </div>
 <section id="wRows" class="w-items"
  aria-live="polite"></section>
</main>
<section class="w-error" id="wError" hidden>
 <h2>No pudimos abrir el workspace</h2>
 <p id="wErrorText"></p>
 <a href="dashboard.html">Volver al dashboard</a>
</section>
<div id="wModal"></div>
<div id="wToast" role="status" aria-live="polite"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
<script src="js/ld-workspace-v1.js"></script>
</body>
</html>
`;

/* ====================================================
   ESTILOS LO
==================================================== */

const LO_CSS = `
:root{
 font-family:Inter,-apple-system,BlinkMacSystemFont,
 "Segoe UI",sans-serif;
 color-scheme:light;
 --bg:#f4f8fe;
 --glass:#ffffffdb;
 --glass-strong:#ffffff;
 --text:#14243c;
 --soft:#657991;
 --line:#dbe7f4;
 --blue:#1b80c0;
 --blue-soft:#e4f4ff;
 --shadow:0 22px 70px #3978ac17;
 --input:#f9fcff;
}
:root[data-theme=dark]{
 color-scheme:dark;
 --bg:#0d1828;
 --glass:#182b3cde;
 --glass-strong:#1b3146;
 --text:#eff8ff;
 --soft:#a8bacd;
 --line:#344d66;
 --blue:#6bc6f7;
 --blue-soft:#29435b;
 --shadow:0 22px 70px #040c1980;
 --input:#14283d;
}
*{box-sizing:border-box}
body{
 margin:0;
 background:var(--bg);
 color:var(--text);
 min-height:100vh;
 transition:background .3s,color .3s;
}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
button:disabled{opacity:.55;cursor:wait}
a{color:inherit;text-decoration:none}
[hidden]{display:none!important}

.w-ambient{
 pointer-events:none;
 position:fixed;
 inset:0;
 overflow:hidden;
 z-index:-1;
}
.w-ambient i{
 position:absolute;
 border-radius:45%;
 filter:blur(35px);
 opacity:.48;
 animation:wFloat 19s ease-in-out infinite alternate;
}
.w-ambient i:first-child{
 width:46vw;height:46vw;
 min-width:380px;min-height:380px;
 top:-25%;left:-11%;
 background:#a5e4ff;
}
.w-ambient i:nth-child(2){
 width:38vw;height:38vw;
 bottom:-18%;right:-9%;
 background:#c7c7ff;
 animation-delay:-6s;
}
.w-ambient i:nth-child(3){
 width:24vw;height:24vw;
 top:30%;right:20%;
 background:#e6f3ff;
 animation-delay:-12s;
}
@keyframes wFloat{
 to{
  transform:translate(9%,12%) rotate(28deg) scale(1.16)
 }
}
@keyframes wLiquid{
 to{background-position:100% 0}
}
@keyframes wUp{
 from{opacity:0;transform:translateY(20px)}
 to{opacity:1;transform:translateY(0)}
}
@keyframes wFade{
 from{opacity:0}
 to{opacity:1}
}
.w-header{
 height:82px;
 display:flex;
 align-items:center;
 justify-content:space-between;
 gap:12px;
 padding:0 max(24px,calc((100vw - 1500px)/2));
 border-bottom:1px solid var(--line);
 background:var(--glass);
 backdrop-filter:blur(26px);
 position:relative;
 z-index:2;
}
.w-logo{
 display:flex;
 align-items:center;
 gap:12px;
}
.w-logo>span{
 font-size:26px;
 font-weight:900;
 letter-spacing:-.08em;
}
.w-star{color:var(--blue)}
.w-logo small{
 font-size:10px;
 font-weight:800;
 letter-spacing:.14em;
 color:var(--soft);
}
.w-head-actions{display:flex;gap:9px}
.w-plain,.w-refresh{
 border:1px solid var(--line);
 background:var(--glass-strong);
 color:var(--text);
 border-radius:999px;
 padding:12px 18px;
 font-size:12px;
 font-weight:700;
 box-shadow:0 5px 18px #204e7108;
}
.w-shell{
 max-width:1550px;
 margin:auto;
 padding:52px 26px 100px;
}
.w-kicker{
 font-weight:800;
 color:var(--blue);
 font-size:10px;
 letter-spacing:.24em;
 animation:wUp .55s both;
}
.w-heading{
 display:flex;
 justify-content:space-between;
 align-items:center;
 gap:18px;
 animation:wUp .6s both;
}
.w-heading h1{
 font-size:clamp(43px,5.4vw,79px);
 font-weight:850;
 letter-spacing:-.075em;
 line-height:1.12;
 margin:15px 0 8px;
 max-width:1050px;
 background:linear-gradient(
  105deg,var(--text),#60c9f7,#94a8ed,var(--text)
 );
 background-size:280% 100%;
 background-clip:text;
 -webkit-background-clip:text;
 color:transparent;
 animation:wLiquid 9s ease-in-out infinite alternate;
}
.w-heading h1 span{font-weight:400}
.w-heading p{
 color:var(--soft);
 margin:0 0 25px;
 font-size:15px;
}
.w-metrics{
 display:grid;
 grid-template-columns:repeat(4,1fr);
 gap:13px;
 margin:25px 0 28px;
}
.w-metrics>div{
 background:var(--glass);
 backdrop-filter:blur(24px);
 border:1px solid var(--line);
 border-radius:23px;
 padding:22px 24px;
 box-shadow:var(--shadow);
 animation:wUp .65s both;
}
.w-metrics>div:nth-child(2){animation-delay:.07s}
.w-metrics>div:nth-child(3){animation-delay:.14s}
.w-metrics>div:nth-child(4){animation-delay:.21s}
.w-metrics small{
 display:block;
 color:var(--soft);
 font-size:10px;
 font-weight:750;
 letter-spacing:.09em;
}
.w-metrics strong{
 font-size:40px;
 letter-spacing:-.06em;
 display:block;
 margin-top:10px;
}
.w-tabs{
 display:flex;
 gap:8px;
 border-bottom:1px solid var(--line);
 margin-top:32px;
 padding-bottom:12px;
}
.w-tabs button{
 border:1px solid transparent;
 background:transparent;
 color:var(--soft);
 border-radius:13px;
 padding:13px 21px;
 font-size:13px;
 font-weight:750;
 transition:.23s;
}
.w-tabs button.selected{
 background:var(--glass-strong);
 border-color:var(--line);
 box-shadow:var(--shadow);
 color:var(--text);
}
.w-tabs button span{
 display:inline-grid;
 place-items:center;
 min-width:23px;height:23px;
 border-radius:20px;
 background:var(--blue-soft);
 color:var(--blue);
 font-size:11px;
 padding:0 5px;
 margin-left:8px;
}
.w-filters{
 display:flex;
 align-items:end;
 gap:12px;
 flex-wrap:wrap;
 margin:22px 0 36px;
}
.w-filters label{
 display:grid;
 gap:8px;
 color:var(--soft);
 font-size:10px;
 letter-spacing:.09em;
 font-weight:800;
}
.w-filters select,.w-search{
 border:1px solid var(--line);
 border-radius:14px;
 color:var(--text);
 background:var(--glass-strong);
 min-height:48px;
 padding:0 14px;
 outline:0;
}
.w-filters select{
 min-width:150px;
 max-width:220px;
}
.w-filters select:focus,
.w-search:focus-within{
 border-color:var(--blue);
}
.w-search{
 display:flex;
 align-items:center;
 gap:9px;
 flex:1;
 min-width:260px;
 font-size:23px;
 color:var(--blue);
}
.w-search input{
 width:100%;
 background:transparent;
 border:none;
 outline:none;
 color:var(--text);
 font-size:13px;
 min-width:0;
}
.w-section-line{
 display:flex;
 align-items:center;
 justify-content:space-between;
 gap:10px;
 margin-bottom:14px;
}
.w-section-line h2{
 font-size:19px;
 letter-spacing:-.03em;
 margin:0;
}
.w-section-line span{
 color:var(--soft);
 font-size:12px;
}
.w-items{display:grid;gap:13px}
.w-card{
 display:grid;
 grid-template-columns:
  minmax(190px,1fr)
  minmax(230px,1.4fr)
  auto;
 gap:24px;
 align-items:center;
 padding:24px 26px;
 background:var(--glass);
 border:1px solid var(--line);
 border-radius:23px;
 box-shadow:var(--shadow);
 backdrop-filter:blur(24px);
 transition:transform .23s,box-shadow .23s,border .23s;
 animation:wUp .48s both;
 cursor:pointer;
 text-align:left;
 width:100%;
 color:inherit;
}
.w-card:hover{
 transform:translateY(-3px);
 border-color:#79bbe3;
 box-shadow:0 24px 48px #3978ac22;
}
.w-card .w-folio{
 font-size:clamp(26px,3vw,37px);
 font-weight:850;
 letter-spacing:-.055em;
 line-height:1.1;
 overflow-wrap:anywhere;
}
.w-card .w-sub{
 display:block;
 color:var(--soft);
 font-size:12px;
 margin-top:8px;
 line-height:1.5;
}
.w-card .w-address{
 font-size:13px;
 line-height:1.5;
 color:var(--text);
}
.w-card .w-person{
 display:block;
 font-size:12px;
 color:var(--soft);
 margin-top:9px;
}
.w-alert{
 display:flex;
 align-items:center;
 gap:9px;
 font-size:12px;
 font-weight:800;
 color:#a76612;
 background:#fff4d9;
 padding:10px 14px;
 border-radius:100px;
 white-space:nowrap;
}
.w-alert b{
 display:grid;
 place-items:center;
 background:#f2c268;
 width:22px;height:22px;
 border-radius:100%;
 color:#543509;
}
.w-card .w-chevron{
 font-size:22px;
 color:var(--blue);
 margin-left:10px;
}
.w-allrow{
 display:grid;
 grid-template-columns:
  minmax(175px,240px)
  minmax(170px,1fr)
  minmax(160px,1.5fr) auto;
 gap:17px;
 align-items:center;
 background:var(--glass);
 border:1px solid var(--line);
 padding:16px 19px;
 border-radius:18px;
 animation:wUp .4s both;
}
.w-allrow .w-folio-cell{display:flex;gap:6px}
.w-folio-cell input{
 width:100%;
 min-width:0;
 padding:12px 11px;
 background:var(--input);
 color:var(--text);
 border:1px solid var(--line);
 border-radius:10px;
 font-size:12px;
 font-weight:750;
}
.w-folio-cell button,.w-detail-btn{
 border:1px solid var(--line);
 color:var(--blue);
 background:var(--blue-soft);
 padding:10px 13px;
 border-radius:10px;
 font-size:12px;
 font-weight:800;
}
.w-allrow strong{font-size:13px}
.w-allrow small{
 display:block;
 font-size:11px;
 color:var(--soft);
 margin-top:6px;
}
.w-muted{
 color:var(--soft);
 font-size:12px;
}
.w-empty{
 text-align:center;
 padding:65px 20px;
 border:1px dashed var(--line);
 border-radius:23px;
 background:var(--glass);
 color:var(--soft);
}
.w-overlay{
 position:fixed;
 inset:0;
 background:#0a203973;
 backdrop-filter:blur(13px);
 z-index:99;
 display:grid;
 place-items:center;
 padding:18px;
 animation:wFade .2s both;
}
.w-dialog{
 width:min(1100px,100%);
 max-height:94vh;
 overflow:auto;
 border-radius:29px;
 border:1px solid var(--line);
 background:var(--glass-strong);
 box-shadow:0 42px 110px #05162c5e;
 animation:wUp .27s both;
}
.w-dialog-head{
 position:sticky;
 top:0;
 z-index:4;
 background:var(--glass-strong);
 border-bottom:1px solid var(--line);
 display:flex;
 align-items:center;
 justify-content:space-between;
 gap:10px;
 padding:24px 30px;
}
.w-dialog-head small{
 color:var(--blue);
 font-size:10px;
 font-weight:850;
 letter-spacing:.16em;
}
.w-dialog-head h2{
 font-size:27px;
 letter-spacing:-.05em;
 margin:5px 0;
}
.w-close{
 border:1px solid var(--line);
 background:var(--input);
 color:var(--text);
 border-radius:100%;
 font-size:22px;
 width:41px;height:41px;
}
.w-dialog-content{padding:27px 31px 38px}
.w-steps{
 display:flex;
 gap:10px;
 margin-bottom:24px;
}
.w-step{
 padding:10px 15px;
 border-radius:100px;
 background:var(--input);
 color:var(--soft);
 font-weight:750;
 font-size:11px;
}
.w-step.current{
 background:var(--blue-soft);
 color:var(--blue);
}
.w-back{
 border:0;
 background:transparent;
 color:var(--blue);
 font-weight:750;
 margin-bottom:17px;
}
.w-choose{display:grid;gap:11px}
.w-task{
 display:grid;
 grid-template-columns:1fr auto;
 align-items:center;
 gap:12px;
 text-align:left;
 border:1px solid var(--line);
 background:var(--input);
 color:var(--text);
 border-radius:17px;
 padding:19px 21px;
 transition:.2s;
}
.w-task:hover{
 border-color:var(--blue);
 transform:translateX(4px);
}
.w-task strong{
 font-size:15px;
 display:block;
}
.w-task small{
 font-size:11px;
 color:var(--soft);
 display:block;
 margin-top:9px;
}
.w-status{
 display:inline-flex;
 padding:7px 11px;
 border-radius:999px;
 background:var(--blue-soft);
 color:var(--blue);
 font-size:11px;
 font-weight:750;
 white-space:nowrap;
}
.w-status.terminado{
 background:#e2f7ef;
 color:#15785e;
}
.w-status.pendiente{
 background:#fff2dd;
 color:#a56b16;
}
.w-status.ejecucion{
 background:#ddecff;
 color:#2563ac;
}
.w-status.programado{
 background:#efe9ff;
 color:#7655b3;
}
.w-forum-title{
 font-size:23px;
 margin:8px 0 18px;
 letter-spacing:-.04em;
}
.w-control{
 background:var(--input);
 padding:22px;
 border:1px solid var(--line);
 border-radius:20px;
}
.w-control label{
 font-weight:750;
 font-size:13px;
 display:grid;
 gap:9px;
 margin-bottom:16px;
}
.w-control select,.w-control textarea{
 background:var(--glass-strong);
 border:1px solid var(--line);
 border-radius:12px;
 padding:13px;
 color:var(--text);
 width:100%;
 outline:none;
}
.w-control textarea{
 min-height:115px;
 resize:vertical;
}
.w-control button{
 background:var(--text);
 color:var(--bg);
 border:0;
 padding:13px 19px;
 border-radius:12px;
 font-weight:800;
}
.w-control p{
 color:var(--soft);
 font-size:12px;
}
.w-forum{margin-top:28px}
.w-forum h3{font-size:20px}
.w-post{
 display:grid;
 grid-template-columns:40px minmax(0,1fr);
 gap:13px;
 border-bottom:1px solid var(--line);
 padding:18px 0;
}
.w-avatar{
 height:38px;width:38px;
 background:var(--blue-soft);
 color:var(--blue);
 display:grid;
 place-items:center;
 border-radius:50%;
 font-size:15px;
 font-weight:850;
}
.w-post strong{font-size:12px}
.w-post time{
 font-size:11px;
 color:var(--soft);
 margin-left:12px;
}
.w-post p{
 font-size:13px;
 white-space:pre-wrap;
 overflow-wrap:anywhere;
 line-height:1.75;
 margin:10px 0;
}
.w-post button{
 font-size:11px;
 background:var(--input);
 color:var(--blue);
 border:1px solid var(--line);
 border-radius:10px;
 padding:9px 11px;
 margin-right:7px;
}
.w-details{
 display:grid;
 grid-template-columns:repeat(2,minmax(0,1fr));
 gap:12px;
}
.w-details>div{
 padding:17px;
 background:var(--input);
 border:1px solid var(--line);
 border-radius:15px;
 min-width:0;
}
.w-details small{
 display:block;
 color:var(--soft);
 font-size:11px;
 margin-bottom:8px;
}
.w-details strong{
 font-size:14px;
 overflow-wrap:anywhere;
}
.w-detail-tasks{margin-top:22px}
.w-detail-tasks li{
 margin:8px 0;
 padding:10px 0;
 border-bottom:1px solid var(--line);
}
.w-error{
 max-width:600px;
 margin:15vh auto;
 text-align:center;
 padding:35px;
}
.w-error p{color:var(--soft)}
#wToast .toast{
 position:fixed;
 bottom:24px;
 left:50%;
 transform:translateX(-50%);
 z-index:200;
 background:#183b57;
 color:white;
 padding:14px 22px;
 border-radius:14px;
 box-shadow:0 15px 45px #071b2b44;
 max-width:calc(100vw - 30px);
 font-size:13px;
}
@media(max-width:1050px){
 .w-card{grid-template-columns:1fr 1fr}
 .w-card .w-alert{justify-self:start}
 .w-allrow{grid-template-columns:1fr 1fr}
 .w-metrics{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:640px){
 .w-header{height:70px;padding:0 15px}
 .w-logo small{display:none}
 .w-shell{padding:31px 15px 60px}
 .w-heading{align-items:start}
 .w-heading h1{font-size:clamp(42px,11vw,57px)}
 .w-heading .w-refresh{padding:9px;font-size:11px}
 .w-metrics{gap:8px}
 .w-metrics>div{padding:16px}
 .w-metrics strong{font-size:30px}
 .w-filters select{min-width:120px}
 .w-card,.w-allrow{
  grid-template-columns:1fr;
  gap:12px;
  padding:19px
 }
 .w-card .w-alert{justify-self:start}
 .w-dialog{max-height:98vh;border-radius:20px}
 .w-dialog-head,.w-dialog-content{padding:18px}
 .w-details{grid-template-columns:1fr}
 .w-tabs button{flex:1;padding:12px 7px;font-size:12px}
 .w-steps{flex-wrap:wrap}
}
@media(prefers-reduced-motion:reduce){
 *,*:before,*:after{
  animation:none!important;
  transition:none!important;
 }
}
`;

/* ====================================================
   LÓGICA COMPLETA DE LO
==================================================== */

const LO_JS = `
(() => {
"use strict";

const db = window.ggSupabase;
const $ = id => document.getElementById(id);

const state = {
 data:{
  assets:[],tasks:[],updates:[],people:[],water:[]
 },
 tab:"pending",
 meta:{folios:[],statuses:[]},
 modal:null,
 busy:false
};

const STATUSES = {
 pendiente:"Pendiente",
 programado:"Programado",
 ejecucion:"En Ejecución",
 terminado:"Terminado"
};

const esc = value => String(value ?? "")
 .replace(/[&<>"']/g,c => ({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
 }[c]));

const day = value => value
 ? new Date(value).toLocaleString("es-MX",{
    dateStyle:"medium",
    timeStyle:"short"
   })
 : "—";

const text = value => String(value ?? "")
 .normalize("NFD")
 .replace(/[\\u0300-\\u036f]/g,"")
 .toLowerCase();

function notify(message) {
 const node=document.createElement("div");
 node.className="toast";
 node.textContent=message;
 $("wToast").replaceChildren(node);
 setTimeout(()=>node.remove(),5000);
}

function folio(asset) {
 return state.meta.folios.find(
  f=>f.asset_id===asset.id
 )?.folio || "";
}

function status(task) {
 return state.meta.statuses.find(
  w=>w.task_id===task.id
 )?.status || (
  task.status==="hecho"
   ?"terminado":"pendiente"
 );
}

function active(task) {
 return status(task)!=="terminado";
}

function tasksFor(asset,onlyActive=false) {
 return state.data.tasks.filter(
  t=>t.asset_id===asset.id &&
  (!onlyActive||active(t))
 ).sort(
  (a,b)=>new Date(b.created_at)-new Date(a.created_at)
 );
}

function label(task) {
 return STATUSES[status(task)]||"Pendiente";
}

function stats() {
 const a=state.data.assets;
 const t=state.data.tasks;
 const openAssets=a.filter(x=>tasksFor(x,true).length);

 $("wTotal").textContent=a.length;
 $("wOpenAssets").textContent=openAssets.length;
 $("wOpenTasks").textContent=t.filter(active).length;
 $("wDone").textContent=t.filter(x=>!active(x)).length;
 $("wPendingTabCount").textContent=openAssets.length;
 $("wAllTabCount").textContent=a.length;
}

function filters() {
 return {
  query:text($("wSearch").value.trim()),
  type:$("wType").value,
  person:$("wPerson").value,
  status:$("wStatus").value
 };
}

function visible() {
 const f=filters();

 return state.data.assets.filter(a=>{
  const open=tasksFor(a,true);

  if(state.tab==="pending"&&!open.length)
   return false;

  if(f.type!=="all"&&a.type!==f.type)
   return false;

  if(
   f.person!=="all" &&
   a.responsible_id!==f.person
  ) return false;

  if(
   f.status!=="all" &&
   !tasksFor(a).some(t=>status(t)===f.status)
  ) return false;

  const corpus=text([
   folio(a),
   a.name,a.address,
   a.responsible_name,
   a.responsible_phone,
   ...tasksFor(a).map(t=>t.title)
  ].join(" "));

  return corpus.includes(f.query);
 }).sort(
  (a,b)=>(folio(a)||a.name)
   .localeCompare(folio(b)||b.name,"es",{numeric:true})
 );
}

function renderRows() {
 stats();

 const rows=visible();

 $("wVisible").textContent=rows.length+" bien(es)";
 $("wSectionTitle").textContent=
  state.tab==="pending"
   ?"Bienes con pendientes"
   :"Directorio de bienes";

 $("wRows").innerHTML=rows.map((a,i)=>{
  const open=tasksFor(a,true);
  const f=folio(a);
  const name=esc(a.name||"Bien sin nombre");

  if(state.tab==="pending") {
   return \`
   <button class="w-card" type="button"
    data-action="open" data-id="\${esc(a.id)}"
    style="animation-delay:\${Math.min(i*25,210)}ms">
    <div>
     <div class="w-folio">\${esc(f||"Sin folio")}</div>
     <small class="w-sub">
      \${name} · \${esc(a.type||"Bien")}
     </small>
    </div>
    <div>
     <div class="w-address">
      ⌖ \${esc(a.address||"Dirección no registrada")}
     </div>
     <span class="w-person">
      ◉ \${esc(a.responsible_name||"Sin responsable")}
      · \${esc(a.responsible_phone||"Sin teléfono")}
     </span>
    </div>
    <div class="w-alert">
     ⚠ <b>\${open.length}</b>
     \${open.length===1?"pendiente":"pendientes"}
     <span class="w-chevron">›</span>
    </div>
   </button>\`;
  }

  return \`
  <article class="w-allrow"
   style="animation-delay:\${Math.min(i*18,160)}ms">
   <div class="w-folio-cell">
    <input aria-label="Folio de \${name}"
     data-folio-input="\${esc(a.id)}"
     maxlength="60" value="\${esc(f)}"
     placeholder="Escribe folio">
    <button type="button" data-action="folio"
     data-id="\${esc(a.id)}">Guardar</button>
   </div>
   <div>
    <strong>\${name}</strong>
    <small>\${esc(a.type||"Bien")}</small>
   </div>
   <div>
    <span class="w-muted">
     ⌖ \${esc(a.address||"Sin dirección")}
    </span>
    <small>
     ◉ \${esc(a.responsible_name||"Sin responsable")}
     · \${esc(a.responsible_phone||"Sin teléfono")}
    </small>
   </div>
   <button class="w-detail-btn" type="button"
    data-action="details" data-id="\${esc(a.id)}">
    Detalles →
   </button>
  </article>\`;
 }).join("")||\`
 <div class="w-empty">
  \${state.tab==="pending"
   ?"No hay bienes con pendientes bajo estos filtros. ✨"
   :"No encontramos bienes con estos filtros."}
 </div>\`;
}

function syncPeople() {
 const current=$("wPerson").value;

 $("wPerson").innerHTML=
  '<option value="all">Todos</option>'+
  state.data.people.map(
   p=>\`<option value="\${esc(p.id)}">
    \${esc(p.full_name)}
   </option>\`
  ).join("");

 $("wPerson").value=
  state.data.people.some(p=>p.id===current)
   ?current:"all";
}

async function refresh(silent=false) {
 if(!db)throw Error("No se detectó Supabase");

 const response=await db.rpc("gg_ld_get_lo");

 if(response.error)throw response.error;

 if(response.data?.mode!=="lo") {
  throw Error(
   "Esta cuenta no tiene permisos operativos de LO"
  );
 }

 state.data={
  assets:[],tasks:[],updates:[],people:[],water:[],
  ...response.data
 };

 const meta=await db.rpc(
  "gg_ld_workspace_snapshot",
  {p_mode:"lo"}
 );

 if(meta.error)throw meta.error;

 state.meta={
  folios:meta.data?.folios||[],
  statuses:meta.data?.statuses||[]
 };

 syncPeople();
 renderRows();

 if(!silent)notify("Información actualizada");
}

function shell(title,kicker,body) {
 $("wModal").innerHTML=\`
 <div class="w-overlay" id="wOverlay">
  <section class="w-dialog" role="dialog"
   aria-modal="true" aria-label="\${esc(title)}">
   <header class="w-dialog-head">
    <div>
     <small>\${esc(kicker)}</small>
     <h2>\${esc(title)}</h2>
    </div>
    <button type="button" data-action="close"
     class="w-close" aria-label="Cerrar">×</button>
   </header>
   <div class="w-dialog-content">\${body}</div>
  </section>
 </div>\`;

 document.body.style.overflow="hidden";

 $("wModal").querySelector(".w-close").focus();
}

function close() {
 state.modal=null;
 $("wModal").replaceChildren();
 document.body.style.overflow="";
}

function openAsset(id,taskId=null) {
 const a=state.data.assets.find(x=>x.id===id);
 if(!a)return;

 state.modal={
  asset:id,task:taskId,kind:"workflow"
 };

 drawModal();
}

function drawModal() {
 if(!state.modal)return;

 const a=state.data.assets.find(
  x=>x.id===state.modal.asset
 );

 if(!a)return;

 if(state.modal.kind==="details")
  return renderDetails(a);

 const tasks=tasksFor(a,!state.modal.includeDone);
 const chosen=tasks.find(
  x=>x.id===state.modal.task
 );

 if(!chosen) {
  state.modal.task=null;

  shell(
   "Selecciona el pendiente",
   "PASO 01 / 02 · "+(folio(a)||a.name),
   \`
   <div class="w-steps">
    <span class="w-step current">01 · Pendiente</span>
    <span class="w-step">02 · Foro & estatus</span>
   </div>
   <p class="w-muted">
    Selecciona el pendiente para abrir
    su seguimiento completo.
   </p>
   <div class="w-choose">
    \${tasks.map(t=>\`
     <button class="w-task" data-action="choose"
      data-id="\${esc(t.id)}" type="button">
      <div>
       <strong>\${esc(t.title)}</strong>
       <small>Creado \${esc(day(t.created_at))}</small>
      </div>
      <span class="w-status \${status(t)}">
       \${label(t)} →
      </span>
     </button>
    \`).join("")||
    '<p>No tiene pendientes activos.</p>'}
   </div>\`
  );

  return;
 }

 const posts=state.data.updates.filter(
  u=>u.task_id===chosen.id
 ).sort(
  (a,b)=>new Date(b.created_at)-new Date(a.created_at)
 );

 shell(
  folio(a)||a.name,
  "PASO 02 / 02 · FORO DEL PENDIENTE",
  \`
  <div class="w-steps">
   <span class="w-step">01 · Pendiente</span>
   <span class="w-step current">02 · Foro & estatus</span>
  </div>
  <button type="button" class="w-back"
   data-action="back">← Cambiar pendiente</button>

  <h3 class="w-forum-title">\${esc(chosen.title)}</h3>

  <div class="w-control">
   <form id="wPostForm">
    <label>ESTATUS DEL PENDIENTE
     <select id="wNewStatus" name="status">
      \${Object.entries(STATUSES).map(
       ([key,val])=>\`
        <option value="\${key}"
         \${status(chosen)===key?"selected":""}>
         \${val}
        </option>
       \`
      ).join("")}
     </select>
    </label>

    <label>COMENTARIO EN EL FORO
     <textarea id="wComment" name="comment"
      placeholder="Explica qué se programó, qué avances hubo o por qué cambió el estado..."></textarea>
    </label>

    <label>FOTOGRAFÍAS DEL AVANCE (opcional, máximo 5)
     <input id="wPhotos" type="file" multiple
      accept="image/jpeg,image/png,image/webp">
    </label>

    <p>
     Si cambias el estatus, el motivo es obligatorio
     (mínimo 8 caracteres).
     También puedes publicar sin cambiarlo.
    </p>

    <button type="submit">Publicar actualización ↗</button>
   </form>
  </div>

  <section class="w-forum">
   <h3>Conversación · \${posts.length} actualizaciones</h3>

   \${posts.map(p=>\`
    <article class="w-post">
     <div class="w-avatar">
      \${esc((p.author_email||"LO")
       .slice(0,1).toUpperCase())}
     </div>
     <div>
      <strong>\${esc(p.author_email||"Colaborador")}</strong>
      <time>\${esc(day(p.created_at))}</time>
      <p>\${esc(p.body)}</p>

      \${(Array.isArray(p.photos)?p.photos:[])
       .map(path=>\`
        <button type="button" data-action="photo"
         data-path="\${esc(path)}">
         ↗ Ver fotografía
        </button>
       \`).join("")}
     </div>
    </article>
   \`).join("")||
   '<p class="w-muted">Aún no hay publicaciones.</p>'}
  </section>\`
 );
}

function renderDetails(a) {
 const list=tasksFor(a);

 const water=state.data.water.filter(
  w=>w.asset_id===a.id
 ).sort(
  (x,y)=>new Date(y.reading_date)-new Date(x.reading_date)
 );

 const fields=[
  ["Nombre",a.name],
  ["Folio del bien",folio(a)||"Sin registrar"],
  ["Tipo",a.type],
  ["Dirección",a.address],
  ["Responsable",a.responsible_name],
  ["Teléfono",a.responsible_phone],
  ["Pendientes activos",tasksFor(a,true).length],
  ["Pendientes terminados",
   list.length-tasksFor(a,true).length]
 ];

 shell(
  folio(a)||a.name,
  "EXPEDIENTE COMPLETO · SOLO LECTURA",
  \`
  <div class="w-details">
   \${fields.map(([k,v])=>\`
    <div>
     <small>\${esc(k)}</small>
     <strong>\${esc(v??"—")}</strong>
    </div>
   \`).join("")}
  </div>

  <div class="w-detail-tasks">
   <h3>Historial de pendientes (\${list.length})</h3>
   <ul>
    \${list.map(t=>\`
     <li>
      \${esc(t.title)}
      <span class="w-status \${status(t)}">
       \${label(t)}
      </span>
      <button type="button" class="w-detail-btn"
       data-action="openTask" data-id="\${esc(t.id)}">
       Abrir foro →
      </button>
     </li>
    \`).join("")||
    '<li>Sin pendientes registrados.</li>'}
   </ul>

   <h3>Lecturas de agua (\${water.length})</h3>
   <ul>
    \${water.map(w=>\`
     <li>
      \${esc(w.reading_date)} · \${esc(w.reading)}
     </li>
    \`).join("")||'<li>Sin lecturas.</li>'}
   </ul>
  </div>\`
 );
}

async function saveFolio(id) {
 const a=state.data.assets.find(x=>x.id===id);

 const field=document.querySelector(
  \`[data-folio-input="\${id}"]\`
 );

 if(!a||!field)return;

 const val=field.value.trim();
 field.disabled=true;

 try {
  const result=await db.rpc(
   "gg_ld_workspace_set_folio",
   {p_asset_id:id,p_folio:val}
  );

  if(result.error)throw result.error;

  await refresh(true);

  notify(
   "Folio guardado y compartido con Grupo Gutiérrez"
  );

 }catch(error) {
  field.disabled=false;
  notify("No se guardó el folio: "+error.message);
 }
}

async function uploadPhotos(files,taskId) {
 const saved=[];

 for(const file of files) {
  if(
   !["image/jpeg","image/png","image/webp"].includes(file.type)
   || file.size>10*1024*1024
  ) {
   throw Error(
    "Solo JPG, PNG o WEBP de máximo 10 MB"
   );
  }

  const extension=
   file.type==="image/jpeg"?"jpg":
   file.type==="image/png"?"png":"webp";

  const storagePath=
   \`tasks/\${taskId}/\${crypto.randomUUID()}.\${extension}\`;

  const result=await db.storage
   .from("gg_ld_files")
   .upload(storagePath,file,{
    upsert:false,
    contentType:file.type
   });

  if(result.error)throw result.error;

  saved.push(storagePath);
 }

 return saved;
}

async function publish(form) {
 if(state.busy||!state.modal?.task)return;

 const task=state.data.tasks.find(
  t=>t.id===state.modal.task
 );

 if(!task)return;

 const next=$("wNewStatus").value;
 const old=status(task);
 const body=$("wComment").value.trim();
 const files=[...$("wPhotos").files].slice(0,5);

 if(next!==old&&body.length<8) {
  notify(
   "Explica por qué cambias el estado (mínimo 8 caracteres)"
  );
  $("wComment").focus();
  return;
 }

 if(next===old&&!body&&!files.length) {
  notify("Escribe un comentario o adjunta una fotografía");
  return;
 }

 state.busy=true;

 const submit=form.querySelector("button[type=submit]");
 submit.disabled=true;

 try {
  if(next!==old) {
   const response=await db.rpc(
    "gg_ld_workspace_set_status",
    {
     p_task_id:task.id,
     p_status:next,
     p_comment:body
    }
   );

   if(response.error)throw response.error;
  }

  let photos=[];

  if(files.length) {
   photos=await uploadPhotos(files,task.id);
  }

  if(next===old||photos.length) {
   const message=next!==old
    ?"Fotografías del cambio de estatus"
    :(body||"Actualización con fotografías");

   const response=await db.rpc(
    "gg_ld_v2_save",
    {
     p_action:"post_add",
     p_data:{
      task_id:task.id,
      body:message,
      photos
     }
    }
   );

   if(response.error)throw response.error;
  }

  const asset=state.modal.asset;

  await refresh(true);

  if(next==="terminado") {
   state.modal={
    asset,task:null,kind:"workflow"
   };
  }

  drawModal();

  notify(
   "Actualización publicada y sincronizada con Dirección"
  );

 }catch(error) {
  notify("No se pudo publicar: "+error.message);
  submit.disabled=false;
 }finally {
  state.busy=false;
 }
}

async function openPhoto(storagePath) {
 const tab=window.open("about:blank","_blank");

 try {
  const response=await db.storage
   .from("gg_ld_files")
   .createSignedUrl(storagePath,60);

  if(response.error)throw response.error;

  if(tab&&!tab.closed) {
   tab.opener=null;
   tab.location.href=response.data.signedUrl;
  }else{
   notify(
    "Permite ventanas emergentes para abrir la foto"
   );
  }
 }catch(error) {
  if(tab)tab.close();
  notify("No se abrió la fotografía: "+error.message);
 }
}

async function init() {
 if(!db)throw Error("Cliente Supabase no disponible");

 const auth=await db.auth.getUser();

 if(auth.error||!auth.data?.user) {
  location.replace("/");
  return;
 }

 const theme=localStorage.getItem(
  "lo-ld-workspace-theme"
 );

 if(theme==="dark") {
  document.documentElement.dataset.theme="dark";
 }

 $("wTheme").onclick=()=>{
  const next=
   document.documentElement.dataset.theme==="dark"
    ?"light":"dark";

  document.documentElement.dataset.theme=next;
  localStorage.setItem("lo-ld-workspace-theme",next);
 };

 $("wRefresh").onclick=()=>{
  refresh().catch(e=>notify(e.message));
 };

 document.querySelectorAll("[data-tab]").forEach(
  button=>button.addEventListener("click",()=>{
   state.tab=button.dataset.tab;

   document.querySelectorAll("[data-tab]").forEach(
    b=>{
     b.classList.toggle("selected",b===button);
     b.setAttribute(
      "aria-selected",
      String(b===button)
     );
    }
   );

   renderRows();
  })
 );

 for(const id of [
  "wSearch","wType","wPerson","wStatus"
 ]) {
  $(id).addEventListener(
   id==="wSearch"?"input":"change",
   renderRows
  );
 }

 $("wRows").addEventListener("click",event=>{
  const action=event.target.closest("[data-action]");
  if(!action)return;

  const id=action.dataset.id;

  if(action.dataset.action==="open")
   openAsset(id);

  if(action.dataset.action==="details") {
   state.modal={asset:id,kind:"details"};
   drawModal();
  }

  if(action.dataset.action==="folio")
   void saveFolio(id);
 });

 $("wModal").addEventListener("click",event=>{
  if(event.target?.id==="wOverlay") {
   close();
   return;
  }

  const control=event.target.closest("[data-action]");
  if(!control)return;

  switch(control.dataset.action) {
   case "close":
    close();
    break;

   case "back":
    state.modal.task=null;
    drawModal();
    break;

   case "choose":
    state.modal.task=control.dataset.id;
    drawModal();
    break;

   case "openTask": {
    const a=state.modal.asset;

    state.modal={
     asset:a,
     task:control.dataset.id,
     kind:"workflow",
     includeDone:true
    };

    drawModal();
    break;
   }

   case "photo":
    void openPhoto(control.dataset.path);
    break;
  }
 });

 $("wModal").addEventListener("submit",e=>{
  if(e.target.id==="wPostForm") {
   e.preventDefault();
   void publish(e.target);
  }
 });

 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&state.modal)
   close();
 });

 await refresh(true);
 $("wShell").hidden=false;
}

init().catch(error=>{
 $("wErrorText").textContent=error.message;
 $("wError").hidden=false;
 console.error("[LO WORKSPACE]",error);
});

})();
`;

/* ====================================================
   ESTILOS DE GRUPO GUTIÉRREZ
==================================================== */

const GG_CSS = `
.ld-card .gg-ld-folio{
 display:inline-flex;
 margin-top:6px;
 padding:6px 10px;
 border-radius:999px;
 border:1px solid #b5d5e7;
 background:#eff8ff;
 color:#296a99;
 font-size:10px;
 font-weight:800;
 letter-spacing:.05em;
 overflow-wrap:anywhere;
}
.ld-task-line .ld-pill.gg-ld-state{
 background:#e5f2ff;
 color:#23679b;
}
.ld-task-line .ld-pill.gg-ld-state[data-status="terminado"]{
 background:#e0f6ed;color:#178360;
}
.ld-task-line .ld-pill.gg-ld-state[data-status="programado"]{
 background:#f1eaff;color:#7653a5;
}
.ld-task-line .ld-pill.gg-ld-state[data-status="ejecucion"]{
 background:#e0efff;color:#235aaf;
}
.gg-ld-hint{
 font-size:12px;
 color:#607f9c;
 line-height:1.6;
 margin:0 0 14px;
}
`;

/* ====================================================
   INSTALACIÓN EN LO
==================================================== */

if (LO) {
  const page="public/locales-departamentos.html";
  const old=original(page);

  if (
    !old.includes('id="ldApp"') &&
    !old.includes('id="wShell"')
  ) {
    throw Error(
      "La pantalla original de LO cambió. " +
      "Se cancela sin escribir."
    );
  }

  put(page,LO_HTML);

  for(const [f,content] of [
    ["public/css/ld-workspace-v1.css",LO_CSS],
    ["public/js/ld-workspace-v1.js",LO_JS]
  ]) {
    if(
      fs.existsSync(to(f)) &&
      original(f).trim()!==content.trim()
    ) {
      throw Error(
        "Existe "+f+
        " con cambios manuales. No lo sobrescribo."
      );
    }
    put(f,content);
  }
}

/* ====================================================
   INSTALACIÓN EN GRUPO GUTIÉRREZ
==================================================== */

else {
  const jsFile="js/ld-app.js";
  let s=original(jsFile);

  if(!s.includes("GG_LD_WORKSPACE_BRIDGE_V1")) {
    const anchor=
      'const $ = selector => document.querySelector(selector);';

    s=replaceOne(
      s,anchor,
      anchor+`
/* GG_LD_WORKSPACE_BRIDGE_V1 */
function ggStatus(t){
 return t.workspace_status||
  (t.status==="hecho"?"terminado":"pendiente");
}
function ggStatusLabel(t){
 return ({
  pendiente:"Pendiente",
  programado:"Programado",
  ejecucion:"En Ejecución",
  terminado:"Terminado"
 })[ggStatus(t)]||"Pendiente";
}
`,jsFile
    );

    s=replaceOne(
      s,
      ' data = result;\n render();',
      ` data = result;
 if(GG){
  const {data:shared,error:metaError}=
   await db.rpc("gg_ld_workspace_snapshot",{p_mode:"gg"});
  if(metaError)throw metaError;

  for(const a of data.assets){
   a.workspace_folio=
    (shared.folios||[])
    .find(f=>f.asset_id===a.id)?.folio||"";
  }

  for(const t of data.tasks){
   t.workspace_status=
    (shared.statuses||[])
    .find(w=>w.task_id===t.id)?.status||"";
  }
 }
 render();`,
      jsFile
    );

    s=replaceOne(
      s,
      'const count = tasks.filter(t => t.status === "pendiente").length;',
      'const count = tasks.filter(t => ggStatus(t) !== "terminado").length;',
      jsFile
    );

    const card=
      "'<h2 style=\"margin-top:12px\">' + esc(a.name) + '</h2>' +";

    s=replaceOne(
      s,card,
      card+`
    '<small class="gg-ld-folio">FOLIO · ' +
    esc(a.workspace_folio||"Sin registrar") +
    '</small>' +`,
      jsFile
    );

    let start=s.indexOf("function taskPanel(");
    let end=s.indexOf("function taskEditor(",start);

    if(start<0||end<0) {
      throw Error(
        "No encontré el panel de Dirección."
      );
    }

    let section=s.slice(start,end);

    section=section.replaceAll(
      't.status==="hecho"?"done":""',
      'ggStatus(t)==="terminado"?"done":""'
    );

    section=replaceOne(
      section,
      '(t.status==="hecho"?"✓ Hecho":"Pendiente")',
      'ggStatusLabel(t)',
      jsFile
    );

    section=replaceOne(
      section,
      `'<span class="ld-pill">' + esc(selected.status) + '</span>' +`,
      `'<span class="ld-pill gg-ld-state" data-status="' +
       ggStatus(selected) + '">' +
       esc(ggStatusLabel(selected)) + '</span>' +`,
      jsFile
    );

    section=replaceOne(
      section,
      `   '<label>Estatus<select name="status">' +
   '<option value="pendiente">Pendiente</option>' +
   '<option value="hecho">Hecho</option>' +
   '</select></label>' +`,
      `   '<p class="gg-ld-hint">Se crea como Pendiente. Los cambios de estatus y su motivo se registran en LO.</p>' +
   '<input type="hidden" name="status" value="pendiente">' +`,
      jsFile
    );

    s=s.slice(0,start)+section+s.slice(end);

    start=s.indexOf("function taskEditor(");
    end=s.indexOf(
      "/* =======================================================\n   MEDICIONES",
      start
    );

    if(start<0||end<0) {
      throw Error(
        "No encontré la edición de pendientes."
      );
    }

    section=s.slice(start,end);

    section=replaceOne(
      section,
      `  '<label>Estatus<select name="status">' +
  '<option value="pendiente"' +
  (t.status==="pendiente"?" selected":"") +
  '>Pendiente</option><option value="hecho"' +
  (t.status==="hecho"?" selected":"") +
  '>Hecho</option></select></label>' +`,
      `  '<p class="gg-ld-hint">Estatus actual: ' +
  esc(ggStatusLabel(t)) +
  '. Los estados detallados se modifican en LO con comentario obligatorio.</p>' +
  '<input type="hidden" name="status" value="' +
  esc(t.status) + '">' +`,
      jsFile
    );

    s=s.slice(0,start)+section+s.slice(end);
  }

  put(jsFile,s);

  const page="locales-departamentos.html";
  let html=original(page);

  const style=
    '<link rel="stylesheet" href="css/gg-ld-folio-v1.css">';

  if(!html.includes(style)) {
    html=replaceOne(
      html,"</head>",style+"\n</head>",page
    );
  }

  put(page,html);

  const cssPath="css/gg-ld-folio-v1.css";

  if(
    fs.existsSync(to(cssPath)) &&
    original(cssPath).trim()!==GG_CSS.trim()
  ) {
    throw Error(
      "El CSS de GG contiene cambios propios. " +
      "No lo sobrescribo."
    );
  }

  put(cssPath,GG_CSS);
}

/* ====================================================
   VALIDACIÓN Y ESCRITURA SEGURA
==================================================== */

for(const [f,content] of pending) {
  if(!content.trim()) {
    throw Error("Archivo vacío: "+f);
  }

  if(f.endsWith(".js")) {
    new vm.Script(content,{filename:f});
  }

  if(
    f.endsWith(".html") &&
    !content.includes("</html>")
  ) {
    throw Error("HTML incompleto: "+f);
  }

  before.set(
    f,
    fs.existsSync(to(f))
      ?fs.readFileSync(to(f))
      :null
  );
}

const applied=[];

try {
  for(const [f,content] of pending) {
    fs.mkdirSync(
      path.dirname(to(f)),
      {recursive:true}
    );

    applied.push(f);
    fs.writeFileSync(to(f),content,"utf8");
  }

}catch(error) {
  for(const f of applied.reverse()) {
    try {
      const old=before.get(f);

      if(old===null) {
        fs.rmSync(to(f),{force:true});
      }else{
        fs.writeFileSync(to(f),old);
      }
    }catch(e) {
      console.error(
        "No se pudo restaurar:",f,e.message
      );
    }
  }

  throw error;
}

console.log(
  "\n✓ Liquid Glass instalado en: "+
  (LO?"Ingeniería LO":"Grupo Gutiérrez")
);

console.log(
  "✓ Archivos escritos: "+pending.size
);

console.log(
  "✓ Sin .bak ni carpetas de backup."
);

console.log(
  "✓ Folios y cuatro estados compartidos mediante Supabase."
);
