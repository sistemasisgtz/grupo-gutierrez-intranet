
"use strict";

/*
  GRUPO GUTIÉRREZ
  CULTURA ORGANIZACIONAL V1

  Ejecutar:
  node instalar-cultura-organizacional-v1.cjs

  No modifica gg-social.js, yo-login.js,
  Nómina ni las funciones existentes de YO.

  Sin .bak ni carpetas de respaldo.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

function decode(base64, sha) {
  const bytes = zlib.brotliDecompressSync(
    Buffer.from(base64, 'base64')
  );

  if (
    crypto.createHash('sha256')
      .update(bytes)
      .digest('hex') !== sha
  ) {
    throw Error(
      'El instalador se copió incompleto. ' +
      'Falló la verificación SHA-256. Sin cambios.'
    );
  }

  return bytes.toString('utf8');
}

const root = process.cwd();
const dest = p => path.join(root, p);

// INTERFAZ JS
const code = decode(
'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'
,
'235c81ecf51199780f7bf24f2ab8c0e530c1ecad26a28d3f58d5fa722b726978'
);

// ESTILOS CSS
const styles = decode(
'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'
,
'995890f970f17fcb7feae0bd84d1b0b713bda217f421694a5519a805342cdde0'
);

// NUEVA PÁGINA HTML
const page = decode(
'G9ADAIzTDTfizKbG/N45fY0aqwKpjVXUQNhLUuB798debspVJ6f0P4s1ipvHbXHQ0TYrNELMYjJvn2d2x1xDJoXlmVv79OlVYTid3k0VYoywxJZT2mW' +
'GBhZWi2Apeomb04MnGajTcBvKA3trF5XDdTVP8vmzPg8pukVm1kfCB4ggktFRUw09tZPfOwL4oR736r8i2ber59leYcng2THbPbFk8eGTuEVcwagF+W' +
'WztwUGiB2Bf3Zn6mXgbP0qyvsxDcMNnjRpUWasACrd4UW8O4ZaF83/nQYIisKLxJQlq/bsUZHiEONmURiPEbtmnDFDkK8yyc6b9Ba95sgtKiAs7jgbE' +
's2/Q6nJ2Ddu4VBAs0GKqIxZwSIIxsRKSL7W1e1k51ZWGQH8+MR8EZKKvJ9bI7q635ERmtVciJaV3CRjasYDw4Q/X2NMsK1slfv36x4W+C5je7+Gj35N' +
'BjimZ3LEg8kazSBR6tU4xh/nIAVe1MjMxw35YA0JiLVRH5IAbuE='
,
'b71739f82bfdf32accf5202ea30c23f6797b6420e533be974d24933eb553a5fd'
);

// ARCHIVOS REQUERIDOS
const mandatory = [
  'sistema.html',
  'yo.html',
  'js/sistema.js',
  'organigrama-empleados.html',
  'js/gg-social.js'
];

for (const p of mandatory) {
  if (!fs.existsSync(dest(p))) {
    throw Error(
      'Falta ' + p +
      '. Ejecuta desde desarrollo grupo.'
    );
  }
}

const social = fs.readFileSync(
  dest('js/gg-social.js'),
  'utf8'
);

if (
  !social.includes('gg_social_snapshot') ||
  !social.includes('gg_social_post_media_list') ||
  !social.includes('GG_SOCIAL_YO_SESSION_FIX_V3')
) {
  throw Error(
    'Se requiere el Organigrama/Foro V5 ' +
    'que ya funciona en YO. Sin cambios.'
  );
}

const old = new Map();

for (const p of mandatory.slice(0, 4)) {
  old.set(p, fs.readFileSync(dest(p)));
}

for (const p of [
  'cultura-organizacional.html',
  'js/gg-cultura.js',
  'css/gg-cultura.css'
]) {
  old.set(
    p,
    fs.existsSync(dest(p))
      ? fs.readFileSync(dest(p))
      : null
  );
}

const next = new Map();

// RUTA DEL SISTEMA CENTRAL
let system = old.get('js/sistema.js')
  .toString('utf8');

const route =
  '"cultura-organizacional": ' +
  '{name:"Cultura Organizacional",' +
  'url:"cultura-organizacional.html"},';

if (!system.includes(route)) {
  const match = [
    ...system.matchAll(
      /"organigrama-empleados"\s*:\s*\{/g
    )
  ];

  if (match.length !== 1) {
    throw Error(
      'No encontré una ruta única del ' +
      'Organigrama. Sin cambios.'
    );
  }

  system =
    system.slice(0, match[0].index) +
    route + '\n    ' +
    system.slice(match[0].index);
}

next.set('js/sistema.js', system);

// RENOMBRAR TARJETA DEL SISTEMA
let html = old.get('sistema.html')
  .toString('utf8');

if (
  !/data-module=["']cultura-organizacional["']/
    .test(html)
) {
  const re =
    /<button\b[^>]*data-module=["']organigrama-empleados["'][\s\S]*?<\/button>/gi;

  const found = [...html.matchAll(re)];

  if (found.length !== 1) {
    throw Error(
      'No se encontró una sola tarjeta ' +
      'de Organigrama. Sin cambios.'
    );
  }

  const replacement = found[0][0]
    .replace(
      /data-module=["']organigrama-empleados["']/,
      'data-module="cultura-organizacional"'
    )
    .replace(
      /organigrama y empleados/i,
      'Cultura Organizacional'
    )
    .replace(
      /Personas, equipos e insignias/i,
      'Organigrama, personas y comunidad'
    )
    .replace(
      />DIRECTORIO</i,
      '>CULTURA<'
    );

  html =
    html.slice(0, found[0].index) +
    replacement +
    html.slice(
      found[0].index +
      found[0][0].length
    );
}

next.set('sistema.html', html);

// INTEGRACIÓN EN YO
let yo = old.get('yo.html')
  .toString('utf8');

if (!yo.includes('css/gg-cultura.css')) {
  if (!/<\/head>/i.test(yo)) {
    throw Error(
      'Falta </head> en yo.html. Sin cambios.'
    );
  }

  yo = yo.replace(
    /<\/head>/i,
    '<link rel="stylesheet" ' +
    'href="css/gg-cultura.css?v=1">\n' +
    '</head>'
  );
}

if (!yo.includes('js/gg-cultura.js')) {
  if (!/<\/body>/i.test(yo)) {
    throw Error(
      'Falta </body> en yo.html. Sin cambios.'
    );
  }

  yo = yo.replace(
    /<\/body>/i,
    '<script src="js/gg-cultura.js?v=1">' +
    '</script>\n</body>'
  );
}

next.set('yo.html', yo);

// REGRESO DESDE ORGANIGRAMA AL NUEVO MÓDULO
let org = old.get('organigrama-empleados.html')
  .toString('utf8');

if (!org.includes('cultura-organizacional.html')) {
  const matches = [
    ...org.matchAll(
      /href="sistema\.html"/g
    )
  ];

  if (!matches.length) {
    throw Error(
      'No encontré el enlace de regreso ' +
      'del Organigrama. Sin cambios.'
    );
  }

  org = org.replace(
    /href="sistema\.html"/g,
    'href="cultura-organizacional.html"'
  );
}

next.set('organigrama-empleados.html', org);

// NUEVOS ARCHIVOS
next.set('cultura-organizacional.html', page);
next.set('js/gg-cultura.js', code);
next.set('css/gg-cultura.css', styles);

// VALIDAR ANTES DE ESCRIBIR
new vm.Script(
  code,
  {filename:'js/gg-cultura.js'}
);

new vm.Script(
  system,
  {filename:'js/sistema.js'}
);

for (const p of [
  'sistema.html',
  'yo.html',
  'organigrama-empleados.html',
  'cultura-organizacional.html'
]) {
  const content = next.get(p);

  if (!/<\/html\s*>/i.test(content)) {
    throw Error(
      'HTML incompleto: ' + p
    );
  }
}

if (
  !next.get('yo.html').includes('gg-social.js') ||
  !next.get('yo.html').includes('gg-cultura.js')
) {
  throw Error(
    'YO perdió la referencia al módulo original. ' +
    'No se modificó nada.'
  );
}

if (
  !next.get('sistema.html')
    .includes('data-module="cultura-organizacional"')
) {
  throw Error(
    'La tarjeta de Cultura no quedó conectada.'
  );
}

if (!next.get('js/sistema.js').includes(route)) {
  throw Error(
    'Falta la ruta de Cultura.'
  );
}

// ESCRITURA CON RECUPERACIÓN EN MEMORIA
const written = [];

try {
  for (const [name, content] of next) {
    const before = old.get(name);
    const after = Buffer.from(content, 'utf8');

    if (before && before.equals(after)) {
      continue;
    }

    fs.mkdirSync(
      path.dirname(dest(name)),
      {recursive:true}
    );

    written.push(name);

    fs.writeFileSync(
      dest(name),
      after
    );
  }

} catch (err) {
  for (const name of written.reverse()) {
    try {
      const before = old.get(name);

      if (before) {
        fs.writeFileSync(
          dest(name),
          before
        );

      } else {
        fs.rmSync(
          dest(name),
          {force:true}
        );
      }

    } catch (restoreError) {
      console.error(
        'No pude restaurar ' +
        name + ': ' +
        restoreError.message
      );
    }
  }

  throw err;
}

console.log(
  '✓ Cultura Organizacional instalada.'
);

console.log(
  '✓ Archivos modificados: ' +
  written.length
);

console.log(
  '✓ YO conserva su autenticación RH ' +
  'y su Organigrama V5.'
);

console.log(
  '✓ Directorio, insignias, filtros ' +
  'y Foro minimalista.'
);

console.log(
  '✓ Sin .bak ni carpetas de respaldo.'
);

console.log(
  'IMPORTANTE: instala por separado ' +
  'el SQL gg_cultura_directory.'
);
