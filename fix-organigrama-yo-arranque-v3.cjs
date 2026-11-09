
'use strict';

/*
 GRUPO GUTIERREZ
 FIX V3 · ARRANQUE DE ORGANIGRAMA EN YO

 Ejecutar:
 node fix-organigrama-yo-arranque-v3.cjs

 No modifica contraseñas, SQL ni la
 sesión original de YO.

 Sin .bak ni carpetas de respaldo.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();

const jsPath = path.join(
  root,
  'js',
  'gg-social.js'
);

const htmlPath = path.join(
  root,
  'yo.html'
);

// ============================================
// VALIDAR ARCHIVOS
// ============================================

for (const p of [jsPath, htmlPath]) {

  if (!fs.existsSync(p)) {
    throw Error(
      'Falta ' +
      path.relative(root, p) +
      '. Abre CMD en desarrollo grupo.'
    );
  }

}

const oldJS = fs.readFileSync(
  jsPath,
  'utf8'
);

const oldHTML = fs.readFileSync(
  htmlPath,
  'utf8'
);

if (
  !oldJS.includes('gg_social_snapshot') ||
  !oldJS.includes('ggSocialYoMount') ||
  !oldHTML.includes('ggSocialYoMount')
) {

  throw Error(
    'No es la instalación esperada de ' +
    'Organigrama y YO. No se modificó nada.'
  );
}

const marker =
  'GG_SOCIAL_YO_SESSION_FIX_V3';

let newJS = oldJS;

// ============================================
// LOCALIZAR EL ARRANQUE SIN DEPENDER
// DE ESPACIOS NI SALTOS DE LÍNEA
// ============================================

if (!oldJS.includes(marker)) {

  const begin =
    /\basync\s+function\s+start\s*\(\s*\)\s*\{/g;

  const ends =
    /\bif\s*\(\s*document\s*\.\s*readyState\s*===\s*['"]loading['"]\s*\)/g;

  const starts = [
    ...oldJS.matchAll(begin)
  ];

  const endMatches = [
    ...oldJS.matchAll(ends)
  ];

  if (
    starts.length !== 1 ||
    endMatches.length !== 1 ||
    endMatches[0].index <= starts[0].index
  ) {

    throw Error(
      'No se encontró un único arranque de ' +
      'gg-social.js. No se modificó nada.'
    );
  }

  const from = starts[0].index;
  const to = endMatches[0].index;

  const block = oldJS.slice(
    from,
    to
  );

  if (
    !block.includes('initShell()') ||
    !block.includes('await load()') ||
    !block.includes('db.auth.getUser')
  ) {

    throw Error(
      'El arranque no coincide con ' +
      'Organigrama V1. No se modificó nada.'
    );
  }

  // ==========================================
  // ARRANQUE CORREGIDO
  // ==========================================

  const replacement = String.raw`

  /* GG_SOCIAL_YO_SESSION_FIX_V3 */

  // Espera a que YO termine de validar
  // el usuario y contraseña asignados por RH.

  function ggSocialWaitYoReady() {

    return new Promise((resolve, reject) => {

      const area = $('yoContent');

      if (!area) {

        reject(
          Error(
            'No se encontró el contenido de YO.'
          )
        );

        return;
      }

      const ready = () =>
        area.classList.contains('ready') &&
        !!sessionStorage.getItem(
          'gg_intranet_token'
        );

      if (ready()) {
        resolve();
        return;
      }

      let finished = false;
      let observer;
      let timer;

      const finish = err => {

        if (finished) return;

        finished = true;

        if (observer) {
          observer.disconnect();
        }

        if (timer) {
          clearTimeout(timer);
        }

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      };

      observer = new MutationObserver(
        () => {

          if (ready()) {
            finish();
          }
        }
      );

      observer.observe(
        area,
        {
          attributes: true,
          attributeFilter: ['class']
        }
      );

      timer = setTimeout(
        () => finish(
          Error(
            'YO no terminó de validar la sesión. ' +
            'Revisa el acceso de intranet.'
          )
        ),
        20000
      );

      if (ready()) {
        finish();
      }

    });
  }

  // ==========================================
  // MENSAJE DE ERROR SIN OCULTAR BOTONES
  // ==========================================

  function ggSocialYoError(err) {

    const host = $('ggSocialYoMount');

    if (!host) return;

    let box = $('ggSocialYoErrorV3');

    if (!box) {

      box = document.createElement('div');

      box.id = 'ggSocialYoErrorV3';

      box.setAttribute(
        'role',
        'status'
      );

      box.style.cssText =
        'margin:12px 0;' +
        'padding:14px;' +
        'border:1px solid #45627a;' +
        'border-radius:13px;' +
        'background:#142435;' +
        'color:#e5f1fc;' +
        'font:12px/1.5 Manrope,system-ui,sans-serif';

      host.append(box);
    }

    box.replaceChildren();

    const info =
      document.createElement('span');

    info.textContent =
      'Organigrama y Foro: ' +
      (err?.message || String(err)) +
      '. Tu sesión principal de YO continúa activa.';

    const retry =
      document.createElement('button');

    retry.type = 'button';
    retry.textContent = 'Reintentar';

    retry.style.cssText =
      'display:block;' +
      'margin-top:9px;' +
      'padding:9px 14px;' +
      'border:1px solid #5381a6;' +
      'border-radius:10px;' +
      'background:#254e72;' +
      'color:#fff;' +
      'cursor:pointer';

    retry.onclick = async () => {

      retry.disabled = true;

      try {

        await ggSocialWaitYoReady();

        await load();

        box.remove();

      } catch (e) {

        info.textContent =
          'Organigrama y Foro: ' +
          (e?.message || String(e));

      } finally {

        retry.disabled = false;
      }
    };

    box.append(info, retry);
  }

  // ==========================================
  // INICIO PRINCIPAL
  // ==========================================

  async function start() {

    try {

      // RH, Mi Perfil y Sistema Central
      // usan autenticación administrativa.

      if (mode !== 'yo') {

        const {
          data,
          error: authError
        } = await db.auth.getUser();

        if (authError || !data?.user) {

          throw Error(
            'Inicia sesión con tu cuenta ' +
            'administrativa de Grupo Gutiérrez.'
          );
        }
      }

      // Crear los botones ANTES de pedir datos.
      // Así no desaparecen cuando falla
      // la conexión con Supabase.

      initShell();

      if (mode === 'yo') {

        if (
          $('yoEmployeeName') &&
          !$('ggsYoBadges')
        ) {

          $('yoEmployeeName')
            .insertAdjacentHTML(
              'afterend',
              '<div id="ggsYoBadges" ' +
              'class="ggs-profile-strip"></div>'
            );
        }

        $('yoNotificationButton')
          ?.addEventListener(
            'click',
            () => setTimeout(
              renderNotifications,
              100
            )
          );

        // YO NO usa auth.getUser().
        // Usa la sesión propia de intranet
        // que le proporcionó RH.

        await ggSocialWaitYoReady();
      }

      // Obtener organigrama, insignias
      // y publicaciones con la sesión correcta.

      await load();

      if (mode === 'yo') {

        $('ggSocialYoErrorV3')?.remove();

        setInterval(
          () => {

            if (
              !document.hidden &&
              $('yoContent')
                ?.classList.contains('ready')
            ) {

              load().catch(
                e => console.warn(
                  '[GG Social] Actualización:',
                  e?.message
                )
              );
            }

          },
          90000
        );
      }

    } catch (e) {

      console.error(
        '[GG Social]',
        e
      );

      if (mode === 'yo') {

        // Nunca borrar los botones de YO.
        ggSocialYoError(e);

      } else if (root) {

        root.textContent =
          'No fue posible cargar el contenido: ' +
          (e?.message || String(e));
      }
    }
  }
  `;

  newJS =
    oldJS.slice(0, from) +
    replacement +
    oldJS.slice(to);
}

// ============================================
// ACTUALIZAR CACHÉ DEL SCRIPT EN YO
// ============================================

const ref =
  /(src\s*=\s*['"]js\/gg-social\.js)(?:\?[^'"]*)?(['"])/g;

const matches = [
  ...oldHTML.matchAll(ref)
];

if (matches.length !== 1) {

  throw Error(
    'No encontré una única referencia ' +
    'a gg-social.js en yo.html. Sin cambios.'
  );
}

const newHTML = oldHTML.replace(
  ref,
  '$1?v=3$2'
);

// ============================================
// VALIDAR ANTES DE ESCRIBIR
// ============================================

new vm.Script(
  newJS,
  {
    filename: 'js/gg-social.js'
  }
);

if (
  !newJS.includes(marker) ||
  !newHTML.includes('gg-social.js?v=3')
) {

  throw Error(
    'Fallaron las validaciones del parche.'
  );
}

// ============================================
// GUARDADO CON RECUPERACIÓN EN MEMORIA
// ============================================

const edits = [
  [
    jsPath,
    Buffer.from(oldJS),
    Buffer.from(newJS)
  ],
  [
    htmlPath,
    Buffer.from(oldHTML),
    Buffer.from(newHTML)
  ]
];

const changed = [];

try {

  for (const [dest, before, after] of edits) {

    if (before.equals(after)) {
      continue;
    }

    changed.push([
      dest,
      before
    ]);

    fs.writeFileSync(
      dest,
      after
    );
  }

} catch (e) {

  for (
    const [dest, before] of changed.reverse()
  ) {

    try {

      fs.writeFileSync(
        dest,
        before
      );

    } catch (err) {

      console.error(
        'No pude restaurar ' +
        dest + ': ' +
        err.message
      );
    }
  }

  throw e;
}

// ============================================
// TERMINADO
// ============================================

console.log(
  '\n✓ Organigrama y Foro: botones conservados.'
);

console.log(
  '✓ Arranque de YO independiente de Supabase Auth.'
);

console.log(
  '✓ JavaScript comprobado.'
);

console.log(
  '✓ Archivos actualizados: ' +
  changed.length
);

console.log(
  '✓ Sin .bak ni carpetas de respaldo.'
);

console.log(
  'IMPORTANTE: sigue siendo necesario ' +
  'el SQL correctivo de sesión de YO.'
);
