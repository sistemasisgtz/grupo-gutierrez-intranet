
"use strict";

/*
  GG / INGENIERÍA LO · CORRECTIVO V3

  Ejecutar:
  node fix_locales_orbita_v3.cjs

  Solo frontend.
  Ejecuta el SQL separado para el envío automático.

  No crea .bak.
  Revierte escrituras si surge un error.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = process.cwd();

const gg = fs.existsSync(
  path.join(ROOT, "sistema.html")
);

const lo = fs.existsSync(
  path.join(ROOT, "public/dashboard.html")
);

if (gg === lo) {
  throw Error(
    "Ejecuta este .cjs en la raíz de " +
    "Grupo Gutiérrez o LO."
  );
}

const jobs = new Map();
const file = p => path.join(ROOT, p);

function read(p) {
  if (!fs.existsSync(file(p))) {
    throw Error("No existe " + p);
  }

  return fs.readFileSync(file(p), "utf8");
}

function put(p, contents) {
  jobs.set(p, contents);
}

function include(html, name, type) {
  const ref = type === "css"
    ? '<link rel="stylesheet" href="' + name + '">'
    : '<script src="' + name + '"></script>';

  if (html.includes(name)) {
    return html;
  }

  const tag = type === "css"
    ? "</head>"
    : "</body>";

  if (!html.includes(tag)) {
    throw Error(
      "Falta " + tag + " para insertar " + name
    );
  }

  return html.replace(
    tag,
    ref + "\n" + tag
  );
}

/* =====================================================
   GRUPO GUTIÉRREZ
   MINIATURAS, FILTRO Y BOTÓN MANUAL ELIMINADO
===================================================== */

const uxCSS = String.raw`
/* CORRECTIVO GG · LOCALES V3 */

/* El envío a LO ahora es automático. */
body.ld-body [data-action="sendTask"] {
  display: none !important;
}

/* Miniaturas de los bienes ya registrados. */

body.ld-body .ld-manager-grid
.ld-person-tile svg,

body.ld-body .ld-manager-tiles
.ld-person-tile svg {
  display: block !important;
  width: 84px !important;
  height: 72px !important;
  max-width: 100% !important;
  max-height: 72px !important;
  object-fit: contain !important;
  margin: 0 auto !important;
  flex: none !important;
}

body.ld-body .ld-manager-grid
.ld-person-tile > div[style*="height"],

body.ld-body .ld-manager-tiles
.ld-person-tile > div[style*="height"] {
  display: grid !important;
  place-items: center !important;
  height: 85px !important;
  overflow: hidden !important;
}

/* Los dibujos para seleccionar un icono
   también mantienen proporciones. */

body.ld-body .ld-icons
.ld-icon-option svg,

body.ld-body .ld-icons
.ld-icon-tile svg {
  width: min(100%, 105px) !important;
  height: 85px !important;
  max-height: 85px !important;
}

body.ld-body .ld-manager-grid
.ld-person-tile,

body.ld-body .ld-manager-tiles
.ld-person-tile {
  min-width: 0 !important;
  overflow: hidden !important;
}

/* Filtro para ver únicamente bienes con pendientes. */

body.ld-body .ld-pending-filter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid #c8dbe9;
  background: #fff;
  color: #315a77;
  font-weight: 750;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 5px 18px #315a7709;
}

body.ld-body .ld-pending-filter[aria-pressed="true"] {
  border-color: #326b94;
  background: #e7f3fc;
  color: #214c70;
  box-shadow: inset 0 0 0 1px #326b94;
}

body.ld-body .ld-onlypending-empty {
  grid-column: 1 / -1;
  padding: 42px 20px;
  text-align: center;
  color: #5b7283;
  background: #fff;
  border: 1px dashed #cbdfea;
  border-radius: 20px;
}
`;

