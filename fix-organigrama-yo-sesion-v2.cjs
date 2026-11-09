
'use strict';

/*
  GRUPO GUTIERREZ
  FIX ORGANIGRAMA / FORO EN YO V2

  Respeta el login independiente de YO,
  asignado por Recursos Humanos.

  Ejecutar:
  node fix-organigrama-yo-sesion-v2.cjs

  Sin archivos .bak ni carpetas de backup.
  SQL separado.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();

const jsName = 'js/gg-social.js';
const htmlName = 'yo.html';

const jsPath = path.join(root, jsName);
const htmlPath = path.join(root, htmlName);

// ============================================
// VALIDAR ARCHIVOS
// ============================================

for (const name of [jsPath, htmlPath]) {
  if (!fs.existsSync(name)) {
    throw Error(
      'Falta ' +
      path.relative(root, name) +
      '. Ejecuta desde desarrollo grupo.'
    );
  }
}

const originalJS = fs.readFileSync(
  jsPath,
  'utf8'
);

const originalHTML = fs.readFileSync(
  htmlPath,
  'utf8'
);

if (
  !originalJS.includes('gg_social_snapshot') ||
  !originalJS.includes('ggSocialYoMount') ||
  !originalHTML.includes('id="ggSocialYoMount"')
) {
  throw Error(
    'No reconozco la instalación de ' +
    'Organigrama en YO. Sin cambios.'
  );
}

// ============================================
// ARREGLO DEL ARRANQUE DE YO
// ============================================

const marker =
  'GG_SOCIAL_YO_SESSION_FIX_V2';

let nextJS = originalJS;

if (!nextJS.includes(marker)) {

  const startMarker =
    ' async function start(){';

  const endMarker =
    "\n if(document.readyState==='loading')";

  const start =
    nextJS.lastIndexOf(startMarker);

  const end =
    nextJS.indexOf(endMarker, start);

  if (
    start < 0 ||
    end < start ||
    nextJS.indexOf(startMarker) !== start ||
    !nextJS.slice(start, end)
      .includes('await load()')
  ) {
    throw Error(
      'El arranque de gg-social.js ' +
      'no coincide con la versión anterior. ' +
      'No se modificó nada.'
    );
  }

  const replacement = String.raw`

 /* GG_SOCIAL_YO_SESSION_FIX_V2 */

 // YO inicia sesión con credenciales propias
 // asignadas por RH. Esperamos a que su
 // dashboard haya validado esa sesión.

 function waitForYoReady() {

   return new Promise((resolve, reject) => {

     const content = $('yoContent');

     const currentToken = () =>
       sessionStorage.getItem(
         'gg_intranet_token'
       );

     if (!content || !currentToken()) {
       reject(new Error(
         'No se encontró la sesión de intranet ' +
         'de YO. Inicia sesión con el usuario ' +
         'asignado por RH.'
       ));

       return;
     }

     if (content.classList.contains('ready')) {
       resolve();
       return;
     }

     let done = false;

     const observer = new MutationObserver(() => {
       if (content.classList.contains('ready')) {
         finish();
       }
     });

     const finish = reason => {
       if (done) return;

       done = true;

       observer.disconnect();
       clearTimeout(timeout);

       if (reason) {
         reject(reason);
       } else {
         resolve();
       }
     };

     observer.observe(
       content,
       {
         attributes: true,
         attributeFilter: ['class']
       }
     );

     const timeout = setTimeout(
       () => finish(
         new Error(
           'YO no terminó de abrir el perfil. ' +
           'Verifica el inicio de sesión de intranet.'
         )
       ),
       20000
     );

     if (content.classList.contains('ready')) {
       finish();
     }

   });
 }

 // Si Supabase falla, NO borrar los botones.

 function showYoError(err) {

   const host = $('ggSocialYoMount');

   if (!host) return;

   let holder = $('ggSocialYoErrorV2');

   if (!holder) {

     holder = document.createElement('div');
     holder.id = 'ggSocialYoErrorV2';

     holder.setAttribute(
       'role',
       'status'
     );

     holder.style.cssText =
       'margin:12px 0;' +
       'padding:14px;' +
       'border:1px solid #43647d;' +
       'border-radius:13px;' +
       'background:#132536;' +
       'color:#e3f3ff;' +
       'font:12px/1.6 Manrope,system-ui,sans-serif';

     host.append(holder);
   }

   holder.replaceChildren();

   const message =
     document.createElement('span');

   message.textContent =
     'Organigrama y Foro: ' +
     (err?.message || 'No se pudo actualizar') +
     '. La sesión principal de YO y ' +
     'la nómina no se modificaron.';

   const retry =
     document.createElement('button');

   retry.type = 'button';
   retry.textContent = 'Reintentar';

   retry.style.cssText =
     'display:block;' +
     'margin-top:9px;' +
     'border-radius:10px;' +
     'background:#275177;' +
     'color:#fff;' +
     'padding:9px 14px;' +
     'border:1px solid #5284ac;' +
     'cursor:pointer';

   retry.onclick = async () => {

     retry.disabled = true;

     try {

       await waitForYoReady();

       await load();

       holder.remove();

     } catch (e) {

       message.textContent =
         'No se pudo cargar el contenido: ' +
         (e?.message || String(e));

     } finally {
       retry.disabled = false;
     }
   };

   holder.append(message, retry);
 }

 // ==========================================
 // INICIO PRINCIPAL CORREGIDO
 // ==========================================

 async function start() {

   try {

     if (mode !== 'yo') {

       // RH, Mi Perfil y Sistema Central sí
       // utilizan autenticación administrativa.

       const {
         data,
         error: authError
       } = await db.auth.getUser();

       if (authError || !data?.user) {
         throw Error(
           'Inicia sesión con tu cuenta ' +
           'de Grupo Gutiérrez'
         );
       }
     }

     // Crear botones ANTES de consultar SQL.
     // Nunca exigir Supabase Auth para YO.

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

       // YO debe terminar de validar
       // la sesión de intranet primero.

       await waitForYoReady();

       await load();

       // Actualizaciones periódicas,
       // sin modificar la sesión principal.

       setInterval(() => {

         if (
           !document.hidden &&
           $('yoContent')?.classList
             .contains('ready')
         ) {

           load().catch(e =>
             console.warn(
               '[GG Social] Actualización:',
               e?.message
             )
           );
         }

       }, 90000);

     } else {

       await load();
     }

   } catch (e) {

     console.error(
       '[GG Social]',
       e
     );

     if (mode === 'yo') {

       // NO reemplazamos el contenido
       // ni desaparecemos los botones.

       showYoError(e);

     } else if (root) {

       root.textContent =
         'No fue posible cargar el contenido: ' +
         e.message;

     }
   }
 }
