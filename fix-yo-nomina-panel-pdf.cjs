
"use strict";

/*
 GRUPO GUTIERREZ
 FIX YO / NOMINA V2

 Ejecutar desde la raiz:
 node fix-yo-nomina-panel-pdf.cjs

 Sin librerias externas.
 Sin .bak ni carpetas de backup.
 No modifica SQL, RH ni otros modulos.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = process.cwd();
const dest = name => path.join(root, name);

const changes = new Map();
const previous = new Map();

function original(name) {
  if (!fs.existsSync(dest(name))) {
    throw new Error(
      "No existe " + name +
      ". Ejecuta este fix en la raiz " +
      "del proyecto con Nomina instalado."
    );
  }

  return fs.readFileSync(dest(name), "utf8");
}

// ===================================================
// NUEVO JAVASCRIPT DE LA CAMPANITA
// ===================================================

const payrollYo = String.raw`
/* GG_YO_PAYROLL_FIX_V2 */

(() => {
  "use strict";

  if (window.__ggYoPayrollFixV2) return;
  window.__ggYoPayrollFixV2 = true;

  const db = window.ggSupabase;
  const $ = id => document.getElementById(id);

  const token = () =>
    sessionStorage.getItem("gg_intranet_token");

  let loading = false;
  let receipts = [];
  let initialOtherCount = null;

  function labelDate(value) {
    if (!value) return "";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
  }

  // ================================================
  // CONTADOR DE NOTIFICACIONES
  // ================================================

  function setBadge() {
    const badge = $("yoNotificationBadge");
    if (!badge) return;

    if (initialOtherCount === null) {
      const parsed = Number.parseInt(
        badge.textContent, 10
      );

      initialOtherCount =
        Number.isFinite(parsed) ? parsed : 0;
    }

    const unread = receipts.filter(
      r => !r.read_at
    ).length;

    const total = initialOtherCount + unread;

    badge.textContent =
      total > 99 ? "99+" : String(total);

    badge.classList.toggle(
      "empty",
      total === 0
    );
  }

  // ================================================
  // BANDEJA
  // ================================================

  function ensureHolder() {
    const list = $("yoNotificationsList");
    if (!list) return null;

    let holder = $("ggPayrollYoList");

    if (!holder) {
      holder = document.createElement("section");
      holder.id = "ggPayrollYoList";
      holder.className = "gg-payroll-yo";

      list.append(holder);
    }

    return holder;
  }

  function showNotice(text, type = "error") {
    const holder = ensureHolder();
    if (!holder) return;

    let el = $("ggPayrollYoFeedback");

    if (!el) {
      el = document.createElement("div");
      el.id = "ggPayrollYoFeedback";
      el.setAttribute("role", "status");

      holder.prepend(el);
    }

    el.className =
      "gg-payroll-yo-feedback " + type;

    el.textContent = text;
    el.hidden = !text;
  }

  // ================================================
  // APERTURA INMEDIATA DE PESTAÑA
  // ================================================

  function prepareTab() {
    /*
     La pestaña se crea directamente
     durante el clic del usuario.

     No se espera a Supabase para crearla.
     Esto evita bloqueos de ventanas emergentes.
    */

    let tab = null;

    try {
      tab = window.open(
        "about:blank",
        "_blank"
      );

      if (tab) {
        tab.opener = null;

        tab.document.title =
          "Preparando recibo · Grupo Gutierrez";

        tab.document.body.style.cssText =
          "background:#0c1520;" +
          "color:#eaf7ff;" +
          "font:16px system-ui;" +
          "padding:50px;";

        tab.document.body.textContent =
          "Preparando tu PDF privado de nomina...";
      }

    } catch (error) {
      console.warn(
        "[NOMINA YO] No se pudo preparar pestaña",
        error
      );
    }

    return tab;
  }

  // ================================================
  // ERRORES REALES DEL SERVIDOR
  // ================================================

  async function readableError(error) {
    const response = error && error.context;

    const status = Number(
      response?.status || 0
    );

    let description = "";

    try {
      const result =
        await response.clone().json();

      description =
        result?.error ||
        result?.message ||
        "";
    } catch (_) {
      // La respuesta puede no ser JSON.
    }

    if (status === 401) {
      return (
        "Error 401: la funcion de Supabase " +
        "necesita desplegarse con " +
        "--no-verify-jwt para YO."
      );
    }

    if (status === 404) {
      return (
        "Error 404: la funcion " +
        "gg-payroll-download no esta " +
        "desplegada en este proyecto."
      );
    }

    if (status === 403) {
      return (
        "Error 403: documento no autorizado " +
        "para esta sesion de YO. " +
        "Cierra sesion, vuelve a entrar " +
        "y comprueba la asignacion."
      );
    }

    if (status >= 500) {
      return (
        "Error " + status +
        ": fallo del servidor de nomina. " +
        "Revisa Edge Functions > Logs en Supabase."
      );
    }

    return description ||
      error?.message ||
      "No se pudo conectar con el servicio privado.";
  }

  // ================================================
  // VALIDAR URL PRIVADA
  // ================================================

  function authorizedUrl(input) {
    if (
      !input ||
      typeof input !== "string"
    ) {
      throw new Error(
        "El servidor no devolvio un enlace PDF."
      );
    }

    const url = new URL(input);
    const expected = new URL(db.supabaseUrl);

    if (
      url.protocol !== "https:" ||
      url.origin !== expected.origin ||
      !url.pathname.startsWith(
        "/storage/v1/object/sign/gg-payroll-private/"
      )
    ) {
      throw new Error(
        "El servidor devolvio un enlace " +
        "inesperado. No se abrira."
      );
    }

    return url.href;
  }

  // ================================================
  // ABRIR RECIBO DE NÓMINA
  // ================================================

  async function openReceipt(receipt, button) {
    if (!token()) {
      showNotice(
        "Tu sesion de YO termino. " +
        "Vuelve a iniciar sesion."
      );
      return;
    }

    if (button.disabled) return;

    // Abrimos la pestaña ANTES de cualquier await.
    const tab = prepareTab();

    button.disabled = true;
    button.classList.add(
      "gg-payroll-yo-loading"
    );

    const action = button.querySelector(
      ".gg-payroll-yo-action"
    );

    const oldText =
      action?.textContent || "Abrir PDF";

    if (action) {
      action.textContent =
        "Autorizando PDF...";
    }

    showNotice("");

    try {
      if (!db?.functions?.invoke) {
        throw new Error(
          "Supabase no esta disponible en YO."
        );
      }

      const { data, error } =
        await db.functions.invoke(
          "gg-payroll-download",
          {
            body: {
              session_token: token(),
              document_id: receipt.id
            }
          }
        );

      if (error) {
        throw new Error(
          await readableError(error)
        );
      }

      const url = authorizedUrl(
        data?.url
      );

      /*
       Ya tenemos la URL autorizada.

       Si la pestaña se abrió correctamente,
       cargamos ahí el PDF.

       Si el navegador bloqueó la pestaña,
       navegamos en la ventana actual.
      */

      if (tab && !tab.closed) {
        tab.location.replace(url);
      } else {
        window.location.assign(url);
      }

      receipt.read_at =
        receipt.read_at ||
        new Date().toISOString();

      setBadge();

      void refresh();

    } catch (error) {
      const message =
        error?.message || "Error inesperado";

      showNotice(
        "No se pudo abrir el PDF. " +
        message
      );

      if (tab && !tab.closed) {
        try {
          tab.document.body.textContent =
            "No se pudo abrir el PDF. " +
            message;
        } catch (_) {
          // La pestaña puede haberse cerrado.
        }
      }

      console.error(
        "[NOMINA YO]",
        message
      );

    } finally {
      button.disabled = false;

      button.classList.remove(
        "gg-payroll-yo-loading"
      );

      if (action) {
        action.textContent = oldText;
      }
    }
  }

  // ================================================
  // RENDERIZAR NOTIFICACIONES
  // ================================================

  function render() {
    const holder = ensureHolder();
    const list = $("yoNotificationsList");

    if (!holder || !list) return;

    holder.replaceChildren();

    if (receipts.length === 0) {
      setBadge();
      return;
    }

    list.querySelector(
      ".yo-notifications-empty"
    )?.remove();

    const head =
      document.createElement("p");

    head.className =
      "gg-payroll-yo-title";

    head.textContent =
      "RECIBOS DE NOMINA";

    holder.append(head);

    for (const receipt of receipts) {
      const button =
        document.createElement("button");

      button.type = "button";
      button.className =
        "gg-payroll-yo-item";

      button.setAttribute(
        "aria-label",
        "Abrir recibo: " +
        (receipt.title || "Nomina")
      );

      if (!receipt.read_at) {
        button.classList.add("unread");
      }

      const title =
        document.createElement("strong");

      title.textContent =
        receipt.title ||
        "Recibo de nomina";

      const detail =
        document.createElement("small");

      detail.textContent =
        (receipt.file_name || "Recibo.pdf") +
        " · " +
        labelDate(receipt.sent_at);

      const action =
        document.createElement("span");

      action.className =
        "gg-payroll-yo-action";

      action.textContent =
        receipt.read_at
          ? "Ver PDF nuevamente ↗"
          : "● Nuevo · Abrir PDF ↗";

      button.append(
        title,
        detail,
        action
      );

      button.addEventListener(
        "click",
        event => {
          event.preventDefault();
          event.stopPropagation();

          void openReceipt(
            receipt,
            button
          );
        }
      );

      holder.append(button);
    }

    setBadge();
  }

  // ================================================
  // ACTUALIZAR RECIBOS
  // ================================================

  async function refresh() {
    if (
      loading ||
      !token() ||
      !db
    ) {
      return;
    }

    loading = true;

    try {
      const {data, error} =
        await db.rpc(
          "gg_payroll_yo_list",
          {
            p_session_token: token()
          }
        );

      if (error) throw error;

      receipts =
        Array.isArray(data) ? data : [];

      render();

    } catch (error) {
      showNotice(
        "No se pudieron actualizar los recibos. " +
        (error.message || "")
      );

      console.warn(
        "[NOMINA YO]",
        error?.message
      );

    } finally {
      loading = false;
    }
  }

  // ================================================
  // INICIAR
  // ================================================

  function start() {
    if (
      !$("yoNotificationsList") ||
      !$("yoNotificationButton")
    ) {
      return;
    }

    $("yoNotificationButton")
      .addEventListener(
        "click",
        () => {
          window.setTimeout(
            refresh,
            50
          );
        }
      );

    window.setTimeout(
      refresh,
      850
    );

    window.setInterval(
      () => {
        if (!document.hidden) {
          void refresh();
        }
      },
      90000
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      {once:true}
    );
  } else {
    start();
  }

})();
`.trim();

// ===================================================
// CSS DE LA BANDEJA
// ===================================================

const css = String.raw`
/* GG_YO_PAYROLL_CSS_FIX_V2 */