const uxJS = String.raw`
/* GG · FILTRO Y ENVÍO AUTOMÁTICO V3 */

(() => {
  "use strict";

  if (document.body.dataset.mode !== "gg") {
    return;
  }

  const app = document.getElementById("ldApp");

  const modalHost = document.getElementById(
    "ldModalHost"
  );

  if (!app) {
    return;
  }

  let onlyPending = false;

  function sync() {
    const toolbar = app.querySelector(
      ".ld-toolbar"
    );

    if (!toolbar) {
      return;
    }

    let button = toolbar.querySelector(
      "#ldOnlyPendingV3"
    );

    if (!button) {
      button = document.createElement("button");

      button.id = "ldOnlyPendingV3";
      button.type = "button";
      button.className = "ld-pending-filter";

      button.textContent =
        "◉ Solo bienes con pendientes";

      button.addEventListener("click", () => {
        onlyPending = !onlyPending;
        sync();
      });

      toolbar.append(button);
    }

    button.setAttribute(
      "aria-pressed",
      String(onlyPending)
    );

    const label = onlyPending
      ? "✓ Solo bienes con pendientes"
      : "◉ Solo bienes con pendientes";

    if (button.textContent !== label) {
      button.textContent = label;
    }

    const grid = app.querySelector(
      ".ld-grid"
    );

    if (!grid) {
      return;
    }

    const cards = [
      ...grid.querySelectorAll(
        "article.ld-card"
      )
    ];

    let shown = 0;

    for (const card of cards) {
      const badge = card.querySelector(
        ".ld-count"
      );

      const number = Number(
        (badge?.textContent || "0").trim()
      );

      const show =
        !onlyPending || number > 0;

      if (show) {
        shown++;
        card.style.removeProperty("display");
      } else {
        card.style.setProperty(
          "display",
          "none",
          "important"
        );
      }
    }

    let empty = grid.querySelector(
      ".ld-onlypending-empty"
    );

    if (
      onlyPending &&
      cards.length &&
      shown === 0
    ) {
      if (!empty) {
        empty = document.createElement("div");

        empty.className =
          "ld-onlypending-empty";

        empty.textContent =
          "Por ahora, ningún bien tiene " +
          "pendientes por atender.";

        grid.append(empty);
      }

    } else if (empty) {
      empty.remove();
    }
  }

  function stripSendButtons() {
    if (!modalHost) {
      return;
    }

    modalHost
      .querySelectorAll(
        '[data-action="sendTask"]'
      )
      .forEach(button => button.remove());

    // El envío se realiza mediante
    // el trigger SQL al crear el pendiente.
  }

  const observer = new MutationObserver(
    () => sync()
  );

  observer.observe(app, {
    childList: true,
    subtree: true
  });

  if (modalHost) {
    const modalObserver = new MutationObserver(
      stripSendButtons
    );

    modalObserver.observe(modalHost, {
      childList: true,
      subtree: true
    });
  }

  sync();
  stripSendButtons();
})();
`;

/* =====================================================
   INGENIERÍA LO
   ESTILOS DE ÓRBITA CIRCULAR
===================================================== */

