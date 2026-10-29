
/*
  GG ORBITAL ATELIER
  Presentación exclusivamente.
  No reemplaza navegación, permisos ni sesión.
*/
(() => {
  "use strict";

  function init() {
    const workspace = document.querySelector(".workspace");
    const hero = document.querySelector(".hero");
    const grid = workspace?.querySelector(".module-grid");

    if (!workspace || !hero || !grid) return;
    if (workspace.dataset.ggOrbital === "1") return;

    const modules = [...grid.querySelectorAll("[data-module]")];

    if (modules.length !== 9) {
      console.warn(
        "[GG Orbital] Cantidad inesperada de módulos."
      );
      return;
    }

    workspace.dataset.ggOrbital = "1";

    const orbit = document.createElement("div");
    orbit.className = "gg-orbit";
    orbit.setAttribute("aria-hidden", "true");

    orbit.innerHTML = [
      '<div class="gg-energy"></div>',
      '<div class="gg-energy second"></div>',
      '<div class="gg-orbit-core"></div>'
    ].join("");

    workspace.insertBefore(orbit, grid);
    workspace.insertBefore(hero, grid);

    const hint = document.createElement("span");
    hint.className = "gg-orbit-hint";
    hint.textContent = "OCHO ESPACIOS · UNA SOLA PLATAFORMA";
    workspace.append(hint);

    // Los botones originales permanecen intactos.
    // sistema.js conserva el control de acceso.
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();






/* GG ENERGY 2.1 START */
(() => {
  "use strict";

  function refine() {
    const orbit = document.querySelector(".gg-orbit");
    const workspace = document.querySelector(".workspace");
    if (!orbit || !workspace) return;

    // Eliminar ondas
    orbit.querySelectorAll(".gg-shockwave")
      .forEach(el => el.remove());

    // Conservar solo dos partículas
    orbit.querySelectorAll(".gg-particle-track")
      .forEach((el, index) => {
        if (index >= 2) el.remove();
        else {
          el.style.setProperty(
            "--speed",
            index === 0 ? "22s" : "30s"
          );
        }
      });

    // Conservar un filamento
    orbit.querySelectorAll(".gg-filament")
      .forEach((el, index) => {
        if (index > 0) el.remove();
      });

    // Desactivar el parallax anterior para evitar
    // dos controladores compitiendo entre sí.
    const inner = orbit.querySelector(".gg-orbit-inner");

    if (inner) {
      inner.style.setProperty(
        "--mouse-x", "0px"
      );
      inner.style.setProperty(
        "--mouse-y", "0px"
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      refine,
      { once: true }
    );
  } else {
    refine();
  }
})();
/* GG ENERGY 2.1 END */
