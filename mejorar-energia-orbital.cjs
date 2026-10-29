
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = process.cwd();
const cssFile = path.join(root, "css/sistema-orbital.css");
const jsFile = path.join(root, "js/sistema-orbital.js");

const START = "/* GG ENERGY 2.0 START */";
const END = "/* GG ENERGY 2.0 END */";

const css = String.raw`
/* GG ENERGY 2.0 START */

/* Mayor presencia y contraste */
.gg-orbit {
  overflow: visible;
  isolation: isolate;
}

/* Corriente principal */
.gg-energy {
  opacity: .95;
  filter: blur(13px);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    #f28b4300 18deg,
    #f28b43cc 48deg,
    #f28b4340 77deg,
    transparent 112deg,
    #83d9ed00 145deg,
    #83d9eddd 178deg,
    #83d9ed50 210deg,
    transparent 248deg,
    #f28b4399 300deg,
    transparent 345deg
  );
  animation:
    ggEnergyRotate 11s linear infinite,
    ggEnergyPulse 3.2s ease-in-out infinite;
}

/* Corriente secundaria en sentido contrario */
.gg-energy.second {
  opacity: .85;
  filter: blur(10px);
  background: conic-gradient(
    from 30deg,
    transparent 0deg,
    #83d9edcc 65deg,
    transparent 110deg,
    #f28b43aa 180deg,
    transparent 240deg,
    #83d9ed88 305deg,
    transparent 360deg
  );
  animation:
    ggEnergyReverse 15s linear infinite,
    ggEnergyPulse 4.1s ease-in-out infinite reverse;
}

/* Núcleo dinámico */
.gg-orbit-core {
  background: radial-gradient(
    circle,
    #83d9ed13 0%,
    #f28b430b 35%,
    transparent 72%
  );
  box-shadow:
    0 0 65px #83d9ed14,
    0 0 110px #f28b430b;
  animation: ggCoreBreathe 4s ease-in-out infinite;
}

/* Órbitas de partículas */
.gg-particle-track {
  position: absolute;
  width: min(58vw, 620px);
  aspect-ratio: 1;
  border-radius: 50%;
  animation: ggEnergyRotate var(--speed, 9s)
    linear infinite;
}

.gg-particle-track.reverse {
  animation-name: ggEnergyReverse;
}

.gg-particle {
  position: absolute;
  left: 50%;
  top: 0;
  width: var(--particle-size, 7px);
  height: var(--particle-size, 7px);
  border-radius: 50%;
  background: var(--particle-color, #83d9ed);
  box-shadow:
    0 0 9px var(--particle-color, #83d9ed),
    0 0 24px var(--particle-color, #83d9ed),
    0 0 40px var(--particle-color, #83d9ed);
  animation: ggParticleFlicker 1.8s
    ease-in-out infinite alternate;
}

/* Ondas expansivas */
.gg-shockwave {
  position: absolute;
  width: min(33vw, 350px);
  aspect-ratio: 1;
  border: 1px solid #83d9ed70;
  border-radius: 50%;
  opacity: 0;
  box-shadow: 0 0 15px #83d9ed25;
  animation: ggShockwave 5s ease-out infinite;
}

.gg-shockwave.orange {
  border-color: #f28b4370;
  box-shadow: 0 0 15px #f28b4325;
  animation-delay: 2.5s;
}

/* Filamentos energéticos */
.gg-filament {
  position: absolute;
  width: min(54vw, 580px);
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #83d9edaa;
  border-right-color: #f28b4366;
  filter: drop-shadow(0 0 9px #83d9ed55);
  animation: ggEnergyRotate 7s linear infinite;
  opacity: .75;
}

.gg-filament.second {
  width: min(47vw, 500px);
  border-top-color: #f28b43aa;
  border-right-color: transparent;
  border-bottom-color: #83d9ed66;
  animation: ggEnergyReverse 10s linear infinite;
}

/* Interacción suave con el cursor */
.gg-orbit-inner {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transform: translate3d(
    var(--mouse-x, 0px),
    var(--mouse-y, 0px),
    0
  );
  transition: transform .3s ease-out;
  pointer-events: none;
}

/* Animaciones */

@keyframes ggEnergyRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ggEnergyReverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes ggEnergyPulse {
  0%, 100% { opacity: .65; }
  50% { opacity: 1; }
}

@keyframes ggCoreBreathe {
  0%, 100% {
    opacity: .5;
    scale: .94;
  }
  50% {
    opacity: 1;
    scale: 1.12;
  }
}

@keyframes ggParticleFlicker {
  from {
    opacity: .4;
    scale: .7;
  }
  to {
    opacity: 1;
    scale: 1.3;
  }
}

@keyframes ggShockwave {
  0% {
    opacity: .7;
    transform: scale(.65);
  }
  75% {
    opacity: .15;
  }
  100% {
    opacity: 0;
    transform: scale(1.85);
  }
}

/* Adaptación móvil */
@media (max-width: 760px) {
  .gg-particle-track { width: 270px; }
  .gg-filament { width: 250px; }
  .gg-filament.second { width: 220px; }
  .gg-shockwave { width: 170px; }

  .gg-energy { filter: blur(10px); }
  .gg-energy.second { filter: blur(8px); }
}

/* Accesibilidad */
@media (prefers-reduced-motion: reduce) {
  .gg-energy,
  .gg-energy.second,
  .gg-orbit-core,
  .gg-particle-track,
  .gg-filament,
  .gg-shockwave,
  .gg-particle {
    animation: none !important;
  }

  .gg-shockwave { display: none; }
  .gg-orbit-inner { transition: none; }
}

/* GG ENERGY 2.0 END */
`;