const loCSS = String.raw`
/* LO · ÓRBITA FINAL V3 */

/* Recuperar el espacio orbital. */

body.lo-dashboard-body .lo-orbit {
  display: block !important;
  position: relative !important;

  width: min(
    1160px,
    calc(100% - 8px)
  ) !important;

  max-width: 1160px !important;

  height: 840px !important;
  min-height: 840px !important;
  max-height: none !important;

  margin: 25px auto 40px !important;
  padding: 0 !important;

  overflow: visible !important;
  isolation: isolate !important;

  grid-template-columns: none !important;
  grid-template-rows: none !important;
}

/* Cada módulo vuelve a orbitar
   alrededor del emblema central. */

body.lo-dashboard-body .lo-orbit
> .lo-module-card {
  position: absolute !important;

  inset: auto !important;

  left: var(--ldx) !important;
  top: var(--ldy) !important;

  right: auto !important;
  bottom: auto !important;

  width: var(--ldw) !important;
  max-width: var(--ldw) !important;
  min-width: 0 !important;

  height: var(--ldh) !important;
  min-height: var(--ldh) !important;
  max-height: var(--ldh) !important;

  margin: 0 !important;
  padding: 12px !important;

  transform:
    translate(-50%, -50%) !important;

  translate: none !important;

  opacity: 1 !important;
  animation: none !important;

  grid-column: auto !important;
  grid-row: auto !important;

  box-sizing: border-box !important;
  z-index: 10 !important;

  transition:
    filter .2s,
    box-shadow .2s !important;
}

body.lo-dashboard-body .lo-orbit
> .lo-module-card:hover {
  transform:
    translate(-50%, -50%) !important;

  translate: none !important;

  filter: brightness(1.055);
}

/* Textos de las tarjetas. */

body.lo-dashboard-body .lo-orbit
> .lo-module-card .lo-module-copy {
  min-width: 0 !important;
}

body.lo-dashboard-body .lo-orbit
> .lo-module-card .lo-module-copy strong {
  display: block !important;

  font-size:
    clamp(10px, 1.12vw, 14px) !important;

  line-height: 1.25 !important;

  white-space: normal !important;
  overflow-wrap: anywhere !important;

  overflow: visible !important;
  text-overflow: clip !important;
}

body.lo-dashboard-body .lo-orbit
> .lo-module-card .lo-module-copy small {
  display: block !important;

  font-size: 10px !important;
  line-height: 1.25 !important;
}

/* Emblema central completamente separado. */

body.lo-dashboard-body .lo-orbit
> .lo-orbit-center {
  position: absolute !important;

  left: 50% !important;
  top: 55% !important;

  right: auto !important;
  bottom: auto !important;

  transform:
    translate(-50%, -50%) !important;

  translate: none !important;

  width: min(225px, 42%) !important;
  max-width: 225px !important;

  height: auto !important;
  grid-area: auto !important;

  margin: 0 !important;

  z-index: 3 !important;
  animation: none !important;
  pointer-events: none !important;
}

/* Aros decorativos. */

body.lo-dashboard-body .lo-orbit
.lo-orbit-ring {
  position: absolute !important;

  left: 50% !important;
  top: 55% !important;

  pointer-events: none !important;
  opacity: .24 !important;
}

/* Tarjeta de Locales y Departamentos. */

body.lo-dashboard-body .lo-orbit
> #localesDepartamentosButton {
  border-color: #96c6e2 !important;

  background:
    linear-gradient(
      140deg,
      #e8f5fc,
      #fff1e5
    ) !important;
}

/* Evitar una segunda lista de accesos
   debajo del círculo. */

body.lo-dashboard-body .lo-mobile-modules {
  display: none !important;
}

/* Ventanas medianas. */

@media (max-width: 1000px) {
  body.lo-dashboard-body .lo-orbit {
    height: 900px !important;
    min-height: 900px !important;
  }

  body.lo-dashboard-body .lo-orbit
  > .lo-module-card .lo-module-copy strong {
    font-size: 12px !important;
  }
}

/* Móviles. */

@media (max-width: 680px) {
  body.lo-dashboard-body .lo-orbit
  > .lo-module-card {
    padding: 8px !important;
    border-radius: 13px !important;
  }

  body.lo-dashboard-body .lo-orbit
  > .lo-module-card .lo-module-copy small,

  body.lo-dashboard-body .lo-orbit
  > .lo-module-card .lo-module-arrow {
    display: none !important;
  }

  body.lo-dashboard-body .lo-orbit
  > .lo-module-card .lo-module-copy strong {
    font-size: 11px !important;
  }

  body.lo-dashboard-body .lo-orbit
  > .lo-module-card .lo-module-icon {
    width: 29px !important;
    height: 29px !important;

    font-size: 15px !important;
  }

  body.lo-dashboard-body .lo-orbit
  > .lo-orbit-center {
    width: min(150px, 42%) !important;
    max-width: 150px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  body.lo-dashboard-body .lo-orbit * {
    animation: none !important;
    transition: none !important;
  }
}
`;

/* =====================================================
   INGENIERÍA LO
   MOTOR DE POSICIONAMIENTO RESPONSIVE
===================================================== */

