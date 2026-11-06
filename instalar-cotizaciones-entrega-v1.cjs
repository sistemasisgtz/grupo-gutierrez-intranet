
'use strict';

/*
 GRUPO GUTIÉRREZ · VENTAS
 TIEMPO DE ENTREGA SOLO PARA COTIZACIONES

 Ejecutar:
 node instalar-cotizaciones-entrega-v1.cjs

 Requiere ejecutar primero el SQL.
 No genera .bak ni carpetas de backup.
 No modifica remisiones ni ODC.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = process.cwd();
const changes = new Map();
const old = new Map();
const file = p => path.join(ROOT, p);

const required = [
  'js/ventas-cotizaciones.js',
  'js/ventas-pdf.js',
  'js/ventas-plus.js',
  'ventas.html'
];

for (const p of required) {
  if (!fs.existsSync(file(p))) {
    throw Error(
      'Falta ' + p +
      '. Ejecuta desde la raíz de desarrollo grupo.'
    );
  }

  old.set(p, fs.readFileSync(file(p)));
}

function once(source, find, replace, description) {
  const a = source.indexOf(find);

  if (
    a < 0 ||
    source.indexOf(find, a + find.length) !== -1
  ) {
    throw Error(
      'No encuentro una única referencia para ' +
      description +
      '. Sin archivos modificados.'
    );
  }

  return (
    source.slice(0, a) +
    replace +
    source.slice(a + find.length)
  );
}

function modify(p, marker, transform) {
  const original = old.get(p).toString('utf8');

  if (original.includes(marker)) return;

  const next = transform(original);

  if (!next.includes(marker)) {
    throw Error(
      'Falta marca ' + marker + ' en ' + p
    );
  }

  changes.set(p, next);
}

// =====================================================
// 1. FORMULARIO DE COTIZACIONES
// =====================================================

modify(
  'js/ventas-cotizaciones.js',
  'GG_QUOTE_DELIVERY_V1',
  source => {

    let s = once(
      source,
      '                <div class="sales-lines-head">',

      `                <!-- GG_QUOTE_DELIVERY_V1 -->

                <div class="gg-q-default-delivery sales-field">
                    <label for="salesQDefaultDelivery">
                        Tiempo de entrega por default
                        <small>(opcional · días)</small>
                    </label>

                    <input
                        id="salesQDefaultDelivery"
                        type="number"
                        min="1"
                        max="3650"
                        step="1"
                        inputmode="numeric"
                        placeholder="Ej. 5"
                        value="\${base?.delivery_default_days??''}"
                    >

                    <small>
                        Se aplica a las partidas nuevas
                        y a las que no hayas personalizado.
                    </small>
                </div>

                <div class="sales-lines-head">`,

      'campo general de cotizaciones'
    );

    // Cuando cambia el tiempo general,
    // solo se actualizan las partidas heredadas.

    s = once(
      s,
      '            root.querySelector("#salesQAddLine").onclick=()=>addLine();',

      `            root.querySelector("#salesQAddLine").onclick=()=>addLine();

            root.querySelector("#salesQDefaultDelivery")
                .addEventListener("input", e => {

                    const days = e.target.value.trim();

                    root.querySelectorAll(
                        "#salesQItems .sales-line"
                    ).forEach(row => {

                        if (
                            row.dataset.deliveryManual !== "1"
                        ) {
                            row.querySelector(
                                "[data-q-delivery]"
                            ).value = days;
                        }

                    });

                });`,

      'herencia del tiempo general'
    );

    // Valor inicial de cada nueva partida.

    s = once(
      s,
      '    const currency=item.currency||"M.N.";',

      `    const currency=item.currency||"M.N.";

    const generalDays=document
        .getElementById("salesQDefaultDelivery")
        ?.value.trim()||"";

    const savedDays=Object.prototype
        .hasOwnProperty.call(item,"delivery_days");

    const initialDays=savedDays
        ?(item.delivery_days??"")
        :generalDays;

    const manualDays=
        savedDays &&
        String(initialDays)!==generalDays
            ?"1"
            :"0";`,

      'herencia de partida'
    );

    s = once(
      s,
      '                data-product-id="${item.product_id||""}"',

      `                data-product-id="\${item.product_id||""}"
                data-delivery-manual="\${manualDays}"`,

      'atributo de personalización'
    );

    // Campo visual debajo de cada partida.

    s = once(
      s,

      `                <button
                    type="button"
                    class="sales-icon-btn danger"
                    data-remove-line
                >
                    −
                </button>

            </div>`,

      `                <button
                    type="button"
                    class="sales-icon-btn danger"
                    data-remove-line
                >
                    −
                </button>

                <div class="gg-q-line-delivery">

                    <label>
                        Tiempo de entrega
                        <small>(días · opcional)</small>

                        <input
                            data-q-delivery
                            type="number"
                            min="1"
                            max="3650"
                            step="1"
                            inputmode="numeric"
                            placeholder="Sin especificar"
                            value="\${s.escapeHtml(String(initialDays))}"
                        >
                    </label>

                    <button
                        type="button"
                        class="gg-q-inherit"
                        data-q-use-default
                    >
                        ↺ Usar default
                    </button>

                </div>

            </div>`,

      'tiempo debajo de cada partida'
    );

    // Botón para recuperar la herencia general.

    s = once(
      s,
      '    if(event.target.closest("[data-remove-line]")){',

      `    if(event.target.closest("[data-q-use-default]")){

        row.dataset.deliveryManual="0";

        row.querySelector("[data-q-delivery]").value=
            document.getElementById(
                "salesQDefaultDelivery"
            )?.value.trim()||"";

        return;
    }

    if(event.target.closest("[data-remove-line]")){`,

      'restaurar valor general'
    );

    // Detectar si el usuario personaliza una partida.

    s = once(
      s,

      `    if(row){
        calcLine(row);
        renderTotals();
    }
}

function calcLine`,

      `    if(row){

        if(event.target.matches("[data-q-delivery]")){
            row.dataset.deliveryManual="1";
            return;
        }

        calcLine(row);
        renderTotals();
    }
}

function calcLine`,

      'edición manual de días'
    );

    // Validación numérica.

    s = once(
      s,
      'async function saveQuote(event,id){',

      `function ggQuoteDays(raw){

    const value=String(raw??"").trim();

    if(value==="")return null;

    if(!/^[0-9]+$/.test(value))return NaN;

    const n=Number(value);

    return Number.isSafeInteger(n)
        && n>=1
        && n<=3650
            ?n
            :NaN;
}

async function saveQuote(event,id){`,

      'validación del plazo'
    );

    // Capturar tiempo general y tiempos individuales.

    s = once(
      s,

      '    try{\n        const beganAt = new Date().toISOString();',

      `    const defaultDays=ggQuoteDays(
        value("salesQDefaultDelivery")
    );

    const deliveryLines=[
        ...document.querySelectorAll(
            "#salesQItems .sales-line"
        )
    ].map((row,index)=>({

        position:index+1,

        delivery_days:ggQuoteDays(
            row.querySelector(
                "[data-q-delivery]"
            ).value
        )

    }));

    if(
        Number.isNaN(defaultDays)
        ||
        deliveryLines.some(
            line=>Number.isNaN(line.delivery_days)
        )
    ){
        message.textContent=
            "Tiempo de entrega: escribe días enteros " +
            "del 1 al 3650 o deja el campo vacío.";

        return;
    }

    try{
        const beganAt = new Date().toISOString();`,

      'validación antes de guardar'
    );

    // Conservar la función de guardado original
    // y el mecanismo existente de Ventas Plus.

    s = once(
      s,

      `        await GGSalesPlus.saved(
            "quote",
            data,
            id,
            beganAt
        );`,

      `        // GGSalesPlus devuelve el ID exacto
        // de la cotización que acaba de guardar.

        const savedQuoteId=await GGSalesPlus.saved(
            "quote",
            data,
            id,
            beganAt
        );

        const deliveryResult=await s.db.rpc(
            "sales_quote_delivery_save",
            {
                p_quote_id:savedQuoteId,
                p_default_days:defaultDays,
                p_lines:deliveryLines
            }
        );

        if(deliveryResult.error){

            message.textContent=
                "ATENCIÓN: la cotización principal " +
                "YA SE GUARDÓ, pero falló el plazo: " +
                deliveryResult.error.message +
                ". NO la crees otra vez. Actualiza " +
                "el listado y edita esa cotización " +
                "para completar los días.";

            await loadQuotes();

            return;
        }`,

      'guardar tiempos tras guardado principal'
    );

    return s;
  }
);

// =====================================================
// 2. RECUPERACIÓN DE BORRADORES
// =====================================================

modify(
  'js/ventas-plus.js',
  'GG_QUOTE_DRAFT_DELIVERY_V1',
  s => {

    // Este archivo viene con finales de línea
    // de Windows; normalizarlos permite parche seguro.
    s = s.replace(/\r\n/g, '\n');

    return once(
      s,

      `      currency: field("currency") || "M.N."
    };`,

      `      currency: field("currency") || "M.N.",

      // GG_QUOTE_DRAFT_DELIVERY_V1
      // Recuperar los días SOLO en cotizaciones.
      ...(prefix==="q"?{

        delivery_days:
            field("delivery")===""
                ?null
                :Number(field("delivery"))

      }:{})
    };`,

      'borradores de cotizaciones'
    );
  }
);

// =====================================================
// 3. PDF DE COTIZACIONES
// =====================================================

modify(
  'js/ventas-pdf.js',
  'GG_QUOTE_PDF_DELIVERY_V1',
  s => {

    // Ampliar altura de renglón únicamente
    // cuando es cotización y tiene días.

    s = once(
      s,

      `                const rowHeight =
                    Math.max(

                        6.3,

                        prepared.maxLines
                        *
                        3
                        +
                        2

                    );`,

      `                // GG_QUOTE_PDF_DELIVERY_V1
                // Solo cotizaciones.

                const deliveryDays=
                    data.kind==="COTIZACIÓN" &&
                    item.delivery_days!=null &&
                    Number.isInteger(
                        Number(item.delivery_days)
                    ) &&
                    Number(item.delivery_days)>=1

                    ?Number(item.delivery_days)
                    :null;

                const rowHeight =
                    Math.max(

                        6.3,

                        prepared.maxLines
                        *
                        3
                        +
                        2

                    )+(deliveryDays!==null?4.5:0);`,

      'altura de renglón PDF'
    );

    // Imprimir debajo de la partida,
    // en tipografía más pequeña y tenue.

    s = once(
      s,

      `                doc.setDrawColor(
                    ...C.line
                );


                doc.setLineWidth(
                    .18
                );`,

      `                if(deliveryDays!==null){

                    doc.setTextColor(...C.muted);

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                    doc.setFontSize(5.4);

                    doc.text(
                        "Tiempo de entrega: " +
                        deliveryDays +
                        (
                            deliveryDays===1
                                ?" día"
                                :" días"
                        ),

                        l.margin+2,

                        y+rowHeight-1.7
                    );
                }

                doc.setDrawColor(
                    ...C.line
                );


                doc.setLineWidth(
                    .18
                );`,

      'etiqueta de entrega PDF'
    );

    return s;
  }
);

// =====================================================
// 4. CONECTAR CSS SIN CAMBIAR ESTILOS EXISTENTES
// =====================================================

modify(
  'ventas.html',
  'gg-quote-delivery.css',
  s => once(
    s,
    '</head>',

    '    <link rel="stylesheet" ' +
    'href="css/gg-quote-delivery.css?v=1">\n' +
    '</head>',

    'hoja de estilos'
  )
);

// =====================================================
// 5. ESTILOS RESPONSIVE, OSCURO Y CLARO
// =====================================================

const cssPath = 'css/gg-quote-delivery.css';

const css = `
/* Grupo Gutiérrez
   Tiempo de entrega SOLO cotizaciones */

