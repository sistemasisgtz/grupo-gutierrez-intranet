
"use strict";

// ========================================================
// GRUPO GUTIÉRREZ
// INSTALADOR: PERFIL EN SISTEMA CENTRAL
//
// Compatible con desarrollo grupo(10)
//
// Crea:
//   js/sistema-perfil.js
//   css/sistema-perfil.css
//
// Modifica:
//   sistema.html
//
// Respaldo:
//   sistema.html.bak
//
// Usa la función Supabase lo_my_hr_card
// ya instalada en la BD compartida.
//
// NO modifica la BD.
// NO modifica sistema.js.
// NO modifica el inicio ni cierre de sesión.
// ========================================================

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const base = __dirname;

const htmlFile = path.join(
    base,
    "sistema.html"
);

const cssFile = path.join(
    base,
    "css",
    "sistema-perfil.css"
);

const jsFile = path.join(
    base,
    "js",
    "sistema-perfil.js"
);

const backup = htmlFile + ".bak";

const marker = "GG_PERFIL_SISTEMA_V1";

// ========================================================
// 1. JAVASCRIPT DEL PERFIL
// ========================================================

const javascript = String.raw`(() => {

  "use strict";

  const db = window.ggSupabase;

  const holder =
    document.getElementById("ggProfileHolder");

  const button =
    document.getElementById("ggProfileButton");

  const panel =
    document.getElementById("ggProfilePanel");

  if (!db || !holder || !button || !panel) {
    return;
  }

  const el = id =>
    document.getElementById(id);

  const set = (id, text) => {
    const node = el(id);

    if (node) {
      node.textContent = text;
    }
  };

  // ========================================
  // INICIALES Y FOTOGRAFÍA
  // ========================================

  function initials(text) {

    const words = String(text || "GG")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return (
      words.length > 1

        ? words[0][0] +
          words[words.length - 1][0]

        : (words[0] || "GG").slice(0, 2)
    ).toUpperCase();
  }

  function setAvatar(name, photoPath) {

    const letters = initials(name);

    holder.querySelectorAll(
      "[data-gg-initials]"
    ).forEach(node => {
      node.textContent = letters;
    });

    if (!photoPath) {
      return;
    }

    const { data } = db.storage
      .from("employee-photos")
      .getPublicUrl(photoPath);

    if (!data?.publicUrl) {
      return;
    }

    holder.querySelectorAll(
      "[data-gg-avatar]"
    ).forEach(avatar => {

      const image =
        avatar.querySelector("img");

      if (!image) {
        return;
      }

      image.onload = () => {
        avatar.classList.add(
          "gg-profile-has-photo"
        );
      };

      image.onerror = () => {
        avatar.classList.remove(
          "gg-profile-has-photo"
        );
      };

      image.src = data.publicUrl;
    });
  }

  // ========================================
  // FECHAS
  // ========================================

  function dateUTC(value) {

    const found =
      /^(\d{4})-(\d{2})-(\d{2})/
        .exec(String(value || ""));

    if (!found) {
      return null;
    }

    const [, yy, mm, dd] = found;

    const d = new Date(
      Date.UTC(+yy, +mm - 1, +dd)
    );

    if (
      d.getUTCFullYear() !== +yy ||
      d.getUTCMonth() !== +mm - 1 ||
      d.getUTCDate() !== +dd
    ) {
      return null;
    }

    return d;
  }

  function readableDate(value) {

    const d = dateUTC(value);

    if (!d) {
      return "Sin registrar";
    }

    return new Intl.DateTimeFormat(
      "es-MX",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      }
    ).format(d);
  }

  // ========================================
  // ANTIGÜEDAD
  // ========================================

  function addMonths(date, count) {

    const first = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() + count,
        1
      )
    );

    const lastDay = new Date(
      Date.UTC(
        first.getUTCFullYear(),
        first.getUTCMonth() + 1,
        0
      )
    ).getUTCDate();

    return new Date(
      Date.UTC(
        first.getUTCFullYear(),
        first.getUTCMonth(),
        Math.min(
          date.getUTCDate(),
          lastDay
        )
      )
    );
  }

  function seniority(value) {

    const start = dateUTC(value);

    if (!start) {
      return "Sin fecha registrada";
    }

    const now = new Date();

    const today = new Date(
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
    );

    if (start > today) {
      return "Fecha futura";
    }

    let months =
      (
        today.getUTCFullYear() -
        start.getUTCFullYear()
      ) * 12 +
      today.getUTCMonth() -
      start.getUTCMonth();

    if (
      addMonths(start, months) > today
    ) {
      months--;
    }

    const cursor = addMonths(
      start,
      months
    );

    const days = Math.round(
      (today - cursor) / 86400000
    );

    const years = Math.floor(
      months / 12
    );

    const remaining = months % 12;

    const parts = [];

    if (years) {

      parts.push(
        years +
        (years === 1 ? " año" : " años")
      );
    }

    if (remaining) {

      parts.push(
        remaining +
        (
          remaining === 1
            ? " mes"
            : " meses"
        )
      );
    }

    if (days || !parts.length) {

      parts.push(
        days +
        (days === 1 ? " día" : " días")
      );
    }

    return parts.join(", ");
  }

  // ========================================
  // ABRIR Y CERRAR
  // ========================================

  function toggle(open) {

    panel.hidden = !open;

    button.setAttribute(
      "aria-expanded",
      String(open)
    );

    holder.classList.toggle(
      "gg-profile-open",
      open
    );
  }

  button.addEventListener(
    "click",
    () => toggle(panel.hidden)
  );

  document.addEventListener(
    "pointerdown",
    event => {

      if (!holder.contains(event.target)) {
        toggle(false);
      }
    }
  );

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        !panel.hidden
      ) {

        toggle(false);
        button.focus();
      }
    }
  );

  // ========================================
  // CARGAR SESIÓN Y DATOS DE RH
  // ========================================

  async function load() {

    const {
      data: auth,
      error: authError
    } = await db.auth.getSession();

    if (authError) {
      throw authError;
    }

    const account =
      auth?.session?.user;

    if (!account) {
      // sistema.js controla el acceso.
      return;
    }

    const email =
      account.email ||
      "Cuenta autenticada";

    set(
      "systemUserEmail",
      email
    );

    set(
      "ggProfileEmailPanel",
      email
    );

    setAvatar(
      email.split("@")[0],
      null
    );

    // La función SQL filtra mediante
    // auth.uid(), no por un ID enviado
    // desde el navegador.

    const {
      data: employee,
      error
    } = await db.rpc(
      "lo_my_hr_card"
    );

    if (error) {
      throw error;
    }

    // ====================================
    // EMPLEADO NO VINCULADO
    // ====================================

    if (!employee) {

      set(
        "ggProfileName",
        "Sin ficha vinculada"
      );

      set(
        "ggProfileRole",
        "Recursos Humanos"
      );

      set(
        "ggProfileNamePanel",
        "Sin empleado vinculado"
      );

      set(
        "ggProfileRolePanel",
        "RH debe vincular tu usuario"
      );

      set(
        "ggProfileHire",
        "Sin registrar"
      );

      set(
        "ggProfileSeniority",
        "Sin registrar"
      );

      set(
        "ggProfileNotice",
        "Tu sesión está activa, pero RH " +
        "aún no ha vinculado tu cuenta " +
        "a una ficha de empleado."
      );

      el("ggProfileNotice").hidden = false;

      return;
    }

    // ====================================
    // EMPLEADO ENCONTRADO
    // ====================================

    const name =
      employee.full_name ||
      "Empleado";

    const role =
      employee.position ||
      "Puesto sin asignar";

    set("ggProfileName", name);
    set("ggProfileRole", role);

    set(
      "ggProfileNamePanel",
      name
    );

    set(
      "ggProfileRolePanel",
      role
    );

    set(
      "ggProfileHire",
      readableDate(
        employee.imss_entry_date ||
        employee.seniority_date
      )
    );

    set(
      "ggProfileSeniority",
      seniority(
        employee.seniority_date ||
        employee.imss_entry_date
      )
    );

    // Aclarar diferencias entre fechas.

    if (
      employee.imss_entry_date &&
      employee.seniority_date &&
      employee.imss_entry_date !==
        employee.seniority_date
    ) {

      set(
        "ggProfileNotice",
        "Antigüedad calculada desde " +
        readableDate(
          employee.seniority_date
        ) +
        ". Fecha de ingreso según " +
        "registro IMSS."
      );

      el(
        "ggProfileNotice"
      ).hidden = false;
    }

    setAvatar(
      name,
      employee.photo_path
    );
  }

  // ========================================
  // ERRORES SIN BLOQUEAR SISTEMA
  // ========================================

  load().catch(error => {

    console.error(
      "[SISTEMA PERFIL RH]",
      error
    );

    set(
      "ggProfileName",
      "Perfil no disponible"
    );

    set(
      "ggProfileRole",
      "Consulta de RH fallida"
    );

    set(
      "ggProfileNamePanel",
      "No se pudo consultar RH"
    );

    set(
      "ggProfileRolePanel",
      "Tu sesión continúa activa"
    );

    set(
      "ggProfileHire",
      "No disponible"
    );

    set(
      "ggProfileSeniority",
      "No disponible"
    );

    set(
      "ggProfileNotice",
      "No se pudo leer el perfil. " +
      "Revisa la consola y los permisos " +
      "de la función lo_my_hr_card."
    );

    el("ggProfileNotice").hidden = false;
  });

})();`;