/*
  El encabezado de YO tiene una animacion
  transform que crea un stacking context.

  Subir solo el popup NO es suficiente.
  Debemos subir el encabezado completo.
*/

.yo-shell .yo-header {
  position: relative !important;
  z-index: 2100 !important;
  overflow: visible !important;
}

.yo-shell .yo-content,
.yo-shell .yo-footer,
.yo-shell .yo-loading {
  position: relative;
  z-index: 1;
}

.yo-shell .yo-notification-wrap {
  position: relative;
  z-index: 2200;
}

/* PANEL SOLIDO Y SOBRE EL CONTENIDO */

.yo-shell #yoNotificationsPanel {
  z-index: 2300 !important;

  width:
    min(370px, calc(100vw - 28px))
    !important;

  max-height: min(72vh, 650px);

  display: flex;
  flex-direction: column;

  overflow: hidden;

  border:
    1px solid #38516a !important;

  background:
    #101c2b !important;

  color:
    #eff7ff !important;

  backdrop-filter:
    none !important;

  -webkit-backdrop-filter:
    none !important;

  box-shadow:
    0 26px 76px #000a,
    0 0 0 1px #ffffff0a !important;

  pointer-events: none;
}

.yo-shell #yoNotificationsPanel.open {
  pointer-events: auto !important;
}

