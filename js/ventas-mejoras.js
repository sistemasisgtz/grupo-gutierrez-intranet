
/*
  VENTAS - MEJORAS
  Productos, cotizaciones, remisiones y material.
  Este archivo reemplaza ventas-mejoras.js.
*/

(() => {
  "use strict";

  document.addEventListener("ggsales:ready", () => {
    const s = window.GGSales;
    if (!s) return;

    const money = n => new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(Number(n));

    // ==========================================
    // ESTILOS
    // ==========================================

    if (!document.getElementById("gg-ventas-fixes-css")) {
      const style = document.createElement("style");
      style.id = "gg-ventas-fixes-css";

      style.textContent = `
        .gg-price-profit {
          display:flex;
          flex-direction:column;
          gap:5px;
          min-width:0;
        }

        .gg-price-profit [data-q-price] {
          width:100%;
          box-sizing:border-box;
        }

        .gg-profit-field {
          display:flex;
          align-items:center;
          gap:4px;
          padding:4px 5px;
          border:1px solid #a5b4fc;
          border-radius:7px;
          background:rgba(99,102,241,.10);
        }

        .gg-profit-field span {
          font-size:11px;
          font-weight:800;
          color:#9c91fa;
        }

        .gg-profit-field input {
          width:100%;
          min-width:0;
          border:0;
          outline:0;
          color:inherit;
          background:transparent;
          font-size:12px;
          padding:3px;
        }

        .gg-material-cost {
          white-space:nowrap;
          font-weight:700;
        }

        .sales-status.remissioned {
          background:rgba(59,130,246,.15);
          border:1px solid rgba(59,130,246,.35);
          color:#60a5fa;
        }
      `;

      document.head.appendChild(style);
    }

    // ==========================================
    // ELIMINAR PESTAÑA PRECIOS
    // ==========================================

    document.querySelector(
      '[data-sales-tab="prices"]'
    )?.remove();

    document.querySelector(
      '[data-sales-panel="prices"]'
    )?.remove();

    // Mantener el grupo de precios internamente.
    // Las RPC antiguas todavía lo necesitan.

    function hideInternalPriceGroup(selectId, groupId) {
      const select = document.getElementById(selectId);
      const group = document.getElementById(groupId)?.value;

      if (!select) return;

      const field = select.closest(".sales-field");

      if (field && field.style.display !== "none") {
        field.style.display = "none";
      }

      if (!select.value && group) {
        const first = s.state.priceGroups.find(
          p => p.product_group_id === group
        );

        if (
          first &&
          select.querySelector(
            `option[value="${first.id}"]`
          )
        ) {
          select.value = first.id;
        }
      }
    }

    // ==========================================
    // PORCENTAJE DE GANANCIA EN COTIZACIONES
    // ==========================================

    function prepareQuoteRows() {
      document.querySelectorAll(
        "#salesQItems .sales-line"
      ).forEach(row => {
        if (row.querySelector("[data-q-profit]")) return;

        const price = row.querySelector("[data-q-price]");
        if (!price) return;

        row.dataset.ggBasePrice = price.value;

        const wrap = document.createElement("div");
        wrap.className = "gg-price-profit";

        price.parentNode.insertBefore(wrap, price);
        wrap.appendChild(price);

        const label = document.createElement("label");
        label.className = "gg-profit-field";
        label.title =
          "Aumento sobre precio unitario. Ejemplo: 20 = 20%.";

        const text = document.createElement("span");
        text.textContent = "%";

        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = "10000";
        input.step = "0.01";
        input.placeholder = "Ganancia";
        input.dataset.qProfit = "";

        label.append(text, input);
        wrap.appendChild(label);

        input.addEventListener("input", () => {
          const percentage = input.value === ""
            ? 0
            : Number(input.value);

          if (
            !Number.isFinite(percentage) ||
            percentage < 0 ||
            percentage > 10000
          ) {
            input.setCustomValidity(
              "Porcentaje inválido (0 a 10000)."
            );
            input.reportValidity();
            return;
          }

          input.setCustomValidity("");

          const baseText = row.dataset.ggBasePrice;

          if (baseText === "" || baseText == null) {
            return;
          }

          const base = Number(baseText);

          if (!Number.isFinite(base)) return;

          price.value = (
            Math.round(
              (base * (1 + percentage / 100)
                + Number.EPSILON) * 100
            ) / 100
          ).toFixed(2);

          row.dataset.ggSettingPrice = "yes";

          price.dispatchEvent(
            new Event("input", { bubbles: true })
          );

          delete row.dataset.ggSettingPrice;
        });

        price.addEventListener("input", () => {
          if (row.dataset.ggSettingPrice) return;

          row.dataset.ggBasePrice = price.value;
          input.value = "";
        });
      });
    }

    function prepareUI() {
      hideInternalPriceGroup(
        "salesQPriceGroup",
        "salesQProductGroup"
      );

      hideInternalPriceGroup(
        "salesRPriceGroup",
        "salesRGroup"
      );

      prepareQuoteRows();
    }

    let pending = false;

    const observer = new MutationObserver(() => {
      if (pending) return;

      pending = true;

      queueMicrotask(() => {
        pending = false;
        prepareUI();
      });
    });

    observer.observe(
      document.getElementById("salesModalRoot") ||
        document.body,
      {
        subtree: true,
        childList: true
      }
    );

    prepareUI();

    document.addEventListener("change", e => {
      if (
        e.target?.id === "salesQProductGroup" ||
        e.target?.id === "salesRGroup"
      ) {
        queueMicrotask(prepareUI);
      }
    });

    // ==========================================
    // LUPA PRODUCTOS - COTIZACIONES Y REMISIONES
    // ==========================================

    document.addEventListener("click", event => {
      const button = event.target.closest(
        "#salesQItems [data-find-product], " +
        "#salesQItems [data-find-price], " +
        "#salesRItems [data-r-find]"
      );

      if (!button) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const quote = !!button.closest("#salesQItems");
      const row = button.closest(".sales-line");

      const group = document.getElementById(
        quote ? "salesQProductGroup" : "salesRGroup"
      )?.value;

      if (!group) {
        s.toast(
          "Selecciona primero el grupo de productos.",
          true
        );
        return;
      }

      const products = s.state.products.filter(
        p => p.active !== false && p.group_id === group
      );

      s.openNestedModal({
        kicker: "CATÁLOGO DE PRODUCTOS",
        title: "Buscar producto",
        wide: true,

        body: `
          <input
            class="sales-modal-search"
            type="search"
            data-gg-search
            placeholder="Buscar clave o descripción..."
          >
          <div
            class="sales-list"
            data-gg-results
          ></div>
        `,

        onOpen(layer) {
          const search = layer.querySelector(
            "[data-gg-search]"
          );

          const list = layer.querySelector(
            "[data-gg-results]"
          );

          function render() {
            const filter = s.normalize(search.value);

            const matches = products.filter(p =>
              !filter ||
              s.normalize(
                `${p.code || ""} ${p.description || ""}`
              ).includes(filter)
            );

            list.innerHTML = matches.map(p => `
              <button
                type="button"
                class="sales-pick-row"
                data-gg-pick="${p.id}"
              >
                <strong>
                  ${s.escapeHtml(p.code || "—")}
                </strong>

                <span>
                  ${s.escapeHtml(p.description || "")}
                </span>

                <em>
                  ${
                    p.unit_price == null
                      ? "Sin precio asignado"
                      : `${s.escapeHtml(
                          s.money(
                            Number(p.unit_price),
                            p.currency || "M.N."
                          )
                        )} ${s.escapeHtml(
                          p.currency || "M.N."
                        )}`
                  }
                </em>
              </button>
            `).join("") ||
              '<div class="sales-empty">Sin coincidencias.</div>';
          }

          search.addEventListener("input", render);

          list.addEventListener("click", e => {
            const pick = e.target.closest(
              "[data-gg-pick]"
            );

            if (!pick || !row.isConnected) return;

            const p = products.find(
              x => x.id === pick.dataset.ggPick
            );

            if (!p) return;

            const unit = s.state.units.find(
              x => x.id === p.unit_id
            );

            const prefix = quote ? "q" : "r";

            const set = (field, value) => {
              const input = row.querySelector(
                `[data-${prefix}-${field}]`
              );

              if (input) input.value = value;

              return input;
            };

            row.dataset.productId = p.id;

            set(
              "unit",
              unit?.abbreviation || ""
            );

            set("code", p.code || "");
            set("desc", p.description || "");

            const priceText = p.unit_price == null
              ? ""
              : Number(p.unit_price).toFixed(2);

            const inputPrice = set(
              "price",
              priceText
            );

            set(
              "currency",
              p.currency === "USD" ? "USD" : "M.N."
            );

            if (quote) {
              row.dataset.ggBasePrice = priceText;

              const percent = row.querySelector(
                "[data-q-profit]"
              );

              if (percent) {
                percent.value = "";
                percent.setCustomValidity("");
              }
            }

            inputPrice?.dispatchEvent(
              new Event("input", { bubbles: true })
            );

            if (quote) {
              row.dataset.ggBasePrice = priceText;
            }

            s.closeNestedModal(layer);
          });

          render();
          search.focus();
        }
      });
    }, true);

    // ==========================================
    // COSTO EN SOLICITUD DE MATERIAL
    // ==========================================

    const originalModal = s.openModal;

    s.openModal = function(config) {
      if (
        !config?.body?.includes(
          'id="salesMatForm"'
        )
      ) {
        return originalModal(config);
      }

      const originalOnOpen = config.onOpen;

      return originalModal({
        ...config,

        onOpen(root) {
          originalOnOpen?.(root);

          const table = root.querySelector(
            "#salesMatProducts"
          )?.closest("table");

          const tbody = root.querySelector(
            "#salesMatProducts"
          );

          if (!table || !tbody) return;

          const headings = table.querySelectorAll(
            "thead th"
          );

          const column = document.createElement("th");
          column.textContent = "Costo unitario";

          headings[headings.length - 1]?.before(column);

          const costMap = new Map();

          const applyCosts = () => {
            tbody.querySelectorAll(
              "tr[data-mat-product]"
            ).forEach(tr => {
              if (tr.querySelector(".gg-material-cost")) {
                return;
              }

              const td = document.createElement("td");
              td.className = "gg-material-cost";

              const cost = costMap.get(
                tr.dataset.matProduct
              );

              td.textContent = cost == null
                ? "—"
                : money(cost);

              tr.lastElementChild?.before(td);
            });
          };

          let queued = false;

          const costObserver = new MutationObserver(() => {
            if (queued) return;

            queued = true;

            queueMicrotask(() => {
              queued = false;
              applyCosts();
            });
          });

          costObserver.observe(tbody, {
            childList: true
          });

          applyCosts();

          (async () => {
            for (let page = 0; page < 50; page++) {
              const { data, error } = await s.db
                .from("warehouse_products")
                .select("id,unit_cost")
                .eq("active", true)
                .range(
                  page * 1000,
                  (page + 1) * 1000 - 1
                );

              if (error) throw error;

              (data || []).forEach(p => {
                costMap.set(p.id, p.unit_cost);
              });

              if (!data || data.length < 1000) {
                break;
              }
            }

            tbody.querySelectorAll(
              ".gg-material-cost"
            ).forEach(cell => cell.remove());

            applyCosts();
          })().catch(err => {
            console.error(
              "No se pudieron cargar los costos:",
              err
            );

            s.toast(
              "No se pudieron consultar los costos de Almacén.",
              true
            );
          });
        }
      });
    };

    // ==========================================
    // PDF DE SOLICITUD DE MATERIAL CON COSTOS
    // ==========================================

    if (window.GGSalesPDF) {
      let loadingPdf = null;

      async function ensureJsPdf() {
        if (window.jspdf?.jsPDF) {
          return window.jspdf.jsPDF;
        }

        if (!loadingPdf) {
          loadingPdf = new Promise((resolve, reject) => {
            const src =
              "https://unpkg.com/jspdf@4.2.1/dist/jspdf.umd.min.js";

            let script = document.querySelector(
              `script[src="${src}"]`
            );

            if (!script) {
              script = document.createElement("script");
              script.src = src;
              document.head.appendChild(script);
            }

            script.addEventListener(
              "load",
              () => resolve(window.jspdf?.jsPDF),
              { once: true }
            );

            script.addEventListener(
              "error",
              () => reject(
                new Error("No se pudo cargar jsPDF")
              ),
              { once: true }
            );
          });
        }

        const lib = await loadingPdf;

        if (!lib) {
          throw new Error(
            "Biblioteca de PDF no disponible"
          );
        }

        return lib;
      }

      window.GGSalesPDF.materialRequest = async function(id) {
        const jsPDF = await ensureJsPdf();

        const [
          { data: req, error: err1 },
          { data: items, error: err2 }
        ] = await Promise.all([
          s.db
            .from("sales_material_requests")
            .select("*")
            .eq("id", id)
            .single(),

          s.db
            .from("sales_material_request_items")
            .select("*")
            .eq("request_id", id)
            .order("position")
        ]);

        if (err1 || err2) {
          throw err1 || err2;
        }

        const ids = [
          ...new Set(
            (items || [])
              .map(x => x.warehouse_product_id)
              .filter(Boolean)
          )
        ];

        const costs = new Map();

        for (let i = 0; i < ids.length; i += 200) {
          const { data, error } = await s.db
            .from("warehouse_products")
            .select("id,unit_cost")
            .in(
              "id",
              ids.slice(i, i + 200)
            );

          if (error) throw error;

          (data || []).forEach(p => {
            costs.set(p.id, p.unit_cost);
          });
        }

        const doc = new jsPDF({
          unit: "mm",
          format: "letter"
        });

        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        const margin = 12;
        let y = 12;

        const safe = x => String(x ?? "");
        const date = x => x ? s.date(x) : "—";

        function header() {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(25, 38, 53);
          doc.setFontSize(16);

          doc.text(
            "GRUPO GUTIERREZ",
            margin,
            y
          );

          doc.setFontSize(12);

          doc.text(
            "SOLICITUD DE MATERIAL",
            width - margin,
            y,
            { align: "right" }
          );

          doc.setFontSize(9);

          doc.text(
            safe(req.folio),
            width - margin,
            y + 6,
            { align: "right" }
          );

          y += 18;

          doc.setDrawColor(205, 213, 225);

          doc.roundedRect(
            margin,
            y,
            width - 2 * margin,
            24,
            1.5,
            1.5
          );

          doc.setFontSize(8);

          doc.text(
            `Solicitado por: ${safe(req.created_by_email)}`,
            margin + 3,
            y + 6
          );

          doc.text(
            `Fecha: ${date(req.request_date)}`,
            margin + 3,
            y + 13
          );

          doc.text(
            `Estatus: ${safe(req.status).toUpperCase()}`,
            margin + 100,
            y + 6
          );

          if (req.resolved_by_email) {
            doc.text(
              `Almacén: ${safe(req.resolved_by_email)}`,
              margin + 100,
              y + 13
            );
          }

          y += 31;
        }

        function tableHead() {
          doc.setFillColor(31, 42, 53);

          doc.rect(
            margin,
            y,
            width - 2 * margin,
            8,
            "F"
          );

          doc.setTextColor(255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);

          doc.text("CANT.", margin + 2, y + 5);
          doc.text("UNID.", margin + 21, y + 5);
          doc.text("CLAVE", margin + 43, y + 5);
          doc.text("DESCRIPCIÓN", margin + 73, y + 5);

          doc.text(
            "COSTO U.",
            width - margin - 2,
            y + 5,
            { align: "right" }
          );

          doc.setTextColor(25, 38, 53);
          y += 8;
        }

        header();
        tableHead();

        for (const item of (items || [])) {
          const lines = doc.splitTextToSize(
            safe(item.description_snapshot),
            72
          );

          const rowHeight = Math.max(
            9,
            lines.length * 3.4 + 4
          );

          if (y + rowHeight > height - 18) {
            doc.addPage();
            y = 12;
            tableHead();
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);

          doc.text(
            safe(item.requested_quantity),
            margin + 2,
            y + 5
          );

          doc.text(
            safe(item.unit_snapshot),
            margin + 21,
            y + 5
          );

          doc.text(
            safe(item.code_snapshot),
            margin + 43,
            y + 5
          );

          doc.text(
            lines,
            margin + 73,
            y + 5
          );

          const cost = costs.get(
            item.warehouse_product_id
          );

          doc.text(
            cost == null ? "—" : money(cost),
            width - margin - 2,
            y + 5,
            { align: "right" }
          );

          doc.setDrawColor(224, 230, 239);

          doc.line(
            margin,
            y + rowHeight,
            width - margin,
            y + rowHeight
          );

          y += rowHeight;
        }

        const pages =
          doc.internal.getNumberOfPages();

        for (let n = 1; n <= pages; n++) {
          doc.setPage(n);
          doc.setFontSize(7);
          doc.setTextColor(115);

          doc.text(
            `Documento generado: ${s.dateTime(
              new Date().toISOString()
            )}`,
            margin,
            height - 8
          );

          doc.text(
            `${n} / ${pages}`,
            width - margin,
            height - 8,
            { align: "right" }
          );
        }

        doc.save(
          `${safe(req.folio).replace(
            /[^\w-]/g,
            "_"
          )}.pdf`
        );
      };
    }
  });
})();