.gg-q-default-delivery {
    display:grid;
    gap:7px;
    max-width:360px;
    margin:18px 0 16px;
    padding:14px 17px;
    border:1px solid var(--line);
    background:color-mix(
        in srgb,
        var(--surface2) 88%,
        var(--blue) 12%
    );
    border-radius:13px;
}

.gg-q-default-delivery label {
    font-size:12px;
    font-weight:750;
    color:var(--text);
}

.gg-q-default-delivery input {
    width:100%;
    min-height:39px;
    max-width:170px;
    border:1px solid var(--line);
    border-radius:9px;
    background:var(--surface2);
    color:var(--text);
    padding:9px 12px;
}

.gg-q-default-delivery small,
.gg-q-line-delivery small {
    color:var(--muted);
    font-size:10px;
    font-weight:500;
}

#salesQItems .sales-line .gg-q-line-delivery {
    grid-column:1/-1;
    display:flex;
    gap:12px;
    align-items:flex-end;
    justify-content:flex-start;
    padding:8px 13px 10px;
    border-radius:9px;
    background:rgba(80,151,205,.055);
    border:1px solid rgba(125,157,187,.12);
}

#salesQItems .gg-q-line-delivery label {
    display:grid;
    gap:6px;
    font-size:11px;
    font-weight:750;
    color:var(--text);
}

