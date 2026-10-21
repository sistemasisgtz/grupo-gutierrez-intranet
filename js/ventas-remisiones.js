(() => {
"use strict";

let s=null;
let remissions=[];

document.addEventListener("ggsales:ready",async()=>{
    s=window.GGSales;
    renderPanel();
    await loadRemissions();
});

async function loadRemissions(){
    const {data,error}=await s.db
        .from("sales_remissions")
        .select("*")
        .order("remission_date",{ascending:false})
        .order("created_at",{ascending:false});

    if(error){
        s.toast(error.message,true);
        return;
    }

    remissions=data||[];

    renderList();
}

function renderPanel(){
    const host=document.getElementById("salesRemissionsApp");

    if(!host||!s)return;

    host.innerHTML=`
        <div class="sales-section-head">

            <div>
                <span>ENTREGAS · CUMPLIMIENTO</span>
                <h2>Remisiones</h2>
                <p>Remisiones nuevas o derivadas de cotizaciones, con control de cantidades pendientes.</p>
            </div>

            <div class="sales-actions">

                <button class="sales-btn" id="salesRemFormats">
                    Formatos de Remisión
                </button>

                <button class="sales-btn primary" id="salesNewRem">
                    + Nueva remisión
                </button>

            </div>

        </div>

        <div class="sales-toolbar five">

            <input
                id="salesRemSearch"
                type="search"
                placeholder="Buscar folio, cliente, agente..."
            >

            <select id="salesRemStatus">
                <option value="">Todos los estatus</option>
                <option value="active">Activa</option>
                <option value="cancelled">Cancelada</option>
            </select>

            <select id="salesRemAgent">
                <option value="">Todos los agentes</option>
                ${
                    s.state.agents.map(agent=>`
                        <option value="${agent.id}">
                            ${s.escapeHtml(agent.name)}
                        </option>
                    `).join("")
                }
            </select>

            <input id="salesRemFrom" type="date">

            <input id="salesRemTo" type="date">

        </div>

        <div class="sales-surface">

            <div class="sales-surface-head">
                <div>
                    <span>REMISIONES</span>
                    <strong id="salesRemCount">0</strong>
                </div>
            </div>

            <div
                id="salesRemList"
                class="sales-table-wrap"
            >
            </div>

        </div>
    `;

    host.querySelector("#salesRemFormats").onclick=
        ()=>GGSalesCatalogs.openFormats("remission");

    host.querySelector("#salesNewRem").onclick=
        openMode;

    [
        "salesRemSearch",
        "salesRemStatus",
        "salesRemAgent",
        "salesRemFrom",
        "salesRemTo"
    ].forEach(id=>{
        const node=host.querySelector(`#${id}`);
        node.oninput=renderList;
        node.onchange=renderList;
    });

    host.querySelector("#salesRemList").onclick=listClick;

    renderList();
}

function filtered(){
    const search=s.normalize(value("salesRemSearch"));
    const status=value("salesRemStatus");
    const agent=value("salesRemAgent");
    const from=value("salesRemFrom");
    const to=value("salesRemTo");

    return remissions.filter(remission=>{
        if(status&&remission.status!==status)return false;
        if(agent&&remission.agent_id!==agent)return false;
        if(from&&remission.remission_date<from)return false;
        if(to&&remission.remission_date>to)return false;

        if(
            search
            &&
            !s.normalize(`
                ${remission.folio}
                ${remission.client_snapshot?.legal_name||""}
                ${remission.agent_snapshot||""}
                ${remission.created_by_email}
            `).includes(search)
        ){
            return false;
        }

        return true;
    });
}

function renderList(){
    const host=document.getElementById("salesRemList");

    if(!host)return;

    const rows=filtered();

    const count=document.getElementById("salesRemCount");

    if(count){
        count.textContent=
            `${rows.length} remisión${rows.length===1?"":"es"}`;
    }

    host.innerHTML=rows.length
        ?`
            <table class="sales-table">
                <thead>
                    <tr>
                        <th>Folio</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Cotización</th>
                        <th>Agente</th>
                        <th>Usuario</th>
                        <th>Estatus</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows.map(remission=>`
                        <tr>
                            <td><strong>${s.escapeHtml(remission.folio)}</strong></td>
                            <td>${s.date(remission.remission_date)}</td>
                            <td>${s.escapeHtml(remission.client_snapshot?.legal_name||"—")}</td>
                            <td>${s.escapeHtml(remission.source_quote_folio||"Nueva")}</td>
                            <td>${s.escapeHtml(remission.agent_snapshot||"—")}</td>
                            <td>${s.escapeHtml(remission.created_by_email)}</td>
                            <td>
                                <span class="sales-status ${remission.status}">
                                    ${remission.status==="cancelled"?"Cancelada":"Activa"}
                                </span>
                            </td>
                            <td class="actions">
                                <button class="sales-mini" data-r-pdf="${remission.id}">PDF</button>
                                <button class="sales-mini" data-r-edit="${remission.id}">Editar</button>
                                ${
                                    remission.status!=="cancelled"
                                        ?`<button class="sales-mini danger" data-r-cancel="${remission.id}">Cancelar</button>`
                                        :""
                                }
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `
        :`<div class="sales-empty">Sin remisiones.</div>`;
}

async function listClick(event){
    const button=event.target.closest(
        "[data-r-pdf],[data-r-edit],[data-r-cancel]"
    );

    if(!button)return;

    const id=
        button.dataset.rPdf
        ||
        button.dataset.rEdit
        ||
        button.dataset.rCancel;

    const remission=remissions.find(item=>item.id===id);

    if(!remission)return;

    try{
        if(button.dataset.rPdf){
            await GGSalesPDF.remission(id);
            return;
        }

        if(button.dataset.rCancel){
            if(
                confirm(
                    `¿Cancelar ${remission.folio}? Las cantidades volverán a quedar pendientes en la cotización.`
                )
            ){
                const {error}=await s.db.rpc(
                    "sales_set_remission_status",
                    {
                        p_remission_id:id,
                        p_status:"cancelled"
                    }
                );

                if(error)throw error;

                await loadRemissions();

                s.toast("Remisión cancelada.");
            }

            return;
        }

        if(button.dataset.rEdit){
            const {data:items,error}=await s.db
                .from("sales_remission_items")
                .select("*")
                .eq("remission_id",id)
                .order("position");

            if(error)throw error;

            if(remission.source_quote_id){
                await openFromQuote(
                    remission.source_quote_id,
                    remission,
                    items||[]
                );
            }else{
                openStandalone(
                    remission,
                    items||[]
                );
            }
        }

    }catch(error){
        console.error(error);
        s.toast(error.message,true);
    }
}

function openMode(){
    s.openModal({
        title:"Nueva remisión",
        body:`
            <div class="sales-choice">

                <button
                    class="sales-choice-card"
                    id="salesRemNew"
                >
                    <strong>Nueva</strong>
                    <small>Captura una remisión desde cero.</small>
                </button>

                <button
                    class="sales-choice-card"
                    id="salesRemQuote"
                >
                    <strong>Cotización</strong>
                    <small>Jala datos y controla entregas parciales.</small>
                </button>

            </div>
        `,
        onOpen:root=>{
            root.querySelector("#salesRemNew").onclick=
                ()=>openStandalone();

            root.querySelector("#salesRemQuote").onclick=
                openQuoteSelector;
        }
    });
}

async function openQuoteSelector(){
    const {data,error}=await s.db
        .from("sales_quotes")
        .select(
            "id,folio,quote_date,client_snapshot,agent_snapshot,status"
        )
        .neq(
            "status",
            "cancelled"
        )
        .order(
            "quote_date",
            {
                ascending:false
            }
        );

    if(error){
        s.toast(error.message,true);
        return;
    }

    s.openModal({
        title:"Seleccionar cotización",
        wide:true,
        body:`
            <input
                id="salesRQSearch"
                class="sales-modal-search"
                placeholder="Buscar folio o cliente..."
            >

            <div
                id="salesRQList"
                class="sales-list"
            >
            </div>
        `,
        onOpen:root=>{

            const render=()=>{
                const search=s.normalize(
                    root.querySelector("#salesRQSearch").value
                );

                root.querySelector("#salesRQList").innerHTML=
                    (data||[])
                        .filter(
                            quote=>
                                !search
                                ||
                                s.normalize(
                                    `${quote.folio} ${quote.client_snapshot?.legal_name||""}`
                                ).includes(search)
                        )
                        .map(quote=>`
                            <button
                                type="button"
                                class="sales-pick-row"
                                data-rq="${quote.id}"
                            >
                                <strong>${s.escapeHtml(quote.folio)}</strong>
                                <span>${s.escapeHtml(quote.client_snapshot?.legal_name||"")}</span>
                                <em>
                                    ${s.escapeHtml(quote.agent_snapshot||"")}
                                    ·
                                    ${s.date(quote.quote_date)}
                                </em>
                            </button>
                        `)
                        .join("")
                        ||
                        `<div class="sales-empty">Sin cotizaciones.</div>`;
            };

            root.querySelector("#salesRQSearch").oninput=render;

            root.querySelector("#salesRQList").onclick=event=>{
                const button=event.target.closest("[data-rq]");

                if(button){
                    openFromQuote(
                        button.dataset.rq
                    );
                }
            };

            render();
        }
    });
}

async function openFromQuote(
    quoteId,
    existing=null,
    existingItems=[]
){
    const [
        {
            data:quote,
            error:quoteError
        },
        {
            data:fulfillment,
            error:fulfillmentError
        }
    ]=await Promise.all([
        s.db
            .from("sales_quotes")
            .select("*")
            .eq("id",quoteId)
            .single(),

        s.db
            .from("sales_quote_item_fulfillment")
            .select("*")
            .eq("quote_id",quoteId)
            .order("position")
    ]);

    if(
        quoteError
        ||
        fulfillmentError
    ){
        s.toast(
            (quoteError||fulfillmentError).message,
            true
        );

        return;
    }

    const existingMap=new Map(
        existingItems.map(
            item=>[
                item.source_quote_item_id,
                item
            ]
        )
    );

    s.openModal({
        kicker:quote.folio,
        title:existing
            ?`Editar ${existing.folio}`
            :"Remisión desde cotización",
        xwide:true,
        body:`
            <form id="salesRQForm">

                <div class="sales-grid three">

                    <div class="sales-field">
                        <label>Cliente</label>
                        <input
                            readonly
                            value="${s.escapeHtml(quote.client_snapshot?.legal_name||"")}"
                        >
                    </div>

                    <div class="sales-field">
                        <label>Agente</label>
                        <input
                            readonly
                            value="${s.escapeHtml(quote.agent_snapshot||"")}"
                        >
                    </div>

                    <div class="sales-field">
                        <label>Formato *</label>
                        <select id="salesRQFormat" required>
                            ${
                                options(
                                    s.state.formats.filter(
                                        format=>format.document_type==="remission"
                                    ),
                                    "name",
                                    existing?.format_id
                                )
                            }
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Fecha *</label>
                        <input
                            id="salesRQDate"
                            type="date"
                            value="${existing?.remission_date||s.todayISO()}"
                            required
                        >
                    </div>

                    <label class="sales-toggle">
                        <input
                            id="salesRQIva"
                            type="checkbox"
                            ${existing?.iva_enabled===false?"":"checked"}
                        >
                        <span></span>
                        IVA 16%
                    </label>

                </div>

                <div class="sales-table-wrap">

                    <table class="sales-table">

                        <thead>
                            <tr>
                                <th>Clave</th>
                                <th>Descripción</th>
                                <th>Cotizado</th>
                                <th>Ya surtido</th>
                                <th>Pendiente</th>
                                <th>A surtir</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${(fulfillment||[]).map(item=>{

                                const old=existingMap.get(
                                    item.quote_item_id
                                );

                                const max=
                                    Number(item.pending_quantity||0)
                                    +
                                    Number(old?.quantity||0);

                                return `
                                    <tr
                                        data-rq-line="${item.quote_item_id}"
                                        data-product-id="${item.product_id||""}"
                                        data-unit="${s.escapeHtml(item.unit_text||"")}"
                                        data-code="${s.escapeHtml(item.code||"")}"
                                        data-desc="${s.escapeHtml(item.description||"")}"
                                        data-price="${item.unit_price}"
                                        data-currency="${item.currency}"
                                        data-old-id="${old?.id||""}"
                                    >
                                        <td>
                                            <strong>${s.escapeHtml(item.code)}</strong>
                                        </td>

                                        <td class="wrap">
                                            ${s.escapeHtml(item.description)}
                                        </td>

                                        <td>
                                            ${item.quoted_quantity}
                                        </td>

                                        <td>
                                            ${item.delivered_quantity}
                                        </td>

                                        <td>
                                            ${item.pending_quantity}
                                        </td>

                                        <td>
                                            <input
                                                data-rq-qty
                                                class="sales-inline-input"
                                                type="number"
                                                min="0"
                                                max="${max}"
                                                step="0.001"
                                                value="${old?.quantity??0}"
                                            >
                                        </td>
                                    </tr>
                                `;
                            }).join("")}

                        </tbody>

                    </table>

                </div>

                <div id="salesRQMsg" class="sales-form-msg"></div>

            </form>
        `,
        footer:`
            <button class="sales-btn" data-close>
                Cancelar
            </button>

            <button
                class="sales-btn primary"
                form="salesRQForm"
            >
                Guardar remisión
            </button>
        `,
        onOpen:root=>{
            root.querySelector("[data-close]").onclick=s.closeModal;

            root.querySelector("#salesRQForm").onsubmit=event=>
                saveFromQuote(
                    event,
                    quote,
                    existing?.id||null
                );

            GGSalesPlus.mount("remission_quote", {
                base: existing,
                quoteId: quote.id,
                entityId: quote.client_id
            });
        }
    });
}

async function saveFromQuote(event,quote,id){
    event.preventDefault();

    const message=document.getElementById("salesRQMsg");

    const items=[
        ...document.querySelectorAll("[data-rq-line]")
    ]
    .map((row,index)=>({
        id:row.dataset.oldId||null,
        source_quote_item_id:row.dataset.rqLine,
        product_id:row.dataset.productId||null,
        position:index+1,
        quantity:Number(row.querySelector("[data-rq-qty]").value||0),
        unit_text:row.dataset.unit,
        code:row.dataset.code,
        description:row.dataset.desc,
        unit_price:Number(row.dataset.price||0),
        currency:row.dataset.currency
    }))
    .filter(
        item=>item.quantity>0
    );

    if(!items.length){
        message.textContent=
            "Captura al menos una cantidad a surtir.";

        return;
    }

    try{
        const beganAt = new Date().toISOString();
        const {data,error}=await s.db.rpc("sales_save_remission",
            {
                p_remission_id:id,
                p_header:{
                    source_quote_id:quote.id,
                    agent_id:quote.agent_id,
                    product_group_id:quote.product_group_id,
                    price_group_id:quote.price_group_id,
                    format_id:value("salesRQFormat"),
                    client_id:quote.client_id,
                    remission_date:value("salesRQDate"),
                    iva_enabled:document.getElementById("salesRQIva").checked,
                    iva_rate:.16
                },
                p_items:items
            }
        );

        if(error)throw error;

        await GGSalesPlus.saved(
            "remission_quote",
            data,
            id,
            beganAt
        );

        s.closeModal();

        await loadRemissions();

        s.toast("Remisión guardada.");
    }catch(error){
        message.textContent=error.message;
    }
}

/* =========================================================
   REMISIÓN NUEVA DESDE CERO
========================================================= */

function openStandalone(base=null,items=[]){
    s.openModal({
        title:base
            ?`Editar ${base.folio}`
            :"Nueva remisión",
        xwide:true,
        body:`
            <form id="salesRForm">

                <div class="sales-grid three">

                    <div class="sales-field">
                        <label>Agente *</label>
                        <select id="salesRAgent" required>
                            ${options(s.state.agents,"name",base?.agent_id)}
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Grupo productos *</label>
                        <select id="salesRGroup" required>
                            ${options(s.state.productGroups,"name",base?.product_group_id)}
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Grupo precios *</label>
                        <select id="salesRPriceGroup" required></select>
                    </div>

                    <div class="sales-field">
                        <label>Formato *</label>
                        <select id="salesRFormat" required>
                            ${
                                options(
                                    s.state.formats.filter(
                                        format=>format.document_type==="remission"
                                    ),
                                    "name",
                                    base?.format_id
                                )
                            }
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Cliente *</label>
                        <select id="salesRClient" required>
                            ${options(s.state.clients,"legal_name",base?.client_id)}
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Fecha *</label>
                        <input
                            id="salesRDate"
                            type="date"
                            value="${base?.remission_date||s.todayISO()}"
                            required
                        >
                    </div>

                    <label class="sales-toggle">
                        <input
                            id="salesRIva"
                            type="checkbox"
                            ${base?.iva_enabled===false?"":"checked"}
                        >
                        <span></span>
                        IVA 16%
                    </label>

                </div>

                <div class="sales-lines-head">
                    <strong>Partidas</strong>

                    <button
                        type="button"
                        class="sales-btn"
                        id="salesRAdd"
                    >
                        + Partida
                    </button>
                </div>

                <div id="salesRItems"></div>

                <div id="salesRMsg" class="sales-form-msg"></div>

            </form>
        `,
        footer:`
            <button class="sales-btn" data-close>
                Cancelar
            </button>

            <button
                class="sales-btn primary"
                form="salesRForm"
            >
                Guardar remisión
            </button>
        `,
        onOpen:root=>{
            root.querySelector("[data-close]").onclick=s.closeModal;

            root.querySelector("#salesRGroup").onchange=()=>{
                refreshPriceGroups();
            };

            root.querySelector("#salesRAdd").onclick=()=>addStandaloneLine();

            root.querySelector("#salesRItems").onclick=standaloneClick;

            root.querySelector("#salesRItems").addEventListener(
                "input",
                standaloneInput
            );

            root.querySelector("#salesRForm").onsubmit=event=>
                saveStandalone(
                    event,
                    base?.id||null
                );

            refreshPriceGroups(
                base?.price_group_id
            );

            if(items.length){
                items.forEach(addStandaloneLine);
            }else{
                addStandaloneLine();
            }

            GGSalesPlus.mount("remission_manual", {
                base,
                addLine: addStandaloneLine
            });
        }
    });
}

function refreshPriceGroups(selected=""){
    const group=value("salesRGroup");

    const select=document.getElementById("salesRPriceGroup");

    if(!select)return;

    select.innerHTML=options(
        s.state.priceGroups.filter(
            item=>item.product_group_id===group
        ),
        "name",
        selected
    );
}

function addStandaloneLine(item={}){
    const host=document.getElementById("salesRItems");

    host.insertAdjacentHTML(
        "beforeend",
        `
            <div
                class="sales-line"
                data-item-id="${item.id||""}"
                data-product-id="${item.product_id||""}"
            >

                <button
                    type="button"
                    class="sales-icon-btn"
                    data-r-find
                >
                    ⌕
                </button>

                <input
                    data-r-qty
                    type="number"
                    min="0.001"
                    step="0.001"
                    value="${item.quantity??1}"
                    placeholder="Cant."
                >

                <input
                    data-r-unit
                    value="${s.escapeHtml(item.unit_text||"")}"
                    placeholder="Unid."
                >

                <input
                    data-r-code
                    value="${s.escapeHtml(item.code||"")}"
                    placeholder="Clave"
                >

                <textarea
                    data-r-desc
                    rows="2"
                >${s.escapeHtml(item.description||"")}</textarea>

                <input
                    data-r-price
                    type="number"
                    min="0"
                    step="0.01"
                    value="${item.unit_price??""}"
                    placeholder="Precio"
                >

                <input
                    data-r-amount
                    readonly
                >

                <select data-r-currency>
                    <option value="M.N." ${item.currency!=="USD"?"selected":""}>M.N.</option>
                    <option value="USD" ${item.currency==="USD"?"selected":""}>USD</option>
                </select>

                <button
                    type="button"
                    class="sales-icon-btn danger"
                    data-r-remove
                >
                    −
                </button>

            </div>
        `
    );

    calculateStandalone(
        host.lastElementChild
    );
}

function standaloneClick(event){
    const row=event.target.closest(".sales-line");

    if(!row)return;

    if(event.target.closest("[data-r-remove]")){
        if(
            document.querySelectorAll("#salesRItems .sales-line").length>1
        ){
            row.remove();
        }

        return;
    }

    if(event.target.closest("[data-r-find]")){
        lookupStandalone(row);
    }
}

function standaloneInput(event){
    const row=event.target.closest(".sales-line");

    if(row){
        calculateStandalone(row);
    }
}

function calculateStandalone(row){
    row.querySelector("[data-r-amount]").value=
        (
            Number(row.querySelector("[data-r-qty]").value||0)
            *
            Number(row.querySelector("[data-r-price]").value||0)
        ).toFixed(2);
}

function lookupStandalone(
    row
) {


    const group =
        value(
            "salesRGroup"
        );


    const priceGroup =
        value(
            "salesRPriceGroup"
        );


    if (
        !group
    ) {

        s.toast(
            "Selecciona grupo de productos.",
            true
        );

        return;

    }


    const products =
        s.state.products.filter(

            product =>
                product.group_id ===
                group

        );


    s.openNestedModal({

        title:
            "Seleccionar producto",

        wide:
            true,


        body: `

            <input
                id="salesRLookup"
                class="sales-modal-search"
                placeholder="Buscar..."
            >


            <div
                id="salesRLookupRows"
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
                                        "#salesRLookup"
                                    )
                                    .value

                            );


                        layer
                            .querySelector(
                                "#salesRLookupRows"
                            )
                            .innerHTML =

                            products
                                .filter(

                                    product =>

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
                                .map(

                                    product => {


                                        const price =
                                            s.state.prices.find(

                                                item =>

                                                    item.price_group_id ===
                                                    priceGroup

                                                    &&

                                                    item.product_id ===
                                                    product.id

                                            );


                                        return `

                                            <button
                                                class="sales-pick-row"
                                                type="button"
                                                data-r-pick="${product.id}"
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
                                                        price

                                                            ?

                                                            `
                                                                ${
                                                                    s.money(
                                                                        price.unit_price,
                                                                        price.currency
                                                                    )
                                                                }

                                                                ${
                                                                    price.currency
                                                                }
                                                            `

                                                            :

                                                            "Sin precio asignado"
                                                    }

                                                </em>

                                            </button>

                                        `;

                                    }

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
                        "#salesRLookup"
                    )
                    .oninput =
                    render;


                layer
                    .querySelector(
                        "#salesRLookupRows"
                    )
                    .onclick =
                    event => {


                        const button =
                            event.target.closest(
                                "[data-r-pick]"
                            );


                        if (
                            !button
                        ) {

                            return;

                        }


                        const product =
                            s.byId(

                                "products",

                                button.dataset
                                    .rPick

                            );


                        const unit =
                            s.byId(

                                "units",

                                product.unit_id

                            );


                        const price =
                            s.state.prices.find(

                                item =>

                                    item.price_group_id ===
                                    priceGroup

                                    &&

                                    item.product_id ===
                                    product.id

                            );


                        row.dataset.productId =
                            product.id;


                        row
                            .querySelector(
                                "[data-r-unit]"
                            )
                            .value =
                            unit?.abbreviation
                            ||
                            "";


                        row
                            .querySelector(
                                "[data-r-code]"
                            )
                            .value =
                            product.code;


                        row
                            .querySelector(
                                "[data-r-desc]"
                            )
                            .value =
                            product.description;


                        if (
                            price
                        ) {


                            row
                                .querySelector(
                                    "[data-r-price]"
                                )
                                .value =
                                price.unit_price;


                            row
                                .querySelector(
                                    "[data-r-currency]"
                                )
                                .value =
                                price.currency;

                        }


                        calculateStandalone(
                            row
                        );


                        // Cerrar solamente la lupa.

                        s.closeNestedModal(
                            layer
                        );

                    };


                render();

            }

    });

}

