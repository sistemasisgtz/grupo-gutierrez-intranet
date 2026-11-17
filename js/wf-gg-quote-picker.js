/* WF_GG_QUOTE_PICKER_V1 · Sólo altera la captura visual de cotización */
(()=>{'use strict';
const db=window.ggSupabase;
let quotes=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=s=>String(s??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
async function open(input){
 if(!quotes){const {data,error}=await db.rpc('wf_sources',{p_scope:'GG'});if(error)throw Error(error.message);quotes=data}
 let overlay=document.getElementById('wfQuotePicker');
 if(!overlay){overlay=document.createElement('div');overlay.id='wfQuotePicker';document.body.append(overlay)}
 overlay.innerHTML=`<div class="wf-qp-shade"></div><div class="wf-qp-dialog"><button class="wf-qp-close">✕</button><span class="wf-qp-eyebrow">VENTAS · COTIZACIONES</span><h2>Seleccionar cotización</h2><p>Se guardará el folio en el campo <b>project</b> que ya utiliza Finanzas.</p><div class="wf-qp-filters"><input id="wfQSearch" placeholder="Buscar folio, cliente, empresa…"><select id="wfQClient"><option value="">Todos los clientes</option></select><select id="wfQAgent"><option value="">Todos los agentes</option></select><select id="wfQCreator"><option value="">Todos los autores</option></select></div><div id="wfQResults" class="wf-qp-results"></div></div>`;
 const select=(id,prop)=>{const el=overlay.querySelector('#'+id);[...new Set(quotes.map(q=>q[prop]).filter(Boolean))].sort().forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.append(o)})};
 select('wfQClient','title');select('wfQAgent','agent');select('wfQCreator','creator');
 const render=()=>{
  const q=text(overlay.querySelector('#wfQSearch').value),c=overlay.querySelector('#wfQClient').value,a=overlay.querySelector('#wfQAgent').value,u=overlay.querySelector('#wfQCreator').value;
  overlay.querySelector('#wfQResults').innerHTML=quotes.filter(x=>(!c||x.title===c)&&(!a||x.agent===a)&&(!u||x.creator===u)&&text(x.folio+' '+x.title+' '+x.agent+' '+x.creator+' '+x.company).includes(q)).slice(0,70).map(x=>`<button type="button" class="wf-qp-result" data-folio="${esc(x.folio)}"><span><b>${esc(x.folio)}</b><small>${esc(x.title)} · ${esc(x.company)}</small></span><strong>${x.currency==='M.N.'?new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(x.total):'Varias monedas'}</strong></button>`).join('')||'<p>Sin resultados.</p>';
  overlay.querySelectorAll('[data-folio]').forEach(btn=>btn.onclick=()=>{input.value=btn.dataset.folio;input.dispatchEvent(new Event('input',{bubbles:true}));overlay.remove()});
 };
 overlay.querySelector('.wf-qp-close').onclick=()=>overlay.remove();overlay.querySelector('.wf-qp-shade').onclick=()=>overlay.remove();
 overlay.querySelectorAll('.wf-qp-filters input,.wf-qp-filters select').forEach(el=>el.addEventListener('input',render));render();
}
function enhance(){
 const input=document.querySelector('#paymentNewRequestForm #paymentProject');if(!input||input.dataset.wfPicker)return;
 input.dataset.wfPicker='1';input.readOnly=true;input.placeholder='Selecciona una cotización de Ventas';
 const label=input.closest('.finance-field');const title=label?.querySelector('label');if(title)title.textContent='Cotización';
 const btn=document.createElement('button');btn.type='button';btn.className='wf-picker-launch';btn.textContent='⌕ Buscar cotización';btn.onclick=async()=>{try{await open(input)}catch(e){alert('No se pudo consultar Ventas: '+e.message)}};
 input.insertAdjacentElement('afterend',btn);
}
const obs=new MutationObserver(enhance);
obs.observe(document.body,{childList:true,subtree:true});enhance();
})();
