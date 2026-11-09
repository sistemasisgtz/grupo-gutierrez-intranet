
'use strict';

/*
  GRUPO GUTIÉRREZ · Reparador V5 definitivo

  Ejecutar en desarrollo grupo:
  node reparar-org-foro-v5-definitivo.cjs

  Corrige anclas rígidas, ensaya dos veces
  fuera del proyecto y solo después copia
  los 6 archivos verificados.

  No toca SQL, Nómina, contraseñas ni .bak.
*/

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');

const {
  spawnSync
} = require('node:child_process');

const root = process.cwd();

const installerName =
  'instalar-org-foro-v5.cjs';

const files = [
  'js/gg-social.js',
  'css/gg-social.css',
  'yo.html',
  'recursos-humanos.html',
  'organigrama-empleados.html',
  'mi-perfil-notificaciones.html'
];

const fileAt = (base, name) =>
  path.join(base, name);

// ===========================================
// 1. REVISAR ARCHIVOS DEL PROYECTO
// ===========================================

for (
  const name of [
    installerName,
    ...files
  ]
) {
  if (!fs.existsSync(fileAt(root, name))) {
    throw Error(
      'Falta ' + name +
      '. Ejecuta desde desarrollo grupo.'
    );
  }
}

const original = new Map(
  files.map(name => [
    name,
    fs.readFileSync(fileAt(root, name))
  ])
);

const raw = fs.readFileSync(
  fileAt(root, installerName),
  'utf8'
);

const marker =
  'GG_SOCIAL_FORUM_GALLERY_FULLSCREEN_V5';

if (!raw.includes(marker)) {
  throw Error(
    'No reconozco el instalador Foro V5. ' +
    'Sin cambios.'
  );
}

if (
  original.get('js/gg-social.js')
    .toString()
    .includes(marker)
) {
  console.log(
    '✓ Foro V5 ya está instalado. Sin cambios.'
  );

  process.exit(0);
}

// ===========================================
// 2. CORREGIR BÚSQUEDA DE EVENTOS
// ===========================================

// No depender del comentario // EVENTOS.
// Buscar el controlador real de clics.

