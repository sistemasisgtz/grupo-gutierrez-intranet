
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
    sistemas: "sistemas.html",
    direccion: "direccion.html"
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
