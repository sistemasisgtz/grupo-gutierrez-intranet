(() => {

"use strict";

let s=null;
let requests=[];

document.addEventListener("ggsales:ready",async()=>{
    s=window.GGSales;
    renderPanel();
    await loadRequests();
});

async function loadRequests(){
    const {data,error}=await s.db
        .from("sales_material_requests")
        .select("*")
        .order("request_date",{ascending:false})
        .order("created_at",{ascending:false});

    if(error){
        s.toast(error.message,true);
        return;
    }

    requests=data||[];

    renderList();
}

function renderPanel(){
    const host=document.getElementById("salesMaterialApp");

    if(!host||!s)return;

    host.innerHTML=`
        <div class="sales-section-head">

            <div>
                <span>VENTAS → ALMACÉN</span>
                <h2>Solicitud de Material</h2>
                <p>Solicita existencias de almacén y sigue su estatus hasta surtido.</p>
            </div>

            <button
                class="sales-btn primary"
                id="salesNewMaterial"
            >
                + Nueva solicitud
            </button>

        </div>

        <div class="sales-toolbar">

            <input
                id="salesMatSearch"
                type="search"
                placeholder="Buscar folio o estatus..."
            >

            <select id="salesMatStatus">
                <option value="">Todos los estatus</option>
                <option value="pending">Pendiente</option>
                <option value="separated">Separado</option>
                <option value="supplied">Surtido</option>
            </select>

            <input id="salesMatFrom" type="date">

            <input id="salesMatTo" type="date">

        </div>

        <div class="sales-surface">

            <div class="sales-surface-head">
                <div>
                    <span>HISTÓRICO</span>
                    <strong id="salesMatCount">0 solicitudes</strong>
                </div>
            </div>

            <div
                id="salesMatList"
                class="sales-table-wrap"
            >
            </div>

        </div>
    `;

    host.querySelector("#salesNewMaterial").onclick=openNew;

    [
        "salesMatSearch",
        "salesMatStatus",
        "salesMatFrom",
        "salesMatTo"
    ].forEach(id=>{
        const node=host.querySelector(`#${id}`);
        node.oninput=renderList;
        node.onchange=renderList;
    });

    host.querySelector("#salesMatList").onclick=listClick;

    renderList();
}

function filtered(){
    const search=s.normalize(value("salesMatSearch"));
    const status=value("salesMatStatus");
    const from=value("salesMatFrom");
    const to=value("salesMatTo");

    return requests.filter(request=>{
        if(status&&request.status!==status)return false;
        if(from&&request.request_date<from)return false;
        if(to&&request.request_date>to)return false;

        if(
            search
            &&
            !s.normalize(`
                ${request.folio}
                ${request.status}
                ${request.created_by_email}
            `).includes(search)
        ){
            return false;
        }

        return true;
    });
}

function renderList(){
    const host=document.getElementById("salesMatList");

    if(!host)return;

    const rows=filtered();

    const count=document.getElementById("salesMatCount");

    if(count){
        count.textContent=
            `${rows.length} solicitud${rows.length===1?"":"es"}`;
    }

    host.innerHTML=rows.length
        ?`
            <table class="sales-table">

                <thead>
                    <tr>
                        <th>Folio</th>
                        <th>Fecha</th>
                        <th>Usuario</th>
                        <th>Estatus</th>
                        <th>Atendido por</th>
                        <th>Fecha atención</th>
                        <th>PDF</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows.map(request=>`
                        <tr>
                            <td>
                                <strong>${s.escapeHtml(request.folio)}</strong>
                            </td>

                            <td>
                                ${s.date(request.request_date)}
                            </td>

                            <td>
                                ${s.escapeHtml(request.created_by_email)}
                            </td>

                            <td>
                                <span class="sales-status ${request.status}">
                                    ${statusLabel(request.status)}
                                </span>
                            </td>

                            <td>
                                ${s.escapeHtml(request.resolved_by_email||"—")}
                            </td>

                            <td>
                                ${s.dateTime(request.resolved_at)}
                            </td>

                            <td>
                                ${
                                    [
                                        "separated",
                                        "supplied"
                                    ]
                                    .includes(
                                        request.status
                                    )

                                        ?

                                        `
                                            <button
                                                class="sales-mini"
                                                data-mat-pdf="${request.id}"
                                            >
                                                PDF
                                            </button>
                                        `

                                        :

                                        "—"
                                }
                            </td>
                        </tr>
                    `).join("")}
                </tbody>

            </table>
        `
        :
        `<div class="sales-empty">Sin solicitudes.</div>`;
}

async function listClick(event){
    const button=event.target.closest("[data-mat-pdf]");

    if(!button)return;

    try{
        await GGSalesPDF.materialRequest(
            button.dataset.matPdf
        );
    }catch(error){
        s.toast(error.message,true);
    }
}

async function openNew(){
    try{
        const {
            data,
            error
        }=await s.db
            .from("warehouse_products")
            .select(`
                id,
                folio,
                code,
                description_main,
                description_long,
                location,
                unit,
                stock,
                minimum_stock,
                active
            `)
            .eq("active",true)
            .order("code");

        if(error)throw error;

        const products=data||[];

        s.openModal({
            title:"Nueva solicitud de material",
            xwide:true,
            body:`
                <form id="salesMatForm">

                    <div class="sales-toolbar two">

                        <input
                            id="salesMatProductSearch"
                            type="search"
                            placeholder="Buscar código, descripción o ubicación..."
                        >

                        <span class="sales-hint">
                            Captura cantidad únicamente en lo que necesites.
                        </span>

                    </div>

                    <div class="sales-table-wrap material-picker">

                        <table class="sales-table">

                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Producto</th>
                                    <th>Ubicación</th>
                                    <th>Unidad</th>
                                    <th>Stock</th>
                                    <th>Cantidad</th>
                                </tr>
                            </thead>

                            <tbody id="salesMatProducts">
                            </tbody>

                        </table>

                    </div>

                    <div id="salesMatMsg" class="sales-form-msg"></div>

                </form>
            `,
            footer:`
                <button class="sales-btn" data-close>
                    Cancelar
                </button>

                <button
                    class="sales-btn primary"
                    form="salesMatForm"
                >
                    Enviar solicitud
                </button>
            `,
            onOpen:root=>{

                const render=()=>{
                    const search=s.normalize(
                        root.querySelector("#salesMatProductSearch").value
                    );

                    root.querySelector("#salesMatProducts").innerHTML=
                        products
                            .filter(product=>
                                !search
                                ||
                                s.normalize(`
                                    ${product.code}
                                    ${product.description_main}
                                    ${product.description_long||""}
                                    ${product.location||""}
                                `).includes(search)
                            )
                            .map(product=>`
                                <tr
                                    data-mat-product="${product.id}"
                                    data-stock="${product.stock}"
                                >
                                    <td>
                                        <strong>${s.escapeHtml(product.code)}</strong>
                                    </td>

                                    <td class="wrap">
                                        ${s.escapeHtml(product.description_main)}

                                        ${
                                            product.description_long
                                                ?`<small>${s.escapeHtml(product.description_long)}</small>`
                                                :""
                                        }
                                    </td>

                                    <td>
                                        ${s.escapeHtml(product.location||"—")}
                                    </td>

                                    <td>
                                        ${s.escapeHtml(product.unit||"PZA")}
                                    </td>

                                    <td>
                                        ${product.stock}
                                    </td>

                                    <td>
                                        <input
                                            class="sales-inline-input"
                                            data-mat-qty
                                            type="number"
                                            min="0"
                                            max="${product.stock}"
                                            step="0.001"
                                            placeholder="0"
                                        >
                                    </td>
                                </tr>
                            `)
                            .join("");
                };

                root.querySelector("#salesMatProductSearch").oninput=render;

                root.querySelector("[data-close]").onclick=s.closeModal;

                root.querySelector("#salesMatForm").onsubmit=saveRequest;

                render();
            }
        });

    }catch(error){
        s.toast(error.message,true);
    }
}

async function saveRequest(event){
    event.preventDefault();

    const message=document.getElementById("salesMatMsg");

    const items=[
        ...document.querySelectorAll("[data-mat-product]")
    ]
    .map((row,index)=>({
        warehouse_product_id:row.dataset.matProduct,
        quantity:Number(row.querySelector("[data-mat-qty]").value||0),
        position:index+1
    }))
    .filter(
        item=>item.quantity>0
    );

    if(!items.length){
        message.textContent=
            "Selecciona al menos un producto y cantidad.";

        return;
    }

    try{
        const {error}=await s.db.rpc(
            "sales_create_material_request",
            {
                p_items:items
            }
        );

        if(error)throw error;

        s.closeModal();

        await loadRequests();

        s.toast(
            "Se ha enviado tu solicitud a Almacén. Revisa aquí el estatus."
        );

    }catch(error){
        message.textContent=error.message;
    }
}

function statusLabel(status){
    return ({
        pending:"Pendiente",
        separated:"Separado",
        supplied:"Surtido"
    })[status]||status;
}

function value(id){
    return document.getElementById(id)?.value?.trim()||"";
}

})();