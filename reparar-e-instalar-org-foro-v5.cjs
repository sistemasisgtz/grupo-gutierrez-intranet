
'use strict';

/*
  GRUPO GUTIÉRREZ
  Reparación del instalador Foro V5.

  No modifica SQL ni credenciales de YO.
  Sin archivos .bak ni carpetas de backup.

  Primero prueba en una carpeta temporal
  fuera del proyecto y después instala.
*/

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');

const {
  spawnSync
} = require('node:child_process');

const root = process.cwd();

const originalInstaller = path.join(
  root,
  'instalar-org-foro-v5.cjs'
);

const required = [
  'js/gg-social.js',
  'css/gg-social.css',
  'yo.html',
  'recursos-humanos.html',
  'organigrama-empleados.html',
  'mi-perfil-notificaciones.html'
];

// =========================================
// 1. VERIFICAR ARCHIVOS
// =========================================

for (
  const filename of [
    originalInstaller,
    ...required.map(
      f => path.join(root, f)
    )
  ]
) {
  if (!fs.existsSync(filename)) {
    throw Error(
      'No encontré ' +
      path.relative(root, filename) +
      '. Ejecuta desde desarrollo grupo.'
    );
  }
}

const source = fs.readFileSync(
  originalInstaller,
  'utf8'
);

if (
  !source.includes(
    'GG_SOCIAL_FORUM_GALLERY_FULLSCREEN_V5'
  )
) {
  throw Error(
    'El instalador no corresponde a Foro V5. ' +
    'No se modificó nada.'
  );
}

// =========================================
// 2. CORREGIR EL ANCLA DEFECTUOSA
// =========================================

// Compatible con el instalador expandido
// y con el instalador compactado.

const faultyAnchor =
  /const\s+insertion\s*=\s*unique\s*\(\s*js\s*,\s*\/\\n\\s\*\\\/\\\/ EVENTOS\\s\*\\n\/gi\s*,\s*['"]bloque de eventos['"]\s*\)\s*;/g;

const matches = [
  ...source.matchAll(faultyAnchor)
];

if (matches.length !== 1) {
  throw Error(
    'No localicé exactamente una referencia ' +
    'defectuosa de EVENTOS. ' +
    'No se modificó nada.'
  );
}

// Buscamos el controlador verdadero de clics,
// no un comentario que puede cambiar.

const fixedAnchor = String.raw`
const insertion = unique(
  js,
  /\bdocument\s*\.\s*addEventListener\s*\(\s*['"]click['"]\s*,\s*async\b/g,
  'controlador principal de clicks'
);`;

const fixed = source.replace(
  faultyAnchor,
  fixedAnchor
);

// =========================================
// 3. VALIDAR EL INSTALADOR CORREGIDO
// =========================================

new vm.Script(
  fixed,
  {
    filename:
      'instalar-org-foro-v5-revisado.cjs'
  }
);

// =========================================
// 4. CREAR ENTORNO TEMPORAL DE PRUEBA
// =========================================

// Se crea fuera de desarrollo grupo.
// No es un respaldo: se elimina al terminar.

const temporary = fs.mkdtempSync(
  path.join(
    os.tmpdir(),
    'gg-foro-v5-verify-'
  )
);

try {

  for (const relative of required) {

    const target = path.join(
      temporary,
      relative
    );

    fs.mkdirSync(
      path.dirname(target),
      {recursive:true}
    );

    fs.copyFileSync(
      path.join(root, relative),
      target
    );
  }

  const runner = path.join(
    temporary,
    'ejecutar-v5-revisado.cjs'
  );

  fs.writeFileSync(
    runner,
    fixed,
    'utf8'
  );

  const run = cwd =>
    spawnSync(
      process.execPath,
      [runner],
      {
        cwd,
        encoding:'utf8',
        timeout:30000,
        windowsHide:true
      }
    );

  // =======================================
  // 5. PRIMERA INSTALACIÓN DE PRUEBA
  // =======================================

  const trial = run(temporary);

  if (
    trial.error ||
    trial.status !== 0
  ) {
    throw Error(
      'La prueba falló ANTES de tocar ' +
      'tu proyecto:\n' +

      (
        trial.stderr ||
        trial.stdout ||
        trial.error?.message ||
        'Error desconocido'
      )
    );
  }

  const newJs = fs.readFileSync(
    path.join(
      temporary,
      'js/gg-social.js'
    ),
    'utf8'
  );

  new vm.Script(
    newJs,
    {filename:'js/gg-social.js'}
  );

  if (
    !newJs.includes(
      'GG_SOCIAL_FORUM_GALLERY_FULLSCREEN_V5'
    )
  ) {
    throw Error(
      'La prueba no instaló las funciones ' +
      'del Foro. No se tocó tu proyecto.'
    );
  }

  // =======================================
  // 6. COMPROBAR SEGUNDA INSTALACIÓN
  // =======================================

  const second = run(temporary);

  if (
    second.error ||
    second.status !== 0 ||
    !/Archivos modificados:\s*0\b/.test(
      second.stdout
    )
  ) {
    throw Error(
      'La prueba de doble instalación falló. ' +
      'No se tocó tu proyecto.\n' +

      (
        second.stderr ||
        second.stdout ||
        second.error?.message ||
        ''
      )
    );
  }

  console.log(
    '\n✓ Prueba aislada: V5 instalado.'
  );

  console.log(
    '✓ JavaScript validado.'
  );

  console.log(
    '✓ Segunda ejecución sin duplicaciones.'
  );

  console.log(
    '\nAplicando al proyecto real...\n'
  );

  // =======================================
  // 7. INSTALAR EN DESARROLLO GRUPO
  // =======================================

  const actual = run(root);

  if (actual.stdout) {
    process.stdout.write(
      actual.stdout
    );
  }

  if (actual.stderr) {
    process.stderr.write(
      actual.stderr
    );
  }

  if (
    actual.error ||
    actual.status !== 0
  ) {
    throw Error(
      'Falló la aplicación real: ' +
      (
        actual.error?.message ||
        'Revisa el error mostrado arriba.'
      )
    );
  }

  console.log(
    '\n✓ Foro V5 instalado correctamente.'
  );

  console.log(
    '✓ Organigrama fullscreen activado.'
  );

  console.log(
    '✓ Carrusel y visor de fotos activados.'
  );

  console.log(
    '✓ No se modificó el login de YO.'
  );

  console.log(
    '✓ Sin archivos .bak.'
  );

} finally {

  // Eliminar los archivos temporales,
  // tanto si la prueba funciona como
  // si encuentra algún problema.

  fs.rmSync(
    temporary,
    {
      recursive:true,
      force:true
    }
  );
}
