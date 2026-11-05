/*
 GG_NOMINA_ARCHIVE_V1

 Historial personal en YO.
 Complementa la campanita existente.
*/

(() => {
  'use strict';

  const db = window.ggSupabase;

  const $ = id =>
    document.getElementById(id);

  const session = () =>
    sessionStorage.getItem(
      'gg_intranet_token'
    );

  let busy = false;
  let receipts = [];

  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const fmt = value =>
    value
      ? new Date(value).toLocaleDateString(
          'es-MX',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }
        )
      : '—';

  function notice(message) {
    if ($('yoPayrollArchiveStatus')) {
      $('yoPayrollArchiveStatus').textContent =
        message;
    }
  }

  // ================================================
  // MOSTRAR RECIBOS AGRUPADOS POR NOTIFICACIÓN
  // ================================================

  function paint() {

    const root = $('yoPayrollArchiveList');

    if (!root) return;

    root.replaceChildren();

    if (!receipts.length) {

      const empty =
        document.createElement('div');

      empty.className = 'gg-archive-empty';

      empty.textContent =
        'Todavía no tienes recibos ' +
        'de nómina enviados.';

      root.append(empty);
      return;
    }

    const groups = new Map();

    for (const receipt of receipts) {

      const day =
        (receipt.sent_at || '').slice(0,10);

      const key =
        String(receipt.title || 'Nómina') +
        '|' +
        day;

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(receipt);
    }

    // Crear tarjetas desplegables.

    for (const items of groups.values()) {

      const group =
        document.createElement('details');

      group.className = 'gg-archive-group';

      const top =
        document.createElement('summary');

      const titleBox =
        document.createElement('div');

      const title =
        document.createElement('strong');

      title.textContent =
        items[0].title || 'Recibos de nómina';

      const caption =
        document.createElement('small');

      caption.textContent =
        fmt(items[0].sent_at) +
        ' · ' +
        items.length +
        (
          items.length === 1
            ? ' documento'
            : ' documentos'
        );

      titleBox.append(title, caption);
      top.append(titleBox);

      const body =
        document.createElement('div');

      body.className =
        'gg-archive-group-body';

      // Cada documento se abre con autorización.

      for (const receipt of items) {

        const button =
          document.createElement('button');

        button.type = 'button';
        button.className = 'gg-archive-file';

        const file =
          document.createElement('span');

        file.textContent =
          '▤ ' +
          (receipt.file_name || 'Recibo.pdf');

        const action =
          document.createElement('em');

        action.textContent =
          receipt.read_at
            ? 'Abrir PDF ↗'
            : '● Nuevo · Abrir ↗';

        button.append(file, action);

        button.addEventListener(
          'click',
          event => {
            event.preventDefault();

            void openPDF(
              receipt,
              button
            );
          }
        );

        body.append(button);
      }

      group.append(top, body);
      root.append(group);
    }
  }

  // ================================================
  // CONSULTAR RECIBOS DESDE SUPABASE
  // ================================================

  async function fetchList() {

    if (
      busy ||
      !session() ||
      !db
    ) return;

    busy = true;

    try {

      const {data, error} =
        await db.rpc(
          'gg_payroll_yo_list',
          {
            p_session_token: session()
          }
        );

      if (error) throw error;

      receipts =
        Array.isArray(data) ? data : [];

      paint();

      notice(
        receipts.length +
        (
          receipts.length === 1
            ? ' recibo disponible.'
            : ' recibos disponibles.'
        ) +
        (
          receipts.length >= 200
            ? ' Se muestran los 200 más recientes.'
            : ''
        )
      );

    } catch (error) {

      notice(
        'No se pudo actualizar el historial. ' +
        (error.message || '')
      );

    } finally {
      busy = false;
    }
  }

  // ================================================
  // LEER ERRORES DE LA EDGE FUNCTION
  // ================================================

  async function explain(error) {

    try {

      const body =
        await error?.context
          ?.clone?.()
          .json();

      return (
        body?.error ||
        body?.message ||
        error.message
      );

    } catch {

      return (
        error?.message ||
        'No se pudo abrir el recibo.'
      );
    }
  }

  // ================================================
  // ABRIR PDF PRIVADO
  // ================================================

  async function openPDF(receipt, button) {

    if (button.disabled) return;

    const token = session();

    if (
      !token ||
      token.length < 16 ||
      !uuid.test(
        String(receipt.id || '')
      )
    ) {

      notice(
        'Sesión o recibo inválido. ' +
        'Cierra sesión y vuelve a entrar.'
      );

      return;
    }

    // Abrir pestaña desde el clic del usuario.

    const tab = window.open(
      'about:blank',
      '_blank'
    );

    if (tab) {

      tab.opener = null;

      tab.document.title =
        'Preparando recibo';

      tab.document.body.textContent =
        'Preparando PDF privado…';
    }

    button.disabled = true;

    notice('Autorizando PDF privado…');

    try {

      const {data,error} =
        await db.functions.invoke(
          'gg-payroll-download',
          {
            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              session_token: token,
              document_id: receipt.id
            })
          }
        );

      if (error) throw error;

      if (!data?.url) {
        throw Error(
          data?.error ||
          'No recibimos el enlace privado.'
        );
      }

      // Validar URL antes de abrirla.

      const url = new URL(data.url);
      const base = new URL(db.supabaseUrl);

      if (
        url.protocol !== 'https:' ||
        url.origin !== base.origin ||
        !url.pathname.startsWith(
          '/storage/v1/object/sign/gg-payroll-private/'
        )
      ) {
        throw Error(
          'URL inesperada; se bloqueó por seguridad.'
        );
      }

      if (tab && !tab.closed) {

        tab.location.replace(url.href);

      } else {

        window.location.assign(url.href);
      }

      receipt.read_at =
        receipt.read_at ||
        new Date().toISOString();

      notice('Recibo autorizado.');

      paint();

      void fetchList();

    } catch (error) {

      const message = await explain(error);

      notice(
        'No se pudo abrir el PDF: ' +
        message
      );

      if (tab && !tab.closed) {

        tab.document.body.textContent =
          'No se pudo abrir el PDF: ' +
          message;
      }

    } finally {

      button.disabled = false;
    }
  }

  // ================================================
  // INICIAR ARCHIVO DE YO
  // ================================================

  function start() {

    if (
      !$('yoPayrollArchive') ||
      !$('yoPayrollArchiveList')
    ) return;

    $('yoPayrollArchiveRefresh')
      ?.addEventListener(
        'click',
        () => void fetchList()
      );

    void fetchList();

    document.addEventListener(
      'visibilitychange',
      () => {
        if (!document.hidden) {
          void fetchList();
        }
      }
    );

    setInterval(
      () => {
        if (!document.hidden) {
          void fetchList();
        }
      },
      120000
    );
  }

  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      start,
      {once:true}
    );

  } else {

    start();
  }

})();
