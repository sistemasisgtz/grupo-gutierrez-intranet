
'use strict';

/*
 GRUPO GUTIÉRREZ · ORGANIGRAMA V4

 - Centrado en empleado conectado.
 - Guía animada de zoom y desplazamiento.
 - Zoom táctil con dos dedos.
 - Sin cambios en contraseñas, Nómina ni RH.
 - SQL correctivo separado.

 Ejecutar:
 node fix-organigrama-yo-enfoque-v4.cjs

 Sin .bak ni carpetas de respaldo.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();

const jsPath = 'js/gg-social.js';
const cssPath = 'css/gg-social.css';

const pages = [
  'yo.html',
  'organigrama-empleados.html',
  'recursos-humanos.html',
  'mi-perfil-notificaciones.html'
];

const dest = p => path.join(root, p);

const read = p => {

  if (!fs.existsSync(dest(p))) {
    throw Error(
      'Falta ' + p +
      '. Ejecuta desde desarrollo grupo.'
    );
  }

  return fs.readFileSync(
    dest(p),
    'utf8'
  );
};

const files = new Map();
const original = new Map();

const get = p => {

  const content = read(p);

  original.set(
    p,
    Buffer.from(content)
  );

  return content;
};

let js = get(jsPath);
let css = get(cssPath);

for (const page of pages) {
  get(page);
}

// ============================================
// VALIDAR INSTALACIÓN SOCIAL EXISTENTE
// ============================================

const marker =
  'GG_SOCIAL_FOCUS_GESTURE_V4';

if (
  !js.includes('gg_social_snapshot') ||
  !js.includes('ggSocialYoMount')
) {

  throw Error(
    'No reconozco el módulo social. ' +
    'No se modificó nada.'
  );
}

// ============================================
// MOTOR DE CENTRADO Y GESTOS
// ============================================

if (!js.includes(marker)) {

  const orgDecl =
    /\bfunction\s+renderOrg\s*\(\s*target\s*,\s*editable\s*\)\s*\{/g;

  const decls = [
    ...js.matchAll(orgDecl)
  ];

  if (decls.length !== 1) {

    throw Error(
      'No encontré una sola función ' +
      'renderOrg(target,editable). Sin cambios.'
    );
  }

  const beforeTransform =
    /\bfunction\s+applyTransform\s*\(\s*\)\s*\{/g;

  if (
    [...js.matchAll(beforeTransform)].length !== 1
  ) {

    throw Error(
      'No encontré applyTransform. Sin cambios.'
    );
  }

  // Conservar íntegro el generador original
  // de tarjetas, jerarquías y conexiones.

  js = js.replace(
    orgDecl,
    'function ggSocialRenderOrgOriginalV4(target,editable){'
  );

  const helper = String.raw`

  /* GG_SOCIAL_FOCUS_GESTURE_V4 */

  // Complementa el organigrama original.
  // No modifica los datos de RH.

  function renderOrg(target, editable) {

    ggSocialRenderOrgOriginalV4(
      target,
      editable
    );

    ggsEnhanceOrg(target);
  }

  function ggsEnhanceOrg(target) {

    const host = $(target);

    const view = host?.querySelector(
      '.ggs-org-viewport'
    );

    const stage = host?.querySelector(
      '.ggs-stage'
    );

    if (!view || !stage) return;

    // Localizar el empleado autenticado
    // utilizando el ID que devuelve el
    // servidor, nunca un nombre inventado.

    const mine = state.me
      ? [...stage.querySelectorAll(
          '.ggs-node'
        )].find(
          n =>
            n.dataset.node === String(state.me)
        )
      : null;

    if (mine) {

      mine.classList.add(
        'ggs-own-employee'
      );
    }

    // Centrar una vez por apertura.
    // No hacerlo en cada actualización,
    // porque movería el organigrama
    // mientras el usuario lo explora.

    const key = String(
      state.me || 'sin-vinculo'
    );

    const initial =
      host.dataset.ggsFocusedV4 !== key;

    if (
      initial &&
      mode !== 'rh'
    ) {

      const center = () => {

        if (
          !view.isConnected ||
          !view.clientWidth ||
          !view.clientHeight
        ) return;

        let x;
        let y;

        if (mine) {

          // Zoom inicial cómodo según
          // el tamaño de la pantalla.

          state.zoom =
            view.clientWidth < 650
              ? .72
              : .94;

          x =
            parseFloat(mine.style.left) +
            mine.offsetWidth / 2;

          y =
            parseFloat(mine.style.top) +
            mine.offsetHeight / 2;

        } else {

          // Si aún no está agregado en
          // el organigrama, mostrar la
          // estructura completa.

          state.zoom = Math.max(
            .32,
            Math.min(
              1,
              (view.clientWidth - 35) /
                Math.max(
                  1,
                  stage.offsetWidth
                ),

              (view.clientHeight - 35) /
                Math.max(
                  1,
                  stage.offsetHeight
                )
            )
          );

          x = stage.offsetWidth / 2;
          y = stage.offsetHeight / 2;
        }

        // La traslación coloca al
        // empleado justo en el centro.

        state.x = Math.round(
          view.clientWidth / 2 -
          x * state.zoom
        );

        state.y = Math.round(
          view.clientHeight / 2 -
          y * state.zoom
        );

        applyTransform();

        const percent =
          host.querySelector(
            '.ggs-controls strong'
          );

        if (percent) {
          percent.textContent =
            Math.round(state.zoom * 100) +
            '%';
        }

        host.dataset.ggsFocusedV4 = key;
      };

      if (view.clientWidth) {

        center();

      } else {

        requestAnimationFrame(center);
      }
    }

    // =======================================
    // GUÍA ANIMADA DE ZOOM
    // =======================================

    if (initial) {

      const tip =
        document.createElement('div');

      tip.className =
        'ggs-gesture-tip';

      tip.setAttribute(
        'aria-hidden',
        'true'
      );

      tip.innerHTML =
        '<div class="ggs-pinch-hand">' +
        '<span>🤏</span>' +
        '<i class="ggs-pinch-ring"></i>' +
        '</div>' +

        '<strong>' +
        'Puedes hacer zoom y moverte' +
        '</strong>' +

        '<small>' +
        'Junta o separa dos dedos; ' +
        'arrastra para explorar. ' +
        'También puedes usar + y −.' +
        '</small>';

      view.appendChild(tip);

      // La indicación desaparece sola.

      setTimeout(
        () => tip.remove(),
        3400
      );
    }

    // =======================================
    // ZOOM TÁCTIL REAL CON DOS DEDOS
    // =======================================

    const touchPoints = new Map();

    let pinch = null;

    const measure = () => {

      const [a,b] = [
        ...touchPoints.values()
      ];

      return {

        dist: Math.max(
          1,
          Math.hypot(
            a.x - b.x,
            a.y - b.y
          )
        ),

        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2

      };
    };

    // Registrar los dedos que tocan
    // el organigrama.

    view.addEventListener(
      'pointerdown',
      e => {

        if (
          e.pointerType !== 'touch'
        ) return;

        touchPoints.set(
          e.pointerId,
          {
            x:e.clientX,
            y:e.clientY
          }
        );

        if (touchPoints.size === 2) {

          pinch = {
            ...measure(),
            zoom:state.zoom
          };

          e.preventDefault();
          e.stopImmediatePropagation();
        }

      },
      true
    );

    // Al separar o juntar dos dedos,
    // actualizar el zoom tomando como
    // referencia el centro del gesto.

    view.addEventListener(
      'pointermove',
      e => {

        if (
          !touchPoints.has(
            e.pointerId
          )
        ) return;

        touchPoints.set(
          e.pointerId,
          {
            x:e.clientX,
            y:e.clientY
          }
        );

        if (
          touchPoints.size < 2 ||
          !pinch
        ) return;

        const now = measure();

        const rect =
          view.getBoundingClientRect();

        const localX =
          now.cx - rect.left;

        const localY =
          now.cy - rect.top;

        const diagramX =
          (localX - state.x) /
          state.zoom;

        const diagramY =
          (localY - state.y) /
          state.zoom;

        state.zoom = Math.max(
          .32,
          Math.min(
            2.2,

            pinch.zoom *
            now.dist /
            pinch.dist
          )
        );

        state.x =
          localX -
          diagramX * state.zoom;

        state.y =
          localY -
          diagramY * state.zoom;

        applyTransform();

        const percent =
          host.querySelector(
            '.ggs-controls strong'
          );

        if (percent) {

          percent.textContent =
            Math.round(
              state.zoom * 100
            ) + '%';
        }

        e.preventDefault();
        e.stopImmediatePropagation();

      },
      {
        capture:true,
        passive:false
      }
    );

    // Limpiar dedos levantados.

    const release = e => {

      touchPoints.delete(
        e.pointerId
      );

      if (touchPoints.size < 2) {
        pinch = null;
      }
    };

    view.addEventListener(
      'pointerup',
      release,
      true
    );

    view.addEventListener(
      'pointercancel',
      release,
      true
    );
  }

  `;

  js = js.replace(
    beforeTransform,
    helper + 'function applyTransform(){'
  );

  if (
    !js.includes(marker) ||
    !js.includes(
      'ggSocialRenderOrgOriginalV4'
    )
  ) {

    throw Error(
      'Falló el ensamblado. Sin cambios.'
    );
  }
}

files.set(jsPath, js);

// ============================================
// ESTILO DEL EMPLEADO Y GUÍA ANIMADA
// ============================================

if (!css.includes(marker)) {

  css += String.raw`

