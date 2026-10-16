/* =========================================================
   SISTEMA ULTRA UX
   Efectos visuales y micro-interacciones
   ========================================================= */

(() => {
  "use strict";

  function bootUltraUI() {
    const body = document.body;
    const bg = document.querySelector(".system-background");
    const shell = document.querySelector(".system-shell");
    const orbit = document.querySelector(".module-orbit");
    const center = document.querySelector(".orbit-center");
    const cards = [...document.querySelectorAll(".module-node")];
    const mobileCards = [...document.querySelectorAll(".module-node-mobile")];
    const introTitle = document.querySelector(".system-intro h1");

    // 1) entrada suave
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        body.classList.add("system-loaded");
      });
    });

    // 2) blobs decorativos
    if (bg && !bg.querySelector(".ultra-blob")) {
      const blobs = [
        {
          cls: "blue",
          style: "width:220px;height:220px;left:18%;top:20%;animation-delay:-2s;"
        },
        {
          cls: "orange",
          style: "width:180px;height:180px;right:15%;top:24%;animation-delay:-6s;"
        },
        {
          cls: "silver",
          style: "width:160px;height:160px;left:46%;bottom:14%;animation-delay:-4s;"
        }
      ];

      blobs.forEach(item => {
        const div = document.createElement("div");
        div.className = `ultra-blob ${item.cls}`;
        div.style.cssText = item.style;
        bg.appendChild(div);
      });
    }

    // 3) paralaje ligero del título
    if (introTitle) {
      window.addEventListener("mousemove", event => {
        const x = (event.clientX / window.innerWidth - 0.5) * 10;
        const y = (event.clientY / window.innerHeight - 0.5) * 6;

        introTitle.style.transform =
          `translate3d(${x * 0.2}px, ${y * 0.2}px, 0)`;
      });
    }

    // 4) inclinación glass cards
    [...cards, ...mobileCards].forEach(card => {
      card.addEventListener("mousemove", event => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;

        const rx = (0.5 - py) * 8;
        const ry = (px - 0.5) * 10;

        if (
          card.classList.contains("module-node-hr") ||
          card.classList.contains("module-node-finance")
        ) {
          card.style.transform =
            `translateX(-50%) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
          return;
        }

        card.style.transform =
          `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";

        if (
          card.classList.contains("module-node-hr") ||
          card.classList.contains("module-node-finance")
        ) {
          card.style.transform = "";
        }
      });
    });

    // 5) leve movimiento del núcleo
    if (orbit && center) {
      orbit.addEventListener("mousemove", event => {
        const rect = orbit.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (event.clientY - rect.top - rect.height / 2) / rect.height;

        center.style.transform =
          `translate(calc(-50% + ${x * 10}px), calc(-50% + ${y * 10}px))`;
      });

      orbit.addEventListener("mouseleave", () => {
        center.style.transform = "translate(-50%,-50%)";
      });
    }

    // 6) accesibilidad: si prefieren menos movimiento
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      body.classList.add("system-loaded");
      document
        .querySelectorAll(".module-node, .module-node-mobile")
        .forEach(card => {
          card.onmousemove = null;
        });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootUltraUI, {
      once: true
    });
  } else {
    bootUltraUI();
  }
})();