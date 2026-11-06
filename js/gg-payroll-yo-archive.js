/* GG_PAYROLL_YO_ARCHIVE_UNIFIED_V7 */

(() => {
  'use strict';

  if (window.__ggPayrollArchiveUnifiedV7) {
    return;
  }

  window.__ggPayrollArchiveUnifiedV7 = true;

  const $ = id =>
    document.getElementById(id);

  const bridge = () =>
    window.ggPayrollYoBridge;

  let lastSignature = null;
  let fetching = false;

  function status(message) {
    const element = $(
      'yoPayrollArchiveStatus'
    );

    if (element) {
      element.textContent = message;
    }
  }

  function date(value) {
    if (!value) return 'Sin fecha';

    const d = new Date(value);

    return Number.isNaN(d.getTime())
      ? 'Sin fecha'
      : d.toLocaleDateString(
          'es-MX',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }
        );
  }

  // =========================================
  // MISMA LISTA DE LA CAMPANITA
  // =========================================

  function items() {
    const api = bridge();

    return (
      api &&
      typeof api.list === 'function'
    )
      ? api.list()
      : [];
  }

  // =========================================
  // DIBUJAR HISTORIAL PERMANENTE
  // =========================================

  function paint(force = false) {

    const root = $(
      'yoPayrollArchiveList'
    );

    if (!root) return;

    // Recordar qué grupos están desplegados.
    const expanded = new Set(
      [
        ...root.querySelectorAll(
          'details[open]'
        )
      ].map(
        node => node.dataset.groupKey
      )
    );

    const receipts = items();

    const signature = JSON.stringify(
      receipts.map(
        r => [
          r.id,
          r.title,
          r.file_name,
          r.sent_at,
          r.read_at
        ]
      )
    );

    if (
      !force &&
      signature === lastSignature
    ) return;

    lastSignature = signature;

    root.replaceChildren();

    if (!receipts.length) {

      const empty =
        document.createElement('div');

      empty.className =
        'gg-archive-empty';

      empty.textContent =
        'Todavía no tienes recibos ' +
        'de nómina enviados.';

      root.append(empty);

      status('0 recibos disponibles.');

      return;
    }

    status(
      receipts.length +
      (
        receipts.length === 1
          ? ' recibo disponible.'
          : ' recibos disponibles.'
      )
    );

    // Agrupar por título y fecha de envío.
    const groups = new Map();

    for (const receipt of receipts) {

      const key =
        String(
          receipt.title || 'Nómina'
        ) +
        '|' +
        String(
          receipt.sent_at || ''
        ).slice(0, 10);

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(receipt);
    }

    // =======================================
    // TARJETAS DESPLEGABLES
    // =======================================

    for (
      const [key, groupItems] of groups
    ) {

      const group =
        document.createElement('details');

      group.className =
        'gg-archive-group';

      group.dataset.groupKey = key;
      group.open = expanded.has(key);

      const header =
        document.createElement('summary');

      const left =
        document.createElement('div');

      const title =
        document.createElement('strong');

      title.textContent =
        groupItems[0].title ||
        'Recibos de nómina';

      const info =
        document.createElement('small');

      info.textContent =
        date(groupItems[0].sent_at) +
        ' · ' +
        groupItems.length +
        (
          groupItems.length === 1
            ? ' documento'
            : ' documentos'
        );

      left.append(title, info);
      header.append(left);

      const body =
        document.createElement('div');

      body.className =
        'gg-archive-group-body';

      // =====================================
      // RECIBOS INDIVIDUALES
      // =====================================

      for (const receipt of groupItems) {

        const button =
          document.createElement('button');

        button.type = 'button';
        button.className =
          'gg-archive-file';

        const file =
          document.createElement('span');

        file.textContent =
          '▤ ' +
          (
            receipt.file_name ||
            'Recibo.pdf'
          );

        const action =
          document.createElement('em');

        // Clase utilizada por el abridor
        // original de la campanita.
        action.className =
          'gg-payroll-yo-action';

        action.textContent =
          receipt.read_at
            ? 'Abrir PDF ↗'
            : '● Nuevo · Abrir PDF ↗';

        button.append(
          file,
          action
        );

        // ===================================
        // MISMA APERTURA QUE LA CAMPANITA
        // ===================================

        button.addEventListener(
          'click',
          async () => {

            const api = bridge();

            if (
              !api ||
              typeof api.open !== 'function'
            ) {

              status(
                'La campanita de nómina ' +
                'no está disponible. Recarga YO.'
              );

              return;
            }

            // No se genera otra URL.
            // No se hace una nueva validación
            // de UUID diferente.
            //
            // Se ejecuta EXACTAMENTE el
            // abridor que usa la campanita.

            await api.open(
              receipt,
              button
            );

            const errorText = $(
              'ggPayrollYoFeedback'
            )?.textContent?.trim();

            if (errorText) {
              status(errorText);
            }

            paint(true);
          }
        );

        body.append(button);
      }

      group.append(
        header,
        body
      );

      root.append(group);
    }
  }

  // =========================================
  // ACTUALIZAR USANDO LA CAMPANITA
  // =========================================

  async function refresh() {

    const api = bridge();

    if (
      !api ||
      typeof api.refresh !== 'function'
    ) {

      status(
        'No se encontró la campanita ' +
        'de nómina. Recarga YO.'
      );

      return;
    }

    if (fetching) return;

    fetching = true;

    try {

      // Esta función ejecuta la consulta
      // que YA usa la campanita:
      //
      // gg_payroll_yo_list
      //
      // No utiliza la RPC adicional V6.

      await api.refresh();

      paint(true);

    } catch (error) {

      status(
        'No pudimos actualizar recibos: ' +
        (
          error.message ||
          'Error de conexión'
        )
      );

    } finally {

      fetching = false;
    }
  }

  // =========================================
  // MANTENER AMBAS VISTAS SINCRONIZADAS
  // =========================================

  function start() {

    if (!$('yoPayrollArchiveList')) {
      return;
    }

    $('yoPayrollArchiveRefresh')
      ?.addEventListener(
        'click',
        () => void refresh()
      );

    // Cuando la campanita actualiza sus
    // tarjetas, se actualiza también
    // el historial inferior.

    const bellList = $(
      'yoNotificationsList'
    );

    if (
      bellList &&
      typeof MutationObserver !==
        'undefined'
    ) {

      const observer =
        new MutationObserver(
          () => paint()
        );

      observer.observe(
        bellList,
        {
          childList: true,
          subtree: true
        }
      );
    }

    window.setTimeout(
      () => void refresh(),
      500
    );

    window.setTimeout(
      () => paint(),
      2000
    );

    document.addEventListener(
      'visibilitychange',
      () => {

        if (!document.hidden) {
          paint();
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
      {once: true}
    );

  } else {

    start();
  }

})();