#salesQItems .gg-q-line-delivery input {
    width:150px;
    min-height:34px;
    border:1px solid var(--line);
    border-radius:8px;
    background:var(--surface2);
    color:var(--text);
    padding:6px 9px;
}

#salesQItems .gg-q-inherit {
    min-height:34px;
    border:1px solid rgba(112,177,222,.3);
    border-radius:9px;
    padding:7px 11px;
    background:rgba(90,154,207,.10);
    color:var(--blue);
    font-size:11px;
    cursor:pointer;
}

#salesQItems .gg-q-inherit:hover {
    background:rgba(90,154,207,.20);
}

@media(max-width:700px) {
    .gg-q-default-delivery {
        max-width:none;
    }
}
`;

// Crear la hoja sin sobrescribir cambios propios.

if (fs.existsSync(file(cssPath))) {
  const current = fs.readFileSync(
    file(cssPath),
    'utf8'
  );

  if (current !== css) {
    throw Error(
      cssPath +
      ' ya existe con modificaciones. ' +
      'No se sobrescribe.'
    );
  }
} else {
  changes.set(cssPath, css);
}

// =====================================================
// 6. VALIDAR TODO ANTES DE ESCRIBIR
// =====================================================

for (const [p, content] of changes) {
  if (p.endsWith('.js')) {
    new vm.Script(content, {
      filename:p
    });
  }

  if (
    p.endsWith('.html') &&
    !content.includes('</html>')
  ) {
    throw Error(
      'HTML incompleto: ' + p
    );
  }
}

for (const p of changes.keys()) {
  if (!old.has(p)) {
    old.set(
      p,
      fs.existsSync(file(p))
        ?fs.readFileSync(file(p))
        :null
    );
  }
}

// =====================================================
// 7. APLICAR CON RECUPERACIÓN EN MEMORIA
// =====================================================

const written = [];

try {
  for (const [p, content] of changes) {

    fs.mkdirSync(
      path.dirname(file(p)),
      {recursive:true}
    );

    written.push(p);

    fs.writeFileSync(
      file(p),
      content,
      'utf8'
    );
  }

} catch (err) {

  for (const p of written.reverse()) {
    try {
      const prev = old.get(p);

      if (prev === null) {
        fs.rmSync(
          file(p),
          {force:true}
        );
      } else {
        fs.writeFileSync(
          file(p),
          prev
        );
      }

    } catch (e) {
      console.error(
        'No pude restaurar ' +
        p + ': ' + e.message
      );
    }
  }

  throw err;
}

// =====================================================
// 8. FINALIZADO
// =====================================================

console.log(
  '\n✓ Cotizaciones: plazo general y por partida instalados.'
);

console.log(
  '✓ Edición, copia, borrador y PDF actualizados.'
);

console.log(
  '✓ Sin cambios en remisiones, ODC ni otros PDFs.'
);

console.log(
  '✓ Archivos escritos: ' +
  written.length +
  '. Sin .bak.'
);

console.log(
  'IMPORTANTE: ejecuta el SQL separado ANTES de usar el formulario.'
);
