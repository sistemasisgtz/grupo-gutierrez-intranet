/* WF_UI_20261113 · Presupuestos / autorizaciones / relación de facturas */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const db = window.ggSupabase || window.supabaseClient;
const root = $('#wfApp');
if (!root) return;
const scope = document.body.dataset.scope;
const mode = document.body.dataset.mode;
const isLO = scope === 'LO';
const money = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(n)||0);
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Math.max(0,Number(n)||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
const key = s=>String(s??'').toLocaleLowerCase('es-MX').normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
const state={sources:[],ledger:null,invoice:null,active:[],week:'',pool:'LO',selected:[],filter:'',client:'',agent:'',creator:'',batch:null,link:null,step:0};
function toast(message,bad=false){const el=$('#wfToast');el.textContent=message;el.dataset.bad=String(bad);el.classList.add('show');setTimeout(()=>el.classList.remove('show'),4300)}
async function rpc(name,args={}){const {data,error}=await db.rpc(name,args);if(error)throw Error(error.message);return data}
async function ensureAuth(){if(!db)throw Error('Cliente Supabase no disponible');const {data,error}=await db.auth.getUser();if(error||!data?.user)throw Error('Inicia sesión primero');}
function monday(d=new Date()){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
const back = isLO?'dashboard.html':'sistema.html';
function ui(){
 const title=mode==='budget'?'Presupuesto semanal':mode==='approval'?'Autorización Presupuesto':'Relación de facturas';
 root.innerHTML=`<div class="wf-wrap"><header class="wf-top"><a class="wf-back" href="${back}">← Volver</a><div class="wf-brand">${isLO?'INGENIERÍA Y PROYECTOS LO':'GRUPO GUTIÉRREZ'} · FINANZAS</div><button class="wf-secondary" id="wfRefresh">↻ Actualizar</button></header><section class="wf-hero"><span class="wf-kicker">CONTROL FINANCIERO / ${esc(scope)}</span><h1>${title}<span class="wf-point">.</span></h1><p>${mode==='budget'?'Planeación semanal de inversión. Cada nuevo envío genera una versión y solicita una nueva autorización.':mode==='approval'?'Autoriza cada empresa por separado; cambia importes y consulta versiones anteriores.':'Relaciona CFDI con operaciones y distribuye únicamente pagos confirmados.'}</p></section><main id="wfContent" aria-live="polite"><div class="wf-loading">Preparando información…</div></main><footer class="wf-footer">Misma base de datos · Los importes se verifican en PostgreSQL</footer></div><div class="wf-modal" id="wfModal" hidden><div class="wf-shade" data-close></div><section class="wf-modal-window" role="dialog" aria-modal="true"><button class="wf-x" data-close aria-label="Cerrar">✕</button><div id="wfModalBody"></div></section></div><div class="wf-toast" id="wfToast" role="status"></div>`;
 $('#wfRefresh').onclick=()=>refresh();
 document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&& !$('#wfModal').hidden) close()});
}
function modal(html){$('#wfModalBody').innerHTML=html;$('#wfModal').hidden=false;document.body.classList.add('wf-modal-open')}
function close(){ $('#wfModal').hidden=true;document.body.classList.remove('wf-modal-open') }
function renderFail(e){$('#wfContent').innerHTML=`<section class="wf-panel"><h2>No se pudo cargar</h2><p>${esc(e.message)}</p><button class="wf-primary" id="wfTry">Reintentar</button></section>`;$('#wfTry').onclick=refresh}
async function refresh(){
 $('#wfContent').innerHTML='<div class="wf-loading">Consultando Supabase…</div>';
 try{
  if(mode==='budget'){
   const [sources,data]=await Promise.all([rpc('wf_sources',{p_scope:scope}),rpc('wf_dashboard',{p_scope:scope})]);
   state.sources=sources;state.ledger=data;state.week=state.week||monday();
   if(isLO)state.selected=sources.map(x=>({id:x.id,group_code:'LO',requested:0}));
   renderBudget();
  }else if(mode==='approval'){
   const [lo,gg]=await Promise.all([rpc('wf_dashboard',{p_scope:'LO'}),rpc('wf_dashboard',{p_scope:'GG'})]);
   state.active=[lo,gg];renderApprovals();
  }else{
   const [invoices,sources]=await Promise.all([rpc('wf_invoices',{p_scope:scope}),rpc('wf_sources',{p_scope:scope})]);
   state.invoice=invoices;state.sources=sources;renderInvoices();
  }
 }catch(e){console.error('[WF]',e);renderFail(e)}
}
const field=(caption,control)=>`<label class="wf-field"><span>${caption}</span>${control}</label>`;
const rowCard=(p,selected)=>`<article class="wf-entry"><div class="wf-entry-left"><small>${esc(p.folio)}${p.company?' · '+esc(p.company):''}</small><strong>${esc(p.title)}</strong><span>${p.agent?'Agente: '+esc(p.agent)+' · ':''}${p.currency==='MULTI'?'Varias monedas':money(p.total)}</span></div><label class="wf-entry-value">Solicitar esta semana <input inputmode="decimal" type="number" step="0.01" min="0" max="999999999999" class="wf-amount" data-id="${p.id}" value="${selected?.requested??0}"></label>${isLO?'':`<button class="wf-remove" data-remove="${p.id}" type="button" title="Retirar cotización">×</button>`}</article>`;
function bindBudgetInputs(){document.querySelectorAll('.wf-amount').forEach(n=>n.onchange=()=>{const item=state.selected.find(x=>x.id===n.dataset.id);if(item)item.requested=Number(n.value)});document.querySelectorAll('[data-remove]').forEach(n=>n.onclick=()=>{state.selected=state.selected.filter(x=>x.id!==n.dataset.remove);renderBudget()})}
function renderBudget(){
 const cur=state.ledger.batches.filter(x=>x.state!=='superseded');
 const old=state.ledger.batches.filter(x=>x.state==='superseded');
 const items=state.selected.map(x=>({ref:state.sources.find(s=>s.id===x.id),value:x})).filter(x=>x.ref);
 const finance=cur.filter(x=>x.week_start===state.week);
 $('#wfContent').innerHTML=`<div class="wf-stats"><div><span>Referencias a presupuestar</span><strong>${isLO?state.sources.length:state.selected.length}</strong></div><div><span>Semana seleccionada</span><strong>${esc(state.week)}</strong></div><div><span>Última revisión</span><strong>${finance.length?esc(finance[0].state==='approved'?'Autorizado':'Pendiente'):'Sin envío'}</strong></div></div><section class="wf-panel"><div class="wf-panel-head"><div><span class="wf-kicker">01 / CAPTURA</span><h2>Presupuesto a autorizar</h2></div><div class="wf-actions">${field('Lunes de la semana',`<input type="date" id="wfWeek" value="${state.week}">`)}${isLO?'':`<button class="wf-primary" id="wfAdd">+ Agregar cotización</button>`}</div></div><div class="wf-list">${items.map(x=>rowCard(x.ref,x.value)).join('')||'<p class="wf-muted">Agrega cotizaciones para preparar el presupuesto.</p>'}</div><div class="wf-panel-bottom"><span>${isLO?'Los proyectos ocultos no se incluyen.':'Puedes agregar tantas cotizaciones como necesites, hasta 300 por envío.'}</span><button class="wf-primary" id="wfSubmit" ${items.length?'':'disabled'}>Enviar a Finanzas ↗</button></div></section><section class="wf-panel"><div class="wf-panel-head"><div><span class="wf-kicker">02 / SEGUIMIENTO</span><h2>Enviados y autorizados</h2></div></div>${cur.map(b=>batchDetail(b,state.ledger)).join('')||'<p class="wf-muted">Aún no hay presupuestos enviados.</p>'}<details class="wf-history"><summary>Versiones anteriores · ${old.length}</summary>${old.map(b=>batchDetail(b,state.ledger)).join('')||'Sin versiones anteriores'}</details></section>`;
 $('#wfWeek').onchange=e=>{state.week=e.target.value;if(state.week!==monday(new Date(e.target.value+'T12:00:00'))){/* el servidor comprueba lunes */}renderBudget()};
 $('#wfSubmit').onclick=submitBudget;
 if(!isLO)$('#wfAdd').onclick=openQuotePicker;
 bindBudgetInputs();
}
function batchDetail(b,doc){const lines=doc.lines.filter(x=>x.batch_id===b.id);return `<div class="wf-batch"><div><strong>Semana ${esc(b.week_start)} · Versión ${b.version}</strong><small class="wf-pill ${esc(b.state)}">${b.state==='approved'?'Autorizado':b.state==='submitted'?'Pendiente':'Histórico'}</small></div><div class="wf-batch-lines">${lines.map(l=>`<div><span>${esc(l.source_folio)}</span><span>Solicitado ${money(l.requested)}</span><strong>${l.approved===null?'En revisión':'Autorizado '+money(l.approved)}</strong>${l.approved!==null?`<small>Comprometido: ${money(l.spent)}</small>`:''}</div>`).join('')}</div></div>`}
function openQuotePicker(){
 modal(`<span class="wf-kicker">COTIZACIONES / VENTAS</span><h2>Agregar cotizaciones</h2><p>Busca por folio, cliente, agente o creador. Verifica la empresa de cada cotización.</p><div class="wf-pick-filters"><input id="wfSearch" placeholder="Folio, cliente, usuario…"><select id="wfAgent"><option value="">Todos los agentes</option>${[...new Set(state.sources.map(s=>s.agent).filter(Boolean))].map(x=>`<option>${esc(x)}</option>`).join('')}</select><select id="wfClient"><option value="">Todos los clientes</option>${[...new Set(state.sources.map(s=>s.title).filter(Boolean))].map(x=>`<option>${esc(x)}</option>`).join('')}</select><select id="wfCreator"><option value="">Todos los creadores</option>${[...new Set(state.sources.map(s=>s.creator).filter(Boolean))].map(x=>`<option>${esc(x)}</option>`).join('')}</select></div><div id="wfFound" class="wf-pick-results"></div>`);
 const update=()=>{
  const q=key($('#wfSearch').value);const a=$('#wfAgent').value,c=$('#wfClient').value,u=$('#wfCreator').value;
  const found=state.sources.filter(s=>!state.selected.some(x=>x.id===s.id)&&(!a||s.agent===a)&&(!c||s.title===c)&&(!u||s.creator===u)&&key(s.folio+' '+s.title+' '+s.agent+' '+s.creator).includes(q)).slice(0,60);
  $('#wfFound').innerHTML=found.map(s=>`<div class="wf-pick-item"><div><small>${esc(s.folio)} · ${esc(s.company||'Empresa sin identificar')}</small><strong>${esc(s.title)}</strong><span>${s.currency==='M.N.'?money(s.total):'Cotización multimoneda — no elegible para presupuesto MXN'}</span></div><select id="code_${s.id}" aria-label="Grupo"><option value="ISGTZ">ISGTZ</option><option value="JD">JD</option></select><button class="wf-secondary" data-pick="${s.id}" ${s.currency==='M.N.'?'':'disabled'}>Agregar +</button></div>`).join('')||'<p class="wf-muted">Sin coincidencias para estos filtros.</p>';
  document.querySelectorAll('[data-pick]').forEach(btn=>btn.onclick=()=>{state.selected.push({id:btn.dataset.pick,requested:0,group_code:$('#code_'+btn.dataset.pick).value});close();renderBudget()});
 };
 ['wfSearch','wfAgent','wfClient','wfCreator'].forEach(id=>$('#'+id).addEventListener('input',update));update();
}
async function submitBudget(){
 try{
  if(!state.selected.length)throw Error('No hay referencias');
  if(!confirm('¿Enviar una nueva versión? La versión vigente de esta empresa y semana pasará al historial y requerirá autorización nuevamente.'))return;
  const p_items=state.selected.map(x=>({id:x.id,group_code:x.group_code,requested:Number(x.requested)}));
  await rpc('wf_submit',{p_scope:scope,p_week:state.week,p_items});toast('Presupuesto enviado. Pendiente de Finanzas.');await refresh();
 }catch(e){toast(e.message,true)}
}
function renderApprovals(){
 const content=state.active.map((doc,i)=>{
  const area=i===0?'LO':'GG';const label=i===0?'Ingeniería y Proyectos LO':'ISGTZ y José David';
  const newest=doc.batches.filter(b=>b.state!=='superseded').sort((a,b)=>b.week_start.localeCompare(a.week_start));
  const past=doc.batches.filter(b=>b.state==='superseded');
  return `<section class="wf-panel wf-company"><span class="wf-kicker">${area} / PRESUPUESTOS</span><h2>${label}</h2>${newest.map(batch=>`<article class="wf-approval-batch"><header><strong>Semana ${esc(batch.week_start)} · v${batch.version}</strong><small class="wf-pill ${batch.state}">${batch.state==='approved'?'Autorizado':'Por autorizar'}</small></header>${doc.lines.filter(l=>l.batch_id===batch.id).map(l=>`<div class="wf-approve-line"><div><small>${esc(l.group_code)} · ${esc(l.source_folio)}</small><strong>${esc(l.display_name)}</strong><span>Solicitado: ${money(l.requested)} · Comprometido: ${money(l.spent)}</span></div><label>Finanzas autoriza<input class="wf-approval-input" type="number" min="${l.spent}" step="0.01" value="${l.approved??l.requested}" data-line="${l.id}" data-batch="${batch.id}"></label></div>`).join('')}<button class="wf-primary" data-approve="${batch.id}">${batch.state==='approved'?'Guardar cambios':'Autorizar esta empresa'} ↗</button></article>`).join('')||'<p class="wf-muted">No hay una solicitud vigente.</p>'}<details class="wf-history"><summary>Historial · ${past.length} versiones</summary>${past.map(b=>batchDetail(b,doc)).join('')}</details></section>`;
 }).join('');
 $('#wfContent').innerHTML=`<div class="wf-split">${content}</div>`;
 document.querySelectorAll('[data-approve]').forEach(btn=>btn.onclick=async()=>{
  const p_values={}; document.querySelectorAll(`[data-batch="${btn.dataset.approve}"]`).forEach(n=>p_values[n.dataset.line]=Number(n.value));
  if(!confirm('¿Confirmas los importes que autorizará Finanzas para esta empresa?'))return;
  try{await rpc('wf_approve',{p_batch:btn.dataset.approve,p_values});toast('Autorización registrada');await refresh()}catch(e){toast(e.message,true)}
 });
}
function renderInvoices(){
 const docs=state.invoice.invoices, links=docs.filter(x=>x.link);
 const list=docs.filter(x=>!x.link);
 $('#wfContent').innerHTML=`<div class="wf-stats"><div><span>Facturas de esta empresa</span><strong>${docs.length}</strong></div><div><span>Facturas ligadas</span><strong>${links.length}</strong></div><div><span>Pagos confirmados disponibles</span><strong>${state.invoice.payments.filter(p=>Number(p.actual)>Number(p.used)).length}</strong></div></div>${!isLO?`<section class="wf-panel wf-rfc"><div><span class="wf-kicker">CONFIGURACIÓN DE FINANZAS</span><h2>RFC emisores</h2><p>Asocia cada RFC de facturación a LO, ISGTZ o JD. Esto determina qué facturas verá cada sistema.</p></div><div class="wf-actions"><input id="wfRfc" maxlength="13" placeholder="RFC emisor"><select id="wfRfcCode"><option>LO</option><option>ISGTZ</option><option>JD</option></select><button class="wf-secondary" id="wfSaveRfc">Registrar RFC</button></div><small>Registrados: ${state.invoice.issuers.map(x=>esc(x.issuer_rfc)+' → '+esc(x.group_code)).join(' · ')||'Ninguno'}</small><p class="wf-muted">RFC aún sin clasificar: ${(state.invoice.unclassified_issuers||[]).map(x=>esc(x.rfc)+' ('+x.invoices+')').join(' · ')||'Ninguno'}</p></section>`:''}<section class="wf-panel"><div class="wf-panel-head"><div><span class="wf-kicker">01 / VINCULACIÓN</span><h2>Facturas disponibles</h2></div><input id="wfInvoiceSearch" placeholder="Filtrar folio o RFC…" aria-label="Buscar factura"></div><div id="wfInvoiceList">${invoiceRows(list)}</div></section><section class="wf-panel"><div class="wf-panel-head"><div><span class="wf-kicker">02 / APLICACIONES</span><h2>Facturas relacionadas</h2></div></div>${links.map(x=>`<article class="wf-invoice-card"><div><small>${esc(x.group_code)} · ${esc(x.folio)}</small><strong>${esc(x.source_folio)}</strong><span>${money(x.applied)} aplicado de ${money(x.total)}</span></div><button class="wf-secondary" data-openlink="${x.link}">Distribuir pagos ↗</button></article>`).join('')||'<p class="wf-muted">Todavía no hay facturas relacionadas.</p>'}</section>`;
 $('#wfInvoiceSearch').oninput=e=>{$('#wfInvoiceList').innerHTML=invoiceRows(list.filter(x=>key(x.folio+' '+x.rfc+' '+x.issuer).includes(key(e.target.value))));bindInvoiceLinks()};
 bindInvoiceLinks();document.querySelectorAll('[data-openlink]').forEach(btn=>btn.onclick=()=>openDistribution(btn.dataset.openlink));
 if(!isLO)$('#wfSaveRfc').onclick=async()=>{try{await rpc('wf_set_issuer',{p_rfc:$('#wfRfc').value,p_code:$('#wfRfcCode').value});toast('RFC clasificado');await refresh()}catch(e){toast(e.message,true)}};
}
function invoiceRows(items){return items.map(i=>`<article class="wf-invoice-card"><div><small>${esc(i.group_code)} · ${esc(i.folio)} · ${esc(i.currency)}</small><strong>${esc(i.issuer)}</strong><span>${money(i.total)} · RFC ${esc(i.rfc)}</span></div><button class="wf-secondary" data-link="${i.id}">Vincular ↗</button></article>`).join('')||'<p class="wf-muted">Sin facturas nuevas para los RFC clasificados de esta empresa.</p>'}
function bindInvoiceLinks(){document.querySelectorAll('[data-link]').forEach(n=>n.onclick=()=>openInvoiceLink(n.dataset.link))}
function openInvoiceLink(id){const inv=state.invoice.invoices.find(x=>x.id===id);if(!inv)return;
 const sources=state.sources.filter(s=>isLO||s.currency==='M.N.');
 modal(`<span class="wf-kicker">PASO 1 DE 2 · RELACIÓN</span><h2>Vincular factura</h2><p>${esc(inv.folio)} · ${esc(inv.issuer)} · ${money(inv.total)}</p>${field(isLO?'Proyecto abierto':'Cotización',`<input id="wfSrcSearch" placeholder="Buscar folio / cliente" autocomplete="off"><select id="wfSrc" size="7">${sources.map(s=>`<option value="${s.id}">${esc(s.folio)} · ${esc(s.title)}</option>`).join('')}</select>`)}<p class="wf-muted">Solo se muestran referencias válidas de esta empresa. El grupo queda fijado por el RFC.</p><button class="wf-primary" id="wfLinkSave">Confirmar vínculo ↗</button>`);
 $('#wfSrcSearch').oninput=e=>{const q=key(e.target.value);$('#wfSrc').innerHTML=sources.filter(s=>key(s.folio+' '+s.title).includes(q)).map(s=>`<option value="${s.id}">${esc(s.folio)} · ${esc(s.title)}</option>`).join('')};
 $('#wfLinkSave').onclick=async()=>{try{const p_source=$('#wfSrc').value;if(!p_source)throw Error('Selecciona una referencia');await rpc('wf_link_invoice',{p_invoice:id,p_code:inv.group_code,p_source});close();toast('Factura vinculada');await refresh()}catch(e){toast(e.message,true)}};
}
function openDistribution(linkId){const inv=state.invoice.invoices.find(i=>i.link===linkId);if(!inv)return;
 const matches=state.invoice.payments.filter(p=>p.group_code===inv.group_code&&p.project===inv.source_folio&&Number(p.actual)>Number(p.used));
 const allocations=state.invoice.applications.filter(a=>a.link_id===linkId);
 modal(`<span class="wf-kicker">PASO 2 DE 2 · APLICACIÓN</span><h2>Distribuir pagos</h2><p><strong>${esc(inv.folio)}</strong> · ${esc(inv.source_folio)} · Factura ${money(inv.total)}</p><div class="wf-progress"><span>Aplicado: ${money(inv.applied)}</span><strong>Pendiente de asignar: ${money(Number(inv.total)-Number(inv.applied))}</strong></div><div class="wf-distributions">${matches.map(p=>`<article class="wf-distribution"><div><small>${esc(p.folio)}</small><strong>Pago confirmado ${money(p.actual)}</strong><span>Disponible ${money(Number(p.actual)-Number(p.used))}</span></div><input type="number" step="0.01" min="0.01" max="${Math.min(Number(p.actual)-Number(p.used),Number(inv.total)-Number(inv.applied))}" data-amount="${p.id}" placeholder="Monto utilizado"><button class="wf-primary" data-apply="${p.id}">Aplicar</button></article>`).join('')||'<p class="wf-muted">Todos los pagos están aplicados o todavía no hay pagos confirmados para esta referencia.</p>'}</div><details class="wf-history"><summary>Aplicaciones registradas (${allocations.length})</summary>${allocations.map(a=>`<p>${money(a.amount)} · ${esc(a.created_at.slice(0,10))}</p>`).join('')}</details>`);
 document.querySelectorAll('[data-apply]').forEach(btn=>btn.onclick=async()=>{try{const value=Number($(`[data-amount="${btn.dataset.apply}"]`).value);if(!value||value<0.01)throw Error('Captura un importe válido');await rpc('wf_apply_invoice',{p_link:linkId,p_request:btn.dataset.apply,p_amount:value});close();toast('Aplicación registrada');await refresh();openDistribution(linkId)}catch(e){toast(e.message,true)}});
}
ui();ensureAuth().then(refresh).catch(renderFail);
})();
