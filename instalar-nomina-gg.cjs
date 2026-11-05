
"use strict";

/*
  GRUPO GUTIÉRREZ
  NÓMINA V1 + VACACIONES FINES DE SEMANA

  Ejecutar desde la raíz del proyecto:
  node instalar-nomina-gg.cjs

  SQL por separado.
  Sin .bak, sin compresión, sin Base64.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = process.cwd();
const writes = new Map();
const originals = new Map();
const at = f => path.resolve(ROOT, f);

function read(f) {
  if (!fs.existsSync(at(f)))
    throw Error("No encontré: " + f);
  return fs.readFileSync(at(f), "utf8");
}

function patch(f, change) {
  writes.set(f, change(writes.has(f)
    ? writes.get(f) : read(f)));
}

function add(f, content) {
  if (fs.existsSync(at(f))) {
    if (read(f) !== content)
      throw Error(
        "Ya existe " + f +
        " con cambios. No lo sobrescribo."
      );
    return;
  }
  writes.set(f, content);
}

function insertOnce(s, marker, anchor, fragment) {
  if (s.includes(marker)) return s;
  if (!s.includes(anchor))
    throw Error("Falta ancla: " + anchor);
  return s.replace(anchor, fragment + "\n" + anchor);
}

/* ARCHIVOS NUEVOS, EN TEXTO NORMAL */

