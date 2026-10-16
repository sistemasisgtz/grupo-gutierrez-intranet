
/*
 CONTROL FINANCIERO
 Recuperar gráficas de líneas por trimestre.
 No modifica guardados ni datos de Supabase.
*/

(() => {
  "use strict";

  const MONTHS = [
    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
  ];

  const byId = id => document.getElementById(id);

  const compact = amount => {
    const n = Number(amount) || 0;

    if (Math.abs(n) >= 1000000) {
      return `$${(n / 1000000).toFixed(1)}M`;
    }

    if (Math.abs(n) >= 1000) {
      return `$${(n / 1000).toFixed(0)}K`;
    }

    return `$${Math.round(n)}`;
  };

  function drawQuarterLines() {
    const selector = byId("financeQuarterChoice");
    const chart = byId("financeFinancialMonthlyChart");
    const year = byId("financeFinancialYear");

    if (!selector || !chart || !year) return;

    // TODOS: recuperar gráfica original de 12 meses
    if (selector.value === "all") {
      if (chart.querySelector(".gg-quarter-bars")) {
        year.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }
      return;
    }

    const quarter = Number(selector.value);

    if (![1, 2, 3, 4].includes(quarter)) return;

    const start = (quarter - 1) * 3 + 1;

    // Usar los mismos registros confirmados
    // que maneja Control Financiero.
    const requests =
      window.GGFinanceControl?.getRequests?.() || [];

    const filtered = requests.filter(r =>
      r.payment_confirmed === true &&
      r.payment_date &&
      r.actual_amount != null &&
      Number(r.payment_year) === Number(year.value) &&
      Number(r.payment_month) >= start &&
      Number(r.payment_month) < start + 3
    );

    // Agrupar los tres meses
    const lines = Array.from(
      { length: 3 },
      (_, index) => {
        const month = start + index;

        const records = filtered.filter(
          r => Number(r.payment_month) === month
        );

        const total = predicate =>
          records.reduce(
            (sum, r) =>
              sum + (
                predicate(r)
                  ? Number(r.actual_amount) || 0
                  : 0
              ),
            0
          );

        return {
          month: MONTHS[month - 1],
          costs: total(
            r => r.movement_type === "COSTO"
          ),
          expenses: total(
            r => r.movement_type === "GASTO"
          ),
          total: total(() => true)
        };
      }
    );

    // Dimensiones de la gráfica
    const width = 900;
    const height = 280;
    const left = 72;
    const right = 30;
    const top = 24;
    const bottom = 46;

    const plotW = width - left - right;
    const plotH = height - top - bottom;

    const max = Math.max(
      1,
      ...lines.flatMap(r =>
        [r.costs, r.expenses, r.total].filter(
          Number.isFinite
        )
      )
    );

    const x = i => left + i * plotW / 2;

    const y = n =>
      top + plotH -
      Math.max(0, Number(n) || 0) * plotH / max;

    // Líneas horizontales de referencia
    const grid = Array.from(
      { length: 5 },
      (_, i) => {
        const yy = top + i * plotH / 4;

        return `
          <line
            class="chart-grid"
            x1="${left}"
            y1="${yy}"
            x2="${width - right}"
            y2="${yy}"
          ></line>

          <text
            x="${left - 10}"
            y="${yy + 4}"
            text-anchor="end"
          >
            ${compact(max * (1 - i / 4))}
          </text>
        `;
      }
    ).join("");

    // Series: costos, gastos y total
    const series = [
      [
        "costs",
        "chart-line-1",
        "chart-dot-1",
        "Costos"
      ],
      [
        "expenses",
        "chart-line-2",
        "chart-dot-2",
        "Gastos"
      ],
      [
        "total",
        "chart-line-3",
        "chart-dot-3",
        "Total pagado"
      ]
    ].map(([key, lineClass, dotClass, label]) => {
      const points = lines.map(
        (r, i) => `${x(i)},${y(r[key])}`
      ).join(" ");

      const dots = lines.map(
        (r, i) => `
          <circle
            class="${dotClass}"
            cx="${x(i)}"
            cy="${y(r[key])}"
            r="5"
          >
            <title>
              ${label} · ${r.month}: ${compact(r[key])}
            </title>
          </circle>
        `
      ).join("");

      return `
        <polyline
          class="${lineClass}"
          points="${points}"
        ></polyline>
        ${dots}
      `;
    }).join("");

    // Dibujar SVG de líneas, no barras
    chart.innerHTML = `
      <svg
        viewBox="0 0 ${width} ${height}"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Gráfica de líneas del trimestre ${quarter}"
      >
        ${grid}

        <line
          class="chart-axis"
          x1="${left}"
          y1="${top}"
          x2="${left}"
          y2="${height - bottom}"
        ></line>

        <line
          class="chart-axis"
          x1="${left}"
          y1="${height - bottom}"
          x2="${width - right}"
          y2="${height - bottom}"
        ></line>

        ${lines.map(
          (r, i) => `
            <text
              x="${x(i)}"
              y="${height - 14}"
              text-anchor="middle"
            >
              ${r.month}
            </text>
          `
        ).join("")}

        ${series}
      </svg>
    `;
  }

  function init() {
    const selector = byId("financeQuarterChoice");

    if (
      !selector ||
      selector.dataset.linesFixInstalled
    ) return;

    selector.dataset.linesFixInstalled = "1";

    // Dibujar después de que termine el
    // controlador trimestral anterior.
    const redraw = () =>
      queueMicrotask(drawQuarterLines);

    selector.addEventListener("change", redraw);

    byId("financeFinancialYear")
      ?.addEventListener("change", redraw);

    document.addEventListener(
      "ggfinance:requests-updated",
      redraw
    );

    redraw();
  }

  document.addEventListener(
    "ggfinance:control-ready",
    () => queueMicrotask(init)
  );
})();
