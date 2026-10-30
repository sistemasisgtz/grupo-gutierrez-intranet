
/*
  GG · FILTROS COMBINADOS V4

  - Todos / Locales / Casas / Departamentos
  - Solo bienes con pendientes
  - Ambos filtros funcionan simultáneamente
  - Mantiene selección al refrescar el tablero
  - Sin consultas adicionales a Supabase
*/

(() => {
  "use strict";

  if (document.body.dataset.mode !== "gg") {
    return;
  }

  const app = document.getElementById("ldApp");

  const modals = document.getElementById(
    "ldModalHost"
  );

  if (!app) return;

  let type = "todos";
  let onlyPending = false;

  function sync() {
    const toolbar = app.querySelector(
      ".ld-toolbar"
    );

    const grid = app.querySelector(
      ".ld-grid"
    );

    if (!toolbar || !grid) return;

    /* -------------------------------------
       FILTRO DE TIPO
    ------------------------------------- */

    let typeWrap = toolbar.querySelector(
      "#ldTypeWrapV4"
    );

    if (!typeWrap) {
      typeWrap = document.createElement("label");

      typeWrap.id = "ldTypeWrapV4";
      typeWrap.className = "ld-v4-type";

      typeWrap.append(
        document.createTextNode("Tipo de bien")
      );

      const select = document.createElement(
        "select"
      );

      select.id = "ldTypeFilterV4";

      select.setAttribute(
        "aria-label",
        "Filtrar bienes por tipo"
      );

      const options = [
        ["todos", "Todos los tipos"],
        ["local", "🏬 Locales"],
        ["casa", "🏠 Casas"],
        ["departamento", "🏢 Departamentos"]
      ];

      for (const [value, label] of options) {
        const option = document.createElement(
          "option"
        );

        option.value = value;
        option.textContent = label;

        select.append(option);
      }

      select.value = type;

      select.addEventListener(
        "change",
        () => {
          type = select.value;
          sync();
        }
      );

      typeWrap.append(select);

      toolbar.insertBefore(
        typeWrap,
        toolbar.querySelector("#ldSearch")
      );
    }

    /* -------------------------------------
       FILTRO SOLO CON PENDIENTES
    ------------------------------------- */

    let pendingBtn = toolbar.querySelector(
      "#ldPendingV4"
    );

    if (!pendingBtn) {
      pendingBtn = document.createElement(
        "button"
      );

      pendingBtn.id = "ldPendingV4";
      pendingBtn.type = "button";
      pendingBtn.className = "ld-v4-pending";

      pendingBtn.addEventListener(
        "click",
        () => {
          onlyPending = !onlyPending;
          sync();
        }
      );

      toolbar.insertBefore(
        pendingBtn,
        toolbar.querySelector("#ldSearch")
      );
    }

    const pendingLabel = onlyPending
      ? "✓ Solo con pendientes"
      : "◉ Solo con pendientes";

    if (pendingBtn.textContent !== pendingLabel) {
      pendingBtn.textContent = pendingLabel;
    }

    pendingBtn.setAttribute(
      "aria-pressed",
      String(onlyPending)
    );

    /* -------------------------------------
       APLICAR LOS DOS FILTROS
    ------------------------------------- */

    const cards = [
      ...grid.querySelectorAll(
        "article.ld-card"
      )
    ];

    let shown = 0;

    for (const card of cards) {
      // Cada bien muestra su tipo
      // en la etiqueta superior.

      const kind = (
        card.querySelector(
          ".ld-tag, .ld-pill"
        )?.textContent || ""
      ).trim().toLowerCase();

      // Número de pendientes activos.

      const badge = card.querySelector(
        ".ld-count"
      );

      const pending = Number(
        (badge?.textContent || "0").trim()
      ) || 0;

      const typeMatches =
        type === "todos" || kind === type;

      const pendingMatches =
        !onlyPending || pending > 0;

      const display =
        typeMatches && pendingMatches;

      card.hidden = !display;

      if (display) {
        shown++;
      }
    }

    /* -------------------------------------
       MENSAJE SIN RESULTADOS
    ------------------------------------- */

    let empty = grid.querySelector(
      "#ldEmptyV4"
    );

    if (cards.length && !shown) {
      if (!empty) {
        empty = document.createElement(
          "div"
        );

        empty.id = "ldEmptyV4";
        empty.className = "ld-v4-empty";

        empty.textContent =
          "No hay inmuebles que coincidan " +
          "con estos filtros.";

        grid.append(empty);
      }

    } else if (empty) {
      empty.remove();
    }

    /* -------------------------------------
       CONTADOR DE BIENES VISIBLES
    ------------------------------------- */

    let summary = toolbar.querySelector(
      "#ldSummaryV4"
    );

    if (!summary) {
      summary = document.createElement(
        "div"
      );

      summary.id = "ldSummaryV4";
      summary.className = "ld-v4-summary";

      summary.setAttribute(
        "role",
        "status"
      );

      toolbar.append(summary);
    }

    const message =
      "Mostrando " + shown +
      " inmueble" +
      (shown === 1 ? "" : "s") +
      (
        onlyPending
          ? " con pendientes activos"
          : ""
      ) +
      ".";

    if (summary.textContent !== message) {
      summary.textContent = message;
    }
  }

  /* -------------------------------------
     CONSERVAR ENVÍO AUTOMÁTICO A LO
  ------------------------------------- */

  function removeManualSend() {
    if (!modals) return;

    modals.querySelectorAll(
      '[data-action="sendTask"]'
    ).forEach(button => button.remove());
  }

  /* -------------------------------------
     DETECTAR REFRESCOS DE LA INTERFAZ
  ------------------------------------- */

  const watch = new MutationObserver(sync);

  watch.observe(app, {
    childList: true,
    subtree: true
  });

  if (modals) {
    new MutationObserver(
      removeManualSend
    ).observe(modals, {
      childList: true,
      subtree: true
    });
  }

  sync();
  removeManualSend();
})();
