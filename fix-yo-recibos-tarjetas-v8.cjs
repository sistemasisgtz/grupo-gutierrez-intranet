
'use strict';

/*
 GRUPO GUTIÉRREZ — YO / RECIBOS EN TARJETAS V8

 Ejecutar:
 node fix-yo-recibos-tarjetas-v8.cjs

 Requiere V7 (campanita e historial unificados).
 Sin SQL, sin .bak, sin backups, sin dependencias extra.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();

const relative = {
  html: 'yo.html',
  bell: 'js/gg-payroll-yo.js',
  script: 'js/gg-payroll-yo-cards-v8.js',
  css: 'css/gg-payroll-yo-cards-v8.css'
};

const absolute = key =>
  path.resolve(root, relative[key]);

function read(key) {
  if (!fs.existsSync(absolute(key))) {
    throw Error('Falta ' + relative[key]);
  }

  return fs.readFileSync(absolute(key), 'utf8');
}

// ================================================
// VALIDACIONES
// ================================================

const oldHtml = read('html');
const bell = read('bell');

if (
  !bell.includes('ggPayrollYoBridge') ||
  !bell.includes('gg-payroll-download')
) {
  throw Error(
    'Falta la campanita unificada V7. ' +
    'No se modificó nada.'
  );
}

if (
  !oldHtml.includes('id="yoPayrollArchive"') ||
  !oldHtml.includes('id="yoPayrollArchiveList"')
) {
  throw Error(
    'No encontré la sección Recibos de nómina.'
  );
}

const oldRef =
  /<script\b[^>]*\bsrc\s*=\s*["']js\/gg-payroll-yo-archive\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi;

const newerRef =
  /<script\b[^>]*\bsrc\s*=\s*["']js\/gg-payroll-yo-cards-v8\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi;

const oldCount = [
  ...oldHtml.matchAll(oldRef)
].length;

const newCount = [
  ...oldHtml.matchAll(newerRef)
].length;

if (
  !(
    (oldCount === 1 && newCount === 0) ||
    (oldCount === 0 && newCount === 1)
  )
) {
  throw Error(
    'La referencia del historial cambió o ' +
    'está duplicada. No se modificó nada.'
  );
}

// ================================================
// NUEVA LÓGICA VISUAL DE RECIBOS
// ================================================

const script = String.raw`
/* GG_PAYROLL_YO_CARDS_V8 */