const loJS = String.raw`
/* LO · MOTOR DE ÓRBITA RESPONSIVE V3 */

(() => {
  "use strict";

  const orbit = document.querySelector(
    ".lo-orbit"
  );

  if (!orbit) {
    return;
  }

  const expected = [
    ["postItsButton", "Pizarrón"],
    ["projectsButton", "Proyectos"],
    ["administrationProjectsButton", "Administración"],
    ["purchaseOrdersButton", "Órdenes de Compra"],
    ["reportsButton", "Reportes"],
    ["operationsButton", "Operaciones"],
    ["paymentRequestsButton", "Solicitudes de Pago"],
    ["loProfileNotificationsButton", "Mi Perfil"],
    [
      "localesDepartamentosButton",
      "Locales y Departamentos"
    ]
  ];

  // Asegurar que la novena tarjeta esté
  // dentro del círculo y no junto al footer.

  const all = [
    ...document.querySelectorAll(
      "#localesDepartamentosButton"
    )
  ];

  if (all.length) {
    const chosen = all[0];

    if (chosen.parentElement !== orbit) {
      orbit.append(chosen);
    }

    for (const duplicate of all.slice(1)) {
      duplicate.remove();
    }

  } else {
    const card = document.createElement(
      "button"
    );

    card.type = "button";

    card.id = "localesDepartamentosButton";

    card.className =
      "lo-module-card lo-module-9";

    card.innerHTML = [
      '<span class="lo-module-index">09</span>',
      '<span class="lo-module-icon">⌂</span>',
      '<span class="lo-module-copy">',
      '<strong>Locales y Departamentos</strong>',
      '<small>Pendientes desde Dirección</small>',
      '</span>',
      '<span class="lo-module-arrow">↗</span>'
    ].join("");

    orbit.append(card);
  }

  // Navegación al módulo LO.
  // El mapa original también puede manejarla.

  orbit
    .querySelector(
      "#localesDepartamentosButton"
    )
    ?.addEventListener("click", () => {
      window.location.assign(
        "locales-departamentos.html"
      );
    });

  function apply() {
    const w = orbit.getBoundingClientRect().width;

    const narrow = w <= 1000;
    const tiny = w <= 680;

    const width = narrow
      ? Math.max(
          104,
          Math.min(
            tiny ? 136 : 182,
            w * (tiny ? .315 : .285)
          )
        )
      : Math.max(
          170,
          Math.min(202, w * .175)
        );

    const height = tiny
      ? 85
      : narrow
        ? 98
        : 106;

    // Pantalla mediana/móvil:
    // dos ramas alrededor del centro,
    // sin empalmar las tarjetas.

    const points = narrow
      ? [
          [50, 9],
          [75, 23],
          [75, 37],
          [75, 77],
          [75, 91],
          [25, 91],
          [25, 77],
          [25, 37],
          [25, 23]
        ]

      // Pantalla grande:
      // distribución circular completa.

      : [
          [50, 10],
          [75, 18],
          [87, 39],
          [80, 67],
          [62, 87],
          [38, 87],
          [20, 67],
          [13, 39],
          [25, 18]
        ];

    orbit.style.setProperty(
      "height",
      narrow ? "900px" : "840px",
      "important"
    );

    orbit.style.setProperty(
      "min-height",
      narrow ? "900px" : "840px",
      "important"
    );

    for (let i = 0; i < 9; i++) {
      const card =
        orbit.querySelector(
          ".lo-module-" + (i + 1)
        ) ||
        document.getElementById(
          expected[i][0]
        );

      if (!card) {
        continue;
      }

      if (card.parentElement !== orbit) {
        orbit.append(card);
      }

      const [x, y] = points[i];

      const imp = (key, value) => {
        card.style.setProperty(
          key,
          value,
          "important"
        );
      };

      // Sobrescribir las posiciones antiguas
      // de dashboard y parches anteriores.

      imp("position", "absolute");
      imp("left", x + "%");
      imp("top", y + "%");

      imp("right", "auto");
      imp("bottom", "auto");

      imp("width", width + "px");
      imp("max-width", width + "px");

      imp("height", height + "px");
      imp("min-height", height + "px");
      imp("max-height", height + "px");

      imp(
        "transform",
        "translate(-50%, -50%)"
      );

      imp("translate", "none");
      imp("animation", "none");

      imp("opacity", "1");
      imp("margin", "0");

      imp("grid-area", "auto");
    }
  }

  // Reacomodar cuando se cambie el tamaño
  // de la ventana.

  let frame = 0;

  window.addEventListener(
    "resize",
    () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(
        apply
      );
    },
    { passive: true }
  );

  apply();
})();
`;

