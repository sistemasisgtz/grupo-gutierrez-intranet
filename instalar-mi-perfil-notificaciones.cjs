
'use strict';

// =====================================================
// GRUPO GUTIÉRREZ
// MI PERFIL Y NOTIFICACIONES
//
// Ejecutar junto a sistema.html.
//
// Requiere ejecutar primero el SQL en Supabase.
//
// CREA:
//   mi-perfil-notificaciones.html
//   css/mi-perfil-notificaciones.css
//   js/mi-perfil-notificaciones.js
//
// MODIFICA:
//   sistema.html
//   js/sistema.js
//   css/sistema.css
//   vite.config.js
//
// RESPALDOS + VALIDACIONES + ROLLBACK
// =====================================================

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;

const MARK =
  'GG_MODULO_PERFIL_NOTIFICACIONES_20261027';

const files = {
  dashboard: 'sistema.html',
  systemJS: 'js/sistema.js',
  systemCSS: 'css/sistema.css',
  vite: 'vite.config.js',
  page: 'mi-perfil-notificaciones.html',
  css: 'css/mi-perfil-notificaciones.css',
  js: 'js/mi-perfil-notificaciones.js'
};

// =====================================================
// 1. PÁGINA DEL NUEVO MÓDULO
// =====================================================

const page = String.raw`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport"
        content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#08090c">

  <title>
    Mi Perfil y Notificaciones · Grupo Gutiérrez
  </title>

  <link rel="preconnect"
        href="https://fonts.googleapis.com">

  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  >

  <link rel="stylesheet" href="css/sistema.css">

  <link
    rel="stylesheet"
    href="css/mi-perfil-notificaciones.css"
  >
</head>

<body class="gg-inbox-page">

  <div class="atmosphere" aria-hidden="true">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>
    <div class="ambient ambient-three"></div>
    <div class="atmosphere-noise"></div>
  </div>

  <main class="gni-wrap">

    <header class="gni-header">

      <a class="gni-brand" href="sistema.html">

        <span class="gni-mark">
          GG<span>✳</span>
        </span>

        <span class="gni-brand-divider"></span>

        <span>
          <strong>Grupo Gutiérrez</strong>
          <small>SISTEMA CENTRAL</small>
        </span>

      </a>

      <div class="gni-header-actions">

        <a href="sistema.html"
           class="gni-button gni-back">
          ← Módulos
        </a>

        <button
          id="gniTheme"
          type="button"
          class="gni-button"
          aria-label="Cambiar entre tema claro y oscuro"
        >
          ☼ Modo claro
        </button>

      </div>

    </header>

    <section class="gni-intro">

      <div>

        <div class="gni-kicker">
          <span class="gni-pulse"></span>
          ESPACIO PERSONAL · GRUPO GUTIÉRREZ
        </div>

        <h1>
          Mi perfil <em>y notificaciones.</em>
        </h1>

        <p>
          Tu identidad laboral y una bandeja central
          para avisos, seguimiento y futuras
          autorizaciones de los módulos.
        </p>

      </div>

      <div class="gni-intro-number" aria-hidden="true">
        01 / PERFIL
      </div>

    </section>

    <div class="gni-layout">

      <aside class="gni-profile-col">

        <section
          class="gni-card gni-person-card"
          aria-labelledby="gniProfileTitle"
        >

          <div class="gni-card-overline">

            IDENTIDAD DE LA SESIÓN

            <span class="gni-live">
              ● ACTIVA
            </span>

          </div>

          <div class="gni-person-top">

            <div class="gni-avatar" id="gniAvatar">

              <img
                id="gniPhoto"
                alt="Fotografía del empleado"
                hidden
              >

              <span id="gniInitials">
                GG
              </span>

            </div>

            <span
              class="gni-link-status"
              id="gniLinked"
            >
              Consultando RH…
            </span>

          </div>

          <h2 id="gniProfileTitle">
            <span id="gniName">
              Cargando perfil…
            </span>
          </h2>

          <p class="gni-job" id="gniJob">
            Validando puesto…
          </p>

          <div class="gni-separator"></div>

          <div class="gni-profile-field">

            <small>
              CORREO DE LA CUENTA
            </small>

            <strong id="gniEmail">
              Cargando…
            </strong>

          </div>

          <div class="gni-profile-field">

            <small>
              FECHA DE INGRESO RH
            </small>

            <strong id="gniHire">
              —
            </strong>

          </div>

          <p
            class="gni-person-note"
            id="gniProfileNote"
          >
            Los datos se consultan desde Recursos
            Humanos según el usuario que inició sesión.
          </p>

        </section>

        <section class="gni-card gni-tip">

          <div class="gni-card-overline">
            MI CENTRO
          </div>

          <h3>
            Todo en un solo lugar.
          </h3>

          <p>
            Las alertas se dirigen a tu cuenta,
            no al dispositivo. Al recibirlas
            desde otros módulos aparecerán aquí.
          </p>

          <div class="gni-flow">
            <span>Ventas</span>
            <span>RH</span>
            <span>Solicitudes</span>
            <span>Finanzas</span>
            <span>Otros</span>
          </div>

        </section>

      </aside>

      <section
        class="gni-inbox-col"
        aria-labelledby="gniInboxTitle"
      >

        <div class="gni-card gni-inbox-card">

          <div class="gni-inbox-head">

            <div>

              <div class="gni-card-overline">
                CENTRO DE ACTIVIDAD
              </div>

              <h2 id="gniInboxTitle">
                Bandeja de notificaciones
              </h2>

              <p>
                Avisos y solicitudes de autorización
                destinados a tu cuenta.
              </p>

            </div>

            <div
              class="gni-unread-pill"
              id="gniUnread"
            >
              0 sin leer
            </div>

          </div>

          <div class="gni-metrics">

            <div>
              <span id="gniTotal">0</span>
              <small>En el filtro</small>
            </div>

            <div>
              <span id="gniUnreadMetric">0</span>
              <small>Sin leer</small>
            </div>

            <div>
              <span id="gniPending">0</span>
              <small>Autorizaciones pendientes</small>
            </div>

          </div>

          <div class="gni-toolbar">

            <div
              class="gni-tabs"
              role="group"
              aria-label="Tipo de notificaciones"
            >

              <button
                type="button"
                data-gni-filter="all"
                class="active"
              >
                Todas
              </button>

              <button
                type="button"
                data-gni-filter="unread"
              >
                Sin leer
              </button>

              <button
                type="button"
                data-gni-filter="approval"
              >
                Autorizaciones
              </button>

            </div>

            <div class="gni-actions">

              <button
                id="gniRefresh"
                type="button"
                class="gni-button"
              >
                ↻ Actualizar
              </button>

              <button
                id="gniReadAll"
                type="button"
                class="gni-button"
              >
                ✓ Marcar todas leídas
              </button>

            </div>

          </div>

          <div class="gni-filter-row">

            <label class="gni-search">

              <span class="sr-only">
                Buscar notificaciones
              </span>

              <input
                type="search"
                id="gniSearch"
                placeholder="Buscar título, contenido o módulo…"
              >

            </label>

            <label class="gni-date">

              <span>Desde</span>

              <input type="date" id="gniFrom">

            </label>

            <label class="gni-date">

              <span>Hasta</span>

              <input type="date" id="gniTo">

            </label>

          </div>

          <p
            class="gni-feedback"
            id="gniFeedback"
            role="status"
          >
            Conectando con tus notificaciones…
          </p>

          <div
            class="gni-notification-list"
            id="gniList"
            aria-live="polite"
          ></div>

          <div class="gni-bottom">

            <span id="gniPageText">
              —
            </span>

            <button
              type="button"
              class="gni-button"
              id="gniMore"
              hidden
            >
              Mostrar más ↓
            </button>

          </div>

        </div>

        <div class="gni-footnote">
          Las autorizaciones se resuelven en su módulo
          de origen. Esta bandeja informa, marca lecturas
          y permite ir a la solicitud cuando existe una ruta.
        </div>

      </section>

    </div>

    <footer class="gni-footer">

      <span>
        GRUPO GUTIÉRREZ ✳ SISTEMA CENTRAL
      </span>

      <span>
        Mi espacio · privado
      </span>

    </footer>

  </main>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase-client.js"></script>
  <script src="js/mi-perfil-notificaciones.js"></script>

</body>
</html>`;