async function saveStandalone(event,id){
    event.preventDefault();

    const message=document.getElementById("salesRMsg");

    const items=[
        ...document.querySelectorAll("#salesRItems .sales-line")
    ].map((row,index)=>({
        id:row.dataset.itemId||null,
        source_quote_item_id:null,
        product_id:row.dataset.productId||null,
        position:index+1,
        quantity:Number(row.querySelector("[data-r-qty]").value||0),
        unit_text:row.querySelector("[data-r-unit]").value.trim(),
        code:row.querySelector("[data-r-code]").value.trim(),
        description:row.querySelector("[data-r-desc]").value.trim(),
        unit_price:Number(row.querySelector("[data-r-price]").value||0),
        currency:row.querySelector("[data-r-currency]").value
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
        const beganAt = new Date().toISOString();
        const {data,error}=await s.db.rpc("sales_save_remission",
            {
                p_remission_id:id,
                p_header:{
                    source_quote_id:null,
                    agent_id:value("salesRAgent"),
                    product_group_id:value("salesRGroup"),
                    price_group_id:value("salesRPriceGroup"),
                    format_id:value("salesRFormat"),
                    client_id:value("salesRClient"),
                    remission_date:value("salesRDate"),
                    iva_enabled:document.getElementById("salesRIva").checked,
                    iva_rate:.16
                },
                p_items:items
            }
        );

        if(error)throw error;

        await GGSalesPlus.saved(
            "remission_manual",
            data,
            id,
            beganAt
        );

        s.closeModal();

        await loadRemissions();

        s.toast("Remisión guardada.");
    }catch(error){
        message.textContent=error.message;
    }
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

function value(id){
    return document.getElementById(id)?.value?.trim()||"";
}

})();