(() => {
  'use strict';

  if (window.__ggPayrollCardsV8) return;
  window.__ggPayrollCardsV8 = true;

  const $ = id =>
    document.getElementById(id);

  const bridge = () =>
    window.ggPayrollYoBridge;

  const TIMEZONE = 'America/Monterrey';

  let lastSignature = '';
  let refreshing = false;
  let scheduled = false;

  // =========================================
  // SEMANA ISO: LUNES A DOMINGO
  // =========================================

  function isoWeek(timestamp) {
    const date = new Date(timestamp);

    if (!Number.isFinite(date.getTime())) {
      return null;
    }

    // Usamos la fecha local del envío
    // en lugar de la fecha UTC del servidor.

    const parts = new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    ).formatToParts(date);

    const part = name =>
      Number(
        parts.find(p => p.type === name)?.value
      );

    const local = new Date(
      Date.UTC(
        part('year'),
        part('month') - 1,
        part('day')
      )
    );

    const weekday = local.getUTCDay() || 7;

    local.setUTCDate(
      local.getUTCDate() + 4 - weekday
    );

    const year = local.getUTCFullYear();

    const start = new Date(
      Date.UTC(year, 0, 1)
    );

    const week = Math.ceil(
      (
        (local - start) / 86400000 + 1
      ) / 7
    );

    return {year, week};
  }

  function formatted(timestamp) {
    const date = new Date(timestamp);

    if (!Number.isFinite(date.getTime())) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    ).format(date);
  }

  // =========================================
  // MISMA LISTA PRIVADA DE LA CAMPANITA
  // =========================================

  function receipts() {
    const api = bridge();

    const list =
      typeof api?.list === 'function'
        ? api.list()
        : [];

    return (
      Array.isArray(list) ? list : []
    ).slice().sort(
      (a, b) =>
        new Date(b.sent_at || 0) -
        new Date(a.sent_at || 0)
    );
  }

  function message(value) {
    const el = $('yoPayrollArchiveStatus');

    if (el) {
      el.textContent = value;
    }
  }

  // =========================================
  // FILTROS SEMANA Y AÑO
  // =========================================

  function createTools() {
    const section = $('yoPayrollArchive');

    if (
      !section ||
      $('ggPayrollArchiveTools')
    ) return;

    const tools =
      document.createElement('div');

    tools.id = 'ggPayrollArchiveTools';

    tools.className =
      'gg-receipts-filters';

    tools.innerHTML =
      '<label class="gg-receipts-field">' +
        '<span>SEMANA DE ENVÍO</span>' +
        '<input id="ggPayrollArchiveWeek" ' +
          'type="number" min="1" max="53" ' +
          'step="1" inputmode="numeric" ' +
          'placeholder="Todas · Ej. 45" ' +
          'autocomplete="off">' +
      '</label>' +

      '<label class="gg-receipts-field">' +
        '<span>AÑO</span>' +
        '<select id="ggPayrollArchiveYear">' +
          '<option value="">Todos los años</option>' +
        '</select>' +
      '</label>' +

      '<button id="ggPayrollArchiveClear" ' +
        'class="gg-receipts-clear" ' +
        'type="button">' +
        'Limpiar filtros ↺' +
      '</button>';

    const head = section.querySelector(
      '.gg-payroll-archive-head'
    );

    if (head) {
      head.insertAdjacentElement(
        'afterend',
        tools
      );
    } else {
      section.prepend(tools);
    }

    $('ggPayrollArchiveWeek')
      .addEventListener(
        'input',
        () => paint(true)
      );

    $('ggPayrollArchiveYear')
      .addEventListener(
        'change',
        () => paint(true)
      );

    $('ggPayrollArchiveClear')
      .addEventListener(
        'click',
        () => {
          $('ggPayrollArchiveWeek').value = '';
          $('ggPayrollArchiveYear').value = '';

          paint(true);
        }
      );

    $('yoPayrollArchiveRefresh')
      ?.addEventListener(
        'click',
        () => void refresh()
      );
  }

  function updateYearOptions(list) {
    const select = $('ggPayrollArchiveYear');

    if (!select) return;

    const selected = select.value;

    const years = [
      ...new Set(
        list
          .map(r => isoWeek(r.sent_at)?.year)
          .filter(Boolean)
      )
    ].sort((a, b) => b - a);

    const current = isoWeek(
      new Date().toISOString()
    )?.year;

    if (
      current &&
      !years.includes(current)
    ) {
      years.push(current);
    }

    years.sort((a, b) => b - a);

    const nextSignature = years.join(',');

    if (
      select.dataset.years === nextSignature
    ) return;

    select.dataset.years = nextSignature;

    select.replaceChildren(
      new Option('Todos los años', '')
    );

    for (const year of years) {
      select.append(
        new Option(
          String(year),
          String(year)
        )
      );
    }

    select.value =
      selected &&
      years.includes(Number(selected))
        ? selected
        : '';
  }

  // =========================================
  // UTILIDAD PARA CREAR ELEMENTOS
  // =========================================

  function element(tag, cls, content) {
    const node = document.createElement(tag);

    if (cls) node.className = cls;

    if (content != null) {
      node.textContent = String(content);
    }

    return node;
  }

  // =========================================
  // TARJETA INDIVIDUAL DE PDF
  // =========================================

  function card(receipt, index) {
    const btn = element(
      'button',
      'gg-receipt-card'
    );

    btn.type = 'button';

    btn.style.setProperty(
      '--card-order',
      String(Math.min(index, 12))
    );

    btn.setAttribute(
      'aria-label',
      'Abrir recibo: ' +
      (receipt.title || 'Nómina')
    );

    const top = element(
      'div',
      'gg-receipt-card-top'
    );

    // Miniatura ilustrada de un documento.
    // No carga imágenes externas.

    const illustration = element(
      'div',
      'gg-receipt-illustration'
    );

    illustration.setAttribute(
      'aria-hidden',
      'true'
    );

    const sheet = element(
      'div',
      'gg-receipt-sheet'
    );

    sheet.append(
      element(
        'div',
        'gg-sheet-mark',
        'GG'
      ),

      element(
        'div',
        'gg-sheet-line gg-line-wide'
      ),

      element(
        'div',
        'gg-sheet-line gg-line-med'
      ),

      element(
        'div',
        'gg-sheet-line gg-line-small'
      ),

      element(
        'div',
        'gg-sheet-stamp',
        'PDF'
      )
    );

    illustration.append(sheet);

    const meta = isoWeek(
      receipt.sent_at
    );

    const stamp = element(
      'div',
      'gg-receipt-week',

      meta
        ? 'SEM ' +
          String(meta.week).padStart(2, '0') +
          ' · ' +
          meta.year
        : 'RECIBO'
    );

    top.append(
      illustration,
      stamp
    );

    // Nombre de notificación + archivo.

    const copy = element(
      'div',
      'gg-receipt-copy'
    );

    copy.append(
      element(
        'span',
        'gg-receipt-label',
        'NÓMINA / DOCUMENTO PRIVADO'
      ),

      element(
        'strong',
        'gg-receipt-name',
        receipt.title || 'Recibo de nómina'
      ),

      element(
        'span',
        'gg-receipt-file',
        receipt.file_name || 'Documento PDF'
      ),

      element(
        'span',
        'gg-receipt-date',
        'Enviado el ' +
        formatted(receipt.sent_at)
      )
    );

    const foot = element(
      'div',
      'gg-receipt-foot'
    );

    foot.append(
      element(
        'span',

        receipt.read_at
          ? 'gg-receipt-read'
          : 'gg-receipt-unread',

        receipt.read_at
          ? 'Consultado'
          : '● Nuevo'
      ),

      element(
        'span',
        'gg-payroll-yo-action gg-receipt-open',
        'Abrir PDF ↗'
      )
    );

    btn.append(
      top,
      copy,
      foot
    );

    // =====================================
    // ABRIR CON LA MISMA FUNCIÓN DE V7
    // =====================================

    btn.addEventListener(
      'click',
      async () => {
        if (btn.disabled) return;

        const api = bridge();

        if (
          typeof api?.open !== 'function'
        ) {
          message(
            'No se encontró la función ' +
            'de la campanita. Recarga YO.'
          );

          return;
        }

        // Reutilizar el mismo documento
        // y la apertura privada que ya funciona.

        await api.open(
          receipt,
          btn
        );

        const feedback =
          $('ggPayrollYoFeedback')
            ?.textContent?.trim();

        if (feedback) {
          message(feedback);
        }

        paint(true);
      }
    );

    return btn;
  }

  // =========================================
  // FILTRAR Y DIBUJAR LA CUADRÍCULA
  // =========================================

  function paint(force = false) {
    const root = $('yoPayrollArchiveList');

    if (!root) return;

    const list = receipts();

    createTools();
    updateYearOptions(list);

    const weekText =
      $('ggPayrollArchiveWeek')
        ?.value?.trim() || '';

    const week =
      weekText === ''
        ? null
        : Number(weekText);

    const yearText =
      $('ggPayrollArchiveYear')
        ?.value || '';

    const year =
      yearText
        ? Number(yearText)
        : null;

    const signature = JSON.stringify(
      list.map(
        r => [
          r.id,
          r.sent_at,
          r.title,
          r.file_name,
          r.read_at
        ]
      )
    ) +
    '|' + weekText +
    '|' + yearText;

    if (
      !force &&
      lastSignature === signature
    ) return;

    lastSignature = signature;

    root.replaceChildren();

    // Semana inválida.

    if (
      week !== null &&
      (
        !Number.isInteger(week) ||
        week < 1 ||
        week > 53
      )
    ) {
      message(
        'Escribe una semana válida entre 1 y 53.'
      );

      root.append(
        element(
          'div',
          'gg-receipts-empty',
          'El número de semana debe estar ' +
          'entre 1 y 53.'
        )
      );

      return;
    }

    const filtered = list.filter(
      r => {
        const meta = isoWeek(
          r.sent_at
        );

        if (!meta) {
          return (
            week === null &&
            year === null
          );
        }

        return (
          (
            week === null ||
            meta.week === week
          ) &&
          (
            year === null ||
            meta.year === year
          )
        );
      }
    );

    message(
      filtered.length +
      (
        filtered.length === 1
          ? ' recibo'
          : ' recibos'
      ) +
      (
        filtered.length === list.length
          ? ' disponibles.'
          : ' de ' +
            list.length +
            ' encontrados.'
      ) +
      (
        list.length >= 200
          ? ' · Se muestran los 200 más recientes.'
          : ''
      )
    );

    if (!filtered.length) {
      root.append(
        element(
          'div',
          'gg-receipts-empty',

          list.length
            ? 'No hay recibos enviados en ' +
              'esa semana y año. ' +
              'Prueba otros filtros.'
            : 'Todavía no tienes recibos ' +
              'de nómina enviados.'
        )
      );

      return;
    }

    for (
      const [index, receipt] of
      filtered.entries()
    ) {
      root.append(
        card(receipt, index)
      );
    }
  }

  // =========================================
  // SINCRONIZAR CON LA CAMPANITA
  // =========================================

  function schedulePaint() {
    if (scheduled) return;

    scheduled = true;

    window.setTimeout(
      () => {
        scheduled = false;
        paint();
      },
      40
    );
  }

  async function refresh() {
    if (refreshing) return;

    const api = bridge();

    if (
      typeof api?.refresh !== 'function'
    ) {
      message(
        'La campanita todavía no está lista. ' +
        'Recarga YO.'
      );

      return;
    }

    refreshing = true;

    try {
      await api.refresh();

      paint(true);

    } catch (error) {
      message(
        'No se pudo actualizar: ' +
        (
          error?.message ||
          'Error de conexión'
        )
      );

    } finally {
      refreshing = false;
    }
  }

  // =========================================
  // INICIAR
  // =========================================

  function start() {
    if (
      !$('yoPayrollArchiveList') ||
      !$('yoPayrollArchive')
    ) return;

    createTools();
    paint(true);

    const bellList = $(
      'yoNotificationsList'
    );

    if (
      bellList &&
      typeof MutationObserver !==
      'undefined'
    ) {
      new MutationObserver(
        schedulePaint
      ).observe(
        bellList,
        {
          childList: true,
          subtree: true
        }
      );
    }

    void refresh();

    document.addEventListener(
      'visibilitychange',
      () => {
        if (!document.hidden) {
          void refresh();
        }
      }
    );
  }

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      start,
      {once:true}
    );
  } else {
    start();
  }

})();
`.trim() + '\n';

// ================================================
// ESTILOS: MISMO LENGUAJE VISUAL DE YO
// ================================================

const css = String.raw`
/* GG_PAYROLL_YO_CARDS_V8 */

