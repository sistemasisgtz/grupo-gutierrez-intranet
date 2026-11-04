/* GG TECNOLOGÍAS · SPA con persistencia real en Supabase. */
(() => {
  'use strict';
  const db = window.ggSupabase;
  const $ = id => document.getElementById(id);
  const BUCKET = 'gg-tec-responsivas';
  const ICONS = {
    laptop: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M1 21h22l-2-3H3z"/>',
    pc: '<rect x="4" y="3" width="12" height="17" rx="2"/><circle cx="10" cy="16" r="1"/><rect x="18" y="5" width="4" height="13" rx="1"/>',
    monitor: '<rect x="2" y="3" width="20" height="15" rx="2"/><path d="M12 18v4M7 22h10"/>',
    celular: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4M11 19h2"/>'
  };
  const ICON = type => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[type] + '</svg>';
  const state = { category:null, assets:[], employees:[], departments:[], current:null, type:null,
    step:1, removePdf:false, busy:false, zoom:.88, panX:0, panY:0, drag:null, toastTimer:0 };
  const typeNames = {laptop:'Laptop',pc:'PC',monitor:'Monitor',celular:'Celular'};
  const safe = value => String(value == null ? '' : value).trim();
  const fail = (err) => { console.error('[Tecnologías]',err); toast(err?.message || String(err)); };
  const photo = employee => employee?.photo_path ? db.storage.from('employee-photos').getPublicUrl(employee.photo_path).data?.publicUrl : '';
  const findEmployee = id => state.employees.find(e => e.id === id);
  const findDept = id => state.departments.find(d => d.id === id);
  const label = a => safe(a.description) || [safe(a.brand),safe(a.model)].filter(Boolean).join(' ') || (a.category === 'computo' ? typeNames[a.subtype] : 'Teléfono celular');
  function toast(message) {
    const box=$('tToast');box.textContent=message;box.classList.add('visible');
    clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>box.classList.remove('visible'),3600);
  }
  function showSection(which) {
    $('tHub').hidden=which!=='hub'; $('tBoard').hidden=which!=='board';$('tTraining').hidden=which!=='training';
    $('tBack').hidden=which==='hub';
  }
  function avatar(employee,size) {
    const url=photo(employee);
    if(url){
      const img=document.createElement('img');img.src=url;img.alt='Fotografía de '+employee.full_name;
      img.loading='lazy';img.onerror=()=>{const next=document.createElement('span');next.className='t-avatar';next.textContent=initials(employee.full_name);img.replaceWith(next);};
      return img;
    }
    const fallback=document.createElement('span');fallback.className='t-avatar';fallback.textContent=initials(employee?.full_name);return fallback;
  }
  function initials(value){return safe(value).split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join('').toUpperCase()||'GG';}
  async function queryAssets() {
    const {data,error}=await db.from('gg_tec_assets').select('*').eq('category',state.category).order('created_at',{ascending:true}).limit(1000);
    if(error)throw error;state.assets=data||[];renderAssets();
  }
  async function refreshCatalogs() {
    const [departments,employees] = await Promise.all([
      db.from('gg_tec_departments').select('id,name').order('name'),db.rpc('gg_tec_employee_catalog')
    ]);
    if(departments.error)throw departments.error;if(employees.error)throw employees.error;
    state.departments=departments.data||[];state.employees=employees.data||[];
    populateCatalogs();
  }
  function populateCatalogs() {
    const employee=$('tEmployee'),dept=$('tDepartmentSelect');
    const oldEmployee=employee.value,oldDept=dept.value;
    employee.replaceChildren(new Option('Sin asignar',''));
    state.employees.forEach(item=>employee.add(new Option(item.full_name+' · '+(item.position||'Sin puesto'),item.id)));
    dept.replaceChildren(new Option('Sin departamento',''));
    state.departments.forEach(item=>dept.add(new Option(item.name,item.id)));
    if([...employee.options].some(x=>x.value===oldEmployee))employee.value=oldEmployee;
    if([...dept.options].some(x=>x.value===oldDept))dept.value=oldDept;
  }
  async function openCategory(category){
    if(category==='capacitaciones'){state.category=null;showSection('training');return;}
    state.category=category;showSection('board');
    $('tBoardTitle').textContent=category==='computo'?'Equipos de cómputo':'Equipos de telefonía';
    $('tBoardCaption').textContent=category==='computo'?'INVENTARIO / HARDWARE':'INVENTARIO / MOVILIDAD';
    $('tSearch').value='';resetView();
    try {await refreshCatalogs();await queryAssets();}catch(error){fail(error);}
  }
  function renderAssets(){
    const root=$('tWorld');root.replaceChildren();
    const term=safe($('tSearch').value).toLocaleLowerCase('es');
    const visible=state.assets.filter(a=>[
      a.description,a.brand,a.model,a.identifier,a.group_code,a.phone_number,a.observations,
      findEmployee(a.employee_id)?.full_name,findDept(a.department_id)?.name
    ].some(v=>safe(v).toLocaleLowerCase('es').includes(term)));
    visible.forEach(a=>root.append(assetNode(a)));
    $('tCounter').textContent=visible.length+' de '+state.assets.length+' equipos';
    $('tEmpty').hidden=state.assets.length>0 || !!term;
  }
  function assetNode(a){
    const card=document.createElement('div');card.className='t-asset';card.dataset.assetId=a.id;
    card.style.left=Number(a.pos_x||0)+'px';card.style.top=Number(a.pos_y||0)+'px';
    card.setAttribute('role','button');card.tabIndex=0;card.setAttribute('aria-label','Editar '+label(a));
    const inner=document.createElement('div');inner.className='t-asset-inner';
    const top=document.createElement('div');top.className='t-asset-top';
    const icon=document.createElement('span');icon.className='t-device-icon';icon.innerHTML=ICON(a.subtype);
    const stateNode=document.createElement('span');stateNode.className='t-asset-state'+(a.responsiva_path?' has-pdf':'');
    const dot=document.createElement('i');stateNode.append(dot,document.createTextNode(a.responsiva_path?'Con responsiva':'Sin responsiva'));
    top.append(icon,stateNode);
    const title=document.createElement('h3');title.textContent=label(a);
    const sub=document.createElement('p');sub.textContent=[typeNames[a.subtype],safe(a.identifier)||safe(a.phone_number)].filter(Boolean).join(' · ');
    const badge=document.createElement('div');badge.className='t-asset-badge';badge.textContent=[safe(a.group_code),findDept(a.department_id)?.name].filter(Boolean).join('  /  ')||'GRUPO GUTIÉRREZ';
    inner.append(top,title,sub,badge);card.append(inner);
    const employee=findEmployee(a.employee_id);
    if(employee){const person=document.createElement('div');person.className='t-person';
      const detail=document.createElement('span'),name=document.createElement('strong'),role=document.createElement('small');
      name.textContent=employee.full_name;role.textContent=employee.position||'Sin puesto';detail.append(name,role);person.append(avatar(employee),detail);card.append(person);
    }
    card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openWizard(a);}};
    return card;
  }
  function applyCamera(){
    $('tWorld').style.transform='translate('+state.panX+'px,'+state.panY+'px) scale('+state.zoom+')';
    $('tZoomLabel').textContent=Math.round(state.zoom*100)+'%';
    $('tViewport').style.backgroundSize=(24*state.zoom)+'px '+(24*state.zoom)+'px';
    $('tViewport').style.backgroundPosition=state.panX+'px '+state.panY+'px';
  }
  function resetView(){
    const rect=$('tViewport').getBoundingClientRect();state.zoom=rect.width<600?.66:.88;
    state.panX=rect.width/2-120*state.zoom;state.panY=rect.height/2-70*state.zoom;applyCamera();
  }
  function zoomBy(factor,cx,cy){
    const rect=$('tViewport').getBoundingClientRect();cx=cx??rect.width/2;cy=cy??rect.height/2;
    const next=Math.max(.3,Math.min(2.5,state.zoom*factor));
    state.panX=cx-(cx-state.panX)*next/state.zoom;
    state.panY=cy-(cy-state.panY)*next/state.zoom;
    state.zoom=next;applyCamera();
  }
  function setupPointer(){
    const viewport=$('tViewport');
    viewport.addEventListener('pointerdown',event=>{
      if(event.button!==0||state.drag)return;
      const node=event.target.closest('.t-asset');
      const asset=node&&state.assets.find(a=>a.id===node.dataset.assetId);
      state.drag={pointer:event.pointerId,kind:asset?'asset':'pan',asset,node,startX:event.clientX,startY:event.clientY,
        left:asset?Number(asset.pos_x):state.panX,top:asset?Number(asset.pos_y):state.panY,moved:false};
      viewport.setPointerCapture(event.pointerId);
      if(!asset)viewport.classList.add('is-panning');else node.classList.add('is-dragging');
    });
    viewport.addEventListener('pointermove',event=>{
      const d=state.drag;if(!d||d.pointer!==event.pointerId)return;
      const dx=event.clientX-d.startX,dy=event.clientY-d.startY;
      if(Math.hypot(dx,dy)>5)d.moved=true;
      if(!d.moved)return;
      if(d.kind==='pan'){state.panX=d.left+dx;state.panY=d.top+dy;applyCamera();}
      else{d.node.style.left=(d.left+dx/state.zoom)+'px';d.node.style.top=(d.top+dy/state.zoom)+'px';}
    });
    async function finish(event){
      const d=state.drag;if(!d||d.pointer!==event.pointerId)return;
      state.drag=null;viewport.classList.remove('is-panning');d.node?.classList.remove('is-dragging');
      if(d.kind==='asset'&&d.moved){
        const pos_x=parseFloat(d.node.style.left),pos_y=parseFloat(d.node.style.top);
        try{
          const {error}=await db.from('gg_tec_assets').update({pos_x,pos_y}).eq('id',d.asset.id);
          if(error)throw error;d.asset.pos_x=pos_x;d.asset.pos_y=pos_y;
        }catch(error){d.node.style.left=d.left+'px';d.node.style.top=d.top+'px';fail(error);}
      }else if(d.kind==='asset'&&!d.moved&&event.type!=='pointercancel'){openWizard(d.asset);}
    }
    viewport.addEventListener('pointerup',finish);
    viewport.addEventListener('pointercancel',finish);
    viewport.addEventListener('wheel',event=>{
      event.preventDefault();const rect=viewport.getBoundingClientRect();
      zoomBy(Math.exp(-event.deltaY*.0014),event.clientX-rect.left,event.clientY-rect.top);
    },{passive:false});
    $('tZoomIn').onclick=()=>zoomBy(1.2);$('tZoomOut').onclick=()=>zoomBy(1/1.2);
    $('tZoomReset').onclick=resetView;
  }
  function nextPosition(){
    const n=state.assets.length;const angle=n*2.39996;const radius=90*Math.sqrt(n);
    return {pos_x:Math.round(Math.cos(angle)*radius),pos_y:Math.round(Math.sin(angle)*radius)};
  }
  function openWizard(asset=null){
    state.current=asset;state.step=1;state.type=asset?.subtype||(state.category==='telefonia'?'celular':null);state.removePdf=false;
    $('tAssetForm').reset();
    $('tModalTitle').textContent=asset?'Editar equipo':'Agregar equipo';
    $('tModalEyebrow').textContent=asset?'ACTUALIZAR / INVENTARIO':'NUEVO / INVENTARIO';
    $('tDelete').hidden=!asset;
    const props=['description','brand','model','identifier','observations','group_code','phone_number','phone_plan'];
    if(asset){props.forEach(k=>{const field=$('tAssetForm').elements.namedItem(k);if(field)field.value=asset[k]||'';});
      $('tAssetForm').elements.namedItem('phone_brand').value=asset.brand||'';
      $('tAssetForm').elements.namedItem('phone_model').value=asset.model||'';
      $('tAssetForm').elements.namedItem('phone_identifier').value=asset.identifier||'';
      $('tAssetForm').elements.namedItem('phone_group_code').value=asset.group_code||'';
      $('tEmployee').value=asset.employee_id||'';$('tDepartmentSelect').value=asset.department_id||'';
    }
    $('tPdf').value='';$('tPdfLabel').textContent='Seleccionar PDF';
    $('tExistingPdf').hidden=!asset?.responsiva_path;
    $('tModal').hidden=false;renderTypes();renderEmployee();renderStep();
    $('tModal').querySelector('.t-icon-button').focus();
  }
  function closeWizard(){if(state.busy)return;$('tModal').hidden=true;}
  function renderTypes(){
    const types=state.category==='computo'?['laptop','pc','monitor']:['celular'];
    const root=$('tTypeOptions');root.replaceChildren();
    types.forEach(type=>{
      const b=document.createElement('button');b.type='button';b.className='t-type'+(state.type===type?' active':'');
      b.innerHTML=ICON(type);const text=document.createElement('span');text.textContent=typeNames[type];b.append(text);
      b.onclick=()=>{state.type=type;renderTypes();};root.append(b);
    });
  }
  function renderStep(){
    document.querySelectorAll('[data-step]').forEach(el=>el.hidden=Number(el.dataset.step)!==state.step);
    $('tSteps').querySelectorAll('span').forEach((el,i)=>{el.classList.toggle('active',i+1===state.step);el.classList.toggle('done',i+1<state.step);});
    $('tComputerFields').hidden=state.category==='telefonia';$('tPhoneFields').hidden=state.category!=='telefonia';
    $('tPrev').hidden=state.step===1;$('tNext').hidden=state.step===4;$('tSave').hidden=state.step!==4;
  }
  function renderEmployee(){
    const employee=findEmployee($('tEmployee').value),panel=$('tEmployeePreview');panel.replaceChildren();panel.hidden=!employee;
    if(!employee)return;
    const detail=document.createElement('div'),name=document.createElement('strong'),role=document.createElement('small');
    name.textContent=employee.full_name;role.textContent=employee.position||'Puesto sin especificar';detail.append(name,role);panel.append(avatar(employee),detail);
  }
  function readForm(){
    const f=$('tAssetForm').elements,pick=k=>safe(f.namedItem(k).value)||null;
    const phone=state.category==='telefonia';
    const data={category:state.category,subtype:state.type,description:phone?null:pick('description'),
      brand:pick(phone?'phone_brand':'brand'),model:pick(phone?'phone_model':'model'),
      identifier:pick(phone?'phone_identifier':'identifier'),group_code:pick(phone?'phone_group_code':'group_code'),
      observations:phone?null:pick('observations'),phone_number:phone?pick('phone_number'):null,
      phone_plan:phone?pick('phone_plan'):null,employee_id:pick('employee_id'),department_id:pick('department_id')};
    return data;
  }
  async function saveAsset(event){
    event.preventDefault();if(state.busy)return;
    if(!state.type){toast('Primero selecciona un tipo de equipo.');state.step=1;renderStep();return;}
    const file=$('tPdf').files[0];
    if(file){
      if(file.size>10485760){toast('El PDF excede 10 MB.');return;}
      if(!file.name.toLowerCase().endsWith('.pdf')||await file.slice(0,5).text()!=='%PDF-'){toast('Selecciona un archivo PDF válido.');return;}
    }
    const old=state.current;const id=old?.id||crypto.randomUUID();const position=old?{pos_x:old.pos_x,pos_y:old.pos_y}:nextPosition();
    const payload={id,...position,...readForm(),responsiva_path:old?.responsiva_path||null};
    const path=(await db.auth.getUser()).data?.user?.id+'/'+id+'-'+Date.now()+'.pdf';
    if(!path||path.startsWith('undefined')){toast('Sesión no válida.');return;}
    state.busy=true;$('tSave').disabled=true;
    let uploaded=false;
    try{
      if(file){
        const {error}=await db.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:'application/pdf',cacheControl:'60'});
        if(error)throw error;uploaded=true;payload.responsiva_path=path;
      }else if(state.removePdf)payload.responsiva_path=null;
      const {error}=await db.from('gg_tec_assets').upsert(payload).select('id').single();if(error)throw error;
      if(old?.responsiva_path&&old.responsiva_path!==payload.responsiva_path){
        const {error:removeError}=await db.storage.from(BUCKET).remove([old.responsiva_path]);
        if(removeError)console.warn('PDF antiguo pendiente de retirar',removeError);
      }
      $('tModal').hidden=true;await queryAssets();toast(old?'Equipo actualizado.':'Equipo añadido al lienzo.');
    }catch(error){
      if(uploaded)await db.storage.from(BUCKET).remove([path]).catch(()=>{});
      fail(error);
    }finally{state.busy=false;$('tSave').disabled=false;}
  }
  async function deleteAsset(){
    const asset=state.current;if(!asset||state.busy)return;
    if(!confirm('¿Eliminar este equipo del inventario? Esta acción no se puede deshacer.'))return;
    state.busy=true;
    try{
      const {error}=await db.from('gg_tec_assets').delete().eq('id',asset.id);if(error)throw error;
      if(asset.responsiva_path){const {error:storageError}=await db.storage.from(BUCKET).remove([asset.responsiva_path]);if(storageError)console.warn(storageError);}
      $('tModal').hidden=true;await queryAssets();toast('Equipo eliminado.');
    }catch(error){fail(error);}finally{state.busy=false;}
  }
  async function viewPdf(){
    if(!state.current?.responsiva_path)return;
    const {data,error}=await db.storage.from(BUCKET).createSignedUrl(state.current.responsiva_path,60);
    if(error){fail(error);return;}window.open(data.signedUrl,'_blank','noopener,noreferrer');
  }
  function renderDepartments(){
    const root=$('tDeptList');root.replaceChildren();
    if(!state.departments.length){const p=document.createElement('p');p.textContent='Todavía no hay departamentos.';root.append(p);}
    state.departments.forEach(dept=>{
      const row=document.createElement('div');row.className='t-dept-row';
      const name=document.createElement('strong');name.textContent=dept.name;
      const edit=document.createElement('button');edit.type='button';edit.textContent='Editar';
      edit.onclick=()=>{
        const input=document.createElement('input');input.value=dept.name;input.maxLength=100;
        input.style.cssText='flex:1;min-width:0;background:#ffffff0c;color:white;border:1px solid #99e8e1;border-radius:8px;padding:8px';
        row.replaceChild(input,name);edit.textContent='Guardar';input.focus();input.select();
        const save=async()=>{
          if(!safe(input.value)){toast('Escribe un nombre válido.');return;}
          edit.disabled=true;
          const {error}=await db.from('gg_tec_departments').update({name:safe(input.value)}).eq('id',dept.id);
          if(error){edit.disabled=false;fail(error);return;}
          await refreshCatalogs();renderDepartments();if(state.category)renderAssets();toast('Departamento actualizado.');
        };
        edit.onclick=save;input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();save();}if(e.key==='Escape')renderDepartments();};
      };
      const del=document.createElement('button');del.type='button';del.textContent='Eliminar';
      del.onclick=async()=>{
        if(!confirm('¿Eliminar '+dept.name+'? Los equipos conservarán sus datos pero quedarán sin departamento.'))return;
        const {error}=await db.from('gg_tec_departments').delete().eq('id',dept.id);
        if(error){fail(error);return;}await refreshCatalogs();renderDepartments();await queryAssets();toast('Departamento eliminado.');
      };
      row.append(name,edit,del);root.append(row);
    });
  }
  async function addDepartment(event){
    event.preventDefault();const name=safe($('tDeptName').value);if(!name)return;
    const {error}=await db.from('gg_tec_departments').insert({name});
    if(error){fail(error);return;}$('tDeptName').value='';await refreshCatalogs();renderDepartments();toast('Departamento añadido.');
  }
  async function allAssets(){
    let all=[],from=0;
    while(true){const {data,error}=await db.from('gg_tec_assets').select('*').order('created_at').range(from,from+999);
      if(error)throw error;all=all.concat(data||[]);if(!data||data.length<1000)break;from+=1000;
    }return all;
  }
  async function exportExcel(){
    if(!window.XLSX){toast('No cargó la librería de Excel. Revisa tu conexión.');return;}
    try{
      const data=await allAssets();const book=XLSX.utils.book_new();
      [['computo','Cómputo'],['telefonia','Telefonía']].forEach(([category,sheet])=>{
        const rows=data.filter(a=>a.category===category).map(a=>({
          Tipo:typeNames[a.subtype],Descripción:a.description||'',Marca:a.brand||'',Modelo:a.model||'',
          Identificador:a.identifier||'','Código grupo':a.group_code||'',Observaciones:a.observations||'',
          'Número telefónico':a.phone_number||'','Tipo de línea':a.phone_plan||'',
          Usuario:findEmployee(a.employee_id)?.full_name||'','Puesto':findEmployee(a.employee_id)?.position||'',
          Departamento:findDept(a.department_id)?.name||'',Responsiva:a.responsiva_path?'Sí':'No',
          'Fecha de alta':a.created_at?new Date(a.created_at).toLocaleDateString('es-MX'):'',
          'Posición X':a.pos_x,'Posición Y':a.pos_y
        }));
        const ws=XLSX.utils.json_to_sheet(rows.length?rows:[{'Sin registros':''}]);
        ws['!cols']=Object.keys(rows[0]||{'Sin registros':''}).map(k=>({wch:Math.min(36,Math.max(14,k.length+6))}));
        XLSX.utils.book_append_sheet(book,ws,sheet);
      });
      XLSX.writeFile(book,'Grupo_Gutierrez_Tecnologias_'+new Date().toISOString().slice(0,10)+'.xlsx');
      toast('Exportación de equipos lista.');
    }catch(error){fail(error);}
  }
  function bindEvents(){
    document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openCategory(b.dataset.open));
    $('tBack').onclick=()=>{if(state.busy)return;state.category=null;showSection('hub');};
    $('tNew').onclick=()=>openWizard();$('tSearch').oninput=renderAssets;
    $('tDepartments').onclick=()=>{$('tDeptModal').hidden=false;renderDepartments();$('tDeptName').focus();};
    $('tExcel').onclick=exportExcel;
    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{
      if(b.dataset.close==='dept')$('tDeptModal').hidden=true;else closeWizard();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('tModal').hidden)closeWizard();else $('tDeptModal').hidden=true;}});
    $('tEmployee').onchange=renderEmployee;
    $('tPdf').onchange=()=>{$('tPdfLabel').textContent=$('tPdf').files[0]?.name||'Seleccionar PDF';};
    $('tPrev').onclick=()=>{state.step=Math.max(1,state.step-1);renderStep();};
    $('tNext').onclick=()=>{if(state.step===1&&!state.type){toast('Selecciona el tipo de equipo.');return;}state.step=Math.min(4,state.step+1);renderStep();};
    $('tAssetForm').onsubmit=saveAsset;$('tDelete').onclick=deleteAsset;
    $('tViewExisting').onclick=viewPdf;
    $('tRemovePdf').onclick=()=>{state.removePdf=true;$('tExistingPdf').hidden=true;toast('El PDF se quitará al guardar.');};
    $('tDeptForm').onsubmit=addDepartment;
    setupPointer();
  }
  async function init(){
    try{
      if(!db)throw Error('No se encontró el cliente de Supabase.');
      const {data:auth,error:authError}=await db.auth.getUser();
      if(authError||!auth?.user)throw Error('Tu sesión no está activa. Inicia sesión en Sistema Central.');
      const {data:allowed,error}=await db.rpc('gg_tec_has_access');if(error)throw error;
      if(allowed!==true)throw Error('Solicita a Sistemas el permiso Acceso para Tecnologías.');
      document.documentElement.classList.remove('gg-tech-locked');$('tDenied').hidden=true;$('tApp').hidden=false;
      bindEvents();showSection('hub');
    }catch(error){document.documentElement.classList.remove('gg-tech-locked');$('tDenied').hidden=false;
      $('tDeniedMessage').textContent=error.message||'No fue posible verificar el acceso.';}
  }
  document.addEventListener('DOMContentLoaded',init,{once:true});
})();