const files = {

"nomina.html": String.raw`
<!doctype html>
<html lang="es" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport"
 content="width=device-width,initial-scale=1">
<title>Nómina · Grupo Gutiérrez</title>
<link rel="stylesheet" href="css/gg-payroll.css">
</head>
<body>
<div class="n-halo"></div>

<header class="n-top">
  <a href="sistema.html">
    GG ✳ <span>Grupo Gutiérrez</span>
  </a>
  <div>
    <button id="nTheme" type="button">
      ◐ Apariencia
    </button>
    <a href="sistema.html">← Sistema</a>
  </div>
</header>

<main id="nApp" hidden>
  <section class="n-hero">
    <small>
      RECURSOS HUMANOS / DISTRIBUCIÓN PRIVADA
    </small>
    <h1>Nómina<span>.</span></h1>
    <p>
      Documentos correctos.
      Personas correctas.
    </p>
  </section>

  <div class="n-tabs">
    <button type="button"
      data-tab="new" class="active">
      ＋ Nuevo envío
    </button>
    <button type="button" data-tab="history">
      ◷ Historial de envíos
    </button>
  </div>

  <section id="nNew" class="n-layout">
    <div class="n-panel n-config">
      <span class="n-over">
        01 / PREPARACIÓN
      </span>
      <h2>Preparar lote</h2>

      <label>
        Título de notificación
        <input id="nTitle" maxlength="160"
          placeholder="Ej. Recibos de nómina · Semana 45">
      </label>

      <label class="n-drop" for="nFiles">
        <span>⇧</span>
        <strong>
          Arrastra o selecciona tus PDF
        </strong>
        <small>
          Hasta 15 MB cada uno · Múltiples archivos
        </small>
        <input id="nFiles" type="file"
          accept=".pdf,application/pdf"
          multiple>
      </label>

      <p class="n-tip">
        La coincidencia exacta requiere
        todas las palabras del nombre
        y un único empleado activo.
      </p>

      <div class="n-stats">
        <div>
          <strong id="nExact">0</strong>
          <small>Encontrados</small>
        </div>
        <div>
          <strong id="nReview">0</strong>
          <small>Por revisar</small>
        </div>
        <div>
          <strong id="nMissing">0</strong>
          <small>No encontrados</small>
        </div>
      </div>

      <button id="nSendExact" type="button"
        class="n-btn n-primary">
        Enviar solo encontrados
      </button>

      <button id="nSendReview" type="button"
        class="n-btn">
        Enviar encontrados y por revisar
      </button>

      <p id="nStatus" class="n-status"
        role="status"></p>
    </div>

    <div class="n-panel n-results">
      <div class="n-result-head">
        <div>
          <span class="n-over">
            02 / CONCILIACIÓN
          </span>
          <h2>Coincidencias</h2>
        </div>
        <span id="nCount">0 archivos</span>
      </div>
      <div id="nRows" class="n-rows">
        <p class="n-empty">
          Tu mesa de trabajo está lista.
          Selecciona varios PDF para comenzar.
        </p>
      </div>
    </div>
  </section>

  <section id="nHistory" class="n-panel" hidden>
    <div class="n-result-head">
      <div>
        <span class="n-over">
          AUDITORÍA / ENVÍOS
        </span>
        <h2>Historial</h2>
      </div>
      <button id="nRefresh"
        class="n-btn" type="button">
        Actualizar ↻
      </button>
    </div>
    <div id="nHistoryRows"></div>
  </section>
</main>

<div id="nDenied" class="n-denied" hidden>
  <h2>Acceso restringido</h2>
  <p id="nDeniedText">
    Necesitas permiso desde Sistemas.
  </p>
  <a href="sistema.html">Volver a Sistema</a>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script src="js/gg-payroll.js"></script>
</body>
</html>
`.trim(),

"css/gg-payroll.css": String.raw`
:root {
  font-family: Inter, ui-sans-serif, system-ui,
    -apple-system, Segoe UI, sans-serif;
  color-scheme: dark;
  --bg: #080c14;
  --card: #101826ef;
  --fg: #eaf6ff;
  --muted: #8a9aac;
  --line: #263648;
  --accent: #7addff;
  --input: #101a28;
}
html[data-theme="light"] {
  color-scheme: light;
  --bg: #f0f5fa;
  --card: #ffffffed;
  --fg: #1a2d42;
  --muted: #63758b;
  --line: #dbe6f2;
  --accent: #005f9e;
  --input: #f8fbff;
}
* { box-sizing: border-box; }
html { background: var(--bg); }
body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--fg);
  transition: background .4s, color .4s;
}
[hidden] { display: none !important; }
.n-halo {
  position: fixed;
  z-index: -1;
  inset: 0;
  background:
    radial-gradient(circle at 15% 5%,
      #20acd829, transparent 38%),
    radial-gradient(circle at 90% 85%,
      #8d68ff20, transparent 40%);
  pointer-events: none;
  animation: n-float 17s ease-in-out
    infinite alternate;
}
@keyframes n-float {
  to { transform: translateY(30px) scale(1.12); }
}
@keyframes n-liquid {
  to { background-position: 100% 0; }
}
@keyframes n-in {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
a { color: inherit; text-decoration: none; }
.n-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px clamp(20px,4vw,65px);
  border-bottom: 1px solid var(--line);
  gap: 10px;
}
.n-top > a {
  font-weight: 850;
  font-size: 24px;
}
.n-top a span {
  font-weight: 500;
  font-size: 14px;
  margin-left: 8px;
  color: var(--muted);
}
.n-top > div {
  display: flex;
  gap: 16px;
  align-items: center;
}
.n-top button, .n-top div a {
  background: transparent;
  color: var(--fg);
  border: 1px solid var(--line);
  padding: 10px 14px;
  border-radius: 30px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}
.n-top button:hover,
.n-top a:hover {
  border-color: var(--accent);
}
main {
  max-width: 1600px;
  margin: auto;
  padding: 0 clamp(16px,4vw,64px) 80px;
}
.n-hero {
  padding: 54px 0 26px;
  animation: n-in .65s both;
}
.n-over, .n-hero small {
  font-size: 10px;
  letter-spacing: .19em;
  font-weight: 800;
  color: var(--accent);
}
.n-hero h1 {
  margin: 10px 0 5px;
  font-size: clamp(62px,9vw,130px);
  line-height: 1;
  font-weight: 850;
  letter-spacing: -.075em;
  background: linear-gradient(
    105deg,var(--fg),#70dff4,#b49dfb,var(--fg)
  );
  background-size: 300% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: n-liquid 9s ease-in-out
    infinite alternate;
}
.n-hero h1 span { color: var(--accent); }
.n-hero p { color: var(--muted); }
.n-tabs {
  display: flex;
  gap: 10px;
  margin: 15px 0 20px;
}
.n-tabs button {
  border: 1px solid var(--line);
  border-radius: 40px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  padding: 12px 18px;
}
.n-tabs button.active {
  background: var(--fg);
  color: var(--bg);
  font-weight: 750;
}
.n-layout {
  display: grid;
  grid-template-columns:
    minmax(275px,350px) minmax(0,1fr);
  gap: 20px;
}
.n-panel {
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--card);
  padding: 25px;
  backdrop-filter: blur(22px);
  animation: n-in .65s both;
}
.n-panel h2 {
  font-size: 23px;
  letter-spacing: -.04em;
  margin: 8px 0 24px;
}
.n-config label:not(.n-drop) {
  display: grid;
  gap: 9px;
  color: var(--muted);
  font-size: 12px;
}
.n-config input:not([type=file]) {
  width: 100%;
  padding: 14px;
  color: var(--fg);
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--input);
  outline: none;
  font: inherit;
}
.n-config input:focus {
  border-color: var(--accent);
}
.n-drop {
  display: flex;
  position: relative;
  margin: 24px 0 15px;
  min-height: 185px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  border: 1px dashed var(--accent);
  background: linear-gradient(
    140deg,#20a4b90b,#8888ff10
  );
  border-radius: 19px;
  text-align: center;
  cursor: pointer;
  padding: 12px;
}
.n-drop > span {
  font-size: 38px;
  color: var(--accent);
}
.n-drop strong { font-size: 14px; }
.n-drop small, .n-tip {
  font-size: 11px;
  line-height: 1.65;
  color: var(--muted);
}
.n-drop input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.n-stats {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 6px;
  margin: 22px 0;
}
.n-stats > div {
  background: var(--input);
  border: 1px solid var(--line);
  padding: 14px 8px;
  border-radius: 15px;
  text-align: center;
}
.n-stats strong {
  font-size: 30px;
  display: block;
}
.n-stats small {
  display: block;
  font-size: 10px;
  color: var(--muted);
}
.n-stats > div:first-child strong {
  color: #42cba2;
}
.n-stats > div:nth-child(2) strong {
  color: #ebba5c;
}
.n-stats > div:last-child strong {
  color: #e98f96;
}
.n-btn {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--input);
  color: var(--fg);
  padding: 13px 15px;
  margin-top: 10px;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  transition: transform .2s,border .2s;
}
.n-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.n-btn:disabled {
  opacity: .5;
  cursor: wait;
}
.n-primary {
  color: #071320;
  background: #a6e9ff;
  border-color: transparent;
}
.n-status {
  font-size: 12px;
  color: var(--muted);
  min-height: 24px;
  white-space: pre-wrap;
}
.n-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}
.n-result-head h2 { margin: 6px 0 20px; }
.n-result-head > span {
  font-size: 12px;
  color: var(--muted);
}
.n-row {
  display: grid;
  grid-template-columns:
    minmax(145px,1fr)
    minmax(175px,1fr) 112px;
  align-items: center;
  gap: 14px;
  padding: 17px 0;
  border-top: 1px solid var(--line);
  animation: n-in .3s both;
}
.n-file { overflow-wrap: anywhere; }
.n-file strong {
  font-size: 13px;
  font-weight: 720;
}
.n-file small,.n-meta {
  display: block;
  margin-top: 7px;
  color: var(--muted);
  font-size: 11px;
}
.n-row select {
  width: 100%;
  background: var(--input);
  border: 1px solid var(--line);
  color: var(--fg);
  border-radius: 10px;
  padding: 10px;
  font: inherit;
  font-size: 12px;
}
.n-state {
  font-size: 11px;
  text-align: center;
  border-radius: 20px;
  padding: 8px 6px;
  font-weight: 750;
}
.n-state.exact {
  color: #43cd9c;
  background: #43cd9c13;
}
.n-state.review {
  color: #e8b05d;
  background: #e8b05d13;
}
.n-state.missing {
  color: #e5898f;
  background: #e5898f15;
}
.n-empty {
  text-align: center;
  padding: 90px 20px;
  color: var(--muted);
  font-size: 13px;
}
.n-history-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 19px 8px;
  border-top: 1px solid var(--line);
  cursor: pointer;
}
.n-history-row:hover { color: var(--accent); }
.n-history-row strong { display: block; }
.n-history-row small {
  display: block;
  font-size: 11px;
  color: var(--muted);
  padding-top: 6px;
}
.n-history-detail {
  padding: 8px 18px 22px;
  background: var(--input);
  border-radius: 14px;
}
.n-history-detail .n-row {
  grid-template-columns: 1fr 1fr 115px;
}
.n-denied {
  max-width: 520px;
  margin: 15vh auto;
  text-align: center;
  padding: 50px;
}
.n-denied p { color: var(--muted); }
.n-denied a { color: var(--accent); }

@media(max-width:850px) {
  .n-layout { grid-template-columns: 1fr; }
  .n-row { grid-template-columns: 1fr 1fr; }
  .n-row .n-state {
    grid-column: 1/-1;
    justify-self: start;
    padding: 8px 16px;
  }
  .n-history-detail .n-row {
    grid-template-columns: 1fr;
  }
}
@media(max-width:450px) {
  .n-top { padding: 15px; }
  .n-top a span { display: none; }
  .n-top > div { gap: 5px; }
  .n-panel { padding: 18px; }
  .n-hero { padding-top: 35px; }
  .n-tabs button {
    padding: 10px;
    font-size: 11px;
  }
}
@media(prefers-reduced-motion:reduce) {
  *,*:before,*:after {
    animation: none !important;
    transition: none !important;
  }
}
`.trim(),

"css/gg-payroll-orbit.css": String.raw`
body .workspace .slot-nomina .module-card {
  background:
    linear-gradient(130deg,#6e71ff27,#55dbff18),
    #111a29 !important;
  border-color: #8bbfff66 !important;
}
body .workspace .slot-nomina .card-title {
  background:
    linear-gradient(95deg,#fff,#96deff,#baa3ff,#fff);
  background-size: 240% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent !important;
  animation: gg-n-liquid 8s ease-in-out
    infinite alternate;
}
@keyframes gg-n-liquid {
  to { background-position: 100%; }
}
@media(prefers-reduced-motion:reduce) {
  body .workspace .slot-nomina .card-title {
    animation: none;
  }
}
`.trim(),

"js/gg-payroll.js": String.raw`
(() => {
"use strict";

const db = window.ggSupabase;
const $ = id => document.getElementById(id);

const esc = x => String(x ?? "").replace(
  /[&<>"']/g,
  c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c])
);

const state = {
  employees: [],
  rows: [],
  batchId: null,
  busy: false,
  sent: false
};

const MAX_BYTES = 15 * 1024 * 1024;

function note(message) {
  $("nStatus").textContent = message;
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function words(value) {
  return normalize(value)
    .split(/\s+/)
    .filter(Boolean);
}

function signature(tokens) {
  return tokens.slice().sort().join("|");
}

/*
  Coincidencia por las mismas palabras,
  independientemente del acomodo.

  Para evitar falsos positivos, el nombre
  debe aparecer completo en una línea
  o un campo de texto consecutivo.
*/
function match(lines) {
  const found = new Map();
  const signatures = new Map();

  for (const employee of state.employees) {
    const tokens = words(employee.full_name);

    if (tokens.length < 2 || tokens.length > 12)
      continue;

    const key = signature(tokens);

    if (!signatures.has(key))
      signatures.set(key, []);

    signatures.get(key).push(employee);
  }

  const segments = lines.concat(
    lines.slice(0, -1).map(
      (line, i) => line + " " + lines[i+1]
    )
  );

  for (const line of segments) {
    const tokens = words(line);

    if (tokens.length > 60) continue;

    for (const [key, employees] of signatures) {
      const size = key.split("|").length;

      if (tokens.length < size) continue;

      for (
        let i = 0;
        i <= tokens.length - size;
        i++
      ) {
        if (
          signature(tokens.slice(i, i+size))
          !== key
        ) continue;

        for (const employee of employees) {
          found.set(employee.id, {
            employee,
            line
          });
        }

        break;
      }
    }
  }

  const hits = [...found.values()];

  if (hits.length === 1) {
    return {
      status: "exact",
      employee: hits[0].employee,
      extracted: hits[0].line.slice(0,240),
      detail: "Nombre completo: mismas palabras sin importar orden."
    };
  }

  if (hits.length > 1) {
    return {
      status: "review",
      employee: null,
      extracted: hits.map(
        h => h.employee.full_name
      ).join(" / ").slice(0,240),
      detail: "Varios empleados posibles. Selecciona el destinatario."
    };
  }

  return {
    status: "missing",
    employee: null,
    extracted: "",
    detail: "No se encontró el nombre completo en el texto extraíble."
  };
}

async function readPdf(file) {
  const raw = new Uint8Array(
    await file.arrayBuffer()
  );

  const header = String.fromCharCode(
    ...raw.slice(0,5)
  );

  if (header !== "%PDF-")
    throw Error("El archivo no tiene cabecera PDF.");

  if (!window.pdfjsLib)
    throw Error("No cargó PDF.js.");

  const pdf = await pdfjsLib.getDocument({
    data: raw
  }).promise;

  const lines = [];

  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
  ) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const groups = new Map();

    for (const item of content.items) {
      const y = Math.round(
        (item.transform?.[5] || 0) / 3
      ) * 3;

      if (!groups.has(y)) groups.set(y, []);

      groups.get(y).push({
        x: item.transform?.[4] || 0,
        s: item.str || ""
      });
    }

    for (const group of groups.values()) {
      group.sort((a,b) => a.x - b.x);

      lines.push(
        group.map(item => item.s).join(" ")
      );
    }
  }

  return match(lines);
}

function label(status) {
  return {
    exact: "Encontrado",
    review: "Por revisar",
    missing: "No encontrado"
  }[status] || status;
}

function summary() {
  for (const [status, id] of [
    ["exact","nExact"],
    ["review","nReview"],
    ["missing","nMissing"]
  ]) {
    $(id).textContent = state.rows.filter(
      row => row.status === status
    ).length;
  }

  $("nCount").textContent =
    state.rows.length + " archivos";
}

function render() {
  summary();

  const root = $("nRows");
  root.replaceChildren();

  if (!state.rows.length) {
    root.innerHTML =
      '<p class="n-empty">Selecciona tus PDF para comenzar.</p>';
    return;
  }

  state.rows.forEach((row, index) => {
    const item = document.createElement("div");
    item.className = "n-row";

    const options = state.employees.map(
      employee => {
        const selected =
          row.employee?.id === employee.id
            ? "selected" : "";

        return '<option value="' +
          esc(employee.id) + '" ' +
          selected + ">" +
          esc(employee.full_name) +
          " · " +
          esc(employee.payroll_number || "s/n") +
          "</option>";
      }
    ).join("");

    item.innerHTML =
      '<div class="n-file"><strong>▤ ' +
      esc(row.file.name) +
      '</strong><small>' +
      esc(row.detail) +
      '</small></div>' +
      '<div><select aria-label="Empleado">' +
      '<option value="">— Sin asignar —</option>' +
      options +
      '</select></div>' +
      '<span class="n-state ' +
      esc(row.status) + '">' +
      esc(label(row.status)) +
      "</span>";

    item.querySelector("select").onchange =
      async event => {
        if (state.sent || state.busy) {
          render();
          return;
        }

        const oldEmployee = row.employee;
        const oldStatus = row.status;
        const oldDetail = row.detail;

        row.employee = state.employees.find(
          e => e.id === event.target.value
        ) || null;

        row.status = row.employee
          ? "review"
          : "missing";

        row.detail = row.employee
          ? "Asignación manual; revisa destinatario."
          : "Sin destinatario seleccionado.";

        if (row.docId) {
          const {error} = await db.rpc(
            "gg_payroll_assign",
            {
              p_document_id: row.docId,
              p_employee_id: row.employee?.id || null
            }
          );

          if (error) {
            row.employee = oldEmployee;
            row.status = oldStatus;
            row.detail = oldDetail;
            note("Error: " + error.message);
          }
        }

        render();
      };

    root.append(item);
  });
}

async function chosen(files) {
  if (state.busy || state.batchId || state.sent) {
    note("Para otro lote recarga la pantalla.");
    return;
  }

  state.busy = true;

  try {
    for (const file of files) {
      if (
        !file.name.toLowerCase().endsWith(".pdf")
        || file.size > MAX_BYTES
      ) {
        state.rows.push({
          file,
          status: "missing",
          employee: null,
          detail: "Formato inválido o más de 15 MB.",
          invalid: true
        });
        continue;
      }

      note("Analizando " + file.name + "...");

      let result;

      try {
        result = await readPdf(file);
      } catch (error) {
        result = {
          status: "missing",
          employee: null,
          extracted: "",
          detail: "Sin texto válido: " + error.message
        };
      }

      state.rows.push({file, ...result});
      render();
    }

    note(
      "Análisis listo. Verifica los empleados antes de enviar."
    );
  } finally {
    state.busy = false;
    render();
    $("nFiles").value = "";
  }
}

function setBusy(value) {
  state.busy = value;

  for (const id of [
    "nSendExact",
    "nSendReview",
    "nFiles"
  ]) {
    $(id).disabled = value;
  }
}

async function dispatch(includeReview) {
  if (state.busy || state.sent) return;

  const title = $("nTitle").value.trim();

  if (!title) {
    note("Escribe el título de notificación.");
    return;
  }

  if (!state.rows.length) {
    note("Primero agrega los PDF.");
    return;
  }

  const eligible = state.rows.filter(
    row =>
      row.employee &&
      !row.invalid &&
      (
        row.status === "exact"
        || (
          includeReview &&
          row.status === "review"
        )
      )
  );

  if (!eligible.length) {
    note("No hay PDF elegibles para este envío.");
    return;
  }

  const question =
    "¿Enviar " + eligible.length +
    " PDF privados a sus empleados?\n" +
    (
      includeReview
        ? "Incluye asignaciones por revisar."
        : "Solo coincidencias exactas."
    ) +
    "\nLa operación no se puede deshacer.";

  if (!confirm(question)) return;

  setBusy(true);

  try {
    if (!state.batchId) {
      const created = await db.rpc(
        "gg_payroll_new_batch",
        {p_title:title}
      );

      if (created.error) throw created.error;

      state.batchId = created.data;
      $("nTitle").disabled = true;
    }

    for (
      let i = 0;
      i < state.rows.length;
      i++
    ) {
      const row = state.rows[i];

      if (row.invalid || row.docId) continue;

      note(
        "Subiendo " + (i+1) + "/" +
        state.rows.length + ": " +
        row.file.name
      );

      const storagePath =
        state.batchId + "/" +
        crypto.randomUUID() + ".pdf";

      const uploaded = await db.storage
        .from("gg-payroll-private")
        .upload(storagePath, row.file, {
          upsert: false,
          contentType: "application/pdf"
        });

      if (uploaded.error) throw uploaded.error;

      const saved = await db.rpc(
        "gg_payroll_register_file",
        {
          p_batch_id: state.batchId,
          p_file_name: row.file.name,
          p_storage_path: storagePath,
          p_extracted_name: row.extracted || null,
          p_employee_id: row.employee?.id || null,
          p_match_status: row.status,
          p_diagnostic: row.detail || null
        }
      );

      if (saved.error) throw saved.error;

      row.docId = saved.data;
    }

    const result = await db.rpc(
      "gg_payroll_send_batch",
      {
        p_batch_id: state.batchId,
        p_include_review: includeReview
      }
    );

    if (result.error) throw result.error;

    state.sent = true;

    note(
      "✓ Enviados " + result.data +
      " PDF. Los demás quedaron registrados sin enviar."
    );

    await history();
  } catch (error) {
    note(
      "No se completó el envío: " +
      error.message +
      "\nEl lote permanece en borrador."
    );
  } finally {
    setBusy(false);

    if (state.sent) {
      $("nFiles").disabled = true;
      $("nSendExact").disabled = true;
      $("nSendReview").disabled = true;
    }
  }
}

function date(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString(
    "es-MX",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );
}

async function openAdminFile(storagePath) {
  const result = await db.storage
    .from("gg-payroll-private")
    .createSignedUrl(storagePath,60);

  if (result.error) {
    alert(result.error.message);
    return;
  }

  window.open(
    result.data.signedUrl,
    "_blank",
    "noopener,noreferrer"
  );
}

async function history() {
  const root = $("nHistoryRows");

  const batches = await db
    .from("gg_payroll_batches")
    .select("*")
    .order("created_at",{ascending:false})
    .limit(80);

  if (batches.error) {
    root.textContent = batches.error.message;
    return;
  }

  root.replaceChildren();

  if (!batches.data.length) {
    root.innerHTML =
      '<p class="n-empty">Aún no hay lotes.</p>';
    return;
  }

  for (const batch of batches.data) {
    const header = document.createElement("div");
    header.className = "n-history-row";

    header.innerHTML =
      "<div><strong>" +
      esc(batch.title) +
      "</strong><small>" +
      esc(date(batch.sent_at || batch.created_at)) +
      " · " +
      esc(batch.created_by_email) +
      "</small></div><span>" +
      (batch.status === "sent"
        ? "Enviado" : "Borrador") +
      " ▾</span>";

    const details = document.createElement("div");
    details.className = "n-history-detail";
    details.hidden = true;

    header.onclick = async () => {
      details.hidden = !details.hidden;

      if (
        details.hidden ||
        details.dataset.loaded
      ) return;

      details.textContent = "Cargando documentos...";

      const docs = await db
        .from("gg_payroll_documents")
        .select("*")
        .eq("batch_id",batch.id)
        .order("created_at");

      if (docs.error) {
        details.textContent = docs.error.message;
        return;
      }

      details.replaceChildren();

      if (!docs.data.length) {
        details.textContent = "Sin archivos.";
        return;
      }

      for (const doc of docs.data) {
        const employee = state.employees.find(
          e => e.id === doc.employee_id
        );

        const row = document.createElement("div");
        row.className = "n-row";

        row.innerHTML =
          '<div class="n-file"><strong>' +
          esc(doc.file_name) +
          "</strong><small>" +
          esc(doc.diagnostic || "") +
          "</small></div><span>" +
          esc(employee?.full_name || "Sin empleado") +
          '</span><span class="n-state ' +
          esc(doc.match_status) + '">' +
          (doc.sent ? "✓ Enviado" : "No enviado") +
          (doc.read_at ? " · Leído" : "") +
          "</span>";

        const button = document.createElement(
          "button"
        );

        button.className = "n-btn";
        button.type = "button";
        button.textContent = "Abrir PDF";

        button.onclick = () =>
          openAdminFile(doc.storage_path);

        row.querySelector(".n-file").append(button);
        details.append(row);
      }

      details.dataset.loaded = "1";
    };

    root.append(header,details);
  }
}

async function init() {
  const theme = localStorage.getItem(
    "gg-payroll-theme"
  );

  if (theme === "light") {
    document.documentElement.dataset.theme =
      "light";
  }

  $("nTheme").onclick = () => {
    const next =
      document.documentElement.dataset.theme
        === "light" ? "dark" : "light";

    document.documentElement.dataset.theme =
      next;

    localStorage.setItem(
      "gg-payroll-theme",next
    );
  };

  if (!db) throw Error("Supabase no disponible.");

  const auth = await db.auth.getUser();

  if (auth.error || !auth.data?.user) {
    location.replace("index.html");
    return;
  }

  const permit = await db.rpc(
    "gg_payroll_can_manage"
  );

  if (permit.error || permit.data !== true) {
    $("nDenied").hidden = false;
    $("nDeniedText").textContent =
      permit.error?.message ||
      "Pide acceso desde Sistemas.";
    return;
  }

  const employees = await db.rpc(
    "gg_payroll_employee_catalog"
  );

  if (employees.error) {
    $("nDenied").hidden = false;
    $("nDeniedText").textContent =
      employees.error.message;
    return;
  }

  state.employees = employees.data || [];
  $("nApp").hidden = false;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  $("nFiles").onchange = event =>
    chosen([...event.target.files]);

  const drop = document.querySelector(".n-drop");

  drop.ondragover = event => {
    event.preventDefault();
    drop.style.borderStyle = "solid";
  };

  drop.ondragleave = () =>
    drop.style.borderStyle = "dashed";

  drop.ondrop = event => {
    event.preventDefault();
    drop.style.borderStyle = "dashed";
    chosen([...event.dataTransfer.files]);
  };

  $("nSendExact").onclick = () =>
    dispatch(false);

  $("nSendReview").onclick = () =>
    dispatch(true);

  $("nRefresh").onclick = history;

  for (
    const button of document.querySelectorAll(
      "[data-tab]"
    )
  ) {
    button.onclick = () => {
      for (
        const other of document.querySelectorAll(
          "[data-tab]"
        )
      ) {
        other.classList.toggle(
          "active",other === button
        );
      }

      $("nNew").hidden =
        button.dataset.tab !== "new";

      $("nHistory").hidden =
        button.dataset.tab !== "history";

      if (button.dataset.tab === "history") {
        history();
      }
    };
  }

  render();
}

document.addEventListener(
  "DOMContentLoaded",
  () => init().catch(error => {
    console.error(error);
    $("nDenied").hidden = false;
    $("nDeniedText").textContent =
      error.message;
  })
);

})();
`.trim(),

"js/gg-payroll-yo.js": String.raw`
/*
  Recibos privados en YO.
  No utiliza la identidad de auth.uid()
  porque YO tiene otra sesión.
*/
(() => {
"use strict";

const db = window.ggSupabase;
const token = () => sessionStorage.getItem(
  "gg_intranet_token"
);

const esc = value => String(value ?? "")
  .replace(/[&<>"']/g,c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c]));

let loading = false;
let items = [];

function render() {
  const box = document.getElementById(
    "yoNotificationsList"
  );

  if (!box) return;

  let holder = document.getElementById(
    "ggPayrollYoList"
  );

  if (!holder) {
    holder = document.createElement("section");
    holder.id = "ggPayrollYoList";
    holder.className = "gg-payroll-yo";
    box.append(holder);
  }

  holder.replaceChildren();

  if (!items.length) return;

  box.querySelector(
    ".yo-notifications-empty"
  )?.remove();

  const heading = document.createElement("p");
  heading.textContent = "RECIBOS DE NÓMINA";
  heading.className = "gg-payroll-yo-title";
  holder.append(heading);

  for (const item of items) {
    const button = document.createElement(
      "button"
    );

    button.type = "button";
    button.className = "gg-payroll-yo-item";

    button.innerHTML =
      "<strong>" +
      esc(item.title) +
      "</strong><small>" +
      esc(item.file_name) +
      " · " +
      new Date(item.sent_at).toLocaleDateString(
        "es-MX"
      ) +
      "</small><span>" +
      (
        item.read_at
          ? "Ver nuevamente ↗"
          : "● Nuevo · Abrir PDF ↗"
      ) +
      "</span>";

    button.onclick = async () => {
      button.disabled = true;

      button.querySelector("span").textContent =
        "Abriendo PDF privado...";

      try {
        const result = await db.functions.invoke(
          "gg-payroll-download",
          {
            body: {
              session_token: token(),
              document_id: item.id
            }
          }
        );

        if (result.error) throw result.error;

        if (!result.data?.url) {
          throw Error(
            "No se autorizó la lectura del PDF."
          );
        }

        window.open(
          result.data.url,
          "_blank",
          "noopener,noreferrer"
        );

        await refresh();
      } catch (error) {
        alert(
          "No se pudo abrir la nómina: " +
          error.message
        );
      } finally {
        button.disabled = false;
      }
    };

    holder.append(button);
  }

  const badge = document.getElementById(
    "yoNotificationBadge"
  );

  if (badge) {
    const unread = items.filter(
      item => !item.read_at
    ).length;

    badge.textContent = String(unread);

    badge.classList.toggle(
      "empty",unread === 0
    );
  }
}

async function refresh() {
  if (loading || !token()) return;

  loading = true;

  try {
    const result = await db.rpc(
      "gg_payroll_yo_list",
      {p_session_token:token()}
    );

    if (result.error) throw result.error;

    items = result.data || [];
    render();
  } catch (error) {
    console.warn(
      "[YO NÓMINA]",error.message
    );
  } finally {
    loading = false;
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const style = document.createElement(
      "style"
    );

    style.textContent =
      ".gg-payroll-yo{padding:6px}" +
      ".gg-payroll-yo-title{margin:8px 12px;" +
      "color:#66bce6;font-size:11px;" +
      "font-weight:800;letter-spacing:.12em}" +
      ".gg-payroll-yo-item{display:block;" +
      "width:100%;text-align:left;cursor:pointer;" +
      "border:1px solid #8ac7f033;" +
      "border-radius:14px;background:#568fbd12;" +
      "color:inherit;padding:13px;margin:8px 0}" +
      ".gg-payroll-yo-item strong," +
      ".gg-payroll-yo-item small," +
      ".gg-payroll-yo-item span{" +
      "display:block;margin:5px 0}" +
      ".gg-payroll-yo-item small{" +
      "font-size:11px;opacity:.75}" +
      ".gg-payroll-yo-item span{" +
      "font-size:11px;color:#70c8ff}" +
      ".gg-payroll-yo-item:disabled{" +
      "opacity:.55}";

    document.head.append(style);

    setTimeout(refresh,1200);

    document.getElementById(
      "yoNotificationButton"
    )?.addEventListener(
      "click",
      () => setTimeout(refresh,50)
    );

    setInterval(
      () => {
        if (!document.hidden) refresh();
      },
      90000
    );
  }
);

})();
`.trim(),

"supabase/functions/gg-payroll-download/index.ts":
String.raw`
// GRUPO GUTIÉRREZ
// Descarga privada de nómina desde YO.
// La RPC valida la sesión de intranet y el
// empleado propietario de cada documento.

import { createClient } from
  'npm:@supabase/supabase-js@2';

const base =
  Deno.env.get('SUPABASE_URL') || '';

const secret =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  || JSON.parse(
    Deno.env.get('SUPABASE_SECRET_KEYS') || '{}'
  ).default;

const admin = createClient(base,secret,{
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

Deno.serve(async request => {
  const origin =
    request.headers.get('origin') || '*';

  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers':
      'authorization,apikey,content-type,x-client-info',
    'Access-Control-Allow-Methods':
      'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null,{
      status: 204,headers
    });
  }

  if (request.method !== 'POST') {
    return Response.json(
      {error:'Solo POST'},
      {status:405,headers}
    );
  }

  try {
    const input = await request.json();

    if (
      typeof input.session_token !== 'string'
      || input.session_token.length < 16
      || typeof input.document_id !== 'string'
      || !/^[\da-f-]{36}$/i.test(input.document_id)
    ) {
      return Response.json(
        {error:'Datos inválidos'},
        {status:400,headers}
      );
    }

    const check = await admin.rpc(
      'gg_payroll_yo_open_path',
      {
        p_session_token: input.session_token,
        p_document_id: input.document_id
      }
    );

    if (check.error || !check.data) {
      return Response.json(
        {error:'No autorizado o sesión vencida'},
        {status:403,headers}
      );
    }

    const signed = await admin.storage
      .from('gg-payroll-private')
      .createSignedUrl(check.data,45);

    if (
      signed.error
      || !signed.data?.signedUrl
    ) {
      throw Error(
        'No se pudo crear enlace privado'
      );
    }

    return Response.json(
      {url:signed.data.signedUrl},
      {status:200,headers}
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {error:'Error de lectura privada'},
      {status:500,headers}
    );
  }
});
`.trim()

};

