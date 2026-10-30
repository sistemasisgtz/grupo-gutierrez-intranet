
"use strict";

/*
 * GRUPO GUTIÉRREZ · LOCALES Y DEPARTAMENTOS
 * FILTROS + TARJETAS COMPACTAS V4
 *
 * Ejecutar en la raíz de GG:
 *   node fix_filtro_tipo_compacto_v4.cjs
 *
 * No modifica Supabase ni Ingeniería y Proyectos LO.
 * No genera .bak ni carpetas de respaldo.
 */

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const base = process.cwd();
const target = name => path.join(base, name);
const exists = name => fs.existsSync(target(name));

if (
  !exists("sistema.html") ||
  !exists("locales-departamentos.html")
) {
  throw new Error(
    "Ejecuta este instalador desde la raíz de Grupo Gutiérrez."
  );
}

if (exists("public/dashboard.html")) {
  throw new Error(
    "Se detectó LO: este correctivo es SOLO para Grupo Gutiérrez."
  );
}

const pageName = "locales-departamentos.html";

let html = fs.readFileSync(
  target(pageName),
  "utf8"
);

if (
  !/\bdata-mode\s*=\s*["']gg["']/i.test(html) ||
  !/\bid\s*=\s*["']ldApp["']/i.test(html)
) {
  throw new Error(
    "El HTML no corresponde a Dirección / Locales GG."
  );
}

if (!/\bjs\/ld-app(?:-v2)?\.js\b/i.test(html)) {
  throw new Error(
    "No encontré el JavaScript actual de Locales; instalación no reconocida."
  );
}

/* =====================================================
   1. CSS — TARJETAS MÁS PEQUEÑAS
===================================================== */

const css = String.raw`
/* GG · LOCALES · FILTRO DE TIPO Y VISTA COMPACTA V4 */

/* Más inmuebles por fila. */

body.ld-body[data-mode="gg"] #ldApp .ld-grid {
  display: grid !important;
  grid-template-columns:
    repeat(
      auto-fill,
      minmax(min(100%, 220px), 1fr)
    ) !important;
  gap: 12px !important;
  align-items: stretch !important;
}

/* Tarjeta del bien */

body.ld-body[data-mode="gg"]
#ldApp .ld-grid > article.ld-card {
  padding: 13px !important;
  border-radius: 16px !important;
  min-width: 0 !important;
  margin: 0 !important;
}

/* Ilustración más compacta */

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-art {
  height: 91px !important;
  min-height: 91px !important;
  padding: 5px !important;
  margin-bottom: 9px !important;
  border-radius: 11px !important;
  overflow: hidden !important;
}

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-art svg {
  display: block !important;
  width: 108px !important;
  height: 80px !important;
  max-height: 100% !important;
  max-width: 100% !important;
}

/* Nombre y tipo del inmueble */

body.ld-body[data-mode="gg"]
#ldApp .ld-card h2 {
  font-size: 16px !important;
  line-height: 1.25 !important;
  margin: 8px 0 5px !important;
  letter-spacing: -.02em !important;
}

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-tag,

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-pill {
  font-size: 10px !important;
  padding: 4px 8px !important;
}

/* Dirección en un máximo de dos renglones */

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-address {
  font-size: 12px !important;
  line-height: 1.4 !important;
  min-height: 0 !important;
  margin: 4px 0 7px !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden !important;
}

/* Responsable y teléfono */

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-contact,

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-meta {
  padding: 9px !important;
  margin: 9px 0 !important;
  border-radius: 10px !important;
}

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-contact strong,

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-contact a,

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-contact span {
  font-size: 12px !important;
  overflow-wrap: anywhere !important;
}

/* Selector de responsable */

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-field-hint {
  margin: 0 0 4px !important;
}

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-select,

body.ld-body[data-mode="gg"]
#ldApp .ld-card select[data-responsible] {
  min-height: 37px !important;
  width: 100% !important;
  padding: 7px 9px !important;
  font-size: 12px !important;
}

/* Botones Pendientes, Agua y Editar */

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-card-actions {
  gap: 6px !important;
  margin-top: 10px !important;
}

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-card-actions .ld-button,

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-card-actions .ld-btn {
  flex: 1 1 auto;
  min-height: 36px !important;
  padding: 7px 9px !important;
  border-radius: 9px !important;
  font-size: 11px !important;
}

body.ld-body[data-mode="gg"]
#ldApp .ld-card .ld-count {
  min-width: 18px;
  height: 18px;
  font-size: 10px;
}

/* =====================================================
   2. DISEÑO DEL FILTRO POR TIPO
===================================================== */

body.ld-body[data-mode="gg"]
#ldApp .ld-toolbar .ld-v4-type {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  color: #496a82;
  font-weight: 800;
}

body.ld-body[data-mode="gg"]
#ldApp .ld-v4-type select {
  min-width: 158px;
  min-height: 45px;
  padding: 9px 13px;
  border: 1px solid #cadce8;
  background: #fff;
  border-radius: 11px;
  color: #244c6a;
  font-weight: 700;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

/* Botón Solo con pendientes */

body.ld-body[data-mode="gg"]
#ldApp .ld-v4-pending {
  align-self: end;
  min-height: 45px;
  border: 1px solid #cadce8;
  background: #fff;
  border-radius: 11px;
  padding: 10px 13px;
  color: #315a77;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

body.ld-body[data-mode="gg"]
#ldApp .ld-v4-pending[aria-pressed="true"] {
  background: #e6f2fa;
  border-color: #3a78a0;
  color: #245879;
}

/* Número de inmuebles visibles */

body.ld-body[data-mode="gg"]
#ldApp .ld-v4-summary {
  flex-basis: 100%;
  font-size: 12px;
  color: #657f91;
  font-weight: 650;
  padding-top: 2px;
}

/* Ocultar bienes que no cumplen filtros */

body.ld-body[data-mode="gg"]
#ldApp .ld-grid > article.ld-card[hidden],

body.ld-body[data-mode="gg"]
#ldApp .ld-grid > .ld-v4-empty[hidden] {
  display: none !important;
}

/* Sin resultados */

body.ld-body[data-mode="gg"]
#ldApp .ld-v4-empty {
  grid-column: 1 / -1;
  background: #fff;
  border: 1px dashed #c9dce9;
  color: #5b7789;
  border-radius: 16px;
  padding: 32px 18px;
  text-align: center;
  font-size: 14px;
}

/* Miniaturas del administrador de bienes */

body.ld-body[data-mode="gg"]
.ld-manager-tiles svg,

body.ld-body[data-mode="gg"]
.ld-manager-grid .ld-person-tile svg {
  width: 84px !important;
  height: 70px !important;
  max-width: 100% !important;
  max-height: 70px !important;
}

/* Responsive */

@media (max-width: 550px) {
  body.ld-body[data-mode="gg"]
  #ldApp .ld-grid {
    grid-template-columns:
      repeat(
        auto-fill,
        minmax(min(100%, 170px), 1fr)
      ) !important;
  }

  body.ld-body[data-mode="gg"]
  #ldApp .ld-toolbar .ld-v4-type {
    flex: 1 1 145px;
  }

  body.ld-body[data-mode="gg"]
  #ldApp .ld-v4-type select {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 390px) {
  body.ld-body[data-mode="gg"]
  #ldApp .ld-grid {
    grid-template-columns: 1fr !important;
  }
}
`;

/* =====================================================
   3. JAVASCRIPT — FILTROS COMBINADOS
===================================================== */

const js = String.raw`
/*
  GG · FILTROS COMBINADOS V4

  - Todos / Locales / Casas / Departamentos
  - Solo bienes con pendientes
  - Ambos filtros funcionan simultáneamente
  - Mantiene selección al refrescar el tablero
  - Sin consultas adicionales a Supabase
*/

(() => {
  "use strict";

  if (document.body.dataset.mode !== "gg") {
    return;
  }

  const app = document.getElementById("ldApp");

  const modals = document.getElementById(
    "ldModalHost"
  );

  if (!app) return;

  let type = "todos";
  let onlyPending = false;

  function sync() {
    const toolbar = app.querySelector(
      ".ld-toolbar"
    );

    const grid = app.querySelector(
      ".ld-grid"
    );

    if (!toolbar || !grid) return;

    /* -------------------------------------
       FILTRO DE TIPO
    ------------------------------------- */

    let typeWrap = toolbar.querySelector(
      "#ldTypeWrapV4"
    );

    if (!typeWrap) {
      typeWrap = document.createElement("label");

      typeWrap.id = "ldTypeWrapV4";
      typeWrap.className = "ld-v4-type";

      typeWrap.append(
        document.createTextNode("Tipo de bien")
      );

      const select = document.createElement(
        "select"
      );

      select.id = "ldTypeFilterV4";

      select.setAttribute(
        "aria-label",
        "Filtrar bienes por tipo"
      );

      const options = [
        ["todos", "Todos los tipos"],
        ["local", "🏬 Locales"],
        ["casa", "🏠 Casas"],
        ["departamento", "🏢 Departamentos"]
      ];

      for (const [value, label] of options) {
        const option = document.createElement(
          "option"
        );

        option.value = value;
        option.textContent = label;

        select.append(option);
      }

      select.value = type;

      select.addEventListener(
        "change",
        () => {
          type = select.value;
          sync();
        }
      );

      typeWrap.append(select);

      toolbar.insertBefore(
        typeWrap,
        toolbar.querySelector("#ldSearch")
      );
    }

    /* -------------------------------------
       FILTRO SOLO CON PENDIENTES
    ------------------------------------- */

    let pendingBtn = toolbar.querySelector(
      "#ldPendingV4"
    );

    if (!pendingBtn) {
      pendingBtn = document.createElement(
        "button"
      );

      pendingBtn.id = "ldPendingV4";
      pendingBtn.type = "button";
      pendingBtn.className = "ld-v4-pending";

      pendingBtn.addEventListener(
        "click",
        () => {
          onlyPending = !onlyPending;
          sync();
        }
      );

      toolbar.insertBefore(
        pendingBtn,
        toolbar.querySelector("#ldSearch")
      );
    }

    const pendingLabel = onlyPending
      ? "✓ Solo con pendientes"
      : "◉ Solo con pendientes";

    if (pendingBtn.textContent !== pendingLabel) {
      pendingBtn.textContent = pendingLabel;
    }

    pendingBtn.setAttribute(
      "aria-pressed",
      String(onlyPending)
    );

    /* -------------------------------------
       APLICAR LOS DOS FILTROS
    ------------------------------------- */

    const cards = [
      ...grid.querySelectorAll(
        "article.ld-card"
      )
    ];

    let shown = 0;

    for (const card of cards) {
      // Cada bien muestra su tipo
      // en la etiqueta superior.

      const kind = (
        card.querySelector(
          ".ld-tag, .ld-pill"
        )?.textContent || ""
      ).trim().toLowerCase();

      // Número de pendientes activos.

      const badge = card.querySelector(
        ".ld-count"
      );

      const pending = Number(
        (badge?.textContent || "0").trim()
      ) || 0;

      const typeMatches =
        type === "todos" || kind === type;

      const pendingMatches =
        !onlyPending || pending > 0;

      const display =
        typeMatches && pendingMatches;

      card.hidden = !display;

      if (display) {
        shown++;
      }
    }

    /* -------------------------------------
       MENSAJE SIN RESULTADOS
    ------------------------------------- */

    let empty = grid.querySelector(
      "#ldEmptyV4"
    );

    if (cards.length && !shown) {
      if (!empty) {
        empty = document.createElement(
          "div"
        );

        empty.id = "ldEmptyV4";
        empty.className = "ld-v4-empty";

        empty.textContent =
          "No hay inmuebles que coincidan " +
          "con estos filtros.";

        grid.append(empty);
      }

    } else if (empty) {
      empty.remove();
    }

    /* -------------------------------------
       CONTADOR DE BIENES VISIBLES
    ------------------------------------- */

    let summary = toolbar.querySelector(
      "#ldSummaryV4"
    );

    if (!summary) {
      summary = document.createElement(
        "div"
      );

      summary.id = "ldSummaryV4";
      summary.className = "ld-v4-summary";

      summary.setAttribute(
        "role",
        "status"
      );

      toolbar.append(summary);
    }

    const message =
      "Mostrando " + shown +
      " inmueble" +
      (shown === 1 ? "" : "s") +
      (
        onlyPending
          ? " con pendientes activos"
          : ""
      ) +
      ".";

    if (summary.textContent !== message) {
      summary.textContent = message;
    }
  }

  /* -------------------------------------
     CONSERVAR ENVÍO AUTOMÁTICO A LO
  ------------------------------------- */

  function removeManualSend() {
    if (!modals) return;

    modals.querySelectorAll(
      '[data-action="sendTask"]'
    ).forEach(button => button.remove());
  }

  /* -------------------------------------
     DETECTAR REFRESCOS DE LA INTERFAZ
  ------------------------------------- */

  const watch = new MutationObserver(sync);

  watch.observe(app, {
    childList: true,
    subtree: true
  });

  if (modals) {
    new MutationObserver(
      removeManualSend
    ).observe(modals, {
      childList: true,
      subtree: true
    });
  }

  sync();
  removeManualSend();
})();
`;

/* =====================================================
   4. INSERTAR ARCHIVOS EN EL HTML EXISTENTE
===================================================== */

// Quitar únicamente el observador anterior V3
// para evitar que compita con los filtros nuevos.
// Se conserva el CSS V3 de miniaturas.

html = html.replace(
  /<script\b[^>]*\bsrc\s*=\s*["']js\/ld-fixes-v3\.js["'][^>]*>\s*<\/script>\s*/gi,
  ""
);

function addOnce(anchor, tag, name) {
  if (html.includes(name)) return;

  if (!html.includes(anchor)) {
    throw new Error(
      "Falta " + anchor + " en el HTML."
    );
  }

  html = html.replace(
    anchor,
    tag + "\n" + anchor
  );
}

addOnce(
  "</head>",
  '<link rel="stylesheet" href="css/ld-filtros-v4.css">',
  "ld-filtros-v4.css"
);

addOnce(
  "</body>",
  '<script src="js/ld-filtros-v4.js"></script>',
  "ld-filtros-v4.js"
);

/* =====================================================
   5. PREPARAR Y VALIDAR
===================================================== */

const files = new Map([
  [pageName, html],
  ["css/ld-filtros-v4.css", css],
  ["js/ld-filtros-v4.js", js]
]);

// Validación antes de tocar archivos.
new vm.Script(js, {
  filename: "js/ld-filtros-v4.js"
});

/* =====================================================
   6. INSTALAR CON RECUPERACIÓN ANTE ERROR
===================================================== */

const original = new Map();

try {
  for (const [name, contents] of files) {
    const p = target(name);

    original.set(
      p,
      fs.existsSync(p)
        ? fs.readFileSync(p)
        : null
    );

    fs.mkdirSync(
      path.dirname(p),
      {
        recursive: true
      }
    );

    fs.writeFileSync(
      p,
      contents,
      "utf8"
    );
  }

  console.log("");
  console.log("====================================");
  console.log(" GG · LOCALES Y DEPARTAMENTOS V4");
  console.log("====================================");

  console.log(
    "✓ Filtros Local / Casa / Departamento"
  );

  console.log(
    "✓ Compatible con Solo con pendientes"
  );

  console.log(
    "✓ Tarjetas de bienes más compactas"
  );

  console.log(
    "✓ No modifica LO ni Supabase"
  );

  console.log(
    "✓ Sin .bak ni carpetas de respaldo"
  );

  console.log("");

  console.log(
    "Reinicia GG y actualiza con Ctrl + F5."
  );

} catch (error) {
  for (
    const [p, bytes]
    of [...original].reverse()
  ) {
    try {
      if (bytes === null) {
        fs.rmSync(
          p,
          { force: true }
        );

      } else {
        fs.writeFileSync(
          p,
          bytes
        );
      }

    } catch (restoreError) {
      console.error(
        "Error al recuperar",
        p,
        restoreError.message
      );
    }
  }

  throw error;
}
