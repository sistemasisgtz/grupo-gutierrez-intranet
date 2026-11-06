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

      
      /* GG_PAYROLL_INPUT_FIX_V4 */

      const currentToken = token();

      const currentDocumentId = receipt?.id;

      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Verificar sesion antes de solicitar.
      if (
        typeof currentToken !== "string" ||
        currentToken.length < 16
      ) {
        throw Error(
          "La sesion de YO esta ausente o incompleta. " +
          "Cierra sesion y vuelve a entrar."
        );
      }

      // Verificar identificador del documento.
      if (
        typeof currentDocumentId !== "string" ||
        !uuidPattern.test(currentDocumentId)
      ) {
        throw Error(
          "La notificacion no contiene un ID " +
          "de PDF valido. Actualiza YO e intenta de nuevo."
        );
      }

      // Enviar JSON explicito a Supabase.
      const {data, error} =
        await db.functions.invoke(
          "gg-payroll-download",
          {
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              session_token: currentToken,
              document_id: currentDocumentId
            })
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


/* GG_PAYROLL_YO_SHARED_BRIDGE_V7 */

// La sección inferior utilizará exactamente
// la misma lista y el mismo abridor de PDF.

window.ggPayrollYoBridge = Object.freeze({

  list: () =>
    Array.isArray(receipts)
      ? receipts.slice()
      : [],

  refresh: () => refresh(),

  open: (receipt, button) =>
    openReceipt(receipt, button)

});

})();