/* REGISTRAR ARCHIVOS NUEVOS */

for (const [file,content] of Object.entries(files)) {
  add(file,content);
}

/* MÓDULO 12 EN SISTEMA CENTRAL */

const tile = String.raw`
<!-- GG_PAYROLL_TILE_V1 -->
<div class="module-shell slot-nomina"
     style="--delay:.80s">

  <button type="button"
    class="module-card card-nomina"
    data-module="nomina">

    <span class="card-top">
      <span class="card-icon">▤</span>
      <span class="card-serial">12 / 12</span>
    </span>

    <span class="card-content">
      <span class="card-eyebrow">
        RECURSOS HUMANOS / PRIVADO
      </span>
      <strong class="card-title">
        nómina
      </strong>
      <span class="card-description">
        Recibos y distribución personal.
      </span>
    </span>

    <span class="card-footer">
      <span class="card-meta">
        DOCUMENTOS
      </span>
      <span class="card-arrow">↗</span>
    </span>

  </button>
</div>
`;

patch("sistema.html", source => {
  source = insertOnce(
    source,
    "GG_PAYROLL_TILE_V1",
    "<!-- GG_TEC_INSTALADO_V1 -->",
    tile
  );

  source = insertOnce(
    source,
    "css/gg-payroll-orbit.css",
    "</head>",
    '<link rel="stylesheet" href="css/gg-payroll-orbit.css">'
  );

  return source;
});