/* GG_SOCIAL_FOCUS_GESTURE_V4 */

/* EMPLEADO ACTUAL */

.ggs-app .ggs-node.ggs-own-employee {
  border-color:#a8e7ff;

  box-shadow:
    0 0 0 2px rgba(126,208,255,.32),
    0 14px 35px rgba(46,132,190,.25);
}

.ggs-app .ggs-node.ggs-own-employee::after {
  content:'TÚ';

  position:absolute;

  right:8px;
  top:-12px;

  background:#c3eeff;
  color:#163248;

  padding:3px 8px;

  border-radius:999px;

  font:800 9px Manrope,system-ui,sans-serif;

  letter-spacing:.06em;
}

/* GUÍA DE GESTOS */

.ggs-app .ggs-gesture-tip {
  position:absolute;
  z-index:40;

  left:50%;
  top:50%;

  width:min(
    300px,
    calc(100% - 34px)
  );

  padding:19px 19px 20px;

  transform:translate(-50%,-50%);

  border:1px solid rgba(170,222,249,.33);

  border-radius:21px;

  background:rgba(18,31,46,.88);

  box-shadow:
    0 18px 65px rgba(0,0,0,.38);

  backdrop-filter:blur(18px);

  color:#eff8ff;
  text-align:center;

  pointer-events:none;

  animation:
    ggsTipEntrance 3.35s ease both;
}

