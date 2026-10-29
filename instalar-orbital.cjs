
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const HTML = path.join(ROOT, "sistema.html");
const CSS = path.join(ROOT, "css/sistema-orbital.css");
const JS = path.join(ROOT, "js/sistema-orbital.js");

const css = String.raw`
/* GRUPO GUTIÉRREZ — ORBITAL ATELIER */

:root {
  --gg-orange: #f28b43;
  --gg-blue: #83d9ed;
  --gg-white: #f6f6f3;
}

html, body {
  background: #090a0c;
}

body {
  color: var(--gg-white);
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse at 50% 44%,
    #20242a 0%,
    #101217 37%,
    #090a0c 75%
  );
}

.atmosphere { opacity: .25; }

.masthead {
  width: min(1440px, calc(100% - 72px));
  border-color: #ffffff18;
}

.page-content {
  width: min(1440px, calc(100% - 72px));
}

/* COMPOSICIÓN PRINCIPAL */

.workspace {
  position: relative;
  min-height: 810px;
  margin: 0;
  padding: 0;
  isolation: isolate;
}

.workspace-heading {
  position: absolute;
  left: 0;
  top: 24px;
  z-index: 4;
}

.workspace-heading h2 {
  font-size: clamp(24px, 3vw, 38px);
}

.workspace-side {
  position: absolute;
  right: 0;
  top: 40px;
  z-index: 4;
}

/* MARCA CENTRAL */

.hero {
  position: absolute;
  z-index: 3;
  left: 50%;
  top: 50%;
  width: min(440px, 42%);
  padding: 0;
  transform: translate(-50%, -50%);
  animation: ggReveal 1s both;
  pointer-events: none;
}

.hero h1 {
  font-size: clamp(48px, 5.2vw, 79px);
  line-height: 1.03;
  margin: 16px 0 20px;
}

.hero-overline {
  letter-spacing: .28em;
}

.hero p {
  letter-spacing: .24em;
  font-size: 11px;
}

.hero-footnote {
  margin-top: 25px;
}

/* DISTRIBUCIÓN ORBITAL */

.module-grid {
  position: absolute;
  inset: 0;
  display: block;
  z-index: 3;
  pointer-events: none;
}

.module-shell,
.module-shell:nth-child(n) {
  position: absolute;
  min-height: 0 !important;
  width: clamp(180px, 19vw, 246px);
  height: 132px;
  grid-column: auto;
  animation: ggReveal .8s var(--delay, 0s) both;
  pointer-events: auto;
}

.slot-sales {
  left: 17%;
  top: 13%;
}

.slot-people {
  left: 50%;
  top: 5%;
  transform: translateX(-50%);
}

.slot-warehouse {
  right: 17%;
  top: 13%;
}

.slot-payments {
  right: 3%;
  top: 37%;
}

.slot-finance {
  right: 17%;
  bottom: 12%;
}

.slot-collections {
  left: 50%;
  bottom: 4%;
  transform: translateX(-50%);
}

.slot-profile-notif {
  left: 17%;
  bottom: 12%;
}

.slot-xml {
  left: 3%;
  top: 37%;
}

/* TARJETAS LIQUID GLASS */

.module-card {
  padding: 17px 19px;
  border-radius: 19px;
  background:
    linear-gradient(
      145deg,
      #ffffff13,
      #ffffff05 65%
    ),
    #171a1ed9;
  border: 1px solid #ffffff22;
  box-shadow:
    0 15px 45px #0005,
    inset 0 1px #ffffff10;
  backdrop-filter: blur(24px) saturate(125%);
  -webkit-backdrop-filter:
    blur(24px) saturate(125%);
  transition:
    transform .35s cubic-bezier(.2,.8,.2,1),
    border-color .35s,
    background .35s;
}

.module-card:hover {
  transform: translateY(-5px) scale(1.025);
  border-color: #ffffff65;
  background:
    linear-gradient(
      145deg,
      #ffffff20,
      #ffffff07 65%
    ),
    #20242a;
}

.module-card:focus-visible {
  outline: 2px solid var(--gg-blue);
  outline-offset: 4px;
}

.card-top {
  align-items: center;
}

.card-icon {
  width: 27px;
  height: 27px;
}

.card-icon svg {
  width: 19px;
  height: 19px;
}

.card-serial {
  font-size: 9px;
  opacity: .6;
}

.card-content {
  gap: 4px;
}

.card-eyebrow {
  font-size: 8px;
  letter-spacing: .15em;
}

.card-title,
.is-featured .card-title {
  font-size: clamp(15px, 1.5vw, 19px);
  line-height: 1.15;
  letter-spacing: -.04em;
}

.card-description {
  display: none;
}

.card-footer {
  margin-top: auto;
  padding-top: 4px;
}

.card-meta {
  font-size: 8px;
  letter-spacing: .11em;
}

.card-arrow {
  font-size: 17px;
}

/* ANILLOS DE ENERGÍA */

.gg-orbit {
  position: absolute;
  z-index: 1;
  inset: 10% 16%;
  pointer-events: none;
  display: grid;
  place-items: center;
}

.gg-orbit::before {
  content: "";
  position: absolute;
  width: min(58vw, 610px);
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1px solid #ffffff0d;
  box-shadow:
    0 0 0 75px #ffffff03,
    0 0 0 150px #ffffff02;
}

.gg-orbit::after {
  content: "";
  position: absolute;
  width: min(42vw, 430px);
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1px solid #ffffff0c;
}

.gg-energy {
  position: absolute;
  width: min(58vw, 620px);
  aspect-ratio: 1;
  border-radius: 50%;
  filter: blur(27px);
  opacity: .7;
  background: conic-gradient(
    from 10deg,
    transparent 0deg,
    #f28b4340 40deg,
    transparent 95deg,
    #83d9ed52 155deg,
    transparent 220deg,
    #f28b4338 290deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(
    transparent 49%,
    #000 58%,
    #000 65%,
    transparent 74%
  );
  mask: radial-gradient(
    transparent 49%,
    #000 58%,
    #000 65%,
    transparent 74%
  );
  animation:
    ggSpin 27s linear infinite,
    ggBreathe 7s ease-in-out infinite alternate;
}

.gg-energy.second {
  width: min(49vw, 530px);
  opacity: .52;
  filter: blur(20px);
  animation-direction: reverse;
  animation-duration: 36s;
  background: conic-gradient(
    from 0deg,
    transparent,
    #83d9ed66,
    transparent 35%,
    #f28b4359,
    transparent 75%,
    #83d9ed44,
    transparent
  );
}

.gg-orbit-core {
  position: absolute;
  width: min(35vw, 360px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #ffffff06,
    transparent 68%
  );
  box-shadow: 0 0 90px #83d9ed09;
}

.site-footer {
  position: relative;
  z-index: 2;
  margin-top: 20px;
}

.gg-orbit-hint {
  position: absolute;
  bottom: 30px;
  right: 0;
  font-size: 10px;
  letter-spacing: .15em;
  color: #a9b0b8;
}

/* ANIMACIONES */

@keyframes ggSpin {
  to { transform: rotate(360deg); }
}

@keyframes ggBreathe {
  to {
    opacity: .35;
    scale: 1.06;
  }
}

@keyframes ggReveal {
  from {
    opacity: 0;
    filter: blur(9px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}

/* TABLETS */

@media (max-width: 1100px) {
  .workspace { min-height: 750px; }

  .module-shell,
  .module-shell:nth-child(n) {
    width: 190px;
    height: 126px;
  }

  .slot-sales,
  .slot-profile-notif { left: 9%; }

  .slot-warehouse,
  .slot-finance { right: 9%; }

  .slot-xml { left: 0; }
  .slot-payments { right: 0; }

  .hero h1 {
    font-size: clamp(42px, 5vw, 62px);
  }
}

/* MÓVILES */

@media (max-width: 760px) {
  .masthead,
  .page-content {
    width: calc(100% - 32px);
  }

  .workspace {
    min-height: 0;
    padding-top: 280px;
    padding-bottom: 30px;
  }

  .workspace-heading { top: 0; }
  .workspace-side { top: 40px; }

  .hero {
    top: 95px;
    left: 50%;
    width: 100%;
    max-width: 430px;
    transform: translateX(-50%);
  }

  .hero h1 {
    font-size: clamp(45px, 10vw, 67px);
  }

  .hero-footnote { margin-top: 14px; }

  .gg-orbit {
    inset: 30px 0 auto;
    height: 260px;
    opacity: .6;
  }

  .gg-orbit::before { width: 260px; }
  .gg-orbit::after { width: 190px; }
  .gg-energy { width: 270px; }
  .gg-energy.second { width: 230px; }
  .gg-orbit-core { width: 180px; }

  .module-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 11px;
  }

  .module-shell,
  .module-shell:nth-child(n) {
    position: relative;
    left: auto;
    right: auto;
    top: auto;
    bottom: auto;
    transform: none;
    width: auto;
    height: 138px;
    min-height: 0 !important;
  }

  .module-card { padding: 14px; }

  .card-title,
  .is-featured .card-title { font-size: 16px; }

  .card-meta { font-size: 7px; }
  .gg-orbit-hint { display: none; }
}

@media (max-width: 420px) {
  .module-grid { grid-template-columns: 1fr; }

  .module-shell,
  .module-shell:nth-child(n) {
    height: 116px;
  }

  .workspace { padding-top: 265px; }
  .hero h1 { font-size: 49px; }
}

@media (prefers-reduced-motion: reduce) {
  .gg-energy,
  .gg-energy.second,
  .module-shell,
  .hero {
    animation: none !important;
  }

  .module-card { transition: none; }
}
`;

