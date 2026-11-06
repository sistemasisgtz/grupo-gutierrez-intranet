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
