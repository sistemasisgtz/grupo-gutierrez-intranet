
"use strict";

/*
 GRUPO GUTIÉRREZ
 Nómina: coincidencia exacta V2

 Ejecutar:
 node instalar-nomina-coincidencia-v2.cjs

 Modifica solamente:
 - js/gg-payroll.js
 - nomina.html

 Sin .bak ni carpetas de respaldo.
 Validaciones previas y restauración en memoria.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = process.cwd();

const jsPath = path.join(
  root, "js", "gg-payroll.js"
);

const htmlPath = path.join(
  root, "nomina.html"
);

for (const file of [jsPath, htmlPath]) {
  if (!fs.existsSync(file)) {
    throw Error(
      "Falta " + file +
      ". Ejecuta desde desarrollo grupo."
    );
  }
}

const oldJS = fs.readFileSync(jsPath);
const oldHTML = fs.readFileSync(htmlPath);

let js = oldJS.toString("utf8");
let html = oldHTML.toString("utf8");

const MARK = "GG_NOMINA_MATCH_EXACTO_V2";

const core = String.raw`

/* GG_NOMINA_MATCH_EXACTO_V2 */

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function words(value) {
  return normalize(value)
    .split(/\s+/)
    .filter(Boolean);
}

function signature(tokens) {
  return tokens.slice().sort().join("|");
}

// Etiquetas de campos que no son nombres.

const PAYROLL_LABELS = new Set([
  "NOMBRE",
  "NOMBRES",
  "APELLIDO",
  "APELLIDOS",
  "PATERNO",
  "MATERNO",
  "TRABAJADOR",
  "TRABAJADORA",
  "EMPLEADO",
  "EMPLEADA",
  "COLABORADOR",
  "COLABORADORA",
  "PRIMER",
  "SEGUNDO",
  "DATOS",
  "PERSONALES",
  "COMPLETO"
]);

/*
 Coincidencia exacta:

 - Todas las palabras son obligatorias.
 - Se consideran palabras repetidas.
 - No importa el orden.
 - No importan los acentos.
 - Se buscan campos consecutivos del PDF.
 - Dos empleados coincidentes: revisión.
*/