const js = String.raw`
/*
  GG ORBITAL ATELIER
  Presentación exclusivamente.
  No reemplaza navegación, permisos ni sesión.
*/
(() => {
  "use strict";

  function init() {
    const workspace = document.querySelector(".workspace");
    const hero = document.querySelector(".hero");
    const grid = workspace?.querySelector(".module-grid");

    if (!workspace || !hero || !grid) return;
    if (workspace.dataset.ggOrbital === "1") return;

    const modules = [...grid.querySelectorAll("[data-module]")];

    if (modules.length !== 8) {
      console.warn(
        "[GG Orbital] Cantidad inesperada de módulos."
      );
      return;
    }

    workspace.dataset.ggOrbital = "1";

    const orbit = document.createElement("div");
    orbit.className = "gg-orbit";
    orbit.setAttribute("aria-hidden", "true");

    orbit.innerHTML = [
      '<div class="gg-energy"></div>',
      '<div class="gg-energy second"></div>',
      '<div class="gg-orbit-core"></div>'
    ].join("");

    workspace.insertBefore(orbit, grid);
    workspace.insertBefore(hero, grid);

    const hint = document.createElement("span");
    hint.className = "gg-orbit-hint";
    hint.textContent = "OCHO ESPACIOS · UNA SOLA PLATAFORMA";
    workspace.append(hint);

    // Los botones originales permanecen intactos.
    // sistema.js conserva el control de acceso.
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();
`;

