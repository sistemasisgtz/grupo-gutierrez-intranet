
"use strict";

/*
 GRUPO GUTIÉRREZ — SISTEMAS V1
 Ejecutar: node instalar-gg-sistemas.cjs
 Requiere: SQL de Sistemas instalado en Supabase.
 Sin respaldos .bak.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = process.cwd();
const outputs = new Map();
const MARK = "GG_SISTEMAS_INSTALADO_V1";

const modules = {
  ventas: "ventas.html",
  "recursos-humanos": "recursos-humanos.html",
  almacen: "almacen.html",
  "solicitudes-pago": "solicitudes-pago.html",
  "control-financiero": "control-financiero.html",
  "xml-facturas": "xml-facturas.html",
  "mi-perfil-notificaciones": "mi-perfil-notificaciones.html"
};

function read(name) {
  const target = path.join(ROOT, name);
  if (!fs.existsSync(target)) {
    throw Error("Falta el archivo: " + name);
  }
  return fs.readFileSync(target, "utf8");
}

function put(name, source) {
  outputs.set(name, source);
}

function inject(source, anchor, content) {
  if (source.includes(content.trim())) return source;
  if (!source.includes(anchor)) {
    throw Error("No se encontró: " + anchor);
  }
  return source.replace(anchor, content + "\n" + anchor);
}

/* ===================================================
   1. SISTEMA CENTRAL · NUEVA TARJETA
=================================================== */

let home = read("sistema.html");

