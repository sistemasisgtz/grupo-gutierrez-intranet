
(() => {
"use strict";

const db = window.ggSupabase;
const mode = document.body.dataset.mode;
const GG = mode === "gg";
const app = document.getElementById("ldApp");
const host = document.getElementById("ldModalHost");

const COLORS = [
 "#DBEBFF","#DFF5EB","#FFE6D6","#FBE2E8",
 "#EEE3FF","#FFF3C8","#DCEEF0","#F4E1D2",
 "#E1E7FA","#F1EDDA","#D6F1F3","#F8DCEA"
];

const ICONS = [
 ["local-small","Local pequeño"],
 ["local-large","Local grande"],
 ["apartment-small","Departamento pequeño"],
 ["apartment-large","Departamento grande"],
 ["house","Casa"],
 ["house-large","Casa grande"]
];

let data = {
 people:[],assets:[],tasks:[],updates:[],water:[],docs:[]
};
let search = "";
let filter = "pendiente";
let selectedFiles = [];

const esc = value => String(value ?? "")
 .replaceAll("&","&amp;")
 .replaceAll("<","&lt;")
 .replaceAll(">","&gt;")
 .replaceAll('"',"&quot;")
 .replaceAll("'","&#39;");

const fmt = date => date
 ? new Date(date).toLocaleString("es-MX")
 : "—";

const $ = selector => document.querySelector(selector);

function toast(message) {
 const el = document.createElement("div");
 el.className = "ld-msg";
 el.textContent = message;
 document.getElementById("ldToastHost").replaceChildren(el);
 setTimeout(() => el.remove(),4500);
}

function art(kind) {
 const big = kind.endsWith("large");
 const apartment = kind.startsWith("apartment");
 const house = kind.startsWith("house");
 const floors = big ? 3 : apartment ? 2 : 1;
 let windows = "";

 for(let row=0;row<floors;row++) {
  for(let col=0;col<(big?3:2);col++) {
   windows += '<rect x="' + (31+col*24) +
    '" y="' + (38+row*23) +
    '" width="12" height="13" rx="2" fill="#FFFFFF"/>';
  }
 }

 return '<svg viewBox="0 0 130 130" role="img" ' +
  'aria-label="' + esc(kind) + '">' +
  '<rect x="6" y="113" width="118" height="5" rx="2" fill="#9EBCCF"/>' +
  (house
   ? '<path d="M17 53 L65 12 L113 53" stroke="#DE9160" ' +
     'stroke-width="11" fill="none" stroke-linejoin="round"/>'
   : '<rect x="20" y="20" width="90" height="12" rx="3" fill="#DFA374"/>') +
  '<rect x="22" y="' + (house?53:29) +
  '" width="86" height="' + (house?61:85) +
  '" rx="4" fill="' +
  (apartment?"#9AC9E8":house?"#F3CFAE":"#B7DDD6") +
  '"/>' + windows +
  '<rect x="57" y="91" width="18" height="23" rx="2" fill="#507B9E"/>' +
  '<circle cx="70" cy="103" r="1.4" fill="#FBE1A5"/>' +
  '</svg>';
}

function modal(title,html) {
 host.innerHTML =
  '<div class="ld-overlay" id="ldOverlay">' +
  '<section class="ld-modal" role="dialog" aria-modal="true">' +
  '<header class="ld-modal-head"><h2>' + esc(title) +
  '</h2><button class="ld-close" data-action="close" ' +
  'aria-label="Cerrar">×</button></header>' +
  '<div class="ld-modal-body">' + html + '</div>' +
  '</section></div>';
 host.querySelector(".ld-overlay").addEventListener(
  "click",e => {
   if(e.target.id === "ldOverlay") close();
  }
 );
}

function close() {
 host.replaceChildren();
 selectedFiles = [];
}

async function call(action,payload) {
 const {data:result,error} = await db.rpc(
  "gg_ld_v2_save",{p_action:action,p_data:payload}
 );
 if(error) throw error;
 return result;
}

async function refresh(quiet=false) {
 const {data:result,error} = await db.rpc("gg_ld_get");
 if(error) throw error;
 data = result;
 render();
 if(!quiet) toast("Datos actualizados");
}

function peopleOptions(value) {
 return '<option value="">Sin responsable</option>' +
 data.people.map(p =>
  '<option value="' + p.id + '"' +
  (p.id === value?' selected':'') + '>' +
  esc(p.full_name) + '</option>'
 ).join("");
}

function contact(asset) {
 return '<div class="ld-meta"><strong>👤 ' +
  esc(asset.responsible_name || "Sin responsable") +
  '</strong><small>☎ ' +
  esc(asset.responsible_phone || "Sin teléfono") +
  '</small></div>';
}

function render() {
 app.innerHTML = GG ? renderGG() : renderLO();
}

function renderGG() {
 const visible = data.assets.filter(a =>
  (a.name+" "+a.address).toLowerCase()
   .includes(search.toLowerCase())
 );

 return '<div class="ld-toolbar">' +
  '<button class="ld-btn ld-primary" data-action="people">' +
  '👥 Responsables</button>' +
  '<button class="ld-btn ld-accent" data-action="assets">' +
  '🏡 Bienes</button>' +
  '<input id="ldSearch" class="ld-search" ' +
  'placeholder="Buscar por nombre o dirección..." value="' +
  esc(search) + '">' +
  '<button class="ld-btn" data-action="refresh">↻ Actualizar</button>' +
  '</div><div class="ld-grid">' +
  (visible.map(a => {
   const tasks = data.tasks.filter(t => t.asset_id === a.id);
   const count = tasks.filter(t => t.status === "pendiente").length;

   return '<article class="ld-card">' +
    '<div class="ld-art">' + art(a.icon) + '</div>' +
    '<span class="ld-pill">' + esc(a.type) + '</span>' +
    '<h2 style="margin-top:12px">' + esc(a.name) + '</h2>' +
    '<p class="ld-address">📍 ' + esc(a.address) + '</p>' +
    contact(a) +
    '<label style="font-size:12px;font-weight:750">' +
    'Responsable asignado</label>' +
    '<select data-responsible="' + a.id + '">' +
    peopleOptions(a.responsible_id) + '</select>' +
    '<div class="ld-card-actions">' +
    '<button class="ld-btn ld-primary" data-action="tasks" ' +
    'data-id="' + a.id + '">🔔 Pendientes ' +
    '<span class="ld-count">' + count + '</span></button>' +
    '<button class="ld-btn" data-action="water" ' +
    'data-id="' + a.id + '">💧 Agua</button>' +
    '<button class="ld-btn" data-action="editAsset" ' +
    'data-id="' + a.id + '">✎</button>' +
    '</div></article>';
  }).join("") ||
  '<div class="ld-empty">Todavía no hay bienes. ' +
  'Pulsa «Bienes» para agregar el primero.</div>') +
  '</div>';
}

function renderLO() {
 const tasks = data.tasks.filter(t => {
  const asset = data.assets.find(a => a.id === t.asset_id);
  const text = (t.title+" "+(asset?.name||"")).toLowerCase();
  return t.status === filter &&
    text.includes(search.toLowerCase());
 });

 const pending = data.tasks.filter(
  t => t.status === "pendiente"
 ).length;

 const done = data.tasks.filter(
  t => t.status === "hecho"
 ).length;

 return '<div class="ld-toolbar">' +
  '<div class="ld-tabs">' +
  '<button data-action="filter" data-filter="pendiente" class="' +
  (filter==="pendiente"?"selected":"") + '">' +
  'Por atender (' + pending + ')</button>' +
  '<button data-action="filter" data-filter="hecho" class="' +
  (filter==="hecho"?"selected":"") + '">' +
  'Terminados (' + done + ')</button></div>' +
  '<input id="ldSearch" class="ld-search" ' +
  'placeholder="Buscar pendientes..." value="' +
  esc(search) + '">' +
  '<button class="ld-btn" data-action="refresh">↻ Actualizar</button>' +
  '</div>' +
  '<div style="max-width:950px">' +
  (tasks.map(t => {
   const a = data.assets.find(x => x.id === t.asset_id);
   return '<article class="ld-task-card ' +
    (t.status==="hecho"?"done":"") + '">' +
    '<div style="display:flex;justify-content:space-between;gap:12px">' +
    '<strong>' + esc(a?.name || "Bien") + '</strong>' +
    '<span class="ld-pill">' + esc(t.status) + '</span></div>' +
    '<p>' + esc(t.title) + '</p>' +
    '<small>📍 ' + esc(a?.address||"") + '</small><br>' +
    '<small>👤 ' + esc(a?.responsible_name||"Sin responsable") +
    ' · ☎ ' + esc(a?.responsible_phone||"Sin teléfono") + '</small>' +
    '<div style="margin-top:13px">' +
    '<button class="ld-btn ld-primary" data-action="loTask" ' +
    'data-id="' + t.id + '">Abrir seguimiento →</button></div>' +
    '</article>';
  }).join("") ||
  '<div class="ld-empty">No hay tareas en esta sección. ✨</div>') +
  '</div>';
}

/* =======================================================
   RESPONSABLES
======================================================= */

function peopleManager(editId=null) {
 const person = data.people.find(p=>p.id===editId);
 const colors = COLORS.map(color =>
  '<label class="ld-color" style="background:' + color + '">' +
  '<input type="radio" name="color" value="' + color + '"' +
  ((person?.color||COLORS[0])===color?' checked':'') +
  '></label>'
 ).join("");

 const tiles = data.people.map(p =>
  '<div class="ld-person-tile">' +
  '<div class="ld-avatar" style="background:' +
  esc(p.color) + '">👤</div>' +
  '<strong>' + esc(p.full_name) + '</strong>' +
  '<small>☎ ' + esc(p.phone) + '</small>' +
  '<button class="ld-btn" data-action="editPerson" ' +
  'data-id="' + p.id + '">Editar</button></div>'
 ).join("");

 const docs = person
  ? data.docs.filter(d=>d.person_id===person.id)
  : [];

 modal("Responsables",
  '<div class="ld-manager-grid">' +
  (tiles||'<p>No hay responsables todavía.</p>') +
  '</div><hr style="border:0;border-top:1px solid #DCE8F0">' +
  '<h3>' + (person?"Modificar responsable":"Nuevo responsable") +
  '</h3>' +
  '<form id="ldPersonForm" class="ld-form">' +
  '<input type="hidden" name="id" value="' +
  esc(person?.id||"") + '">' +
  '<div class="ld-two">' +
  '<label>Nombre completo<input name="full_name" required ' +
  'maxlength="180" value="' + esc(person?.full_name||"") + '">' +
  '</label><label>Número telefónico' +
  '<input name="phone" type="tel" value="' +
  esc(person?.phone||"") + '"></label></div>' +
  '<label>Color de identificación<div class="ld-colors">' +
  colors + '</div></label>' +
  '<label class="ld-drop" id="ldDrop">📁 ' +
  '<strong>Arrastra archivos aquí o pulsa para seleccionar</strong>' +
  '<small>PDF, imágenes y documentos · Máximo 10 MB</small>' +
  '<input id="ldFiles" type="file" multiple ' +
  'accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt" ' +
  'style="display:none"></label>' +
  '<div id="ldFileCount"></div>' +
  '<button class="ld-btn ld-primary" type="submit">' +
  'Guardar responsable</button></form>' +
  (person?'<h3>Expediente</h3>' +
   (docs.map(d =>
    '<div class="ld-doc"><span>📄 ' +
    esc(d.name) + '</span><div>' +
    '<button class="ld-btn" data-action="openDoc" ' +
    'data-path="' + esc(d.storage_path) + '">Ver</button>' +
    '<button class="ld-btn" data-action="deleteDoc" ' +
    'data-id="' + d.id + '">Eliminar</button>' +
    '</div></div>'
   ).join("")||'<p>Aún no hay archivos adjuntos.</p>') +
   '<p><button class="ld-btn" data-action="deletePerson" ' +
   'data-id="' + person.id +
   '">Eliminar responsable</button></p>':"")
 );
}

function assetManager(editId=null) {
 const a = data.assets.find(x=>x.id===editId);
 const icons = ICONS.map(([key,name]) =>
  '<label class="ld-icon-option"><input type="radio" ' +
  'name="icon" value="' + key + '"' +
  ((a?.icon||"local-small")===key?' checked':'') +
  '>' + art(key) +
  '<small>' + name + '</small></label>'
 ).join("");

 modal(a?"Modificar bien":"Bienes",
  '<div class="ld-manager-grid">' +
  data.assets.map(x =>
   '<div class="ld-person-tile">' +
   '<div style="height:80px">' + art(x.icon) + '</div>' +
   '<strong>' + esc(x.name) + '</strong>' +
   '<button class="ld-btn" data-action="editAsset" ' +
   'data-id="' + x.id + '">Editar</button></div>'
  ).join("") + '</div>' +
  '<h3>' + (a?"Modificar":"Dar de alta") + ' bien</h3>' +
  '<form id="ldAssetForm" class="ld-form">' +
  '<input type="hidden" name="id" value="' + esc(a?.id||"") + '">' +
  '<label>Nombre del bien<input name="name" required maxlength="180" ' +
  'value="' + esc(a?.name||"") + '"></label>' +
  '<label>Dirección<textarea name="address">' +
  esc(a?.address||"") + '</textarea></label>' +
  '<label>Tipo<select name="type">' +
  ["local","departamento","casa"].map(x =>
   '<option value="' + x + '"' +
   (a?.type===x?' selected':'') + '>' +
   x + '</option>'
  ).join("") + '</select></label>' +
  '<label>Responsable<select name="responsible_id">' +
  peopleOptions(a?.responsible_id) + '</select></label>' +
  '<strong>Elige una ilustración</strong>' +
  '<div class="ld-icons">' + icons + '</div>' +
  '<button class="ld-btn ld-primary" type="submit">' +
  'Guardar bien</button></form>' +
  (a?'<p><button class="ld-btn" data-action="deleteAsset" ' +
   'data-id="' + a.id +
   '">Eliminar bien</button></p>':"")
 );
}

/* =======================================================
   PENDIENTES Y FORO
======================================================= */

function taskPanel(assetId,taskId=null) {
 const a = data.assets.find(x=>x.id===assetId);
 if(!a) return;

 const tasks = data.tasks.filter(t=>t.asset_id===assetId)
  .sort((x,y) =>
   Number(x.status==="hecho")-Number(y.status==="hecho")
   || new Date(y.created_at)-new Date(x.created_at)
  );

 const selected = data.tasks.find(t=>t.id===taskId)
   || tasks[0];

 const list = tasks.map(t =>
  '<div class="ld-task-line ' +
  (t.status==="hecho"?"done":"") + '">' +
  '<strong>' + esc(t.title) + '</strong>' +
  '<p><span class="ld-pill">' +
  (t.status==="hecho"?"✓ Hecho":"Pendiente") +
  '</span> ' +
  (t.sent_at?'<small>Enviado a LO</small>':
   '<small>Solo Dirección</small>') + '</p>' +
  '<div class="ld-row-actions">' +
  '<button data-action="selectTask" data-id="' +
  t.id + '">Ver foro</button>' +
  (GG
   ? '<button data-action="editTask" data-id="' +
      t.id + '">Modificar</button>' +
      (!t.sent_at
       ? '<button data-action="sendTask" data-id="' +
         t.id + '">Enviar a LO</button>'
       : '')
   : '') +
  '</div></div>'
 ).join("");

 const updates = selected
  ? data.updates.filter(u=>u.task_id===selected.id)
  : [];

 modal("Pendientes · " + a.name,
  '<p class="ld-address">👤 ' +
  esc(a.responsible_name||"Sin responsable") +
  ' · ☎ ' + esc(a.responsible_phone||"Sin teléfono") +
  '</p><div class="ld-split">' +
  '<div class="ld-panel"><h3>📋 Pendientes</h3>' +
  '<div class="ld-list">' + list +
  (tasks.length?"":'<p>No hay pendientes.</p>') +
  '</div>' +
  (GG?'<form id="ldTaskForm" class="ld-form" ' +
   'style="margin-top:20px">' +
   '<input type="hidden" name="asset_id" value="' + a.id + '">' +
   '<label>Nuevo pendiente<textarea name="title" required ' +
   'placeholder="Describe lo que se necesita hacer..."></textarea></label>' +
   '<label>Estatus<select name="status">' +
   '<option value="pendiente">Pendiente</option>' +
   '<option value="hecho">Hecho</option>' +
   '</select></label>' +
   '<button class="ld-btn ld-primary">Agregar pendiente</button>' +
   '</form>':"") +
  '</div><div class="ld-panel">' +
  '<h3>💬 Actualizaciones</h3>' +
  (selected?'<p><strong>' + esc(selected.title) + '</strong></p>' +
   '<span class="ld-pill">' + esc(selected.status) + '</span>' +
   (GG?"":'<form id="ldStatusForm" class="ld-form" ' +
    'style="margin-top:15px">' +
    '<input type="hidden" name="id" value="' +
    selected.id + '">' +
    '<label>Estatus<select name="status">' +
    '<option value="pendiente"' +
    (selected.status==="pendiente"?" selected":"") +
    '>Pendiente</option><option value="hecho"' +
    (selected.status==="hecho"?" selected":"") +
    '>Hecho</option></select></label>' +
    '<button class="ld-btn">Guardar estatus</button></form>') +
   '<div style="margin-top:20px">' +
   updates.map(u =>
    '<div class="ld-post"><small>👤 ' +
    esc(u.author_email) + ' · ' +
    fmt(u.created_at) + '</small>' +
    '<p>' + esc(u.body) + '</p>' +
    '<div>' + (Array.isArray(u.photos)
      ? u.photos.map(path =>
        '<button class="ld-btn" data-action="openPhoto" ' +
        'data-path="' + esc(path) +
        '">📷 Ver fotografía</button>'
       ).join("")
      : "") + '</div></div>'
   ).join("") +
   (updates.length?"":'<p class="ld-address">Sin actualizaciones.</p>') +
   '</div>' +
   (!GG?'<form id="ldPostForm" class="ld-form">' +
    '<input type="hidden" name="task_id" value="' +
    selected.id + '">' +
    '<label>Comentario o retroalimentación' +
    '<textarea name="body" placeholder="Escribe qué se hizo, ' +
    'qué falta o cualquier observación..."></textarea></label>' +
    '<label>Fotografías<input type="file" name="photos" ' +
    'multiple accept="image/jpeg,image/png,image/webp"></label>' +
    '<button class="ld-btn ld-primary">Publicar actualización</button>' +
    '</form>':"")
   :'<p>Selecciona un pendiente para ver su foro.</p>') +
  '</div></div>'
 );
 host.dataset.asset = assetId;
 host.dataset.task = selected?.id||"";
}

function taskEditor(id) {
 const t = data.tasks.find(x=>x.id===id);
 if(!t) return;

 modal("Modificar pendiente",
  '<form id="ldTaskEditForm" class="ld-form">' +
  '<input type="hidden" name="id" value="' + t.id + '">' +
  '<label>Pendiente<textarea name="title" required>' +
  esc(t.title) + '</textarea></label>' +
  '<label>Estatus<select name="status">' +
  '<option value="pendiente"' +
  (t.status==="pendiente"?" selected":"") +
  '>Pendiente</option><option value="hecho"' +
  (t.status==="hecho"?" selected":"") +
  '>Hecho</option></select></label>' +
  '<button class="ld-btn ld-primary">Guardar cambios</button>' +
  '</form><p><button class="ld-btn" data-action="deleteTask" ' +
  'data-id="' + t.id + '">Eliminar pendiente</button></p>'
 );
}

/* =======================================================
   MEDICIONES DE AGUA
======================================================= */

function waterPanel(assetId,editId=null) {
 const a = data.assets.find(x=>x.id===assetId);
 const edit = data.water.find(x=>x.id===editId);

 const readings = data.water
  .filter(x=>x.asset_id===assetId)
  .sort((x,y) =>
   x.reading_date.localeCompare(y.reading_date)
   || x.created_at.localeCompare(y.created_at)
  );

 const rows = readings.map((w,i) => {
  const prev = readings[i-1];
  const delta = prev
   ? (Number(w.reading)-Number(prev.reading)).toFixed(3)
   : "—";

  return '<div class="ld-water-row">' +
   '<span>' + esc(w.reading_date) + '</span>' +
   '<strong>' + Number(w.reading).toFixed(3) + '</strong>' +
   '<span class="ld-water-value">💧 ' +
   delta + '</span>' +
   '<button class="ld-btn" data-action="editWater" ' +
   'data-id="' + w.id + '">Editar</button>' +
   '</div>';
 }).reverse().join("");

 modal("💧 Agua · " + a.name,
  '<p class="ld-address">Registra la lectura del medidor. ' +
  'El consumo se calcula restando la lectura anterior.</p>' +
  '<form id="ldWaterForm" class="ld-form">' +
  '<input type="hidden" name="id" value="' +
  esc(edit?.id||"") + '">' +
  '<input type="hidden" name="asset_id" value="' +
  assetId + '">' +
  '<div class="ld-two">' +
  '<label>Fecha de medición<input type="date" ' +
  'name="reading_date" required value="' +
  (edit?.reading_date||
   new Date().toISOString().slice(0,10)) + '"></label>' +
  '<label>Lectura actual<input type="number" step=".001" ' +
  'min="0" name="reading" required value="' +
  (edit?.reading??"") + '"></label></div>' +
  '<button class="ld-btn ld-primary">Guardar lectura</button>' +
  '</form><h3 style="margin-top:30px">Historial de mediciones</h3>' +
  (rows||'<p>No hay mediciones todavía.</p>') +
  (edit?'<button class="ld-btn" data-action="deleteWater" ' +
   'data-id="' + edit.id + '">Eliminar esta lectura</button>':"")
 );
 host.dataset.asset = assetId;
}

/* =======================================================
   ARCHIVOS PRIVADOS
======================================================= */

async function upload(file,folder,id) {
 if(file.size > 10*1024*1024) {
  throw Error("El archivo excede 10 MB: "+file.name);
 }

 const allowed = [
  "application/pdf","image/jpeg","image/png","image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
 ];

 if(!allowed.includes(file.type)) {
  throw Error("Tipo de archivo no permitido: "+file.name);
 }

 const ext = file.name.split(".").pop()
  .toLowerCase().replace(/[^a-z0-9]/g,"");

 const storagePath = folder + "/" + id + "/" +
  crypto.randomUUID() + "." + ext;

 const {error} = await db.storage
  .from("gg_ld_files")
  .upload(storagePath,file,{
   upsert:false,
   contentType:file.type
  });

 if(error) throw error;
 return storagePath;
}

async function openFile(storagePath) {
 const {data:link,error} = await db.storage
  .from("gg_ld_files")
  .createSignedUrl(storagePath,60);

 if(error) throw error;
 window.open(link.signedUrl,"_blank","noopener");
}

/* =======================================================
   INTERACCIONES Y FORMULARIOS
======================================================= */

document.addEventListener("input",e => {
 if(e.target.id==="ldSearch") {
  search=e.target.value;
  const pos=e.target.selectionStart;
  render();
  const input=$("#ldSearch");
  input.focus();
  input.setSelectionRange(pos,pos);
 }
});

document.addEventListener("change", async e => {
 const id=e.target.dataset.responsible;

 if(id && GG) {
  const a=data.assets.find(x=>x.id===id);
  if(!a)return;

  try {
   await call("asset_save",{
    id:a.id,name:a.name,address:a.address,
    type:a.type,icon:a.icon,
    responsible_id:e.target.value||null
   });
   await refresh(true);
   toast("Responsable asignado.");
  }catch(err){toast(err.message)}
 }

 if(e.target.id==="ldFiles") {
  selectedFiles=[...e.target.files];
  const node=$("#ldFileCount");
  if(node) node.textContent =
   selectedFiles.length+" archivo(s) seleccionado(s)";
 }
});

document.addEventListener("dragover",e => {
 if(e.target.closest("#ldDrop")) {
  e.preventDefault();
  e.target.closest("#ldDrop").classList.add("dragging");
 }
});

document.addEventListener("drop",e => {
 const drop=e.target.closest("#ldDrop");
 if(!drop) return;
 e.preventDefault();
 drop.classList.remove("dragging");
 selectedFiles=[...e.dataTransfer.files];
 const node=$("#ldFileCount");
 if(node)node.textContent =
  selectedFiles.length+" archivo(s) listo(s) para cargar";
});

document.addEventListener("click",async e => {
 const button=e.target.closest("[data-action]");
 if(!button)return;

 const action=button.dataset.action;
 const id=button.dataset.id;
 const storagePath=button.dataset.path;

 try {
  if(action==="close") return close();
  if(action==="people")return peopleManager();
  if(action==="assets")return assetManager();
  if(action==="editPerson")return peopleManager(id);
  if(action==="editAsset")return assetManager(id);
  if(action==="tasks")return taskPanel(id);
  if(action==="water")return waterPanel(id);
  if(action==="editTask")return taskEditor(id);
  if(action==="loTask") {
   const t=data.tasks.find(x=>x.id===id);
   return taskPanel(t.asset_id,id);
  }
  if(action==="selectTask") {
   const t=data.tasks.find(x=>x.id===id);
   return taskPanel(t.asset_id,id);
  }
  if(action==="editWater") {
   const w=data.water.find(x=>x.id===id);
   return waterPanel(w.asset_id,id);
  }
  if(action==="filter") {
   filter=button.dataset.filter;
   return render();
  }
  if(action==="refresh")return await refresh();
  if(action==="openDoc"||action==="openPhoto") {
   return await openFile(storagePath);
  }

  if(action==="sendTask") {
   if(!confirm("¿Enviar este pendiente a LO?"))return;
   await call("task_send",{id});
   await refresh(true);
   const t=data.tasks.find(x=>x.id===id);
   taskPanel(t.asset_id,id);
   return toast("Pendiente enviado a LO.");
  }

  const removes = {
   deletePerson:"person_delete",
   deleteAsset:"asset_delete",
   deleteTask:"task_delete",
   deleteWater:"water_delete",
   deleteDoc:"doc_delete"
  };

  if(removes[action]) {
   if(!confirm("¿Eliminar este registro?"))return;
   await call(removes[action],{id});
   close();
   await refresh(true);
   return toast("Registro eliminado.");
  }
 }catch(err) {
  console.error(err);
  toast(err.message);
 }
});

document.addEventListener("submit",async e => {
 const form=e.target;
 if(!form.getAttribute("id").startsWith("ld"))return;

 e.preventDefault();

 const button=form.querySelector('[type="submit"],button');
 if(button)button.disabled=true;

 const f=new FormData(form);
 const value=name=>String(f.get(name)||"").trim();

 try {
  if(form.getAttribute("id") ==="ldPersonForm") {
   const result=await call("person_save",{
    id:value("id")||null,
    full_name:value("full_name"),
    phone:value("phone"),
    color:value("color")||COLORS[0]
   });

   for(const file of selectedFiles) {
    const storagePath=await upload(
     file,"responsables",result.id
    );
    await call("doc_add",{
     person_id:result.id,
     name:file.name,
     storage_path:storagePath
    });
   }
   selectedFiles=[];
  }

  if(form.getAttribute("id") ==="ldAssetForm") {
   await call("asset_save",{
    id:value("id")||null,
    name:value("name"),
    address:value("address"),
    type:value("type"),
    icon:value("icon")||"local-small",
    responsible_id:value("responsible_id")||null
   });
  }

  if(form.getAttribute("id") ==="ldTaskForm"||
     form.getAttribute("id") ==="ldTaskEditForm") {
   await call("task_save",{
    id:value("id")||null,
    asset_id:value("asset_id")||null,
    title:value("title"),
    status:value("status")
   });
  }

  if(form.getAttribute("id") ==="ldWaterForm") {
   await call("water_save",{
    id:value("id")||null,
    asset_id:value("asset_id"),
    reading_date:value("reading_date"),
    reading:value("reading")
   });
  }

  if(form.getAttribute("id") ==="ldStatusForm") {
   await call("task_update",{
    id:value("id"),status:value("status")
   });
  }

  if(form.getAttribute("id") ==="ldPostForm") {
   const taskId=value("task_id");
   const photoInput=form.querySelector(
    'input[name="photos"]'
   );

   const photos=[];

   for(const file of [...photoInput.files].slice(0,5)) {
    if(!file.type.startsWith("image/"))
     throw Error("Solo fotografías en actualizaciones.");
    photos.push(await upload(file,"tasks",taskId));
   }

   await call("post_add",{
    task_id:taskId,
    body:value("body"),
    photos
   });
  }

  const taskId=host.dataset.task;
  const assetId=host.dataset.asset;
  const formId=form.id;

  close();
  await refresh(true);

  if(formId==="ldStatusForm"||
     formId==="ldPostForm") {
   const task=data.tasks.find(t=>
    t.id===(taskId||value("id")||value("task_id"))
   );
   if(task)taskPanel(task.asset_id,task.id);
  }

  toast("Guardado correctamente.");
 }catch(err) {
  console.error(err);
  toast("No se guardó: "+err.message);
 }finally {
  if(button)button.disabled=false;
 }
});

/* =======================================================
   SESIÓN Y PERMISOS
======================================================= */

async function start() {
 try {
  if(!db)throw Error("Cliente Supabase no disponible.");

  const {data:user,error}=await db.auth.getUser();
  if(error||!user?.user) {
   location.replace(GG?"index.html":"/");
   return;
  }

  await refresh(true);

  if(GG && data.mode!=="gg") {
   throw Error("Acceso exclusivo de Dirección.");
  }

  if(!GG && data.mode!=="lo") {
   throw Error("No tienes acceso operativo de LO.");
  }
 }catch(err) {
  app.innerHTML="";
  const div=document.createElement("div");
  div.className="ld-empty";
  div.textContent="No fue posible abrir el módulo: "+err.message;
  app.append(div);
 }
}

start();
})();
