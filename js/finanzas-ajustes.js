/* AJUSTES DE CONTROL FINANCIERO Y SOLICITUDES */

(() => {
  "use strict";

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const money = value =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(Number(value || 0));

  const escape = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  document.addEventListener("ggfinance:ready", () => {
    const fin = window.GGFinance;
    if (!fin) return;

    if (document.body.classList.contains(
      "control-finance-page"
    )) {
      initControl(fin);
    }

    if (document.body.classList.contains(
      "payment-request-page"
    )) {
      initPayments(fin);
    }
  }, { once: true });

  // ========================================
  // SOLICITUDES: ELEGIR ISGTZ O JD
  // ========================================

  function initPayments(fin) {
    const original = fin.openModal;

    fin.openModal = function(config) {
      if (!config?.body?.includes(
        'id="paymentNewRequestForm"'
      )) {
        return original(config);
      }

      const onOpen = config.onOpen;

      return original({
        ...config,
        onOpen(root) {
          onOpen?.(root);
          enhancePaymentForm(fin, root);
        }
      });
    };
  }

  function enhancePaymentForm(fin, root) {
    const form = $("#paymentNewRequestForm", root);

    const dateField = $("#paymentRequestDate", form)
      ?.closest(".finance-field");

    const idField = dateField?.nextElementSibling;
    const groupField = idField?.nextElementSibling;

    const idInput = $("input[readonly]", idField);
    const oldGroupInput = $("input[readonly]", groupField);

    if (!form || !idInput || !oldGroupInput) return;

    const originalGroup = fin.state.myGroups.find(
      g => g.group_id === fin.state.currentGroupId
    );

    if (!originalGroup || !["ISGTZ", "JD"].includes(
      String(originalGroup.prefix).toUpperCase()
    )) {
      return;
    }

    const groups = fin.state.myGroups.filter(
      g => ["ISGTZ", "JD"].includes(
        String(g.prefix).toUpperCase()
      )
    );

    const select = document.createElement("select");
    select.id = "paymentRequestGroupChoice";
    select.required = true;

    select.innerHTML = groups.map(g => `
      <option value="${escape(g.group_id)}">
        ${escape(g.group_name)} · ${escape(g.prefix)}
      </option>
    `).join("");

    select.value = originalGroup.group_id;
    oldGroupInput.replaceWith(select);

    const hint = document.createElement("small");
    hint.className = "finance-help gg-form-hint";
    hint.textContent =
      "Elige la empresa. El folio se genera al enviar.";

    select.after(hint);

    const catalogNames = [
      ["paymentRequester", "requester"],
      ["paymentProvider", "provider"],
      ["paymentClient", "client"]
    ];

    const message = $("#paymentNewRequestMessage", root);

    const submit = $(
      'button[type="submit"][form="paymentNewRequestForm"]',
      root
    );

    let ready = true;
    let sequence = 0;
    let activeId = originalGroup.group_id;

    function preview() {
      const group = groups.find(
        g => g.group_id === select.value
      );

      idInput.value =
        `${group?.prefix || ""}-AUTOMÁTICO`;

      const kicker = $(".finance-modal-header span", root);

      if (kicker) {
        kicker.textContent =
          group?.group_name || "SOLICITUD";
      }
    }

    select.addEventListener("change", async () => {
      const requestNumber = ++sequence;

      ready = false;
      select.disabled = true;

      if (submit) submit.disabled = true;

      message.textContent =
        "Cargando catálogos del grupo...";

      preview();

      try {
        const entries = await fin.loadGroupEntries(
          select.value
        );

        if (
          requestNumber !== sequence ||
          !form.isConnected
        ) return;

        for (const [id, type] of catalogNames) {
          const target = $(`#${id}`, form);

          const filtered = entries.filter(
            e => e.entry_type === type
          );

          if (!target || !filtered.length) {
            throw new Error(
              `Falta configurar ${type} en este grupo.`
            );
          }

          target.innerHTML =
            '<option value="">Selecciona...</option>' +
            filtered.map(e => `
              <option value="${escape(e.id)}">
                ${escape(e.name)}
              </option>
            `).join("");
        }

        activeId = select.value;
        ready = true;
        message.textContent = "";

      } catch (error) {
        if (requestNumber !== sequence) return;

        message.textContent =
          error.message ||
          "No se pudieron cargar los catálogos.";

      } finally {
        if (requestNumber === sequence) {
          select.disabled = false;

          if (submit) {
            submit.disabled = !ready;
          }
        }
      }
    });

    form.addEventListener("submit", event => {
      if (!ready || select.value !== activeId) {
        event.preventDefault();
        event.stopImmediatePropagation();

        message.textContent =
          "Espera a que carguen los catálogos.";

        return;
      }

      if (!groups.some(
        g => g.group_id === activeId
      )) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      // La RPC original conserva el control de permisos.
      fin.state.currentGroupId = activeId;

      const globalSelect = $("#paymentGroupSelect");

      if (globalSelect) {
        globalSelect.value = activeId;
      }

    }, true);

    preview();
  }

  // ========================================
  // CONTROL FINANCIERO
  // ========================================

  function initControl(fin) {
    document.addEventListener(
      "ggfinance:control-ready",
      () => {
        if (!fin.state.isAdmin) return;

        configureFinancialQuarters(fin);
        configureCredits(fin);
        configureHrUsers(fin);
        normalizeReportTables();
      },
      { once: true }
    );
  }

  // ========================================
  // FILTRO POR TRIMESTRE
  // ========================================

  function configureFinancialQuarters(fin) {
    const year = $("#financeFinancialYear");
    const controls = year?.closest(
      ".finance-analysis-controls"
    );

    if (!year || !controls) return;

    const holder = document.createElement("label");
    holder.className = "gg-quarter-control";

    holder.innerHTML = `
      <span>Mostrar</span>
      <select id="financeQuarterChoice">
        <option value="all">Todos los trimestres</option>
        <option value="1">Trimestre 1 · Ene–Mar</option>
        <option value="2">Trimestre 2 · Abr–Jun</option>
        <option value="3">Trimestre 3 · Jul–Sep</option>
        <option value="4">Trimestre 4 · Oct–Dic</option>
      </select>
    `;

    controls.append(holder);

    const choice = $("#financeQuarterChoice");
    const byGroup = $("#financeFinancialByGroup");
    const monthlyTable = $("#financeFinancialMonthlyTable");
    const chart = $("#financeFinancialMonthlyChart");

    const months = [
      "ENE", "FEB", "MAR", "ABR",
      "MAY", "JUN", "JUL", "AGO",
      "SEP", "OCT", "NOV", "DIC"
    ];

    const total = values =>
      values.reduce(
        (n, r) => n + Number(r.actual_amount || 0),
        0
      );

    function render() {
      const q = choice.value;

      $("#financeQuarterCards")
        ?.querySelectorAll(".finance-quarter-card")
        .forEach((card, i) => {
          card.classList.toggle(
            "gg-quarter-active",
            q !== "all" && Number(q) === i + 1
          );
        });

      if (q === "all") return;

      const quarter = Number(q);
      const yr = Number(year.value);
      const start = (quarter - 1) * 3 + 1;

      const requests = (
        window.GGFinanceControl?.getRequests() || []
      ).filter(r =>
        r.payment_confirmed === true &&
        r.payment_date &&
        r.actual_amount != null &&
        Number(r.payment_year) === yr &&
        Number(r.payment_month) >= start &&
        Number(r.payment_month) < start + 3
      );

      const byId = new Map();

      for (const r of requests) {
        const key = String(r.group_id);

        if (!byId.has(key)) {
          byId.set(key, {
            name: r.group_name_snapshot || "Sin grupo",
            cost: 0,
            expense: 0,
            total: 0
          });
        }

        const v = Number(r.actual_amount || 0);
        const obj = byId.get(key);

        if (r.movement_type === "COSTO") {
          obj.cost += v;
        }

        if (r.movement_type === "GASTO") {
          obj.expense += v;
        }

        obj.total += v;
      }

      const groups = [...byId.values()]
        .sort((a, b) => b.total - a.total);

      byGroup.innerHTML = `
        <table class="finance-table compact-table">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Costo</th>
              <th>Gasto</th>
              <th>Total pagado</th>
            </tr>
          </thead>
          <tbody>
            ${groups.map(g => `
              <tr>
                <td>${escape(g.name)}</td>
                <td class="finance-money">${money(g.cost)}</td>
                <td class="finance-money">${money(g.expense)}</td>
                <td class="finance-money">${money(g.total)}</td>
              </tr>
            `).join("") || `
              <tr>
                <td colspan="4">
                  Sin pagos confirmados en el trimestre.
                </td>
              </tr>
            `}
          </tbody>
          <tfoot>
            <tr>
              <th>Total</th>
              <th class="finance-money">
                ${money(groups.reduce((n,g)=>n+g.cost,0))}
              </th>
              <th class="finance-money">
                ${money(groups.reduce((n,g)=>n+g.expense,0))}
              </th>
              <th class="finance-money">
                ${money(total(requests))}
              </th>
            </tr>
          </tfoot>
        </table>
      `;

      const rows = [start, start+1, start+2].map(
        month => {
          const records = requests.filter(
            r => Number(r.payment_month) === month
          );

          return {
            name: months[month-1],
            cost: total(records.filter(
              r => r.movement_type === "COSTO"
            )),
            expense: total(records.filter(
              r => r.movement_type === "GASTO"
            )),
            total: total(records)
          };
        }
      );

      monthlyTable.innerHTML = `
        <table class="finance-table compact-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Costo</th>
              <th>Gasto</th>
              <th>Total pagado</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${r.name}</td>
                <td class="finance-money">${money(r.cost)}</td>
                <td class="finance-money">${money(r.expense)}</td>
                <td class="finance-money">${money(r.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

      const maximum = Math.max(
        1,
        ...rows.map(r => r.total),
        ...rows.map(r => r.cost),
        ...rows.map(r => r.expense)
      );

      chart.innerHTML = `
        <div class="gg-quarter-bars"
             role="img"
             aria-label="Costos, gastos y total pagado
                         del trimestre ${q}">
          ${rows.map(r => `
            <div class="gg-quarter-month">
              <div class="gg-quarter-barset">
                <div
                  class="gg-quarter-bar cost"
                  style="height:${100*r.cost/maximum}%"
                  title="Costos ${escape(money(r.cost))}">
                </div>
                <div
                  class="gg-quarter-bar expense"
                  style="height:${100*r.expense/maximum}%"
                  title="Gastos ${escape(money(r.expense))}">
                </div>
                <div
                  class="gg-quarter-bar total"
                  style="height:${100*r.total/maximum}%"
                  title="Total ${escape(money(r.total))}">
                </div>
              </div>
              <strong>${r.name}</strong>
              <small>${money(r.total)}</small>
            </div>
          `).join("")}
        </div>
      `;

      normalizeReportTables();
    }

    choice.addEventListener("change", () => {
      if (choice.value === "all") {
        year.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }
      render();
    });

    year.addEventListener("change", render);

    document.addEventListener(
      "ggfinance:requests-updated",
      render
    );
  }

  // ========================================
  // NUEVA PESTAÑA: COMPRAS A CREDITO
  // ========================================

  function configureCredits(fin) {
    const nav = $(
      ".control-finance-page .finance-tabbar"
    );

    const browser = $(
      ".control-finance-page .finance-browser"
    );

    if (!nav || !browser) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "finance-tab";
    button.dataset.financeTab = "creditos";

    button.innerHTML = `
      <span class="finance-tab-dot"></span>
      Compras a crédito
    `;

    nav.append(button);

    const panel = document.createElement("section");
    panel.className = "finance-panel";
    panel.dataset.financePanel = "creditos";

    panel.innerHTML = `
      <div class="finance-section-heading">
        <div>
          <span class="finance-kicker">
            PENDIENTES DE PAGO
          </span>
          <h2>Compras a crédito</h2>
          <p>
            Por grupo y proveedor. Solo solicitudes
            con método Crédito y pago no confirmado.
          </p>
        </div>

        <button class="finance-button"
                type="button"
                id="ggRefreshCredits">
          ↻ Actualizar
        </button>
      </div>

      <div class="gg-credit-summary"
           id="ggCreditSummary"></div>

      <div class="finance-table-scroll"
           id="ggCreditTable"></div>
    `;

    browser.append(panel);

    button.addEventListener("click", () => {
      nav.querySelectorAll("[data-finance-tab]")
        .forEach(el => el.classList.toggle(
          "active", el === button
        ));

      browser.querySelectorAll("[data-finance-panel]")
        .forEach(el => el.classList.toggle(
          "active", el === panel
        ));

      refresh();
    });

    $("#ggRefreshCredits").addEventListener(
      "click",
      refresh
    );

    document.addEventListener(
      "ggfinance:requests-updated",
      () => {
        if (panel.classList.contains("active")) {
          refresh();
        }
      }
    );

    let run = 0;

    async function refresh() {
      const seq = ++run;
      const host = $("#ggCreditTable");

      host.textContent =
        "Consultando solicitudes a crédito...";

      const { data, error } = await fin.db.rpc(
        "finance_credit_summary"
      );

      if (seq !== run) return;

      if (error) {
        host.textContent =
          "Error al consultar créditos: " +
          error.message;
        return;
      }

      const items = data || [];

      const amount = items.reduce(
        (n,r) => n + Number(r.total_amount || 0),
        0
      );

      const requests = items.reduce(
        (n,r) => n + Number(r.request_count || 0),
        0
      );

      $("#ggCreditSummary").innerHTML = `
        <div>
          <small>IMPORTE PENDIENTE</small>
          <strong>${money(amount)}</strong>
        </div>
        <div>
          <small>SOLICITUDES</small>
          <strong>${requests}</strong>
        </div>
        <div>
          <small>PROVEEDORES POR GRUPO</small>
          <strong>${items.length}</strong>
        </div>
      `;

      host.innerHTML = `
        <table class="finance-table gg-credit-table">
          <thead>
            <tr>
              <th>Empresa / grupo</th>
              <th>Proveedor</th>
              <th>Solicitudes</th>
              <th>Monto sin confirmar</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(r => `
              <tr>
                <td>${escape(r.group_name)}</td>
                <td>${escape(r.provider_name)}</td>
                <td class="finance-money">
                  ${Number(r.request_count)}
                </td>
                <td class="finance-money">
                  ${money(r.total_amount)}
                </td>
              </tr>
            `).join("") || `
              <tr>
                <td colspan="4">
                  No hay solicitudes a crédito
                  sin confirmar.
                </td>
              </tr>
            `}
          </tbody>
          <tfoot>
            <tr>
              <th colspan="2">TOTAL</th>
              <th class="finance-money">
                ${requests}
              </th>
              <th class="finance-money">
                ${money(amount)}
              </th>
            </tr>
          </tfoot>
        </table>
      `;

      normalizeReportTables();
    }
  }

  // ========================================
  // USUARIOS: NOMBRE Y AREA DESDE RH
  // ========================================

  function configureHrUsers(fin) {
    let directory = new Map();

    const decorate = host => {
      if (!host) return;

      host.querySelectorAll("label.finance-checkbox")
        .forEach(label => {
          const input = $(
            'input[type="checkbox"]',
            label
          );

          const current = input &&
            directory.get(input.value);

          label.querySelector(".gg-hr-label")
            ?.remove();

          if (!current) return;

          const block = document.createElement("span");
          block.className = "gg-hr-label";

          const name = document.createElement("strong");
          name.textContent = current.full_name;

          const area = document.createElement("small");
          area.textContent =
            current.area || "Sin puesto asignado";

          block.append(name, area);
          label.append(block);
        });
    };

    fin.db.rpc("finance_hr_user_directory")
      .then(({ data, error }) => {
        if (error) {
          console.warn(
            "Directorio RH:",
            error.message
          );
          return;
        }

        directory = new Map(
          (data || []).map(p => [p.user_id, p])
        );

        decorate($("#financeGroupUsers"));
      });

    const original = fin.openModal;

    fin.openModal = function(config) {
      if (!config?.body?.includes(
        'id="financeGroupUsers"'
      )) {
        return original(config);
      }

      const onOpen = config.onOpen;

      return original({
        ...config,

        onOpen(root) {
          onOpen?.(root);

          const host = $("#financeGroupUsers", root);
          if (!host) return;

          const observer = new MutationObserver(
            () => decorate(host)
          );

          observer.observe(host, {
            childList: true
          });

          decorate(host);

          root.querySelector(
            "[data-finance-close-modal]"
          )?.addEventListener(
            "click",
            () => observer.disconnect(),
            { once: true }
          );
        }
      });
    };
  }

  // ========================================
  // ALINEACION DE REPORTES
  // ========================================

  function normalizeReportTables() {
    document.querySelectorAll(
      ".finance-page .finance-table"
    ).forEach(table => {
      const rows = [...table.tBodies]
        .flatMap(body => [...body.rows]);

      if (!rows.length || !table.tHead?.rows[0]) {
        return;
      }

      [...table.tHead.rows[0].cells]
        .forEach((th, i) => {
          const cells = rows.map(
            row => row.cells[i]
          ).filter(Boolean);

          if (
            cells.length &&
            cells.filter(c =>
              c.classList.contains("finance-money")
            ).length / cells.length > 0.65
          ) {
            th.classList.add("gg-numeric-heading");
          }
        });
    });
  }
})();