/* RUTAS DEL SISTEMA */

patch("js/sistema.js", source => {
  const anchor =
    "const ROUTES = Object.freeze({";

  if (source.includes('"nomina": {'))
    return source;

  if (!source.includes(anchor))
    throw Error("No encontré ROUTES.");

  return source.replace(
    anchor,
    anchor +
    '\n    "nomina": {name:"Nómina",url:"nomina.html"},'
  );
});

/* NAVEGACIÓN Y AUTORIZACIÓN */

patch("js/gg-sistemas-nav.js", source => {
  if (
    !source.includes(
      'nomina: "nomina.html"'
    )
  ) {
    const anchor = "  const paths = {";

    if (!source.includes(anchor))
      throw Error("No encontré paths.");

    source = source.replace(
      anchor,
      anchor + '\n    nomina: "nomina.html",'
    );
  }

  const anchor =
    'const {data,error} = module === "tecnologias"';

  if (!source.includes('module === "nomina"')) {
    if (!source.includes(anchor))
      throw Error(
        "Cambió la navegación de Sistemas."
      );

    source = source.replace(
      anchor,
      'const {data,error} = module === "nomina"\n' +
      '        ? await db.rpc("gg_payroll_can_manage")\n' +
      '        : module === "tecnologias"'
    );
  }

  return source;
});