// =====================================================
// 2. CSS DEL NUEVO MÓDULO
// =====================================================

const css = String.raw`

/* =====================================================
   GRUPO GUTIÉRREZ
   PERFIL Y NOTIFICACIONES · GLASS ATELIER
===================================================== */

.gg-inbox-page {
  --n-ink: #f5f7fb;
  --n-muted: #a1acbc;
  --n-surface: rgba(26,31,41,.83);
  --n-border: rgba(218,230,246,.13);
  --n-control: #171e28;
  --n-control-border: rgba(211,228,248,.17);
  --n-tint: rgba(255,255,255,.035);
  --n-hover: rgba(255,255,255,.075);
  --n-accent: #bad7ef;
  --n-good: #9ddcbd;
  --n-warning: #edc99a;
  --n-shadow: 0 26px 65px rgba(0,0,0,.25);

  color: var(--n-ink);
}

.gg-inbox-page .gni-wrap {
  position: relative;
  z-index: 2;
  max-width: 1370px;
  margin: auto;
  padding: 0 clamp(18px,4vw,50px) 35px;
}

.gg-inbox-page .gni-header {
  min-height: 98px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid var(--n-border);
}

.gni-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.gni-mark {
  font: 800 29px Manrope,sans-serif;
  letter-spacing: -.12em;
}

.gni-mark span {
  font-size: 12px;
  vertical-align: top;
  margin-left: 6px;
  color: #d8b999;
}

.gni-brand-divider {
  width: 1px;
  height: 30px;
  background: var(--n-border);
}

.gni-brand > span:last-child {
  display: grid;
  gap: 4px;
}

.gni-brand strong {
  font-size: 13px;
}

.gni-brand small {
  font-size: 9px;
  letter-spacing: .2em;
  color: var(--n-muted);
  font-weight: 800;
}

.gni-header-actions,
.gni-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.gni-button {
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 5px;

  background: var(--n-control);
  border: 1px solid var(--n-control-border);
  color: var(--n-ink);

  border-radius: 12px;
  padding: 10px 13px;

  font-size: 12px;
  font-weight: 750;
  text-decoration: none;

  transition:
    background .2s,
    border-color .2s;
}

.gni-button:hover {
  background: var(--n-hover);
  border-color: var(--n-accent);
}

.gni-button:disabled {
  opacity: .48;
  cursor: not-allowed;
}

/* INTRO */

.gni-intro {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 20px;
  padding: 52px 0 36px;
}

.gni-kicker,
.gni-card-overline {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .16em;
  color: var(--n-muted);
}

.gni-pulse {
  display: inline-block;
  background: var(--n-good);
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: 0 0 13px #77cbb38a;
  margin-right: 8px;
}

.gni-intro h1 {
  font: 800 clamp(30px,4.3vw,55px)/1.16 Manrope,sans-serif;
  letter-spacing: -.065em;
  margin: 15px 0;
}

.gni-intro h1 em {
  font-style: normal;
  color: var(--n-accent);
}

.gni-intro p {
  color: var(--n-muted);
  font-size: 13px;
  line-height: 1.7;
  max-width: 660px;
  margin: 0;
}

.gni-intro-number {
  font-size: 10px;
  letter-spacing: .12em;
  color: var(--n-muted);
  white-space: nowrap;
}

/* LAYOUT */

.gni-layout {
  display: grid;
  grid-template-columns:
    minmax(260px,.85fr)
    minmax(0,1.75fr);

  align-items: start;
  gap: 21px;
}

.gni-profile-col,
.gni-inbox-col {
  min-width: 0;
  display: grid;
  gap: 19px;
}

.gni-card {
  border: 1px solid var(--n-border);
  border-radius: 26px;
  background: var(--n-surface);
  box-shadow: var(--n-shadow);

  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
}

/* PERFIL */

.gni-person-card {
  padding: 27px;
}

.gni-card-overline {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.gni-live {
  color: var(--n-good);
  letter-spacing: .07em;
}

.gni-person-top {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 10px;
  margin: 30px 0 22px;
}

.gni-avatar {
  position: relative;
  display: grid;
  place-items: center;

  width: 112px;
  height: 112px;

  border-radius: 30px;
  border: 1px solid var(--n-border);

  background: linear-gradient(
    140deg,
    #657d91,
    #263749
  );

  font: 800 33px Manrope,sans-serif;
  color: #fff;

  overflow: hidden;
  box-shadow: 0 12px 24px #04080f29;
}

.gni-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gni-avatar img:not([hidden]) + #gniInitials {
  display: none;
}

.gni-link-status {
  max-width: 152px;
  font-size: 10px;
  line-height: 1.5;
  text-align: right;
  color: var(--n-muted);
}

.gni-link-status.ok {
  color: var(--n-good);
}

.gni-person-card h2 {
  font: 800 clamp(19px,2vw,27px)/1.25 Manrope,sans-serif;
  letter-spacing: -.03em;
  margin: 0 0 8px;
  overflow-wrap: anywhere;
}

.gni-job {
  font-size: 13px;
  color: var(--n-accent);
  margin: 0;
}

.gni-separator {
  height: 1px;
  background: var(--n-border);
  margin: 23px 0;
}

.gni-profile-field {
  display: grid;
  gap: 7px;
  margin-bottom: 20px;
}

.gni-profile-field small {
  color: var(--n-muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .1em;
}

.gni-profile-field strong {
  font-size: 13px;
  line-height: 1.5;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.gni-person-note {
  border-top: 1px solid var(--n-border);
  padding-top: 15px;
  margin: 0;

  color: var(--n-muted);
  font-size: 11px;
  line-height: 1.7;
}

.gni-tip {
  padding: 24px 26px;
}

.gni-tip h3 {
  font: 800 18px Manrope,sans-serif;
  margin: 17px 0 8px;
}

.gni-tip p {
  font-size: 12px;
  color: var(--n-muted);
  line-height: 1.65;
}

.gni-flow {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.gni-flow span {
  font-size: 10px;
  padding: 7px 9px;
  border: 1px solid var(--n-border);
  border-radius: 99px;

  color: var(--n-accent);
  background: var(--n-tint);
}

/* BANDEJA */

.gni-inbox-card {
  overflow: hidden;
  padding: 25px;
}

.gni-inbox-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.gni-inbox-head h2 {
  font: 800 clamp(21px,2.3vw,29px) Manrope,sans-serif;
  letter-spacing: -.045em;
  margin: 10px 0 7px;
}

.gni-inbox-head p {
  font-size: 12px;
  color: var(--n-muted);
  line-height: 1.6;
  margin: 0;
}

.gni-unread-pill {
  flex: none;
  font-size: 11px;
  color: var(--n-good);

  padding: 8px 11px;
  border-radius: 99px;
  border: 1px solid var(--n-border);
  background: var(--n-tint);

  font-weight: 800;
}

/* INDICADORES */

.gni-metrics {
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  gap: 8px;
  margin: 25px 0;
}

.gni-metrics > div {
  padding: 15px 17px;
  border-radius: 14px;

  background: var(--n-tint);
  border: 1px solid var(--n-border);
}

.gni-metrics span {
  display: block;
  font: 800 26px Manrope,sans-serif;
}

.gni-metrics small {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: var(--n-muted);
}

/* FILTROS */

.gni-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  border-top: 1px solid var(--n-border);
  padding: 18px 0;
}

.gni-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gni-tabs button {
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: var(--n-muted);

  font-weight: 800;
  font-size: 11px;
  padding: 10px 11px;
  border-radius: 11px;
}

.gni-tabs button.active {
  color: var(--n-ink);
  border-color: var(--n-border);
  background: var(--n-hover);
}

.gni-tabs button:hover {
  color: var(--n-ink);
}

.gni-filter-row {
  display: grid;
  grid-template-columns:
    minmax(0,1fr)
    140px
    140px;

  gap: 10px;
}

.gni-filter-row input {
  width: 100%;
  height: 42px;
  border: 1px solid var(--n-control-border);
  border-radius: 11px;

  padding: 10px 12px;

  color: var(--n-ink);
  background: var(--n-control);
  font: 600 12px 'DM Sans',sans-serif;
  outline: none;
}

.gni-filter-row input:focus-visible {
  border-color: var(--n-accent);
  outline: 2px solid #81b5ce44;
}

.gni-date {
  display: grid;
  gap: 5px;
}

.gni-date span {
  font-size: 10px;
  color: var(--n-muted);
  font-weight: 800;
}

.gni-search {
  align-self: end;
}

.gni-feedback {
  font-size: 11px;
  color: var(--n-muted);
  min-height: 20px;
  line-height: 1.5;
  margin: 17px 0;
}

.gni-feedback.error {
  color: #f0a5a5;
}

/* NOTIFICACIONES */

.gni-notification-list {
  display: grid;
  gap: 10px;
  min-height: 90px;
}

.gni-item {
  display: grid;
  grid-template-columns:
    42px
    minmax(0,1fr)
    auto;

  gap: 13px;
  padding: 17px;

  border: 1px solid var(--n-border);
  border-radius: 16px;
  background: var(--n-tint);

  transition: background .15s;
}

.gni-item.unread {
  border-color: rgba(138,186,226,.48);
  background: var(--n-hover);
}

.gni-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;

  display: grid;
  place-items: center;

  font-size: 18px;
  background: rgba(117,152,190,.17);
}

.gni-item-icon.approval {
  background: rgba(221,179,102,.18);
}

.gni-item-icon.alert {
  background: rgba(230,123,113,.17);
}

.gni-item-body {
  min-width: 0;
}

.gni-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  font-size: 10px;
  color: var(--n-muted);
}

.gni-item-meta b {
  color: var(--n-accent);
}

.gni-item h3 {
  font: 800 14px/1.35 Manrope,sans-serif;
  letter-spacing: -.015em;
  margin: 9px 0 6px;
  overflow-wrap: anywhere;
}

.gni-item p {
  font-size: 12px;
  line-height: 1.6;
  color: var(--n-muted);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 0;
}

.gni-item-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  margin-top: 13px;
}

.gni-item-actions a,
.gni-item-actions button {
  font: 800 11px 'DM Sans',sans-serif;
  color: var(--n-accent);
  text-decoration: none;

  border: 1px solid var(--n-control-border);
  background: var(--n-control);
  border-radius: 9px;

  padding: 7px 10px;
  cursor: pointer;
}

.gni-item-actions button:hover,
.gni-item-actions a:hover {
  background: var(--n-hover);
}

.gni-item-state {
  font-size: 10px;
  color: var(--n-warning);
  font-weight: 850;
}

.gni-new-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  background: #9bd6ef;
  box-shadow: 0 0 9px #9bd6ef80;
  margin-top: 10px;
}

/* ESTADOS VACÍOS */

.gni-empty {
  padding: 38px 20px;
  text-align: center;

  border: 1px dashed var(--n-border);
  border-radius: 16px;

  color: var(--n-muted);
}

.gni-empty b {
  display: block;
  color: var(--n-ink);
  font: 800 17px Manrope,sans-serif;
  margin: 13px 0 6px;
}

.gni-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;

  color: var(--n-muted);
  font-size: 11px;
}

.gni-footnote {
  color: var(--n-muted);
  font-size: 11px;
  line-height: 1.6;
  padding: 0 7px;
}

.gni-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;

  border-top: 1px solid var(--n-border);
  padding-top: 25px;
  margin: 40px 0 10px;

  font-size: 10px;
  letter-spacing: .12em;
  color: var(--n-muted);
}

.gg-inbox-page [hidden] {
  display: none !important;
}

.gg-inbox-page .sr-only {
  position: absolute !important;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
}

/* =====================================================
   MODO CLARO
   Solo afecta a Mi Perfil y Notificaciones.
===================================================== */

html[data-gg-notif-theme="light"] {
  background: #eef4f8;
  color-scheme: light;
}

html[data-gg-notif-theme="light"]
body.gg-inbox-page {

  --n-ink: #213a52;
  --n-muted: #667d91;

  --n-surface: rgba(255,255,255,.9);
  --n-border: rgba(63,93,119,.15);

  --n-control: #f6fafe;
  --n-control-border: #ccdae7;

  --n-tint: rgba(223,233,245,.38);
  --n-hover: rgba(205,224,241,.5);

  --n-accent: #2f668e;
  --n-good: #278362;
  --n-warning: #a16a22;

  --n-shadow:
    0 18px 40px rgba(58,99,139,.11);

  background: radial-gradient(
    ellipse at 50% -10%,
    #ffffff,
    #e7f0f6 75%
  );

  color: var(--n-ink);
}

html[data-gg-notif-theme="light"]
.gg-inbox-page .atmosphere {
  opacity: .25;
}

html[data-gg-notif-theme="light"]
.gni-mark span {
  color: #92704f;
}

html[data-gg-notif-theme="light"]
.gni-avatar {
  background: linear-gradient(
    140deg,
    #8fb4d0,
    #386489
  );
}

/* =====================================================
   RESPONSIVE
===================================================== */

@media (max-width: 1050px) {

  .gni-layout {
    grid-template-columns:
      320px
      minmax(0,1fr);
  }

  .gni-filter-row {
    grid-template-columns: 1fr 1fr;
  }

  .gni-search {
    grid-column: 1 / -1;
  }

  .gni-toolbar {
    align-items: stretch;
  }
}

@media (max-width: 760px) {

  .gni-layout {
    grid-template-columns: 1fr;
  }

  .gni-profile-col {
    grid-template-columns: 1fr;
  }

  .gni-intro {
    padding: 34px 0 27px;
  }

  .gni-intro-number {
    display: none;
  }

  .gni-tip {
    display: none;
  }
}

@media (max-width: 530px) {

  .gg-inbox-page .gni-header {
    min-height: 82px;
    flex-wrap: wrap;
    padding: 14px 0;
  }

  .gni-brand strong {
    font-size: 11px;
  }

  .gni-brand small {
    font-size: 8px;
  }

  .gni-button {
    padding: 9px;
    font-size: 11px;
  }

  .gni-intro h1 {
    font-size: 31px;
  }

  .gni-inbox-card {
    padding: 17px;
  }

  .gni-person-card {
    padding: 23px;
  }

  .gni-inbox-head {
    flex-direction: column;
  }

  .gni-metrics > div {
    padding: 10px;
  }

  .gni-metrics span {
    font-size: 21px;
  }

  .gni-filter-row {
    grid-template-columns: 1fr 1fr;
  }

  .gni-item {
    grid-template-columns:
      35px
      minmax(0,1fr)
      8px;

    gap: 9px;
    padding: 13px;
  }

  .gni-item-icon {
    width: 34px;
    height: 34px;
  }

  .gni-footer {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {

  .gni-button,
  .gni-item {
    transition: none;
  }
}
`;