/* VALIDACIONES */

function fail(message) {
  throw new Error("[GG Orbital] " + message);
}

if (!fs.existsSync(HTML)) {
  fail("Ejecuta desde la raíz del proyecto.");
}

if (!fs.existsSync(path.join(ROOT, "js/sistema.js"))) {
  fail("Falta js/sistema.js.");
}

if (!fs.existsSync(path.join(ROOT, "css/sistema.css"))) {
  fail("Falta css/sistema.css.");
}

let html = fs.readFileSync(HTML, "utf8");

for (const marker of [
  'class="workspace"',
  'class="module-grid"',
  'class="hero"',
  "js/sistema.js",
  "css/sistema.css"
]) {
  if (!html.includes(marker)) {
    fail("Estructura inesperada: " + marker);
  }
}

const count = (html.match(/data-module="[^"]+"/g) || []).length;

if (count !== 8) {
  fail(`Se esperaban 8 módulos; encontrados ${count}.`);
}

/* INYECCIÓN SIN DUPLICADOS */

if (!html.includes("css/sistema-orbital.css")) {
  html = html.replace(
    "</head>",
    '  <link rel="stylesheet" href="css/sistema-orbital.css">\n</head>'
  );
}

if (!html.includes("js/sistema-orbital.js")) {
  html = html.replace(
    "</body>",
    '  <script src="js/sistema-orbital.js"></script>\n</body>'
  );
}

/* ESCRITURA CON RECUPERACIÓN */

const writes = [
  [CSS, css],
  [JS, js],
  [HTML, html]
];

const originals = writes.map(([file]) => [
  file,
  fs.existsSync(file) ? fs.readFileSync(file) : null
]);

try {
  for (const [file, content] of writes) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, "utf8");
  }

  console.log("✓ GG Orbital Atelier instalado.");
  console.log("✓ Ocho módulos conservados.");
  console.log("✓ Sesión y permisos sin modificar.");
  console.log("Ejecuta: npm run dev");
} catch (error) {
  for (const [file, previous] of originals) {
    try {
      if (previous === null) {
        fs.rmSync(file, { force: true });
      } else {
        fs.writeFileSync(file, previous);
      }
    } catch (recoveryError) {
      console.error("No se pudo restaurar:", file, recoveryError);
    }
  }

  fail("Error de escritura. Recuperación intentada: " + error.message);
}
