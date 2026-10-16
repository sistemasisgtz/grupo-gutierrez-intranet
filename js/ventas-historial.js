(() => {

"use strict";

let s=null;
let events=[];

document.addEventListener("ggsales:ready",async()=>{
    s=window.GGSales;
    renderPanel();
    await loadEvents();
});

async function loadEvents(){
    const {data,error}=await s.db
        .from("sales_events")
        .select("*")
        .order(
            "created_at",
            {
                ascending:false
            }
        )
        .limit(2000);

    if(error){
        s.toast(error.message,true);
        return;
    }

    events=data||[];

    render();
}

function renderPanel(){
    const host=document.getElementById("salesHistoryApp");

    if(!host||!s)return;

    host.innerHTML=`
        <div class="sales-section-head">

            <div>
                <span>AUDITORÍA COMERCIAL</span>
                <h2>Historial</h2>
                <p>Movimientos de catálogos, cotizaciones, ODC, remisiones y solicitudes de material.</p>
            </div>

            <button
                class="sales-btn"
                id="salesHistoryRefresh"
            >
                ↻ Actualizar
            </button>

        </div>

        <div class="sales-toolbar five">

            <input
                id="salesHistorySearch"
                type="search"
                placeholder="Buscar movimiento, usuario, folio..."
            >

            <select id="salesHistoryEntity">
                <option value="">Todos los módulos</option>
            </select>

            <select id="salesHistoryAction">
                <option value="">Todas las acciones</option>
                <option>INSERT</option>
                <option>UPDATE</option>
                <option>DELETE</option>
            </select>

            <input id="salesHistoryFrom" type="date">

            <input id="salesHistoryTo" type="date">

        </div>

        <div class="sales-surface">

            <div class="sales-surface-head">
                <div>
                    <span>EVENTOS</span>
                    <strong id="salesHistoryCount">0</strong>
                </div>
            </div>

            <div
                id="salesHistoryList"
                class="sales-history"
            >
            </div>

        </div>
    `;

    host.querySelector("#salesHistoryRefresh").onclick=loadEvents;

    [
        "salesHistorySearch",
        "salesHistoryEntity",
        "salesHistoryAction",
        "salesHistoryFrom",
        "salesHistoryTo"
    ].forEach(id=>{
        const node=host.querySelector(`#${id}`);
        node.oninput=render;
        node.onchange=render;
    });
}

function render(){
    const host=document.getElementById("salesHistoryList");

    if(!host)return;

    const entity=document.getElementById("salesHistoryEntity");

    if(
        entity
        &&
        entity.options.length===1
    ){
        s.unique(
            events.map(event=>event.entity_type)
        )
        .sort()
        .forEach(type=>{
            entity.insertAdjacentHTML(
                "beforeend",
                `
                    <option value="${s.escapeHtml(type)}">
                        ${s.escapeHtml(entityLabel(type))}
                    </option>
                `
            );
        });
    }

    const search=s.normalize(value("salesHistorySearch"));
    const entityFilter=value("salesHistoryEntity");
    const action=value("salesHistoryAction");
    const from=value("salesHistoryFrom");
    const to=value("salesHistoryTo");

    const rows=events.filter(event=>{
        const date=event.created_at?.slice(0,10)||"";

        if(entityFilter&&event.entity_type!==entityFilter)return false;
        if(action&&event.action!==action)return false;
        if(from&&date<from)return false;
        if(to&&date>to)return false;

        if(
            search
            &&
            !s.normalize(`
                ${event.entity_type}
                ${event.action}
                ${event.summary||""}
                ${event.user_email||""}
                ${JSON.stringify(event.data||{})}
            `).includes(search)
        ){
            return false;
        }

        return true;
    });

    document.getElementById("salesHistoryCount").textContent=
        `${rows.length} evento${rows.length===1?"":"s"}`;

    host.innerHTML=rows.length
        ?rows.map(event=>`
            <article class="sales-history-row">

                <div class="sales-history-icon">
                    ${icon(event.action)}
                </div>

                <div>
                    <strong>
                        ${s.escapeHtml(entityLabel(event.entity_type))}
                        ·
                        ${s.escapeHtml(actionLabel(event.action))}
                    </strong>

                    <p>
                        ${s.escapeHtml(event.summary||"Movimiento registrado")}
                    </p>

                    <small>
                        ${s.dateTime(event.created_at)}
                        ·
                        ${s.escapeHtml(event.user_email||"Sistema")}
                    </small>
                </div>

            </article>
        `).join("")
        :`<div class="sales-empty">Sin movimientos.</div>`;
}

function entityLabel(value){
    return ({
        sales_clients:"Clientes",
        sales_agents:"Agentes",
        sales_companies:"Empresas",
        sales_formats:"Formatos",
        sales_units:"Unidades",
        sales_product_groups:"Grupos de productos",
        sales_products:"Productos",
        sales_price_groups:"Grupos de precios",
        sales_prices:"Precios",
        sales_quotes:"Cotizaciones",
        sales_suppliers:"Proveedores",
        sales_supplier_products:"Productos proveedor",
        sales_purchase_orders:"ODC",
        sales_remissions:"Remisiones",
        sales_material_requests:"Solicitudes de material"
    })[value]||value;
}

function actionLabel(value){
    return ({
        INSERT:"Alta",
        UPDATE:"Modificación",
        DELETE:"Eliminación"
    })[value]||value;
}

function icon(value){
    return value==="INSERT"
        ?"+"
        :value==="DELETE"
            ?"−"
            :"↻";
}

function value(id){
    return document.getElementById(id)?.value?.trim()||"";
}

})();