// ========================================================
// 2. CSS DEL PERFIL
// ========================================================

const stylesheet = String.raw`
/* =============================================
   GRUPO GUTIÉRREZ
   PERFIL DE SESIÓN - SISTEMA CENTRAL
============================================= */

.gg-profile {
    position: relative;
    z-index: 30;

    width: min(285px, 35vw);
    min-width: 0;
}

.gg-profile-button {
    display: flex;
    align-items: center;
    gap: 10px;

    width: 100%;
    min-height: 58px;
    padding: 8px 12px;

    color: #f2f6fa;
    text-align: left;

    border: 1px solid
        rgba(218,233,245,.16);

    border-radius: 16px;

    background: linear-gradient(
        135deg,
        rgba(255,255,255,.09),
        rgba(255,255,255,.025)
    );

    box-shadow:
        inset 0 1px rgba(255,255,255,.08),
        0 12px 30px rgba(0,0,0,.16);

    cursor: pointer;

    transition:
        background .2s,
        border-color .2s;
}

.gg-profile-button:hover,
.gg-profile-button[aria-expanded="true"] {
    background: rgba(255,255,255,.12);

    border-color:
        rgba(201,225,241,.35);
}

.gg-profile-avatar {
    display: grid;
    place-items: center;
    flex: none;

    width: 41px;
    height: 41px;

    overflow: hidden;
    border-radius: 13px;

    color: #dbebf6;

    background: linear-gradient(
        145deg,
        #405b71,
        #243545
    );

    font: 800 13px/1
        'Manrope', sans-serif;

    border: 1px solid
        rgba(255,255,255,.12);
}

.gg-profile-avatar img {
    display: none;

    width: 100%;
    height: 100%;
    object-fit: cover;
}

.gg-profile-has-photo img {
    display: block;
}

.gg-profile-has-photo
[data-gg-initials] {
    display: none;
}

.gg-profile-copy {
    display: grid;
    min-width: 0;
    flex: 1;
    gap: 3px;
}

.gg-profile-caption {
    font-size: 9px;
    letter-spacing: .09em;
    font-weight: 800;
    color: #b2dbca;
}

.gg-profile-copy strong {
    font-size: 11px;

    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.gg-profile-copy small {
    font-size: 10px;
    color: #aebac7;

    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.gg-profile-arrow {
    flex: none;

    font-size: 17px;
    color: #a9b9c7;

    transition: transform .2s;
}

.gg-profile-open
.gg-profile-arrow {
    transform: rotate(180deg);
}

/* =============================================
   PANEL DESPLEGABLE
============================================= */

.gg-profile-panel[hidden] {
    display: none !important;
}

.gg-profile-panel {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    z-index: 100;

    width: min(
        365px,
        calc(100vw - 34px)
    );

    padding: 19px;

    color: #eef5fa;

    border: 1px solid
        rgba(215,230,244,.19);

    border-radius: 22px;

    background: linear-gradient(
        145deg,
        #1c2834,
        #101821 85%
    );

    box-shadow:
        0 28px 70px rgba(0,0,0,.55),
        inset 0 1px rgba(255,255,255,.09);
}

.gg-profile-panel-head {
    display: flex;
    gap: 13px;
    align-items: center;

    padding-bottom: 17px;

    border-bottom: 1px solid
        rgba(255,255,255,.12);
}

.gg-profile-avatar-lg {
    width: 65px;
    height: 65px;

    border-radius: 19px;
    font-size: 20px;
}

.gg-profile-panel-head > div {
    flex: 1;
    min-width: 0;
}

.gg-profile-panel-head strong {
    display: block;

    margin: 5px 0;

    font: 800 16px/1.25
        'Manrope', sans-serif;

    overflow-wrap: anywhere;
}

.gg-profile-panel-head small {
    display: block;

    font-size: 11px;
    color: #b4c5d4;

    overflow-wrap: anywhere;
}

.gg-profile-fields {
    display: grid;
    gap: 14px;

    margin: 18px 0 0;
}

.gg-profile-fields div {
    min-width: 0;
}

.gg-profile-fields dt {
    color: #91a4b5;

    font-size: 10px;
    letter-spacing: .08em;
    font-weight: 800;

    text-transform: uppercase;
}

.gg-profile-fields dd {
    margin: 5px 0 0;

    font-size: 12px;
    font-weight: 650;
    color: #e4edf5;

    overflow-wrap: anywhere;
}

.gg-profile-fields
.gg-profile-feature {
    padding: 13px;

    border: 1px solid
        rgba(156,203,223,.15);

    border-radius: 13px;

    background:
        rgba(145,190,213,.09);
}

.gg-profile-notice {
    margin: 15px 0 0;
    padding: 12px;

    border-radius: 11px;

    background:
        rgba(147,187,205,.10);

    font-size: 11px;
    color: #c3d5e2;
    line-height: 1.6;
}

/* Mantener visible el desplegable */

.masthead {
    overflow: visible;
}

/* =============================================
   TABLET Y TELÉFONO
============================================= */

@media (max-width: 780px) {

    .masthead {
        flex-wrap: wrap;

        padding: 12px 0;
        gap: 10px;
    }

    .masthead-right {
        width: 100%;
        gap: 10px;
    }

    .masthead-right
    .gg-profile {
        flex: 1;
        width: auto;
        min-width: 0;
    }

    .masthead-right
    .exit-button {
        flex: none;
    }

    .gg-profile-panel {
        left: 0;
        right: auto;

        width: min(
            365px,
            calc(100vw - 95px)
        );
    }
}

@media (max-width: 400px) {

    .gg-profile-button {
        padding: 7px 9px;
        gap: 8px;
    }

    .gg-profile-avatar {
        width: 36px;
        height: 36px;

        border-radius: 11px;
    }

    .gg-profile-panel {
        padding: 15px;
    }
}

@media (
    prefers-reduced-motion: reduce
) {

    .gg-profile-button,
    .gg-profile-arrow {
        transition: none;
    }
}
`;