.yo-shell #yoPayrollArchive {
  margin-top:46px;
  padding:0;
  border:0;
  border-radius:0;
  background:transparent;
  box-shadow:none;
  color:#e4e9ec;
  backdrop-filter:none;
  animation:none;
}

.yo-shell #yoPayrollArchive
.gg-payroll-archive-head {
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:16px;
  margin-bottom:18px;
}

.yo-shell #yoPayrollArchive
.gg-payroll-archive-head > div > span {
  font-size:8px;
  font-weight:900;
  letter-spacing:.15em;
  color:#718ba0;
}

.yo-shell #yoPayrollArchive
.gg-payroll-archive-head h2 {
  margin:6px 0 0;
  font:800 24px/1.3 Manrope,Inter,sans-serif;
  letter-spacing:-.045em;
  color:#e5edf4;

  background:linear-gradient(
    105deg,
    #e4edf5,
    #77b8df,
    #e4edf5
  );

  background-size:240% 100%;
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;

  animation:
    ggReceiptInk 12s ease-in-out
    infinite alternate;
}

.yo-shell #yoPayrollArchive
.gg-archive-dot {
  -webkit-text-fill-color:#78bce6;
}

.yo-shell #yoPayrollArchive
.gg-payroll-archive-head p {
  margin:8px 0 0;
  font-size:11px;
  color:#788c9e;
  line-height:1.6;
}