const js = String.raw`
/* GG ENERGY 2.0 START */
(() => {
  "use strict";

  function enhanceOrbit() {
    const orbit = document.querySelector(".gg-orbit");
    const workspace = document.querySelector(".workspace");

    if (!orbit || !workspace) return;
    if (orbit.dataset.energyV2 === "true") return;

    orbit.dataset.energyV2 = "true";

    const inner = document.createElement("div");
    inner.className = "gg-orbit-inner";

    // Reubicar los elementos visuales originales
    while (orbit.firstChild) {
      inner.appendChild(orbit.firstChild);
    }

    orbit.appendChild(inner);

    // Filamentos
    for (let i = 0; i < 2; i++) {
      const filament = document.createElement("div");
      filament.className =
        "gg-filament" + (i ? " second" : "");
      inner.appendChild(filament);
    }

    // Partículas orbitales
    const particles = [
      { speed: 8, color: "#83d9ed", size: 8 },
      { speed: 12, color: "#f28b43", size: 6 },
      { speed: 17, color: "#83d9ed", size: 5 },
      { speed: 10, color: "#f28b43", size: 7 }
    ];

    particles.forEach((config, index) => {
      const track = document.createElement("div");
      track.className =
        "gg-particle-track" +
        (index % 2 ? " reverse" : "");

      track.style.setProperty(
        "--speed", config.speed + "s"
      );

      const particle = document.createElement("div");
      particle.className = "gg-particle";

      particle.style.setProperty(
        "--particle-color", config.color
      );

      particle.style.setProperty(
        "--particle-size", config.size + "px"
      );

      track.appendChild(particle);
      inner.appendChild(track);
    });

    // Ondas de energía
    const wave1 = document.createElement("div");
    wave1.className = "gg-shockwave";

    const wave2 = document.createElement("div");
    wave2.className = "gg-shockwave orange";

    inner.append(wave1, wave2);

    // Parallax ligero, limitado a 12 px
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (!reducedMotion.matches) {
      let frame = 0;

      workspace.addEventListener(
        "pointermove",
        (event) => {
          if (event.pointerType === "touch") return;

          if (frame) cancelAnimationFrame(frame);

          frame = requestAnimationFrame(() => {
            const rect = workspace.getBoundingClientRect();

            const x =
              (event.clientX - rect.left) /
              rect.width - .5;

            const y =
              (event.clientY - rect.top) /
              rect.height - .5;

            inner.style.setProperty(
              "--mouse-x", (x * 24).toFixed(2) + "px"
            );

            inner.style.setProperty(
              "--mouse-y", (y * 24).toFixed(2) + "px"
            );
          });
        },
        { passive: true }
      );

      workspace.addEventListener("pointerleave", () => {
        inner.style.setProperty("--mouse-x", "0px");
        inner.style.setProperty("--mouse-y", "0px");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      enhanceOrbit,
      { once: true }
    );
  } else {
    enhanceOrbit();
  }
})();
/* GG ENERGY 2.0 END */
`;

// Sustituir la versión previa sin duplicados
function replaceBlock(original, block) {
  const start = original.indexOf(START);
  const end = original.indexOf(END);

  if (start === -1 && end === -1) {
    return original.trimEnd() + "\n\n" + block + "\n";
  }

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Marcadores de versión incompletos.");
  }

  return (
    original.slice(0, start) +
    block +
    original.slice(end + END.length)
  );
}

if (!fs.existsSync(cssFile) || !fs.existsSync(jsFile)) {
  throw new Error(
    "Primero debes instalar GG Orbital Atelier."
  );
}

const oldCSS = fs.readFileSync(cssFile, "utf8");
const oldJS = fs.readFileSync(jsFile, "utf8");

const newCSS = replaceBlock(oldCSS, css);
const newJS = replaceBlock(oldJS, js);

// Validación de sintaxis JS
new vm.Script(newJS, {
  filename: "sistema-orbital.js"
});

try {
  fs.writeFileSync(cssFile, newCSS, "utf8");
  fs.writeFileSync(jsFile, newJS, "utf8");

  console.log("");
  console.log("✓ GG ORBITAL ENERGY 2.0 INSTALADO");
  console.log("✓ Corrientes dinámicas activadas");
  console.log("✓ Partículas orbitales activadas");
  console.log("✓ Pulsos energéticos activados");
  console.log("✓ Parallax activado");
  console.log("✓ Módulos y permisos intactos");
  console.log("");
} catch (error) {
  // Restauración sin crear respaldos
  try {
    fs.writeFileSync(cssFile, oldCSS, "utf8");
    fs.writeFileSync(jsFile, oldJS, "utf8");
  } catch (recoveryError) {
    console.error(
      "Error durante la restauración:",
      recoveryError
    );
  }

  throw error;
}