/* SELECTOR SISTEMAS / ACCESOS */

patch("sistemas.html", source => {
  if (source.includes('value="nomina"'))
    return source;

  const selector = /(<select id="sysModule">)/;

  if (!selector.test(source))
    throw Error(
      "No encontré el selector de módulos."
    );

  return source.replace(
    selector,
    '$1\n<option value="nomina">Nómina</option>'
  );
});

/* PERMISOS DE SISTEMAS */

patch("js/sistemas-panel.js", source => {
  if (source.includes("GG_PAYROLL_SYSTEMS_V1"))
    return source;

  const anchor = "  function render() {";

  if (!source.includes(anchor))
    throw Error(
      "No encontré render() en Sistemas."
    );

  const helper = String.raw`
  /* GG_PAYROLL_SYSTEMS_V1 */
  async function loadPayrollRoles() {
    const {data,error} = await db.rpc(
      "gg_payroll_roles_snapshot"
    );

    if (error) {
      note("Nómina: " + error.message);
      return;
    }

    snapshot.roles = snapshot.roles.filter(
      role => role.module !== "nomina"
    ).concat(data || []);

    render();
  }

`;

  source = source.replace(
    anchor,
    helper + anchor
  );

  const initial =
    '    if ($("sysModule").value === "tecnologias") await loadTechRoles();\n' +
    '    else render();';

  if (!source.includes(initial))
    throw Error(
      "Cambió carga de permisos de Sistemas."
    );

  source = source.replace(
    initial,
    '    if ($("sysModule").value === "nomina") await loadPayrollRoles();\n' +
    '    else if ($("sysModule").value === "tecnologias") await loadTechRoles();\n' +
    '    else render();'
  );

  const selection =
    '    if (next === "tecnologias") loadTechRoles(); else render();';

  if (!source.includes(selection))
    throw Error(
      "Cambió selector de permisos de Sistemas."
    );

  source = source.replace(
    selection,
    '    if (next === "nomina") loadPayrollRoles();\n' +
    '    else if (next === "tecnologias") loadTechRoles(); else render();'
  );

  const save =
    'module === "tecnologias" ? "gg_tec_save_roles" : "gg_sistemas_save_roles"';

  if (!source.includes(save))
    throw Error(
      "Cambió el guardado de Sistemas."
    );

  source = source.replace(
    save,
    'module === "nomina" ? "gg_payroll_save_roles" : ' +
    save
  );

  return source;
});