.yo-shell #yoPayrollArchive
#yoPayrollArchiveRefresh {
  flex:none;
  border-radius:11px;
  padding:11px 14px;

  background:rgba(255,255,255,.035);
  color:#b7c9d8;

  border:1px solid rgba(255,255,255,.09);

  font:750 11px Inter,sans-serif;
}

.yo-shell #yoPayrollArchive
#yoPayrollArchiveRefresh:hover {
  background:rgba(88,153,204,.12);
  border-color:rgba(111,176,228,.30);
}

/* FILTROS */

.gg-receipts-filters {
  display:flex;
  align-items:flex-end;
  flex-wrap:wrap;
  gap:10px;

  padding:16px;

  border:1px solid rgba(255,255,255,.075);
  background:rgba(255,255,255,.018);

  border-radius:16px;
}

.gg-receipts-field {
  display:grid;
  gap:8px;
  flex:1 1 170px;
  min-width:0;
}

.gg-receipts-field span {
  font:850 9px Inter,sans-serif;
  letter-spacing:.12em;
  color:#8194a4;
}

.gg-receipts-field input,
.gg-receipts-field select {
  width:100%;
  min-height:43px;
  padding:0 13px;

  border:1px solid rgba(255,255,255,.10);
  border-radius:11px;

  background:#111a22;
  color:#dcebf5;

  font:600 12px Inter,sans-serif;
  outline:none;
  color-scheme:dark;
}

