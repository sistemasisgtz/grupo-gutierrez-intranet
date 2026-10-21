
(() => {
  "use strict";

  const S = () => window.GGSales;
  const db = () => S().db;
  const userId = () => S()?.state?.user?.id;

  const esc = value =>
    S().escapeHtml(String(value ?? ""));

  const $ = (id, root = document) =>
    root.querySelector(`#${id}`);

  const val = (id, root = document) =>
    $(id, root)?.value?.trim() || "";

  const memo = new WeakMap();

  const UUID =
    /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

  const configurations = {
    quote: {
      form: "salesQuoteForm",
      prefix: "q",
      area: "salesQItems",
      group: "salesQProductGroup"
    },

    remission_manual: {
      form: "salesRForm",
      prefix: "r",
      area: "salesRItems",
      party: "salesRClient",
      type: "delivery"
    },

    remission_quote: {
      form: "salesRQForm",
      prefix: "rq",
      area: null,
      type: "delivery"
    },

    odc: {
      form: "salesOrderForm",
      prefix: "o",
      area: "salesOItems",
      party: "salesOSupplier",
      type: "pickup"
    }
  };

  function notify(message, bad = false) {
    S().toast(message, bad);
  }

  function textInput(id, label, value = "", rows = 3) {
    return `
      <div class="sales-field sales-plus-full">
        <label for="${id}">
          ${esc(label)}
        </label>

        <textarea
          id="${id}"
          rows="${rows}"
        >${esc(value)}</textarea>
      </div>
    `;
  }

  // ========================================
  // CAPTURA DEL BORRADOR
  // ========================================

  function capture(form, config) {
    const fields = {};

    form.querySelectorAll(
      "input[id],textarea[id],select[id]"
    ).forEach(el => {

      if (
        el.type === "file" ||
        el.type === "submit" ||
        el.readOnly
      ) {
        return;
      }

      fields[el.id] =
        el.type === "checkbox"
          ? el.checked
          : el.value;
    });

    const rows = config.area
      ? [
          ...form.querySelectorAll(
            `#${config.area} .sales-line`
          )
        ].map(row => {

          const obj = {
            itemId: row.dataset.itemId || "",
            productId: row.dataset.productId || ""
          };

          row.querySelectorAll(
            "input,textarea,select"
          ).forEach(el => {

            const key = [...el.attributes].find(
              attribute =>
                attribute.name.startsWith("data-") &&
                !attribute.name.startsWith("data-item")
            );

            if (key) {
              obj[key.name] = el.value;
            }
          });

          return obj;
        })

      : [
          ...form.querySelectorAll("[data-rq-line]")
        ].map(row => ({
          id: row.dataset.rqLine,
          quantity:
            row.querySelector("[data-rq-qty]")
              ?.value || "0"
        }));

    return {
      fields,
      rows,
      capturedAt: new Date().toISOString()
    };
  }

  function convertRow(row, prefix) {
    const field = name =>
      row[`data-${prefix}-${name}`] || "";

    return {
      id: null,
      product_id: row.productId || null,
      quantity: Number(field("qty") || 0),
      unit_text: field("unit"),
      code: field("code"),
      description: field("desc"),
      unit_price: Number(field("price") || 0),
      currency: field("currency") || "M.N."
    };
  }

  // ========================================
  // RECUPERAR BORRADOR EN EL FORMULARIO
  // ========================================

  function restore(form, config, payload, addLine) {
    const fields = payload?.fields || {};

    if (config.group && fields[config.group]) {
      const group = $(config.group, form);

      if (group) {
        group.value = fields[config.group];

        group.dispatchEvent(
          new Event("change", {
            bubbles: true
          })
        );
      }
    }

    if (config.party && fields[config.party]) {
      const party = $(config.party, form);

      if (party) {
        party.value = fields[config.party];

        party.dispatchEvent(
          new Event("change", {
            bubbles: true
          })
        );
      }
    }

    Object.entries(fields).forEach(
      ([id, value]) => {

        const el = $(id, form);

        if (
          !el ||
          id === config.group ||
          id === config.party
        ) {
          return;
        }

        if (el.type === "checkbox") {
          el.checked = Boolean(value);
        } else {
          el.value = value ?? "";
        }
      }
    );

    if (
      config.area &&
      addLine &&
      Array.isArray(payload.rows)
    ) {
      const area = $(config.area, form);

      if (area) {
        area.innerHTML = "";

        if (payload.rows.length) {
          payload.rows.forEach(row =>
            addLine(
              convertRow(row, config.prefix)
            )
          );
        } else {
          addLine();
        }
      }

    } else if (Array.isArray(payload.rows)) {

      // Remisión nacida desde una cotización.
      payload.rows.forEach(saved => {

        const row = [
          ...form.querySelectorAll("[data-rq-line]")
        ].find(
          item =>
            item.dataset.rqLine === saved.id
        );

        const input =
          row?.querySelector("[data-rq-qty]");

        if (input) {
          input.value = saved.quantity;
        }
      });
    }

    form.querySelectorAll(
      "input,select,textarea"
    ).forEach(el => {

      if (el.matches(
        "[data-q-qty],[data-q-price]," +
        "[data-q-currency]," +
        "[data-r-qty],[data-r-price]," +
        "[data-o-qty],[data-o-price]"
      )) {
        el.dispatchEvent(
          new Event("input", {
            bubbles: true
          })
        );
      }
    });

    $("salesQIva", form)?.dispatchEvent(
      new Event("change", {
        bubbles: true
      })
    );
  }

  async function draftLoad(kind) {
    const { data, error } = await db()
      .from("sales_user_drafts")
      .select("payload,updated_at")
      .eq("user_id", userId())
      .eq("kind", kind)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  async function draftDelete(kind) {
    const { error } = await db()
      .from("sales_user_drafts")
      .delete()
      .eq("user_id", userId())
      .eq("kind", kind);

    if (error) throw error;
  }

  // ========================================
  // DIRECCIONES GUARDADAS
  // ========================================

  async function addressList(type, entityId) {
    if (!entityId) return [];

    const { data, error } = await db()
      .from("sales_user_addresses")
      .select("*")
      .eq("user_id", userId())
      .eq("kind", type)
      .eq("entity_id", entityId)
      .order("label");

    if (error) throw error;

    return data || [];
  }

  function addressMarkup(type, current = "") {
    const caption =
      type === "delivery"
        ? "Dirección de entrega"
        : "Dirección de recoger";

    return `
      <section
        class="sales-plus-address sales-plus-full"
        data-address-kind="${type}"
      >

        <div class="sales-plus-inline">
          <strong>${caption}</strong>

          <button
            type="button"
            class="sales-btn"
            data-plus-manage
          >
            + Guardar / administrar
          </button>
        </div>

        <select data-plus-choose>
          <option value="">
            Escribir dirección manualmente...
          </option>
        </select>

        <textarea
          id="salesPlusAddress"
          rows="3"
          placeholder="Calle, número, colonia, municipio, referencias..."
        >${esc(current)}</textarea>

        <small>
          Selecciona una dirección guardada o escribe
          una nueva. Quedará fija en este documento.
        </small>

      </section>
    `;
  }

  async function fillAddressOptions(
    section,
    type,
    entityId,
    selectedId = ""
  ) {
    const select =
      section.querySelector("[data-plus-choose]");

    try {
      const rows = await addressList(
        type,
        entityId
      );

      if (!select.isConnected) return;

      select.innerHTML = `
        <option value="">
          Dirección manual / sin seleccionar
        </option>
      ` + rows.map(row => `
        <option value="${row.id}">
          ${esc(row.label)} —
          ${esc(row.address.slice(0, 60))}
        </option>
      `).join("");

      if (
        selectedId &&
        rows.some(row => row.id === selectedId)
      ) {
        select.value = selectedId;
      }

      select.onchange = () => {
        const entry = rows.find(
          row => row.id === select.value
        );

        if (entry) {
          const textarea =
            section.querySelector(
              "#salesPlusAddress"
            );

          textarea.value = entry.address;

          textarea.dispatchEvent(
            new Event("input", {
              bubbles: true
            })
          );
        }
      };

    } catch (error) {
      notify(
        `Direcciones: ${error.message}`,
        true
      );
    }
  }

  // ========================================
  // ALTA / EDICIÓN / ELIMINACIÓN
  // DE DIRECCIONES
  // ========================================

  function manageAddresses(
    section,
    type,
    getEntityId
  ) {
    const entityId = getEntityId();

    if (!entityId) {
      notify(
        "Selecciona primero un cliente o proveedor.",
        true
      );
      return;
    }

    S().openNestedModal({

      title: type === "delivery"
        ? "Direcciones de entrega"
        : "Direcciones de recoger",

      wide: true,

      body: `
        <form id="salesPlusAddressForm">

          <input
            type="hidden"
            id="salesPlusAddressId"
          >

          <div class="sales-field">
            <label>Nombre corto *</label>

            <input
              id="salesPlusAddressLabel"
              required
              placeholder="Obra, bodega, sucursal..."
            >
          </div>

          ${textInput(
            "salesPlusAddressText",
            "Dirección completa *",
            "",
            4
          )}

          <div class="sales-plus-inline">

            <button
              class="sales-btn primary"
              type="submit"
            >
              Guardar dirección
            </button>

            <span
              id="salesPlusAddressMsg"
              class="sales-form-msg"
            ></span>

          </div>

        </form>

        <div
          id="salesPlusAddressList"
          class="sales-plus-address-list"
        ></div>
      `,

      onOpen: layer => {

        const form =
          $("salesPlusAddressForm", layer);

        const list =
          $("salesPlusAddressList", layer);

        let rows = [];

        async function reload() {

          rows = await addressList(
            type,
            entityId
          );

          list.innerHTML = rows.length

            ? rows.map(row => `
              <div class="sales-plus-address-item">

                <span>
                  <b>${esc(row.label)}</b>
                  <small>${esc(row.address)}</small>
                </span>

                <div>

                  <button
                    class="sales-mini"
                    type="button"
                    data-edit="${row.id}"
                  >
                    Editar
                  </button>

                  <button
                    class="sales-mini danger"
                    type="button"
                    data-delete="${row.id}"
                  >
                    Eliminar
                  </button>

                  <button
                    class="sales-mini"
                    type="button"
                    data-pick="${row.id}"
                  >
                    Usar
                  </button>

                </div>

              </div>
            `).join("")

            : `<p>No hay direcciones guardadas.</p>`;

          await fillAddressOptions(
            section,
            type,
            entityId
          );
        }

        form.onsubmit = async event => {
          event.preventDefault();

          const record = {
            user_id: userId(),
            kind: type,
            entity_id: entityId,

            label: val(
              "salesPlusAddressLabel",
              layer
            ),

            address: val(
              "salesPlusAddressText",
              layer
            )
          };

          const id = val(
            "salesPlusAddressId",
            layer
          );

          const query = id

            ? db()
              .from("sales_user_addresses")
              .update(record)
              .eq("id", id)
              .eq("user_id", userId())

            : db()
              .from("sales_user_addresses")
              .insert(record);

          const { error } = await query;

          if (error) {
            $("salesPlusAddressMsg", layer)
              .textContent = error.message;
            return;
          }

          form.reset();

          $("salesPlusAddressId", layer)
            .value = "";

          await reload();

          notify("Dirección guardada.");
        };

        list.onclick = async event => {

          const button = event.target.closest(
            "[data-edit],[data-delete],[data-pick]"
          );

          if (!button) return;

          const addressId =
            button.dataset.edit ||
            button.dataset.delete ||
            button.dataset.pick;

          const row = rows.find(
            item => item.id === addressId
          );

          if (!row) return;

          if (
            button.hasAttribute("data-edit")
          ) {

            $("salesPlusAddressId", layer)
              .value = row.id;

            $("salesPlusAddressLabel", layer)
              .value = row.label;

            $("salesPlusAddressText", layer)
              .value = row.address;

          } else if (
            button.hasAttribute("data-pick")
          ) {

            const textarea =
              section.querySelector(
                "#salesPlusAddress"
              );

            textarea.value = row.address;

            section.querySelector(
              "[data-plus-choose]"
            ).value = row.id;

            textarea.dispatchEvent(
              new Event("input", {
                bubbles: true
              })
            );

            S().closeNestedModal(layer);

          } else if (
            confirm(
              `¿Eliminar la dirección «${row.label}»?`
            )
          ) {

            const { error } = await db()
              .from("sales_user_addresses")
              .delete()
              .eq("id", row.id)
              .eq("user_id", userId());

            if (error) {
              notify(error.message, true);
            } else {
              await reload();
            }
          }
        };

        reload().catch(error =>
          notify(error.message, true)
        );
      }
    });
  }

  // ========================================
  // ALTA RÁPIDA DE PRODUCTOS
  // ========================================

  function quickProduct(form) {

    const groupId = val(
      "salesQProductGroup",
      form
    );

    if (!groupId) {
      notify(
        "Selecciona primero el grupo de productos.",
        true
      );
      return;
    }

    S().openNestedModal({

      title: "Nuevo producto para la cotización",

      wide: true,

      body: `
        <form id="salesPlusProductForm">

          <div class="sales-grid two">

            <div class="sales-field">
              <label>Grupo *</label>

              <select
                id="salesPlusPGroup"
                required
              >

                ${S().state.productGroups.map(
                  group => `
                    <option
                      value="${group.id}"
                      ${
                        group.id === groupId
                          ? "selected"
                          : ""
                      }
                    >
                      ${esc(group.name)}
                    </option>
                  `
                ).join("")}

              </select>
            </div>

            <div class="sales-field">

              <label>Unidad *</label>

              <select
                id="salesPlusPUnit"
                required
              >

                <option value="">
                  Seleccionar...
                </option>

                ${S().state.units.map(
                  unit => `
                    <option value="${unit.id}">
                      ${esc(unit.name)}
                      (${esc(unit.abbreviation || "")})
                    </option>
                  `
                ).join("")}

              </select>

            </div>

            <div class="sales-field">

              <label>Clave *</label>

              <input
                id="salesPlusPCode"
                required
                maxlength="100"
              >

            </div>

            ${textInput(
              "salesPlusPDesc",
              "Descripción *",
              "",
              4
            )}

            <div class="sales-field">

              <label>Precio opcional</label>

              <input
                type="number"
                min="0"
                step="0.01"
                id="salesPlusPPrice"
              >

            </div>

            <div class="sales-field">

              <label>Moneda</label>

              <select id="salesPlusPCurrency">
                <option>M.N.</option>
                <option>USD</option>
              </select>

            </div>

          </div>

          <div
            id="salesPlusPMsg"
            class="sales-form-msg"
          ></div>

          <button
            class="sales-btn primary"
            type="submit"
          >
            Guardar producto
          </button>

        </form>
      `,

      onOpen: layer => {

        $("salesPlusProductForm", layer)
          .onsubmit = async event => {

            event.preventDefault();

            const price = val(
              "salesPlusPPrice",
              layer
            );

            const payload = {

              group_id: val(
                "salesPlusPGroup",
                layer
              ),

              unit_id: val(
                "salesPlusPUnit",
                layer
              ),

              code: val(
                "salesPlusPCode",
                layer
              ),

              description: val(
                "salesPlusPDesc",
                layer
              ),

              unit_price: price
                ? Number(price)
                : null,

              currency: val(
                "salesPlusPCurrency",
                layer
              )
            };

            const { error } = await db()
              .from("sales_products")
              .insert(payload);

            if (error) {

              $("salesPlusPMsg", layer)
                .textContent = error.message;

              return;
            }

            await S().reload("products");

            S().closeNestedModal(layer);

            notify(
              "Producto registrado. Ya aparece en la búsqueda."
            );
          };
      }
    });
  }

  // ========================================
  // CONECTAR FORMULARIOS COMERCIALES
  // ========================================

  async function mount(kind, options = {}) {

    const config = configurations[kind];

    const form = document.getElementById(
      config.form
    );

    if (!form || memo.has(form)) return;

    const base = options.base || null;

    const isNew =
      !base && !options.isCopy;

    const draftKind =
      kind === "remission_quote"
        ? `remission_quote:${options.quoteId}`
        : kind;

    let active = false;

    let saveInFlight = Promise.resolve();

    let timer = null;

    const state = {
      kind,
      draftKind,
      isNew,
      form
    };

    memo.set(form, state);

    // CAMPO DE REMISIÓN DETALLE

    if (kind === "quote") {

      form.insertAdjacentHTML(
        "afterbegin",
        `
          <div class="sales-plus-heading">
            ${textInput(
              "salesPlusRemissionDetail",
              "Remisión detalle (se imprimirá arriba en el PDF)",
              base?.remission_detail || "",
              3
            )}
          </div>
        `
      );

      const group = $(
        "salesQProductGroup",
        form
      );

      group?.closest(".sales-field")
        ?.insertAdjacentHTML(
          "beforeend",
          `
            <button
              type="button"
              class="sales-plus-link"
              id="salesPlusQuickProduct"
            >
              + Dar de alta producto aquí
            </button>
          `
        );

      $("salesPlusQuickProduct", form)
        ?.addEventListener(
          "click",
          () => quickProduct(form)
        );
    }

    // DIRECCIONES DE ENTREGA / RECOGER

    if (config.type) {

      const property =
        kind === "odc"
          ? "pickup_address"
          : "delivery_address";

      const html = addressMarkup(
        config.type,
        base?.[property] || ""
      );

      const grid =
        form.querySelector(".sales-grid.three");

      if (grid) {
        grid.insertAdjacentHTML(
          "afterend",
          html
        );
      } else {
        form.insertAdjacentHTML(
          "afterbegin",
          html
        );
      }

      const section = form.querySelector(
        "[data-address-kind]"
      );

      const getEntityId = () =>
        options.entityId ||
        val(config.party, form);

      const refresh = () =>
        fillAddressOptions(
          section,
          config.type,
          getEntityId()
        );

      section.querySelector(
        "[data-plus-manage]"
      ).onclick = () =>
        manageAddresses(
          section,
          config.type,
          getEntityId
        );

      if (config.party) {
        $(config.party, form)
          ?.addEventListener(
            "change",
            refresh
          );
      }

      refresh();
    }

    // SOLO LOS DOCUMENTOS NUEVOS
    // TIENEN BORRADOR AUTOMÁTICO

    if (!isNew) return;

    form.insertAdjacentHTML(
      "afterbegin",
      `
        <div
          class="sales-plus-draft"
          data-plus-status
        >
          Guardado automático de borrador · exclusivo de tu usuario
        </div>
      `
    );

    const status = form.querySelector(
      "[data-plus-status]"
    );

    async function save() {

      if (
        !active ||
        !form.isConnected ||
        !userId()
      ) {
        return;
      }

      const payload = capture(
        form,
        config
      );

      saveInFlight = saveInFlight
        .catch(() => {})
        .then(async () => {

          const { error } = await db()
            .from("sales_user_drafts")
            .upsert(
              {
                user_id: userId(),
                kind: draftKind,
                payload,
                updated_at:
                  new Date().toISOString()
              },
              {
                onConflict: "user_id,kind"
              }
            );

          if (error) throw error;
        });

      try {

        await saveInFlight;

        if (status.isConnected) {
          status.textContent =
            "✓ Borrador guardado para tu usuario";
        }

      } catch (error) {

        if (status.isConnected) {
          status.textContent =
            `⚠ No se pudo guardar: ${error.message}`;
        }
      }
    }

    function schedule() {

      if (!active) return;

      if (status.isConnected) {
        status.textContent =
          "Guardando borrador...";
      }

      clearTimeout(timer);

      timer = setTimeout(
        save,
        650
      );
    }

    form.addEventListener(
      "input",
      schedule
    );

    form.addEventListener(
      "change",
      schedule
    );

    form.addEventListener(
      "click",
      event => {

        if (event.target.closest(
          "[data-remove-line]," +
          "[data-o-remove]," +
          "#salesQAddLine," +
          "#salesRAdd," +
          "#salesOAddLine"
        )) {
          setTimeout(schedule, 0);
        }
      }
    );

    const observer = new MutationObserver(() => {

      if (!form.isConnected) {

        observer.disconnect();

        clearTimeout(timer);
      }
    });

    observer.observe(
      document.getElementById(
        "salesModalRoot"
      ),
      {
        childList: true,
        subtree: true
      }
    );

    try {

      const draft = await draftLoad(
        draftKind
      );

      if (
        draft?.payload &&
        form.isConnected
      ) {

        const description =
          kind === "quote"
            ? "cotización"
            : kind === "odc"
              ? "ODC"
              : "remisión";

        const answer = confirm(
          `Encontré tu borrador de ${description} ` +
          `(${new Date(draft.updated_at).toLocaleString("es-MX")}). ` +
          "¿Deseas retomarlo?"
        );

        if (answer) {

          restore(
            form,
            config,
            draft.payload,
            options.addLine
          );

          status.textContent =
            "✓ Borrador recuperado";

        } else {

          await draftDelete(
            draftKind
          );

          status.textContent =
            "Comenzando borrador nuevo";
        }
      }

    } catch (error) {

      status.textContent =
        `⚠ Borradores: ${error.message}`;
    }

    active = true;

    schedule();

    state.waitForPending = () =>
      saveInFlight;

    state.dispose = () => {

      clearTimeout(timer);

      active = false;
    };
  }

  // ========================================
  // DATOS EXTRAS DE EMPRESA PARA PDF
  // ========================================

  function companyDetails(
    formatId,
    companyId,
    snapshot
  ) {

    const format = S().state.formats.find(
      item => item.id === formatId
    );

    const id =
      companyId ||
      format?.company_id ||
      snapshot?.id ||
      null;

    return S().state.companies.find(
      company => company.id === id
    )?.company_details ||
      snapshot?.company_details ||
      "";
  }

  function mountCompany(root) {

    const form = $(
      "salesCompanyForm",
      root
    );

    if (
      !form ||
      $("salesPlusCompanyDetails", root)
    ) {
      return;
    }

    const grid =
      form.querySelector(".sales-grid.two");

    grid?.insertAdjacentHTML(
      "beforeend",
      textInput(
        "salesPlusCompanyDetails",
        "Datos debajo del nombre en el PDF (RFC, domicilio, teléfono...)",
        "",
        4
      )
    );

    $("salesCompanyList", root)
      ?.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-edit-company]"
            );

          if (!button) return;

          const company =
            S().state.companies.find(
              item =>
                item.id ===
                button.dataset.editCompany
            );

          $("salesPlusCompanyDetails", root)
            .value =
              company?.company_details || "";
        }
      );
  }

  // ========================================
  // GUARDADO DE CAMPOS COMPLEMENTARIOS
  // ========================================

  function extraPayload(kind) {

    if (kind === "quote") {

      return {
        remission_detail:
          val("salesPlusRemissionDetail")
      };
    }

    if (kind === "odc") {

      return {
        pickup_address:
          val("salesPlusAddress")
      };
    }

    return {
      delivery_address:
        val("salesPlusAddress")
    };
  }

  function resolveResultId(data) {

    const keys = [
      "id",
      "quote_id",
      "remission_id",
      "purchase_order_id",
      "p_quote_id",
      "p_remission_id",
      "p_order_id"
    ];

    if (
      typeof data === "string" &&
      UUID.test(data)
    ) {
      return data;
    }

    if (
      Array.isArray(data) &&
      data.length === 1
    ) {
      return resolveResultId(
        data[0]
      );
    }

    if (
      data &&
      typeof data === "object"
    ) {

      for (const key of keys) {

        if (
          typeof data[key] === "string" &&
          UUID.test(data[key])
        ) {
          return data[key];
        }
      }
    }

    return null;
  }

  async function saved(
    kind,
    rpcData,
    existingId,
    beganAt
  ) {

    const form = document.getElementById(
      configurations[kind].form
    );

    const state =
      form ? memo.get(form) : null;

    const table =
      kind === "quote"
        ? "sales_quotes"
        : kind === "odc"
          ? "sales_purchase_orders"
          : "sales_remissions";

    let documentId =
      existingId ||
      resolveResultId(rpcData);

    // Si la RPC no devolvió el ID, buscamos
    // exclusivamente el documento recién creado
    // por este usuario. Si hay ambigüedad,
    // NO actualizamos un documento al azar.

    if (!documentId) {

      const lowerBound = new Date(
        new Date(beganAt).getTime() - 3000
      ).toISOString();

      let query = db()
        .from(table)
        .select("id,created_at")
        .gte("created_at", lowerBound)
        .order("created_at", {
          ascending: false
        })
        .limit(10);

      if (S().state.user?.email) {
        query = query.eq(
          "created_by_email",
          S().state.user.email
        );
      }

      const identity =
        kind === "quote"
          ? val("salesQClient")
          : kind === "odc"
            ? val("salesOSupplier")
            : val("salesRClient") || null;

      const key =
        kind === "quote"
          ? "client_id"
          : kind === "odc"
            ? "supplier_id"
            : kind === "remission_manual"
              ? "client_id"
              : null;

      if (key && identity) {
        query = query.eq(
          key,
          identity
        );
      }

      const { data, error } =
        await query;

      if (error) {

        throw new Error(
          "Documento guardado, pero no pude " +
          "ubicar su ID: " +
          error.message
        );
      }

      if (data?.length !== 1) {

        throw new Error(
          "El documento principal se guardó, " +
          "pero no se pudo identificar un ID " +
          "único para sus campos adicionales. " +
          "NO vuelvas a guardarlo como nuevo: " +
          "hay que revisar la RPC."
        );
      }

      documentId = data[0].id;
    }

    const payload = extraPayload(
      kind
    );

    const {
      data: updated,
      error
    } = await db()
      .from(table)
      .update(payload)
      .eq("id", documentId)
      .select("id")
      .maybeSingle();

    if (error || !updated) {

      throw new Error(
        "El documento principal se guardó, " +
        "pero no pude asociar sus campos " +
        "adicionales: " +
        (error?.message ||
          "Sin permiso de actualización") +
        ". NO lo vuelvas a crear."
      );
    }

    // Solo limpiamos el borrador cuando
    // todo el documento quedó confirmado.

    if (state?.isNew) {

      state.dispose?.();

      await state.waitForPending?.()
        .catch(() => {});

      await draftDelete(
        state.draftKind
      );
    }

    return documentId;
  }

  window.GGSalesPlus = {
    mount,
    mountCompany,
    saved,
    companyDetails,
    extraPayload
  };

})();