/* CAMPANITA DE YO */

patch("yo.html", source => {
  if (source.includes("js/gg-payroll-yo.js"))
    return source;

  if (!source.includes("</body>"))
    throw Error("YO no contiene </body>.");

  return source.replace(
    "</body>",
    '<script src="js/gg-payroll-yo.js"></script>\n</body>'
  );
});

/* VITE */

patch("vite.config.js", source => {
  if (source.includes("nomina:"))
    return source;

  const input = /(input\s*:\s*\{)/;

  if (!input.test(source))
    throw Error(
      "No encontré input de Vite."
    );

  return source.replace(
    input,
    '$1\n                nomina: resolve(__dirname,"nomina.html"),'
  );
});

/* FIX: SÁBADOS Y DOMINGOS VACACIONES */

patch(
  "js/recursos-humanos-vacaciones.js",
  source => {
    if (
      source.includes(
        "GG_PAYROLL_VAC_WEEKEND_V1"
      )
    ) return source;

    const workingDays =
      /const WORKING_DAYS\s*=\s*new Set\(\[\s*1,\s*2,\s*3,\s*4,\s*5\s*\]\);/;

    if (!workingDays.test(source))
      throw Error(
        "Cambió configuración de días en RH."
      );

    source = source.replace(
      workingDays,
      "/* GG_PAYROLL_VAC_WEEKEND_V1 */\n" +
      "    const WORKING_DAYS = new Set([1,2,3,4,5,6]);"
    );

    const selectedDays =
      /new Set\(\s*getSelectedVacationDates\(\)\s*\);/;

    if (!selectedDays.test(source))
      throw Error(
        "Cambió el calendario de selección de RH."
      );

    source = source.replace(
      selectedDays,
      "new Set(\n" +
      "                getCalendarRangeDates()\n" +
      "            );"
    );

    const disabledWeekend =
      /const disabled\s*=\s*selectable\s*&&\s*weekend\s*\?\s*"disabled"\s*:\s*""\s*;/;

    if (!disabledWeekend.test(source))
      throw Error(
        "Cambió el bloqueo de fines de semana."
      );

    source = source.replace(
      disabledWeekend,
      'const disabled = "";'
    );

    const anchor =
      "    function getSelectedVacationDates() {";

    if (!source.includes(anchor))
      throw Error(
        "No encontré el selector de vacaciones."
      );

    const helper = String.raw`
    // Ilumina sábados y domingos del rango.
    // El cálculo descontable sigue siendo
    // lunes a sábado (nunca domingos).
    function getCalendarRangeDates() {
      if (!selectedStartDate) return [];

      const end =
        selectedEndDate || selectedStartDate;

      const result = [];
      let cursor = selectedStartDate;

      while (cursor <= end) {
        result.push(cursor);
        cursor = addDaysISO(cursor,1);
      }

      return result;
    }

`;

    source = source.replace(
      anchor,
      helper + anchor
    );

    return source;
  }
);

/* VALIDACIONES */

for (const [file,content] of writes) {
  if (!content.trim())
    throw Error("Archivo vacío: " + file);

  if (
    file.endsWith(".js")
    && file !== "vite.config.js"
  ) {
    new vm.Script(content, {filename:file});
  }

  if (
    file.endsWith(".html")
    && !content.includes("</html>")
  ) {
    throw Error("HTML incompleto: " + file);
  }
}

/* COPIA EN MEMORIA Y RESTAURACIÓN ANTE ERROR */

for (const file of writes.keys()) {
  originals.set(
    file,
    fs.existsSync(at(file))
      ? fs.readFileSync(at(file))
      : null
  );
}

const completed = [];

try {
  for (const [file,content] of writes) {
    fs.mkdirSync(
      path.dirname(at(file)),
      {recursive:true}
    );

    fs.writeFileSync(
      at(file),
      content,
      "utf8"
    );

    completed.push(file);
  }
} catch (error) {
  for (const file of completed.reverse()) {
    const previous = originals.get(file);

    try {
      if (previous === null) {
        fs.rmSync(at(file), {force:true});
      } else {
        fs.writeFileSync(at(file),previous);
      }
    } catch (restoreError) {
      console.error(
        "No se pudo restaurar " + file,
        restoreError
      );
    }
  }

  throw error;
}

console.log(
  "\n✓ NÓMINA instalado en Grupo Gutiérrez."
);
console.log(
  "✓ Archivos creados/modificados: " +
  completed.length
);
console.log(
  "✓ Sistema, Accesos, YO y RH integrados."
);
console.log(
  "✓ Sin carpetas de backup ni archivos .bak."
);
console.log(
  "SIGUIENTE: Desplegar gg-payroll-download en Supabase."
);
