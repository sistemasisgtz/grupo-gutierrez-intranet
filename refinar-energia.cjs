
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = process.cwd();
const cssPath = path.join(root, "css/sistema-orbital.css");
const jsPath = path.join(root, "js/sistema-orbital.js");

const START = "/* GG ENERGY 2.1 START */";
const END = "/* GG ENERGY 2.1 END */";

const cssPatch = String.raw`
/* GG ENERGY 2.1 START */

/* Movimiento ambiental, no protagonista */
.gg-energy {
  opacity: .62;
  filter: blur(19px);
  animation:
    ggRefinedRotate 24s linear infinite,
    ggRefinedGlow 6s ease-in-out infinite;
}

.gg-energy.second {
  opacity: .42;
  filter: blur(23px);
  animation:
    ggRefinedReverse 34s linear infinite,
    ggRefinedGlow 8s ease-in-out infinite;
}

.gg-orbit-core {
  opacity: .55;
  animation: ggRefinedCore 7s ease-in-out infinite;
}

/* Un solo filamento discreto */
.gg-filament {
  width: min(54vw, 580px);
  border-width: 1px;
  opacity: .28;
  filter: drop-shadow(0 0 5px #83d9ed33);
  animation: ggRefinedRotate 28s linear infinite;
}

.gg-filament.second {
  display: none;
}

/* Partículas delicadas */
.gg-particle-track {
  animation-duration: 22s;
}

.gg-particle-track:nth-of-type(even) {
  animation-duration: 30s;
}

.gg-particle {
  width: 4px;
  height: 4px;
  opacity: .55;
  box-shadow:
    0 0 6px var(--particle-color),
    0 0 13px var(--particle-color);
  animation: ggRefinedTwinkle 4s ease-in-out infinite;
}

/* Dos partículas en vez de cuatro */
.gg-particle-track:nth-of-type(n+6) {
  display: none;
}

/* Eliminamos ondas expansivas */
.gg-shockwave {
  display: none !important;
}

/* Parallax más contenido */
.gg-orbit-inner {
  transition: transform .7s cubic-bezier(.2,.8,.2,1);
}

@keyframes ggRefinedRotate {
  to { transform: rotate(360deg); }
}

@keyframes ggRefinedReverse {
  to { transform: rotate(-360deg); }
}

@keyframes ggRefinedGlow {
  0%, 100% { opacity: .42; }
  50% { opacity: .68; }
}

@keyframes ggRefinedCore {
  0%, 100% {
    opacity: .4;
    scale: .98;
  }
  50% {
    opacity: .65;
    scale: 1.035;
  }
}

@keyframes ggRefinedTwinkle {
  0%, 100% { opacity: .3; }
  50% { opacity: .65; }
}

@media (max-width: 760px) {
  .gg-energy { opacity: .5; }
  .gg-energy.second { opacity: .32; }
  .gg-filament { opacity: .2; }
}

@media (prefers-reduced-motion: reduce) {
  .gg-energy,
  .gg-energy.second,
  .gg-orbit-core,
  .gg-filament,
  .gg-particle-track,
  .gg-particle {
    animation: none !important;
  }

  .gg-orbit-inner { transform: none !important; }
}

/* GG ENERGY 2.1 END */
`;

const jsPatch = String.raw`
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
`;

function stripBlock(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end);

  if (a === -1 && b === -1) return source;

  if (a === -1 || b === -1 || b < a) {
    throw new Error("Bloque de versión incompleto.");
  }

  return (
    source.slice(0, a) +
    source.slice(b + end.length)
  );
}

if (!fs.existsSync(cssPath) || !fs.existsSync(jsPath)) {
  throw new Error("No se encontró GG Orbital.");
}

const oldCSS = fs.readFileSync(cssPath, "utf8");
const oldJS = fs.readFileSync(jsPath, "utf8");

let newCSS = stripBlock(
  oldCSS,
  "/* GG ENERGY 2.0 START */",
  "/* GG ENERGY 2.0 END */"
);

let newJS = stripBlock(
  oldJS,
  "/* GG ENERGY 2.0 START */",
  "/* GG ENERGY 2.0 END */"
);

newCSS = stripBlock(newCSS, START, END);
newJS = stripBlock(newJS, START, END);

newCSS += "\n" + cssPatch;
newJS += "\n" + jsPatch;

new vm.Script(newJS);

try {
  fs.writeFileSync(cssPath, newCSS, "utf8");
  fs.writeFileSync(jsPath, newJS, "utf8");

  console.log("✓ GG Orbital Energy 2.1 instalado");
  console.log("✓ Movimiento elegante y contenido");
  console.log("✓ Tipografía y módulos conservados");
} catch (error) {
  try {
    fs.writeFileSync(cssPath, oldCSS, "utf8");
    fs.writeFileSync(jsPath, oldJS, "utf8");
  } catch (recoveryError) {
    console.error("Falló la recuperación:", recoveryError);
  }

  throw error;
}