/* SCROLL INTERNO */

.yo-shell #yoNotificationsList {
  min-height: 0;

  max-height: min(62vh, 540px);

  overflow-x: hidden;
  overflow-y: auto;

  overscroll-behavior: contain;

  scrollbar-width: thin;

  scrollbar-color:
    #45647d #101c2b;

  background:
    #101c2b !important;
}

.yo-shell #yoNotificationsPanel
.yo-notification-header {
  background:
    #101c2b !important;

  flex-shrink: 0;
}

/* TARJETAS DE NOMINA */

.gg-payroll-yo {
  padding: 8px 10px 12px;
}

.gg-payroll-yo-title {
  margin: 7px 5px 12px;

  color: #94dfff;

  font:
    800 10px/1.5
    Inter, system-ui, sans-serif;

  letter-spacing: .14em;
}

.gg-payroll-yo-item {
  position: relative;

  display: block;
  width: 100%;

  margin: 8px 0;
  padding: 13px 14px;

  text-align: left;

  color: #eaf6ff;
  background: #1b2b3d;

  border:
    1px solid #38516a;

  border-radius: 14px;

  cursor: pointer;

  pointer-events: auto;
  touch-action: manipulation;

  transition:
    transform .2s,
    border-color .2s,
    background .2s;
}

.gg-payroll-yo-item:hover,
.gg-payroll-yo-item:focus-visible {
  transform: translateY(-1px);

  border-color: #71caff;
  background: #233b50;

  outline: none;
}

