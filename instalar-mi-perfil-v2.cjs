
'use strict';

// =====================================================
// GRUPO GUTIÉRREZ
// MI PERFIL Y NOTIFICACIONES · INSTALADOR V2
//
// Colocar junto a sistema.html.
//
// SIN archivos .bak.
// CON validaciones y recuperación de errores.
// =====================================================

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;

const MARK = 'GG_MI_PERFIL_NOTIFICACIONES_V2';

const paths = {
  system: 'sistema.html',
  systemJs: 'js/sistema.js',
  systemCss: 'css/sistema.css',
  vite: 'vite.config.js',
  page: 'mi-perfil-notificaciones.html',
  css: 'css/mi-perfil-notificaciones.css',
  js: 'js/mi-perfil-notificaciones.js'
};

// =====================================================
// 1. HTML DEL MÓDULO
// =====================================================

const page = String.raw`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <title>Mi Perfil y Notificaciones · Grupo Gutiérrez</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">

  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  >

  <link rel="stylesheet" href="css/sistema.css">
  <link rel="stylesheet" href="css/mi-perfil-notificaciones.css">
</head>

<body class="gmp-page">

  <div class="atmosphere" aria-hidden="true">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>
    <div class="ambient ambient-three"></div>
    <div class="atmosphere-noise"></div>
  </div>

  <main class="gmp-wrap">

    <header class="gmp-top">

      <a class="gmp-brand" href="sistema.html">
        <b>GG✳</b>
        <span>
          GRUPO GUTIÉRREZ
          <small>SISTEMA CENTRAL</small>
        </span>
      </a>

      <div class="gmp-top-actions">

        <a class="gmp-btn" href="sistema.html">
          ← Volver a módulos
        </a>

        <button
          class="gmp-btn"
          type="button"
          id="gmpTheme"
        >
          ☀ Modo claro
        </button>

      </div>

    </header>

    <section class="gmp-hero">

      <span class="gmp-eyebrow">
        MI ESPACIO · SISTEMA CENTRAL
      </span>

      <h1>
        Mi Perfil <em>y Notificaciones</em>
      </h1>

      <p>
        Tu ficha de Recursos Humanos y todas tus
        notificaciones en un solo lugar.
      </p>

    </section>

    <div class="gmp-layout">

      <aside class="gmp-profile">

        <section class="gmp-card gmp-person">

          <div class="gmp-overline">
            IDENTIDAD DE LA SESIÓN
            <span class="gmp-online">● ACTIVA</span>
          </div>

          <div class="gmp-avatar">

            <img
              id="gmpPhoto"
              alt="Fotografía de RH"
              hidden
            >

            <span id="gmpInitials">GG</span>

          </div>

          <h2 id="gmpName">
            Cargando perfil…
          </h2>

          <p class="gmp-job" id="gmpJob">
            Consultando Recursos Humanos…
          </p>

          <span class="gmp-linked" id="gmpLinked">
            Verificando vinculación con RH
          </span>

          <div class="gmp-rule"></div>

          <div class="gmp-field">
            <small>CORREO DE LA CUENTA</small>
            <strong id="gmpEmail">Cargando…</strong>
          </div>

          <div class="gmp-field">
            <small>FECHA DE INGRESO</small>
            <strong id="gmpHire">—</strong>
          </div>

          <p class="gmp-note" id="gmpProfileNote">
            El nombre, puesto y fotografía se consultan
            a partir del correo vinculado por RH.
          </p>

        </section>

        <section class="gmp-card gmp-info">

          <span class="gmp-overline">
            CENTRO DE ACTIVIDAD
          </span>

          <h3>Tu espacio de trabajo</h3>

          <p>
            Este módulo está listo para recibir avisos
            y autorizaciones desde Finanzas, RH, Ventas
            y otros módulos.

            Las autorizaciones se completarán en
            su módulo de origen.
          </p>

        </section>

      </aside>

      <section class="gmp-card gmp-inbox">

        <div class="gmp-inbox-heading">

          <div>

            <span class="gmp-overline">
              CENTRO DE ACTIVIDAD
            </span>

            <h2>Notificaciones</h2>

            <p>
              Solo los avisos enviados a tu cuenta.
            </p>

          </div>

          <span class="gmp-unread" id="gmpUnread">
            0 sin leer
          </span>

        </div>

        <div class="gmp-kpis">

          <div>
            <b id="gmpTotal">0</b>
            <small>En el filtro</small>
          </div>

          <div>
            <b id="gmpUnreadCount">0</b>
            <small>Sin leer</small>
          </div>

          <div>
            <b id="gmpPending">0</b>
            <small>Autorizaciones pendientes</small>
          </div>

        </div>

        <div class="gmp-toolbar">

          <div class="gmp-tabs">

            <button
              class="active"
              type="button"
              data-gmp-tab="all"
            >
              Todas
            </button>

            <button
              type="button"
              data-gmp-tab="unread"
            >
              Sin leer
            </button>

            <button
              type="button"
              data-gmp-tab="approval"
            >
              Autorizaciones
            </button>

          </div>

          <div class="gmp-toolbar-actions">

            <button
              class="gmp-btn"
              type="button"
              id="gmpRefresh"
            >
              ↻ Actualizar
            </button>

            <button
              class="gmp-btn"
              type="button"
              id="gmpReadAll"
            >
              ✓ Marcar todas leídas
            </button>

          </div>

        </div>

        <div class="gmp-filters">

          <input
            id="gmpSearch"
            type="search"
            placeholder="Buscar aviso, contenido o módulo…"
            aria-label="Buscar notificaciones"
          >

          <label>
            Desde
            <input id="gmpFrom" type="date">
          </label>

          <label>
            Hasta
            <input id="gmpTo" type="date">
          </label>

        </div>

        <p
          id="gmpMessage"
          class="gmp-message"
          role="status"
        >
          Conectando con la bandeja…
        </p>

        <div class="gmp-list" id="gmpList"></div>

        <div class="gmp-foot">

          <span id="gmpPagination">—</span>

          <button
            class="gmp-btn"
            id="gmpMore"
            type="button"
            hidden
          >
            Mostrar más ↓
          </button>

        </div>

      </section>

    </div>

    <footer class="gmp-footer">
      GRUPO GUTIÉRREZ ✳ SISTEMA CENTRAL
      <span>Perfil privado · Notificaciones</span>
    </footer>

  </main>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase-client.js"></script>
  <script src="js/mi-perfil-notificaciones.js"></script>

</body>
</html>`;