// ========================================================
// 3. HTML DEL BOTÓN Y PANEL
// ========================================================

const widget = String.raw`
<!-- GG_PERFIL_SISTEMA_V1 -->

<div class="gg-profile" id="ggProfileHolder">

    <button
        class="gg-profile-button"
        type="button"
        id="ggProfileButton"
        aria-expanded="false"
        aria-controls="ggProfilePanel"
        aria-label="Ver sesión iniciada y perfil laboral"
    >

        <span
            class="gg-profile-avatar"
            data-gg-avatar
        >
            <img alt="" decoding="async">

            <span data-gg-initials>
                GG
            </span>
        </span>

        <span class="gg-profile-copy">

            <span class="gg-profile-caption">
                ● SESIÓN INICIADA
            </span>

            <strong id="systemUserEmail">
                Verificando sesión…
            </strong>

            <small>
                <span id="ggProfileName">
                    Consultando RH…
                </span>

                ·

                <span id="ggProfileRole">
                    Puesto
                </span>
            </small>

        </span>

        <span
            class="gg-profile-arrow"
            aria-hidden="true"
        >
            ⌄
        </span>

    </button>

    <section
        class="gg-profile-panel"
        id="ggProfilePanel"
        hidden
        aria-label="Mi perfil laboral"
    >

        <div class="gg-profile-panel-head">

            <span
                class="
                    gg-profile-avatar
                    gg-profile-avatar-lg
                "
                data-gg-avatar
            >

                <img alt="" decoding="async">

                <span data-gg-initials>
                    GG
                </span>

            </span>

            <div>

                <span class="gg-profile-caption">
                    MI PERFIL · GRUPO GUTIÉRREZ
                </span>

                <strong id="ggProfileNamePanel">
                    Cargando…
                </strong>

                <small id="ggProfileRolePanel">
                    Puesto
                </small>

            </div>

        </div>

        <dl class="gg-profile-fields">

            <div>
                <dt>
                    Correo de la cuenta
                </dt>

                <dd id="ggProfileEmailPanel">
                    …
                </dd>
            </div>

            <div>
                <dt>
                    Fecha de ingreso
                </dt>

                <dd id="ggProfileHire">
                    Consultando…
                </dd>
            </div>

            <div class="gg-profile-feature">
                <dt>
                    Antigüedad
                </dt>

                <dd id="ggProfileSeniority">
                    Calculando…
                </dd>
            </div>

        </dl>

        <p
            class="gg-profile-notice"
            id="ggProfileNotice"
            hidden
        ></p>

    </section>

</div>
`;

