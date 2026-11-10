/* GG_CULTURA_FIX_V2_EMAIL_YO */
/* GG CULTURA ORGANIZACIONAL V1 · independiza la interfaz, no la autenticación */
(() => {
  'use strict';
  const db = window.ggSupabase;
  const page = document.getElementById('ggCulturaApp');
  const yoMount = document.getElementById('ggSocialYoMount');
  const isYO = !page && !!yoMount;
  if (!page && !isYO) return;

  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const sessionToken = () => isYO ? sessionStorage.getItem('gg_intranet_token') || null : null;
  const state = {
    view:'menu', loading:false, ready:false, people:[], org:[], badges:[], awards:[],
    posts:[], meta:{}, media:{}, me:null, filter:'', badge:'', sort:'name', gallery:{},
    detail:null, notice:'', directoryError:false
  };
  let opened = false;
  let priorFocus = null;
  let pending = 0;

  const storageUrl = (bucket, pathname) => {
    if (!pathname || !db) return '';
    return db.storage.from(bucket).getPublicUrl(pathname).data.publicUrl || '';
  };
  const photo = p => storageUrl('employee-photos', p);
  const media = p => storageUrl('gg-social-media', p);
  const photoHTML = (p, cls) => p ? '<img class="' + cls + '" src="' + esc(photo(p)) + '" alt="" loading="lazy">' : '<span class="ggc-initials">✳</span>';
  const tokenArgs = () => ({p_session_token:sessionToken()});
  async function rpc(name, args) {
    const {data,error} = await db.rpc(name,args);
    if (error) throw error;
    return data;
  }
  const main = () => isYO ? $('ggCulturaOverlay') : page;
  const today = () => new Date();
  const safeDate = value => {
    if (!value) return null;
    const raw = String(value).slice(0,10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const date = new Date(raw+'T12:00:00');
    return Number.isNaN(date.valueOf()) ? null : date;
  };
  function dateLabel(value) {
    const d = safeDate(value);
    return d ? new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',year:'numeric'}).format(d) : 'No registrada';
  }
  function tenure(value) {
    const d = safeDate(value);
    if (!d) return 'Sin fecha de ingreso';
    const n = today();
    let years = n.getFullYear()-d.getFullYear();
    let months = n.getMonth()-d.getMonth();
    if (n.getDate()<d.getDate()) months--;
    if (months<0) {years--;months+=12;}
    if (years<0) return 'Fecha por confirmar';
    return (years ? years+' año'+(years===1?'':'s') : '') +
      (years && months ? ' y ' : '') +
      (months ? months+' mes'+(months===1?'':'es') : '') || 'Menos de un mes';
  }
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const employee = id => state.people.find(p=>p.id===id);
  const badgeById = id => state.badges.find(b=>b.id===id);
  function awardsOf(id) {
    return state.awards.filter(a=>a.employee_id===id).sort((a,b)=>
      String(b.award_month||'').localeCompare(String(a.award_month||'')) ||
      String(b.created_at||'').localeCompare(String(a.created_at||'')));
  }
  function mediaOf(post) {
    const list = state.media?.[post.id];
    return Array.isArray(list) ? list : post.image_path ? [{path:post.image_path,kind:'image',name:'Fotografía'}] : [];
  }
  function badgeStrip(id, count) {
    const list = awardsOf(id).slice(0,count);
    if (!list.length) return '<span class="ggc-no-awards">Aún sin reconocimientos</span>';
    return '<div class="ggc-badges">'+list.map(a=>{
      const b=badgeById(a.badge_id);
      if (!b) return '';
      const title=b.name+' · '+String(a.award_month||'').slice(0,7);
      return '<span class="ggc-badge" title="'+esc(title)+'">'+(b.image_path?'<img src="'+esc(media(b.image_path))+'" alt="'+esc(b.name)+'" loading="lazy">':'✳')+'</span>';
    }).join('')+'</div>';
  }
  function employeeData(p) {
    const row=state.meta[p.id] || {};
    const parent=state.org.find(n=>n.employee_id===p.id)?.parent_id;
    const manager=employee(parent || row.reports_to_id);
    return {joined:row.joined_at||null,manager:manager?.name||null,email:row.email||null};
  }

  function menuCards(compact) {
    const sizes=compact?' ggc-options-small':'';
    return '<div class="ggc-options'+sizes+'">'+
      '<button class="ggc-option" type="button" data-ggc="org"><span class="ggc-option-number">01 / ESTRUCTURA</span><span class="ggc-option-icon">⌘</span><strong>Organigrama</strong><small>Encuentra tu lugar en el equipo y explora.</small><span class="ggc-option-arrow">↗</span></button>'+
      '<button class="ggc-option" type="button" data-ggc="people"><span class="ggc-option-number">02 / PERSONAS</span><span class="ggc-option-icon">✳</span><strong>Empleados y reconocimientos</strong><small>Conoce a tus compañeros y celebra sus logros.</small><span class="ggc-option-arrow">↗</span></button>'+
      '<button class="ggc-option" type="button" data-ggc="forum"><span class="ggc-option-number">03 / COMUNIDAD</span><span class="ggc-option-icon">◈</span><strong>Foro Gutiérrez</strong><small>Momentos, historias, noticias y comunicados.</small><span class="ggc-option-arrow">↗</span></button>'+
    '</div>';
  }
  function menu() {
    return '<div class="ggc-landing"><span class="ggc-eyebrow">GRUPO GUTIÉRREZ / NUESTRO EQUIPO</span>'+ 
      '<h1>La cultura la <em>hacemos</em> todos<span>.</span></h1>'+ 
      '<p>Portal de empleados de Grupo Gutierrez.</p>'+ 
      '<div class="ggc-landing-orb" aria-hidden="true"></div>'+menuCards(isYO)+
      '<div class="ggc-landing-foot">PERSONAS · CONEXIONES · RECONOCIMIENTOS</div></div>';
  }
  function toolbar(title, subtitle) {
    return '<div class="ggc-toolbar"><button type="button" class="ggc-back" data-ggc="menu">← Explorar cultura</button><div><span class="ggc-eyebrow">CULTURA ORGANIZACIONAL</span><h2>'+esc(title)+'</h2><p>'+esc(subtitle)+'</p></div></div>';
  }
  function peopleShell() {
    return toolbar('Empleados y reconocimientos','Conoce a quienes construyen Grupo Gutiérrez cada día.')+
      '<div class="ggc-filterbar"><label class="ggc-search"><span>⌕</span><input id="ggcSearch" type="search" placeholder="Buscar nombre, puesto, empresa o correo…" value="'+esc(state.filter)+'" autocomplete="off"></label>'+ 
      '<label class="ggc-select">Insignia<select id="ggcBadgeFilter"><option value="">Todas las insignias</option>'+state.badges.map(b=>'<option value="'+esc(b.id)+'"'+(state.badge===b.id?' selected':'')+'>'+esc(b.name)+'</option>').join('')+'</select></label>'+ 
      '<label class="ggc-select">Orden<select id="ggcSort"><option value="name"'+(state.sort==='name'?' selected':'')+'>Nombre A–Z</option><option value="new"'+(state.sort==='new'?' selected':'')+'>Más nuevos primero</option><option value="old"'+(state.sort==='old'?' selected':'')+'>Más antiguos primero</option></select></label></div>'+ 
      (state.directoryError?'<p class="ggc-note">Las fechas de ingreso no están disponibles. Comprueba que instalaste el SQL de Cultura Organizacional.</p>':'')+
      '<div id="ggcCount" class="ggc-count"></div><div id="ggcEmployeeGrid" class="ggc-employee-grid"></div>';
  }
  function drawPeople() {
    const host=$('ggcEmployeeGrid');
    if (!host) return;
    const q=norm(state.filter);
    const filtered=state.people.filter(p=>{
      if (q && !norm(p.name+' '+p.position+' '+p.company+' '+(state.meta[p.id]?.email||'')).includes(q)) return false;
      if (state.badge && !state.awards.some(a=>a.employee_id===p.id && a.badge_id===state.badge)) return false;
      return true;
    }).slice();
    filtered.sort((a,b)=>{
      const ad=state.meta[a.id]?.joined_at||'';
      const bd=state.meta[b.id]?.joined_at||'';
      if (state.sort==='new') return (!ad)-(!bd) || bd.localeCompare(ad) || a.name.localeCompare(b.name,'es');
      if (state.sort==='old') return (!ad)-(!bd) || ad.localeCompare(bd) || a.name.localeCompare(b.name,'es');
      return a.name.localeCompare(b.name,'es');
    });
    const count=$('ggcCount');
    if (count) count.textContent=filtered.length+' '+(filtered.length===1?'persona':'personas');
    host.innerHTML=filtered.length?filtered.map((p,i)=>{
      const info=employeeData(p);
      return '<button class="ggc-employee" type="button" data-ggc="detail" data-id="'+esc(p.id)+'" style="--ggc-i:'+Math.min(i,15)+'">'+
        '<span class="ggc-employee-top"><span class="ggc-employee-photo">'+photoHTML(p.photo,'ggc-employee-image')+'</span><span class="ggc-employee-name"><strong>'+esc(p.name)+'</strong><small>'+esc(p.position||'Puesto no indicado')+'</small></span></span>'+ 
        '<span class="ggc-employee-date">Ingreso <b>'+esc(dateLabel(info.joined))+'</b></span>'+(info.email?'<span class="ggc-employee-email" title="'+esc(info.email)+'">✉ '+esc(info.email)+'</span>':'')+badgeStrip(p.id,5)+
        '<span class="ggc-employee-more">Ver perfil <span>↗</span></span></button>';
    }).join(''):'<div class="ggc-empty">No encontramos empleados con esos filtros. Prueba otra búsqueda.</div>';
  }
  function detailHTML(id) {
    const p=employee(id);
    if (!p) return '';
    const info=employeeData(p);
    const awards=awardsOf(id);
    return '<div class="ggc-detail-shade" data-ggc="detail-close"></div><section class="ggc-detail" role="dialog" aria-modal="true" aria-label="Perfil de empleado">'+
      '<button class="ggc-detail-close" type="button" data-ggc="detail-close">× Cerrar</button>'+ 
      '<div class="ggc-detail-top"><div class="ggc-detail-portrait">'+photoHTML(p.photo,'ggc-detail-photo')+'</div><div><span class="ggc-eyebrow">NUESTRO EQUIPO</span><h2>'+esc(p.name)+'</h2><p>'+esc(p.position||'Sin puesto')+'</p><small>'+esc(p.company||'Grupo Gutiérrez')+'</small></div></div>'+ 
      '<div class="ggc-detail-facts"><div><small>FECHA DE INGRESO</small><strong>'+esc(dateLabel(info.joined))+'</strong></div><div><small>ANTIGÜEDAD</small><strong>'+esc(tenure(info.joined))+'</strong></div><div><small>REPORTA A</small><strong>'+esc(info.manager||'No registrado')+'</strong></div></div>'+ 
      (info.email?'<div class="ggc-profile-email"><small>CORREO ASIGNADO</small><strong>'+esc(info.email)+'</strong></div>':'')+
      '<div class="ggc-detail-awards"><span class="ggc-eyebrow">RECONOCIMIENTOS</span><h3>Todas sus insignias <small>('+awards.length+')</small></h3>'+ 
      (awards.length?'<div class="ggc-detail-award-list">'+awards.map(a=>{const b=badgeById(a.badge_id);if(!b)return '';return '<div class="ggc-detail-award"><span>'+(b.image_path?'<img src="'+esc(media(b.image_path))+'" alt="">':'✳')+'</span><div><strong>'+esc(b.name)+'</strong><small>'+esc(String(a.award_month||'').slice(0,7))+'</small></div></div>';}).join('')+'</div>':'<p>Aún no se han asignado insignias.</p>')+'</div></section>';
  }

  function forumShell() {
    return toolbar('Foro Gutiérrez','Las historias y momentos que nos unen.')+
      '<div class="ggc-forum-layout"><aside class="ggc-forum-side"><span class="ggc-eyebrow">COMUNIDAD</span><h3>:).</h3><p>Conoce el orgullo de pertenecer a grupo gutierrez.</p><div class="ggc-forum-stat"><strong>'+state.posts.length+'</strong><span>Publicaciones</span></div></aside><div class="ggc-feed">'+
      (state.posts.length?state.posts.map(postHTML).join(''):'<div class="ggc-empty">Recursos Humanos aún no ha publicado novedades.</div>')+
      '</div></div>';
  }
  function postHTML(p) {
    const files=mediaOf(p);
    const photos=files.filter(f=>f.kind==='image');
    const pdfs=files.filter(f=>f.kind==='pdf');
    const n=photos.length;
    const i=n?((state.gallery[p.id]||0)%n):0;
    return '<article class="ggc-post" data-post="'+esc(p.id)+'"><header class="ggc-post-head"><span class="ggc-post-avatar">GG</span><span><strong>Grupo Gutiérrez <span class="ggc-verified">✦</span></strong><small>Recursos Humanos · '+esc(dateLabel(p.created_at))+'</small></span><span class="ggc-post-dots">•••</span></header>'+ 
      '<div class="ggc-post-media" data-frame="'+esc(p.id)+'">'+(n?'<button type="button" class="ggc-cover" data-ggc="photo" data-id="'+esc(p.id)+'" aria-label="Ver foto completa"><img src="'+esc(media(photos[i].path))+'" alt="'+esc(p.title)+'" loading="lazy"></button>':'<div class="ggc-post-art"><span>GG ✳</span><small>UNA CULTURA EN COMÚN</small></div>')+
      (n>1?'<button type="button" class="ggc-frame-prev" data-ggc="prev" data-id="'+esc(p.id)+'" aria-label="Fotografía anterior">‹</button><button type="button" class="ggc-frame-next" data-ggc="next" data-id="'+esc(p.id)+'" aria-label="Fotografía siguiente">›</button><span class="ggc-frame-count">'+(i+1)+' / '+n+'</span>':'')+'</div>'+ 
      '<div class="ggc-post-content"><div class="ggc-post-actions"><button type="button" data-ggc="like" data-id="'+esc(p.id)+'" aria-label="Me gusta" class="'+(p.liked?'liked':'')+'">'+(p.liked?'♥':'♡')+'</button><button type="button" data-ggc="likes" data-id="'+esc(p.id)+'" class="ggc-likes-text">'+Number(p.likes||0)+' me gusta</button></div><h3>'+esc(p.title)+'</h3><p>'+esc(p.body)+'</p>'+ 
      (pdfs.length?'<div class="ggc-docs">'+pdfs.map(f=>'<a href="'+esc(media(f.path))+'" target="_blank" rel="noopener noreferrer"><span>▤</span><strong>'+esc(f.name||'Documento PDF')+'</strong><small>Abrir PDF ↗</small></a>').join('')+'</div>':'')+'</div></article>';
  }
  function updateFrame(id) {
    const p=state.posts.find(x=>x.id===id);
    if(!p)return;
    const photos=mediaOf(p).filter(f=>f.kind==='image');
    const frame=[...document.querySelectorAll('[data-frame]')].find(x=>x.dataset.frame===id);
    if(!frame||!photos.length)return;
    const i=state.gallery[id]||0;
    const img=frame.querySelector('.ggc-cover img');
    const text=frame.querySelector('.ggc-frame-count');
    if(img)img.src=media(photos[i].path);
    if(text)text.textContent=(i+1)+' / '+photos.length;
  }
  function movePhoto(id,step) {
    const p=state.posts.find(x=>x.id===id);
    if(!p)return;
    const photos=mediaOf(p).filter(f=>f.kind==='image');
    if(!photos.length)return;
    state.gallery[id]=((state.gallery[id]||0)+step+photos.length)%photos.length;
    updateFrame(id);
    const box=$('ggcLightbox');
    if(box?.dataset.post===id) showLightbox(id);
  }
  function showLightbox(id) {
    const p=state.posts.find(x=>x.id===id);
    if(!p)return;
    const photos=mediaOf(p).filter(f=>f.kind==='image');
    if(!photos.length)return;
    const i=state.gallery[id]||0;
    let node=$('ggcLightbox');
    if(!node){node=document.createElement('div');node.id='ggcLightbox';document.body.append(node);}
    node.dataset.post=id;
    node.innerHTML='<div class="ggc-light-bg" data-ggc="light-close"></div><div class="ggc-light-content" role="dialog" aria-modal="true"><button type="button" data-ggc="light-close" class="ggc-light-close">× Cerrar</button><img src="'+esc(media(photos[i].path))+'" alt="'+esc(p.title)+'">'+(photos.length>1?'<button type="button" data-ggc="light-prev" class="ggc-light-prev">‹</button><button type="button" data-ggc="light-next" class="ggc-light-next">›</button>':'')+'<small>'+(i+1)+' / '+photos.length+'</small></div>';
  }
  function closeFloating() {
    $('ggcLightbox')?.remove();
    $('ggcDetailDialog')?.remove();
    $('ggcLikesDialog')?.remove();
  }
  function showDetail(id) {
    $('ggcDetailDialog')?.remove();
    const node=document.createElement('div');
    node.id='ggcDetailDialog';
    node.innerHTML=detailHTML(id);
    document.body.append(node);
  }
  function showLikes(rows) {
    $('ggcLikesDialog')?.remove();
    const node=document.createElement('div');
    node.id='ggcLikesDialog';
    node.innerHTML='<div class="ggc-detail-shade" data-ggc="likes-close"></div><section class="ggc-likes-sheet" role="dialog" aria-modal="true"><button type="button" data-ggc="likes-close">× Cerrar</button><h3>Personas a quienes les gusta</h3>'+(rows.length?rows.map(p=>'<p><strong>'+esc(p.name)+'</strong><small>'+esc(p.position)+'</small></p>').join(''):'<p>Esta publicación aún no tiene me gusta.</p>')+'</section>';
    document.body.append(node);
  }

  function draw() {
    const root=main();
    if(!root)return;
    const inner=state.view==='menu'?menu():state.loading?toolbar('Explorando cultura','')+'<div class="ggc-loading">Conectando con nuestro equipo…</div>':state.notice?toolbar('Cultura organizacional','')+'<div class="ggc-empty">'+esc(state.notice)+'<button type="button" data-ggc="retry">Reintentar</button></div>':state.view==='people'?peopleShell():forumShell();
    if(isYO){
      root.innerHTML='<div class="ggc-scrim" data-ggc="close"></div><section class="ggc-popup '+(state.view==='menu'?'ggc-popup-menu':'ggc-popup-view')+'" role="dialog" aria-modal="true" aria-label="Cultura Organizacional"><div class="ggc-popup-top"><span>GG ✳ &nbsp; CULTURA ORGANIZACIONAL</span><button type="button" data-ggc="close" aria-label="Cerrar ventana">×</button></div><div class="ggc-popup-scroll">'+inner+'</div></section>';
    }else{
      root.innerHTML=inner;
    }
    if(state.view==='people'&&!state.loading&&!state.notice) drawPeople();
  }
  async function fetchCulture() {
    if(!db)throw Error('La conexión a Grupo Gutiérrez no está disponible.');
    if(isYO&&!sessionToken())throw Error('Inicia sesión en YO con tu usuario asignado por RH.');
    const data=await rpc('gg_social_snapshot',tokenArgs());
    state.people=data?.people||[];state.org=data?.org||[];
    state.badges=data?.badges||[];state.awards=data?.awards||[];
    state.posts=data?.posts||[];state.me=data?.me||null;
    const responses=await Promise.allSettled([
      rpc('gg_cultura_directory',tokenArgs()),
      rpc('gg_social_post_media_list',tokenArgs()),
      rpc('gg_cultura_employee_emails',tokenArgs())
    ]);
    state.meta={};
    state.directoryError=responses[0].status==='rejected';
    if(responses[0].status==='fulfilled'){
      const items=responses[0].value?.people||[];
      for(const p of items)if(p?.id)state.meta[p.id]=p;
    } else console.warn('[Cultura] Directorio:',responses[0].reason?.message);
    // Correos opcionales: si falla el SQL, Cultura sigue funcionando.
    if(responses[2]?.status==='fulfilled'){
      for(const [id,email] of Object.entries(responses[2].value||{})){
        if(typeof email!=='string'||!email.trim())continue;
        if(!state.meta[id])state.meta[id]={id};
        state.meta[id].email=email.trim();
      }
    }else if(responses[2]?.status==='rejected'){
      console.warn('[Cultura] Correos no disponibles:',responses[2].reason?.message);
    }
    state.media=responses[1].status==='fulfilled'?(responses[1].value||{}):{};
    if(responses[1].status==='rejected')console.warn('[Cultura] Galería:',responses[1].reason?.message);
    state.ready=true;
  }
  async function openView(view) {
    if(view==='org'){
      if(isYO){
        closePopup();
        const old=$('ggsYoButtons')?.querySelector('[data-social="yo-org"]');
        if(old)old.click();
        else alert('El organigrama de YO aún no ha terminado de cargar. Intenta de nuevo.');
      }else window.location.assign('organigrama-empleados.html');
      return;
    }
    state.view=view;
    state.loading=true;
    state.notice='';
    closeFloating();
    draw();
    const serial=++pending;
    try{await fetchCulture();if(serial!==pending)return;state.loading=false;draw();}
    catch(e){if(serial!==pending)return;state.loading=false;state.notice=e?.message||'No se pudo cargar la información.';draw();console.error('[Cultura]',e);}
  }
  function openPopup() {
    if(!isYO)return;
    if(!$('yoContent')?.classList.contains('ready') || !sessionToken()){
      alert('Primero inicia sesión en YO con tus credenciales de RH.');return;
    }
    priorFocus=document.activeElement;
    opened=true;
    state.view='menu';state.notice='';state.loading=false;
    if(!$('ggCulturaOverlay')){
      const node=document.createElement('div');node.id='ggCulturaOverlay';node.className='ggc-overlay';document.body.append(node);
    }
    document.body.classList.add('ggc-popup-active');
    draw();
    $('ggCulturaOverlay')?.querySelector('[data-ggc="close"]')?.focus();
  }
  function closePopup() {
    ++pending;opened=false;closeFloating();
    $('ggCulturaOverlay')?.remove();
    document.body.classList.remove('ggc-popup-active');
    if(priorFocus?.isConnected)priorFocus.focus();
  }
  async function onAction(node) {
    const action=node.dataset.ggc;
    const id=node.dataset.id;
    if(action==='close'){closePopup();return;}
    if(action==='menu'){state.view='menu';state.loading=false;state.notice='';++pending;closeFloating();draw();return;}
    if(action==='org'||action==='people'||action==='forum'){await openView(action);return;}
    if(action==='retry'){await openView(state.view);return;}
    if(action==='detail'){showDetail(id);return;}
    if(action==='detail-close'){$('ggcDetailDialog')?.remove();return;}
    if(action==='likes-close'){$('ggcLikesDialog')?.remove();return;}
    if(action==='prev'||action==='next'){movePhoto(id,action==='next'?1:-1);return;}
    if(action==='photo'){showLightbox(id);return;}
    if(action==='light-close'){$('ggcLightbox')?.remove();return;}
    if(action==='light-prev'||action==='light-next'){
      const box=$('ggcLightbox');if(box)movePhoto(box.dataset.post,action==='light-next'?1:-1);return;
    }
    if(action==='like'){
      node.disabled=true;
      try{
        await rpc('gg_social_toggle_like',{p_session_token:sessionToken(),p_post_id:id});
        const snap=await rpc('gg_social_snapshot',tokenArgs());
        state.posts=snap.posts||[];
        const scroller=isYO?main()?.querySelector('.ggc-popup-scroll'):window;
        const y=isYO?(scroller?.scrollTop||0):window.scrollY;
        draw();
        requestAnimationFrame(()=>{if(isYO){const el=main()?.querySelector('.ggc-popup-scroll');if(el)el.scrollTop=y;}else window.scrollTo(0,y);});
      }catch(e){alert('No se pudo registrar el Me gusta: '+(e?.message||e));node.disabled=false;}
      return;
    }
    if(action==='likes'){
      try{const rows=await rpc('gg_social_like_names',{p_session_token:sessionToken(),p_post_id:id});showLikes(rows||[]);}
      catch(e){alert('No fue posible consultar los Me gusta: '+(e?.message||e));}
    }
  }
  document.addEventListener('click',e=>{
    const node=e.target.closest('[data-ggc]');
    if(!node)return;
    if(!page&&!isYO)return;
    e.preventDefault();
    void onAction(node);
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='ggcSearch'){state.filter=e.target.value;drawPeople();}
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='ggcBadgeFilter'){state.badge=e.target.value;drawPeople();}
    if(e.target.id==='ggcSort'){state.sort=e.target.value;drawPeople();}
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if($('ggcLightbox')){$('ggcLightbox').remove();return;}
      if($('ggcDetailDialog')){$('ggcDetailDialog').remove();return;}
      if($('ggcLikesDialog')){$('ggcLikesDialog').remove();return;}
      if(isYO&&opened)closePopup();
      return;
    }
    if(!$('ggcLightbox'))return;
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      e.preventDefault();const id=$('ggcLightbox')?.dataset.post;if(id)movePhoto(id,e.key==='ArrowRight'?1:-1);
    }
  });
  let swipe=null;
  document.addEventListener('pointerdown',e=>{
    const frame=e.target.closest('.ggc-post-media');
    if(frame&&e.pointerType==='touch')swipe={id:frame.dataset.frame,x:e.clientX};
  },true);
  document.addEventListener('pointerup',e=>{
    if(!swipe||e.pointerType!=='touch')return;
    const item=swipe;swipe=null;
    if(Math.abs(e.clientX-item.x)>55)movePhoto(item.id,e.clientX<item.x?1:-1);
  },true);
  function initYO() {
    if(!yoMount)return;
    let button=$('ggcYoTrigger');
    if(!button){
      button=document.createElement('button');
      button.id='ggcYoTrigger';button.type='button';button.className='ggc-yo-trigger';
      button.innerHTML='<span>✳</span><span><strong>Cultura Organizacional</strong><small>Organigrama · Personas · Foro</small></span><b>↗</b>';
      button.addEventListener('click',openPopup);
      yoMount.insertAdjacentElement('afterend', button);
    }
    if (button.parentElement === yoMount) {
      yoMount.insertAdjacentElement('afterend', button);
    }
    document.body.classList.add('ggc-yo-enhanced');
  }
  async function initPage() {
    if(!db){page.innerHTML='<div class="ggc-empty">No se pudo iniciar la conexión al sistema.</div>';return;}
    try{
      const {data,error}=await db.auth.getUser();
      if(error||!data?.user)throw Error('Accede primero al Sistema Central con tu cuenta.');
      draw();
    }catch(e){page.innerHTML='<div class="ggc-empty">'+esc(e.message)+' <a href="index.html">Ir al inicio →</a></div>';}
  }
  if(isYO)initYO();else void initPage();
})();
