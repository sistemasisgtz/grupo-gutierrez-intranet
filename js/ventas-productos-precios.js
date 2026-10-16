(() => {
"use strict";

let s=null;
let activeGroupId=null;
let activePriceGroupId=null;

document.addEventListener("ggsales:ready",()=>{
    s=window.GGSales;
    renderProductsPanel();
    renderPricesPanel();
});

function renderProductsPanel(){
    const host=document.getElementById("salesProductsApp");
    if(!host||!s)return;

    if(!activeGroupId||!s.state.productGroups.some(x=>x.id===activeGroupId)){
        activeGroupId=s.state.productGroups[0]?.id||null;
    }

    host.innerHTML=`
        <div class="sales-section-head">
            <div>
                <span>CATÁLOGO COMERCIAL</span>
                <h2>Productos</h2>
                <p>Grupos, unidades y productos comerciales para cotizaciones y remisiones.</p>
            </div>
            <div>
                <button class="sales-btn" id="salesUnitsBtn">Unidades</button>
                <button class="sales-btn" id="salesProductGroupsBtn">Grupos de productos</button>
                <button class="sales-btn primary" id="salesNewProductBtn">+ Producto</button>
            </div>
        </div>

        <div class="sales-toolbar">
            <select id="salesProductGroupFilter">${groupOptions(activeGroupId)}</select>
            <input id="salesProductSearch" type="search" placeholder="Buscar clave o descripción...">
        </div>

        <div id="salesProductsList" class="sales-table-wrap"></div>
    `;

    host.querySelector("#salesUnitsBtn").onclick=openUnits;
    host.querySelector("#salesProductGroupsBtn").onclick=openProductGroups;
    host.querySelector("#salesNewProductBtn").onclick=()=>openProduct();
    

    host.querySelector("#salesProductGroupFilter").onchange=e=>{
        activeGroupId=e.target.value||null;
        renderProductList();
    };

    host.querySelector("#salesProductSearch").oninput=renderProductList;
    host.querySelector("#salesProductsList").onclick=productListClick;

    renderProductList();
}

function renderProductList(){
    const host=document.getElementById("salesProductsList");
    if(!host)return;

    const search=s.normalize(document.getElementById("salesProductSearch")?.value);

    const rows=s.state.products.filter(product=>
        (!activeGroupId||product.group_id===activeGroupId)
        &&
        (!search||s.normalize(`${product.code} ${product.description}`).includes(search))
    );

    host.innerHTML=rows.length
        ?`
        <table class="sales-table">
            <thead>
                <tr>
                    <th>Clave</th>
                    <th>Unidad</th>
                    <th>Descripción</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(product=>`
                    <tr>
                        <td><strong>${s.escapeHtml(product.code)}</strong></td>
                        <td>${s.escapeHtml(s.byId("units",product.unit_id)?.abbreviation||"—")}</td>
                        <td class="wrap">${s.escapeHtml(product.description)}</td>
                        <td>
                            <button class="sales-mini" data-edit-product="${product.id}">Editar</button>
                            <button class="sales-mini danger" data-delete-product="${product.id}">Eliminar</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
        `
        :`<div class="sales-empty">Sin productos en este grupo.</div>`;
}

function openProduct(product=null){
    s.openModal({
        title:product?"Editar producto":"Nuevo producto",
        wide:true,
        body:`
            <form id="salesProductForm">
                <div class="sales-grid two">
                    <div class="sales-field">
                        <label>Grupo *</label>
                        <select id="salesProductGroup" required>${groupOptions(product?.group_id||activeGroupId)}</select>
                    </div>

                    <div class="sales-field">
                        <label>Unidad *</label>
                        <select id="salesProductUnit" required>${unitOptions(product?.unit_id)}</select>
                    </div>

                    <div class="sales-field">
                        <label>Clave *</label>
                        <input id="salesProductCode" required value="${s.escapeHtml(product?.code||"")}">
                    </div>

                    <div class="sales-field full">
                        <label>Descripción *</label>
                        <textarea id="salesProductDescription" rows="6" required>${s.escapeHtml(product?.description||"")}</textarea>
                    </div>
                    <div class="sales-field">
    <label>Precio unitario (opcional)</label>
    <input
        id="salesProductPrice"
        type="number"
        min="0"
        step="0.01"
        placeholder="Ej. 1500.00"
        value="${product?.unit_price??""}"
    >
</div>

<div class="sales-field">
    <label>Moneda</label>
    <select id="salesProductCurrency">
        <option value="M.N."
            ${product?.currency!=="USD"?"selected":""}>
            M.N.
        </option>
        <option value="USD"
            ${product?.currency==="USD"?"selected":""}>
            USD
        </option>
    </select>
</div>
                </div>

                <div id="salesProductMsg" class="sales-form-msg"></div>
            </form>
        `,
        footer:`
            <button class="sales-btn" data-sales-close2>Cancelar</button>
            <button class="sales-btn primary" type="submit" form="salesProductForm">Guardar</button>
        `,
        onOpen:root=>{
            root.querySelector("[data-sales-close2]").onclick=s.closeModal;
            root.querySelector("#salesProductForm").onsubmit=e=>saveProduct(e,product?.id||null);
        }
    });
}

async function saveProduct(event,id){
    event.preventDefault();

    const message=document.getElementById("salesProductMsg");

    try{
const priceRaw = document.getElementById("salesProductPrice").value.trim();

if (
    priceRaw !== "" &&
    (!Number.isFinite(Number(priceRaw)) || Number(priceRaw) < 0)
) {
    throw new Error("El precio debe ser un número válido.");
}

const payload = {
    group_id: value("salesProductGroup"),
    unit_id: value("salesProductUnit"),
    code: value("salesProductCode"),
    description: document.getElementById("salesProductDescription").value.trim(),
    unit_price: priceRaw === "" ? null : Number(priceRaw),
    currency: value("salesProductCurrency")
};

        const query=id
            ?s.db.from("sales_products").update(payload).eq("id",id)
            :s.db.from("sales_products").insert(payload);

        const {error}=await query;
        if(error)throw error;

        await s.reload("products");

        activeGroupId=payload.group_id;

        s.closeModal();

        renderProductsPanel();
        renderPricesPanel();

        s.toast("Producto guardado.");
    }catch(error){
        message.textContent=error.message;
    }
}

function productListClick(event){
    const edit=event.target.closest("[data-edit-product]");
    const remove=event.target.closest("[data-delete-product]");

    if(edit){
        openProduct(
            s.byId("products",edit.dataset.editProduct)
        );
    }

    if(remove){
        archive(
            "sales_products",
            remove.dataset.deleteProduct,
            "products",
            ()=>{
                renderProductsPanel();
                renderPricesPanel();
            }
        );
    }
}

function openUnits(){
    catalogModal({
        title:"Unidades de medida",
        state:"units",
        table:"sales_units",
        fields:[
            ["name","Nombre"],
            ["abbreviation","Abreviatura"]
        ],
        rerender:openUnits
    });
}

function openProductGroups(){
    catalogModal({
        title:"Grupos de productos",
        state:"productGroups",
        table:"sales_product_groups",
        fields:[
            ["name","Nombre del grupo"]
        ],
        rerender:openProductGroups
    });
}

function catalogModal(config){
    s.openModal({
        title:config.title,
        wide:true,
        body:`
            <form id="salesCatForm">
                <input type="hidden" id="salesCatId">

                <div class="sales-grid two">
                    ${config.fields.map(([key,label])=>`
                        <div class="sales-field">
                            <label>${label} *</label>
                            <input data-cat-field="${key}" required>
                        </div>
                    `).join("")}
                </div>

                <div id="salesCatMsg" class="sales-form-msg"></div>

                <button class="sales-btn primary">Guardar</button>
            </form>

            <div class="sales-list" id="salesCatList">
                ${
                    s.state[config.state].map(item=>`
                        <article class="sales-list-row">
                            <div>
                                <strong>${s.escapeHtml(item[config.fields[0][0]])}</strong>
                                <small>
                                    ${config.fields.slice(1).map(([key])=>s.escapeHtml(item[key]||"")).join(" · ")}
                                </small>
                            </div>

                            <div>
                                <button class="sales-mini" data-cat-edit="${item.id}">Editar</button>
                                <button class="sales-mini danger" data-cat-delete="${item.id}">Eliminar</button>
                            </div>
                        </article>
                    `).join("")
                    ||
                    `<div class="sales-empty">Sin registros.</div>`
                }
            </div>
        `,
        onOpen:root=>{
            root.querySelector("#salesCatForm").onsubmit=async event=>{
                event.preventDefault();

                const id=value("salesCatId");
                const payload={};

                root.querySelectorAll("[data-cat-field]").forEach(node=>{
                    payload[node.dataset.catField]=node.value.trim();
                });

                try{
                    const query=id
                        ?s.db.from(config.table).update(payload).eq("id",id)
                        :s.db.from(config.table).insert(payload);

                    const {error}=await query;
                    if(error)throw error;

                    await s.reload(config.state);

                    s.toast("Guardado.");

                    config.rerender();
                    renderProductsPanel();
                    renderPricesPanel();
                }catch(error){
                    document.getElementById("salesCatMsg").textContent=error.message;
                }
            };

            root.querySelector("#salesCatList").onclick=event=>{
                const edit=event.target.closest("[data-cat-edit]");
                const remove=event.target.closest("[data-cat-delete]");

                if(edit){
                    const item=s.byId(config.state,edit.dataset.catEdit);

                    set("salesCatId",item.id);

                    config.fields.forEach(([key])=>{
                        const node=root.querySelector(`[data-cat-field="${key}"]`);
                        if(node)node.value=item[key]||"";
                    });
                }

                if(remove){
                    archive(
                        config.table,
                        remove.dataset.catDelete,
                        config.state,
                        ()=>{
                            config.rerender();
                            renderProductsPanel();
                            renderPricesPanel();
                        }
                    );
                }
            };
        }
    });
}

function renderPricesPanel(){
    const host=document.getElementById("salesPricesApp");
    if(!host||!s)return;

    if(!activePriceGroupId||!s.state.priceGroups.some(x=>x.id===activePriceGroupId)){
        activePriceGroupId=s.state.priceGroups[0]?.id||null;
    }

    host.innerHTML=`
        <div class="sales-section-head">
            <div>
                <span>LISTAS COMERCIALES</span>
                <h2>Precios</h2>
                <p>Cada grupo de precios pertenece a un grupo de productos.</p>
            </div>

            <button class="sales-btn primary" id="salesNewPriceGroup">
                + Grupo de precios
            </button>
        </div>

        <div class="sales-toolbar">
            <select id="salesPriceGroupSelect">
                ${priceGroupOptions(activePriceGroupId)}
            </select>

            <button
                class="sales-btn"
                id="salesEditPriceGroup"
                ${activePriceGroupId?"":"disabled"}
            >
                Editar grupo
            </button>

            <button
                class="sales-btn danger"
                id="salesDeletePriceGroup"
                ${activePriceGroupId?"":"disabled"}
            >
                Eliminar grupo
            </button>
        </div>

        <div id="salesPriceEditor"></div>
    `;

    host.querySelector("#salesNewPriceGroup").onclick=()=>openPriceGroup();

    host.querySelector("#salesPriceGroupSelect").onchange=event=>{
        activePriceGroupId=event.target.value||null;
        renderPricesPanel();
    };

    host.querySelector("#salesEditPriceGroup").onclick=()=>{
        if(activePriceGroupId){
            openPriceGroup(
                s.byId("priceGroups",activePriceGroupId)
            );
        }
    };

    host.querySelector("#salesDeletePriceGroup").onclick=()=>{
        if(activePriceGroupId){
            archive(
                "sales_price_groups",
                activePriceGroupId,
                "priceGroups",
                ()=>{
                    activePriceGroupId=null;
                    renderPricesPanel();
                }
            );
        }
    };

    renderPriceEditor();
}

function openPriceGroup(existing=null){
    s.openModal({
        title:existing?"Editar grupo de precios":"Nuevo grupo de precios",
        body:`
            <form id="salesPriceGroupForm">

                <div class="sales-field">
                    <label>Nombre *</label>
                    <input
                        id="salesPriceGroupName"
                        required
                        value="${s.escapeHtml(existing?.name||"")}"
                    >
                </div>

                <div class="sales-field">
                    <label>Grupo de productos *</label>
                    <select id="salesPriceGroupProducts" required>
                        ${groupOptions(existing?.product_group_id||"")}
                    </select>
                </div>

                <div id="salesPriceGroupMsg" class="sales-form-msg"></div>

                <button class="sales-btn primary">
                    Guardar
                </button>

            </form>
        `,
        onOpen:root=>{
            root.querySelector("#salesPriceGroupForm").onsubmit=async event=>{
                event.preventDefault();

                try{
                    let data;
                    let error;

                    if(existing){
                        ({
                            data,
                            error
                        }=await s.db
                            .from("sales_price_groups")
                            .update({
                                name:value("salesPriceGroupName"),
                                product_group_id:value("salesPriceGroupProducts")
                            })
                            .eq("id",existing.id)
                            .select("id")
                            .single()
                        );
                    }else{
                        ({
                            data,
                            error
                        }=await s.db
                            .from("sales_price_groups")
                            .insert({
                                name:value("salesPriceGroupName"),
                                product_group_id:value("salesPriceGroupProducts")
                            })
                            .select("id")
                            .single()
                        );
                    }

                    if(error)throw error;

                    await s.reload("priceGroups");

                    activePriceGroupId=data.id;

                    s.closeModal();

                    renderPricesPanel();

                    s.toast("Grupo de precios guardado.");
                }catch(error){
                    document.getElementById("salesPriceGroupMsg").textContent=error.message;
                }
            };
        }
    });
}

function renderPriceEditor(){
    const host=document.getElementById("salesPriceEditor");
    if(!host)return;

    const group=s.byId("priceGroups",activePriceGroupId);

    if(!group){
        host.innerHTML=`<div class="sales-empty">Crea o selecciona un grupo de precios.</div>`;
        return;
    }

    const products=s.state.products.filter(
        product=>product.group_id===group.product_group_id
    );

    host.innerHTML=`
        <div class="sales-surface">

            <div class="sales-surface-head">
                <div>
                    <span>GRUPO DE PRECIOS</span>
                    <strong>${s.escapeHtml(group.name)}</strong>
                </div>

                <button class="sales-btn primary" id="salesSavePrices">
                    Guardar precios
                </button>
            </div>

            <div class="sales-table-wrap">

                <table class="sales-table">

                    <thead>
                        <tr>
                            <th>Clave</th>
                            <th>Descripción</th>
                            <th>Precio</th>
                            <th>Moneda</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${products.map(product=>{
                            const price=s.state.prices.find(
                                item=>
                                    item.price_group_id===group.id
                                    &&
                                    item.product_id===product.id
                            );

                            return `
                                <tr data-price-product="${product.id}">
                                    <td><strong>${s.escapeHtml(product.code)}</strong></td>
                                    <td class="wrap">${s.escapeHtml(product.description)}</td>
                                    <td>
                                        <input
                                            class="sales-inline-input"
                                            data-price-value
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value="${price?.unit_price??""}"
                                        >
                                    </td>
                                    <td>
                                        <select
                                            class="sales-inline-select"
                                            data-price-currency
                                        >
                                            <option
                                                value="M.N."
                                                ${price?.currency!=="USD"?"selected":""}
                                            >
                                                M.N.
                                            </option>

                                            <option
                                                value="USD"
                                                ${price?.currency==="USD"?"selected":""}
                                            >
                                                USD
                                            </option>
                                        </select>
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>

                </table>

            </div>

        </div>
    `;

    host.querySelector("#salesSavePrices").onclick=savePrices;
}

async function savePrices(){
    const rows=[
        ...document.querySelectorAll("[data-price-product]")
    ];

    const upserts=[];

    rows.forEach(row=>{
        const raw=row.querySelector("[data-price-value]").value;

        if(raw!==""){
            upserts.push({
                price_group_id:activePriceGroupId,
                product_id:row.dataset.priceProduct,
                unit_price:Number(raw),
                currency:row.querySelector("[data-price-currency]").value
            });
        }
    });

    try{
        if(upserts.length){
            const {error}=await s.db
                .from("sales_prices")
                .upsert(
                    upserts,
                    {
                        onConflict:"price_group_id,product_id"
                    }
                );

            if(error)throw error;
        }

        await s.reload("prices");

        s.toast("Precios guardados.");

        renderPriceEditor();
    }catch(error){
        s.toast(error.message,true);
    }
}

async function archive(table,id,stateKey,callback){
    if(!confirm("¿Eliminar este registro?"))return;

    try{
        const {error}=await s.db
            .from(table)
            .update({
                active:false
            })
            .eq("id",id);

        if(error)throw error;

        await s.reload(stateKey);

        s.toast("Eliminado.");

        callback();
    }catch(error){
        s.toast(error.message,true);
    }
}

function groupOptions(selected=""){
    return `
        <option value="">Selecciona...</option>
        ${
            s.state.productGroups.map(group=>`
                <option
                    value="${group.id}"
                    ${group.id===selected?"selected":""}
                >
                    ${s.escapeHtml(group.name)}
                </option>
            `).join("")
        }
    `;
}

function unitOptions(selected=""){
    return `
        <option value="">Selecciona...</option>
        ${
            s.state.units.map(unit=>`
                <option
                    value="${unit.id}"
                    ${unit.id===selected?"selected":""}
                >
                    ${s.escapeHtml(unit.name)}
                    ·
                    ${s.escapeHtml(unit.abbreviation)}
                </option>
            `).join("")
        }
    `;
}

function priceGroupOptions(selected=""){
    return `
        <option value="">Selecciona grupo de precios...</option>
        ${
            s.state.priceGroups.map(group=>`
                <option
                    value="${group.id}"
                    ${group.id===selected?"selected":""}
                >
                    ${s.escapeHtml(group.name)}
                </option>
            `).join("")
        }
    `;
}

function value(id){
    return document.getElementById(id)?.value?.trim()||"";
}

function set(id,value){
    const node=document.getElementById(id);
    if(node)node.value=value??"";
}

})();