`;

  nextJS =
    nextJS.slice(0, start) +
    replacement +
    nextJS.slice(end);
}

// ============================================
// ACTUALIZAR LA VERSIÓN DEL SCRIPT
// ============================================

const ref =
  /(src\s*=\s*["']js\/gg-social\.js)(?:\?[^"']*)?(["'])/g;

const matches = [
  ...originalHTML.matchAll(ref)
];

if (matches.length !== 1) {
  throw Error(
    'Se esperaba una referencia única ' +
    'a js/gg-social.js en yo.html. ' +
    'Encontradas: ' + matches.length
  );
}

const nextHTML = originalHTML.replace(
  ref,
  '$1?v=2$2'
);

// ============================================
// VALIDAR ANTES DE ESCRIBIR
// ============================================

new vm.Script(
  nextJS,
  {filename:jsName}
);

if (
  !nextJS.includes(marker) ||
  !nextHTML.includes('gg-social.js?v=2')
) {
  throw Error(
    'Validación incompleta. Sin cambios.'
  );
}

// ============================================
// ESCRITURA CON RECUPERACIÓN EN MEMORIA
// ============================================

const edits = [
  [
    jsPath,
    Buffer.from(originalJS),
    Buffer.from(nextJS)
  ],
  [
    htmlPath,
    Buffer.from(originalHTML),
    Buffer.from(nextHTML)
  ]
];

const modified = [];

try {

  for (const [target, oldBytes, newBytes] of edits) {

    if (oldBytes.equals(newBytes)) {
      continue;
    }

    modified.push([target, oldBytes]);

    fs.writeFileSync(
      target,
      newBytes
    );
  }

} catch (err) {

  for (
    const [target, bytes] of modified.reverse()
  ) {
    try {
      fs.writeFileSync(target, bytes);
    } catch (restoreErr) {
      console.error(
        'No fue posible restaurar ' +
        target + ': ' +
        restoreErr.message
      );
    }
  }

  throw err;
}

// ============================================
// RESULTADO
// ============================================

console.log(
  '\n✓ Organigrama YO: sesión de intranet corregida.'
);

console.log(
  '✓ Organigrama y Foro permanecen visibles.'
);

console.log(
  '✓ Espera a que YO valide su sesión.'
);

console.log(
  '✓ Botón Reintentar ante errores.'
);

console.log(
  '✓ Archivos modificados: ' +
  modified.length
);

console.log(
  '✓ Sin .bak ni carpetas de respaldo.'
);

console.log(
  '\nIMPORTANTE: aplica también el SQL correctivo.'
);