.gg-payroll-yo-item.unread {
  border-left:
    3px solid #54c7ff;
}

.gg-payroll-yo-item strong,
.gg-payroll-yo-item small,
.gg-payroll-yo-item span {
  display: block;

  line-height: 1.5;

  overflow-wrap: anywhere;
}

.gg-payroll-yo-item strong {
  font-size: 12px;
}

.gg-payroll-yo-item small {
  margin-top: 5px;

  font-size: 11px;
  color: #adc0d4;
}

.gg-payroll-yo-item
.gg-payroll-yo-action {
  margin-top: 10px;

  color: #7cd7ff;

  font-size: 11px;
  font-weight: 750;
}

.gg-payroll-yo-item:disabled {
  opacity: .7;
  cursor: progress;
}

/* ERRORES VISIBLES */

.gg-payroll-yo-feedback {
  margin: 9px 4px;
  padding: 12px;

  border:
    1px solid #af6168;

  border-radius: 12px;

  background: #371c26;
  color: #ffe0e0;

  font-size: 12px;
  line-height: 1.5;

  white-space: pre-wrap;
}

.gg-payroll-yo-feedback[hidden] {
  display: none !important;
}

/* RESPONSIVE */

@media (max-width: 600px) {
  .yo-shell #yoNotificationsPanel {
    width:
      min(350px, calc(100vw - 24px))
      !important;

    right: 0 !important;
  }
}

/* ACCESIBILIDAD */

