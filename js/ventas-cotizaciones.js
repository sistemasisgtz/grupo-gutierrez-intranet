(() => {

"use strict";

let s=null;
let quotes=[];

document.addEventListener(
    "ggsales:ready",
    async ()=>{
        s=window.GGSales;
        renderPanel();
        await loadQuotes();
    }
);

async function loadQuotes(){
    const {
        data,
        error
    }=await s.db
        .from("sales_quotes")
        .select("*")
        .order(
            "quote_date",
            {
                ascending:false
            }
        )
        .order(
            "created_at",
            {
                ascending:false
            }
        );

    if(error){
        s.toast(error.message,true);
        return;
    }

    quotes=data||[];

    renderList();
}

function renderPanel(){
    const host=document.getElementById("salesQuotesApp");

    if(!host||!s)return;

    host.innerHTML=`
        <div class="sales-section-head">

            <div>
                <span>INGRESOS · PROPUESTAS</span>
                <h2>Cotizaciones</h2>
                <p>Genera, edita, copia, autoriza y descarga cotizaciones comerciales.</p>
            </div>

            <div class="sales-actions">
                <button class="sales-btn" id="salesClientsBtn">Clientes</button>
                <button class="sales-btn" id="salesAgentsBtn">Agentes</button>
                <button class="sales-btn" id="salesCompaniesBtn">Empresas</button>
                <button class="sales-btn" id="salesQuoteFormatsBtn">Formatos</button>
                <button class="sales-btn" id="salesCancelledBtn">Canceladas</button>
                <button class="sales-btn primary" id="salesNewQuoteBtn">+ Nueva cotización</button>
            </div>

        </div>

        <div class="sales-toolbar six">

            <input
                id="salesQuoteSearch"
                type="search"
                placeholder="Buscar folio, cliente, agente, usuario..."
            >

            <select id="salesQuoteAgentFilter">
                <option value="">Todos los agentes</option>
                ${
                    s.state.agents.map(agent=>`
                        <option value="${agent.id}">
                            ${s.escapeHtml(agent.name)}
                        </option>
                    `).join("")
                }
            </select>

<select id="salesQuoteStatusFilter">
    <option value="">Todos los estatus</option>
    <option value="pending">Pendiente</option>
    <option value="remissioned">Remisionado</option>
    <option value="cancelled">Cancelada</option>
</select>

            <select id="salesQuoteClientFilter">
                <option value="">Todos los clientes</option>
                ${
                    s.state.clients.map(client=>`
                        <option value="${client.id}">
                            ${s.escapeHtml(client.legal_name)}
                        </option>
                    `).join("")
                }
            </select>

            <input id="salesQuoteFrom" type="date">

            <input id="salesQuoteTo" type="date">

        </div>

        <div class="sales-surface">

            <div class="sales-surface-head">
                <div>
                    <span>CONCENTRADO</span>
                    <strong id="salesQuoteCount">0 cotizaciones</strong>
                </div>
            </div>

            <div
                id="salesQuoteList"
                class="sales-table-wrap"
            >
            </div>

        </div>
    `;

    host.querySelector("#salesClientsBtn").onclick=
        ()=>GGSalesCatalogs.openClients();

    host.querySelector("#salesAgentsBtn").onclick=
        ()=>GGSalesCatalogs.openAgents();

    host.querySelector("#salesCompaniesBtn").onclick=
        ()=>GGSalesCatalogs.openCompanies();

    host.querySelector("#salesQuoteFormatsBtn").onclick=
        ()=>GGSalesCatalogs.openFormats("quote");

    host.querySelector("#salesCancelledBtn").onclick=
        openCancelled;

    host.querySelector("#salesNewQuoteBtn").onclick=
        ()=>openQuoteForm();

    [
        "salesQuoteSearch",
        "salesQuoteAgentFilter",
        "salesQuoteStatusFilter",
        "salesQuoteClientFilter",
        "salesQuoteFrom",
        "salesQuoteTo"
    ].forEach(id=>{
        const node=host.querySelector(`#${id}`);
        node.oninput=renderList;
        node.onchange=renderList;
    });

    host.querySelector("#salesQuoteList").onclick=listClick;

    renderList();
}

function filtered(){
    const search=s.normalize(value("salesQuoteSearch"));
    const agent=value("salesQuoteAgentFilter");
    const status=value("salesQuoteStatusFilter");
    const client=value("salesQuoteClientFilter");
    const from=value("salesQuoteFrom");
    const to=value("salesQuoteTo");

    return quotes.filter(quote=>{

        if(
            agent
            &&
            quote.agent_id!==agent
        ){
            return false;
        }

if (
    status &&
    quoteDisplayStatus(quote) !== status
) {
    return false;
}

        if(
            client
            &&
            quote.client_id!==client
        ){
            return false;
        }

        if(
            from
            &&
            quote.quote_date<from
        ){
            return false;
        }

        if(
            to
            &&
            quote.quote_date>to
        ){
            return false;
        }

        if(search){
            const haystack=s.normalize(
                `
                    ${quote.folio}
                    ${quote.agent_snapshot}
                    ${quote.client_snapshot?.legal_name||""}
                    ${quote.created_by_email}
                `
            );

            if(!haystack.includes(search)){
                return false;
            }
        }

        return true;
    });
}

function renderList(){
    const host=document.getElementById("salesQuoteList");
    if(!host)return;

    const rows=filtered();

    const count=document.getElementById("salesQuoteCount");

    if(count){
        count.textContent=
            `${rows.length} cotización${rows.length===1?"":"es"}`;
    }

    host.innerHTML=rows.length
        ?`
        <table class="sales-table">

            <thead>
                <tr>
                    <th>Folio</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Agente</th>
                    <th>Usuario</th>
                    <th>Estatus</th>
                    <th>Total</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody>

                ${rows.map(quote=>`
                    <tr>

                        <td>
                            <strong>
                                ${s.escapeHtml(quote.folio)}
                            </strong>
                        </td>

                        <td>
                            ${s.date(quote.quote_date)}
                        </td>

                        <td>
                            ${s.escapeHtml(quote.client_snapshot?.legal_name||"—")}
                        </td>

                        <td>
                            ${s.escapeHtml(quote.agent_snapshot||"—")}
                        </td>

                        <td>
                            ${s.escapeHtml(quote.created_by_email)}
                        </td>

                        <td>
                            <span class="sales-status ${quoteDisplayStatus(quote)}">
    ${statusLabel(quoteDisplayStatus(quote))}
</span>
                        </td>

                        <td class="money">
                            ${totalsSummary(quote.totals)}
                        </td>

                        <td class="actions">

                            <button
                                class="sales-mini"
                                data-q-pdf="${quote.id}"
                            >
                                PDF
                            </button>

                            <button
                                class="sales-mini"
                                data-q-edit="${quote.id}"
                            >
                                Editar
                            </button>

                            <button
                                class="sales-mini"
                                data-q-copy="${quote.id}"
                            >
                                Copiar
                            </button>


                            ${
                                quote.status!=="cancelled"

                                    ?

                                    `
                                        <button
                                            class="sales-mini danger"
                                            data-q-cancel="${quote.id}"
                                        >
                                            Cancelar
                                        </button>
                                    `

                                    :

                                    `
                                        <button
                                            class="sales-mini danger"
                                            data-q-delete="${quote.id}"
                                        >
                                            Eliminar
                                        </button>
                                    `
                            }

                        </td>

                    </tr>
                `).join("")}

            </tbody>

        </table>
        `
        :
        `
            <div class="sales-empty">
                No hay cotizaciones con estos filtros.
            </div>
        `;
}

async function listClick(event){
    const button=event.target.closest(
        `
            [data-q-pdf],
            [data-q-edit],
            [data-q-copy],
            [data-q-status],
            [data-q-cancel],
            [data-q-delete]
        `
    );

    if(!button)return;

    const id=
        button.dataset.qPdf
        ||
        button.dataset.qEdit
        ||
        button.dataset.qCopy
        ||
        button.dataset.qStatus
        ||
        button.dataset.qCancel
        ||
        button.dataset.qDelete;

    const quote=quotes.find(item=>item.id===id);

    if(!quote)return;

    try{

        if(button.dataset.qPdf){
            await GGSalesPDF.quote(id);
            return;
        }

        if(button.dataset.qEdit){
            const items=await fetchItems(id);

            openQuoteForm(
                quote,
                items,
                false
            );

            return;
        }

        if(button.dataset.qCopy){
            const items=await fetchItems(id);

            openQuoteForm(
                quote,
                items,
                true
            );

            return;
        }

        if(button.dataset.qStatus){
            openStatus(quote);
            return;
        }

        if(button.dataset.qCancel){
            if(
                confirm(
                    `¿Cancelar ${quote.folio}?`
                )
            ){
                await updateStatus(
                    id,
                    "cancelled"
                );
            }

            return;
        }

        if(button.dataset.qDelete){
            if(
                confirm(
                    `¿Eliminar ${quote.folio}? Quedará en el registro de Canceladas sin PDF.`
                )
            ){
                const {
                    error
                }=await s.db.rpc(
                    "sales_delete_quote",
                    {
                        p_quote_id:id
                    }
                );

                if(error)throw error;

                await loadQuotes();

                s.toast(
                    "Cotización eliminada y archivada."
                );
            }
        }

    }catch(error){
        console.error(error);
        s.toast(error.message,true);
    }
}

async function fetchItems(id){
    const {
        data,
        error
    }=await s.db
        .from("sales_quote_items")
        .select("*")
        .eq("quote_id",id)
        .order("position");

    if(error)throw error;

    return data||[];
}

function openStatus(quote){
    s.openModal({
        kicker:quote.folio,
        title:"Estatus de cotización",
        body:`
            <div class="sales-field">
                <label>Estatus</label>

                <select id="salesQuoteStatus">

                    <option
                        value="pending"
                        ${quote.status==="pending"?"selected":""}
                    >
                        Pendiente
                    </option>

                    <option
                        value="approved"
                        ${quote.status==="approved"?"selected":""}
                    >
                        Aprobada
                    </option>

                    <option
                        value="rejected"
                        ${quote.status==="rejected"?"selected":""}
                    >
                        Rechazada
                    </option>

                </select>

            </div>

            <div
                id="salesQuoteStatusMsg"
                class="sales-form-msg"
            >
            </div>
        `,
        footer:`
            <button class="sales-btn" data-close-status>
                Cancelar
            </button>

            <button class="sales-btn primary" data-save-status>
                Guardar
            </button>
        `,
        onOpen:root=>{
            root.querySelector("[data-close-status]").onclick=s.closeModal;

            root.querySelector("[data-save-status]").onclick=async()=>{
                try{
                    await updateStatus(
                        quote.id,
                        value("salesQuoteStatus")
                    );

                    s.closeModal();
                }catch(error){
                    document.getElementById("salesQuoteStatusMsg").textContent=error.message;
                }
            };
        }
    });
}

async function updateStatus(id,status){
    const {
        error
    }=await s.db.rpc(
        "sales_set_quote_status",
        {
            p_quote_id:id,
            p_status:status
        }
    );

    if(error)throw error;

    await loadQuotes();

    s.toast(
        "Estatus actualizado."
    );
}

async function openCancelled(){
    const {
        data:archived,
        error
    }=await s.db
        .from("sales_deleted_quotes")
        .select("*")
        .order(
            "deleted_at",
            {
                ascending:false
            }
        );

    if(error){
        s.toast(error.message,true);
        return;
    }

    const active=quotes.filter(
        quote=>quote.status==="cancelled"
    );

    s.openModal({
        title:"Canceladas",
        wide:true,
        body:`
            <div class="sales-list">

                <div class="sales-subtitle">
                    CANCELADAS AÚN EN CONCENTRADO
                </div>

                ${
                    active.map(quote=>`
                        <article class="sales-list-row">
                            <div>
                                <strong>${s.escapeHtml(quote.folio)}</strong>
                                <small>
                                    ${s.escapeHtml(quote.client_snapshot?.legal_name||"")}
                                    ·
                                    ${s.date(quote.quote_date)}
                                </small>
                            </div>

                            <span class="sales-status cancelled">
                                Cancelada
                            </span>
                        </article>
                    `).join("")
                    ||
                    `<div class="sales-empty">Ninguna.</div>`
                }

                <div class="sales-subtitle">
                    ELIMINADAS · SIN PDF
                </div>

                ${
                    (archived||[]).map(item=>`
                        <article class="sales-list-row">
                            <div>
                                <strong>${s.escapeHtml(item.folio)}</strong>
                                <small>
                                    Eliminada
                                    ${s.dateTime(item.deleted_at)}
                                    ·
                                    ${s.escapeHtml(item.deleted_by_email||"")}
                                </small>
                            </div>

                            <span>
                                Registro histórico
                            </span>
                        </article>
                    `).join("")
                    ||
                    `<div class="sales-empty">Ninguna eliminada.</div>`
                }

            </div>
        `
    });
}

function openQuoteForm(base=null,items=[],copy=false){
    const editing=Boolean(base)&&!copy;

    const title=copy
        ?`Copiar ${base.folio}`
        :editing
            ?`Editar ${base.folio}`
            :"Nueva cotización";

    s.openModal({
        title,
        xwide:true,
        body:`
            <form id="salesQuoteForm">

                ${
                    !base
                        ?`
                            <div
                                class="sales-actions"
                                style="margin-bottom:10px"
                            >
                                <button
                                    type="button"
                                    class="sales-btn"
                                    id="salesQCopyPicker"
                                >
                                    Copiar otra cotización
                                </button>
                            </div>
                        `
                        :""
                }

                <div class="sales-grid three">

                    <div class="sales-field">
                        <label>Agente *</label>
                        <select id="salesQAgent" required>
                            ${options(s.state.agents,"name",base?.agent_id)}
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Grupo de productos *</label>
                        <select id="salesQProductGroup" required>
                            ${options(s.state.productGroups,"name",base?.product_group_id)}
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Grupo de precios *</label>
                        <select id="salesQPriceGroup" required></select>
                    </div>

                    <div class="sales-field">
                        <label>Formato *</label>
                        <select id="salesQFormat" required>
                            ${
                                options(
                                    s.state.formats.filter(
                                        format=>format.document_type==="quote"
                                    ),
                                    "name",
                                    base?.format_id
                                )
                            }
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Cliente *</label>
                        <select id="salesQClient" required>
                            ${options(s.state.clients,"legal_name",base?.client_id)}
                        </select>
                    </div>

                    <div class="sales-field">
                        <label>Fecha *</label>
                        <input
                            id="salesQDate"
                            type="date"
                            required
                            value="${
                                copy
                                    ?s.todayISO()
                                    :(base?.quote_date||s.todayISO())
                            }"
                        >
                    </div>

                    <div class="sales-field">
                        <label>Folio</label>
                        <input
                            readonly
                            value="${
                                copy||!base
                                    ?"V-AUTOMÁTICO"
                                    :s.escapeHtml(base.folio)
                            }"
                        >
                    </div>

                    <label class="sales-toggle">
                        <input
                            id="salesQIva"
                            type="checkbox"
                            ${base?.iva_enabled===false?"":"checked"}
                        >
                        <span></span>
                        IVA 16%
                    </label>

                </div>


                <div class="sales-lines-head">

                    <div>
                        <strong>Partidas</strong>
                        <small>
                            Usa las lupas para traer producto o precio.
                        </small>
                    </div>

                    <button
                        type="button"
                        class="sales-btn"
                        id="salesQAddLine"
                    >
                        + Partida
                    </button>

                </div>


                <div id="salesQItems"></div>

                <div
                    id="salesQTotals"
                    class="sales-doc-totals"
                >
                </div>

                <div
                    id="salesQMsg"
                    class="sales-form-msg"
                >
                </div>

            </form>
        `,
        footer:`
            <button class="sales-btn" data-q-close>
                Cancelar
            </button>

            <button
                class="sales-btn primary"
                type="submit"
                form="salesQuoteForm"
            >
                ${editing?"Guardar cambios":"Enviar cotización"}
            </button>
        `,
        onOpen:root=>{

            root.querySelector("[data-q-close]").onclick=s.closeModal;

            if(root.querySelector("#salesQCopyPicker")){
                root.querySelector("#salesQCopyPicker").onclick=openCopySelector;
            }

            root.querySelector("#salesQProductGroup").onchange=()=>{
                refreshPriceGroupOptions();
                clearLinesProducts();
            };

            root.querySelector("#salesQAddLine").onclick=()=>addLine();

            root.querySelector("#salesQItems").onclick=lineClick;

            root.querySelector("#salesQItems").addEventListener(
                "input",
                lineInput
            );

            root.querySelector("#salesQItems").addEventListener(
                "change",
                lineInput
            );

            root.querySelector("#salesQIva").onchange=renderTotals;

            root.querySelector("#salesQuoteForm").onsubmit=event=>
                saveQuote(
                    event,
                    editing?base.id:null
                );

            refreshPriceGroupOptions(
                base?.price_group_id
            );

            if(items.length){
                items.forEach(item=>
                    addLine(
                        copy
                            ?{
                                ...item,
                                id:null
                            }
                            :item
                    )
                );
            }else{
                addLine();
            }

            renderTotals();
        }
    });
}

function openCopySelector(){
    s.openModal({
        title:"Copiar cotización",
        wide:true,
        body:`
            <input
                id="salesQCopySearch"
                class="sales-modal-search"
                placeholder="Buscar folio o cliente..."
            >

            <div
                id="salesQCopyRows"
                class="sales-list"
            >
            </div>
        `,
        onOpen:root=>{

            const render=()=>{
                const search=s.normalize(
                    root.querySelector("#salesQCopySearch").value
                );

                root.querySelector("#salesQCopyRows").innerHTML=
                    quotes
                        .filter(
                            quote=>
                                quote.status!=="cancelled"
                                &&
                                (
                                    !search
                                    ||
                                    s.normalize(
                                        `${quote.folio} ${quote.client_snapshot?.legal_name||""}`
                                    ).includes(search)
                                )
                        )
                        .map(quote=>`
                            <button
                                type="button"
                                class="sales-pick-row"
                                data-copy-quote="${quote.id}"
                            >
                                <strong>${s.escapeHtml(quote.folio)}</strong>
                                <span>${s.escapeHtml(quote.client_snapshot?.legal_name||"")}</span>
                                <em>
                                    ${s.date(quote.quote_date)}
                                    ·
                                    ${s.escapeHtml(quote.agent_snapshot||"")}
                                </em>
                            </button>
                        `)
                        .join("")
                        ||
                        `<div class="sales-empty">Sin cotizaciones.</div>`;
            };

            root.querySelector("#salesQCopySearch").oninput=render;

            root.querySelector("#salesQCopyRows").onclick=async event=>{
                const button=event.target.closest("[data-copy-quote]");

                if(!button)return;

                const quote=quotes.find(
                    item=>item.id===button.dataset.copyQuote
                );

                const items=await fetchItems(quote.id);

                openQuoteForm(
                    quote,
                    items,
                    true
                );
            };

            render();
        }
    });
}

function refreshPriceGroupOptions(selected=""){
    const group=value("salesQProductGroup");

    const select=document.getElementById("salesQPriceGroup");

    if(!select)return;

    const rows=s.state.priceGroups.filter(
        item=>item.product_group_id===group
    );

    select.innerHTML=options(
        rows,
        "name",
        selected
    );
}

function addLine(item={}){
    const host=document.getElementById("salesQItems");

    if(!host)return;

    const unit=item.unit_text||"";
    const currency=item.currency||"M.N.";

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
                    title="Buscar producto"
                    data-find-product
                >
                    ⌕
                </button>

                <input
                    data-q-qty
                    type="number"
                    min="0.001"
                    step="0.001"
                    placeholder="Cant."
                    value="${item.quantity??1}"
                >

                <input
                    data-q-unit
                    placeholder="Unid."
                    value="${s.escapeHtml(unit)}"
                >

                <input
                    data-q-code
                    placeholder="Clave"
                    value="${s.escapeHtml(item.code||"")}"
                >

                <textarea
                    data-q-desc
                    rows="2"
                    placeholder="Descripción"
                >${s.escapeHtml(item.description||"")}</textarea>

                <button
                    type="button"
                    class="sales-icon-btn"
                    title="Buscar precio"
                    data-find-price
                >
                    ⌕
                </button>

                <input
                    data-q-price
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="P. Unit."
                    value="${item.unit_price??""}"
                >

                <input
                    data-q-amount
                    readonly
                    placeholder="Importe"
                >

                <select data-q-currency>

                    <option
                        value="M.N."
                        ${currency!=="USD"?"selected":""}
                    >
                        M.N.
                    </option>

                    <option
                        value="USD"
                        ${currency==="USD"?"selected":""}
                    >
                        USD
                    </option>

                </select>

                <button
                    type="button"
                    class="sales-icon-btn danger"
                    data-remove-line
                >
                    −
                </button>

            </div>
        `
    );

    calcLine(
        host.lastElementChild
    );

    renderTotals();
}

function lineClick(event){
    const row=event.target.closest(".sales-line");

    if(!row)return;

    if(event.target.closest("[data-remove-line]")){
        if(
            document.querySelectorAll(
                "#salesQItems .sales-line"
            ).length>1
        ){
            row.remove();
        }

        renderTotals();
        return;
    }

    if(event.target.closest("[data-find-product]")){
        openProductLookup(
            row,
            false
        );
    }

    if(event.target.closest("[data-find-price]")){
        openProductLookup(
            row,
            true
        );
    }
}

function lineInput(event){
    const row=event.target.closest(".sales-line");

    if(row){
        calcLine(row);
        renderTotals();
    }
}

function calcLine(row){
    const quantity=Number(
        row.querySelector("[data-q-qty]").value||0
    );

    const price=Number(
        row.querySelector("[data-q-price]").value||0
    );

    row.querySelector("[data-q-amount]").value=
        (quantity*price).toFixed(2);
}

function renderTotals(){
    const host=document.getElementById("salesQTotals");

    if(!host)return;

    const iva=document.getElementById("salesQIva")?.checked;

    const totals={};

    document
        .querySelectorAll(
            "#salesQItems .sales-line"
        )
        .forEach(row=>{
            const currency=row.querySelector("[data-q-currency]").value;
            const amount=Number(row.querySelector("[data-q-amount]").value||0);

            totals[currency]=(totals[currency]||0)+amount;
        });

    host.innerHTML=Object.entries(totals).map(([currency,subtotal])=>`
        <div>
            <span>Subtotal ${currency}</span>
            <strong>${s.money(subtotal,currency)}</strong>

            ${
                iva
                    ?`
                        <span>IVA 16%</span>
                        <strong>${s.money(subtotal*.16,currency)}</strong>
                    `
                    :""
            }

            <span>Total ${currency}</span>
            <strong>${s.money(subtotal*(iva?1.16:1),currency)}</strong>
        </div>
    `).join("");
}

function openProductLookup(
    row,
    withPrice
) {


    const group =
        value(
            "salesQProductGroup"
        );


    if (
        !group
    ) {

        s.toast(
            "Selecciona el grupo de productos.",
            true
        );

        return;

    }


    const priceGroup =
        value(
            "salesQPriceGroup"
        );


    if (
        withPrice

        &&

        !priceGroup
    ) {

        s.toast(
            "Selecciona el grupo de precios.",
            true
        );

        return;

    }


    const products =
        s.state.products.filter(

            item =>
                item.group_id ===
                group

        );


    s.openNestedModal({

        kicker:

            withPrice

                ?

                "GRUPO DE PRECIOS"

                :

                "GRUPO DE PRODUCTOS",


        title:

            withPrice

                ?

                "Seleccionar producto y precio"

                :

                "Seleccionar producto",


        wide:
            true,


        body: `

            <input
                id="salesLookupSearch"
                class="sales-modal-search"
                type="search"
                placeholder="Buscar clave o descripción..."
            >


            <div
                id="salesLookupRows"
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
                                        "#salesLookupSearch"
                                    )
                                    .value

                            );


                        layer
                            .querySelector(
                                "#salesLookupRows"
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


                                        if (
                                            withPrice

                                            &&

                                            !price
                                        ) {

                                            return "";

                                        }


                                        return `

                                            <button
                                                type="button"
                                                class="sales-pick-row"
                                                data-pick-product="${product.id}"
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

                                                ${
                                                    withPrice

                                                        ?

                                                        `
                                                            <em>

                                                                ${
                                                                    s.money(
                                                                        price.unit_price,
                                                                        price.currency
                                                                    )
                                                                }

                                                                ${
                                                                    price.currency
                                                                }

                                                            </em>
                                                        `

                                                        :

                                                        ""
                                                }

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
                                    Sin coincidencias.
                                </div>
                            `;

                    };


                layer
                    .querySelector(
                        "#salesLookupSearch"
                    )
                    .oninput =
                    render;


                layer
                    .querySelector(
                        "#salesLookupRows"
                    )
                    .onclick =
                    event => {


                        const button =
                            event.target.closest(
                                "[data-pick-product]"
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
                                    .pickProduct

                            );


                        const unit =
                            s.byId(

                                "units",

                                product.unit_id

                            );


                        row.dataset.productId =
                            product.id;


                        row
                            .querySelector(
                                "[data-q-unit]"
                            )
                            .value =
                            unit?.abbreviation
                            ||
                            "";


                        row
                            .querySelector(
                                "[data-q-code]"
                            )
                            .value =
                            product.code;


                        row
                            .querySelector(
                                "[data-q-desc]"
                            )
                            .value =
                            product.description;


                        if (
                            withPrice
                        ) {


                            const price =
                                s.state.prices.find(

                                    item =>

                                        item.price_group_id ===
                                        priceGroup

                                        &&

                                        item.product_id ===
                                        product.id

                                );


                            row
                                .querySelector(
                                    "[data-q-price]"
                                )
                                .value =
                                price?.unit_price
                                ??
                                "";


                            row
                                .querySelector(
                                    "[data-q-currency]"
                                )
                                .value =
                                price?.currency
                                ||
                                "M.N.";

                        }


                        calcLine(
                            row
                        );


                        renderTotals();


                        // IMPORTANTE:
                        // Solo cerramos la lupa.
                        //
                        // La cotización de abajo sigue viva.

                        s.closeNestedModal(
                            layer
                        );

                    };


                render();

            }

    });

}