// ========================================================
// 4. VALIDACIONES
// ========================================================

function requireOnce(
    haystack,
    needle,
    label
) {

    if (
        haystack.split(needle).length !== 2
    ) {

        throw new Error(
            "No encontré una coincidencia " +
            "única para: " + label +
            ". No se aplicó nada."
        );
    }
}

if (!fs.existsSync(htmlFile)) {

    throw new Error(
        "Pon este instalador junto a " +
        "sistema.html, en la raíz " +
        "de Grupo Gutiérrez."
    );
}

if (
    fs.existsSync(backup) ||
    fs.existsSync(cssFile) ||
    fs.existsSync(jsFile)
) {

    throw new Error(
        "Ya existen archivos de respaldo " +
        "o del perfil. No sobrescribiré nada."
    );
}

// Normalizar los saltos de línea del ZIP.
// Windows puede usar CRLF.

const original = fs
    .readFileSync(htmlFile, "utf8")
    .replace(/\r\n/g, "\n");

if (original.includes(marker)) {

    throw new Error(
        "Este botón ya está instalado."
    );
}

const oldBlock = `<div class="user-summary">
        <small>SESIÓN ACTIVA</small>
        <strong id="systemUserEmail">
          Verificando sesión…
        </strong>
      </div>`;

const cssAnchor =
    '<link rel="stylesheet" href="css/sistema.css">';