// =====================================================
// 3. JAVASCRIPT DEL PERFIL Y BANDEJA
// =====================================================

const js = String.raw`(() => {

  'use strict';

  const db = window.ggSupabase;

  const $ = id =>
    document.getElementById(id);

  const set = (id, value) => {
    const el = $(id);

    if (el) {
      el.textContent = String(value ?? '');
    }
  };

  const esc = value =>
    String(value ?? '').replace(
      /[&<>"']/g,
      char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char])
    );

  const fmt = value => {

    if (!value) return '—';

    const d = new Date(value);

    if (Number.isNaN(d.valueOf())) {
      return '—';
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    ).format(d);
  };

  let filter = 'all';
  let page = 0;
  let total = 0;
  let busy = false;
  let querySerial = 0;
  let typing = null;

  // =================================================
  // UTILIDADES
  // =================================================

  function msg(message, error = false) {

    set('gniFeedback', message);

    $('gniFeedback').classList.toggle(
      'error',
      error
    );
  }

  function initials(value) {

    const words = String(value || 'GG')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return (
      words.length >= 2
        ? words[0][0] + words[words.length - 1][0]
        : (words[0] || 'GG').slice(0, 2)
    ).toUpperCase();
  }

  // =================================================
  // CLARO / OSCURO
  // =================================================

  function setTheme(theme) {

    const actual =
      theme === 'light' ? 'light' : 'dark';

    document.documentElement.setAttribute(
      'data-gg-notif-theme',
      actual
    );

    $('gniTheme').textContent =
      actual === 'dark'
        ? '☼ Modo claro'
        : '☾ Modo oscuro';

    $('gniTheme').setAttribute(
      'aria-pressed',
      String(actual === 'light')
    );

    try {

      localStorage.setItem(
        'ggNotifThemeV1',
        actual
      );

    } catch (_) {
      // El módulo funciona aunque el navegador
      // no permita guardar preferencias.
    }
  }

  // =================================================
  // ENLACES INTERNOS SEGUROS
  // =================================================

  function safeRoute(value) {

    if (typeof value !== 'string') {
      return null;
    }

    const route = value.trim();

    return /^[a-z0-9_-]+\.html(?:\?[a-zA-Z0-9_=&%+.-]{0,180})?(?:#[a-zA-Z0-9_-]{1,60})?$/i
      .test(route)
      ? route
      : null;
  }

  // =================================================
  // MOSTRAR NOTIFICACIONES
  // =================================================

  function render(items, append = false) {

    const root = $('gniList');

    if (!append) {
      root.innerHTML = '';
    }

    if (!items.length && !append) {

      root.innerHTML = `

        <div class="gni-empty">

          <span
            aria-hidden="true"
            style="font-size:32px"
          >
            ✉
          </span>

          <b>
            No hay avisos en este filtro
          </b>

          <span>
            Cuando un módulo envíe notificaciones
            a tu cuenta, aparecerán aquí.
          </span>

        </div>
      `;

      return;
    }

    for (const item of items) {

      const icon =
        item.kind === 'approval'
          ? '◈'
          : item.kind === 'alert'
            ? '!'
            : item.kind === 'success'
              ? '✓'
              : '✦';

      const route = safeRoute(item.action_url);

      const state =

        item.kind === 'approval' &&
        item.decision_status === 'pending'

          ? 'Pendiente de autorización'

          : item.decision_status === 'approved'
            ? 'Autorizada'

            : item.decision_status === 'rejected'
              ? 'Rechazada'
              : '';

      const node = document.createElement(
        'article'
      );

      node.className =
        'gni-item' +
        (!item.read_at ? ' unread' : '');

      node.innerHTML = `

        <div
          class="gni-item-icon ${esc(item.kind)}"
          aria-hidden="true"
        >
          ${icon}
        </div>

        <div class="gni-item-body">

          <div class="gni-item-meta">

            <b>${esc(item.source_module)}</b>

            <span>
              · ${esc(fmt(item.created_at))}
            </span>

            ${
              item.priority === 'high'
                ? '<span>· PRIORITARIA</span>'
                : ''
            }

          </div>

          <h3>
            ${esc(item.title)}
          </h3>

          <p>
            ${esc(item.body)}
          </p>

          <div class="gni-item-actions">

            ${
              route
                ? `

                  <a
                    href="${esc(route)}"
                    data-gni-open="${esc(item.id)}"
                  >
                    ${esc(
                      item.action_label ||
                      'Ver en el módulo'
                    )}
                    ↗
                  </a>

                `
                : ''
            }

            <button
              type="button"
              data-gni-mark="${esc(item.id)}"
              data-read="${!item.read_at ? 'yes' : 'no'}"
            >
              ${
                !item.read_at
                  ? 'Marcar leída'
                  : 'Marcar no leída'
              }
            </button>

            ${
              state
                ? `

                  <span class="gni-item-state">
                    ${esc(state)}
                  </span>

                `
                : ''
            }

          </div>

        </div>

        ${
          item.read_at
            ? '<span></span>'
            : `

              <span
                class="gni-new-dot"
                title="Sin leer"
              ></span>

            `
        }
      `;

      root.append(node);
    }
  }

  // =================================================
  // CARGAR BANDEJA DESDE SUPABASE
  // =================================================

  async function load(reset = true) {

    if (busy) {
      return;
    }

    if (reset) {
      page = 0;
    }

    const serial = ++querySerial;

    busy = true;

    $('gniRefresh').disabled = true;
    $('gniMore').disabled = true;

    msg('Consultando tu bandeja…');

    try {

      const args = {

        p_filter: filter,

        p_search:
          $('gniSearch').value.trim(),

        p_from:
          $('gniFrom').value || null,

        p_to:
          $('gniTo').value || null,

        p_page:
          page

      };

      const { data, error } = await db.rpc(
        'gg_my_notifications',
        args
      );

      if (error) {
        throw error;
      }

      if (serial !== querySerial) {
        return;
      }

      const items =
        Array.isArray(data?.items)
          ? data.items
          : [];

      total = Number(data?.total) || 0;

      render(items, !reset);

      set('gniTotal', total);

      set(
        'gniUnreadMetric',
        Number(data?.unread_count) || 0
      );

      set(
        'gniPending',
        Number(data?.pending_count) || 0
      );

      set(
        'gniUnread',
        (Number(data?.unread_count) || 0) +
        ' sin leer'
      );

      const seen = Math.min(
        (page + 1) * 30,
        total
      );

      set(
        'gniPageText',
        total
          ? 'Mostrando ' + seen + ' de ' + total
          : 'Sin resultados'
      );

      $('gniMore').hidden = seen >= total;

      $('gniReadAll').disabled =
        !Number(data?.unread_count);

      msg(
        total
          ? 'Bandeja actualizada · ' +
            total +
            ' notificación(es) en el filtro.'
          : 'No tienes notificaciones para este filtro.'
      );

    } catch (error) {

      console.error(
        '[GG NOTIFICACIONES]',
        error
      );

      msg(
        'No se pudo consultar la bandeja: ' +
        (error.message || error),
        true
      );

      if (reset) {

        $('gniList').innerHTML = `

          <div class="gni-empty">

            <b>
              Conexión no disponible
            </b>

            Verifica que el SQL del módulo
            esté instalado en Supabase.

          </div>

        `;
      }

    } finally {

      busy = false;

      $('gniRefresh').disabled = false;
      $('gniMore').disabled = false;

    }
  }

  // =================================================
  // MARCAR LECTURA
  // =================================================

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

      if (data !== true) {
        throw Error(
          'No se encontró la notificación.'
        );
      }

      await load(true);

    } catch (error) {

      msg(
        'No se pudo actualizar la lectura: ' +
        error.message,
        true
      );
    }
  }

  // =================================================
  // PERFIL DESDE RH
  // Reutilizar lo_my_hr_card.
  // =================================================

  async function loadProfile() {

    const { data, error } =
      await db.auth.getUser();

    if (error || !data?.user) {

      location.replace('index.html');

      return false;
    }

    const user = data.user;

    set(
      'gniEmail',
      user.email || 'Correo no disponible'
    );

    set(
      'gniInitials',
      initials(
        (user.email || 'GG').split('@')[0]
      )
    );

    try {

      const result = await db.rpc(
        'lo_my_hr_card'
      );

      if (result.error) {
        throw result.error;
      }

      const employee = result.data;

      // USUARIO NO VINCULADO POR RH

      if (!employee) {

        set(
          'gniName',
          'Empleado sin vincular'
        );

        set(
          'gniJob',
          'Recursos Humanos aún no vincula esta cuenta'
        );

        set(
          'gniLinked',
          'Pendiente de RH'
        );

        set(
          'gniHire',
          'Sin registrar'
        );

        set(
          'gniProfileNote',
          'Sesión autenticada. RH debe vincular ' +
          'el correo a un empleado para mostrar ' +
          'su nombre, puesto y foto.'
        );

        return true;
      }

      // USUARIO VINCULADO

      const name =
        employee.full_name ||
        'Empleado';

      set('gniName', name);

      set(
        'gniJob',
        employee.position ||
        'Puesto por registrar'
      );

      set(
        'gniInitials',
        initials(name)
      );

      set(
        'gniLinked',
        '✓ Vinculado a RH'
      );

      $('gniLinked').classList.add('ok');

      const hire =
        employee.imss_entry_date ||
        employee.seniority_date;

      set(
        'gniHire',
        hire
          ? String(hire)
              .slice(0, 10)
              .split('-')
              .reverse()
              .join('/')
          : 'Sin registrar'
      );

      if (employee.photo_path) {

        const { data: photo } = db.storage
          .from('employee-photos')
          .getPublicUrl(employee.photo_path);

        if (photo?.publicUrl) {

          const image = $('gniPhoto');

          image.onload = () => {
            image.hidden = false;
          };

          image.onerror = () => {
            image.hidden = true;
          };

          image.src = photo.publicUrl;
        }
      }

    } catch (error) {

      console.error(
        '[GG PERFIL]',
        error
      );

      set(
        'gniName',
        'Perfil RH no disponible'
      );

      set(
        'gniJob',
        'Tu sesión permanece activa'
      );

      set(
        'gniLinked',
        'No se pudo consultar RH'
      );

      set(
        'gniProfileNote',
        'Verifica el permiso de lo_my_hr_card. ' +
        'La bandeja puede seguir funcionando.'
      );
    }

    return true;
  }

  // =================================================
  // INICIALIZACIÓN
  // =================================================

  async function init() {

    if (!db) {

      msg(
        'No se pudo cargar Supabase.',
        true
      );

      return;
    }

    // TEMA GUARDADO

    try {

      setTheme(
        localStorage.getItem(
          'ggNotifThemeV1'
        ) || 'dark'
      );

    } catch (_) {

      setTheme('dark');
    }

    $('gniTheme').addEventListener(
      'click',
      () => {

        const current =
          document.documentElement.getAttribute(
            'data-gg-notif-theme'
          );

        setTheme(
          current === 'dark'
            ? 'light'
            : 'dark'
        );
      }
    );

    if (!(await loadProfile())) {
      return;
    }

    // FILTROS

    document
      .querySelectorAll('[data-gni-filter]')
      .forEach(button => {

        button.addEventListener(
          'click',
          () => {

            filter =
              button.dataset.gniFilter;

            document
              .querySelectorAll(
                '[data-gni-filter]'
              )
              .forEach(item => {

                item.classList.toggle(
                  'active',
                  item === button
                );
              });

            load(true);
          }
        );
      });

    $('gniRefresh').addEventListener(
      'click',
      () => load(true)
    );

    $('gniMore').addEventListener(
      'click',
      () => {

        page++;

        load(false);
      }
    );

    $('gniSearch').addEventListener(
      'input',
      () => {

        clearTimeout(typing);

        typing = setTimeout(
          () => load(true),
          250
        );
      }
    );

    for (const id of [
      'gniFrom',
      'gniTo'
    ]) {

      $(id).addEventListener(
        'change',
        () => load(true)
      );
    }

    // ACCIONES POR NOTIFICACIÓN

    $('gniList').addEventListener(
      'click',
      event => {

        const button = event.target.closest(
          '[data-gni-mark]'
        );

        if (button) {

          mark(
            button.dataset.gniMark,
            button.dataset.read === 'yes'
          );
        }

        const link = event.target.closest(
          '[data-gni-open]'
        );

        if (link) {

          db.rpc(
            'gg_notification_mark_read',
            {
              p_notification_id:
                link.dataset.gniOpen,

              p_read: true
            }
          ).then(() => {});
        }
      }
    );

    // MARCAR TODAS

    $('gniReadAll').addEventListener(
      'click',
      async () => {

        const button = $('gniReadAll');

        button.disabled = true;

        try {

          const { error } = await db.rpc(
            'gg_notification_mark_all_read'
          );

          if (error) {
            throw error;
          }

          await load(true);

        } catch (error) {

          msg(
            'No se pudieron marcar las notificaciones: ' +
            error.message,
            true
          );

        } finally {

          button.disabled = false;
        }
      }
    );

    // SINCRONIZAR AL VOLVER A ESTA PESTAÑA

    document.addEventListener(
      'visibilitychange',
      () => {

        if (!document.hidden) {
          load(true);
        }
      }
    );

    db.auth.onAuthStateChange(event => {

      if (event === 'SIGNED_OUT') {
        location.replace('index.html');
      }
    });

    await load(true);
  }

  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      () => init().catch(
        error => msg(error.message, true)
      ),
      { once: true }
    );

  } else {

    init().catch(
      error => msg(error.message, true)
    );
  }

})();`;

