
'use strict';

/*
  GRUPO GUTIÉRREZ
  CULTURA ORGANIZACIONAL · FIX V2

  1. Corrige botón Cultura en YO.
  2. Agrega correo vinculado en empleados.
  3. Permite buscar por correo.
  4. Conserva los tres módulos originales.

  No toca:
  - gg-social.js
  - yo.js
  - yo-login.js
  - Nómina
  - Sesión de YO

  Sin archivos .bak ni backups.

  Ejecutar:
  node instalar-cultura-fix-v2.cjs
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();

const jsPath = 'js/gg-cultura.js';
const cssPath = 'css/gg-cultura.css';

const pages = [
  'yo.html',
  'cultura-organizacional.html'
];

const all = [
  jsPath,
  cssPath,
  ...pages
];

const p = name => path.join(root, name);

const before = new Map();

// ==========================================
// VALIDACIONES
// ==========================================

for (const name of all) {

  if (!fs.existsSync(p(name))) {
    throw Error(
      'Falta ' + name +
      '. Ejecuta desde desarrollo grupo.'
    );
  }

  before.set(
    name,
    fs.readFileSync(p(name))
  );
}

let js = before
  .get(jsPath)
  .toString('utf8');

let css = before
  .get(cssPath)
  .toString('utf8');

const marker =
  'GG_CULTURA_FIX_V2_EMAIL_YO';

if (
  !js.includes('GG CULTURA ORGANIZACIONAL V1') ||
  !js.includes('gg_cultura_directory') ||
  !js.includes('ggcYoTrigger') ||
  !js.includes('ggSocialYoMount')
) {

  throw Error(
    'No reconozco Cultura V1. ' +
    'No se modificó nada.'
  );
}

function replaceExactly(
  source,
  target,
  replacement,
  label
) {

  const count =
    source.split(target).length - 1;

  if (count !== 1) {

    throw Error(
      label +
      ': se esperaba una coincidencia, hubo ' +
      count +
      '. Sin cambios.'
    );
  }

  return source.replace(
    target,
    replacement
  );
}

// ==========================================
// MODIFICACIONES JAVASCRIPT
// ==========================================

if (!js.includes(marker)) {

  // ========================================
  // 1. ARREGLAR EL BOTÓN DE YO
  // ========================================

  // Antes estaba DENTRO del contenedor
  // reconstruido por gg-social.js.
  //
  // Ahora queda como elemento hermano.
  // El reinicio del módulo social ya
  // no puede eliminarlo.

  js = replaceExactly(
    js,

    '      yoMount.append(button);',

    "      yoMount.insertAdjacentElement('afterend', button);",

    'Ubicación del botón de YO'
  );

  // Protección adicional para mover el
  // botón si todavía estuviera dentro
  // del contenedor antiguo.

  js = replaceExactly(
    js,

    "    document.body.classList.add('ggc-yo-enhanced');",

    "    if (button.parentElement === yoMount) {\n" +
    "      yoMount.insertAdjacentElement('afterend', button);\n" +
    "    }\n" +
    "    document.body.classList.add('ggc-yo-enhanced');",

    'Protección del botón de YO'
  );

  // ========================================
  // 2. CORREO VINCULADO AL EMPLEADO
  // ========================================

  js = replaceExactly(
    js,

    "return {joined:row.joined_at||null,manager:manager?.name||null};",

    "return {joined:row.joined_at||null,manager:manager?.name||null,email:row.email||null};",

    'Datos del empleado'
  );

  // ========================================
  // 3. BUSCAR TAMBIÉN POR CORREO
  // ========================================

  js = replaceExactly(
    js,

    'Buscar nombre, puesto o empresa…',

    'Buscar nombre, puesto, empresa o correo…',

    'Texto de búsqueda'
  );

  js = replaceExactly(
    js,

    "norm(p.name+' '+p.position+' '+p.company).includes(q)",

    "norm(p.name+' '+p.position+' '+p.company+' '+(state.meta[p.id]?.email||'')).includes(q)",

    'Búsqueda por correo'
  );

  // ========================================
  // 4. CORREO EN TARJETAS
  // ========================================

  js = replaceExactly(
    js,

    "'<span class=\"ggc-employee-date\">Ingreso <b>'+esc(dateLabel(info.joined))+'</b></span>'+badgeStrip(p.id,5)+",

    "'<span class=\"ggc-employee-date\">Ingreso <b>'+esc(dateLabel(info.joined))+'</b></span>'+" +

    "(info.email?'<span class=\"ggc-employee-email\" title=\"'+esc(info.email)+'\">✉ '+esc(info.email)+'</span>':'')+" +

    "badgeStrip(p.id,5)+",

    'Correo en tarjetas'
  );

  // ========================================
  // 5. CORREO EN PERFIL AMPLIADO
  // ========================================

  js = replaceExactly(
    js,

    "      '<div class=\"ggc-detail-awards\"><span class=\"ggc-eyebrow\">RECONOCIMIENTOS</span>",

    "      (info.email?'<div class=\"ggc-profile-email\"><small>CORREO ASIGNADO</small><strong>'+esc(info.email)+'</strong></div>':'')+\n" +

    "      '<div class=\"ggc-detail-awards\"><span class=\"ggc-eyebrow\">RECONOCIMIENTOS</span>",

    'Correo en ficha completa'
  );

  // ========================================
  // 6. OBTENER EMAILS DESDE SUPABASE
  // ========================================

  // La nueva consulta es independiente.
  // No modifica el snapshot que YA
  // funciona en YO.

  js = replaceExactly(
    js,

    "      rpc('gg_social_post_media_list',tokenArgs())\n    ]);",

    "      rpc('gg_social_post_media_list',tokenArgs()),\n" +
    "      rpc('gg_cultura_employee_emails',tokenArgs())\n    ]);",

    'Consulta independiente de correos'
  );

  // ========================================
  // 7. INTEGRAR DATOS SIN BLOQUEAR YO
  // ========================================

  // Promise.allSettled evita que un error
  // en la consulta de correos impida
  // abrir el Organigrama o el Foro.

  js = replaceExactly(
    js,

    "    state.media=responses[1].status==='fulfilled'?(responses[1].value||{}):{};",

    "    // Correos opcionales: si falla el SQL, Cultura sigue funcionando.\n" +

    "    if(responses[2]?.status==='fulfilled'){\n" +

    "      for(const [id,email] of Object.entries(responses[2].value||{})){\n" +

    "        if(typeof email!=='string'||!email.trim())continue;\n" +

    "        if(!state.meta[id])state.meta[id]={id};\n" +

    "        state.meta[id].email=email.trim();\n" +

    "      }\n" +

    "    }else if(responses[2]?.status==='rejected'){\n" +

    "      console.warn('[Cultura] Correos no disponibles:',responses[2].reason?.message);\n" +

    "    }\n" +

    "    state.media=responses[1].status==='fulfilled'?(responses[1].value||{}):{};",

    'Integración no bloqueante de correos'
  );

  // Marcar versión instalada.

  js = js.replace(
    '/* GG CULTURA ORGANIZACIONAL V1',

    '/* ' + marker + ' */\n' +
    '/* GG CULTURA ORGANIZACIONAL V1'
  );
}