.ggs-app .ggs-gesture-tip strong,
.ggs-app .ggs-gesture-tip small {
  display:block;
}

.ggs-app .ggs-gesture-tip strong {
  font:800 15px/1.4
    Manrope,system-ui,sans-serif;

  margin:5px 0 8px;
}

.ggs-app .ggs-gesture-tip small {
  font:500 11px/1.55
    Manrope,system-ui,sans-serif;

  color:#adc6db;
}

/* MANO Y CÍRCULO ANIMADOS */

.ggs-app .ggs-pinch-hand {
  position:relative;
  height:76px;
}

.ggs-app .ggs-pinch-hand span {
  display:inline-block;

  font-size:50px;
  line-height:1.2;

  transform-origin:50% 70%;

  animation:
    ggsPinchDemonstration
    1.1s ease-in-out
    infinite alternate;
}

.ggs-app .ggs-pinch-ring {
  position:absolute;

  left:50%;
  top:45%;

  width:48px;
  height:48px;

  border:1px dashed #9fdfff;
  border-radius:50%;

  transform:translate(-50%,-50%);

  animation:
    ggsPinchRing
    1.1s ease-in-out
    infinite alternate;

  opacity:.8;
}

/* ANIMACIONES */

@keyframes ggsPinchDemonstration {

  from {
    transform:
      scale(.80)
      rotate(-10deg);
  }

  to {
    transform:
      scale(1.17)
      rotate(4deg);
  }

}