.gg-receipts-field input:focus,
.gg-receipts-field select:focus {
  border-color:#579ecb;
  box-shadow:0 0 0 3px rgba(87,158,203,.13);
}

.gg-receipts-field input::placeholder {
  color:#65798b;
  opacity:1;
}

.gg-receipts-clear {
  flex:0 0 auto;
  min-height:43px;

  border:1px solid rgba(110,164,205,.24);
  border-radius:11px;

  padding:0 14px;

  color:#9fc6e0;
  background:rgba(63,120,164,.12);

  font:750 11px Inter,sans-serif;
  cursor:pointer;

  transition:
    background .2s,
    border-color .2s;
}

.gg-receipts-clear:hover {
  background:rgba(63,120,164,.24);
  border-color:#6098be;
}

/* CONTADOR */

.yo-shell #yoPayrollArchive
#yoPayrollArchiveStatus {
  margin:17px 2px 13px;
  min-height:15px;

  font:600 11px Inter,sans-serif;
  color:#7891a4;
}

/* CUADRÍCULA DE RECIBOS */

.yo-shell #yoPayrollArchive
#yoPayrollArchiveList {
  display:grid;
  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap:11px;
  margin:0;
}

/* TARJETAS */

.gg-receipt-card {
  position:relative;
  min-width:0;
  overflow:hidden;

  text-align:left;
  padding:0;

  display:flex;
  flex-direction:column;

  min-height:292px;

  border-radius:17px;
  border:1px solid rgba(255,255,255,.075);

  background:rgba(255,255,255,.027);
  color:#e7edf3;

  cursor:pointer;
  font-family:Inter,sans-serif;

  transition:
    transform .25s,
    border-color .25s,
    background .25s,
    box-shadow .25s;

  animation:ggReceiptEnter .45s both;

  animation-delay:
    calc(var(--card-order,0) * 32ms);
}

.gg-receipt-card::before {
  content:'';

  position:absolute;
  top:-45%;
  left:-35%;

  width:95%;
  height:110%;

  pointer-events:none;

  background:radial-gradient(
    circle,
    rgba(97,169,216,.11),
    transparent 72%
  );

  transition:transform .6s ease;
}

.gg-receipt-card:hover,
.gg-receipt-card:focus-visible {
  transform:translateY(-4px);
  background:rgba(96,147,189,.065);

  border-color:rgba(110,178,224,.34);

  box-shadow:
    0 18px 36px rgba(0,0,0,.14);

  outline:none;
}

.gg-receipt-card:hover::before {
  transform:translate(22%,22%);
}

.gg-receipt-card:disabled {
  opacity:.65;
  cursor:wait;
  transform:none;
}

/* ILUSTRACIÓN DEL DOCUMENTO */

.gg-receipt-card-top {
  height:125px;
  display:flex;

  align-items:center;
  justify-content:space-between;

  padding:18px 18px 10px;
  position:relative;
}

.gg-receipt-illustration {
  position:relative;
  width:84px;
  height:100px;

  display:grid;
  place-items:center;
}

