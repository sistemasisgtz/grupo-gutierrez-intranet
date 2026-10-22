
"use strict";

// ======================================================
// GRUPO GUTIÉRREZ
// INSTALADOR AUTOMÁTICO DE CATÁLOGO DE FLUJOS
//
// Basado en desarrollo grupo(20261022-160909)
//
// CREA:
//   js/finanzas-reglas-admin.js
//   css/finanzas-reglas-admin.css
//
// MODIFICA:
//   control-financiero.html
//   js/solicitudes-pago.js
//
// CREA RESPALDOS:
//   control-financiero.html.bak
//   js/solicitudes-pago.js.bak
//
// NO MODIFICA SUPABASE.
// NO EJECUTA SQL.
// ======================================================

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = __dirname;

const targetHtml = "control-financiero.html";
const targetRequest = "js/solicitudes-pago.js";

const newJs = "js/finanzas-reglas-admin.js";
const newCss = "css/finanzas-reglas-admin.css";

const targets = [
    targetHtml,
    targetRequest
];

const marker = "GG_CATALOGO_FLUJOS_V1";

function requireOne(source, needle, label) {
    if (source.split(needle).length !== 2) {
        throw Error(
            `No hay una coincidencia exacta para ${label}. ` +
            "Instalación cancelada."
        );
    }
}

// ======================================================
// 1. TODO EL JAVASCRIPT NUEVO DEL ADMINISTRADOR
// ======================================================

