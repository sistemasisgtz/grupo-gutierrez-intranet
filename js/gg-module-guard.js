
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