.gg-receipt-sheet {
  position:relative;

  width:68px;
  height:92px;

  border-radius:6px 13px 6px 6px;

  background:linear-gradient(
    150deg,
    #edf7ff,
    #bed5e4
  );

  box-shadow:
    0 8px 23px rgba(0,0,0,.3),
    inset 0 1px 0 #fff;

  transform:rotate(-5deg);

  transition:transform .27s ease;

  display:flex;
  flex-direction:column;
  gap:6px;

  padding:13px 9px;
}

.gg-receipt-sheet::before {
  content:'';

  position:absolute;
  right:0;
  top:0;

  width:19px;
  height:19px;

  background:linear-gradient(
    225deg,
    #89adc6 50%,
    transparent 51%
  );

  border-radius:0 11px 0 3px;
}

.gg-receipt-card:hover
.gg-receipt-sheet {
  transform:
    rotate(0deg) translateY(-3px);
}

.gg-sheet-mark {
  font:900 14px Manrope,Inter,sans-serif;
  color:#3a739a;
  letter-spacing:-.07em;
}

.gg-sheet-line {
  height:4px;
  border-radius:3px;

  background:#94b7d1;
  opacity:.9;
}

.gg-line-wide {width:90%}
.gg-line-med {width:73%}
.gg-line-small {width:47%}

.gg-sheet-stamp {
  position:absolute;
  bottom:9px;
  right:7px;

  padding:3px 5px;
  border-radius:4px;

  background:#4f97bf;
  color:#fff;

  font:900 8px Inter,sans-serif;
}

/* NÚMERO DE SEMANA */

.gg-receipt-week {
  align-self:flex-start;
  margin-top:4px;

  padding:7px 9px;

  border:1px solid rgba(109,173,217,.21);
  border-radius:9px;

  background:rgba(62,126,172,.10);
  color:#8ebcd9;

  font:850 9px Inter,sans-serif;
  letter-spacing:.06em;

  white-space:nowrap;
}

/* TEXTOS */

.gg-receipt-copy {
  padding:9px 18px 14px;

  display:flex;
  flex:1;
  flex-direction:column;

  gap:6px;
  min-width:0;
}

.gg-receipt-label {
  font:850 8px Inter,sans-serif;
  letter-spacing:.12em;
  color:#627b8e;
}

.gg-receipt-name {
  font:800 15px/1.4 Manrope,Inter,sans-serif;

  letter-spacing:-.025em;
  color:#dce8f3;

  overflow-wrap:anywhere;
}

.gg-receipt-file {
  font:500 11px/1.5 Inter,sans-serif;
  color:#7b91a4;

  overflow-wrap:anywhere;
}

.gg-receipt-date {
  font:500 10px Inter,sans-serif;
  color:#5f798b;

  margin-top:auto;
  padding-top:5px;
}

/* PIE DE TARJETA */

.gg-receipt-foot {
  display:flex;
  justify-content:space-between;
  align-items:center;

  gap:10px;
  padding:13px 18px;

  border-top:1px solid rgba(255,255,255,.055);
  background:rgba(0,0,0,.10);
}

.gg-receipt-unread,
.gg-receipt-read {
  font:750 10px Inter,sans-serif;
  color:#7f9baf;
}

.gg-receipt-unread {
  color:#70c8ee;
}

.gg-receipt-open {
  font:800 11px Inter,sans-serif;
  color:#9bd6fa;
}

/* SIN RESULTADOS */

.yo-shell #yoPayrollArchive
.gg-receipts-empty {
  grid-column:1/-1;

  text-align:center;
  padding:42px 20px;

  border:1px dashed rgba(255,255,255,.12);
  border-radius:16px;

  background:rgba(255,255,255,.017);
  color:#8198aa;

  font:500 12px/1.7 Inter,sans-serif;
}

/* ANIMACIONES */

@keyframes ggReceiptInk {
  to {
    background-position:100% 0;
  }
}

@keyframes ggReceiptEnter {
  from {
    opacity:0;
    transform:translateY(12px);
  }

  to {
    opacity:1;
    transform:translateY(0);
  }
}

/* TABLET */

@media(max-width:920px) {
  .yo-shell #yoPayrollArchive
  #yoPayrollArchiveList {
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }
}