function match(lines) {
  const signatures = new Map();

  for (const employee of state.employees) {

    // El catálogo RPC debe devolver
    // empleados activos. Si incluye la
    // propiedad active, descartamos falsos.

    if (
      employee.active === false ||
      employee.active === 0 ||
      employee.active === "false"
    ) {
      continue;
    }

    const tokens = words(
      employee.full_name
    );

    if (
      tokens.length < 2 ||
      tokens.length > 12
    ) {
      continue;
    }

    const key = signature(tokens);

    if (!signatures.has(key)) {
      signatures.set(key, []);
    }

    signatures.get(key).push(employee);
  }

  // Organizar nombres por cantidad de palabras.

  const bySize = new Map();

  for (const key of signatures.keys()) {

    const size = key.split("|").length;

    if (!bySize.has(size)) {
      bySize.set(size, new Map());
    }

    bySize.get(size).set(
      key,
      signatures.get(key)
    );
  }

  // Separar cada interpretación y página.
  // No juntar nombres entre páginas distintas.

  const blocks = [];

  let current = [];
  let lastPage = null;

  function finish() {

    if (current.length) {
      blocks.push(current);
    }

    current = [];
  }

  for (const row of lines) {

    if (row === null) {
      finish();
      lastPage = null;
      continue;
    }

    const page =
      typeof row === "object"
        ? row.page
        : 0;

    const text =
      typeof row === "object"
        ? row.text
        : row;

    if (
      lastPage !== null &&
      page !== lastPage
    ) {
      finish();
    }

    lastPage = page;

    if (String(text || "").trim()) {
      current.push(String(text));
    }
  }

  finish();

  const found = new Map();

  function scan(segment) {

    const raw = words(segment);

    if (raw.length > 70) return;

    // Buscar primero el nombre directo
    // y después sin las etiquetas de RH.

    const cleaned = raw.filter(
      t => !PAYROLL_LABELS.has(t)
    );

    for (const tokens of [raw, cleaned]) {

      for (const [size, catalog] of bySize) {

        if (tokens.length < size) {
          continue;
        }

        for (
          let i = 0;
          i <= tokens.length - size;
          i++
        ) {

          const key = signature(
            tokens.slice(i, i + size)
          );

          const employees = catalog.get(key);

          if (!employees) continue;

          for (const employee of employees) {

            found.set(employee.id, {

              employee,

              line: segment.slice(
                0, 240
              )
            });
          }
        }
      }
    }
  }

  // Buscar nombres en una misma línea
  // o repartidos en hasta cuatro renglones.

  for (const rows of blocks) {

    for (let i = 0; i < rows.length; i++) {

      let segment = "";
      let sumWords = 0;

      for (
        let n = 0;
        n < 4 && i + n < rows.length;
        n++
      ) {

        const line = rows[i + n];
        const count = words(line).length;

        // Evitar atravesar párrafos completos.

        if (
          count > 35 ||
          sumWords + count > 70
        ) {
          break;
        }

        sumWords += count;

        segment += (
          segment ? " " : ""
        ) + line;

        // Tres o cuatro renglones largos
        // requieren etiquetas relacionadas
        // con nombre y apellidos.

        if (
          n >= 2 &&
          !/\b(NOMBRE|APELLIDO|PATERNO|MATERNO|EMPLEAD|TRABAJAD)/i
            .test(segment) &&
          sumWords > 15
        ) {
          break;
        }

        scan(segment);
      }
    }
  }

  const hits = [...found.values()];

  // Un único empleado identificado.

  if (hits.length === 1) {

    return {
      status: "exact",

      employee: hits[0].employee,

      extracted: hits[0].line,

      detail:
        "Exacto: mismas palabras " +
        "(sin importar orden ni acentos)."
    };
  }

  // Dos o más empleados: nunca autoasignar.

  if (hits.length > 1) {

    return {
      status: "review",
      employee: null,

      extracted: hits.map(
        h => h.employee.full_name
      ).join(" / ").slice(0, 240),

      detail:
        "Coinciden varios empleados activos: " +
        "seleccionar manualmente."
    };
  }

  return {
    status: "missing",
    employee: null,
    extracted: "",

    detail: blocks.length
      ? "No hay nombre completo exacto " +
        "en el texto del PDF."
      : "El PDF no contiene texto extraíble; " +
        "verifica si es un escaneo."
  };
}

// Reconstruir correctamente líneas visuales.
// PDF.js puede dividir una palabra en fragmentos.

function payrollVisualRows(items) {

  const rows = [];

  for (const item of items) {

    const s = String(item.str || "");

    if (!s.trim()) continue;

    const x = Number(
      item.transform?.[4]
    );

    const y = Number(
      item.transform?.[5]
    );

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    ) {
      continue;
    }

    const height =
      Number(item.height) || 0;

    const tolerance = Math.max(
      2.5,
      Math.min(
        6,
        height * .4 || 3
      )
    );

    let row = rows.find(
      r => Math.abs(r.y - y) <= tolerance
    );

    if (!row) {

      row = {
        y,
        items: []
      };

      rows.push(row);
    }

    row.items.push({
      x,
      s,
      width: Number(item.width) || 0
    });
  }

  // Orden visual superior a inferior.

  rows.sort(
    (a, b) => b.y - a.y
  );

  const smart = [];
  const separated = [];

  for (const row of rows) {

    // Orden horizontal.

    row.items.sort(
      (a, b) => a.x - b.x
    );

    let text = "";
    let previous = null;

    for (const part of row.items) {

      if (previous) {

        const gap =
          part.x -
          previous.x -
          previous.width;

        const chars =
          Array.from(
            previous.s.trim()
          ).length || 1;

        const avg =
          previous.width / chars;

        const touching =
          previous.width > 0 &&
          gap <= Math.max(
            .8,
            Math.min(
              3.5,
              avg * .35
            )
          );

        const hasSpace =
          /\s$/.test(previous.s) ||
          /^\s/.test(part.s);

        // Si los fragmentos se tocan,
        // forman una sola palabra.

        if (
          !touching &&
          !hasSpace
        ) {
          text += " ";
        }
      }

      text += part.s;
      previous = part;
    }

    smart.push(text);

    // Interpretación alternativa:
    // PDF.js ya entregó palabras separadas.

    separated.push(
      row.items.map(
        x => x.s
      ).join(" ")
    );
  }

  return {
    smart,
    separated
  };
}