// ==========================================
// ESTILOS PARA LOS CORREOS
// ==========================================

if (!css.includes(marker)) {

  css +=
    '\n/* ' + marker + ' */\n' +

    '.ggc-employee-email{' +
    'display:block;' +
    'max-width:100%;' +
    'margin:9px 0 10px;' +
    'overflow:hidden;' +
    'white-space:nowrap;' +
    'text-overflow:ellipsis;' +
    'color:#a7dafa;' +
    'font-size:10px;' +
    'font-weight:650;' +
    'line-height:1.4}' +

    '\n.ggc-profile-email{' +
    'margin:12px 0 25px;' +
    'padding:15px 18px;' +
    'border:1px solid #668baa45;' +
    'background:#1026389e;' +
    'border-radius:14px;' +
    'display:flex;' +
    'flex-direction:column;' +
    'gap:8px;' +
    'overflow-wrap:anywhere}' +

    '\n.ggc-profile-email small{' +
    'color:#9fc5df;' +
    'font-size:9px;' +
    'letter-spacing:.1em}' +

    '\n.ggc-profile-email strong{' +
    'color:#e9f6ff;' +
    'font-size:13px}\n';
}

// ==========================================
// ACTUALIZAR CACHÉ DE LOS ARCHIVOS
// ==========================================

const next = new Map([
  [jsPath, js],
  [cssPath, css]
]);

for (const name of pages) {

  let html = before
    .get(name)
    .toString('utf8');

  for (
    const [type, asset]
    of [
      ['src', jsPath],
      ['href', cssPath]
    ]
  ) {

    const regex = new RegExp(
      '(' +
      type +
      '\\s*=\\s*["\\\']' +
      asset.replace(/\./g, '\\.') +
      ')(?:\\?[^"\\\']*)?(["\\\'])',
      'g'
    );

    const found = [
      ...html.matchAll(regex)
    ];

    if (found.length !== 1) {

      throw Error(
        'No encontré una sola referencia de ' +
        asset +
        ' en ' +
        name +
        '. Sin cambios.'
      );
    }

    html = html.replace(
      regex,
      '$1?v=2$2'
    );
  }

  if (!/<\/html\s*>/i.test(html)) {

    throw Error(
      'HTML incompleto: ' + name
    );
  }

  next.set(name, html);
}

// ==========================================
// VALIDACIÓN DE SINTAXIS
// ==========================================

new vm.Script(
  js,
  {filename: jsPath}
);

if (
  !js.includes(marker) ||
  !js.includes(
    "yoMount.insertAdjacentElement('afterend', button)"
  )
) {

  throw Error(
    'Falló la validación del botón de Cultura. ' +
    'Sin cambios.'
  );
}

// ==========================================
// ESCRITURA CON RECUPERACIÓN EN MEMORIA
// ==========================================

const written = [];

try {

  for (const [name, content] of next) {

    const newBytes = Buffer.from(
      content,
      'utf8'
    );

    if (
      before.get(name).equals(newBytes)
    ) {
      continue;
    }

    written.push(name);

    fs.writeFileSync(
      p(name),
      newBytes
    );
  }

} catch (err) {

  for (const name of written.reverse()) {

    try {

      fs.writeFileSync(
        p(name),
        before.get(name)
      );

    } catch (re) {

      console.error(
        'No pude restaurar ' +
        name + ': ' +
        re.message
      );
    }
  }

  throw err;
}

// ==========================================
// RESULTADO
// ==========================================

console.log(
  '✓ YO: botón Cultura fuera del contenedor que se reinicia.'
);

console.log(
  '✓ Correos vinculados en tarjetas, búsqueda y perfil.'
);

console.log(
  '✓ Sin cambios a login de YO, Nómina ni gg-social.js.'
);

console.log(
  '✓ Archivos modificados: ' +
  written.length +
  ' (sin .bak).'
);

console.log(
  '✓ Para mostrar correos, aplica el SQL gg_cultura_employee_emails.'
);
