
"use strict";

/*
  Grupo Gutiérrez — FIX NÓMINA RECEPTOR V3

  Ejecutar:
  node instalar-nomina-receptor-v3.cjs

  Sin .bak ni dependencias adicionales.
  Con validaciones y restauración en memoria.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = process.cwd();

const PATH_JS = path.join(
  ROOT, 'js', 'gg-payroll.js'
);

const PATH_HTML = path.join(
  ROOT, 'nomina.html'
);

for (const file of [PATH_JS, PATH_HTML]) {
  if (!fs.existsSync(file)) {
    throw Error(
      'Falta ' + file +
      '. Ejecuta desde desarrollo grupo.'
    );
  }
}

const ORIGINAL_JS = fs.readFileSync(PATH_JS);
const ORIGINAL_HTML = fs.readFileSync(PATH_HTML);

let code = ORIGINAL_JS.toString('utf8');
let html = ORIGINAL_HTML.toString('utf8');

const MARK = 'GG_NOMINA_RECEPTOR_V3';

const engine = String.raw`

/* GG_NOMINA_RECEPTOR_V3 */

// Solo buscar el RECEPTOR del recibo:
// "037 - NOMBRE DEL EMPLEADO".

function recipientHeader(value) {
  const s = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

  const hit = s.match(
    /(?:^|\s)(\d{1,6})\s*[-–—]\s*([A-ZÁÉÍÓÚÜÑ][^\r\n]*)/i
  );

  if (!hit) return null;

  const name = hit[2]
    .replace(
      /\b(?:EJERCICIO|PERIODO|RFC|CURP|FECHA|JORNADA|PUESTO|DEPTO|NSS|SALARIO|DOMICILIO|REGIMEN|RÉGIMEN|D[IÍ]AS)\s*:?\s*[\s\S]*$/i,
      ''
    )
    .replace(
      /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  const parts = words(name);

  if (
    parts.length < 2 ||
    parts.length > 12
  ) return null;

  return {
    number: hit[1],
    name,
    key: signature(parts)
  };
}

function match(candidates) {
  const recipients = [];
  const seen = new Set();

  for (const row of candidates) {
    const candidate =
      typeof row === 'string'
        ? recipientHeader(row)
        : row;

    if (
      !candidate ||
      !candidate.key
    ) continue;

    const uniqueness =
      candidate.number + ':' +
      candidate.key;

    if (!seen.has(uniqueness)) {
      seen.add(uniqueness);
      recipients.push(candidate);
    }
  }

  if (!recipients.length) {
    return {
      status: 'missing',
      employee: null,
      extracted: '',
      detail:
        'No pude leer el nombre del receptor ' +
        '(número - nombre) en el encabezado del PDF.'
    };
  }

  // Más de un receptor distinto:
  // nunca asignar automáticamente.

  const signatures = new Set(
    recipients.map(x => x.key)
  );

  if (signatures.size !== 1) {
    return {
      status: 'review',
      employee: null,

      extracted: recipients
        .map(x => x.name)
        .join(' / ')
        .slice(0, 240),

      detail:
        'El PDF contiene más de un nombre ' +
        'de receptor; revisar manualmente.'
    };
  }

  const recipient = recipients[0];

  // Únicamente empleados activos.
  // Mismas palabras, cualquier orden.
  // Mayúsculas y acentos normalizados.

  const matches = state.employees.filter(
    employee => {
      if (
        employee.active === false ||
        employee.active === 0 ||
        employee.active === 'false'
      ) return false;

      const tokens = words(
        employee.full_name
      );

      return (
        tokens.length >= 2 &&
        tokens.length <= 12 &&
        signature(tokens) === recipient.key
      );
    }
  );

  if (matches.length === 1) {
    return {
      status: 'exact',
      employee: matches[0],
      extracted: recipient.name,

      detail:
        'Receptor: ' +
        recipient.name +
        '. Coincidencia exacta ' +
        '(palabras, orden libre y sin acentos).'
    };
  }

  // Dos empleados con el mismo nombre:
  // no asignar por intuición.

  if (matches.length > 1) {
    return {
      status: 'review',
      employee: null,
      extracted: recipient.name,

      detail:
        'Receptor: ' +
        recipient.name +
        '. Hay ' +
        matches.length +
        ' empleados activos con ese mismo nombre.'
    };
  }

  return {
    status: 'missing',
    employee: null,
    extracted: recipient.name,

    detail:
      'Receptor identificado: ' +
      recipient.name +
      '. No existe una coincidencia ' +
      'exacta única en el catálogo activo de RH.'
  };
}

// Reconstruir renglones según sus coordenadas.
// Esto evita mezclar campos del PDF.

function recipientLines(items, pageHeight) {
  const groups = [];

  for (const item of items || []) {
    const x = Number(
      item.transform?.[4]
    );

    const y = Number(
      item.transform?.[5]
    );

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    ) continue;

    // Zona superior del recibo.
    // No analizar sellos ni firmas.

    if (
      pageHeight &&
      y < pageHeight * 0.45
    ) continue;

    const str = String(
      item.str ?? ''
    );

    if (!str.trim()) continue;

    let group = groups.find(
      g => Math.abs(g.y - y) <= 3.5
    );

    if (!group) {
      group = {
        y,
        parts: []
      };

      groups.push(group);
    }

    group.parts.push({
      x,
      str,
      width: Number(item.width) || 0
    });
  }

  groups.sort(
    (a, b) => b.y - a.y
  );

  const rows = groups.map(group => {
    group.parts.sort(
      (a, b) => a.x - b.x
    );

    let smart = '';
    let prior = null;

    for (const part of group.parts) {
      if (prior) {
        const gap =
          part.x -
          (prior.x + prior.width);

        const avgWidth =
          prior.width /
          Math.max(
            1,
            prior.str.trim().length
          );

        const contiguous =
          prior.width > 0 &&
          gap <= Math.max(
            1.2,
            Math.min(
              3.0,
              avgWidth * 0.3
            )
          );

        if (
          !contiguous &&
          !/\s$/.test(prior.str) &&
          !/^\s/.test(part.str)
        ) {
          smart += ' ';
        }
      }

      smart += part.str;
      prior = part;
    }

    return {
      smart,
      plain: group.parts
        .map(p => p.str)
        .join(' ')
    };
  });

  const candidates = [];

  for (let i = 0; i < rows.length; i++) {
    let hit =
      recipientHeader(rows[i].smart) ||
      recipientHeader(rows[i].plain);

    if (
      !hit &&
      /^\s*\d{1,6}\s*[-–—]\s*$/
        .test(rows[i].smart)
    ) {
      const joined =
        rows[i].smart +
        ' ' +
        (rows[i+1]?.smart || '');

      hit = recipientHeader(joined);
    }

    if (hit) {
      candidates.push(hit);
    }
  }

  return candidates;
}