function financeRulesAdmin() {

    "use strict";

    const TAG = "[FLUJOS FINANZAS]";

    const F = () => window.GGFinance;

    const byId = id =>
        document.getElementById(id);

    const escape = value =>
        F().escapeHtml(String(value ?? ""));

    const compact = value =>
        String(value ?? "")
            .trim()
            .replace(/\s+/g, " ");

    const unique = values =>
        [...new Set(values.filter(Boolean))]
            .sort((a, b) =>
                a.localeCompare(b, "es")
            );

    let rows = [];
    let editId = null;
    let busy = false;
    let initialized = false;

    const placeholder =
        '<option value="">Seleccionar...</option>';

    function toast(text, error = false) {
        F().toast(text, error);
    }

    function adminRoot() {
        return byId("ggfrPanel");
    }

    // ==========================================
    // LEER CAMPO EXISTENTE O NUEVO
    // ==========================================

    function selectedValue(kind) {

        const select = byId(
            `ggfr${kind}Select`
        );

        const manual = byId(
            `ggfr${kind}New`
        );

        return select?.value === "__new__"
            ? compact(manual?.value)
            : compact(select?.value);
    }

    // ==========================================
    // FILTRAR LAS OPCIONES DEL FLUJO
    // ==========================================

    function listFor(level) {

        const valid = rows.filter(
            x => x.active
        );

        if (level === "Area") {
            return unique(
                valid.map(x => x.area_group)
            );
        }

        if (level === "Class") {
            return unique(
                valid
                    .filter(
                        x =>
                            x.area_group ===
                            selectedValue("Area")
                    )
                    .map(x => x.classification)
            );
        }

        return unique(
            valid
                .filter(
                    x =>
                        x.area_group ===
                            selectedValue("Area") &&
                        x.classification ===
                            selectedValue("Class")
                )
                .map(x => x.category)
        );
    }

    function paintSelect(
        kind,
        values,
        wanted = ""
    ) {

        const select = byId(
            `ggfr${kind}Select`
        );

        const manual = byId(
            `ggfr${kind}New`
        );

        if (!select || !manual) return;

        const known = values.includes(wanted);

        select.innerHTML =
            placeholder +
            values.map(
                v => `
                    <option value="${escape(v)}">
                        ${escape(v)}
                    </option>
                `
            ).join("") +
            `<option value="__new__">
                + Crear nuevo...
            </option>`;

        select.value = wanted
            ? (known ? wanted : "__new__")
            : "";

        manual.hidden =
            select.value !== "__new__";

        manual.required = !manual.hidden;

        manual.value =
            wanted && !known ? wanted : "";

        if (
            select.value === "__new__" &&
            !wanted
        ) {
            manual.focus();
        }
    }

    function cascade(from, desired = {}) {

        if (from <= 0) {
            paintSelect(
                "Area",
                listFor("Area"),
                desired.area ?? ""
            );
        }

        if (from <= 1) {
            paintSelect(
                "Class",
                listFor("Class"),
                desired.classification ?? ""
            );
        }

        if (from <= 2) {
            paintSelect(
                "Cat",
                listFor("Cat"),
                desired.category ?? ""
            );
        }

        autoResult();
    }

    function autoResult() {

        const match = rows.find(
            r =>
                r.active &&
                r.area_group ===
                    selectedValue("Area") &&
                r.classification ===
                    selectedValue("Class") &&
                r.category ===
                    selectedValue("Cat")
        );

        const indicator = byId("ggfrHint");

        if (indicator) {
            indicator.textContent = match
                ? `Ya existe este flujo: ` +
                  `${match.movement_type} · ` +
                  `${match.behavior}. ` +
                  `Puedes editarlo desde la tabla.`
                : "Combinación disponible para una nueva regla.";
        }

        if (match && !editId) {

            if (!byId("ggfrMovement").value) {
                byId("ggfrMovement").value =
                    match.movement_type;
            }

            if (!byId("ggfrBehavior").value) {
                byId("ggfrBehavior").value =
                    match.behavior;
            }
        }
    }

    // ==========================================
    // CREAR PESTAÑA Y FORMULARIO
    // ==========================================

    function setupWidget() {

        if (initialized) return;

        if (
            !document.querySelector(
                ".control-finance-page"
            ) ||
            !F()?.state?.isAdmin
        ) {
            return;
        }

        const nav = document.querySelector(
            ".finance-browser .finance-tabbar"
        );

        const browser = document.querySelector(
            ".finance-browser"
        );

        if (!nav || !browser) return;

        initialized = true;

        nav.insertAdjacentHTML(
            "beforeend",
            `
            <button
                type="button"
                class="finance-tab"
                data-finance-tab="flujos"
                id="ggfrTab"
            >
                <span class="finance-tab-dot"></span>
                Catálogo de flujos
            </button>
            `
        );

        browser.insertAdjacentHTML(
            "beforeend",
            `
            <section
                class="finance-panel ggfr-panel"
                id="ggfrPanel"
                data-finance-panel="flujos"
                aria-label="Catálogo de flujos financieros"
            >

                <div class="finance-section-heading ggfr-heading">

                    <div>
                        <span class="finance-kicker">
                            ADMINISTRACIÓN · SUPABASE
                        </span>

                        <h2>Áreas y flujos de solicitudes</h2>

                        <p>
                            Área agrupadora →
                            Clasificación →
                            Categoría →
                            Tipo de movimiento y
                            comportamiento automáticos.
                        </p>
                    </div>

                    <div class="ggfr-actions">

                        <button
                            class="finance-button"
                            id="ggfrReload"
                            type="button"
                        >
                            ↻ Actualizar
                        </button>

                        <button
                            class="finance-button primary"
                            id="ggfrNew"
                            type="button"
                        >
                            + Nuevo flujo / área
                        </button>

                    </div>

                </div>

                <div class="ggfr-alert">
                    Cada nueva área debe tener al menos una
                    clasificación y una categoría.
                    Desactivar no borra el historial.
                    Los usuarios verán los cambios al abrir
                    <b>Nueva solicitud</b>.
                </div>

                <div class="ggfr-filters">

                    <input
                        id="ggfrSearch"
                        type="search"
                        placeholder="Buscar área, clasificación, categoría..."
                    >

                    <select id="ggfrStatus">
                        <option value="active">Activas</option>
                        <option value="all">Todas</option>
                        <option value="inactive">Inactivas</option>
                    </select>

                    <strong id="ggfrCounter">
                        Cargando...
                    </strong>

                </div>

                <div
                    id="ggfrError"
                    class="ggfr-error"
                    hidden
                ></div>

                <div class="ggfr-table-wrap">

                    <table class="ggfr-table">

                        <thead>
                            <tr>
                                <th>Área agrupadora</th>
                                <th>Clasificación</th>
                                <th>Categoría</th>
                                <th>Tipo de movimiento</th>
                                <th>Comportamiento</th>
                                <th>Estado / historial</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody id="ggfrRows">

                            <tr>
                                <td colspan="7">
                                    Cargando catálogo...
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

                <form
                    id="ggfrForm"
                    class="ggfr-form"
                    hidden
                >

                    <div class="ggfr-form-header">

                        <div>
                            <span class="finance-kicker">
                                EDITOR DE REGLAS
                            </span>

                            <h3 id="ggfrFormTitle">
                                Nuevo flujo
                            </h3>
                        </div>

                        <button
                            type="button"
                            id="ggfrClose"
                            class="finance-button"
                        >
                            Cerrar
                        </button>

                    </div>

                    <div class="ggfr-form-grid">

                        <label>
                            1. Área agrupadora *

                            <select
                                id="ggfrAreaSelect"
                                required
                            ></select>

                            <input
                                id="ggfrAreaNew"
                                maxlength="120"
                                placeholder="Escribe nueva área"
                                hidden
                            >
                        </label>

                        <label>
                            2. Clasificación *

                            <select
                                id="ggfrClassSelect"
                                required
                            ></select>

                            <input
                                id="ggfrClassNew"
                                maxlength="120"
                                placeholder="Escribe nueva clasificación"
                                hidden
                            >
                        </label>

                        <label>
                            3. Categoría *

                            <select
                                id="ggfrCatSelect"
                                required
                            ></select>

                            <input
                                id="ggfrCatNew"
                                maxlength="120"
                                placeholder="Escribe nueva categoría"
                                hidden
                            >
                        </label>

                        <label>
                            4. Tipo de movimiento automático *

                            <input
                                id="ggfrMovement"
                                maxlength="100"
                                list="ggfrMovementList"
                                required
                                placeholder="Ej. Egreso"
                            >

                            <datalist
                                id="ggfrMovementList"
                            ></datalist>

                        </label>

                        <label>
                            5. Comportamiento automático *

                            <input
                                id="ggfrBehavior"
                                maxlength="100"
                                list="ggfrBehaviorList"
                                required
                                placeholder="Ej. Gasto"
                            >

                            <datalist
                                id="ggfrBehaviorList"
                            ></datalist>

                        </label>

                        <label class="ggfr-check">

                            <input
                                type="checkbox"
                                id="ggfrActive"
                                checked
                            >

                            Regla activa para nuevas solicitudes

                        </label>

                    </div>

                    <p
                        class="ggfr-note"
                        id="ggfrHint"
                    ></p>

                    <p
                        class="ggfr-note"
                        id="ggfrVersionNote"
                    ></p>

                    <div class="ggfr-actions">

                        <button
                            class="finance-button primary"
                            type="submit"
                            id="ggfrSave"
                        >
                            Guardar flujo
                        </button>

                        <button
                            class="finance-button"
                            type="button"
                            id="ggfrCancel"
                        >
                            Cancelar
                        </button>

                    </div>

                </form>

            </section>
            `
        );

        // ======================================
        // ACTIVACIÓN DE PESTAÑA
        // ======================================

        byId("ggfrTab").addEventListener(
            "click",
            () => {

                document.querySelectorAll(
                    "[data-finance-tab]"
                ).forEach(
                    x => x.classList.toggle(
                        "active",
                        x === byId("ggfrTab")
                    )
                );

                document.querySelectorAll(
                    "[data-finance-panel]"
                ).forEach(
                    x => x.classList.toggle(
                        "active",
                        x === adminRoot()
                    )
                );

                load().catch(
                    error => showError(error)
                );
            }
        );

        byId("ggfrReload").onclick =
            () => load().catch(showError);

        byId("ggfrNew").onclick =
            () => openEditor(null);

        byId("ggfrClose").onclick =
            byId("ggfrCancel").onclick =
                () => {
                    byId("ggfrForm").hidden = true;
                    editId = null;
                };

        byId("ggfrSearch").addEventListener(
            "input",
            renderTable
        );

        byId("ggfrStatus").addEventListener(
            "change",
            renderTable
        );

        byId("ggfrForm").addEventListener(
            "submit",
            save
        );

        // ======================================
        // CASCADA ÁREA > CLASIFICACIÓN > CATEGORÍA
        // ======================================

        for (
            const kind of [
                "Area",
                "Class",
                "Cat"
            ]
        ) {

            byId(`ggfr${kind}Select`)
                .addEventListener(
                    "change",
                    () => {

                        const node = byId(
                            `ggfr${kind}New`
                        );

                        node.hidden =
                            byId(
                                `ggfr${kind}Select`
                            ).value !== "__new__";

                        node.required = !node.hidden;

                        if (!node.hidden) {
                            node.focus();
                        }

                        if (kind === "Area") {
                            cascade(1);
                        } else if (kind === "Class") {
                            cascade(2);
                        } else {
                            autoResult();
                        }

                    }
                );

            byId(`ggfr${kind}New`)
                .addEventListener(
                    "input",
                    () => {

                        if (kind === "Area") {
                            cascade(1);
                        } else if (kind === "Class") {
                            cascade(2);
                        } else {
                            autoResult();
                        }
                    }
                );
        }

        // ======================================
        // EDITAR / ACTIVAR / DESACTIVAR
        // ======================================

        byId("ggfrRows").addEventListener(
            "click",
            async e => {

                const button =
                    e.target.closest(
                        "button[data-id]"
                    );

                if (!button || busy) return;

                const row = rows.find(
                    r =>
                        r.id === button.dataset.id
                );

                if (!row) return;

                if (
                    button.dataset.action === "edit"
                ) {

                    openEditor(row);

                } else if (
                    button.dataset.action === "toggle"
                ) {

                    await toggle(row);

                }
            }
        );
    }

    // ==========================================
    // ERRORES
    // ==========================================

    function showError(error) {

        console.error(TAG, error);

        const area = byId("ggfrError");

        if (area) {

            area.hidden = false;

            area.textContent =
                `Error: ${error?.message || error}. ` +
                `Ejecuta el SQL de funciones ` +
                `administrativas en Supabase y ` +
                `revisa los permisos.`;
        }

        toast(
            error?.message ||
                "Error en catálogo de flujos",
            true
        );
    }

    // ==========================================
    // CARGAR CATÁLOGO DESDE SUPABASE
    // ==========================================

    async function load() {

        if (!initialized) return;

        const result = await F().db.rpc(
            "finance_admin_catalog_list"
        );

        if (result.error) {
            throw result.error;
        }

        rows = Array.isArray(result.data)
            ? result.data
            : [];

        byId("ggfrError").hidden = true;

        renderTable();

        fillLists();

        // Refrescar reglas de esta sesión.

        await F().loadRules();
    }

    function fillLists() {

        byId("ggfrMovementList").innerHTML =
            unique(
                rows.map(
                    x => x.movement_type
                )
            ).map(
                x => `
                    <option value="${escape(x)}"></option>
                `
            ).join("");

        byId("ggfrBehaviorList").innerHTML =
            unique(
                rows.map(
                    x => x.behavior
                )
            ).map(
                x => `
                    <option value="${escape(x)}"></option>
                `
            ).join("");
    }

    // ==========================================
    // TABLA
    // ==========================================

    function renderTable() {

        const needle = compact(
            byId("ggfrSearch").value
        ).toLocaleLowerCase("es");

        const mode =
            byId("ggfrStatus").value;

        const result = rows.filter(
            r => {

                const allowed =
                    mode === "all" ||
                    (
                        mode === "active"
                            ? r.active
                            : !r.active
                    );

                const matches = [
                    r.area_group,
                    r.classification,
                    r.category,
                    r.movement_type,
                    r.behavior
                ].some(
                    v =>
                        String(v || "")
                            .toLocaleLowerCase("es")
                            .includes(needle)
                );

                return allowed && matches;
            }
        );

        byId("ggfrCounter").textContent =
            `${result.length} de ${rows.length} reglas`;

        byId("ggfrRows").innerHTML =
            result.length

                ? result.map(
                    r => `
                        <tr>

                            <td>
                                <b>${escape(r.area_group)}</b>
                            </td>

                            <td>${escape(r.classification)}</td>

                            <td>${escape(r.category)}</td>

                            <td>${escape(r.movement_type)}</td>

                            <td>${escape(r.behavior)}</td>

                            <td>

                                <span class="
                                    ggfr-badge
                                    ${r.active ? "ggfr-on" : "ggfr-off"}
                                ">
                                    ${r.active ? "Activa" : "Inactiva"}
                                </span>

                                <small>
                                    ${Number(r.uses_count || 0)}
                                    solicitudes
                                </small>

                            </td>

                            <td class="ggfr-buttons">

                                <button
                                    class="finance-button"
                                    type="button"
                                    data-id="${escape(r.id)}"
                                    data-action="edit"
                                >
                                    Editar
                                </button>

                                <button
                                    class="finance-button"
                                    type="button"
                                    data-id="${escape(r.id)}"
                                    data-action="toggle"
                                >
                                    ${r.active ? "Desactivar" : "Activar"}
                                </button>

                            </td>

                        </tr>
                    `
                ).join("")

                : `
                    <tr>
                        <td colspan="7">
                            No hay reglas con estos filtros.
                        </td>
                    </tr>
                `;
    }

    // ==========================================
    // NUEVA REGLA / EDITAR REGLA
    // ==========================================

    function openEditor(row) {

        editId = row?.id || null;

        const form = byId("ggfrForm");

        form.hidden = false;

        byId("ggfrFormTitle").textContent =
            row
                ? "Editar flujo"
                : "Crear nuevo flujo / área";

        byId("ggfrMovement").value =
            row?.movement_type || "";

        byId("ggfrBehavior").value =
            row?.behavior || "";

        byId("ggfrActive").checked =
            row ? Boolean(row.active) : true;

        cascade(
            0,
            row
                ? {
                    area: row.area_group,
                    classification: row.classification,
                    category: row.category
                }
                : {}
        );

        byId("ggfrVersionNote").textContent =
            row && Number(row.uses_count) > 0

                ? "Esta regla ya tiene solicitudes " +
                  "asociadas. Se creará una nueva " +
                  "versión y se desactivará la " +
                  "anterior para preservar el historial."

                : "No se eliminarán solicitudes existentes.";

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    // ==========================================
    // GUARDAR EN SUPABASE
    // ==========================================

    async function save(event) {

        event.preventDefault();

        if (busy) return;

        const payload = {

            p_id: editId,

            p_area_group:
                selectedValue("Area"),

            p_classification:
                selectedValue("Class"),

            p_category:
                selectedValue("Cat"),

            p_movement_type:
                compact(
                    byId("ggfrMovement").value
                ),

            p_behavior:
                compact(
                    byId("ggfrBehavior").value
                ),

            p_active:
                byId("ggfrActive").checked
        };

        const incomplete =
            Object.entries(payload).some(
                ([key, value]) =>
                    key !== "p_id" &&
                    key !== "p_active" &&
                    !value
            );

        if (incomplete) {

            toast(
                "Completa los cinco niveles del flujo.",
                true
            );

            return;
        }

        busy = true;

        byId("ggfrSave").disabled = true;

        try {

            const result = await F().db.rpc(
                "finance_admin_save_catalog_rule",
                payload
            );

            if (result.error) {
                throw result.error;
            }

            byId("ggfrForm").hidden = true;

            editId = null;

            await load();

            toast(
                "Flujo guardado. Estará disponible " +
                "en las solicitudes nuevas."
            );

        } catch (error) {

            showError(error);

        } finally {

            busy = false;

            byId("ggfrSave").disabled = false;
        }
    }

    // ==========================================
    // ACTIVAR / DESACTIVAR REGLAS
    // ==========================================

    async function toggle(row) {

        const next = !row.active;

        const confirmation =
            next

                ? `¿Activar el flujo «${row.area_group} → ` +
                  `${row.classification} → ${row.category}»?`

                : "¿Desactivar este flujo? Ya no " +
                  "aparecerá en nuevas solicitudes, " +
                  "pero conservará las existentes.";

        if (!window.confirm(confirmation)) {
            return;
        }

        busy = true;

        try {

            const result = await F().db.rpc(
                "finance_admin_toggle_catalog_rule",
                {
                    p_id: row.id,
                    p_active: next
                }
            );

            if (result.error) {
                throw result.error;
            }

            await load();

            toast(
                next
                    ? "Flujo activado."
                    : "Flujo desactivado."
            );

        } catch (error) {

            showError(error);

        } finally {

            busy = false;
        }
    }

    document.addEventListener(
        "ggfinance:ready",
        setupWidget,
        { once: true }
    );
}

// Convertimos la función en un JS independiente.
// Así el instalador no necesita otro archivo fuente.

const javascript =
    `(${financeRulesAdmin.toString()})();\n`;

// ======================================================
// 2. TODO EL CSS NUEVO
// ======================================================

const css = String.raw`

/* ==============================================
   GRUPO GUTIÉRREZ
   CATÁLOGO DE FLUJOS - CONTROL FINANCIERO
============================================== */

.ggfr-panel {
    min-height: 480px;
}

.ggfr-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
}

.ggfr-heading h2 {
    margin: 9px 0;
    font-size: 22px;
}

.ggfr-heading p {
    line-height: 1.65;
    max-width: 760px;
}

.ggfr-actions {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
}

.ggfr-alert {
    margin: 15px 0;
    padding: 13px 16px;

    border: 1px solid rgba(74,145,188,.20);
    border-radius: 13px;

    background: rgba(77,151,201,.07);
    color: #bed2df;

    font-size: 11px;
    line-height: 1.7;
}

.ggfr-filters {
    display: flex;
    gap: 12px;
    align-items: center;

    margin: 15px 0;
    flex-wrap: wrap;
}

.ggfr-filters input,
.ggfr-filters select,
.ggfr-form input:not([type=checkbox]),
.ggfr-form select {
    min-height: 42px;
    padding: 10px 13px;

    border: 1px solid rgba(176,205,222,.18);
    border-radius: 10px;

    background: #111c26;
    color: #e8f0f6;

    font: inherit;
    font-size: 12px;
    outline: none;
    min-width: 0;
}

.ggfr-filters input {
    flex: 1;
    min-width: 210px;
}

.ggfr-filters strong {
    font-size: 11px;
    color: #8fa8b9;
    margin-left: auto;
}

.ggfr-table-wrap {
    overflow-x: auto;
    max-height: 550px;
    overflow-y: auto;

    border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px;

    background: rgba(9,16,23,.35);
}

.ggfr-table {
    border-collapse: collapse;
    width: 100%;
    min-width: 980px;
    font-size: 11px;
}

.ggfr-table th,
.ggfr-table td {
    text-align: left;
    padding: 13px 12px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    vertical-align: middle;
}

.ggfr-table th {
    position: sticky;
    top: 0;
    z-index: 1;

    color: #91a8b8;
    background: #192530;

    font-size: 10px;
    white-space: nowrap;
}

.ggfr-table tbody tr:hover {
    background: rgba(255,255,255,.035);
}

.ggfr-table small {
    display: block;
    color: #8c9eaa;
    margin-top: 5px;
}

.ggfr-badge {
    padding: 5px 8px;
    border-radius: 100px;

    font-size: 10px;
    font-weight: 750;
}

.ggfr-on {
    background: rgba(66,155,109,.15);
    color: #a2debd;
}

.ggfr-off {
    background: rgba(189,108,71,.13);
    color: #dcb29d;
}

.ggfr-buttons {
    white-space: nowrap;
}

.ggfr-buttons button {
    margin: 2px;
    padding: 9px;
    font-size: 10px;
}

.ggfr-error {
    margin: 10px 0;
    padding: 12px;

    border: 1px solid #925459;
    border-radius: 10px;

    color: #ffbcc3;
    font-size: 12px;

    overflow-wrap: anywhere;
}

.ggfr-form[hidden] {
    display: none !important;
}

.ggfr-form {
    margin-top: 20px;
    padding: 20px;
    scroll-margin-top: 20px;

    border: 1px solid rgba(119,175,209,.24);
    border-radius: 17px;

    background: linear-gradient(
        145deg,
        rgba(48,83,110,.19),
        rgba(13,25,35,.58)
    );
}

.ggfr-form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 17px;
}

.ggfr-form h3 {
    font-size: 18px;
    margin: 5px 0;
    color: #eaf1f6;
}

.ggfr-form-grid {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 14px;
}

.ggfr-form-grid label {
    display: flex;
    flex-direction: column;
    gap: 8px;

    font-size: 11px;
    font-weight: 700;
    color: #b6c8d6;
    min-width: 0;
}

.ggfr-form-grid input[hidden] {
    display: none !important;
}

.ggfr-form input:focus,
.ggfr-form select:focus {
    border-color: #66a7cb;
    box-shadow: 0 0 0 2px rgba(102,167,203,.13);
}

.ggfr-check {
    display: flex !important;
    align-items: center;
    flex-direction: row !important;

    gap: 8px;
    padding-top: 23px;

    cursor: pointer;
}

.ggfr-check input {
    accent-color: #66a7cb;
    min-width: 18px;
    min-height: 18px;
}

.ggfr-note {
    font-size: 11px;
    color: #97afbd;
    line-height: 1.6;
    margin: 15px 0;
}

/* TABLET */

@media (max-width: 980px) {

    .ggfr-form-grid {
        grid-template-columns:
            repeat(2,minmax(0,1fr));
    }
}

/* CELULAR */

@media (max-width: 650px) {

    .ggfr-panel {
        padding: 13px !important;
    }

    .ggfr-form {
        padding: 13px;
    }

    .ggfr-form-grid {
        grid-template-columns: 1fr;
    }

    .ggfr-actions {
        width: 100%;
    }

    .ggfr-actions button {
        flex: 1;
    }

    .ggfr-filters input {
        min-width: 100%;
    }

    .ggfr-filters select {
        flex: 1;
    }

    .ggfr-filters strong {
        margin-left: 0;
    }

    .ggfr-heading h2 {
        font-size: 19px;
    }
}

`;

// ======================================================
// 3. COMPROBAR ARCHIVOS ORIGINALES
// ======================================================

const files = {};

for (const name of targets) {

    const loc = path.join(root, name);

    if (!fs.existsSync(loc)) {

        throw Error(
            `No se encontró ${name}. ` +
            "Coloca el instalador en la raíz " +
            "de desarrollo grupo."
        );
    }

    if (fs.existsSync(loc + ".bak")) {

        throw Error(
            `Ya existe ${name}.bak. ` +
            "No sobrescribiré respaldos."
        );
    }

    files[name] = fs.readFileSync(
        loc,
        "utf8"
    );
}

for (const name of [newJs, newCss]) {

    if (fs.existsSync(path.join(root, name))) {

        throw Error(
            `Ya existe ${name}. ` +
            "Evito instalar por duplicado."
        );
    }
}

if (files[targetHtml].includes(marker)) {

    throw Error(
        "El módulo ya está instalado."
    );
}

// ======================================================
// 4. LOCALIZAR PUNTOS DE INTEGRACIÓN
// ======================================================

const cssAnchor =
    '<link rel="stylesheet" href="css/finanzas-ajustes.css">';

const jsAnchor =
    '<script src="js/finanzas-graficas-fix.js"></script>';

const requestAnchor =
    "    function openNewRequestModal() {";

requireOne(
    files[targetHtml],
    cssAnchor,
    "hoja de estilos de Control Financiero"
);

requireOne(
    files[targetHtml],
    jsAnchor,
    "scripts de Control Financiero"
);

requireOne(
    files[targetRequest],
    requestAnchor,
    "abrir nueva solicitud de pago"
);

// ======================================================
// 5. CONECTAR CSS Y JS EN CONTROL FINANCIERO
// ======================================================

files[targetHtml] = files[targetHtml]

    .replace(
        cssAnchor,

        cssAnchor +
        '\n    <link rel="stylesheet" ' +
        'href="css/finanzas-reglas-admin.css">' +
        ' <!-- ' + marker + ' -->'
    )

    .replace(
        jsAnchor,

        jsAnchor +
        '\n    <script ' +
        'src="js/finanzas-reglas-admin.js"></script>'
    );

// ======================================================
// 6. ACTUALIZAR REGLAS AL ABRIR NUEVA SOLICITUD
//
// Así los usuarios ven los cambios sin editar
// manualmente solicitudes-pago.js.
// ======================================================

files[targetRequest] =
    files[targetRequest].replace(

        requestAnchor,

        `    async function openNewRequestModal() {

        // Consultar las reglas más recientes
        // antes de construir el formulario.

        try {

            await fin.loadRules();

        } catch (error) {

            console.error(
                "[FINANZAS] No se pudieron actualizar las reglas",
                error
            );

            fin.toast(
                "No se pudo actualizar el catálogo " +
                "de flujos. Intenta de nuevo.",
                true
            );

            return;
        }`
    );

// ======================================================
// 7. VALIDACIONES DE SINTAXIS
// ======================================================

new vm.Script(
    javascript,
    {
        filename: newJs
    }
);

new vm.Script(
    files[targetRequest],
    {
        filename: targetRequest
    }
);

if (
    !files[targetHtml].includes(marker) ||
    !files[targetHtml].includes(newJs)
) {

    throw Error(
        "No se pudieron enlazar correctamente " +
        "los archivos."
    );
}

// ======================================================
// 8. RESPALDO Y APLICACIÓN
// ======================================================

const created = [];

try {

    // Respaldar ANTES de modificar.

    for (const name of targets) {

        fs.copyFileSync(
            path.join(root, name),

            path.join(root, name) + ".bak",

            fs.constants.COPYFILE_EXCL
        );
    }

    // Crear nuevos archivos JS y CSS.

    fs.writeFileSync(
        path.join(root, newJs),
        javascript,
        {
            encoding: "utf8",
            flag: "wx"
        }
    );

    created.push(newJs);

    fs.writeFileSync(
        path.join(root, newCss),
        css,
        {
            encoding: "utf8",
            flag: "wx"
        }
    );

    created.push(newCss);

    // Aplicar cambios a archivos originales.

    for (const name of targets) {

        fs.writeFileSync(
            path.join(root, name),
            files[name],
            "utf8"
        );
    }

} catch (err) {

    // Restaurar ambos archivos originales.

    for (const name of targets) {

        const backup =
            path.join(root, name) + ".bak";

        if (fs.existsSync(backup)) {

            fs.copyFileSync(
                backup,
                path.join(root, name)
            );
        }
    }

    // Eliminar archivos nuevos incompletos.

    for (const name of created) {

        try {

            fs.unlinkSync(
                path.join(root, name)
            );

        } catch (_) {}
    }

    throw err;
}

// ======================================================
// 9. RESULTADO FINAL
// ======================================================

console.log(
    "✅ Control Financiero: nueva pestaña Catálogo de flujos"
);

console.log(
    "✅ Solicitudes de Pago: actualización de reglas al abrir Nueva solicitud"
);

console.log(
    "✅ JS y CSS independientes creados"
);

console.log(
    "✅ Respaldos .bak preparados para ambos originales"
);

console.log(
    "🔐 Recuerda instalar el SQL administrativo en Supabase."
);
