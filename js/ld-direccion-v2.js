
(async () => {
  "use strict";

  const root =
    document.getElementById("dirRoot");

  try {
    const db = window.ggSupabase;

    if (!db) {
      throw Error(
        "No se encontró la conexión a Supabase."
      );
    }

    const {
      data: user,
      error: authError
    } = await db.auth.getUser();

    if (authError || !user?.user) {
      location.replace("index.html");
      return;
    }

    const { data: allowed, error } =
      await db.rpc(
        "gg_module_access",
        { p_module: "direccion" }
      );

    if (error) throw error;

    if (allowed !== true) {
      root.replaceChildren();

      const title =
        document.createElement("h1");

      title.className = "dir-title";
      title.textContent = "Acceso restringido";

      const description =
        document.createElement("p");

      description.className = "dir-desc";
      description.textContent =
        "Solicita autorización al departamento de Sistemas.";

      const button =
        document.createElement("button");

      button.className = "ld-btn ld-primary";
      button.textContent = "Solicitar acceso";

      button.onclick = async () => {
        button.disabled = true;

        const { error: requestError } =
          await db.rpc(
            "gg_sistemas_request_access",
            { p_module: "direccion" }
          );

        description.textContent = requestError
          ? requestError.message
          : "Solicitud enviada correctamente a Sistemas.";

        if (requestError) {
          button.disabled = false;
        }
      };

      root.append(
        title,
        description,
        button
      );

      return;
    }

    root.innerHTML = [
      '<div class="dir-kicker">',
      'GRUPO GUTIÉRREZ / ADMINISTRACIÓN CENTRAL',
      '</div>',

      '<h1 class="dir-title">',
      'Dirección<em>.</em>',
      '</h1>',

      '<p class="dir-desc">',
      'Un espacio tranquilo y organizado para administrar ',
      'el patrimonio, consultar responsables y dar ',
      'seguimiento a cada inmueble.',
      '</p>',

      '<div class="dir-divider"></div>',

      '<a class="dir-feature" href="locales-departamentos.html">',

      '<div class="dir-art">',
      '<svg viewBox="0 0 180 160" fill="none">',
      '<rect x="18" y="57" width="63" height="81" ',
      'rx="5" fill="#c8e3f3"/>',

      '<path d="M10 57 49 24 89 57" ',
      'stroke="#6198bc" stroke-width="10" ',
      'stroke-linejoin="round"/>',

      '<rect x="92" y="32" width="67" height="106" ',
      'rx="5" fill="#f7d9be"/>',

      '<rect x="106" y="48" width="16" height="17" ',
      'rx="3" fill="white"/>',

      '<rect x="130" y="48" width="16" height="17" ',
      'rx="3" fill="white"/>',

      '<rect x="106" y="77" width="16" height="17" ',
      'rx="3" fill="white"/>',

      '<rect x="130" y="77" width="16" height="17" ',
      'rx="3" fill="white"/>',

      '<rect x="35" y="86" width="26" height="52" ',
      'rx="3" fill="#719bb8"/>',

      '<rect x="118" y="111" width="18" height="27" ',
      'rx="3" fill="#c59a77"/>',

      '<path d="M8 141h164" stroke="#8bb4ca" ',
      'stroke-width="5" stroke-linecap="round"/>',
      '</svg>',
      '</div>',

      '<div>',
      '<div class="dir-kicker">PATRIMONIO</div>',
      '<h2>Locales y Departamentos</h2>',

      '<p>',
      'Responsables, bienes, expedientes, pendientes ',
      'enviados a LO y lecturas de agua, todo en un solo lugar.',
      '</p>',

      '<span class="dir-go">',
      'Abrir administración →',
      '</span>',
      '</div>',

      '</a>',

      '<p class="dir-soon">',
      'Próximamente agregaremos más herramientas ',
      'de Dirección.',
      '</p>'
    ].join("");

  } catch (error) {
    root.textContent =
      "No se pudo abrir Dirección: " +
      error.message;
  }
})();