/* =====================================================
   APLICACIÓN DE ARCHIVOS EN GG
===================================================== */

if (gg) {
  const page = "locales-departamentos.html";

  let html = read(page);

  // Cargar los correctivos después
  // de los archivos originales.

  html = include(
    html,
    "css/ld-fixes-v3.css",
    "css"
  );

  html = include(
    html,
    "js/ld-fixes-v3.js",
    "js"
  );

  put(page, html);

  put(
    "css/ld-fixes-v3.css",
    uxCSS
  );

  put(
    "js/ld-fixes-v3.js",
    uxJS
  );
}

/* =====================================================
   APLICACIÓN DE ARCHIVOS EN LO
===================================================== */

else {
  let html = read(
    "public/dashboard.html"
  );

  // Neutralizar las hojas anteriores que
  // forzaban cuadrículas o posiciones incompatibles.

  html = html.replace(
    /<link\b[^>]*href=["']css\/(?:lo-locales-layout|lo-orbita-correctiva|lo-orbita-9-v2)\.css["'][^>]*>\s*/gi,
    ""
  );

  html = include(
    html,
    "css/lo-orbita-final-v3.css",
    "css"
  );

  html = include(
    html,
    "js/lo-orbita-final-v3.js",
    "js"
  );

  put(
    "public/dashboard.html",
    html
  );

  put(
    "public/css/lo-orbita-final-v3.css",
    loCSS
  );

  put(
    "public/js/lo-orbita-final-v3.js",
    loJS
  );

  // Validar que ya existe el módulo de LO.
  read(
    "public/locales-departamentos.html"
  );
}

/* =====================================================
   VALIDACIÓN DE ARCHIVOS GENERADOS
===================================================== */

for (const [name, content] of jobs) {
  if (!content.trim()) {
    throw Error(
      "Archivo vacío: " + name
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
   INSTALACIÓN Y RECUPERACIÓN
===================================================== */

const old = new Map();

try {
  for (const [name, content] of jobs) {
    const target = file(name);

    old.set(
      target,
      fs.existsSync(target)
        ? fs.readFileSync(target)
        : null
    );

    fs.mkdirSync(
      path.dirname(target),
      { recursive: true }
    );

    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }

  console.log("");
  console.log("=================================");
  console.log(" GG / LO · CORRECTIVO V3");
  console.log("=================================");
  console.log("");

  console.log(
    "Proyecto: " +
    (gg ? "GRUPO GUTIÉRREZ" : "INGENIERÍA LO")
  );

  if (gg) {
    console.log(
      "✓ Filtro de bienes con pendientes"
    );

    console.log(
      "✓ Miniaturas de bienes corregidas"
    );

    console.log(
      "✓ Botón Enviar a LO eliminado"
    );

  } else {
    console.log(
      "✓ Nueve tarjetas en órbita"
    );

    console.log(
      "✓ Emblema central conservado"
    );

    console.log(
      "✓ Módulo LO accesible"
    );
  }

  console.log(
    "✓ Sin respaldos .bak"
  );

  console.log(
    "✓ Instalación repetible"
  );

  console.log("");
  console.log(
    "IMPORTANTE: Ejecuta el SQL de " +
    "envío automático en Supabase."
  );

  console.log("");

} catch (error) {
  for (
    const [target, bytes]
    of [...old].reverse()
  ) {
    try {
      if (bytes === null) {
        fs.rmSync(
          target,
          { force: true }
        );
      } else {
        fs.writeFileSync(
          target,
          bytes
        );
      }
    } catch (err) {
      console.error(
        "No se pudo restaurar " +
        target + ": " + err.message
      );
    }
  }

  throw error;
}