async function readPdf(file) {

  const raw = new Uint8Array(
    await file.arrayBuffer()
  );

  if (
    String.fromCharCode(
      ...raw.slice(0, 5)
    ) !== "%PDF-"
  ) {

    throw Error(
      "El archivo no tiene cabecera PDF."
    );
  }

  if (!window.pdfjsLib) {

    throw Error(
      "No cargó PDF.js."
    );
  }

  const pdf =
    await pdfjsLib.getDocument({
      data: raw
    }).promise;

  const lines = [];

  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
  ) {

    const page = await pdf.getPage(
      pageNumber
    );

    const content =
      await page.getTextContent();

    const visual = payrollVisualRows(
      content.items || []
    );

    // Interpretación A:
    // recomponer las palabras fragmentadas.

    for (const text of visual.smart) {

      lines.push({
        page: pageNumber,
        text
      });
    }

    lines.push(null);

    // Interpretación B:
    // respetar palabras ya separadas.

    for (const text of visual.separated) {

      lines.push({
        page: pageNumber,
        text
      });
    }

    lines.push(null);

    // Interpretación C:
    // utilizar saltos de línea de PDF.js.

    let chunk = "";

    for (const item of content.items || []) {

      chunk += String(
        item.str || ""
      ) + " ";

      if (item.hasEOL) {

        lines.push({
          page: pageNumber,
          text: chunk
        });

        chunk = "";
      }
    }

    if (chunk.trim()) {

      lines.push({
        page: pageNumber,
        text: chunk
      });
    }

    lines.push(null);
  }

  return match(lines);
}
`;

// =================================================
// VALIDAR QUE SEA EL ARCHIVO ESPERADO
// =================================================

function one(source, re, description) {

  const hits = [
    ...source.matchAll(re)
  ];

  if (hits.length !== 1) {

    throw Error(
      description +
      ": esperaba 1 coincidencia, encontré " +
      hits.length +
      ". Sin cambios."
    );
  }

  return hits[0];
}

// =================================================
// PRUEBAS AUTOMÁTICAS ANTES DE MODIFICAR
// =================================================

const testSource = `
 const state = {employees:[]};
 const window = {};

 ${core}

 function test(names, lines, wanted) {

   state.employees = names.map(
     (x,i) =>
       typeof x === 'string'
         ? {
             id: String(i),
             full_name: x,
             active: true
           }
         : x
   );

   const actual = match(lines).status;

   if (actual !== wanted) {
     throw Error(
       'Prueba: ' +
       actual + ' !== ' + wanted
     );
   }
 }

 test(
   ['José Luis Muñoz de la Cruz'],
   ['LUIS JOSE DE LA CRUZ MUNOZ'],
   'exact'
 );

 test(
   ['Alberto Pérez Soto'],
   [
     'APELLIDO PATERNO PEREZ',
     'APELLIDO MATERNO SOTO',
     'NOMBRES ALBERTO'
   ],
   'exact'
 );

 test(
   ['María Sofía Hernández Vázquez'],
   [
     'NOMBRE MARIA SOFIA',
     'HERNANDEZ VAZQUEZ'
   ],
   'exact'
 );

 test(
   ['Juan José Salas'],
   ['JUAN SALAS'],
   'missing'
 );

 test(
   ['María María Santos'],
   ['MARIA SANTOS'],
   'missing'
 );

 test(
   [
     'Ana María Pérez',
     'Pérez Ana María'
   ],
   ['ANA MARIA PEREZ'],
   'review'
 );

 test(
   [
     {
       id:'1',
       full_name:'Ana Maria Perez',
       active:true
     },
     {
       id:'2',
       full_name:'Perez Ana Maria',
       active:false
     }
   ],
   ['ANA MARIA PEREZ'],
   'exact'
 );

 test(
   ['Ana María Pérez'],
   [
     {page:1, text:'ANA MARIA'},
     null,
     {page:2, text:'PEREZ'}
   ],
   'missing'
 );

 test(
   ['Ana María Pérez'],
   [],
   'missing'
 );

 test(
   ['María-José Orozco'],
   ['OROZCO MARIA JOSE'],
   'exact'
 );

 const visual = payrollVisualRows([
   {
     str:'MAR',
     transform:[1,0,0,1,10,99],
     width:18,
     height:10
   },
   {
     str:'ÍA',
     transform:[1,0,0,1,28,99.5],
     width:10,
     height:10
   },
   {
     str:' PÉREZ',
     transform:[1,0,0,1,41,99],
     width:37,
     height:10
   },
   {
     str:' SOTO',
     transform:[1,0,0,1,83,99],
     width:28,
     height:10
   }
 ]);

 if (
   !visual.smart.includes(
     'MARÍA PÉREZ SOTO'
   )
 ) {
   throw Error(
     'Reconstrucción PDF incorrecta'
   );
 }