// =====================================================
// 2. CSS COMPLETO DEL MÓDULO
// =====================================================

const css = String.raw`

/* GRUPO GUTIÉRREZ · MI PERFIL Y NOTIFICACIONES */

.gmp-page {
  --fg: #f4f7fa;
  --mut: #a0afbf;
  --surface: rgba(28,34,45,.86);
  --edge: rgba(220,233,247,.14);
  --input: #161e29;
  --tint: rgba(255,255,255,.04);
  --accent: #b9d8ef;
  --green: #a6e6c9;
  color: var(--fg);
}

.gmp-page .gmp-wrap {
  position: relative;
  z-index: 2;
  max-width: 1420px;
  margin: auto;
  padding: 0 clamp(16px,3.8vw,54px) 45px;
}

.gmp-top {
  min-height: 95px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid var(--edge);
}

.gmp-brand {
  display: flex;
  align-items: center;
  gap: 17px;
  text-decoration: none;
  color: var(--fg);
}

.gmp-brand > b {
  font: 800 27px Manrope,sans-serif;
  letter-spacing: -.08em;
}

.gmp-brand > span {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .09em;
}

.gmp-brand small {
  display: block;
  font-size: 9px;
  color: var(--mut);
  margin-top: 5px;
}

.gmp-top-actions,
.gmp-toolbar-actions {
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
}

.gmp-btn {
  border: 1px solid var(--edge);
  border-radius: 11px;
  padding: 10px 13px;
  background: var(--input);
  color: var(--fg);
  font: 750 11px 'DM Sans',sans-serif;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}

.gmp-btn:hover,
.gmp-tabs button:hover {
  background: var(--tint);
}

.gmp-btn:disabled {
  opacity: .5;
  cursor: default;
}

.gmp-hero {
  padding: 45px 0 34px;
}

.gmp-eyebrow,
.gmp-overline {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .15em;
  color: var(--mut);
}

.gmp-hero h1 {
  font: 800 clamp(29px,4.5vw,52px)/1.14 Manrope,sans-serif;
  letter-spacing: -.065em;
  margin: 12px 0;
}

.gmp-hero h1 em {
  font-style: normal;
  color: var(--accent);
}

.gmp-hero p {
  font-size: 13px;
  line-height: 1.6;
  color: var(--mut);
}

.gmp-layout {
  display: grid;
  grid-template-columns:
    minmax(260px,.85fr)
    minmax(0,1.65fr);
  gap: 22px;
  align-items: start;
}

.gmp-profile {
  display: grid;
  gap: 19px;
  min-width: 0;
}

.gmp-card {
  min-width: 0;
  border: 1px solid var(--edge);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: 0 20px 55px rgba(0,0,0,.18);
  backdrop-filter: blur(22px);
}

.gmp-person,
.gmp-inbox,
.gmp-info {
  padding: clamp(18px,2.3vw,29px);
}

.gmp-online {
  float: right;
  color: var(--green);
  letter-spacing: 0;
}

.gmp-avatar {
  width: 108px;
  height: 108px;
  border-radius: 28px;
  margin: 27px 0 19px;
  background: linear-gradient(135deg,#667f99,#2a405a);
  display: grid;
  place-items: center;
  overflow: hidden;
  color: white;
  font: 800 29px Manrope,sans-serif;
}

.gmp-avatar img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.gmp-avatar:has(img:not([hidden])) #gmpInitials {
  display: none;
}

.gmp-person h2 {
  font: 800 24px/1.3 Manrope,sans-serif;
  margin: 0 0 7px;
  overflow-wrap: anywhere;
}

.gmp-job {
  color: var(--accent);
  font-size: 13px;
  margin: 0 0 13px;
}

.gmp-linked {
  color: var(--green);
  font-size: 11px;
}

.gmp-rule {
  height: 1px;
  background: var(--edge);
  margin: 22px 0;
}

.gmp-field {
  display: grid;
  gap: 7px;
  margin-bottom: 17px;
}

.gmp-field small {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .08em;
  color: var(--mut);
}

.gmp-field strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}

.gmp-note,
.gmp-info p {
  font-size: 11px;
  line-height: 1.7;
  color: var(--mut);
}

.gmp-info h3 {
  font: 800 17px Manrope,sans-serif;
  margin: 12px 0;
}

.gmp-inbox-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.gmp-inbox-heading h2 {
  font: 800 27px Manrope,sans-serif;
  letter-spacing: -.04em;
  margin: 10px 0 5px;
}

.gmp-inbox-heading p {
  color: var(--mut);
  font-size: 12px;
}

.gmp-unread {
  white-space: nowrap;
  padding: 8px 11px;
  border: 1px solid var(--edge);
  border-radius: 99px;
  color: var(--green);
  font-size: 11px;
  font-weight: 800;
}

.gmp-kpis {
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  gap: 10px;
  margin: 23px 0;
}

.gmp-kpis > div {
  border: 1px solid var(--edge);
  border-radius: 13px;
  padding: 15px;
  background: var(--tint);
}

.gmp-kpis b {
  display: block;
  font: 800 24px Manrope,sans-serif;
}

.gmp-kpis small {
  color: var(--mut);
  font-size: 10px;
}

.gmp-toolbar {
  border-top: 1px solid var(--edge);
  padding: 16px 0;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.gmp-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.gmp-tabs button {
  border: 1px solid transparent;
  padding: 10px;
  border-radius: 10px;
  background: transparent;
  color: var(--mut);
  cursor: pointer;
  font-weight: 750;
  font-size: 11px;
}

.gmp-tabs button.active {
  border-color: var(--edge);
  background: var(--tint);
  color: var(--fg);
}

.gmp-filters {
  display: grid;
  grid-template-columns:
    minmax(0,1fr) 140px 140px;
  gap: 10px;
}

.gmp-filters label {
  display: grid;
  gap: 5px;
  color: var(--mut);
  font-size: 10px;
}

.gmp-filters input {
  min-width: 0;
  width: 100%;
  height: 41px;
  background: var(--input);
  color: var(--fg);
  border: 1px solid var(--edge);
  border-radius: 10px;
  padding: 8px 11px;
  font: 600 12px 'DM Sans',sans-serif;
}

.gmp-filters > input {
  align-self: end;
}

.gmp-filters :is(input,button):focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.gmp-message {
  min-height: 18px;
  color: var(--mut);
  font-size: 11px;
  line-height: 1.5;
  margin: 18px 0;
}

.gmp-message.error {
  color: #e4a29a;
}

.gmp-list {
  display: grid;
  gap: 10px;
  min-height: 80px;
}

.gmp-item {
  display: grid;
  grid-template-columns: 39px minmax(0,1fr);
  gap: 13px;
  padding: 16px;
  border: 1px solid var(--edge);
  border-radius: 14px;
  background: var(--tint);
}

.gmp-item.unread {
  border-color: var(--accent);
}

.gmp-item-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  background: rgba(121,166,204,.15);
  border-radius: 10px;
}

.gmp-item-meta {
  color: var(--mut);
  font-size: 10px;
}

.gmp-item-meta b {
  color: var(--accent);
}

.gmp-item h3 {
  font: 800 14px Manrope,sans-serif;
  margin: 8px 0;
}

.gmp-item p {
  color: var(--mut);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 0;
}

.gmp-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.gmp-item-actions button,
.gmp-item-actions a {
  display: inline-flex;
  border: 1px solid var(--edge);
  border-radius: 8px;
  background: var(--input);
  color: var(--accent);
  font: 750 11px 'DM Sans',sans-serif;
  padding: 7px 10px;
  text-decoration: none;
  cursor: pointer;
}

.gmp-item-actions small {
  color: var(--mut);
}

.gmp-empty {
  text-align: center;
  padding: 35px 12px;
  border: 1px dashed var(--edge);
  border-radius: 13px;
  color: var(--mut);
  font-size: 12px;
  line-height: 1.6;
}

.gmp-empty strong {
  display: block;
  color: var(--fg);
  margin: 10px 0;
  font-size: 16px;
}

.gmp-foot,
.gmp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--mut);
  font-size: 11px;
}

.gmp-foot {
  margin-top: 18px;
}

.gmp-footer {
  border-top: 1px solid var(--edge);
  padding-top: 25px;
  margin-top: 40px;
}

.gmp-page [hidden] {
  display: none !important;
}

/* MODO CLARO */

html[data-gmp-theme=light] {
  background: #eff5fa;
  color-scheme: light;
}

html[data-gmp-theme=light] .gmp-page {
  --fg: #253c53;
  --mut: #667e94;
  --surface: rgba(255,255,255,.93);
  --edge: rgba(74,107,135,.18);
  --input: #f4f9fe;
  --tint: rgba(203,224,241,.28);
  --accent: #366c96;
  --green: #2d805f;

  background:
    radial-gradient(
      ellipse at 50% -10%,
      #fff,
      #e6eff6 78%
    );

  color: var(--fg);
}

html[data-gmp-theme=light]
.gmp-page .atmosphere {
  opacity: .18;
}

/* RESPONSIVE */

@media (max-width:1000px) {
  .gmp-layout {
    grid-template-columns:
      300px minmax(0,1fr);
  }

  .gmp-filters {
    grid-template-columns: 1fr 1fr;
  }

  .gmp-filters > input {
    grid-column: 1 / -1;
  }
}

@media (max-width:760px) {
  .gmp-layout {
    grid-template-columns: 1fr;
  }

  .gmp-hero {
    padding: 30px 0;
  }

  .gmp-info {
    display: none;
  }
}

@media (max-width:520px) {
  .gmp-top {
    flex-wrap: wrap;
    padding: 15px 0;
  }

  .gmp-inbox-heading {
    flex-wrap: wrap;
  }

  .gmp-kpis > div {
    padding: 9px;
  }

  .gmp-kpis b {
    font-size: 20px;
  }

  .gmp-filters {
    grid-template-columns: 1fr 1fr;
  }

  .gmp-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;

// =====================================================
// 3. JAVASCRIPT DEL NAVEGADOR
//
// CORRECCIÓN FUNDAMENTAL:
//
// Este código se convierte a texto con .toString().
// Así evitamos anidar String.raw y romper la sintaxis.
// =====================================================

function browserApp() {

  'use strict';

  const db = window.ggSupabase;

  const $ = id =>
    document.getElementById(id);

  const set = (id, v) => {
    if ($(id)) {
      $(id).textContent = String(v ?? '');
    }
  };

  const esc = v =>
    String(v ?? '').replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c])
    );

  const fmt = v => {
    if (!v) return '—';

    const d = new Date(v);

    return Number.isNaN(+d)
      ? '—'
      : new Intl.DateTimeFormat(
          'es-MX',
          {
            dateStyle: 'medium',
            timeStyle: 'short'
          }
        ).format(d);
  };

  const initials = v => {
    const w = String(v || 'GG')
      .trim()
      .split(/\s+/);

    return (
      (w[0]?.[0] || 'G') +
      (
        w.length > 1
          ? w.at(-1)?.[0] || 'G'
          : w[0]?.[1] || 'G'
      )
    ).toUpperCase();
  };

  let filter = 'all';
  let page = 0;
  let busy = false;
  let requestVersion = 0;
  let debounce;

  // MENSAJES

  function note(v, error = false) {
    set('gmpMessage', v);

    $('gmpMessage').classList.toggle(
      'error',
      error
    );
  }

  // CAMBIO DE TEMA

  function theme(value) {

    const t =
      value === 'light' ? 'light' : 'dark';

    document.documentElement.dataset.gmpTheme = t;

    set(
      'gmpTheme',
      t === 'dark'
        ? '☀ Modo claro'
        : '☾ Modo oscuro'
    );

    try {
      localStorage.setItem(
        'gg-profile-theme',
        t
      );
    } catch (_) {
      // La preferencia es opcional.
    }
  }

  // ENLACES INTERNOS PERMITIDOS

  function safeRoute(value) {

    const s = String(value || '').trim();

    return /^[a-z0-9_-]+\.html(?:\?[a-zA-Z0-9_=&%+.-]{0,180})?(?:#[a-zA-Z0-9_-]{1,60})?$/i.test(s)
      ? s
      : null;
  }

  // RENDERIZADO DE NOTIFICACIONES

  function display(items, append = false) {

    const target = $('gmpList');

    if (!append) {
      target.replaceChildren();
    }

    if (!items.length && !append) {

      target.innerHTML = `
        <div class="gmp-empty">
          ✉

          <strong>
            Sin notificaciones
          </strong>

          Cuando otros módulos te envíen avisos,
          llegarán aquí.
        </div>
      `;

      return;
    }

    for (const item of items) {

      const route = safeRoute(item.action_url);

      const state =
        item.kind === 'approval'
          ? ' · ' +
            (
              item.decision_status === 'pending'
                ? 'Autorización pendiente'
                : item.decision_status || ''
            )
          : '';

      const node = document.createElement('article');

      node.className =
        'gmp-item' +
        (!item.read_at ? ' unread' : '');

      node.innerHTML = `
        <div class="gmp-item-icon" aria-hidden="true">
          ${
            item.kind === 'approval'
              ? '◈'
              : item.kind === 'alert'
                ? '!'
                : '✦'
          }
        </div>

        <div>

          <div class="gmp-item-meta">
            <b>${esc(item.source_module)}</b>

            · ${esc(fmt(item.created_at))}

            ${
              item.priority === 'high'
                ? ' · PRIORITARIA'
                : ''
            }
          </div>

          <h3>${esc(item.title)}</h3>

          <p>${esc(item.body)}</p>

          <div class="gmp-item-actions">

            ${
              route
                ? `
                  <a
                    href="${esc(route)}"
                    data-gmp-open="${esc(item.id)}"
                  >
                    ${
                      esc(
                        item.action_label ||
                        'Ver en el módulo'
                      )
                    }
                    ↗
                  </a>
                `
                : ''
            }

            <button
              type="button"
              data-gmp-mark="${esc(item.id)}"
              data-read="${!item.read_at ? 'yes' : 'no'}"
            >
              ${
                item.read_at
                  ? 'Marcar no leída'
                  : 'Marcar leída'
              }
            </button>

            <small>${esc(state)}</small>

          </div>
        </div>
      `;

      target.append(node);
    }
  }

  // CONSULTAR BANDEJA

  async function load(reset = true) {

    if (busy) return;

    if (reset) {
      page = 0;
    }

    busy = true;

    const current = ++requestVersion;

    $('gmpRefresh').disabled = true;
    $('gmpMore').disabled = true;

    note('Consultando tu bandeja…');

    try {

      const { data, error } = await db.rpc(
        'gg_my_notifications',
        {
          p_filter: filter,

          p_search:
            $('gmpSearch').value.trim(),

          p_from:
            $('gmpFrom').value || null,

          p_to:
            $('gmpTo').value || null,

          p_page: page
        }
      );

      if (error) {
        throw error;
      }

      if (current !== requestVersion) {
        return;
      }

      const items =
        Array.isArray(data?.items)
          ? data.items
          : [];

      const total =
        Number(data?.total) || 0;

      const unread =
        Number(data?.unread_count) || 0;

      display(items, !reset);

      set('gmpTotal', total);

      set('gmpUnreadCount', unread);

      set('gmpUnread', unread + ' sin leer');

      set(
        'gmpPending',
        Number(data?.pending_count) || 0
      );

      set(
        'gmpPagination',
        `${Math.min((page + 1) * 30, total)} de ${total}`
      );

      $('gmpMore').hidden =
        (page + 1) * 30 >= total;

      $('gmpReadAll').disabled =
        unread === 0;

      note(
        total
          ? 'Bandeja actualizada.'
          : 'Todavía no tienes notificaciones para este filtro.'
      );

    } catch (e) {

      console.error(
        '[GG Perfil / Notificaciones]',
        e
      );

      note(
        'No se pudo consultar la bandeja: ' +
        (e.message || e),
        true
      );

    } finally {

      busy = false;

      $('gmpRefresh').disabled = false;
      $('gmpMore').disabled = false;
    }
  }

  // PERFIL VINCULADO A RH

  async function profile() {

    const { data, error } =
      await db.auth.getUser();

    if (error || !data?.user) {

      window.location.replace('index.html');

      return false;
    }

    const email = data.user.email || '';

    set('gmpEmail', email);

    set(
      'gmpInitials',
      initials(email.split('@')[0])
    );

    try {

      const { data: hr, error: hrError } =
        await db.rpc('lo_my_hr_card');

      if (hrError) {
        throw hrError;
      }

      if (!hr) {

        set(
          'gmpName',
          'Sin empleado vinculado'
        );

        set(
          'gmpJob',
          'RH debe vincular este correo'
        );

        set(
          'gmpLinked',
          'Pendiente de Recursos Humanos'
        );

        return true;
      }

      const name =
        hr.full_name || 'Empleado';

      set('gmpName', name);

      set('gmpInitials', initials(name));

      set(
        'gmpJob',
        hr.position || 'Puesto por registrar'
      );

      set(
        'gmpLinked',
        '✓ Vinculado a Recursos Humanos'
      );

      const hire =
        hr.imss_entry_date ||
        hr.seniority_date;

      set(
        'gmpHire',
        hire
          ? String(hire)
              .slice(0, 10)
              .split('-')
              .reverse()
              .join('/')
          : 'Sin registrar'
      );

      if (hr.photo_path) {

        const { data: pic } = db.storage
          .from('employee-photos')
          .getPublicUrl(hr.photo_path);

        if (pic?.publicUrl) {

          const img = $('gmpPhoto');

          img.onload = () => {
            img.hidden = false;
          };

          img.onerror = () => {
            img.hidden = true;
          };

          img.src = pic.publicUrl;
        }
      }

    } catch (e) {

      console.error('[Perfil RH]', e);

      set(
        'gmpName',
        'Perfil RH no disponible'
      );

      set(
        'gmpJob',
        'La sesión sigue activa'
      );

      set(
        'gmpLinked',
        'Error de consulta a RH'
      );
    }

    return true;
  }

  // MARCAR NOTIFICACIÓN

  async function mark(id, read) {

    try {

      const { data, error } = await db.rpc(
        'gg_notification_mark_read',
        {
          p_notification_id: id,
          p_read: read
        }
      );

      if (error) {
        throw error;
      }

      if (!data) {
        throw Error(
          'Notificación no encontrada'
        );
      }

      await load(true);

    } catch (e) {

      note(
        'No se pudo cambiar la lectura: ' +
        e.message,
        true
      );
    }
  }

  // INICIALIZACIÓN

  async function init() {

    if (!db) {

      note(
        'Supabase no está disponible.',
        true
      );

      return;
    }

    let saved = 'dark';

    try {

      saved =
        localStorage.getItem(
          'gg-profile-theme'
        ) || 'dark';

    } catch (_) {
      // Usar tema oscuro por defecto.
    }

    theme(saved);

    $('gmpTheme').addEventListener(
      'click',
      () => theme(
        document.documentElement.dataset.gmpTheme === 'dark'
          ? 'light'
          : 'dark'
      )
    );

    if (!(await profile())) {
      return;
    }

    // PESTAÑAS

    document
      .querySelectorAll('[data-gmp-tab]')
      .forEach(btn => {

        btn.addEventListener(
          'click',
          () => {

            filter = btn.dataset.gmpTab;

            document
              .querySelectorAll('[data-gmp-tab]')
              .forEach(x => {

                x.classList.toggle(
                  'active',
                  x === btn
                );
              });

            load(true);
          }
        );
      });

    // ACTUALIZACIÓN

    $('gmpRefresh').addEventListener(
      'click',
      () => load(true)
    );

    // PAGINACIÓN

    $('gmpMore').addEventListener(
      'click',
      () => {

        page++;

        load(false);
      }
    );

    // BÚSQUEDA

    $('gmpSearch').addEventListener(
      'input',
      () => {

        clearTimeout(debounce);

        debounce = setTimeout(
          () => load(true),
          300
        );
      }
    );

    // FECHAS

    ['gmpFrom', 'gmpTo'].forEach(
      id => {

        $(id).addEventListener(
          'change',
          () => load(true)
        );
      }
    );

    // ACCIONES DE LOS AVISOS

    $('gmpList').addEventListener(
      'click',
      e => {

        const btn = e.target.closest(
          '[data-gmp-mark]'
        );

        if (btn) {

          mark(
            btn.dataset.gmpMark,
            btn.dataset.read === 'yes'
          );
        }

        const a = e.target.closest(
          '[data-gmp-open]'
        );

        if (a) {

          db.rpc(
            'gg_notification_mark_read',
            {
              p_notification_id:
                a.dataset.gmpOpen,

              p_read: true
            }
          ).then(() => {});
        }
      }
    );

    // MARCAR TODAS

    $('gmpReadAll').addEventListener(
      'click',
      async () => {

        $('gmpReadAll').disabled = true;

        try {

          const { error } = await db.rpc(
            'gg_notification_mark_all_read'
          );

          if (error) {
            throw error;
          }

          await load(true);

        } catch (e) {

          note(
            'No se pudieron marcar todas: ' +
            e.message,
            true
          );

        } finally {

          $('gmpReadAll').disabled = false;
        }
      }
    );

    // ACTUALIZAR AL REGRESAR

    document.addEventListener(
      'visibilitychange',
      () => {

        if (!document.hidden) {
          load(true);
        }
      }
    );

    db.auth.onAuthStateChange(
      event => {

        if (event === 'SIGNED_OUT') {
          location.replace('index.html');
        }
      }
    );

    await load(true);
  }

  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      () => init().catch(
        e => note(e.message, true)
      ),
      { once: true }
    );

  } else {

    init().catch(
      e => note(e.message, true)
    );
  }
}

// =====================================================
// 4. GENERAR JS SIN ANIDAR TEMPLATE LITERALS
// =====================================================

const js =
  '(' + browserApp.toString() + ')();\n';

// Validar el JS generado inmediatamente.

new vm.Script(
  js,
  {
    filename: paths.js
  }
);

// =====================================================
// 5. VALIDAR LOS ARCHIVOS DEL PROYECTO
// =====================================================

const required = [
  paths.system,
  paths.systemJs,
  paths.systemCss,
  paths.vite
];

const additions = [
  paths.page,
  paths.css,
  paths.js
];

for (const f of required) {

  if (!fs.existsSync(path.join(root, f))) {

    throw Error(
      'Falta ' + f +
      '. Coloca el .cjs en la raíz de Grupo Gutiérrez.'
    );
  }
}

for (const f of additions) {

  if (fs.existsSync(path.join(root, f))) {

    throw Error(
      'Ya existe ' + f +
      '. No lo sobrescribiré.'
    );
  }
}

// =====================================================
// 6. LEER ARCHIVOS ACTUALES
// =====================================================

const source = new Map();
const modified = new Map();

for (const f of required) {

  const value = fs.readFileSync(
    path.join(root, f),
    'utf8'
  );

  if (value.includes(MARK)) {

    throw Error(
      'El módulo ya está instalado en ' + f
    );
  }

  source.set(f, value);

  modified.set(
    f,
    value.replace(/\r\n/g, '\n')
  );
}

// =====================================================
// 7. FUNCIÓN DE REEMPLAZO VALIDADO
// =====================================================

function replace(f, re, value, name) {

  const data = modified.get(f);

  const flags =
    re.flags.includes('g')
      ? re.flags
      : re.flags + 'g';

  const hits = [
    ...data.matchAll(
      new RegExp(re.source, flags)
    )
  ];

  if (hits.length !== 1) {

    throw Error(
      name +
      ': esperaba 1 coincidencia, encontré ' +
      hits.length +
      '. Sin archivos modificados.'
    );
  }

  modified.set(
    f,
    data.replace(re, value)
  );
}

// =====================================================
// 8. NUEVA TARJETA EN SISTEMA.HTML
// =====================================================

const card = String.raw`

        <!-- GG_MI_PERFIL_NOTIFICACIONES_V2 -->

        <div
          class="module-shell slot-profile-notif"
          style="--delay:.42s"
        >

          <button
            class="module-card card-profile-notif"
            type="button"
            data-module="mi-perfil-notificaciones"
          >

            <span class="card-top">

              <span class="card-icon">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >

                  <circle cx="12" cy="8" r="3"/>

                  <path d="M5 20a7 7 0 0 1 14 0M18 4h3v3M21 4l-4 4"/>

                </svg>

              </span>

              <span class="card-serial">
                07 / 07
              </span>

            </span>

            <span class="card-content">

              <span class="card-eyebrow">
                TU ESPACIO · NOTIFICACIONES
              </span>

              <strong class="card-title">
                mi perfil y notificaciones
              </strong>

              <span class="card-description">
                Tu ficha laboral, avisos y autorizaciones
                pendientes en un solo lugar.
              </span>

            </span>

            <span class="card-footer">

              <span class="card-meta">
                PERSONAL · ACTIVIDAD
              </span>

              <span class="card-arrow">
                ↗
              </span>

            </span>

          </button>

        </div>
