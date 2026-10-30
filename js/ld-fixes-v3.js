
/* GG · FILTRO Y ENVÍO AUTOMÁTICO V3 */

(() => {
  "use strict";

  if (document.body.dataset.mode !== "gg") {
    return;
  }

  const app = document.getElementById("ldApp");

  const modalHost = document.getElementById(
    "ldModalHost"
  );

  if (!app) {
    return;
  }

  let onlyPending = false;

  function sync() {
    const toolbar = app.querySelector(
      ".ld-toolbar"
    );

    if (!toolbar) {
      return;
    }

    let button = toolbar.querySelector(
      "#ldOnlyPendingV3"
    );

    if (!button) {
      button = document.createElement("button");

      button.id = "ldOnlyPendingV3";
      button.type = "button";
      button.className = "ld-pending-filter";

      button.textContent =
        "◉ Solo bienes con pendientes";

      button.addEventListener("click", () => {
        onlyPending = !onlyPending;
        sync();
      });

      toolbar.append(button);
    }

    button.setAttribute(
      "aria-pressed",
      String(onlyPending)
    );

    const label = onlyPending
      ? "✓ Solo bienes con pendientes"
      : "◉ Solo bienes con pendientes";

    if (button.textContent !== label) {
      button.textContent = label;
    }

    const grid = app.querySelector(
      ".ld-grid"
    );

    if (!grid) {
      return;
    }

    const cards = [
      ...grid.querySelectorAll(
        "article.ld-card"
      )
    ];

    let shown = 0;

    for (const card of cards) {
      const badge = card.querySelector(
        ".ld-count"
      );

      const number = Number(
        (badge?.textContent || "0").trim()
      );

      const show =
        !onlyPending || number > 0;

      if (show) {
        shown++;
        card.style.removeProperty("display");
      } else {
        card.style.setProperty(
          "display",
          "none",
          "important"
        );
      }
    }

    let empty = grid.querySelector(
      ".ld-onlypending-empty"
    );

    if (
      onlyPending &&
      cards.length &&
      shown === 0
    ) {
      if (!empty) {
        empty = document.createElement("div");

        empty.className =
          "ld-onlypending-empty";

        empty.textContent =
          "Por ahora, ningún bien tiene " +
          "pendientes por atender.";

        grid.append(empty);
      }

    } else if (empty) {
      empty.remove();
    }
  }

  function stripSendButtons() {
    if (!modalHost) {
      return;
    }

    modalHost
      .querySelectorAll(
        '[data-action="sendTask"]'
      )
      .forEach(button => button.remove());

    // El envío se realiza mediante
    // el trigger SQL al crear el pendiente.
  }

  const observer = new MutationObserver(
    () => sync()
  );

  observer.observe(app, {
    childList: true,
    subtree: true
  });

  if (modalHost) {
    const modalObserver = new MutationObserver(
      stripSendButtons
    );

    modalObserver.observe(modalHost, {
      childList: true,
      subtree: true
    });
  }

  sync();
  stripSendButtons();
})();