if (!home.includes(MARK)) {
  const card = String.raw`
  <!-- GG_SISTEMAS_INSTALADO_V1 -->
  <div class="module-shell slot-sistemas"
       style="--delay:.52s">
    <button class="module-card card-sistemas"
            data-module="sistemas"
            type="button">
      <span class="card-top">
        <span class="card-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4
                     M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>
          </svg>
        </span>
        <span class="card-serial">09 / 09</span>
      </span>
      <span class="card-content">
        <span class="card-eyebrow">
          ADMINISTRACIÓN CENTRAL
        </span>
        <strong class="card-title">sistemas</strong>
        <span class="card-description">
          Accesos y flujos de permisos.
        </span>
      </span>
      <span class="card-footer">
        <span class="card-meta">ADMINISTRACIÓN</span>
        <span class="card-arrow">↗</span>
      </span>
    </button>
  </div>`;

  const grid = home.search(
    /<div\s+class=["']module-grid["']\s*>/i
  );

  if (grid < 0) {
    throw Error("No encontré .module-grid");
  }

  // Localizar el cierre real del contenedor de módulos.
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = grid;

  let depth = 0;
  let closing = -1;
  let token;

  while ((token = tags.exec(home))) {
    if (/^<div\b/i.test(token[0])) depth++;
    else depth--;

    if (depth === 0) {
      closing = token.index;
      break;
    }
  }

  if (closing < 0) {
    throw Error("No se encontró el cierre de module-grid.");
  }

  home =
    home.slice(0, closing) +
    card + "\n" +
    home.slice(closing);

  home = home.replace(
    /\b08 módulos\b/g,
    "09 módulos"
  );
}

home = inject(
  home,
  "</head>",
  '<link rel="stylesheet" href="css/gg-sistemas.css">'
);

home = inject(
  home,
  "</body>",
  '<script src="js/gg-sistemas-nav.js"></script>'
);

put("sistema.html", home);

/* ===================================================
   2. REDISTRIBUCIÓN DE LAS NUEVE TARJETAS
=================================================== */

const css = String.raw`
/* GG SISTEMAS · ORBITAL 9 */

body .workspace {
  min-height: 930px;
}

body .workspace .module-shell {
  position: absolute !important;
  left: var(--gx) !important;
  top: var(--gy) !important;
  right: auto !important;
  bottom: auto !important;
  width: clamp(175px,17vw,228px) !important;
  height: 130px !important;
  min-height: 0 !important;
  transform: translate(-50%,-50%) !important;
  pointer-events: auto;
}

body .workspace .module-card {
  height: 100%;
  min-width: 0;
  padding: 15px 17px;
}

body .workspace .card-title {
  font-size: clamp(13px,1.3vw,18px) !important;
  line-height: 1.17 !important;
  overflow-wrap: anywhere;
}

body .workspace .slot-sales {
  --gx: 23%; --gy: 27%;
}
body .workspace .slot-people {
  --gx: 50%; --gy: 12%;
}
body .workspace .slot-warehouse {
  --gx: 77%; --gy: 27%;
}
body .workspace .slot-payments {
  --gx: 88%; --gy: 48%;
}
body .workspace .slot-finance {
  --gx: 76%; --gy: 69%;
}
body .workspace .slot-collections {
  --gx: 62%; --gy: 87%;
}
body .workspace .slot-profile-notif {
  --gx: 38%; --gy: 87%;
}
body .workspace .slot-xml {
  --gx: 12%; --gy: 48%;
}
body .workspace .slot-sistemas {
  --gx: 24%; --gy: 69%;
}

body .slot-sistemas .module-card {
  border-color: #83d9ed55;
  background:
    linear-gradient(135deg,#83d9ed14,#ffffff05),
    #171b20ed;
}

body .slot-sistemas .card-icon {
  color: #83d9ed;
}

/* Bloqueo mientras se verifica acceso */
html.gg-gate-pending body {
  visibility: hidden !important;
}

/* Pantalla de acceso denegado */
.gg-denied-page {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  color: #f7f7f5;
  font-family: "DM Sans",sans-serif;
  background:
    radial-gradient(ellipse at center,#222831,#090a0d 75%);
}

.gg-denied-content,
.gg-access-panel {
  width: min(460px,calc(100vw - 32px));
  text-align: center;
  border: 1px solid #ffffff24;
  background: #1b2026f2;
  border-radius: 24px;
  padding: 36px;
  box-shadow: 0 25px 90px #0008;
}

.gg-denied-content h1,
.gg-access-panel h2 {
  font-family: Manrope,sans-serif;
  letter-spacing: -.06em;
  font-size: 32px;
}

.gg-denied-content p,
.gg-access-panel p {
  color: #acb8c4;
  line-height: 1.6;
}

.gg-denied-content button,
.gg-access-panel button {
  border: 0;
  border-radius: 12px;
  padding: 13px 18px;
  background: #f28b43;
  color: #101318;
  font: 700 13px "DM Sans",sans-serif;
  cursor: pointer;
}

.gg-denied-content button:disabled,
.gg-access-panel button:disabled {
  opacity: .55;
}

.gg-denied-content a,
.gg-access-panel a {
  display: block;
  margin-top: 18px;
  color: #b8cad8;
  text-decoration: none;
}

.gg-denied-content small,
.gg-access-panel small {
  display: block;
  color: #83d9ed;
  margin-top: 15px;
  line-height: 1.5;
}

.gg-access-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: grid;
  place-items: center;
  padding: 16px;
  backdrop-filter: blur(18px);
  background: #07080cdc;
}

.gg-access-panel .gg-close {
  background: #ffffff18;
  color: #eee;
  margin-top: 10px;
}

.gg-sistemas-approval {
  border: 1px solid #83d9ed66 !important;
}

/* Responsivo */
@media(max-width:1150px) {
  body .workspace {
    min-height: 0;
    padding-top: 300px;
  }

  body .workspace .hero {
    position: absolute !important;
    top: 140px !important;
    left: 50% !important;
    width: min(500px,90%) !important;
    transform: translateX(-50%) !important;
  }

  body .workspace .gg-orbit {
    inset: 0 0 auto !important;
    height: 280px;
    opacity: .65;
  }

  body .workspace .module-grid {
    position: relative !important;
    inset: auto !important;
    display: grid !important;
    grid-template-columns:
      repeat(3,minmax(0,1fr)) !important;
    gap: 14px !important;
  }

  body .workspace .module-shell {
    position: relative !important;
    left: auto !important;
    top: auto !important;
    right: auto !important;
    bottom: auto !important;
    transform: none !important;
    width: 100% !important;
    height: 132px !important;
  }
}

@media(max-width:700px) {
  body .workspace {
    padding-top: 280px;
  }

  body .workspace .module-grid {
    grid-template-columns:
      repeat(2,minmax(0,1fr)) !important;
  }

  body .workspace .card-title {
    font-size: 14px !important;
  }
}

@media(max-width:420px) {
  body .workspace .module-grid {
    grid-template-columns: 1fr !important;
  }

  body .workspace .module-shell {
    height: 112px !important;
  }
}
`;

put("css/gg-sistemas.css", css);

/* ===================================================
   3. NAVEGACIÓN Y SOLICITUDES
=================================================== */

const nav = String.raw`
(() => {
  "use strict";

  const db = window.ggSupabase;

  const paths = {
    ventas: "ventas.html",
    "recursos-humanos": "recursos-humanos.html",
    almacen: "almacen.html",
    "solicitudes-pago": "solicitudes-pago.html",
    "control-financiero": "control-financiero.html",
    "xml-facturas": "xml-facturas.html",
    "mi-perfil-notificaciones":
      "mi-perfil-notificaciones.html",
    sistemas: "sistemas.html"
  };

  let busy = false;

  function denied(module, message, canRequest) {
    document.getElementById("ggAccessOverlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "ggAccessOverlay";
    overlay.className = "gg-access-overlay";

    const panel = document.createElement("section");
    panel.className = "gg-access-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");

    const title = document.createElement("h2");
    title.textContent = "Acceso restringido";

    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    const status = document.createElement("small");
    status.setAttribute("role", "status");

    panel.append(title,paragraph);

    if (canRequest) {
      const ask = document.createElement("button");
      ask.type = "button";
      ask.textContent = "Solicitar acceso a Sistemas";

      ask.onclick = async () => {
        ask.disabled = true;

        const {error} = await db.rpc(
          "gg_sistemas_request_access",
          {p_module: module}
        );

        status.textContent = error
          ? error.message
          : "Solicitud enviada a Sistemas.";

        if (error) ask.disabled = false;
      };

      panel.append(ask);
    }

    const close = document.createElement("button");
    close.type = "button";
    close.className = "gg-close";
    close.textContent = "Cerrar";
    close.onclick = () => overlay.remove();

    panel.append(close,status);
    overlay.append(panel);
    document.body.append(overlay);
    close.focus();
  }

  document.addEventListener("click", async event => {
    const button = event.target.closest("[data-module]");
    if (!button) return;

    const module = button.dataset.module;

    // Cobranza mantiene su comportamiento original.
    if (!paths[module]) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (busy) return;
    busy = true;

    try {
      if (!db) throw Error("Supabase no disponible.");

      const {data:user,error:userError} =
        await db.auth.getUser();

      if (userError || !user?.user) {
        throw Error("Inicia sesión nuevamente.");
      }

      const {data,error} = await db.rpc(
        "gg_module_access",
        {p_module:module}
      );

      if (error) throw error;

      if (data !== true) {
        denied(
          module,
          module === "sistemas"
            ? "Solo sistemas@isgtz.com puede entrar."
            : "No tienes acceso a este módulo. Solicita autorización a Sistemas.",
          module !== "sistemas"
        );
        return;
      }

      window.location.assign(paths[module]);

    } catch(error) {
      denied(
        module,
        "No se pudo verificar el permiso: " +
          error.message,
        false
      );
    } finally {
      busy = false;
    }
  },true);
})();
`;

put("js/gg-sistemas-nav.js",nav);

/* ===================================================
   4. PROTECCIÓN DE PÁGINAS DIRECTAS
=================================================== */

const guard = String.raw`
(() => {
  "use strict";

  const key = document.currentScript?.dataset.ggModule;
  const db = window.ggSupabase;

  const routes = {
    ventas:"Ventas",
    "recursos-humanos":"Recursos Humanos",
    almacen:"Almacén",
    "solicitudes-pago":"Solicitudes de Pago",
    "control-financiero":"Control Financiero",
    "xml-facturas":"XML y Facturas",
    "mi-perfil-notificaciones":
      "Mi Perfil y Notificaciones"
  };

  function denied(message, canAsk) {
    document.body.replaceChildren();
    document.body.className = "gg-denied-page";

    document.documentElement.classList.remove(
      "gg-gate-pending"
    );

    const main = document.createElement("main");
    main.className = "gg-denied-content";

    const title = document.createElement("h1");
    title.textContent = "Acceso restringido";

    const text = document.createElement("p");
    text.textContent = message;

    const status = document.createElement("small");
    status.setAttribute("role","status");

    main.append(title,text);

    if (canAsk) {
      const button = document.createElement("button");
      button.textContent = "Solicitar acceso a Sistemas";

      button.onclick = async () => {
        button.disabled = true;

        const {error} = await db.rpc(
          "gg_sistemas_request_access",
          {p_module:key}
        );

        status.textContent = error
          ? error.message
          : "Solicitud enviada correctamente.";

        if (error) button.disabled = false;
      };

      main.append(button);
    }

    const back = document.createElement("a");
    back.href = "sistema.html";
    back.textContent = "← Volver a los módulos";

    main.append(back,status);
    document.body.append(main);
  }

  async function start() {
    try {
      if (!db) throw Error("Supabase no disponible.");

      const {data:user,error:userError} =
        await db.auth.getUser();

      if (userError || !user?.user) {
        location.replace("index.html");
        return;
      }

      const {data,error} = await db.rpc(
        "gg_module_access",
        {p_module:key}
      );

      if (error) throw error;

      if (data !== true) {
        denied(
          "No tienes acceso a " +
          (routes[key] || "este módulo") +
          ". Solicita autorización a Sistemas.",
          true
        );
        return;
      }

      // Ejecutar scripts originales solamente
      // después de comprobar el acceso.
      const protectedScripts = [
        ...document.querySelectorAll(
          'script[type="text/gg-protected"]'
        )
      ];

      for (const original of protectedScripts) {
        await new Promise((resolve,reject) => {
          const script = document.createElement("script");
          const src = original.getAttribute("src");

          if (src) {
            script.src = src;
            script.async = false;
            script.onload = resolve;
            script.onerror = () =>
              reject(Error("No cargó: " + src));
          } else {
            script.textContent = original.textContent;
          }

          document.body.append(script);
          if (!src) resolve();
        });
      }

      document.documentElement.classList.remove(
        "gg-gate-pending"
      );

      // Compatibilidad con los inicializadores
      // existentes de los módulos.
      document.dispatchEvent(
        new Event("DOMContentLoaded",{bubbles:true})
      );

    } catch(error) {
      console.error("[GG Acceso]",error);
      denied(
        "No fue posible verificar los permisos: " +
        error.message,
        false
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",start,{once:true}
    );
  } else {
    start();
  }
})();
`;

put("js/gg-module-guard.js",guard);

/* ===================================================
   5. APLICAR PROTECCIÓN A CADA MÓDULO
=================================================== */

for (const [key,filename] of Object.entries(modules)) {
  let page = read(filename);

  if (page.includes('data-gg-module="' + key + '"')) {
    continue;
  }

  let clientFound = false;

  page = page.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
    (full,attrs,body) => {
      const src = attrs.match(
        /\bsrc\s*=\s*["']([^"']+)["']/i
      )?.[1] || "";

      if (src === "js/supabase-client.js") {
        clientFound = true;
        return full +
          '\n<script src="js/gg-module-guard.js" ' +
          'data-gg-module="' + key + '"></script>';
      }

      if (!clientFound) return full;

      // No alterar bloques de datos JSON.
      if (/type\s*=\s*["'](?:application\/json|importmap)["']/i
          .test(attrs)) return full;

      const clean = attrs
        .replace(/\s+type\s*=\s*["'][^"']*["']/i,"")
        .replace(/\s+defer(?=\s|$)/i,"");

      return '<script type="text/gg-protected"' +
        clean + ">" + body + "</script>";
    }
  );

  if (!clientFound) {
    throw Error(
      "No se encontró Supabase en " + filename
    );
  }

  page = page.replace(
    /<html\b([^>]*)>/i,
    (full,attrs) => {
      if (/class\s*=/i.test(attrs)) {
        return full.replace(
          /class=(["'])(.*?)\1/i,
          (match,q,value) =>
            'class=' + q +
            value + ' gg-gate-pending' + q
        );
      }
      return '<html' + attrs +
        ' class="gg-gate-pending">';
    }
  );

  page = inject(
    page,
    "</head>",
    '<link rel="stylesheet" href="css/gg-sistemas.css">'
  );

  put(filename,page);
}

/* ===================================================
   6. SISTEMAS · PANTALLA PRINCIPAL
=================================================== */

const sistemasHTML = String.raw`
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
<title>Sistemas · Grupo Gutiérrez</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;600;700;800&display=swap"
      rel="stylesheet">
<link rel="stylesheet" href="css/sistemas-panel.css">
</head>
<body>
<header class="sys-top">
  <a href="sistema.html" class="sys-brand">
    GG<span>✳</span> <small>GRUPO GUTIÉRREZ</small>
  </a>
  <a href="sistema.html">← Volver a módulos</a>
</header>

<main class="sys-wrap">
  <section class="sys-hero">
    <small>ADMINISTRACIÓN CENTRAL · GRUPO GUTIÉRREZ</small>
    <h1>Sistemas<span>.</span></h1>
    <p>Accesos y jerarquías desde un solo lugar.</p>
  </section>

  <nav class="sys-tabs">
    <button type="button">Flujos permisos</button>
  </nav>

  <section class="sys-panel">
    <div class="sys-controls">
      <label>
        MÓDULO
        <select id="sysModule">
          <option value="almacen">Almacén</option>
          <option value="recursos-humanos">
            Recursos Humanos
          </option>
          <option value="solicitudes-pago">
            Solicitudes de Pago
          </option>
          <option value="ventas">Ventas</option>
          <option value="control-financiero">
            Control Financiero
          </option>
          <option value="xml-facturas">
            XML y Facturas
          </option>
          <option value="mi-perfil-notificaciones">
            Mi Perfil y Notificaciones
          </option>
        </select>
      </label>

      <label>
        BUSCAR CORREO
        <input id="sysSearch"
               type="search"
               placeholder="Buscar usuarios...">
      </label>

      <button id="sysSave" type="button" disabled>
        Guardar permisos
      </button>
    </div>

    <p class="sys-note">
      Acceso permite entrar al módulo. Padre,
      Sub-Padre e Hijo se guardan para los flujos
      futuros y todavía no otorgan privilegios.
    </p>

    <div id="sysRoles" class="sys-roles"></div>

    <p id="sysMessage" role="status">
      Consultando Supabase...
    </p>
  </section>

  <section class="sys-panel">
    <div class="sys-heading">
      <h2>Autorizaciones pendientes</h2>
      <button id="sysRefresh" type="button">
        Actualizar ↻
      </button>
    </div>
    <div id="sysRequests"></div>
  </section>
</main>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
<script src="js/sistemas-panel.js"></script>
</body>
</html>`;

put("sistemas.html",sistemasHTML);

/* ===================================================
   7. SISTEMAS · LÓGICA DE LA INTERFAZ
=================================================== */

const sistemasJS = String.raw`
(() => {
  "use strict";

  const db = window.ggSupabase;
  const $ = id => document.getElementById(id);

  const levels = [
    ["acceso","Acceso"],
    ["padre","Padres"],
    ["subpadre","Sub-Padres"],
    ["hijo","Hijos"]
  ];

  let snapshot = {users:[],roles:[],requests:[]};
  let edited = false;
  let loaded = false;
  let active = $("sysModule").value;

  function note(message) {
    $("sysMessage").textContent = message;
  }

  function selections(module,role) {
    return new Set(
      snapshot.roles
        .filter(r =>
          r.module === module && r.role === role
        )
        .map(r => r.user_id)
    );
  }

  function render() {
    if (!loaded) return;

    const module = $("sysModule").value;
    const search = $("sysSearch").value
      .trim().toLowerCase();

    const users = snapshot.users.filter(
      u => u.email?.toLowerCase().includes(search)
    );

    const root = $("sysRoles");
    root.replaceChildren();

    for (const [role,title] of levels) {
      const panel = document.createElement("section");
      panel.className = "sys-role";

      const heading = document.createElement("h3");
      heading.textContent = title;

      const count = document.createElement("small");
      const chosen = selections(module,role);

      count.textContent =
        chosen.size + " seleccionados";

      panel.append(heading,count);

      const list = document.createElement("div");
      list.className = "sys-users";

      for (const user of users) {
        const row = document.createElement("label");
        row.className = "sys-user";

        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = chosen.has(user.id);

        check.onchange = () => {
          edited = true;

          snapshot.roles = snapshot.roles.filter(
            r => !(
              r.module === module &&
              r.role === role &&
              r.user_id === user.id
            )
          );

          if (check.checked) {
            snapshot.roles.push({
              module,
              role,
              user_id:user.id
            });
          }

          count.textContent =
            selections(module,role).size +
            " seleccionados";

          note("Cambios sin guardar.");
        };

        const email = document.createElement("span");
        email.textContent = user.email;

        row.append(check,email);
        list.append(row);
      }

      panel.append(list);
      root.append(panel);
    }
  }

  function renderRequests() {
    const root = $("sysRequests");
    root.replaceChildren();

    if (!snapshot.requests.length) {
      const empty = document.createElement("p");
      empty.textContent =
        "No hay solicitudes pendientes.";
      root.append(empty);
      return;
    }

    for (const request of snapshot.requests) {
      const row = document.createElement("article");
      row.className = "sys-request";

      const detail = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = request.email;

      const meta = document.createElement("small");
      meta.textContent =
        request.module + " · " +
        new Date(request.requested_at)
          .toLocaleString("es-MX");

      detail.append(name,meta);

      const actions = document.createElement("div");

      for (const [title,decision] of [
        ["Aprobar","approved"],
        ["Rechazar","rejected"]
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = title;

        button.onclick = async () => {
          if (!confirm(
            title + " acceso de " +
            request.email + " a " +
            request.module + "?"
          )) return;

          actions.querySelectorAll("button")
            .forEach(b => b.disabled = true);

          const {error} = await db.rpc(
            "gg_sistemas_resolve_request",
            {
              p_request_id:request.id,
              p_decision:decision
            }
          );

          if (error) {
            note(error.message);
            actions.querySelectorAll("button")
              .forEach(b => b.disabled = false);
            return;
          }

          if (edited) {
            note("Autorización resuelta. Guarda o descarta tus cambios antes de actualizar la matriz.");
            row.remove();
            snapshot.requests = snapshot.requests.filter(
              r => r.id !== request.id
            );
          } else {
            await load();
          }
        };

        actions.append(button);
      }

      row.append(detail,actions);
      root.append(row);
    }
  }

  async function load() {
    note("Consultando permisos...");

    const {data:user,error:userError} =
      await db.auth.getUser();

    if (userError || !user?.user) {
      location.replace("index.html");
      return;
    }

    const {data,error} = await db.rpc(
      "gg_sistemas_snapshot"
    );

    if (error) {
      document.querySelectorAll(".sys-panel")
        .forEach(p => p.hidden = true);

      document.querySelector(".sys-hero p")
        .textContent = "Acceso denegado: " +
        error.message;
      return;
    }

    snapshot = {
      users:data.users || [],
      roles:data.roles || [],
      requests:data.requests || []
    };

    loaded = true;
    edited = false;
    $("sysSave").disabled = false;

    render();
    renderRequests();
    note("Permisos sincronizados.");
  }

  $("sysModule").onchange = () => {
    const next = $("sysModule").value;

    if (edited) {
      if (!confirm("¿Descartar cambios sin guardar?")) {
        $("sysModule").value = active;
        return;
      }

      active = next;
      load();
      return;
    }

    active = next;
    render();
  };

  $("sysSearch").oninput = render;

  $("sysSave").onclick = async () => {
    const module = $("sysModule").value;
    const payload = {};

    for (const [role] of levels) {
      payload[role] = [
        ...selections(module,role)
      ];
    }

    $("sysSave").disabled = true;

    const {error} = await db.rpc(
      "gg_sistemas_save_roles",
      {
        p_module:module,
        p_roles:payload
      }
    );

    $("sysSave").disabled = false;

    if (error) {
      note("Error: " + error.message);
      return;
    }

    edited = false;
    note("Permisos guardados correctamente.");
  };

  $("sysRefresh").onclick = () => {
    if (edited &&
        !confirm("¿Descartar cambios sin guardar?")) {
      return;
    }
    load();
  };

  if (!db) {
    note("Cliente Supabase no disponible.");
    return;
  }

  load().catch(e => note(e.message));
})();
`;

put("js/sistemas-panel.js",sistemasJS);

/* ===================================================
   8. SISTEMAS · ESTILO VISUAL
=================================================== */

const sistemasCSS = String.raw`
* {box-sizing:border-box}

body {
  margin:0;
  min-height:100vh;
  color:#f6f6f3;
  background:
    radial-gradient(ellipse at 18% 15%,#83d9ed12,transparent 42%),
    radial-gradient(ellipse at 85% 85%,#f28b4310,transparent 45%),
    #090b0e;
  font-family:"DM Sans",sans-serif;
}

button,input,select {font:inherit}
a {color:inherit;text-decoration:none}

.sys-top,
.sys-wrap {
  width:min(1300px,calc(100% - 48px));
  margin:auto;
}

.sys-top {
  padding:27px 0;
  display:flex;
  align-items:center;
  justify-content:space-between;
  border-bottom:1px solid #ffffff20;
}

.sys-top>a:last-child {
  color:#aebac5;
  font-size:12px;
}

.sys-brand {
  font:800 24px Manrope,sans-serif;
  letter-spacing:-.06em;
}

.sys-brand span,
.sys-hero h1 span {color:#f28b43}

.sys-brand small {
  font:500 10px "DM Sans",sans-serif;
  color:#aab6c4;
  letter-spacing:.13em;
  margin-left:13px;
}

.sys-hero {padding:57px 0 38px}

.sys-hero small {
  letter-spacing:.2em;
  color:#83d9ed;
  font-size:10px;
}

.sys-hero h1 {
  margin:10px 0 12px;
  font:800 clamp(48px,7vw,84px)/1.05
    Manrope,sans-serif;
  letter-spacing:-.07em;
}

.sys-hero p {color:#aab5c0}

.sys-tabs {
  border-bottom:1px solid #ffffff25;
  margin-bottom:24px;
}

.sys-tabs button {
  background:none;
  border:0;
  color:white;
  border-bottom:2px solid #f28b43;
  padding:16px 4px;
  font-weight:700;
}

.sys-panel {
  border:1px solid #ffffff20;
  border-radius:22px;
  padding:26px;
  margin-bottom:24px;
  background:linear-gradient(
    135deg,#ffffff0d,#ffffff04
  );
  backdrop-filter:blur(18px);
}

.sys-controls {
  display:grid;
  grid-template-columns:1fr 1fr auto;
  align-items:end;
  gap:16px;
}

.sys-controls label {
  display:grid;
  gap:9px;
  font-size:10px;
  letter-spacing:.15em;
  color:#b1c0cd;
}

.sys-controls input,
.sys-controls select {
  padding:13px;
  border:1px solid #ffffff28;
  border-radius:11px;
  background:#171b20;
  color:white;
  width:100%;
}

.sys-controls button {
  border:0;
  border-radius:11px;
  background:#f28b43;
  color:#14171a;
  font-weight:700;
  padding:14px 22px;
}

.sys-controls button:disabled {
  opacity:.5;
}

.sys-note {
  color:#9dabb8;
  font-size:12px;
  line-height:1.6;
  margin:23px 0;
}

.sys-roles {
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:12px;
}

.sys-role {
  min-width:0;
  border:1px solid #ffffff1d;
  border-radius:17px;
  padding:17px;
  background:#15191edb;
}

.sys-role h3 {
  margin:0 0 5px;
  font-size:18px;
}

.sys-role>small {
  color:#83d9ed;
  font-size:11px;
}

.sys-users {
  max-height:390px;
  overflow:auto;
  margin-top:13px;
}

.sys-user {
  display:flex;
  align-items:center;
  gap:9px;
  padding:10px 3px;
  border-bottom:1px solid #ffffff0d;
  cursor:pointer;
  font-size:11px;
  overflow-wrap:anywhere;
}

.sys-user input {
  flex:none;
  accent-color:#83d9ed;
}

#sysMessage {
  margin:20px 0 0;
  color:#83d9ed;
  font-size:12px;
}

.sys-heading,
.sys-request {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
}

.sys-heading h2 {font-size:21px}

.sys-heading button,
.sys-request button {
  background:#ffffff0d;
  border:1px solid #ffffff2a;
  border-radius:9px;
  padding:10px 13px;
  color:white;
  cursor:pointer;
}

.sys-request {
  border-top:1px solid #ffffff20;
  padding:17px 0;
}

.sys-request strong,
.sys-request small {
  display:block;
  overflow-wrap:anywhere;
}

.sys-request small {
  color:#96a6b6;
  margin-top:5px;
}

.sys-request>div:last-child {
  display:flex;
  gap:8px;
}

@media(max-width:1050px) {
  .sys-roles {
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}

@media(max-width:700px) {
  .sys-top,.sys-wrap {
    width:calc(100% - 28px);
  }

  .sys-brand small {display:none}

  .sys-controls,
  .sys-roles {
    grid-template-columns:1fr;
  }

  .sys-panel {padding:17px}

  .sys-users {max-height:210px}

  .sys-request {
    align-items:flex-start;
    flex-direction:column;
  }
}
`;

put("css/sistemas-panel.css",sistemasCSS);

/* ===================================================
   9. AUTORIZACIONES EN NOTIFICACIONES
=================================================== */

const inboxActions = String.raw`
(() => {
  "use strict";

  window.ggSistemasNotificationRender =
    function(node,item) {
      if (
        item.kind !== "approval" ||
        item.decision_status !== "pending" ||
        !/^gg_sistemas_request:[0-9a-f-]{36}$/i
          .test(item.reference_key || "")
      ) return;

      const actions = node.querySelector(
        ".gmp-item-actions"
      );

      if (!actions) return;

      const id = item.reference_key.split(":")[1];

      for (const [label,decision] of [
        ["Aprobar","approved"],
        ["Rechazar","rejected"]
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gg-sistemas-approval";
        button.textContent = label;

        button.onclick = async () => {
          if (!confirm(label + " esta solicitud?")) {
            return;
          }

          button.disabled = true;

          const {error} = await window.ggSupabase.rpc(
            "gg_sistemas_resolve_request",
            {
              p_request_id:id,
              p_decision:decision
            }
          );

          if (error) {
            alert(error.message);
            button.disabled = false;
            return;
          }

          document.getElementById("gmpRefresh")?.click();
        };

        actions.append(button);
      }
    };
})();
`;

put(
  "js/gg-sistemas-notificaciones.js",
  inboxActions
);

let inbox = read("js/mi-perfil-notificaciones.js");

if (!inbox.includes("ggSistemasNotificationRender")) {
  if (!inbox.includes("target.append(node);")) {
    throw Error(
      "Cambió el render de notificaciones."
    );
  }

  inbox = inbox.replace(
    "target.append(node);",
    "target.append(node);\n" +
    "window.ggSistemasNotificationRender?.(node,item);"
  );
}

put("js/mi-perfil-notificaciones.js",inbox);

let inboxHTML = outputs.get(
  "mi-perfil-notificaciones.html"
);

inboxHTML = inject(
  inboxHTML,
  '<script type="text/gg-protected" src="js/mi-perfil-notificaciones.js"></script>',
  '<script type="text/gg-protected" src="js/gg-sistemas-notificaciones.js"></script>'
);

put(
  "mi-perfil-notificaciones.html",
  inboxHTML
);

/* ===================================================
   10. COMPATIBILIDAD CON ORBITAL
=================================================== */

const orbitalPath = path.join(
  ROOT,"js/sistema-orbital.js"
);

if (fs.existsSync(orbitalPath)) {
  let orbital = read("js/sistema-orbital.js");

  orbital = orbital.replace(
    /modules\.length\s*!==\s*8/g,
    "modules.length !== 9"
  );

  put("js/sistema-orbital.js",orbital);
}

/* ===================================================
   11. VALIDACIÓN Y ESCRITURA
=================================================== */

for (const [name,content] of outputs) {
  if (name.endsWith(".js")) {
    new vm.Script(content,{filename:name});
  }
}

const previous = new Map();

try {
  for (const [name,content] of outputs) {
    const target = path.join(ROOT,name);

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
  console.log("=================================");
  console.log(" GG SISTEMAS INSTALADO");
  console.log("=================================");
  console.log("✓ Nueva tarjeta Sistemas");
  console.log("✓ 9 módulos distribuidos");
  console.log("✓ Panel Flujos permisos");
  console.log("✓ Usuarios y checkbox");
  console.log("✓ Solicitudes a Sistemas");
  console.log("✓ Autorizaciones por notificación");
  console.log("✓ Protección de navegación");
  console.log("✓ Sin archivos .bak");
  console.log("");
  console.log("Reinicia Vite y abre sistema.html.");

} catch(error) {
  for (const [target,content] of previous) {
    try {
      if (content === null) {
        fs.rmSync(target,{force:true});
      } else {
        fs.writeFileSync(target,content);
      }
    } catch(recoveryError) {
      console.error(
        "No se pudo restaurar:",
        target,
        recoveryError.message
      );
    }
  }
  throw error;
}