`;

vm.runInNewContext(
  testSource,
  {console}
);

// =================================================
// REEMPLAZAR SOLO EL MOTOR DE COINCIDENCIA
// =================================================

if (!js.includes(MARK)) {

  for (const pattern of [
    /function normalize\(value\)\s*\{/g,
    /function match\(lines\)\s*\{/g,
    /async function readPdf\(file\)\s*\{/g,
    /function label\(status\)\s*\{/g
  ]) {

    one(
      js,
      pattern,
      "Función de Nómina"
    );
  }

  const a = js.indexOf(
    "function normalize(value) {"
  );

  const b = js.indexOf(
    "function label(status) {",
    a
  );

  if (a < 0 || b <= a) {

    throw Error(
      "No reconocí el analizador de Nómina. " +
      "Sin cambios."
    );
  }

  js =
    js.slice(0, a) +
    core.trim() +
    "\n\n" +
    js.slice(b);
}

// =================================================
// TEXTO EXPLICATIVO Y CACHÉ
// =================================================

const message =
  /La coincidencia exacta requiere\s+todas las palabras del nombre\s+y un único empleado activo\./g;

if (
  [...html.matchAll(message)].length === 1
) {

  html = html.replace(
    message,

    "Coincidencia exacta: todas las " +
    "palabras del nombre, sin importar " +
    "su orden ni los acentos; un único " +
    "empleado activo."
  );

} else if (
  !html.includes(
    "Coincidencia exacta: todas las palabras"
  )
) {

  throw Error(
    "Cambió el texto de ayuda de Nómina. " +
    "Sin cambios."
  );
}

const script =
  /(src\s*=\s*["']js\/gg-payroll\.js)(?:\?[^"']*)?(["'])/g;

one(
  html,
  script,
  "Script de Nómina"
);

html = html.replace(
  script,
  "$1?v=coincidencia-v2$2"
);

if (!/<\/html\s*>/i.test(html)) {

  throw Error(
    "HTML incompleto. Sin cambios."
  );
}

// =================================================
// VALIDACIÓN FINAL ANTES DE ESCRIBIR
// =================================================

new vm.Script(
  js,
  {filename:"js/gg-payroll.js"}
);

if (!js.includes(MARK)) {

  throw Error(
    "No se aplicó el algoritmo. Sin cambios."
  );
}

// =================================================
// ESCRITURA CON RECUPERACIÓN EN MEMORIA
// =================================================

const changes = [
  [
    jsPath,
    oldJS,
    Buffer.from(js)
  ],
  [
    htmlPath,
    oldHTML,
    Buffer.from(html)
  ]
];

const written = [];

try {

  for (
    const [file, oldData, newData]
    of changes
  ) {

    if (
      oldData.equals(newData)
    ) {
      continue;
    }

    written.push([
      file,
      oldData
    ]);

    fs.writeFileSync(
      file,
      newData
    );
  }

} catch (e) {

  for (
    const [file, oldData]
    of written.reverse()
  ) {

    try {

      fs.writeFileSync(
        file,
        oldData
      );

    } catch (re) {

      console.error(
        "No se pudo restaurar " + file,
        re.message
      );
    }
  }

  throw e;
}

// =================================================
// TERMINADO
// =================================================

console.log(
  "✓ 11 pruebas automáticas de " +
  "coincidencia correctas."
);

console.log(
  "✓ Nombres desordenados, acentos, " +
  "PDF fragmentados y duplicados protegidos."
);

console.log(
  "✓ Archivos modificados: " +
  written.length +
  " (sin .bak)."
);

console.log(
  "✓ YO, Nómina privada existente " +
  "y Supabase intactos."
);
