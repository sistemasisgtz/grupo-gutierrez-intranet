(() => {
"use strict";

let s=null;
let orders=[];

document.addEventListener("ggsales:ready",async()=>{
    s=window.GGSales;
    renderPanel();
    await loadOrders();
});

async function loadOrders(){
    const {data,error}=await s.db
        .from("sales_purchase_orders")
        .select("*")
        .order("order_date",{ascending:false})
        .order("created_at",{ascending:false});

    if(error){
        s.toast(error.message,true);
        return;
    }

    orders=data||[];
    renderList();
}

function renderPanel(){
    const host=document.getElementById("salesOdcApp");
    if(!host||!s)return;

    host.innerHTML=`
        <div class="sales-section-head">
            <div>
                <span>COMPRAS · ABASTECIMIENTO</span>
                <h2>ODC´s</h2>
                <p>Órdenes de compra con proveedor, empresa emisora, agente y PDF formal.</p>
            </div>

            <div class="sales-actions">
                <button class="sales-btn" id="salesSuppliersBtn">Proveedores</button>
                <button class="sales-btn" id="salesSupplierProductsBtn">Productos proveedor</button>
                <button class="sales-btn primary" id="salesNewOdcBtn">+ Nueva ODC</button>
            </div>
        </div>

        <div class="sales-toolbar five">
            <input id="salesOdcSearch" type="search" placeholder="Buscar folio, proveedor, usuario...">

            <select id="salesOdcStatus">
                <option value="">Todos los estatus</option>
                <option value="pending">Pendiente</option>
                <option value="supplied">Surtida</option>
                <option value="cancelled">Cancelada</option>
            </select>

            <select id="salesOdcAgent">
                <option value="">Todos los agentes</option>
                ${s.state.agents.map(a=>`<option value="${a.id}">${s.escapeHtml(a.name)}</option>`).join("")}
            </select>

            <input id="salesOdcFrom" type="date">
            <input id="salesOdcTo" type="date">
        </div>

        <div class="sales-surface">
            <div class="sales-surface-head">
                <div>
                    <span>ÓRDENES</span>
                    <strong id="salesOdcCount">0</strong>
                </div>
            </div>

            <div id="salesOdcList" class="sales-table-wrap"></div>
        </div>
    `;

    host.querySelector("#salesSuppliersBtn").onclick=openSuppliers;
    host.querySelector("#salesSupplierProductsBtn").onclick=openSupplierProducts;
    host.querySelector("#salesNewOdcBtn").onclick=()=>openOrderForm();

    [
        "salesOdcSearch",
        "salesOdcStatus",
        "salesOdcAgent",
        "salesOdcFrom",
        "salesOdcTo"
    ].forEach(id=>{
        const node=host.querySelector(`#${id}`);
        node.oninput=renderList;
        node.onchange=renderList;
    });

    host.querySelector("#salesOdcList").onclick=listClick;

    renderList();
}

function filtered(){
    const search=s.normalize(value("salesOdcSearch"));
    const status=value("salesOdcStatus");
    const agent=value("salesOdcAgent");
    const from=value("salesOdcFrom");
    const to=value("salesOdcTo");

    return orders.filter(order=>{
        if(status&&order.status!==status)return false;
        if(agent&&order.agent_id!==agent)return false;
        if(from&&order.order_date<from)return false;
        if(to&&order.order_date>to)return false;

        if(
            search
            &&
            !s.normalize(`
                ${order.folio}
                ${order.supplier_snapshot?.legal_name||""}
                ${order.agent_snapshot||""}
                ${order.created_by_email}
            `).includes(search)
        ){
            return false;
        }

        return true;
    });
}

function renderList(){
    const host=document.getElementById("salesOdcList");
    if(!host)return;

    const rows=filtered();

    const count=document.getElementById("salesOdcCount");

    if(count){
        count.textContent=
            `${rows.length} orden${rows.length===1?"":"es"}`;
    }

    host.innerHTML=rows.length
        ?`
        <table class="sales-table">
            <thead>
                <tr>
                    <th>Folio</th>
                    <th>Fecha</th>
                    <th>Proveedor</th>
                    <th>Empresa</th>
                    <th>Agente</th>
                    <th>Usuario</th>
                    <th>Estatus</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody>
                ${rows.map(order=>`
                    <tr>
                        <td><strong>${s.escapeHtml(order.folio)}</strong></td>
                        <td>${s.date(order.order_date)}</td>
                        <td>${s.escapeHtml(order.supplier_snapshot?.legal_name||"—")}</td>
                        <td>${s.escapeHtml(order.company_snapshot?.name||"—")}</td>
                        <td>${s.escapeHtml(order.agent_snapshot||"—")}</td>
                        <td>${s.escapeHtml(order.created_by_email)}</td>
                        <td>
                            <span class="sales-status ${order.status}">
                                ${statusLabel(order.status)}
                            </span>
                        </td>
                        <td class="actions">
                            <button class="sales-mini" data-o-pdf="${order.id}">PDF</button>
                            <button class="sales-mini" data-o-edit="${order.id}">Editar</button>
                            <button class="sales-mini" data-o-status="${order.id}">Estatus</button>
                            ${
                                order.status!=="cancelled"
                                    ?`<button class="sales-mini danger" data-o-cancel="${order.id}">Cancelar</button>`
                                    :""
                            }
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
        `
        :`<div class="sales-empty">Sin órdenes.</div>`;
}

async function listClick(event){
    const button=event.target.closest(
        "[data-o-pdf],[data-o-edit],[data-o-status],[data-o-cancel]"
    );

    if(!button)return;

    const id=
        button.dataset.oPdf
        ||
        button.dataset.oEdit
        ||
        button.dataset.oStatus
        ||
        button.dataset.oCancel;

    const order=orders.find(item=>item.id===id);

    if(!order)return;

    try{
        if(button.dataset.oPdf){
            await GGSalesPDF.purchaseOrder(id);
            return;
        }

        if(button.dataset.oEdit){
            const items=await fetchItems(id);
            openOrderForm(order,items);
            return;
        }

        if(button.dataset.oStatus){
            openStatus(order);
            return;
        }

        if(button.dataset.oCancel){
            if(confirm(`¿Cancelar ${order.folio}?`)){
                await setStatus(id,"cancelled");
            }
        }
    }catch(error){
        s.toast(error.message,true);
    }
}

async function fetchItems(id){
    const {data,error}=await s.db
        .from("sales_purchase_order_items")
        .select("*")
        .eq("purchase_order_id",id)
        .order("position");

    if(error)throw error;

    return data||[];
}

function openStatus(order){
    s.openModal({
        kicker:order.folio,
        title:"Estatus ODC",
        body:`
            <div class="sales-field">
                <label>Estatus</label>

                <select id="salesOrderStatus">

                    <option
                        value="pending"
                        ${order.status==="pending"?"selected":""}
                    >
                        Pendiente
                    </option>

                    <option
                        value="supplied"
                        ${order.status==="supplied"?"selected":""}
                    >
                        Surtida
                    </option>

                    <option
                        value="cancelled"
                        ${order.status==="cancelled"?"selected":""}
                    >
                        Cancelada
                    </option>

                </select>
            </div>
        `,
        footer:`
            <button class="sales-btn" data-close>Cancelar</button>
            <button class="sales-btn primary" data-save>Guardar</button>
        `,
        onOpen:root=>{
            root.querySelector("[data-close]").onclick=s.closeModal;

            root.querySelector("[data-save]").onclick=async()=>{
                await setStatus(
                    order.id,
                    value("salesOrderStatus")
                );

                s.closeModal();
            };
        }
    });
}

async function setStatus(id,status){
    const {error}=await s.db.rpc(
        "sales_set_purchase_order_status",
        {
            p_order_id:id,
            p_status:status
        }
    );

    if(error)throw error;

    await loadOrders();

    s.toast("Estatus actualizado.");
}

function openSuppliers(){
    s.openModal({
        title:"Proveedores",
        xwide:true,
        body:`
            <form id="salesSupplierForm">

                <input
                    type="hidden"
                    id="salesSupplierId"
                >

                <div class="sales-grid three">

                    ${field("Razón social *","salesSupplierName",true)}
                    ${field("RFC","salesSupplierRfc")}
                    ${field("Dirección","salesSupplierAddress")}
                    ${field("Correo","salesSupplierEmail")}
                    ${field("Teléfono","salesSupplierPhone")}
                    ${field("Contacto","salesSupplierContact")}
                    ${field("Puesto contacto","salesSupplierContactTitle")}
                    ${field("Teléfono contacto","salesSupplierContactPhone")}
                    ${field("Correo contacto","salesSupplierContactEmail")}

                </div>

                <div id="salesSupplierMsg" class="sales-form-msg"></div>

                <button class="sales-btn primary">
                    Guardar proveedor
                </button>

            </form>

            <div id="salesSupplierList" class="sales-list">
                ${
                    s.state.suppliers.map(supplier=>`
                        <article class="sales-list-row">

                            <div>
                                <strong>${s.escapeHtml(supplier.legal_name)}</strong>
                                <small>
                                    ${s.escapeHtml(supplier.rfc||"Sin RFC")}
                                    ·
                                    ${s.escapeHtml(supplier.email||"Sin correo")}
                                </small>
                            </div>

                            <div>
                                <button class="sales-mini" data-supplier-edit="${supplier.id}">Editar</button>
                                <button class="sales-mini danger" data-supplier-del="${supplier.id}">Eliminar</button>
                            </div>

                        </article>
                    `).join("")
                    ||
                    `<div class="sales-empty">Sin proveedores.</div>`
                }
            </div>
        `,
        onOpen:root=>{
            root.querySelector("#salesSupplierForm").onsubmit=saveSupplier;
            root.querySelector("#salesSupplierList").onclick=supplierListClick;
        }
    });
}

async function saveSupplier(event){
    event.preventDefault();

    const message=document.getElementById("salesSupplierMsg");

    try{
        const id=value("salesSupplierId");

        const payload={
            legal_name:value("salesSupplierName"),
            rfc:nullable(value("salesSupplierRfc")),
            address:nullable(value("salesSupplierAddress")),
            email:nullable(value("salesSupplierEmail")),
            phone:nullable(value("salesSupplierPhone")),
            contact_name:nullable(value("salesSupplierContact")),
            contact_title:nullable(value("salesSupplierContactTitle")),
            contact_phone:nullable(value("salesSupplierContactPhone")),
            contact_email:nullable(value("salesSupplierContactEmail"))
        };

        const query=id
            ?s.db.from("sales_suppliers").update(payload).eq("id",id)
            :s.db.from("sales_suppliers").insert(payload);

        const {error}=await query;

        if(error)throw error;

        await s.reload("suppliers");

        s.toast("Proveedor guardado.");

        openSuppliers();
    }catch(error){
        message.textContent=error.message;
    }
}

function supplierListClick(event){
    const edit=event.target.closest("[data-supplier-edit]");
    const remove=event.target.closest("[data-supplier-del]");

    if(edit){
        const supplier=s.byId("suppliers",edit.dataset.supplierEdit);

        [
            ["salesSupplierId","id"],
            ["salesSupplierName","legal_name"],
            ["salesSupplierRfc","rfc"],
            ["salesSupplierAddress","address"],
            ["salesSupplierEmail","email"],
            ["salesSupplierPhone","phone"],
            ["salesSupplierContact","contact_name"],
            ["salesSupplierContactTitle","contact_title"],
            ["salesSupplierContactPhone","contact_phone"],
            ["salesSupplierContactEmail","contact_email"]
        ].forEach(([id,key])=>{
            set(id,supplier[key]);
        });
    }

    if(remove){
        archive(
            "sales_suppliers",
            remove.dataset.supplierDel,
            "suppliers",
            openSuppliers
        );
    }
}

function openSupplierProducts(){
    s.openModal({
        title:"Productos de proveedor",
        xwide:true,
        body:`
            <form id="salesSupplierProductForm">

                <input
                    type="hidden"
                    id="salesSupplierProductId"
                >

                <div class="sales-grid three">

                    <div class="sales-field">
                        <label>Proveedor *</label>
                        <select id="salesSPProvider" required>
                            ${options(s.state.suppliers,"legal_name")}
                        </select>
                    </div>

                    ${field("Clave *","salesSPCode",true)}

                    <div class="sales-field">
                        <label>Precio *</label>
                        <input
                            id="salesSPPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            required
                        >
                    </div>

                    <div class="sales-field">
                        <label>Moneda</label>
                        <select id="salesSPCurrency">
                            <option>M.N.</option>
                            <option>USD</option>
                        </select>
                    </div>

                    <div class="sales-field full">
                        <label>Descripción *</label>
                        <textarea
                            id="salesSPDescription"
                            rows="5"
                            required
                        ></textarea>
                    </div>

                </div>

                <div id="salesSPMsg" class="sales-form-msg"></div>

                <button class="sales-btn primary">
                    Guardar producto
                </button>

            </form>

            <div id="salesSPList" class="sales-list">

                ${
                    s.state.supplierProducts.map(product=>`
                        <article class="sales-list-row">

                            <div>
                                <strong>
                                    ${s.escapeHtml(product.code)}
                                    ·
                                    ${s.escapeHtml(product.description)}
                                </strong>

                                <small>
                                    ${s.escapeHtml(s.byId("suppliers",product.supplier_id)?.legal_name||"")}
                                    ·
                                    ${s.money(product.unit_price,product.currency)}
                                    ${product.currency}
                                </small>
                            </div>

                            <div>
                                <button class="sales-mini" data-sp-edit="${product.id}">Editar</button>
                                <button class="sales-mini danger" data-sp-del="${product.id}">Eliminar</button>
                            </div>

                        </article>
                    `).join("")
                    ||
                    `<div class="sales-empty">Sin productos.</div>`
                }

            </div>
        `,
        onOpen:root=>{
            root.querySelector("#salesSupplierProductForm").onsubmit=saveSupplierProduct;
            root.querySelector("#salesSPList").onclick=supplierProductListClick;
        }
    });
}

async function saveSupplierProduct(event){
    event.preventDefault();

    const message=document.getElementById("salesSPMsg");

    try{
        const id=value("salesSupplierProductId");

        const payload={
            supplier_id:value("salesSPProvider"),
            code:value("salesSPCode"),
            description:document.getElementById("salesSPDescription").value.trim(),
            unit_price:Number(value("salesSPPrice")),
            currency:value("salesSPCurrency")
        };

        const query=id
            ?s.db.from("sales_supplier_products").update(payload).eq("id",id)
            :s.db.from("sales_supplier_products").insert(payload);

        const {error}=await query;

        if(error)throw error;

        await s.reload("supplierProducts");

        s.toast("Producto guardado.");

        openSupplierProducts();
    }catch(error){
        message.textContent=error.message;
    }
}

function supplierProductListClick(event){
    const edit=event.target.closest("[data-sp-edit]");
    const remove=event.target.closest("[data-sp-del]");

    if(edit){
        const product=s.byId(
            "supplierProducts",
            edit.dataset.spEdit
        );

        set("salesSupplierProductId",product.id);
        set("salesSPProvider",product.supplier_id);
        set("salesSPCode",product.code);
        set("salesSPPrice",product.unit_price);
        set("salesSPCurrency",product.currency);

        document.getElementById("salesSPDescription").value=
            product.description;
    }

    if(remove){
        archive(
            "sales_supplier_products",
            remove.dataset.spDel,
            "supplierProducts",
            openSupplierProducts
        );
    }
}

function openOrderForm(base=null,items=[]){
    s.openModal({
        title:base?`Editar ${base.folio}`:"Nueva ODC",
        xwide:true,
        body:`
            <form id="salesOrderForm">

                <div class="sales-grid three">

                    <div class="sales-field">
                        <label>Agente *</label>
                        <select id="salesOAgent" required>
                            ${options(s.state.agents,"name",base?.agent_id)}
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Empresa emisora *</label>
                        <select id="salesOCompany" required>
                            ${options(s.state.companies,"name",base?.company_id)}
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Proveedor *</label>
                        <select id="salesOSupplier" required>
                            ${options(s.state.suppliers,"legal_name",base?.supplier_id)}
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Fecha *</label>
                        <input
                            id="salesODate"
                            type="date"
                            required
                            value="${base?.order_date||s.todayISO()}"
                        >
                    </div>

                    <div class="sales-field">
                        <label>Folio</label>
                        <input
                            readonly
                            value="${base?s.escapeHtml(base.folio):"ODC-AUTOMÁTICO"}"
                        >
                    </div>

                </div>

                <div class="sales-lines-head">
                    <div>
                        <strong>Partidas</strong>
                        <small>Lupa: buscar por nombre, clave o proveedor.</small>
                    </div>

                    <button
                        type="button"
                        class="sales-btn"
                        id="salesOAddLine"
                    >
                        + Partida
                    </button>
                </div>

                <div id="salesOItems"></div>

                <div class="sales-field">
                    <label>Instrucciones</label>

                    <textarea
                        id="salesOInstructions"
                        rows="6"
                    >${s.escapeHtml(base?.instructions||"")}</textarea>
                </div>

                <div id="salesOMsg" class="sales-form-msg"></div>

            </form>
        `,
        footer:`
            <button class="sales-btn" data-close>
                Cancelar
            </button>

            <button
                class="sales-btn primary"
                form="salesOrderForm"
            >
                Guardar ODC
            </button>
        `,
        onOpen:root=>{
            root.querySelector("[data-close]").onclick=s.closeModal;

            root.querySelector("#salesOAddLine").onclick=()=>addOrderLine();

            root.querySelector("#salesOItems").onclick=orderLineClick;

            root.querySelector("#salesOItems").addEventListener(
                "input",
                orderLineInput
            );

            root.querySelector("#salesOrderForm").onsubmit=event=>
                saveOrder(
                    event,
                    base?.id||null
                );

            if(items.length){
                items.forEach(addOrderLine);
            }else{
                addOrderLine();
            }
        }
    });
}

function addOrderLine(item={}){
    const host=document.getElementById("salesOItems");

    host.insertAdjacentHTML(
        "beforeend",
        `
            <div
                class="sales-line odc"
                data-item-id="${item.id||""}"
                data-product-id="${item.product_id||""}"
            >

                <button
                    type="button"
                    class="sales-icon-btn"
                    data-o-find
                >
                    ⌕
                </button>

                <input
                    data-o-qty
                    type="number"
                    min="0.001"
                    step="0.001"
                    value="${item.quantity??1}"
                    placeholder="Cant."
                >

                <input
                    data-o-code
                    value="${s.escapeHtml(item.code||"")}"
                    placeholder="Clave"
                >

                <textarea
                    data-o-desc
                    rows="2"
                    placeholder="Descripción"
                >${s.escapeHtml(item.description||"")}</textarea>

                <input
                    data-o-price
                    type="number"
                    min="0"
                    step="0.01"
                    value="${item.unit_price??""}"
                    placeholder="Precio"
                >

                <input
                    data-o-amount
                    readonly
                >

                <select data-o-currency>
                    <option value="M.N." ${item.currency!=="USD"?"selected":""}>M.N.</option>
                    <option value="USD" ${item.currency==="USD"?"selected":""}>USD</option>
                </select>

                <button
                    type="button"
                    class="sales-icon-btn danger"
                    data-o-remove
                >
                    −
                </button>

            </div>
        `
    );

    calculateOrderLine(
        host.lastElementChild
    );
}

function orderLineClick(event){
    const row=event.target.closest(".sales-line");

    if(!row)return;

    if(event.target.closest("[data-o-remove]")){
        if(
            document.querySelectorAll("#salesOItems .sales-line").length>1
        ){
            row.remove();
        }

        return;
    }

    if(event.target.closest("[data-o-find]")){
        openSupplierProductLookup(row);
    }
}

function orderLineInput(event){
    const row=event.target.closest(".sales-line");

    if(row){
        calculateOrderLine(row);
    }
}

function calculateOrderLine(row){
    row.querySelector("[data-o-amount]").value=
        (
            Number(row.querySelector("[data-o-qty]").value||0)
            *
            Number(row.querySelector("[data-o-price]").value||0)
        ).toFixed(2);
}

function openSupplierProductLookup(
    row
) {


    const selectedSupplier =
        value(
            "salesOSupplier"
        );


    s.openNestedModal({

        title:
            "Seleccionar producto",

        wide:
            true,


        body: `

            <div class="sales-toolbar two">


                <input
                    id="salesOPSearch"
                    type="search"
                    placeholder="Buscar clave o descripción..."
                >


                <select id="salesOPSupplier">

                    <option value="">
                        Todos los proveedores
                    </option>

                    ${
                        s.state.suppliers
                            .map(
                                supplier => `

                                    <option
                                        value="${supplier.id}"
                                        ${
                                            supplier.id ===
                                            selectedSupplier

                                                ?

                                                "selected"

                                                :

                                                ""
                                        }
                                    >

                                        ${
                                            s.escapeHtml(
                                                supplier.legal_name
                                            )
                                        }

                                    </option>

                                `
                            )
                            .join(
                                ""
                            )
                    }

                </select>


            </div>


            <div
                id="salesOPRows"
                class="sales-list"
            >
            </div>

        `,


        onOpen:
            layer => {


                const render =
                    () => {


                        const search =
                            s.normalize(

                                layer
                                    .querySelector(
                                        "#salesOPSearch"
                                    )
                                    .value

                            );


                        const supplier =
                            layer
                                .querySelector(
                                    "#salesOPSupplier"
                                )
                                .value;


                        layer
                            .querySelector(
                                "#salesOPRows"
                            )
                            .innerHTML =

                            s.state.supplierProducts
                                .filter(

                                    product =>

                                        (
                                            !supplier

                                            ||

                                            product.supplier_id ===
                                            supplier
                                        )

                                        &&

                                        (
                                            !search

                                            ||

                                            s.normalize(

                                                `
                                                    ${product.code}
                                                    ${product.description}
                                                `

                                            )
                                            .includes(
                                                search
                                            )
                                        )

                                )
                                .map(

                                    product => `

                                        <button
                                            type="button"
                                            class="sales-pick-row"
                                            data-op-pick="${product.id}"
                                        >

                                            <strong>
                                                ${
                                                    s.escapeHtml(
                                                        product.code
                                                    )
                                                }
                                            </strong>


                                            <span>
                                                ${
                                                    s.escapeHtml(
                                                        product.description
                                                    )
                                                }
                                            </span>


                                            <em>

                                                ${
                                                    s.escapeHtml(

                                                        s.byId(
                                                            "suppliers",
                                                            product.supplier_id
                                                        )
                                                        ?.legal_name
                                                        ||
                                                        ""

                                                    )
                                                }

                                                ·

                                                ${
                                                    s.money(
                                                        product.unit_price,
                                                        product.currency
                                                    )
                                                }

                                                ${
                                                    product.currency
                                                }

                                            </em>

                                        </button>

                                    `
                                )
                                .join(
                                    ""
                                )

                            ||

                            `
                                <div class="sales-empty">
                                    Sin resultados.
                                </div>
                            `;

                    };


                layer
                    .querySelector(
                        "#salesOPSearch"
                    )
                    .oninput =
                    render;


                layer
                    .querySelector(
                        "#salesOPSupplier"
                    )
                    .onchange =
                    render;


                layer
                    .querySelector(
                        "#salesOPRows"
                    )
                    .onclick =
                    event => {


                        const button =
                            event.target.closest(
                                "[data-op-pick]"
                            );


                        if (
                            !button
                        ) {

                            return;

                        }


                        const product =
                            s.byId(

                                "supplierProducts",

                                button.dataset
                                    .opPick

                            );


                        // Al seleccionar producto,
                        // sincronizamos proveedor también.

                        document
                            .getElementById(
                                "salesOSupplier"
                            )
                            .value =
                            product.supplier_id;


                        row.dataset.productId =
                            product.id;


                        row
                            .querySelector(
                                "[data-o-code]"
                            )
                            .value =
                            product.code;


                        row
                            .querySelector(
                                "[data-o-desc]"
                            )
                            .value =
                            product.description;


                        row
                            .querySelector(
                                "[data-o-price]"
                            )
                            .value =
                            product.unit_price;


                        row
                            .querySelector(
                                "[data-o-currency]"
                            )
                            .value =
                            product.currency;


                        calculateOrderLine(
                            row
                        );


                        // Solo cerramos el selector.

                        s.closeNestedModal(
                            layer
                        );

                    };


                render();

            }

    });

}

async function saveOrder(event,id){
    event.preventDefault();

    const message=document.getElementById("salesOMsg");

    const items=[
        ...document.querySelectorAll("#salesOItems .sales-line")
    ].map((row,index)=>({
        id:row.dataset.itemId||null,
        product_id:row.dataset.productId||null,
        position:index+1,
        quantity:Number(row.querySelector("[data-o-qty]").value||0),
        code:row.querySelector("[data-o-code]").value.trim(),
        description:row.querySelector("[data-o-desc]").value.trim(),
        unit_price:Number(row.querySelector("[data-o-price]").value||0),
        currency:row.querySelector("[data-o-currency]").value
    }));

    if(
        items.some(
            item=>
                item.quantity<=0
                ||
                !item.description
        )
    ){
        message.textContent="Revisa las partidas.";
        return;
    }

    try{
        const {error}=await s.db.rpc(
            "sales_save_purchase_order",
            {
                p_order_id:id,
                p_header:{
                    agent_id:value("salesOAgent"),
                    company_id:value("salesOCompany"),
                    supplier_id:value("salesOSupplier"),
                    order_date:value("salesODate"),
                    instructions:document.getElementById("salesOInstructions").value.trim()
                },
                p_items:items
            }
        );

        if(error)throw error;

        s.closeModal();

        await loadOrders();

        s.toast("ODC guardada.");
    }catch(error){
        message.textContent=error.message;
    }
}

async function archive(table,id,stateKey,callback){
    if(!confirm("¿Eliminar este registro?"))return;

    try{
        const {error}=await s.db
            .from(table)
            .update({active:false})
            .eq("id",id);

        if(error)throw error;

        await s.reload(stateKey);

        s.toast("Eliminado.");

        callback();
    }catch(error){
        s.toast(error.message,true);
    }
}

function field(label,id,required=false){
    return `
        <div class="sales-field">
            <label>${label}</label>
            <input id="${id}" ${required?"required":""}>
        </div>
    `;
}

function options(rows,label,selected=""){
    return `
        <option value="">Selecciona...</option>
        ${
            rows.map(row=>`
                <option
                    value="${row.id}"
                    ${row.id===selected?"selected":""}
                >
                    ${s.escapeHtml(row[label])}
                </option>
            `).join("")
        }
    `;
}

function statusLabel(status){
    return ({
        pending:"Pendiente",
        supplied:"Surtida",
        cancelled:"Cancelada"
    })[status]||status;
}

function value(id){
    return document.getElementById(id)?.value?.trim()||"";
}

function nullable(value){
    return value||null;
}

function set(id,value){
    const node=document.getElementById(id);
    if(node)node.value=value??"";
}

})();