// =====================================================
// 4. COMPROBAR INSTALACIÓN EXISTENTE
// =====================================================

if (!fs.existsSync(
  path.join(root, files.dashboard)
)) {

  throw Error(
    'Coloca el instalador junto a sistema.html'
  );
}

for (const name of [
  files.page,
  files.css,
  files.js
]) {

  if (fs.existsSync(path.join(root, name))) {

    throw Error(
      'No sobrescribo ' + name +
      '; el módulo podría estar instalado.'
    );
  }
}

const originals = new Map();
const edited = new Map();

for (const name of [
  files.dashboard,
  files.systemJS,
  files.systemCSS,
  files.vite
]) {

  const file = path.join(root, name);

  if (!fs.existsSync(file)) {
    throw Error('Falta ' + name);
  }

  const old = fs.readFileSync(
    file,
    'utf8'
  );

  if (old.includes(MARK)) {
    throw Error('Ya instalado en ' + name);
  }

  originals.set(name, old);

  // Reconocer CRLF de Windows.
  edited.set(
    name,
    old.replace(/\r\n/g, '\n')
  );
}

// =====================================================
// 5. REEMPLAZOS CONTROLADOS
// =====================================================

function one(
  file,
  match,
  replacement,
  label
) {

  const old = edited.get(file);

  const parts = old.split(match);

  if (parts.length !== 2) {

    throw Error(
      label +
      ': esperaba una coincidencia; encontré ' +
      (parts.length - 1) +
      '. Sin cambios.'
    );
  }

  edited.set(
    file,
    parts.join(replacement)
  );
}

