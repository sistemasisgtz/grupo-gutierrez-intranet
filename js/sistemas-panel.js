
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
