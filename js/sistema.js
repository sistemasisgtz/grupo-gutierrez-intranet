
/*
  GRUPO GUTIÉRREZ
  SISTEMA CENTRAL · GLASS ATELIER

  Sesión, navegación y permisos.
*/

(() => {
  "use strict";

  // ========================================
  // RUTAS DE LOS MÓDULOS
  // ========================================

  const ROUTES = Object.freeze({

    "xml-facturas": {
      name:"XML y Facturas",
      url:"xml-facturas.html"
    },

    ventas: {
      name: "Ventas",
      url: "ventas.html"
    },

    "recursos-humanos": {
      name: "Recursos Humanos",
      url: "recursos-humanos.html"
    },

    almacen: {
      name: "Almacén",
      url: "almacen.html"
    },

    "solicitudes-pago": {
      name: "Solicitudes de Pago",
      url: "solicitudes-pago.html"
    },

    "control-financiero": {
      name: "Control Financiero",
      url: "control-financiero.html",
      finance: true
    },
    "mi-perfil-notificaciones": {
      name: "Mi Perfil y Notificaciones",
      url: "mi-perfil-notificaciones.html"
    },

    cobranza: {
      name: "Cobranza",
      url: null
    }

  });

  // ========================================
  // ELEMENTOS
  // ========================================

  const $ = selector =>
    document.querySelector(selector);

  const client = window.ggSupabase;

  const emailNode = $("#systemUserEmail");
  const logoutBtn = $("#systemLogoutButton");
  const toast = $("#systemToast");

  const overlay = $("#moduleTransition");
  const overlayTitle = $("#moduleTransitionTitle");

  const financeCard = $(
    '[data-module="control-financiero"]'
  );

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let financeState = "checking";
  let busy = false;
  let toastTimer;

  // ========================================
  // NOTIFICACIONES
  // ========================================

  function notify(text) {
    if (!toast) return;

    toast.textContent = text;
    toast.classList.add("visible");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("visible");
    }, 3500);
  }

  // ========================================
  // ESTADO DE CONTROL FINANCIERO
  // ========================================

  function updateFinanceUI(state) {
    financeState = state;

    if (!financeCard) return;

    const info = financeCard.querySelector(
      "[data-finance-copy]"
    );

    const tag = financeCard.querySelector(
      "[data-finance-tag]"
    );

    financeCard.classList.toggle(
      "is-restricted",
      state !== "allowed"
    );

    financeCard.setAttribute(
      "aria-disabled",
      String(state !== "allowed")
    );

    if (info) {
      info.textContent =
        state === "allowed"
          ? "Autorizaciones, pagos y análisis"
          : state === "checking"
            ? "Validando permisos…"
            : "Acceso exclusivo para Finanzas";
    }

    if (tag) {
      tag.textContent =
        state === "allowed"
          ? "Disponible"
          : state === "checking"
            ? "Verificando"
            : "Restringido";
    }
  }

  // ========================================
  // VERIFICAR PERMISOS SUPABASE
  // ========================================

  async function checkFinance() {
    try {
      const { data, error } = await client.rpc(
        "finance_is_admin"
      );

      if (error) throw error;

      updateFinanceUI(
        data === true ? "allowed" : "denied"
      );

    } catch (error) {
      console.error(
        "[SISTEMA] Permiso de Finanzas:",
        error
      );

      updateFinanceUI("denied");
    }
  }

  // ========================================
  // NAVEGAR A UN MÓDULO
  // ========================================

  function openModule(id) {
    if (busy) return;

    const route = ROUTES[id];
    if (!route) return;

    // Verificar autorización especial.
    if (
      route.finance &&
      financeState !== "allowed"
    ) {
      notify(
        financeState === "checking"
          ? "Estamos verificando tu acceso a Control Financiero."
          : "Tu cuenta no tiene autorización para Control Financiero."
      );

      return;
    }

    // Módulo sin ruta activa.
    if (!route.url) {
      notify(
        "Cobranza estará disponible próximamente."
      );

      return;
    }

    busy = true;

    // Transición elegante.
    if (overlay && overlayTitle) {
      overlayTitle.textContent = route.name;

      overlay.classList.add("is-visible");

      overlay.setAttribute(
        "aria-hidden",
        "false"
      );
    }

    setTimeout(() => {
      window.location.assign(route.url);
    }, reducedMotion.matches ? 0 : 420);
  }

  // ========================================
  // CERRAR SESIÓN
  // ========================================

  async function logout() {
    if (busy || !client) return;

    logoutBtn.disabled = true;

    try {
      const { error } = await client.auth.signOut();

      if (error) throw error;

      window.location.replace("index.html");

    } catch (error) {
      console.error(
        "[SISTEMA] Logout:",
        error
      );

      logoutBtn.disabled = false;

      notify(
        "No pudimos cerrar la sesión. Inténtalo otra vez."
      );
    }
  }

  // ========================================
  // TARJETAS + REFLEJO LÍQUIDO
  // ========================================

  function bindCards() {

    document
      .querySelectorAll("[data-module]")
      .forEach(card => {

        // Navegación original.
        card.addEventListener("click", () => {
          openModule(card.dataset.module);
        });

        // Respetar preferencias de movimiento.
        if (reducedMotion.matches) return;

        // El reflejo sigue al cursor.
        card.addEventListener(
          "pointermove",
          event => {

            if (event.pointerType !== "mouse") {
              return;
            }

            const rect =
              card.getBoundingClientRect();

            const x =
              event.clientX - rect.left;

            const y =
              event.clientY - rect.top;

            card.style.setProperty(
              "--spot-x",
              `${x}px`
            );

            card.style.setProperty(
              "--spot-y",
              `${y}px`
            );
          }
        );

      });
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  async function init() {

    // Cliente Supabase no disponible.
    if (!client) {
      window.location.replace("index.html");
      return;
    }

    // Verificar sesión.
    try {
      const { data, error } =
        await client.auth.getSession();

      if (error || !data?.session) {
        window.location.replace("index.html");
        return;
      }

      if (emailNode) {
        emailNode.textContent =
          data.session.user?.email || "Usuario";
      }

    } catch (error) {
      console.error(
        "[SISTEMA] Sesión:",
        error
      );

      notify(
        "No se pudo verificar la sesión. Recarga esta página."
      );

      return;
    }

    // Sesión cerrada desde otra pestaña.
    client.auth.onAuthStateChange(event => {

      if (event === "SIGNED_OUT") {
        window.location.replace("index.html");
      }

    });

    // Activar tarjetas.
    bindCards();

    // Botón salir.
    logoutBtn?.addEventListener(
      "click",
      logout
    );

    // Acceso a Finanzas.
    updateFinanceUI("checking");
    checkFinance();

    document.body.classList.add("is-loaded");
  }

  // ========================================
  // RESTABLECER AL VOLVER
  // ========================================

  window.addEventListener("pageshow", () => {

    busy = false;

    overlay?.classList.remove(
      "is-visible"
    );

    overlay?.setAttribute(
      "aria-hidden",
      "true"
    );

  });

  // ========================================
  // INICIAR
  // ========================================

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );

  } else {
    init();
  }

})();