function clearLinesProducts(){
    document
        .querySelectorAll(
            "#salesQItems .sales-line"
        )
        .forEach(row=>{
            row.dataset.productId="";
            row.querySelector("[data-q-unit]").value="";
            row.querySelector("[data-q-code]").value="";
            row.querySelector("[data-q-desc]").value="";
            row.querySelector("[data-q-price]").value="";
            calcLine(row);
        });

    renderTotals();
}

async function saveQuote(event,id){
    event.preventDefault();

    const message=document.getElementById("salesQMsg");

    const items=[
        ...document.querySelectorAll(
            "#salesQItems .sales-line"
        )
    ].map((row,index)=>({
        id:row.dataset.itemId||null,
        product_id:row.dataset.productId||null,
        position:index+1,
        quantity:Number(row.querySelector("[data-q-qty]").value||0),
        unit_text:row.querySelector("[data-q-unit]").value.trim(),
        code:row.querySelector("[data-q-code]").value.trim(),
        description:row.querySelector("[data-q-desc]").value.trim(),
        unit_price:Number(row.querySelector("[data-q-price]").value||0),
        currency:row.querySelector("[data-q-currency]").value
    }));

    if(
        items.some(
            item=>
                item.quantity<=0
                ||
                !item.description
        )
    ){
        message.textContent=
            "Revisa cantidades y descripciones de las partidas.";

        return;
    }

    try{
        const {
            error
        }=await s.db.rpc(
            "sales_save_quote",
            {
                p_quote_id:id,
                p_header:{
                    agent_id:value("salesQAgent"),
                    product_group_id:value("salesQProductGroup"),
                    price_group_id:value("salesQPriceGroup"),
                    format_id:value("salesQFormat"),
                    client_id:value("salesQClient"),
                    quote_date:value("salesQDate"),
                    iva_enabled:document.getElementById("salesQIva").checked,
                    iva_rate:.16
                },
                p_items:items
            }
        );

        if(error)throw error;

        s.closeModal();

        await loadQuotes();

        s.toast(
            id
                ?"Cotización actualizada."
                :"Cotización creada."
        );

    }catch(error){
        console.error(error);
        message.textContent=error.message;
    }
}

function options(rows,label,selected=""){
    return `
        <option value="">Selecciona...</option>
        ${
            rows.map(item=>`
                <option
                    value="${item.id}"
                    ${item.id===selected?"selected":""}
                >
                    ${s.escapeHtml(item[label])}
                </option>
            `).join("")
        }
    `;
}

function totalsSummary(totals){
    if(!totals)return "—";

    return Object.entries(totals).map(([currency,value])=>
        `${s.money(value.total||value,currency)} ${currency}`
    ).join(" · ");
}

function quoteDisplayStatus(quote) {
    if (quote.status === "cancelled") {
        return "cancelled";
    }

    return quote.has_remission
        ? "remissioned"
        : "pending";
}

function statusLabel(status){
    return ({
        pending:"Pendiente",
        approved:"Aprobada",
        rejected:"Rechazada",
        remissioned: "Remisionado",
        cancelled:"Cancelada"
    })[status]||status;
}

function value(id){
    return document.getElementById(id)?.value?.trim()||"";
}

document.addEventListener(
    "ggsales:refresh-quotes",
    () => {
        if (s) loadQuotes();
    }
);

})();