const oldEvents =
  /\bconst\s+insertion\s*=\s*unique\s*\([\s\S]*?['"]bloque de eventos['"]\s*\)\s*;/g;

if (
  [...raw.matchAll(oldEvents)].length !== 1
) {
  throw Error(
    'No reconozco el ancla de eventos ' +
    'original. Sin cambios.'
  );
}

let corrected = raw.replace(
  oldEvents,

  "const insertion=unique(js," +
  "/\\bdocument\\s*\\.\\s*addEventListener" +
  "\\s*\\(\\s*['\"]click['\"]\\s*,\\s*async\\b/g," +
  "'controlador principal de eventos');"
);

// ===========================================
// 3. CORREGIR MÓDULO INDEPENDIENTE
// ===========================================

// Aceptar la versión simple de render()
// y la que ya tiene el botón Volver.

const moduleStarts = [
  ...corrected.matchAll(
    /\bconst\s+moduleAnchor\s*=/g
  )
];

const deleteStarts = [
  ...corrected.matchAll(
    /\bconst\s+oldDel\s*=/g
  )
];

if (
  moduleStarts.length !== 1 ||
  deleteStarts.length !== 1 ||
  moduleStarts[0].index >=
    deleteStarts[0].index
) {
  throw Error(
    'No reconozco la sección del módulo ' +
    'independiente. Sin cambios.'
  );
}

const a = moduleStarts[0].index;
const b = deleteStarts[0].index;

const oldBlock = corrected.slice(a, b);

if (
  !oldBlock.includes('modeLine') ||
  !oldBlock.includes('moduleAnchor')
) {
  throw Error(
    'Cambió la estructura del módulo. ' +
    'Sin cambios.'
  );
}

const moduleFix = String.raw`

// Módulo independiente con o sin
// botón Volver instalado previamente.

const plainModule =
  /else\s+if\s*\(\s*mode\s*===\s*['"]module['"]\s*\)\s*renderOrg\(\s*['"]ggsModuleOrg['"]\s*,\s*false\s*\)\s*;/g;

const foundModule = [
  ...js.matchAll(plainModule)
];

if (foundModule.length === 1) {

  js = js.replace(
    plainModule,

    "else if(mode==='module'){" +
    "renderOrg('ggsModuleOrg',false);" +

    "const host=$('ggsModuleOrg');" +

    "if(host&&!host.querySelector('.ggs-full-exit')){" +

    "const link=document.createElement('a');" +

    "link.className='ggs-full-exit';" +
    "link.href='sistema.html';" +

    "link.textContent='← Volver al sistema';" +

    "host.append(link);" +
    "}}"
  );

} else if (
  foundModule.length !== 0 ||
  !js.includes(
    "link.className='ggs-full-exit'"
  )
) {

  throw Error(
    'Rama de módulo no reconocida. Sin cambios.'
  );
}

// Activar fullscreen una sola vez.

if (
  !js.includes(
    "document.body.classList.add('ggs-fullscreen-module')"
  )
) {

  const tokenDecl =
    /const\s+token\s*=\s*\(\s*\)\s*=>/g;

  unique(
    js,
    tokenDecl,
    'declaración token'
  );

  js = js.replace(
    tokenDecl,

    "if(mode==='module')" +
    "document.body.classList.add(" +
    "'ggs-fullscreen-module');\n" +
    " const token=()=>"
  );
}

`;

corrected =
  corrected.slice(0, a) +
  moduleFix +
  '\n' +
  corrected.slice(b);

// ===========================================
// 4. VALIDAR INSTALADOR CORREGIDO
// ===========================================

new vm.Script(corrected, {
  filename: 'instalador-v5-corregido.cjs'
});

// ===========================================
// 5. CREAR PRUEBA TEMPORAL
// ===========================================

const temp = fs.mkdtempSync(
  path.join(
    os.tmpdir(),
    'gg-foro-v5-final-'
  )
);

try {

  // Copias temporales fuera del proyecto.
  // Se eliminan automáticamente al terminar.

  for (const [name, bytes] of original) {

    const dst = fileAt(temp, name);

    fs.mkdirSync(
      path.dirname(dst),
      {recursive:true}
    );

    fs.writeFileSync(dst, bytes);
  }

  const runner = fileAt(
    temp,
    'instalar-v5-corregido.cjs'
  );

  fs.writeFileSync(
    runner,
    corrected,
    'utf8'
  );

  const run = () =>
    spawnSync(
      process.execPath,
      [runner],
      {
        cwd:temp,
        encoding:'utf8',
        windowsHide:true,
        timeout:30000
      }
    );

  // =========================================
  // 6. PRIMERA PRUEBA
  // =========================================

  const first = run();

  if (
    first.error ||
    first.status !== 0
  ) {

    throw Error(
      'Prueba 1 falló. ' +
      'Tu proyecto NO se tocó:\n' +

      (
        first.stderr ||
        first.stdout ||
        first.error?.message ||
        'Error desconocido'
      )
    );
  }

  const jsTest = fs.readFileSync(
    fileAt(temp, files[0]),
    'utf8'
  );

  new vm.Script(jsTest, {
    filename:files[0]
  });

  if (
    !jsTest.includes(marker) ||
    !jsTest.includes(
      'ggs-fullscreen-module'
    ) ||
    !jsTest.includes(
      'gg_social_post_media_list'
    )
  ) {

    throw Error(
      'Faltan funciones V5 en el resultado. ' +
      'Proyecto sin cambios.'
    );
  }

  const resultOnce = new Map(
    files.map(name => [
      name,
      fs.readFileSync(
        fileAt(temp, name)
      )
    ])
  );

  // =========================================
  // 7. SEGUNDA PRUEBA: NO DUPLICAR
  // =========================================

  const second = run();

  if (
    second.error ||
    second.status !== 0 ||
    !/Archivos modificados:\s*0\b/.test(
      second.stdout
    )
  ) {

    throw Error(
      'Prueba 2 falló. ' +
      'Proyecto sin cambios:\n' +

      (
        second.stderr ||
        second.stdout ||
        second.error?.message ||
        ''
      )
    );
  }

  for (const [name, bytes] of resultOnce) {

    if (
      !bytes.equals(
        fs.readFileSync(
          fileAt(temp, name)
        )
      )
    ) {

      throw Error(
        'La segunda ejecución alteró ' +
        name +
        '. Sin cambios reales.'
      );
    }
  }

  // =========================================
  // 8. DETECTAR CAMBIOS CONCURRENTES
  // =========================================

  for (const [name, bytes] of original) {

    if (
      !bytes.equals(
        fs.readFileSync(
          fileAt(root, name)
        )
      )
    ) {

      throw Error(
        name +
        ' cambió durante la prueba. ' +
        'No se aplicó nada.'
      );
    }
  }

  console.log(
    '✓ Prueba aislada 1: correcta.'
  );

  console.log(
    '✓ JavaScript resultante: válido.'
  );

  console.log(
    '✓ Prueba aislada 2: 0 modificaciones.'
  );

  // =========================================
  // 9. APLICAR ÚNICAMENTE RESULTADO PROBADO
  // =========================================

  const touched = [];

  try {

    for (
      const [name, after]
      of resultOnce
    ) {

      const prior = original.get(name);

      if (prior.equals(after)) {
        continue;
      }

      touched.push(name);

      fs.writeFileSync(
        fileAt(root, name),
        after
      );
    }

  } catch (err) {

    // Restauración desde memoria.
    // Sin crear archivos de respaldo.

    for (
      const name
      of touched.reverse()
    ) {

      try {

        fs.writeFileSync(
          fileAt(root, name),
          original.get(name)
        );

      } catch (re) {

        console.error(
          'No se pudo restaurar ' +
          name,
          re.message
        );
      }
    }

    throw err;
  }

  // =========================================
  // RESULTADO
  // =========================================

  console.log(
    '✓ Foro V5 + pantalla completa instalados.'
  );

  console.log(
    '✓ Archivos modificados: ' +
    touched.length
  );

  console.log(
    '✓ Login de YO, Nómina y SQL intactos.'
  );

  console.log(
    '✓ Sin archivos .bak.'
  );

  console.log(
    '✓ Inicia npm start y recarga con Ctrl+F5.'
  );

} finally {

  fs.rmSync(
    temp,
    {
      recursive:true,
      force:true
    }
  );
}