@media (prefers-reduced-motion: reduce) {
  .gg-payroll-yo-item {
    transition: none;
  }
}
`.trim();

// ===================================================
// VALIDAR PROYECTO ORIGINAL
// ===================================================

const yoHtml = original("yo.html");

const oldJs = original(
  "js/gg-payroll-yo.js"
);

if (
  !yoHtml.includes('id="yoNotificationsPanel"') ||
  !yoHtml.includes('id="yoNotificationsList"') ||
  !yoHtml.includes('src="js/gg-payroll-yo.js')
) {
  throw new Error(
    "No coincide la estructura de YO. " +
    "Se cancela sin modificar nada."
  );
}

if (
  !oldJs.includes("gg_payroll_yo_list") ||
  !oldJs.includes("gg-payroll-download")
) {
  throw new Error(
    "El script de Nomina no coincide. " +
    "No se reemplazara automaticamente."
  );
}

// ===================================================
// HOJA CSS NUEVA
// ===================================================

const cssName =
  "css/gg-payroll-yo-fix.css";

if (fs.existsSync(dest(cssName))) {
  const currentCss = original(cssName);

  if (
    currentCss.trimEnd() !==
    css.trimEnd()
  ) {
    throw new Error(
      cssName +
      " ya existe con cambios propios. " +
      "No lo sobreescribo."
    );
  }
}

// ===================================================
// CONECTAR CSS Y ACTUALIZAR CACHÉ
// ===================================================

const cssTag =
  '<link rel="stylesheet" ' +
  'href="css/gg-payroll-yo-fix.css?v=2">';

let updatedHtml = yoHtml;

if (!updatedHtml.includes(cssTag)) {
  if (!updatedHtml.includes("</head>")) {
    throw new Error(
      "Falta </head> en YO."
    );
  }

  updatedHtml = updatedHtml.replace(
    "</head>",
    "  <!-- GG_YO_PAYROLL_FIX_V2 -->\n" +
    "  " + cssTag + "\n</head>"
  );
}

updatedHtml = updatedHtml.replace(
  /src="js\/gg-payroll-yo\.js(?:\?v=\d+)?"/g,
  'src="js/gg-payroll-yo.js?v=2"'
);

// ===================================================
// VALIDACIONES ANTES DE ESCRIBIR
// ===================================================

new vm.Script(
  payrollYo,
  {filename:"js/gg-payroll-yo.js"}
);

if (
  !updatedHtml.includes(
    "gg-payroll-yo.js?v=2"
  )
) {
  throw new Error(
    "No se actualizo el script de YO."
  );
}

changes.set(
  "js/gg-payroll-yo.js",
  payrollYo + "\n"
);

changes.set(
  cssName,
  css + "\n"
);

changes.set(
  "yo.html",
  updatedHtml
);

// ===================================================
// RECUPERACION EN MEMORIA SIN .BAK
// ===================================================

for (const name of changes.keys()) {
  previous.set(
    name,
    fs.existsSync(dest(name))
      ? fs.readFileSync(dest(name))
      : null
  );
}

const committed = [];

try {
  for (const [name, content] of changes) {
    fs.mkdirSync(
      path.dirname(dest(name)),
      {recursive:true}
    );

    committed.push(name);

    fs.writeFileSync(
      dest(name),
      content,
      "utf8"
    );
  }
} catch (error) {
  for (const name of committed.reverse()) {
    try {
      const old = previous.get(name);

      if (old === null) {
        fs.rmSync(
          dest(name),
          {force:true}
        );
      } else {
        fs.writeFileSync(
          dest(name),
          old
        );
      }
    } catch (restoreError) {
      console.error(
        "No se pudo restaurar " + name,
        restoreError.message
      );
    }
  }

  throw error;
}

// ===================================================
// FINAL
// ===================================================

console.log(
  "\n✓ Fix de YO / Nomina instalado."
);

console.log(
  "✓ Bandeja opaca, sobre contenido, con scroll."
);

console.log(
  "✓ Apertura de PDF desde clic y errores visibles."
);

console.log(
  "✓ Solo 3 archivos afectados; sin .bak ni backups."
);

console.log(
  "\nReinicia Vite y recarga YO con Ctrl+F5."
);

console.log(
  "Si aparece 401/404 revisa el despliegue " +
  "de gg-payroll-download."
);