const jsAnchor =
    '<script src="js/sistema.js"></script>';

requireOnce(
    original,
    oldBlock,
    "bloque de sesión original"
);

requireOnce(
    original,
    cssAnchor,
    "CSS de sistema"
);

requireOnce(
    original,
    jsAnchor,
    "JS de sistema"
);

// ========================================================
// 5. PREPARAR CAMBIOS AL HTML
// ========================================================

const updated = original

    .replace(
        oldBlock,
        widget
    )

    .replace(
        cssAnchor,

        cssAnchor +
        '\n  <link rel="stylesheet" ' +
        'href="css/sistema-perfil.css">'
    )

    .replace(
        jsAnchor,

        jsAnchor +
        '\n  <script ' +
        'src="js/sistema-perfil.js"></script>'
    );

if (
    updated.split(
        'id="systemUserEmail"'
    ).length !== 2 ||

    !updated.includes(marker) ||

    !updated.includes(
        "sistema-perfil.js"
    )
) {

    throw new Error(
        "Validación del HTML fallida. " +
        "No se aplicaron cambios."
    );
}

// Validar el JS nuevo antes de escribirlo.

new vm.Script(
    javascript,
    {
        filename: "sistema-perfil.js"
    }
);

// ========================================================
// 6. RESPALDO Y APLICACIÓN
// ========================================================

// Todas las validaciones anteriores
// se ejecutan ANTES de modificar archivos.

fs.copyFileSync(
    htmlFile,
    backup,
    fs.constants.COPYFILE_EXCL
);

const created = [];

try {

    fs.writeFileSync(
        jsFile,
        javascript,
        {
            encoding: "utf8",
            flag: "wx"
        }
    );

    created.push(jsFile);

    fs.writeFileSync(
        cssFile,
        stylesheet,
        {
            encoding: "utf8",
            flag: "wx"
        }
    );

    created.push(cssFile);

    fs.writeFileSync(
        htmlFile,
        updated,
        "utf8"
    );

} catch (error) {

    // Restaurar el HTML si ocurre un error.

    fs.copyFileSync(
        backup,
        htmlFile
    );

    for (const filename of created) {

        try {
            fs.unlinkSync(filename);
        } catch (_) {}
    }

    throw error;
}

// ========================================================
// 7. RESULTADO
// ========================================================

console.log(
    "✅ sistema.html actualizado"
);

console.log(
    "✅ js/sistema-perfil.js creado"
);

console.log(
    "✅ css/sistema-perfil.css creado"
);

console.log(
    "✅ Respaldo sistema.html.bak"
);

console.log(
    "✅ Login y botón Salir intactos"
);

console.log(
    "✅ PERFIL INSTALADO CORRECTAMENTE"
);