// =====================================================
// 6. NUEVA TARJETA DE SISTEMA.HTML
// =====================================================

const card = String.raw`

        <!-- GG_MODULO_PERFIL_NOTIFICACIONES_20261027 -->

        <div
          class="module-shell slot-notifications"
          style="--delay:.42s"
        >

          <button
            type="button"
            class="module-card card-notifications"
            data-module="mi-perfil-notificaciones"
          >

            <span class="card-top">

              <span class="card-icon">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >

                  <circle cx="12" cy="8" r="3"/>

                  <path
                    d="M4 20a8 8 0 0 1 16 0M17 4h4v4M21 4l-4 4"
                  />

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
                Tu identidad laboral, avisos y próximas
                autorizaciones en una sola bandeja.
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

const endGrid =
  '      </div>\n' +
  '    </section>\n\n' +
  '    <footer class="site-footer">';

one(
  files.dashboard,
  endGrid,
  card + endGrid,
  'Insertar tarjeta en cuadrícula'
);

one(
  files.dashboard,
  '· 06 módulos',
  '· 07 módulos',
  'Contador de módulos'
);

// Actualizar numeración de las seis tarjetas.
let dashboard = edited.get(files.dashboard);

const count =
  (dashboard.match(/\d\d \/ 06/g) || []).length;

if (count !== 6) {

  throw Error(
    'Se esperaban 6 tarjetas numeradas / 06; ' +
    'encontradas ' + count
  );
}

dashboard = dashboard.replace(
  /(0[1-6]) \/ 06/g,
  '$1 / 07'
);

edited.set(
  files.dashboard,
  dashboard
);

// =====================================================
// 7. REGISTRAR RUTA EN SISTEMA.JS
// =====================================================

one(
  files.systemJS,

  '    cobranza: {',

  `    "mi-perfil-notificaciones": {

      name: "Mi Perfil y Notificaciones",

      url: "mi-perfil-notificaciones.html"

    },

    cobranza: {`,

  'Ruta del nuevo módulo'
);

// =====================================================
// 8. ESTILO DE LA TARJETA EN SISTEMA.HTML
// =====================================================

const systemStyle = String.raw`

/* GG_MODULO_PERFIL_NOTIFICACIONES_20261027 */

.slot-notifications {
  grid-column: span 12;
  min-height: 190px !important;
}

.card-notifications {
  background:
    radial-gradient(
      ellipse at 92% 30%,
      rgba(140,181,211,.18),
      transparent 45%
    ),
    linear-gradient(
      120deg,
      rgba(255,255,255,.105),
      rgba(255,255,255,.025)
    ),
    rgba(34,43,52,.26);
}

.card-notifications .card-content {
  margin-top: 6px;
  padding-top: 18px;
}

.card-notifications .card-title {
  font-size: clamp(22px,2.5vw,33px);
}

@media (max-width: 1040px) {

  .slot-notifications {
    grid-column: span 12 !important;
  }
}
`;

edited.set(
  files.systemCSS,

  edited.get(files.systemCSS) + systemStyle
);

// =====================================================
// 9. REGISTRAR NUEVA PÁGINA EN VITE
//
// IMPORTANTE PARA EL BUILD DE RENDER.
// =====================================================

const viteAnchor =

  '                yo:\n' +
  '                    resolve(\n' +
  '                        __dirname,\n' +
  '                        "yo.html"\n' +
  '                    )';

one(

  files.vite,

  viteAnchor,

  viteAnchor + `,

                miPerfilNotificaciones:
                    resolve(
                        __dirname,
                        "mi-perfil-notificaciones.html"
                    )`,

  'Agregar página al build de Vite'
);

// =====================================================
// 10. VALIDAR ANTES DE ESCRIBIR
// =====================================================

new vm.Script(
  edited.get(files.systemJS),
  {
    filename: files.systemJS
  }
);

new vm.Script(
  js,
  {
    filename: files.js
  }
);

if (

  !page.includes(
    'js/mi-perfil-notificaciones.js'
  )

  ||

  !page.includes(
    'css/mi-perfil-notificaciones.css'
  )

  ||

  !edited.get(files.dashboard).includes(
    'data-module="mi-perfil-notificaciones"'
  )

) {

  throw Error(
    'Validación de integración fallida.'
  );
}

// =====================================================
// 11. RESPALDAR Y APLICAR
// =====================================================

const backups = path.join(

  root,

  'respaldos-mi-perfil-notificaciones-' +

  new Date()
    .toISOString()
    .replace(/[:.]/g, '-')

);

const created = [];
const changed = [];

try {

  fs.mkdirSync(backups);

  // Respaldo antes de cambiar archivos.

  for (const [name, old] of originals) {

    const target = path.join(
      backups,
      name + '.bak'
    );

    fs.mkdirSync(
      path.dirname(target),
      { recursive: true }
    );

    fs.writeFileSync(
      target,
      old,
      { flag: 'wx' }
    );
  }

  // Crear nueva página, CSS y JS.

  for (const [name, content] of [

    [files.page, page],

    [files.css, css],

    [files.js, js]

  ]) {

    const target = path.join(
      root,
      name
    );

    fs.mkdirSync(
      path.dirname(target),
      { recursive: true }
    );

    fs.writeFileSync(
      target,
      content,
      { flag: 'wx' }
    );

    created.push(target);
  }

  // Modificar archivos existentes.

  for (const [name, newText] of edited) {

    const target = path.join(
      root,
      name
    );

    const old = originals.get(name);

    const ending =
      old.includes('\r\n')
        ? '\r\n'
        : '\n';

    const output = newText
      .replace(/\r\n/g, '\n')
      .replace(/\n/g, ending);

    const temp =
      target + '.' + process.pid + '.tmp';

    fs.writeFileSync(
      temp,
      output,
      { flag: 'wx' }
    );

    try {

      fs.renameSync(temp, target);

    } catch (error) {

      fs.rmSync(
        temp,
        { force: true }
      );

      throw error;
    }

    changed.push(name);
  }

} catch (error) {

  // Restaurar los archivos originales de esta
  // ejecución si falla algún paso.

  for (const name of changed.reverse()) {

    try {

      fs.writeFileSync(
        path.join(root, name),
        originals.get(name)
      );

    } catch (restoreError) {

      console.error(
        'Falló restauración:',
        name,
        restoreError
      );
    }
  }

  // Eliminar únicamente archivos nuevos de
  // esta instalación incompleta.

  for (const name of created.reverse()) {

    try {

      fs.rmSync(
        name,
        { force: true }
      );

    } catch (cleanupError) {

      console.error(
        'Falló limpieza:',
        name,
        cleanupError
      );
    }
  }

  throw error;
}

// =====================================================
// 12. RESULTADO
// =====================================================

console.log(
  '\n✅ Mi Perfil y Notificaciones instalado en sistema.html'
);

console.log(
  '✅ Perfil enlazado al RPC lo_my_hr_card'
);

console.log(
  '✅ Bandeja de notificaciones preparada con SQL'
);

console.log(
  '✅ Nueva ruta incluida en vite.config.js para Render'
);

console.log(
  '✅ CSS claro/oscuro, filtros, paginación y lectura'
);

console.log(
  '✅ Respaldos: ' + path.basename(backups)
);

console.log(
  'Ejecuta npm run dev; luego npm run build antes del despliegue.'
);