/* CELULAR */

@media(max-width:620px) {
  .yo-shell #yoPayrollArchive
  .gg-payroll-archive-head {
    align-items:flex-start;
  }

  .yo-shell #yoPayrollArchive
  #yoPayrollArchiveList {
    grid-template-columns:1fr;
  }

  .gg-receipt-card {
    min-height:274px;
  }

  .gg-receipt-card-top {
    height:120px;
  }

  .gg-receipts-filters {
    padding:12px;
  }

  .gg-receipts-field {
    flex-basis:100%;
  }

  .gg-receipts-clear {
    width:100%;
  }
}

/* ACCESIBILIDAD */

@media(prefers-reduced-motion:reduce) {
  .gg-receipt-card,
  .yo-shell #yoPayrollArchive
  .gg-payroll-archive-head h2 {
    animation:none !important;
    transition:none !important;
  }
}
`.trim() + '\n';

// ================================================
// ACTIVAR V8 EN YO.HTML
// ================================================

let nextHtml = oldHtml;

const scriptTag =
  '<script src="js/gg-payroll-yo-cards-v8.js?v=8"></script>';

if (oldCount === 1) {
  nextHtml = nextHtml.replace(
    oldRef,
    scriptTag
  );
}

const cssTag =
  '<link rel="stylesheet" href="css/gg-payroll-yo-cards-v8.css?v=8">';

if (
  !nextHtml.includes(
    'gg-payroll-yo-cards-v8.css'
  )
) {
  if (!nextHtml.includes('</head>')) {
    throw Error(
      'Falta </head> en yo.html.'
    );
  }

  nextHtml = nextHtml.replace(
    '</head>',
    '    ' + cssTag + '\n</head>'
  );
}

if (!nextHtml.includes(scriptTag)) {
  throw Error(
    'No se pudo conectar el script V8.'
  );
}

// ================================================
// VERIFICACIONES PREVIAS
// ================================================

new vm.Script(
  script,
  {filename:relative.script}
);

const updates = new Map([
  [relative.script,script],
  [relative.css,css],
  [relative.html,nextHtml]
]);

// No sobrescribir cambios manuales de V8.

for (const key of ['script','css']) {
  if (
    fs.existsSync(absolute(key)) &&
    read(key) !== updates.get(relative[key])
  ) {
    throw Error(
      relative[key] +
      ' ya tiene cambios propios. ' +
      'No lo sobrescribo.'
    );
  }
}

// ================================================
// ESCRITURA SEGURA SIN .BAK
// ================================================

const old = new Map();

for (const filename of updates.keys()) {
  const full = path.resolve(
    root,
    filename
  );

  old.set(
    filename,
    fs.existsSync(full)
      ? fs.readFileSync(full)
      : null
  );
}

const applied = [];

try {
  for (const [filename,content] of updates) {
    const full = path.resolve(
      root,
      filename
    );

    if (
      old.get(filename)?.toString('utf8')
      === content
    ) {
      continue;
    }

    fs.mkdirSync(
      path.dirname(full),
      {recursive:true}
    );

    applied.push(filename);

    fs.writeFileSync(
      full,
      content,
      'utf8'
    );
  }

} catch (error) {
  for (const filename of applied.reverse()) {
    const full = path.resolve(
      root,
      filename
    );

    try {
      const prev = old.get(filename);

      if (prev === null) {
        fs.rmSync(full,{force:true});
      } else {
        fs.writeFileSync(full,prev);
      }

    } catch (restoreError) {
      console.error(
        'No se pudo restaurar ' +
        filename +
        ': ' +
        restoreError.message
      );
    }
  }

  throw error;
}

// ================================================
// TERMINADO
// ================================================

console.log(
  '\n✓ YO: recibos en tarjetas con ilustración PDF.'
);

console.log(
  '✓ Filtros por semana ISO y año.'
);

console.log(
  '✓ Ordenados de más reciente a más antiguo.'
);

console.log(
  '✓ Misma función privada de la campanita V7.'
);

console.log(
  '✓ Archivos escritos: ' + applied.length
);

console.log(
  '✓ Sin .bak, SQL ni Edge Function.'
);

console.log(
  'Recarga YO con Ctrl + F5.'
);