async function readPdf(file) {
  const raw = new Uint8Array(
    await file.arrayBuffer()
  );

  if (
    String.fromCharCode(
      ...raw.slice(0, 5)
    ) !== '%PDF-'
  ) {
    throw Error(
      'El archivo no tiene cabecera PDF.'
    );
  }

  if (!window.pdfjsLib) {
    throw Error(
      'No cargó PDF.js.'
    );
  }

  const pdf = await pdfjsLib
    .getDocument({data: raw})
    .promise;

  const candidates = [];

  for (
    let n = 1;
    n <= pdf.numPages;
    n++
  ) {
    const page = await pdf.getPage(n);

    const content =
      await page.getTextContent();

    const height =
      page.getViewport?.({
        scale: 1
      })?.height ||

      (
        Array.isArray(page.view)
          ? page.view[3] - page.view[1]
          : 0
      );

    candidates.push(
      ...recipientLines(
        content.items,
        height
      )
    );
  }

  return match(candidates);
}

`;

// =========================================
// VALIDACIONES Y PRUEBAS
// =========================================

function unique(source, regex, label) {
  const hits = [
    ...source.matchAll(regex)
  ];

  if (hits.length !== 1) {
    throw Error(
      label +
      ': se esperaba una coincidencia, ' +
      'encontradas ' + hits.length +
      '. Nada modificado.'
    );
  }

  return hits[0];
}

const test = String.raw`
  const state = {employees: []};

  function normalize(x) {
    return String(x ?? '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim();
  }

  function words(x) {
    return normalize(x)
      .split(/\s+/)
      .filter(Boolean);
  }

  function signature(x) {
    return x.slice().sort().join('|');
  }
` + engine + String.raw`

  function check(ok, why) {
    if (!ok) {
      throw Error('Prueba fallida: ' + why);
    }
  }

  const c = recipientHeader(
    '014 - MARIA ANTONIA NAÑEZ MARES Ejercicio: 2026'
  );

  check(
    c && c.name === 'MARIA ANTONIA NAÑEZ MARES',
    'extraer receptor'
  );

  state.employees = [
    {
      id:'014',
      full_name:'Mares María Antonia Nanez',
      active:true
    },
    {
      id:'emisor',
      full_name:'José David Gutiérrez Macías',
      active:true
    }
  ];

  check(
    match([c]).employee?.id === '014',
    'mayúsculas, acentos, orden y excluir emisor'
  );

  state.employees.push({
    id:'duplicado',
    full_name:'María Antonia Nañez Mares',
    active:true
  });

  check(
    match([c]).status === 'review',
    'dos empleados activos'
  );

  state.employees[2].active = false;

  check(
    match([c]).status === 'exact',
    'empleados inactivos'
  );

  state.employees = [{
    id:'parcial',
    full_name:'María Antonia Mares',
    active:true
  }];

  check(
    match([c]).status === 'missing',
    'palabra faltante'
  );

  state.employees = [{
    id:'repetido',
    full_name:'Ana Ana Pérez',
    active:true
  }];

  check(
    match([
      recipientHeader('001 - Ana Pérez')
    ]).status === 'missing',
    'palabra repetida'
  );

  check(
    match([]).status === 'missing',
    'sin receptor'
  );

  const items = [
    {
      str:'014 - MARIA ANTONIA NAÑEZ MARES',
      width:235,
      transform:[1,0,0,1,46,680]
    },
    {
      str:'Ejercicio: 2026',
      width:80,
      transform:[1,0,0,1,304,680]
    },
    {
      str:'JOSE DAVID GUTIERREZ MACIAS',
      width:220,
      transform:[1,0,0,1,46,765]
    }
  ];

  const rows = recipientLines(
    items,
    794
  );

  check(
    rows.length === 1 &&
    rows[0].name === 'MARIA ANTONIA NAÑEZ MARES',
    'reconstrucción del encabezado'
  );
`;

vm.runInNewContext(
  test,
  {console}
);

// =========================================
// REEMPLAZAR EL ANALIZADOR ANTERIOR
// =========================================

if (!code.includes(MARK)) {
  const a = unique(
    code,
    /\bfunction\s+match\s*\(\s*lines\s*\)\s*\{/g,
    'Función match(lines)'
  );

  const b = unique(
    code,
    /\bfunction\s+label\s*\(\s*status\s*\)\s*\{/g,
    'Función label(status)'
  );

  if (b.index <= a.index) {
    throw Error(
      'Orden del analizador inesperado. ' +
      'Nada modificado.'
    );
  }

  code =
    code.slice(0, a.index) +
    engine +
    '\n\n' +
    code.slice(b.index);
}

// =========================================
// ACTUALIZAR CACHÉ DEL NAVEGADOR
// =========================================

const script =
  /(src\s*=\s*["']js\/gg-payroll\.js)(?:\?[^"']*)?(["'])/g;

unique(
  html,
  script,
  'Script de Nómina'
);

html = html.replace(
  script,
  '$1?v=receptor-v3$2'
);

if (!/<\/html\s*>/i.test(html)) {
  throw Error(
    'HTML incompleto. Nada modificado.'
  );
}

new vm.Script(
  code,
  {filename:'js/gg-payroll.js'}
);

if (!code.includes(MARK)) {
  throw Error(
    'No se aplicó el fix.'
  );
}

// =========================================
// ESCRIBIR CON RECUPERACIÓN EN MEMORIA
// =========================================

const edits = [
  [
    PATH_JS,
    ORIGINAL_JS,
    Buffer.from(code, 'utf8')
  ],
  [
    PATH_HTML,
    ORIGINAL_HTML,
    Buffer.from(html, 'utf8')
  ]
];

const applied = [];

try {
  for (
    const [file, oldValue, newValue]
    of edits
  ) {
    if (oldValue.equals(newValue)) {
      continue;
    }

    applied.push([
      file,
      oldValue
    ]);

    fs.writeFileSync(
      file,
      newValue
    );
  }

} catch (e) {
  for (
    const [file, oldValue]
    of applied.reverse()
  ) {
    try {
      fs.writeFileSync(
        file,
        oldValue
      );

    } catch (restoreError) {
      console.error(
        'Restauración fallida:',
        file,
        restoreError.message
      );
    }
  }

  throw e;
}

console.log(
  '✓ Analizador del receptor instalado.'
);

console.log(
  '✓ Mayúsculas, acentos, orden y duplicados validados.'
);

console.log(
  '✓ Archivos modificados: ' +
  applied.length +
  ' (sin .bak).'
);

console.log(
  '✓ Sin cambios a SQL, YO, permisos ni envío.'
);