`;

replace(
  paths.system,

  /(\s*)<\/div>\s*<\/section>\s*<footer class="site-footer">/,

  (all, space) =>
    '\n' +
    card +
    space +
    '</div>\n    </section>\n\n    <footer class="site-footer">',

  'Tarjeta antes del pie'
);

replace(
  paths.system,

  /· 06 módulos/,

  '· 07 módulos',

  'Contador'
);

let sys = modified.get(paths.system);

if (
  (sys.match(/0[1-6] \/ 06/g) || []).length !== 6
) {

  throw Error(
    'No se encontraron las seis tarjetas originales.'
  );
}

sys = sys.replace(
  /(0[1-6]) \/ 06/g,
  '$1 / 07'
);

modified.set(
  paths.system,
  sys
);

// =====================================================
// 9. REGISTRAR LA RUTA EN SISTEMA.JS
// =====================================================

replace(
  paths.systemJs,

  /\s+cobranza:\s*\{/,

  `
    "mi-perfil-notificaciones": {
      name: "Mi Perfil y Notificaciones",
      url: "mi-perfil-notificaciones.html"
    },

    cobranza: {`,

  'Ruta de sistema.js'
);

// =====================================================
// 10. ESTILO DE LA TARJETA DEL DASHBOARD
// =====================================================

modified.set(
  paths.systemCss,

  modified.get(paths.systemCss) + String.raw`

/* GG_MI_PERFIL_NOTIFICACIONES_V2 */

.slot-profile-notif {
  grid-column: span 12;
  min-height: 180px;
}

.card-profile-notif {
  background:
    radial-gradient(
      ellipse at 92% 28%,
      rgba(140,185,224,.18),
      transparent 48%
    ),
    linear-gradient(
      110deg,
      rgba(255,255,255,.09),
      rgba(255,255,255,.02)
    ),
    rgba(34,43,52,.26);
}

.card-profile-notif .card-title {
  font-size: clamp(22px,2.5vw,32px);
}

@media (max-width:1040px) {

  .slot-profile-notif {
    grid-column: span 12 !important;
  }
}
`
);

// =====================================================
// 11. REGISTRAR NUEVA PÁGINA EN VITE
// =====================================================

replace(
  paths.vite,

  /(\byo\s*:\s*resolve\s*\(\s*__dirname\s*,\s*["']yo\.html["']\s*\))/,

  '$1,\n\n' +
  '                miPerfilNotificaciones: ' +
  'resolve(__dirname, "mi-perfil-notificaciones.html")',

  'Entrada Vite'
);

// =====================================================
// 12. VALIDACIONES FINALES
// =====================================================

new vm.Script(
  modified.get(paths.systemJs),
  {
    filename: paths.systemJs
  }
);

if (

  !modified.get(paths.system).includes(
    'data-module="mi-perfil-notificaciones"'
  )

  ||

  !modified.get(paths.vite).includes(
    'mi-perfil-notificaciones.html'
  )

) {

  throw Error(
    'Validación HTML/Vite fallida.'
  );
}

// =====================================================
// 13. ESCRIBIR SIN GENERAR RESPALDOS .BAK
//
// Se guardan originales únicamente en memoria.
// Si falla la instalación, se intenta restaurar.
// =====================================================

const created = [];
const written = [];

try {

  // Crear los tres archivos nuevos.

  for (const [name, content] of [

    [paths.page, page],
    [paths.css, css],
    [paths.js, js]

  ]) {

    const dest = path.join(root, name);

    fs.mkdirSync(
      path.dirname(dest),
      {
        recursive: true
      }
    );

    fs.writeFileSync(
      dest,
      content,
      {
        flag: 'wx'
      }
    );

    created.push(dest);
  }

  // Modificar los archivos existentes.

  for (const [name, content] of modified) {

    const old = source.get(name);

    const ending =
      old.includes('\r\n')
        ? '\r\n'
        : '\n';

    written.push(name);

    fs.writeFileSync(
      path.join(root, name),
      content.replace(/\n/g, ending),
      'utf8'
    );
  }

} catch (error) {

  // Revertir archivos modificados.

  for (const name of written.reverse()) {

    try {

      fs.writeFileSync(
        path.join(root, name),
        source.get(name),
        'utf8'
      );

    } catch (e) {

      console.error(
        'Restauración falló:',
        name,
        e.message
      );
    }
  }

  // Eliminar archivos nuevos incompletos.

  for (const file of created.reverse()) {

    try {

      fs.rmSync(
        file,
        {
          force: true
        }
      );

    } catch (e) {

      console.error(
        'Limpieza falló:',
        file,
        e.message
      );
    }
  }

  throw error;
}

// =====================================================
// 14. RESULTADO
// =====================================================

console.log(
  '\n✅ Mi Perfil y Notificaciones instalado.'
);

console.log(
  '✅ Tarjeta agregada a sistema.html.'
);

console.log(
  '✅ Ruta agregada a sistema.js.'
);

console.log(
  '✅ HTML, CSS y JS nuevos creados.'
);

console.log(
  '✅ Tema claro/oscuro incluido.'
);

console.log(
  '✅ Página registrada en Vite.'
);

console.log(
  '✅ Sin respaldos .bak.'
);

console.log(
  '\nEjecuta npm run dev y luego npm run build.'
);
