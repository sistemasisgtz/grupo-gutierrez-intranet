
/*
  GRUPO GUTIÉRREZ
  CONTROL FINANCIERO > PROYECTOS

  Cruce por administration_folio.
  Únicamente pagos confirmados.
  Sin crear FK a solicitudes.
*/

(() => {
  'use strict';

  let fin;

  let snapshot = {
    projects: [],
    payments: []
  };

  let loaded = false;
  let loading = false;
  let visible = [];

  const $ = id => document.getElementById(id);

  const esc = value =>
    fin.escapeHtml(String(value ?? ''));

  const money = value =>
    fin.money(Number(value) || 0);

  const number = value =>
    Number(value) || 0;

  const key = value =>
    String(value || '').trim().toUpperCase();

  const normalized = value =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

  const date = value => fin.date(value);

  const inputs = [
    'ggProjSearch',
    'ggProjStatus',
    'ggProjYear',
    'ggProjMonth',
    'ggProjFrom',
    'ggProjTo',
    'ggProjMovement',
    'ggProjReconcile',
    'ggProjSort'
  ];

  // ==================================================
  // 1. CLASIFICACIÓN DE SOLICITUDES
  //
  // Una solicitud pertenece a un solo rubro.
  // No duplicar Mano de Obra en Materiales.
  //
  // Ajustar aquí si cambian las categorías
  // oficiales del catálogo de Finanzas.
  // ==================================================

  function categoryOf(request) {

    const text = normalized([
      request.category,
      request.classification,
      request.area_group
    ].join(' '));

    if (
      /MANO\s+DE\s+OBRA|NOMINA|\bM\.?O\.?\b/.test(text)
    ) {
      return 'mo';
    }

    if (
      /MATERIAL|SUBCONTRAT|MANTENIMIENTO|\bMTTO\b/.test(text)
    ) {
      return 'materiales';
    }

    return 'otros';
  }

  // ==================================================
  // 2. PERIODOS
  // Solo afectan solicitudes por fecha de pago.
  // LO permanece acumulado.
  // ==================================================

  function matchPeriod(r) {

    const dt = String(
      r.payment_date || ''
    ).slice(0, 10);

    const from = $('ggProjFrom').value;
    const to = $('ggProjTo').value;
    const year = $('ggProjYear').value;
    const month = $('ggProjMonth').value;

    if (
      (from || to || year || month) &&
      !dt
    ) {
      return false;
    }

    if (from && dt < from) return false;
    if (to && dt > to) return false;

    if (
      year &&
      dt.slice(0, 4) !== year
    ) {
      return false;
    }

    if (
      month &&
      dt.slice(5, 7) !== month
    ) {
      return false;
    }

    return true;
  }

  // ==================================================
  // 3. CÁLCULOS POR PROYECTO
  // ==================================================

  function calc(p) {

    const requests = snapshot.payments.filter(
      r =>
        key(r.folio) === key(p.folio) &&
        matchPeriod(r)
    );

    const mo = requests
      .filter(r => categoryOf(r) === 'mo')
      .reduce(
        (a, r) => a + number(r.amount),
        0
      );

    const mat = requests
      .filter(r => categoryOf(r) === 'materiales')
      .reduce(
        (a, r) => a + number(r.amount),
        0
      );

    const others = requests.filter(
      r => categoryOf(r) === 'otros'
    );

    const investment =
      p.authorized_investment == null
        ? null
        : number(p.authorized_investment);

    const quote =
      p.quote_manual == null
        ? null
        : number(p.quote_manual);

    const moLo = number(p.labor_lo);
    const matLo = number(p.materials_lo);

    const quoteLo =
      p.quote_lo == null
        ? null
        : number(p.quote_lo);

    const total = mo + mat;
    const totalLo = moLo + matLo;

    const balance =
      investment == null
        ? null
        : investment - total;

    const balanceLo =
      investment == null
        ? null
        : investment - totalLo;

    // Tolerancia de un centavo para redondeos.

    const differences = {
      mo: Math.abs(mo - moLo) > .01,

      materiales:
        Math.abs(mat - matLo) > .01,

      total:
        Math.abs(total - totalLo) > .01,

      balance:
        investment != null &&
        Math.abs(balance - balanceLo) > .01,

      quote:
        quote != null &&
        quoteLo != null &&
        Math.abs(quote - quoteLo) > .01
    };

    return {
      ...p,

      requests,
      mo,
      mat,
      others,
      moLo,
      matLo,
      total,
      totalLo,
      investment,
      quote,
      quoteLo,
      balance,
      balanceLo,
      differences,

      hasDifference:
        Object.values(differences).some(Boolean)
    };
  }

  // ==================================================
  // 4. OPCIONES DE PERIODOS
  // ==================================================

  function setOptions(id, items) {

    const select = $(id);
    const old = select.value;

    select.innerHTML = items.map(
      ([value, label]) => `
        <option value="${esc(value)}">
          ${esc(label)}
        </option>
      `
    ).join('');

    if (
      [...select.options].some(
        o => o.value === old
      )
    ) {
      select.value = old;
    }
  }

  function initializePeriods() {

    const years = new Set(
      snapshot.payments
        .map(
          r => String(
            r.payment_date || ''
          ).slice(0, 4)
        )
        .filter(v => /^\d{4}$/.test(v))
    );

    setOptions(
      'ggProjYear',
      [
        ['', 'Todos los años'],

        ...[...years]
          .sort()
          .reverse()
          .map(y => [y, y])
      ]
    );

    setOptions(
      'ggProjMonth',
      [
        ['', 'Todos los meses'],

        ...Array.from(
          { length: 12 },

          (_, i) => [
            String(i + 1).padStart(2, '0'),

            new Intl.DateTimeFormat(
              'es-MX',
              { month: 'long' }
            ).format(
              new Date(2026, i, 1)
            )
          ]
        )
      ]
    );
  }

  // ==================================================
  // 5. CARGA DESDE SUPABASE
  // ==================================================

  async function load() {

    if (
      loading ||
      !fin?.state.isAdmin
    ) {
      return;
    }

    loading = true;

    $('ggProjMessage').textContent =
      'Sincronizando folios de LO y solicitudes pagadas…';

    try {

      const { data, error } =
        await fin.db.rpc(
          'gg_cf_projects_snapshot'
        );

      if (error) {
        throw error;
      }

      if (
        !data ||
        !Array.isArray(data.projects) ||
        !Array.isArray(data.payments)
      ) {
        throw Error(
          'El servidor devolvió una respuesta incompleta.'
        );
      }

      snapshot = data;
      loaded = true;

      initializePeriods();
      render();

      $('ggProjLastSync').textContent =
        'Actualizado ' +
        new Date().toLocaleTimeString('es-MX');

    } catch (e) {

      console.error(
        '[GG Proyectos]',
        e
      );

      $('ggProjMessage').textContent =
        'Error al consultar proyectos: ' +
        (e.message || e);

      fin.toast(
        'No fue posible cargar Proyectos.',
        true
      );

    } finally {

      loading = false;

    }
  }

  // ==================================================
  // 6. FILTROS
  // ==================================================

  function filtered() {

    const search = normalized(
      $('ggProjSearch').value.trim()
    );

    const status =
      $('ggProjStatus').value;

    const move =
      $('ggProjMovement').value;

    const reconcile =
      $('ggProjReconcile').value;

    let rows = snapshot.projects
      .map(calc)
      .filter(p => {

        if (
          search &&
          !normalized([
            p.folio,
            p.name,
            p.invoice,
            p.project_status
          ].join(' ')).includes(search)
        ) {
          return false;
        }

        if (
          status &&
          p.project_status !== status
        ) {
          return false;
        }

        if (
          move === 'yes' &&
          !p.requests.length
        ) {
          return false;
        }

        if (
          move === 'no' &&
          p.requests.length
        ) {
          return false;
        }

        if (
          reconcile === 'diff' &&
          !p.hasDifference
        ) {
          return false;
        }

        if (
          reconcile === 'ok' &&
          p.hasDifference
        ) {
          return false;
        }

        if (
          reconcile === 'unmapped' &&
          !(
            p.others.length ||
            p.investment == null ||
            p.quote == null
          )
        ) {
          return false;
        }

        return true;

      });

    const sort = $('ggProjSort').value;

    rows.sort((a, b) => {

      if (sort === 'total') {
        return b.total - a.total;
      }

      if (sort === 'balance') {
        return (
          (a.balance ?? Infinity) -
          (b.balance ?? Infinity)
        );
      }

      if (sort === 'difference') {
        return (
          Number(b.hasDifference) -
          Number(a.hasDifference)
        );
      }

      if (sort === 'recent') {
        return String(
          b.sent_at || ''
        ).localeCompare(
          String(a.sent_at || '')
        );
      }

      return String(a.folio).localeCompare(
        String(b.folio),
        'es',
        { numeric: true }
      );

    });

    return rows;
  }

  // ==================================================
  // 7. CELDAS CON COMPARACIÓN
  // ==================================================

  function cell(
    amount,
    diff = false,
    tone = 'gg-n'
  ) {

    return `
      <td class="
        ggp-num
        ${tone}
        ${diff ? 'ggp-diff' : ''}
      ">
        ${
          amount === null
            ? '<span class="ggp-empty">Sin capturar</span>'
            : money(amount)
        }
      </td>
    `;
  }

  function row(p) {

    const d = p.differences;

    const warning = p.others.length
      ? `
        <span class="ggp-badge ggp-warn">
          ${p.others.length} sin clasificar
        </span>
      `
      : '';

    return `
      <tr
        data-ggp-folio="${esc(p.folio)}"
        tabindex="0"
        aria-label="Ver solicitudes del proyecto ${esc(p.folio)}"
      >

        <td class="ggp-left">
          <strong>
            ${esc(p.invoice || '—')}
          </strong>
        </td>

        <td class="ggp-folio ggp-left">
          <strong>${esc(p.folio)}</strong>

          <small>
            ${esc(p.name || '')}
          </small>

          ${warning}
        </td>

        ${cell(p.investment)}

        ${cell(p.mo, d.mo)}

        ${cell(p.moLo, d.mo, 'ggp-lo')}

        ${cell(p.mat, d.materiales)}

        ${cell(p.matLo, d.materiales, 'ggp-lo')}

        ${cell(p.total, d.total)}

        ${cell(p.totalLo, d.total, 'ggp-lo')}

        ${cell(p.balance, d.balance)}

        ${cell(p.balanceLo, d.balance, 'ggp-lo')}

        <td>
          <span class="
            ggp-status
            ${
              p.project_status === 'Terminado'
                ? 'is-finished'
                : p.project_status === 'Remisionado'
                  ? 'is-billed'
                  : ''
            }
          ">
            ${esc(p.project_status)}
          </span>
        </td>

        ${cell(p.quote, d.quote)}

        ${cell(p.quoteLo, d.quote, 'ggp-lo')}

        <td class="ggp-actions">
          <button
            type="button"
            data-ggp-edit="${esc(p.folio)}"
            class="ggp-icon-button"
            title="Editar campos manuales"
          >
            ✎ Editar
          </button>
        </td>

      </tr>
    `;
  }

  // ==================================================
  // 8. INDICADORES Y TABLA PRINCIPAL
  // ==================================================

  function render() {

    if (!loaded) return;

    visible = filtered();

    $('ggProjCount').textContent =
      `${visible.length} de ${snapshot.projects.length} proyectos`;

    const totalInvest = visible.reduce(
      (a, p) => a + (p.investment ?? 0),
      0
    );

    const paid = visible.reduce(
      (a, p) => a + p.total,
      0
    );

    const lo = visible.reduce(
      (a, p) => a + p.totalLo,
      0
    );

    const diffs = visible.filter(
      p => p.hasDifference
    ).length;

    const warnings = visible.reduce(
      (a, p) => a + p.others.length,
      0
    );

    const matched = new Set(
      snapshot.projects.map(
        p => key(p.folio)
      )
    );

    const orphan = snapshot.payments.filter(
      r =>
        matchPeriod(r) &&
        !matched.has(key(r.folio))
    );

    $('ggProjStats').innerHTML = [

      [
        'Proyectos',
        String(visible.length),
        'ggp-stat-neutral'
      ],

      [
        'Inversión autorizada',
        money(totalInvest),
        'ggp-stat-neutral'
      ],

      [
        'Pagado • Finanzas',
        money(paid),
        'ggp-stat-pay'
      ],

      [
        'Registrado • LO',
        money(lo),
        'ggp-stat-lo'
      ],

      [
        'Con diferencias',
        String(diffs),
        'ggp-stat-warning'
      ],

      [
        'Pagos por revisar',
        String(warnings + orphan.length),
        'ggp-stat-warning'
      ]

    ].map(
      ([label, value, cls]) => `
        <article class="ggp-stat ${cls}">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `
    ).join('');

    $('ggProjMessage').textContent =
      orphan.length

        ? `${orphan.length} solicitudes PAGADAS tienen un folio sin coincidencia en Administración LO. No se asignan a ningún proyecto. Revisa el folio desde Solicitudes.`

        : `Cifras de Finanzas según fecha de PAGO filtrada. Las columnas LO siempre muestran su gasto real acumulado completo. ${
            warnings
              ? `Hay ${warnings} solicitudes pagadas con categoría sin clasificar.`
              : ''
          }`;

    $('ggProjTable').innerHTML =
      visible.length

        ? `
          <table class="ggp-table">

            <thead>
              <tr>
                <th>Factura</th>
                <th>Folio definitivo</th>
                <th>Inversión autorizada</th>
                <th>MO</th>
                <th class="ggp-lo">MO LO</th>
                <th>Materiales</th>
                <th class="ggp-lo">Materiales LO</th>
                <th>Total</th>
                <th class="ggp-lo">Total LO</th>
                <th>Saldo restante</th>
                <th class="ggp-lo">Saldo restante LO</th>
                <th>Estatus proyecto</th>
                <th>Cotización proyecto</th>
                <th class="ggp-lo">Cotización proyecto LO</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              ${visible.map(row).join('')}
            </tbody>

          </table>
        `

        : `
          <div class="ggp-noresults">
            Sin proyectos para esta combinación de filtros.
          </div>
        `;
  }

  // ==================================================
  // 9. TABLA DETALLADA DE PAGOS CONFIRMADOS
  // ==================================================

  function requestRows(requests) {

    return requests.map(
      r => `
        <tr>

          <td>
            <strong>
              ${esc(r.request_folio)}
            </strong>
          </td>

          <td>${date(r.request_date)}</td>

          <td>${date(r.payment_date)}</td>

          <td>
            ${esc(
              r.requester_name ||
              r.requester_email ||
              '—'
            )}
          </td>

          <td>
            ${esc(r.provider || '—')}
          </td>

          <td>
            ${esc(
              r.category ||
              r.classification ||
              '—'
            )}
          </td>

          <td>
            <span class="
              ggp-badge
              ${
                categoryOf(r) === 'otros'
                  ? 'ggp-warn'
                  : ''
              }
            ">
              ${
                esc(
                  categoryOf(r) === 'mo'
                    ? 'MO'
                    : categoryOf(r) === 'materiales'
                      ? 'Materiales/Subcontratos'
                      : 'Sin clasificar'
                )
              }
            </span>
          </td>

          <td class="ggp-num">
            ${money(r.amount)}
          </td>

          <td>
            ${esc(r.invoice_folio || '—')}
          </td>

        </tr>
      `
    ).join('');
  }

  // ==================================================
  // 10. POPUP INFORMATIVO POR PROYECTO
  // ==================================================

  function openDetails(p) {

    fin.openModal({

      kicker:
        'CONCILIACIÓN DE PROYECTO',

      title:
        `${p.folio} · ${p.name || ''}`,

      extraWide: true,

      body: `

        <div class="ggp-modal-kpis">

          <div>
            <small>MO PAGADA</small>
            <strong>${money(p.mo)}</strong>
          </div>

          <div>
            <small>MATERIALES PAGADOS</small>
            <strong>${money(p.mat)}</strong>
          </div>

          <div>
            <small>TOTAL FINANZAS</small>
            <strong>${money(p.total)}</strong>
          </div>

          <div>
            <small>TOTAL LO</small>
            <strong>${money(p.totalLo)}</strong>
          </div>

        </div>

        <p class="ggp-modal-note">
          Solo solicitudes autorizadas y con pago
          confirmado. Fecha de pago dentro del
          período seleccionado. Las cifras LO
          son acumuladas.

          Haz clic en «Editar» para modificar los
          campos manuales.
        </p>

        ${
          p.others.length
            ? `
              <p class="ggp-alert">
                Hay ${p.others.length} pagos sin
                clasificación MO/Materiales.

                No se suman a los dos rubros
                para evitar cifras falsas.
              </p>
            `
            : ''
        }

        <div class="ggp-modal-scroll">

          <table class="ggp-table">

            <thead>
              <tr>
                <th>Folio solicitud</th>
                <th>Fecha solicitud</th>
                <th>Fecha pago</th>
                <th>Quién solicitó</th>
                <th>Proveedor</th>
                <th>Categoría</th>
                <th>Asignación</th>
                <th>Monto pagado</th>
                <th>Factura solicitud</th>
              </tr>
            </thead>

            <tbody>

              ${
                p.requests.length

                  ? requestRows(p.requests)

                  : `
                    <tr>
                      <td colspan="9">
                        No hay solicitudes pagadas
                        en este período.
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>

        </div>
      `,

      footer: `

        <button
          class="finance-button"
          data-ggp-close
        >
          Cerrar
        </button>

        <button
          class="finance-button primary"
          data-ggp-modal-edit
        >
          Editar datos manuales
        </button>
      `,

      onOpen(root) {

        root
          .querySelector('[data-ggp-close]')
          ?.addEventListener(
            'click',
            fin.closeModal
          );

        root
          .querySelector('[data-ggp-modal-edit]')
          ?.addEventListener(
            'click',
            () => openEdit(p)
          );
      }
    });
  }

  // ==================================================
  // 11. EDICIÓN DE DATOS MANUALES
  // ==================================================

  function openEdit(p) {

    fin.openModal({

      kicker:
        'CAMPOS MANUALES · CONTROL FINANCIERO',

      title:
        `Editar ${p.folio}`,

      wide: true,

      body: `

        <form
          id="ggpEditForm"
          class="ggp-form"
        >

          <label>
            Factura

            <input
              name="invoice"
              maxlength="200"
              value="${esc(p.invoice || '')}"
              placeholder="Número de factura (manual)"
            >
          </label>

          <label>
            Inversión autorizada ($)

            <input
              name="investment"
              type="number"
              min="0"
              step="0.01"
              value="${p.investment ?? ''}"
              placeholder="Sin capturar"
            >
          </label>

          <label>
            Cotización proyecto ($)

            <input
              name="quote"
              type="number"
              min="0"
              step="0.01"
              value="${p.quote ?? ''}"
              placeholder="Sin capturar"
            >
          </label>

          <label>
            Estatus proyecto

            <select name="status">

              ${
                [
                  'Proceso',
                  'Remisionado',
                  'Terminado'
                ]
                .map(
                  v => `
                    <option
                      ${
                        p.project_status === v
                          ? 'selected'
                          : ''
                      }
                    >
                      ${v}
                    </option>
                  `
                )
                .join('')
              }

            </select>
          </label>

          <p class="ggp-modal-note">
            Estos datos son independientes de LO.

            MO, Materiales, totales y saldos
            se calculan automáticamente.
          </p>

          <p
            id="ggpEditMessage"
            role="status"
          ></p>

        </form>
      `,

      footer: `

        <button
          type="button"
          class="finance-button"
          data-ggp-close
        >
          Cancelar
        </button>

        <button
          type="submit"
          form="ggpEditForm"
          class="finance-button primary"
        >
          Guardar cambios
        </button>
      `,

      onOpen(root) {

        root
          .querySelector('[data-ggp-close]')
          ?.addEventListener(
            'click',
            fin.closeModal
          );

        root
          .querySelector('#ggpEditForm')
          ?.addEventListener(

            'submit',

            async e => {

              e.preventDefault();

              const form = e.currentTarget;

              const btn =
                root.querySelector(
                  '[type=submit]'
                );

              const msg =
                root.querySelector(
                  '#ggpEditMessage'
                );

              const inv =
                form.elements.invoice.value.trim();

              const parse = name => {

                const v =
                  form.elements[name]
                    .value.trim();

                return v === ''
                  ? null
                  : Number(v);
              };

              const investment =
                parse('investment');

              const quote =
                parse('quote');

              if (
                [investment, quote].some(
                  v =>
                    v != null &&
                    (
                      !Number.isFinite(v) ||
                      v < 0
                    )
                )
              ) {

                msg.textContent =
                  'Ingresa importes válidos, mayores o iguales a cero.';

                return;
              }

              btn.disabled = true;

              msg.textContent =
                'Guardando…';

              try {

                const { error } =
                  await fin.db.rpc(

                    'gg_cf_project_save',

                    {
                      p_folio:
                        p.folio,

                      p_invoice:
                        inv,

                      p_authorized_investment:
                        investment,

                      p_quote_manual:
                        quote,

                      p_project_status:
                        form.elements.status.value
                    }
                  );

                if (error) throw error;

                fin.closeModal();

                await load();

                fin.toast(
                  'Proyecto actualizado.'
                );

              } catch (err) {

                console.error(err);

                msg.textContent =
                  err.message ||
                  'No se pudo guardar.';

              } finally {

                btn.disabled = false;

              }
            }
          );
      }
    });
  }

  // ==================================================
  // 12. CLIC EN PROYECTO / EDITAR
  // ==================================================

  function onTableClick(event) {

    const edit =
      event.target.closest(
        '[data-ggp-edit]'
      );

    const tr =
      event.target.closest(
        '[data-ggp-folio]'
      );

    if (!tr) return;

    const p = visible.find(
      p =>
        p.folio === tr.dataset.ggpFolio
    );

    if (!p) return;

    if (edit) {

      event.stopPropagation();

      openEdit(p);

    } else {

      openDetails(p);

    }
  }

  // ==================================================
  // 13. LIMPIAR FILTROS
  // ==================================================

  function clearFilters() {

    inputs.forEach(
      id => {
        $(id).value = '';
      }
    );

    render();
  }

  // ==================================================
  // 14. EXCEL REAL (.XLSX)
  //
  // Hoja 1: proyectos filtrados.
  // Hoja 2: pagos filtrados de esos proyectos.
  // ==================================================

  async function ensureExcel() {

    if (window.XLSX) return;

    await new Promise(
      (resolve, reject) => {

        const script =
          document.createElement(
            'script'
          );

        script.src =
          'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';

        script.onload = resolve;

        script.onerror = () =>
          reject(
            Error(
              'No se pudo cargar la biblioteca Excel.'
            )
          );

        document.head.appendChild(
          script
        );
      }
    );

    if (!window.XLSX) {
      throw Error(
        'Excel no está disponible.'
      );
    }
  }

  async function exportExcel() {

    if (!visible.length) {

      fin.toast(
        'No hay proyectos para exportar.',
        true
      );

      return;
    }

    const btn =
      $('ggProjExcel');

    btn.disabled = true;

    try {

      await ensureExcel();

      const rows = visible.map(
        p => ({

          'Factura':
            p.invoice || '',

          'Folio':
            p.folio,

          'Proyecto':
            p.name || '',

          'Inversión autorizada':
            p.investment ?? '',

          'MO':
            p.mo,

          'MO LO':
            p.moLo,

          'Materiales':
            p.mat,

          'Materiales LO':
            p.matLo,

          'Total':
            p.total,

          'Total LO':
            p.totalLo,

          'Saldo restante':
            p.balance ?? '',

          'Saldo restante LO':
            p.balanceLo ?? '',

          'Estatus proyecto':
            p.project_status,

          'Cotización proyecto':
            p.quote ?? '',

          'Cotización proyecto LO':
            p.quoteLo ?? '',

          'Tiene diferencias':
            p.hasDifference ? 'SÍ' : 'NO',

          'Pagos sin clasificar':
            p.others.length,

          'Número de pagos':
            p.requests.length
        })
      );

      const detail = visible.flatMap(
        p =>
          p.requests.map(
            r => ({

              'Folio':
                p.folio,

              'Folio solicitud':
                r.request_folio,

              'Fecha solicitud':
                r.request_date,

              'Fecha pago':
                r.payment_date,

              'Quién solicitó':
                r.requester_name ||
                r.requester_email ||
                '',

              'Proveedor':
                r.provider || '',

              'Categoría':
                r.category || '',

              'Clasificación':
                r.classification || '',

              'Rubro':
                categoryOf(r),

              'Importe pagado':
                number(r.amount),

              'Folio factura':
                r.invoice_folio || ''
            })
          )
      );

      const wb =
        XLSX.utils.book_new();

      const s =
        XLSX.utils.json_to_sheet(
          rows
        );

      s['!autofilter'] = {
        ref: s['!ref']
      };

      s['!cols'] =
        Object.keys(rows[0])
          .map(
            k => ({
              wch: Math.max(
                15,
                Math.min(
                  34,
                  k.length + 4
                )
              )
            })
          );

      XLSX.utils.book_append_sheet(
        wb,
        s,
        'Proyectos'
      );

      const d =
        XLSX.utils.json_to_sheet(

          detail.length

            ? detail

            : [
                {
                  'Sin pagos':
                    'No existen pagos en el período filtrado'
                }
              ]
        );

      if (detail.length) {

        d['!autofilter'] = {
          ref: d['!ref']
        };
      }

      d['!cols'] =
        Array.from(
          { length: 11 },
          () => ({ wch: 22 })
        );

      XLSX.utils.book_append_sheet(
        wb,
        d,
        'Pagos filtrados'
      );

      XLSX.writeFile(

        wb,

        'GG_Proyectos_' +
        new Date().toISOString().slice(0, 10) +
        '.xlsx',

        {
          compression: true
        }
      );

    } catch (e) {

      console.error(e);

      fin.toast(
        e.message ||
        'No se pudo crear Excel.',
        true
      );

    } finally {

      btn.disabled = false;

    }
  }

  // ==================================================
  // 15. INICIALIZACIÓN
  // ==================================================

  function init() {

    fin = window.GGFinance;

    if (
      !fin?.state.isAdmin
    ) {
      return;
    }

    inputs.forEach(
      id => {

        $(id)?.addEventListener(
          'input',
          render
        );

        $(id)?.addEventListener(
          'change',
          render
        );
      }
    );

    $('ggProjTable').addEventListener(
      'click',
      onTableClick
    );

    $('ggProjTable').addEventListener(

      'keydown',

      e => {

        if (
          (
            e.key === 'Enter' ||
            e.key === ' '
          ) &&
          e.target.matches(
            'tr[data-ggp-folio]'
          )
        ) {

          e.preventDefault();

          onTableClick({
            target: e.target
          });
        }
      }
    );

    $('ggProjReload').addEventListener(
      'click',
      load
    );

    $('ggProjExcel').addEventListener(
      'click',
      exportExcel
    );

    $('ggProjClear').addEventListener(
      'click',
      clearFilters
    );

    document.querySelector(
      '[data-finance-tab="proyectos"]'
    )?.addEventListener(

      'click',

      () => {
        if (!loaded) load();
      }
    );

    document.getElementById(
      'financeControlRefresh'
    )?.addEventListener(

      'click',

      () => {
        if (loaded) {
          setTimeout(load, 200);
        }
      }
    );

    document.addEventListener(

      'ggfinance:requests-updated',

      () => {
        if (loaded) load();
      }
    );
  }

  document.addEventListener(
    'ggfinance:control-ready',
    init,
    { once: true }
  );

})();