@keyframes ggsPinchRing {

  from {
    transform:
      translate(-50%,-50%)
      scale(.65);

    opacity:.9;
  }

  to {
    transform:
      translate(-50%,-50%)
      scale(1.45);

    opacity:.2;
  }

}

@keyframes ggsTipEntrance {

  0% {
    opacity:0;

    transform:
      translate(-50%,-43%)
      scale(.93);
  }

  12%,70% {
    opacity:1;

    transform:
      translate(-50%,-50%)
      scale(1);
  }

  100% {
    opacity:0;

    transform:
      translate(-50%,-53%)
      scale(.98);
  }

}

/* ACCESIBILIDAD */

@media(prefers-reduced-motion:reduce) {

  .ggs-app .ggs-gesture-tip,
  .ggs-app .ggs-pinch-hand span,
  .ggs-app .ggs-pinch-ring {

    animation:none!important;
  }
}
`;
}

files.set(cssPath, css);

// ============================================
// ACTUALIZAR REFERENCIAS PARA EVITAR CACHÉ
// ============================================

for (const page of pages) {

  const source =
    original.get(page).toString('utf8');

  const reJs =
    /\b(src\s*=\s*["']js\/gg-social\.js)(?:\?[^"']*)?(["'])/g;

  const reCss =
    /\b(href\s*=\s*["']css\/gg-social\.css)(?:\?[^"']*)?(["'])/g;

  const jsCount = [
    ...source.matchAll(reJs)
  ].length;

  const cssCount = [
    ...source.matchAll(reCss)
  ].length;

  if (
    jsCount !== 1 ||
    cssCount !== 1
  ) {

    throw Error(
      'No encontré una referencia única ' +
      'al JS y CSS sociales en ' +
      page +
      '. Sin cambios.'
    );
  }

  const result = source
    .replace(
      reJs,
      '$1?v=4$2'
    )
    .replace(
      reCss,
      '$1?v=4$2'
    );

  files.set(
    page,
    result
  );
}

// ============================================
// VALIDAR ANTES DE ESCRIBIR
// ============================================

new vm.Script(
  js,
  {filename:jsPath}
);

for (const page of pages) {

  if (
    !files.get(page).includes(
      '</html>'
    )
  ) {

    throw Error(
      'HTML incompleto: ' + page
    );
  }
}

// ============================================
// APLICAR CON RECUPERACIÓN EN MEMORIA
// ============================================

const written = [];

try {

  for (const [name,value] of files) {

    const before =
      original.get(name);

    const after =
      Buffer.from(value);

    if (before.equals(after)) {
      continue;
    }

    written.push(name);

    fs.writeFileSync(
      dest(name),
      after
    );
  }

} catch(error) {

  for (
    const name of written.reverse()
  ) {

    try {

      fs.writeFileSync(
        dest(name),
        original.get(name)
      );

    } catch(restoreErr) {

      console.error(
        'No pude restaurar ' +
        name + ': ' +
        restoreErr.message
      );
    }
  }

  throw error;
}

// ============================================
// TERMINADO
// ============================================

console.log(
  '\n✓ Organigramas: centrado en el empleado conectado.'
);

console.log(
  '✓ Empleado actual resaltado con etiqueta TÚ.'
);

console.log(
  '✓ Animación de zoom y desplazamiento.'
);

console.log(
  '✓ Zoom táctil con dos dedos.'
);

console.log(
  '✓ Archivos actualizados: ' +
  written.length +
  '. Sin .bak.'
);

console.log(
  'IMPORTANTE: ejecuta también el SQL de sesión V4.'
);
