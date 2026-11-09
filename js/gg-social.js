/* GG · ORGANIGRAMA / INSIGNIAS / FORO V1 */
(() => {
"use strict";

const db = window.ggSupabase;
const $ = id => document.getElementById(id);

const esc = x => String(x ?? "").replace(
  /[&<>"']/g,
  c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c])
);

const root =
  $("ggSocialRH") ||
  $("ggSocialStandalone") ||
  $("ggSocialYoMount") ||
  $("ggSocialProfileMount");

if (!root || !db) return;

const mode = $("ggSocialRH")
  ? "rh"
  : $("ggSocialStandalone")
    ? "module"
    : $("ggSocialYoMount")
      ? "yo"
      : "profile";

if(mode==="module")document.body.classList.add("ggv5-module");

const token = () => mode === "yo"
  ? sessionStorage.getItem("gg_intranet_token") || null
  : null;

const state = {
  people: [],
  org: [],
  badges: [],
  awards: [],
  posts: [],
  me: null,
  pick: null,
  edit: null,
  zoom: 1,
  x: 0,
  y: 0,
  filter: "",
  drawer: false,
  busy: false,
  modal: null
};

const person = id =>
  state.people.find(e => e.id === id);

const badge = id =>
  state.badges.find(b => b.id === id);

const awardList = id =>
  state.awards
    .filter(a => a.employee_id === id)
    .sort(
      (a,b) =>
        String(b.award_month)
          .localeCompare(String(a.award_month)) ||
        String(b.created_at)
          .localeCompare(String(a.created_at))
    );

function month(value) {
  if (!value) return "";

  const [year, m] = String(value)
    .slice(0,7)
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "es-MX",
    {month:"long",year:"numeric"}
  ).format(new Date(year,m-1,1));
}

const photo = value => value
  ? db.storage
      .from("employee-photos")
      .getPublicUrl(value).data.publicUrl
  : "";

const media = value => value
  ? db.storage
      .from("gg-social-media")
      .getPublicUrl(value).data.publicUrl
  : "";

function image(src,alt,cls) {
  return src
    ? '<img class="' + cls +
      '" src="' + esc(src) +
      '" alt="' + esc(alt) +
      '" loading="lazy">'
    : '<span class="ggs-initials">✳</span>';
}

function say(message,bad=false) {
  let node = $("ggSocialToast");

  if (!node) {
    node = document.createElement("div");
    node.id = "ggSocialToast";
    document.body.append(node);
  }

  node.className =
    "ggs-toast" + (bad ? " error" : "");

  node.textContent = message;

  clearTimeout(say.timer);
  say.timer = setTimeout(
    () => node.remove(),
    5400
  );
}

function showError(e) {
  say(e?.message || String(e),true);
  console.error("[GG Social]",e);
}

async function rpc(name,args) {
  const {data,error} = await db.rpc(name,args);
  if (error) throw error;
  return data;
}
async function load() {
  const data = await rpc(
    'gg_social_snapshot',
    {p_session_token:token()}
  );

  state.people = data.people || [];
  state.org = data.org || [];
  state.badges = data.badges || [];
  state.awards = data.awards || [];
  state.posts = data.posts || [];
  state.me = data.me || null;

  try {
    state.postMedia = await rpc(
      'gg_social_post_media_list',
      {p_session_token:token()}
    ) || {};

  } catch (e) {
    console.warn(
      '[GG Foro] No se pudo consultar multimedia:',
      e?.message
    );

    state.postMedia = {};
  }

  render();
}



async function change(action,data) {
  if (state.busy) return false;

  state.busy = true;

  try {
    await rpc("gg_social_rh_change",{
      p_action:action,
      p_data:data
    });

    await load();
    say("Cambios guardados correctamente");
    return true;

  } catch(e) {
    showError(e);
    return false;

  } finally {
    state.busy = false;
  }
}

/* ============================================
   INSIGNIAS REUTILIZABLES
============================================ */

function badgeStrip(id,all=false) {
  let rows = awardList(id);

  if (!all) rows = rows.slice(0,3);

  if (!rows.length) {
    return '<span class="ggs-muted">' +
      'Sin insignias todavía</span>';
  }

  return '<div class="ggs-badges">' +
    rows.map(a => {
      const b = badge(a.badge_id);
      if (!b) return "";

      const title =
        b.name + " (" + month(a.award_month) + ")";

      return '<span tabindex="0" role="button"' +
        ' class="ggs-medal"' +
        ' data-social="badge-hint"' +
        ' data-hint="' + esc(title) + '"' +
        ' title="' + esc(title) + '"' +
        ' aria-label="' + esc(title) + '">' +
        image(
          media(b.image_path),
          title,
          "ggs-medal-img"
        ) +
        '</span>';
    }).join("") +
    '</div>';
}

function heading(kicker,title,description) {
  return '<div class="ggs-heading"><div>' +
    '<small>' + esc(kicker) + '</small>' +
    '<h2>' + esc(title) + '</h2>' +
    '<p>' + esc(description) + '</p>' +
    '</div></div>';
}

function personCard(p,attrs="") {
  return '<button class="ggs-person"' +
    ' type="button" ' + attrs + '>' +
    '<span class="ggs-person-pic">' +
    image(photo(p.photo),p.name,"ggs-photo") +
    '</span><strong>' + esc(p.name) +
    '</strong><small>' + esc(p.position) +
    '</small><span>' + esc(p.company || "") +
    '</span></button>';
}

/* ============================================
   INICIALIZAR VISTAS
============================================ */

function initShell() {
  if (mode === "rh") {
    $("ggSocialRH").innerHTML =
      '<div id="ggsRhOrg"></div>' +
      '<div id="ggsRhDrawer"></div>';

    $("ggSocialBadgesRH").innerHTML =
      '<div id="ggsBadgesView"></div>';

    $("ggSocialForumRH").innerHTML =
      '<div id="ggsForumView"></div>';

  } else if (mode === "module") {
    root.innerHTML =
      '<div id="ggsModuleOrg"></div>';

  } else if (mode === "yo") {
    root.innerHTML =
      '<div id="ggsYoButtons" class="ggs-yo-buttons">' +
      '<button type="button" data-social="yo-org">' +
      '◈ Organigrama</button>' +
      '<button type="button" data-social="yo-forum">' +
      '✦ Foro Gutiérrez</button></div>';

    // Fuera del contenido de YO para evitar
    // problemas con z-index del encabezado.
    if (!$("ggsYoPopup")) {
      const popup = document.createElement("div");
      popup.id = "ggsYoPopup";
      popup.className = "ggs-app";
      document.body.append(popup);
    }

  } else {
    root.innerHTML =
      '<div id="ggsProfileBadges"></div>';
  }
}

function render() {
  if (mode === "rh") {
    renderOrg("ggsRhOrg",true);
    renderBadges();
    renderForum("ggsForumView",true);
    renderDrawer();

  } else if (mode === "module") {
    renderOrg("ggsModuleOrg",false);

  } else if (mode === "yo") {
    renderYoBadges();
    renderYoPanel();
    renderNotifications();

  } else {
    renderProfile();
  }
}

/* ============================================
   MOTOR DE ORGANIGRAMA
   DISTRIBUCIÓN AUTOMÁTICA POR RAMAS
============================================ */

function layout() {
  const list = state.org.filter(
    n => person(n.employee_id)
  );

  const ids = new Set(
    list.map(n => n.employee_id)
  );

  const children = new Map();
  const roots = [];

  for (const n of list) {
    const parent =
      n.parent_id && ids.has(n.parent_id)
        ? n.parent_id
        : null;

    if (parent) {
      if (!children.has(parent)) {
        children.set(parent,[]);
      }

      children.get(parent).push(n);

    } else {
      roots.push(n);
    }
  }

  const compare = (a,b) =>
    (a.sort_order-b.sort_order) ||
    person(a.employee_id).name.localeCompare(
      person(b.employee_id).name,"es"
    );

  roots.sort(compare);

  for (const group of children.values()) {
    group.sort(compare);
  }

  const measured = new Map();
  const visiting = new Set();

  function width(n) {
    if (measured.has(n.employee_id)) {
      return measured.get(n.employee_id);
    }

    if (visiting.has(n.employee_id)) {
      return 230;
    }

    visiting.add(n.employee_id);

    const kids = children.get(n.employee_id) || [];

    const span = Math.max(
      230,
      kids.reduce(
        (sum,child) => sum+width(child)+28,
        0
      ) - (kids.length ? 28 : 0)
    );

    visiting.delete(n.employee_id);
    measured.set(n.employee_id,span);

    return span;
  }

  const nodes = [];
  const links = [];

  function place(n,left,depth) {
    const span = width(n);
    const center = left + span/2;

    const x = center-115;
    const y = depth*164+22;

    nodes.push({
      id:n.employee_id,
      x,y
    });

    const kids = children.get(n.employee_id) || [];

    const total = kids.reduce(
      (sum,k) => sum+width(k),
      0
    ) + Math.max(0,kids.length-1)*28;

    let cursor = left+(span-total)/2;

    for (const kid of kids) {
      const child = place(
        kid,
        cursor,
        depth+1
      );

      links.push({
        x:center,
        y:y+100,
        tx:child,
        y2:(depth+1)*164+22
      });

      cursor += width(kid)+28;
    }

    return center;
  }

  let left = 26;

  for (const n of roots) {
    place(n,left,0);
    left += width(n)+50;
  }

  return {
    nodes,
    links,
    width:Math.max(left,500),
    height:Math.max(
      350,
      Math.max(0,...nodes.map(n=>n.y))+175
    )
  };
}

function ggSocialRenderOrgOriginalV4(target,editable){
  const dst = $(target);
  if (!dst) return;

  const scene = layout();

  const controls =
    '<div class="ggs-controls">' +
    '<button data-social="zoom-out" type="button">' +
    '−</button>' +
    '<strong>' +
    Math.round(state.zoom*100) +
    '%</strong>' +
    '<button data-social="zoom-in" type="button">' +
    '＋</button>' +
    '<button data-social="fit" type="button">' +
    'Ajustar</button>' +
    '</div>';

  const toolbar =
    '<div class="ggs-bar">' +
    (
      editable
        ? '<button class="ggs-primary" ' +
          'data-social="drawer" type="button">' +
          '＋ Agregar empleado</button>' +
          '<button data-social="root-drop"' +
          ' type="button">' +
          'Mover a raíz</button>'
        : ''
    ) +
    controls +
    '</div>';

  const paths = scene.links.map(l =>
    '<path d="M' + l.x + ' ' + l.y +
    ' V' + (l.y+18) +
    ' Q' + l.x + ' ' + (l.y+38) +
    ' ' + ((l.x+l.tx)/2) +
    ' ' + (l.y+38) +
    ' T' + l.tx + ' ' + (l.y+60) +
    ' V' + l.y2 + '"/>'
  ).join("");

  const cards = scene.nodes.map(n => {
    const p = person(n.id);

    return '<article class="ggs-node"' +
      ' draggable="' + editable + '"' +
      ' data-node="' + n.id + '"' +
      ' style="left:' + n.x + 'px;' +
      'top:' + n.y + 'px">' +

      '<button class="ggs-node-main"' +
      ' type="button" data-social="person"' +
      ' data-id="' + n.id + '">' +

      '<span class="ggs-node-avatar">' +
      image(photo(p.photo),p.name,"ggs-photo") +
      '</span>' +

      '<span><strong>' +
      esc(p.name) +
      '</strong><small>' +
      esc(p.position) +
      '</small>' +
      badgeStrip(p.id) +
      '</span></button>' +

      (
        editable
          ? '<div class="ggs-node-actions">' +
            '<button data-social="child"' +
            ' data-id="' + n.id + '"' +
            ' type="button">＋ Debajo</button>' +
            '<button data-social="sibling"' +
            ' data-id="' + n.id + '"' +
            ' type="button">＋ Al lado</button>' +
            '<button data-social="remove"' +
            ' data-id="' + n.id + '"' +
            ' type="button">× Quitar</button>' +
            '</div>'
          : ''
      ) +

      '</article>';
  }).join("");

  dst.innerHTML =
    heading(
      "CAPITAL HUMANO · VISTA GENERAL",
      "Organigrama",
      "Arrastra para navegar, utiliza el zoom " +
      "y selecciona un empleado."
    ) +

    toolbar +

    '<div class="ggs-org-viewport"' +
    ' id="ggsViewport">' +

    '<div id="ggsStage" class="ggs-stage"' +
    ' style="width:' + scene.width + 'px;' +
    'height:' + scene.height + 'px;' +
    'transform:translate(' +
    state.x + 'px,' + state.y + 'px)' +
    ' scale(' + state.zoom + ')">' +

    '<svg class="ggs-links" width="' +
    scene.width + '" height="' +
    scene.height + '">' +
    paths +
    '</svg>' +

    cards +

    '</div></div>' +

    (
      !scene.nodes.length
        ? '<p class="ggs-empty">' +
          (
            editable
              ? 'Comienza agregando tu primer empleado.'
              : 'RH todavía no ha creado el organigrama.'
          ) +
          '</p>'
        : ''
    ) +

    '<p class="ggs-help">' +
    (
      editable
        ? 'Arrastra una tarjeta sobre otra para ' +
          'cambiar su superior. La distribución ' +
          'se reorganiza automáticamente.'
        : 'Utiliza los controles de zoom y ' +
          'arrastra el fondo para recorrerlo.'
    ) +
    '</p>';

  const view = $("ggsViewport");

  view.addEventListener(
    "wheel",
    e => {
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      zoom(e.deltaY<0 ? .12 : -.12);
    },
    {passive:false}
  );

  let dragging = null;

  view.addEventListener("pointerdown",e => {
    if (
      e.target.closest("button") ||
      e.target.closest(".ggs-node")
    ) return;

    dragging = {
      x:e.clientX,
      y:e.clientY,
      ox:state.x,
      oy:state.y
    };

    view.setPointerCapture(e.pointerId);
  });

  view.addEventListener("pointermove",e => {
    if (!dragging) return;

    state.x =
      dragging.ox + e.clientX-dragging.x;

    state.y =
      dragging.oy + e.clientY-dragging.y;

    applyTransform();
  });

  view.addEventListener(
    "pointerup",
    () => dragging=null
  );

  if (editable) {
    view.addEventListener("dragover",e => {
      e.preventDefault();

      const target = e.target.closest(
        ".ggs-node"
      );

      if (target) {
        target.classList.add("ggs-target");
      }
    });

    view.addEventListener("dragleave",e => {
      e.target.closest(".ggs-node")
        ?.classList.remove("ggs-target");
    });

    view.addEventListener("drop",async e => {
      e.preventDefault();

      view.querySelectorAll(".ggs-target")
        .forEach(n =>
          n.classList.remove("ggs-target")
        );

      const emp = e.dataTransfer.getData(
        "text/gg-employee"
      );

      const target = e.target.closest(
        "[data-node]"
      );

      if (emp && person(emp)) {
        if (target?.dataset.node === emp) {
          return;
        }

        await move(
          emp,
          target ? target.dataset.node : null
        );
      }
    });
  }
}



  /* GG_SOCIAL_FOCUS_GESTURE_V4 */

  // Complementa el organigrama original.
  // No modifica los datos de RH.

  function renderOrg(target, editable) {

    ggSocialRenderOrgOriginalV4(
      target,
      editable
    );

    ggsEnhanceOrg(target);
  }

  function ggsEnhanceOrg(target) {

    const host = $(target);

    const view = host?.querySelector(
      '.ggs-org-viewport'
    );

    const stage = host?.querySelector(
      '.ggs-stage'
    );

    if (!view || !stage) return;

    // Localizar el empleado autenticado
    // utilizando el ID que devuelve el
    // servidor, nunca un nombre inventado.

    const mine = state.me
      ? [...stage.querySelectorAll(
          '.ggs-node'
        )].find(
          n =>
            n.dataset.node === String(state.me)
        )
      : null;

    if (mine) {

      mine.classList.add(
        'ggs-own-employee'
      );
    }

    // Centrar una vez por apertura.
    // No hacerlo en cada actualización,
    // porque movería el organigrama
    // mientras el usuario lo explora.

    const key = String(
      state.me || 'sin-vinculo'
    );

    const initial =
      host.dataset.ggsFocusedV4 !== key;

    if (
      initial &&
      mode !== 'rh'
    ) {

      const center = () => {

        if (
          !view.isConnected ||
          !view.clientWidth ||
          !view.clientHeight
        ) return;

        let x;
        let y;

        if (mine) {

          // Zoom inicial cómodo según
          // el tamaño de la pantalla.

          state.zoom =
            view.clientWidth < 650
              ? .72
              : .94;

          x =
            parseFloat(mine.style.left) +
            mine.offsetWidth / 2;

          y =
            parseFloat(mine.style.top) +
            mine.offsetHeight / 2;

        } else {

          // Si aún no está agregado en
          // el organigrama, mostrar la
          // estructura completa.

          state.zoom = Math.max(
            .32,
            Math.min(
              1,
              (view.clientWidth - 35) /
                Math.max(
                  1,
                  stage.offsetWidth
                ),

              (view.clientHeight - 35) /
                Math.max(
                  1,
                  stage.offsetHeight
                )
            )
          );

          x = stage.offsetWidth / 2;
          y = stage.offsetHeight / 2;
        }

        // La traslación coloca al
        // empleado justo en el centro.

        state.x = Math.round(
          view.clientWidth / 2 -
          x * state.zoom
        );

        state.y = Math.round(
          view.clientHeight / 2 -
          y * state.zoom
        );

        applyTransform();

        const percent =
          host.querySelector(
            '.ggs-controls strong'
          );

        if (percent) {
          percent.textContent =
            Math.round(state.zoom * 100) +
            '%';
        }

        host.dataset.ggsFocusedV4 = key;
      };

      if (view.clientWidth) {

        center();

      } else {

        requestAnimationFrame(center);
      }
    }

    // =======================================
    // GUÍA ANIMADA DE ZOOM
    // =======================================

    if (initial) {

      const tip =
        document.createElement('div');

      tip.className =
        'ggs-gesture-tip';

      tip.setAttribute(
        'aria-hidden',
        'true'
      );

      tip.innerHTML =
        '<div class="ggs-pinch-hand">' +
        '<span>🤏</span>' +
        '<i class="ggs-pinch-ring"></i>' +
        '</div>' +

        '<strong>' +
        'Puedes hacer zoom y moverte' +
        '</strong>' +

        '<small>' +
        'Junta o separa dos dedos; ' +
        'arrastra para explorar. ' +
        'También puedes usar + y −.' +
        '</small>';

      view.appendChild(tip);

      // La indicación desaparece sola.

      setTimeout(
        () => tip.remove(),
        3400
      );
    }

    // =======================================
    // ZOOM TÁCTIL REAL CON DOS DEDOS
    // =======================================

    const touchPoints = new Map();

    let pinch = null;

    const measure = () => {

      const [a,b] = [
        ...touchPoints.values()
      ];

      return {

        dist: Math.max(
          1,
          Math.hypot(
            a.x - b.x,
            a.y - b.y
          )
        ),

        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2

      };
    };

    // Registrar los dedos que tocan
    // el organigrama.

    view.addEventListener(
      'pointerdown',
      e => {

        if (
          e.pointerType !== 'touch'
        ) return;

        touchPoints.set(
          e.pointerId,
          {
            x:e.clientX,
            y:e.clientY
          }
        );

        if (touchPoints.size === 2) {

          pinch = {
            ...measure(),
            zoom:state.zoom
          };

          e.preventDefault();
          e.stopImmediatePropagation();
        }

      },
      true
    );

    // Al separar o juntar dos dedos,
    // actualizar el zoom tomando como
    // referencia el centro del gesto.

    view.addEventListener(
      'pointermove',
      e => {

        if (
          !touchPoints.has(
            e.pointerId
          )
        ) return;

        touchPoints.set(
          e.pointerId,
          {
            x:e.clientX,
            y:e.clientY
          }
        );

        if (
          touchPoints.size < 2 ||
          !pinch
        ) return;

        const now = measure();

        const rect =
          view.getBoundingClientRect();

        const localX =
          now.cx - rect.left;

        const localY =
          now.cy - rect.top;

        const diagramX =
          (localX - state.x) /
          state.zoom;

        const diagramY =
          (localY - state.y) /
          state.zoom;

        state.zoom = Math.max(
          .32,
          Math.min(
            2.2,

            pinch.zoom *
            now.dist /
            pinch.dist
          )
        );

        state.x =
          localX -
          diagramX * state.zoom;

        state.y =
          localY -
          diagramY * state.zoom;

        applyTransform();

        const percent =
          host.querySelector(
            '.ggs-controls strong'
          );

        if (percent) {

          percent.textContent =
            Math.round(
              state.zoom * 100
            ) + '%';
        }

        e.preventDefault();
        e.stopImmediatePropagation();

      },
      {
        capture:true,
        passive:false
      }
    );

    // Limpiar dedos levantados.

    const release = e => {

      touchPoints.delete(
        e.pointerId
      );

      if (touchPoints.size < 2) {
        pinch = null;
      }
    };

    view.addEventListener(
      'pointerup',
      release,
      true
    );

    view.addEventListener(
      'pointercancel',
      release,
      true
    );
  }

  function applyTransform(){
  const stage = $("ggsStage");

  if (stage) {
    stage.style.transform =
      "translate(" + state.x + "px," +
      state.y + "px) scale(" +
      state.zoom + ")";
  }
}

function zoom(delta) {
  state.zoom = Math.max(
    .32,
    Math.min(
      2.2,
      Math.round(
        (state.zoom+delta)*100
      )/100
    )
  );

  applyTransform();

  const text = document.querySelector(
    ".ggs-controls strong"
  );

  if (text) {
    text.textContent =
      Math.round(state.zoom*100)+"%";
  }
}

async function move(id,parent) {
  if (id === parent) {
    say(
      "No puedes colocar a una persona " +
      "debajo de sí misma.",
      true
    );
    return;
  }

  const ok = await change("org_move",{
    employee_id:id,
    parent_id:parent,
    sort_order:Date.now()%1000000
  });

  if (ok) {
    state.drawer = false;
    state.pick = null;
    state.x = 0;
    state.y = 0;
    renderDrawer();
    applyTransform();
  }
}

/* ============================================
   PANEL LATERAL DE EMPLEADOS
============================================ */

function renderDrawer() {
  const container = $("ggsRhDrawer");
  if (!container) return;

  container.innerHTML = state.drawer
    ? '<div class="ggs-drawer-backdrop"' +
      ' data-social="close-drawer"></div>' +

      '<aside class="ggs-drawer"><header>' +

      '<div><small>DIRECTORIO RH</small>' +
      '<h3>Agregar empleado</h3>' +
      '<p>' + esc(
        state.pick
          ? "Destino: " +
            (person(state.pick)?.name || "Raíz")
          : "Coloca empleados en el organigrama"
      ) + '</p></div>' +

      '<button data-social="close-drawer"' +
      ' type="button">×</button>' +

      '</header>' +

      '<input id="ggsEmployeeSearch"' +
      ' type="search"' +
      ' placeholder="Buscar nombre, puesto, empresa…"' +
      ' value="' + esc(state.filter) + '">' +

      '<div id="ggsDrawerEmployees"' +
      ' class="ggs-drawer-grid"></div>' +

      '</aside>'
    : '';

  if (state.drawer) {
    $("ggsEmployeeSearch").oninput = e => {
      state.filter = e.target.value;
      renderDrawerList();
    };

    renderDrawerList();
  }
}

function renderDrawerList() {
  const dst = $("ggsDrawerEmployees");
  if (!dst) return;

  const normalize = value =>
    value.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"");

  const query = normalize(state.filter);

  const placed = new Set(
    state.org.map(n=>n.employee_id)
  );

  dst.innerHTML = state.people.filter(
    p => normalize(
      p.name+" "+p.position+" "+p.company
    ).includes(query)
  ).map(p =>
    '<div class="ggs-person-wrap">' +

    personCard(
      p,
      'data-social="choose-employee"' +
      ' data-id="' + p.id + '"' +
      ' draggable="true"' +
      ' data-drag-employee="' + p.id + '"'
    ) +

    '<span class="ggs-drawer-state">' +
    (
      placed.has(p.id)
        ? "En organigrama"
        : "Sin ubicar"
    ) +
    '</span></div>'
  ).join("") ||
  '<p class="ggs-empty">Sin coincidencias.</p>';

  dst.querySelectorAll("[data-drag-employee]")
    .forEach(button => {
      button.addEventListener("dragstart",e => {
        e.dataTransfer.setData(
          "text/gg-employee",
          button.dataset.dragEmployee
        );
      });
    });
}

function openDrawer(parent=null,asSibling=false) {
  state.pick = asSibling
    ? (
      state.org.find(
        x=>x.employee_id===parent
      )?.parent_id || null
    )
    : parent;

  state.drawer = true;
  renderDrawer();
}

/* ============================================
   INSIGNIAS · VISTA DE RH
============================================ */

function renderBadges() {
  const dst = $("ggsBadgesView");
  if (!dst) return;

  dst.innerHTML =
    heading(
      "RECONOCIMIENTOS",
      "Insignias",
      "Crea reconocimientos y asígnalos " +
      "por mes a tus empleados."
    ) +

    '<div class="ggs-bar">' +
    '<button class="ggs-primary"' +
    ' data-social="badge-list" type="button">' +
    '◈ Biblioteca de insignias (' +
    state.badges.length +
    ')</button>' +

    '<button data-social="badge-new"' +
    ' type="button">＋ Nueva insignia</button>' +
    '</div>' +

    '<label class="ggs-search">' +
    'Buscar empleado' +
    '<input id="ggsBadgeSearch"' +
    ' type="search"' +
    ' placeholder="Nombre, puesto o empresa…"' +
    ' value="' + esc(state.filter) + '">' +
    '</label>' +

    '<div id="ggsBadgeEmployees"' +
    ' class="ggs-people-grid"></div>';

  $("ggsBadgeSearch").oninput = e => {
    state.filter = e.target.value;
    renderBadgePeople();
  };

  renderBadgePeople();
}

function renderBadgePeople() {
  const dst = $("ggsBadgeEmployees");
  if (!dst) return;

  const query = state.filter.toLowerCase();

  dst.innerHTML = state.people.filter(
    p => (
      p.name+" "+p.position+" "+p.company
    ).toLowerCase().includes(query)
  ).map(p =>
    '<div class="ggs-person-wrap">' +

    personCard(
      p,
      'data-social="award-wizard"' +
      ' data-id="' + p.id + '"'
    ) +

    '<div class="ggs-person-awards">' +
    badgeStrip(p.id) +
    '</div></div>'
  ).join("") ||
  '<p class="ggs-empty">' +
  'No hay empleados con ese filtro.</p>';
}

/* ============================================
   FORO GUTIÉRREZ
============================================ */
function renderForum(target, admin) {
  const dst = $(target);

  if (!dst) return;

  const headingHTML = heading(
    'COMUNIDAD · GRUPO GUTIÉRREZ',
    'Foro Gutiérrez',
    'Fotos, reconocimientos y comunicados de Recursos Humanos.'
  );

  dst.innerHTML =
    headingHTML +

    (
      admin
        ? '<div class="ggs-bar">' +
          '<button type="button" class="ggs-primary" ' +
          'data-social="post-new">' +
          '＋ Nueva publicación</button></div>'
        : ''
    ) +

    '<div class="ggs-post-grid">' +

    state.posts.map(p => {
      const files = ggV5MediaOf(p);

      const photos = files.filter(
        f => f.kind === 'image'
      );

      const pdfs = files.filter(
        f => f.kind === 'pdf'
      );

      const index = photos.length
        ? (
            (state.galleryIndex?.[p.id] || 0) %
            photos.length
          )
        : 0;

      const picture = photos[index];

      const gallery =
        '<div class="ggs-post-image ggv5-gallery" ' +
        'data-ggv5-post="' + esc(p.id) + '">' +

        (
          picture
            ? '<button type="button" class="ggv5-photo" ' +
              'data-ggv5="open" data-id="' +
              esc(p.id) + '" ' +
              'aria-label="Ampliar fotografía">' +

              '<img class="ggv5-cover" src="' +
              esc(media(picture.path)) +
              '" alt="' + esc(p.title) +
              '" loading="lazy">' +

              '<span class="ggv5-magnify">' +
              '⤢ Ampliar</span></button>'

            : '<div class="ggs-post-art">GG ✳</div>'
        ) +

        (
          photos.length > 1
            ? '<button type="button" ' +
              'class="ggv5-arrow prev" ' +
              'data-ggv5="prev" data-id="' +
              esc(p.id) + '" ' +
              'aria-label="Foto anterior">‹</button>' +

              '<button type="button" ' +
              'class="ggv5-arrow next" ' +
              'data-ggv5="next" data-id="' +
              esc(p.id) + '" ' +
              'aria-label="Foto siguiente">›</button>' +

              '<span class="ggv5-count">' +
              (index + 1) + ' / ' +
              photos.length + '</span>'
            : ''
        ) +

        '</div>';

      const documents = pdfs.length
        ? '<div class="ggv5-docs">' +
          '<small>DOCUMENTOS ADJUNTOS</small>' +

          pdfs.map(f =>
            '<a class="ggv5-pdf" href="' +
            esc(media(f.path)) +
            '" target="_blank" ' +
            'rel="noopener noreferrer">' +

            '<span>▤</span>' +

            '<strong>' +
            esc(f.name || 'Documento.pdf') +
            '</strong>' +

            '<em>Ver PDF ↗</em>' +

            '</a>'
          ).join('') +

          '</div>'
        : '';

      return (
        '<article class="ggs-post" ' +
        'data-ggv5-article="' +
        esc(p.id) + '">' +

        gallery +

        '<div class="ggs-post-copy">' +

        '<small>' +
        esc(
          new Date(p.created_at)
            .toLocaleDateString('es-MX')
        ) +
        ' · RECURSOS HUMANOS</small>' +

        '<h3>' + esc(p.title) + '</h3>' +
        '<p>' + esc(p.body) + '</p>' +

        documents +

        '<div class="ggs-post-actions">' +

        '<button type="button" data-social="like" ' +
        'data-id="' + esc(p.id) + '">' +
        (p.liked ? '♥' : '♡') +
        ' Me gusta</button>' +

        '<button type="button" data-social="likes" ' +
        'data-id="' + esc(p.id) + '">' +
        p.likes +
        ' likes · ver personas</button>' +

        '</div>' +

        (
          admin
            ? '<div class="ggs-post-admin">' +

              '<button type="button" ' +
              'data-social="post-edit" data-id="' +
              esc(p.id) + '">Editar</button>' +

              '<button type="button" ' +
              'data-social="post-delete" data-id="' +
              esc(p.id) + '">Eliminar</button>' +

              '</div>'
            : ''
        ) +

        '</div></article>'
      );

    }).join('') +

    '</div>' +

    (
      !state.posts.length
        ? '<p class="ggs-empty">' +
          'Todavía no hay publicaciones.</p>'
        : ''
    );
}



function modal(title,content) {
  let layer = $("ggsDialogLayer");

  if (!layer) {
    layer = document.createElement("div");
    layer.id = "ggsDialogLayer";
    document.body.append(layer);
  }

  layer.innerHTML =
    '<div class="ggs-modal-shade"' +
    ' data-social="close-modal"></div>' +

    '<section class="ggs-modal"' +
    ' role="dialog" aria-modal="true">' +

    '<header><div>' +
    '<small>GRUPO GUTIÉRREZ</small>' +
    '<h2>' + esc(title) + '</h2>' +
    '</div>' +

    '<button data-social="close-modal"' +
    ' type="button">×</button>' +
    '</header>' +

    '<div class="ggs-modal-body">' +
    content +
    '</div></section>';
}

function closeModal() {
  $("ggsDialogLayer")?.replaceChildren();
  state.edit = null;
}

/* ============================================
   BIBLIOTECA DE INSIGNIAS
============================================ */

function badgeLibrary() {
  modal(
    "Biblioteca de insignias",

    '<div class="ggs-bar">' +
    '<button data-social="badge-new"' +
    ' class="ggs-primary" type="button">' +
    '＋ Crear insignia</button></div>' +

    '<div class="ggs-library">' +

    state.badges.map(b =>
      '<div class="ggs-library-item">' +

      image(
        media(b.image_path),
        b.name,
        "ggs-library-pic"
      ) +

      '<strong>' + esc(b.name) + '</strong>' +

      '<button data-social="badge-edit"' +
      ' data-id="' + b.id + '">' +
      'Editar</button>' +

      '<button data-social="badge-delete"' +
      ' data-id="' + b.id + '">' +
      'Eliminar</button>' +

      '</div>'
    ).join("") +

    '</div>'
  );
}

function badgeWizard(id=null,step=1) {
  const b = state.badges.find(
    x=>x.id===id
  );

  const draft =
    state.edit?.kind === "badge"
      ? state.edit
      : {
          kind:"badge",
          id,
          name:b?.name || "",
          image_path:b?.image_path || "",
          file:null
        };

  state.edit = draft;

  const steps = [
    "",
    "Nombre",
    "Imagen",
    "Confirmar"
  ];

  const introduction =
    '<div class="ggs-steps">' +
    'Paso ' + step + ' de 3 · ' +
    steps[step] +
    '</div>';

  let content = "";

  if (step === 1) {
    content =
      '<label class="ggs-field">' +
      'Nombre de la insignia' +
      '<input id="ggsBadgeName"' +
      ' maxlength="120"' +
      ' placeholder="Ej. Empleado del mes"' +
      ' value="' + esc(draft.name) + '">' +
      '</label>' +

      '<button data-social="badge-next-1"' +
      ' class="ggs-primary">' +
      'Siguiente →</button>';

  } else if (step === 2) {
    content =
      '<p class="ggs-muted">' +
      'Se recomienda PNG con transparencia. ' +
      'Admite PNG, WEBP o JPG, máximo 5 MB.' +
      '</p>' +

      '<input type="file" id="ggsBadgeFile"' +
      ' accept="image/png,image/jpeg,image/webp">' +

      '<div class="ggs-preview">' +
      (
        draft.image_path
          ? image(
              media(draft.image_path),
              draft.name,
              "ggs-library-pic"
            )
          : '◈'
      ) +
      '</div>' +

      '<div class="ggs-bar">' +
      '<button data-social="badge-step-1">' +
      '← Atrás</button>' +
      '<button data-social="badge-next-2"' +
      ' class="ggs-primary">Siguiente →</button>' +
      '</div>';

  } else {
    content =
      '<h3>' + esc(draft.name) + '</h3>' +
      '<p>Revisa el reconocimiento antes ' +
      'de guardarlo.</p>' +

      '<div class="ggs-bar">' +
      '<button data-social="badge-step-2">' +
      '← Atrás</button>' +
      '<button data-social="badge-save"' +
      ' class="ggs-primary">' +
      'Guardar insignia</button>' +
      '</div>';
  }

  modal(
    id ? "Editar insignia" : "Nueva insignia",
    introduction+content
  );

  if (step === 2) {
    $("ggsBadgeFile").onchange = e => {
      draft.file = e.target.files?.[0] || null;
    };
  }
}

async function upload(file,folder,maxMb) {
  if (!file) return null;

  if (
    ![
      "image/png",
      "image/jpeg",
      "image/webp"
    ].includes(file.type) ||
    file.size > maxMb*1024*1024
  ) {
    throw Error(
      "Imagen PNG, JPG o WEBP, máximo " +
      maxMb + " MB"
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

  const storagePath =
    folder + "/" +
    crypto.randomUUID() +
    "." + ext;

  const {error} = await db.storage
    .from("gg-social-media")
    .upload(storagePath,file,{
      upsert:false,
      contentType:file.type
    });

  if (error) throw error;

  return storagePath;
}

async function saveBadge() {
  const draft = state.edit;

  try {
    const storagePath = draft.file
      ? await upload(draft.file,"badges",5)
      : draft.image_path;

    const ok = await change("badge_save",{
      id:draft.id,
      name:draft.name,
      image_path:storagePath
    });

    if (ok) closeModal();

  } catch(e) {
    showError(e);
  }
}

/* ============================================
   ASIGNACIÓN DE INSIGNIAS POR PASOS
============================================ */

function awardWizard(id,step=1) {
  const p = person(id);
  if (!p) return;

  const draft =
    state.edit?.kind === "award" &&
    state.edit.id === id
      ? state.edit
      : {
          kind:"award",
          id,
          month:new Date().toISOString().slice(0,7),
          badgeId:""
        };

  state.edit = draft;

  const existing = awardList(id);

  let content =
    '<div class="ggs-steps">' +
    'Paso ' + step + ' de 3</div>';

  if (step === 1) {

    content +=
      '<div class="ggs-award-person">' +

      image(
        photo(p.photo),
        p.name,
        "ggs-award-photo"
      ) +

      '<div><h3>' + esc(p.name) +
      '</h3><p>' + esc(p.position) +
      ' · ' + esc(p.company) +
      '</p></div></div>' +

      '<div id="ggsEmployeeExtra"' +
      ' class="ggs-muted">' +
      'Consultando ficha RH...</div>' +

      '<h4>Insignias actuales</h4>' +
      badgeStrip(id,true) +

      '<div class="ggs-awards-remove">' +

      existing.map(a =>
        '<button data-social="award-remove"' +
        ' data-id="' + a.id + '">' +
        '× ' +
        esc(badge(a.badge_id)?.name || "Insignia") +
        ' · ' +
        esc(month(a.award_month)) +
        '</button>'
      ).join("") +

      '</div>' +

      '<button class="ggs-primary"' +
      ' data-social="award-next-1"' +
      ' type="button">Siguiente →</button>';

  } else if (step === 2) {

    content +=
      '<label class="ggs-field">' +
      'Selecciona el mes del reconocimiento' +
      '<input id="ggsAwardMonth"' +
      ' type="month"' +
      ' value="' + esc(draft.month) + '">' +
      '</label>' +

      '<div class="ggs-bar">' +
      '<button data-social="award-step-1">' +
      '← Volver</button>' +
      '<button data-social="award-next-2"' +
      ' class="ggs-primary">' +
      'Siguiente →</button></div>';

  } else {

    content +=
      '<p>Selecciona la insignia para ' +
      esc(month(draft.month+"-01")) +
      '.</p>' +

      '<div class="ggs-award-choices">' +

      state.badges.map(b =>
        '<label class="ggs-award-choice">' +

        '<input name="ggsAwardBadge"' +
        ' type="radio"' +
        ' value="' + b.id + '"' +
        (
          draft.badgeId === b.id
            ? " checked"
            : ""
        ) +
        '>' +

        image(
          media(b.image_path),
          b.name,
          "ggs-library-pic"
        ) +

        '<span>' + esc(b.name) +
        '</span></label>'
      ).join("") +

      '</div>' +

      '<div class="ggs-bar">' +
      '<button data-social="award-step-2">' +
      '← Volver</button>' +
      '<button data-social="award-save"' +
      ' class="ggs-primary">' +
      'Asignar insignia ✦</button>' +
      '</div>';
  }

  modal(
    "Reconocimiento de " + p.name,
    content
  );

  if (step === 1) {
    rpc("gg_social_rh_employee",{
      p_employee_id:id
    }).then(e => {
      const dst = $("ggsEmployeeExtra");

      if (!dst || !e) return;

      dst.textContent =
        "No. nómina: " +
        (e.payroll_number || "—") +
        " · Activo: " +
        (e.active ? "Sí" : "No") +
        " · IMSS: " +
        (e.imss_entry_date || "—") +
        " · Ingreso: " +
        (e.seniority_date || "—");

    }).catch(()=>{});
  }
}

/* ============================================
   EDITOR DE FORO
============================================ */
function postEditor(id = null) {
  const p = state.posts.find(
    x => x.id === id
  );

  state.edit = {
    kind: 'post',
    id,
    title: p?.title || '',
    body: p?.body || '',

    existing: p
      ? ggV5MediaOf(p).map(x => ({...x}))
      : [],

    pending: []
  };

  modal(
    id ? 'Editar publicación' : 'Nueva publicación',

    '<form id="ggsPostForm">' +

    '<label class="ggs-field">' +
    'Título' +

    '<input id="ggsPostTitle" maxlength="200" ' +
    'required value="' +
    esc(state.edit.title) + '">' +

    '</label>' +

    '<label class="ggs-field">' +
    'Texto de la publicación' +

    '<textarea id="ggsPostBody" rows="8">' +
    esc(state.edit.body) +
    '</textarea></label>' +

    '<label class="ggs-field">' +
    'Fotos y PDF (hasta 12 en total)' +

    '<input id="ggsPostFile" type="file" ' +
    'multiple ' +
    'accept="image/png,image/jpeg,image/webp,' +
    'application/pdf,.pdf">' +

    '</label>' +

    '<p class="ggs-muted">' +
    'Imágenes hasta 10 MB; PDF hasta 20 MB. ' +
    'Los adjuntos son públicos por enlace: ' +
    'no subas documentos confidenciales.' +
    '</p>' +

    '<div id="ggv5Files" ' +
    'class="ggv5-files"></div>' +

    '<button class="ggs-primary" type="submit">' +
    (id ? 'Guardar cambios' : 'Publicar') +
    '</button>' +

    '</form>'
  );

  $('ggsPostFile').addEventListener(
    'change',
    e => {
      const d = state.edit;

      if (d?.kind !== 'post') return;

      for (const file of [...(e.target.files || [])]) {
        const pdf =
          file.type === 'application/pdf' ||
          (
            !file.type &&
            /\.pdf$/i.test(file.name)
          );

        const ok = pdf
          ? file.size <= 20 * 1048576
          : (
              [
                'image/png',
                'image/jpeg',
                'image/webp'
              ].includes(file.type) &&
              file.size <= 10 * 1048576
            );

        if (!ok) {
          say(
            'Archivo inválido o demasiado grande: ' +
            file.name,
            true
          );
          continue;
        }

        if (
          d.existing.length +
          d.pending.length >= 12
        ) {
          say(
            'Máximo 12 archivos por publicación',
            true
          );
          break;
        }

        d.pending.push({
          file,
          kind: pdf ? 'pdf' : 'image'
        });
      }

      e.target.value = '';

      ggV5PaintFiles();
    }
  );

  ggV5PaintFiles();
}
async function savePost() {
  const d = state.edit;

  if (
    d?.kind !== 'post' ||
    state.busy
  ) return;

  d.title = $('ggsPostTitle')?.value.trim() || '';
  d.body = $('ggsPostBody')?.value || '';

  if (!d.title) {
    say(
      'Escribe el título de la publicación',
      true
    );
    return;
  }

  if (
    d.existing.length +
    d.pending.length > 12
  ) {
    say('Máximo 12 archivos', true);
    return;
  }

  const submit = $('ggsPostForm')
    ?.querySelector('button[type="submit"]');

  state.busy = true;

  if (submit) submit.disabled = true;

  const uploaded = [];
  let savedPostId = null;

  try {
    const files = d.existing.map(
      f => ({...f})
    );

    for (const next of d.pending) {
      const file = next.file;

      const ext = next.kind === 'pdf'
        ? 'pdf'
        : file.type === 'image/png'
          ? 'png'
          : file.type === 'image/webp'
            ? 'webp'
            : 'jpg';

      const p =
        'posts/' +
        crypto.randomUUID() +
        '.' + ext;

      const {error: upError} =
        await db.storage
          .from('gg-social-media')
          .upload(
            p,
            file,
            {
              contentType:
                next.kind === 'pdf'
                  ? 'application/pdf'
                  : file.type,

              upsert: false
            }
          );

      if (upError) throw upError;

      uploaded.push(p);

      files.push({
        path: p,
        kind: next.kind,
        name:
          file.name.slice(0, 180) ||
          'Archivo'
      });
    }

    const cover = files.find(
      f => f.kind === 'image'
    )?.path || null;

    const result = await rpc(
      'gg_social_rh_change',
      {
        p_action: 'post_save',

        p_data: {
          id: d.id,
          title: d.title,
          body: d.body,
          image_path: cover
        }
      }
    );

    savedPostId = result?.id || d.id;

    if (!savedPostId) {
      throw Error(
        'El servidor no devolvió el ID de la publicación'
      );
    }

    // Conservar el ID y las rutas subidas.
    // Si falla asociar adjuntos, podremos
    // reintentar sin crear otro post.

    d.id = savedPostId;
    d.existing = files;
    d.pending = [];

    await rpc(
      'gg_social_post_media_save',
      {
        p_post_id: savedPostId,

        p_files: files.map(f => ({
          path: f.path,
          kind: f.kind,
          name:
            f.name ||
            'Foto de publicación'
        }))
      }
    );

    closeModal();

    await load();

    say(
      'Publicación y archivos guardados correctamente'
    );

  } catch (e) {
    showError(e);

    if (
      !savedPostId &&
      uploaded.length
    ) {
      const {error: removeError} =
        await db.storage
          .from('gg-social-media')
          .remove(uploaded);

      if (removeError) {
        console.warn(
          '[GG Foro] Archivos sin limpiar:',
          removeError.message
        );
      }
    }

    if (savedPostId) {
      say(
        'La publicación ya se guardó. ' +
        'Fallaron los adjuntos: reintenta ' +
        'en este mismo editor, NO crees otra.',
        true
      );

      ggV5PaintFiles();
    }

  } finally {
    state.busy = false;

    if (submit?.isConnected) {
      submit.disabled = false;
    }
  }
}



function details(id) {
  const p = person(id);
  if (!p) return;

  modal(
    p.name,

    '<div class="ggs-award-person">' +

    image(
      photo(p.photo),
      p.name,
      "ggs-award-photo"
    ) +

    '<div><h3>' + esc(p.name) +
    '</h3><p>' + esc(p.position) +
    ' · ' + esc(p.company) +
    '</p></div></div>' +

    '<h3>Insignias y reconocimientos</h3>' +
    badgeStrip(id,true)
  );
}

async function likeNames(id) {
  try {
    const rows = await rpc(
      "gg_social_like_names",
      {
        p_session_token:token(),
        p_post_id:id
      }
    );

    modal(
      "A quién le gusta esta publicación",

      rows.length
        ? '<div class="ggs-likes-list">' +
          rows.map(p =>
            '<div><strong>' +
            esc(p.name) +
            '</strong><small>' +
            esc(p.position) +
            '</small></div>'
          ).join("") +
          '</div>'
        : '<p class="ggs-empty">' +
          'Todavía no hay Me gusta.</p>'
    );

  } catch(e) {
    showError(e);
  }
}

async function toggleLike(id) {
  try {
    await rpc(
      "gg_social_toggle_like",
      {
        p_session_token:token(),
        p_post_id:id
      }
    );

    await load();

  } catch(e) {
    showError(e);
  }
}

async function markSeen(id) {
  if (mode !== "yo") return;

  try {
    await rpc(
      "gg_social_seen_post",
      {
        p_session_token:token(),
        p_post_id:id
      }
    );

    const p = state.posts.find(
      x => x.id === id
    );

    if (p) p.unseen = false;

    renderNotifications();

  } catch(e) {
    console.warn(
      "[GG Social] Visto:",
      e.message
    );
  }
}

/* ============================================
   INSIGNIAS EN YO Y MI PERFIL
============================================ */

function renderYoBadges() {
  const dst = $("ggsYoBadges");
  if (!dst) return;

  dst.innerHTML =
    badgeStrip(state.me) +

    '<button type="button"' +
    ' class="ggs-mini-link"' +
    ' data-social="profile-all">' +
    'Ver todas mis insignias ↗</button>';
}

function renderProfile() {
  const dst = $("ggsProfileBadges");
  if (!dst) return;

  dst.innerHTML =
    '<div class="ggs-profile-heading">' +
    'MIS INSIGNIAS</div>' +

    badgeStrip(state.me) +

    '<button type="button"' +
    ' data-social="profile-all"' +
    ' class="ggs-mini-link">' +
    'Ver todas ↗</button>';
}

function profileAll() {
  const list = awardList(state.me);

  modal(
    "Todas mis insignias",

    badgeStrip(state.me,true) +

    (
      list.length
        ? ''
        : '<p>RH aún no te ha asignado ' +
          'insignias.</p>'
    )
  );
}

/* ============================================
   PANELES DE YO
============================================ */
function renderYoPanel() {
  const popup = $('ggsYoPopup');

  if (!popup) return;

  if (!state.modal) {
    popup.innerHTML = '';
    popup.classList.remove('ggv5-org-open');
    return;
  }

  const isOrg = state.modal === 'org';

  popup.classList.toggle(
    'ggv5-org-open',
    isOrg
  );

  popup.innerHTML = isOrg

    ? '<div class="ggs-modal-shade" ' +
      'data-social="close-yo"></div>' +

      '<section class="ggs-yo-window ggv5-yo-org">' +

      '<button type="button" class="ggv5-back" ' +
      'data-social="close-yo">' +
      '← Volver a YO</button>' +

      '<div id="ggsYoPanelContent"></div>' +

      '</section>'

    : '<div class="ggs-modal-shade" ' +
      'data-social="close-yo"></div>' +

      '<section class="ggs-yo-window">' +

      '<header><strong>Foro Gutiérrez</strong>' +

      '<button type="button" data-social="close-yo">' +
      '× Cerrar</button></header>' +

      '<div id="ggsYoPanelContent"></div>' +

      '</section>';

  if (isOrg) {
    renderOrg(
      'ggsYoPanelContent',
      false
    );

  } else {
    renderForum(
      'ggsYoPanelContent',
      false
    );
  }
}



function renderNotifications() {
  if (mode !== "yo") return;

  const list = $("yoNotificationsList");
  if (!list) return;

  let holder = $("ggsForumNotices");

  if (!holder) {
    holder = document.createElement("div");
    holder.id = "ggsForumNotices";
    holder.className = "ggs-forum-notices";
    list.append(holder);
  }

  const unread = state.posts
    .filter(p=>p.unseen)
    .slice(0,10);

  holder.innerHTML = unread.length
    ? '<small>✦ FORO GUTIÉRREZ · NUEVO</small>' +

      unread.map(p =>
        '<button data-social="notice"' +
        ' data-id="' + p.id + '"' +
        ' type="button">' +

        '<strong>' +
        esc(p.title) +
        '</strong>' +

        '<span>RH publicó una noticia ' +
        '· Ver publicación ↗</span>' +

        '</button>'
      ).join("")
    : '';

  if (unread.length) {
    list.querySelector(
      ".yo-notifications-empty"
    )?.remove();
  }

  const bell = $("yoNotificationButton");

  if (bell) {
    bell.classList.toggle(
      "ggs-has-news",
      unread.length > 0
    );
  }

  // No sobrescribimos el contador que
  // ya utilizan YO y Nómina.
}

/* ============================================
   EVENTOS DE TODA LA INTERFAZ
============================================ */



/* GG_SOCIAL_V5_REAL_INTEGRATION */

state.postMedia = {};
state.galleryIndex = {};

function ggV5MediaOf(post) {
  const files = state.postMedia?.[post?.id];

  if (Array.isArray(files)) return files;

  return post?.image_path
    ? [{
        path: post.image_path,
        kind: 'image',
        name: 'Foto de publicación'
      }]
    : [];
}

function ggV5PaintFiles() {
  const dst = $('ggv5Files');
  const d = state.edit;

  if (
    !dst ||
    d?.kind !== 'post'
  ) return;

  const current = d.existing.map(
    (f, i) =>
      '<div class="ggv5-file">' +

      '<span>' +
      (f.kind === 'pdf' ? '▤' : '▧') +
      '</span>' +

      '<strong>' +
      esc(f.name || 'Foto') +
      '</strong>' +

      '<small>Guardado</small>' +

      '<button type="button" ' +
      'data-ggv5="remove-existing" ' +
      'data-index="' + i + '">' +
      'Quitar</button></div>'
  );

  const pending = d.pending.map(
    (f, i) =>
      '<div class="ggv5-file">' +

      '<span>' +
      (f.kind === 'pdf' ? '▤' : '▧') +
      '</span>' +

      '<strong>' +
      esc(f.file.name) +
      '</strong>' +

      '<small>Por subir</small>' +

      '<button type="button" ' +
      'data-ggv5="remove-pending" ' +
      'data-index="' + i + '">' +
      'Quitar</button></div>'
  );

  dst.innerHTML =
    current.concat(pending).join('') ||

    '<p class="ggs-muted">' +
    'Sin archivos seleccionados.</p>';
}

function ggV5Photos(id) {
  const p = state.posts.find(
    p => p.id === id
  );

  return p
    ? ggV5MediaOf(p).filter(
        f => f.kind === 'image'
      )
    : [];
}

function ggV5Go(id, direction) {
  const items = ggV5Photos(id);

  if (!items.length) return;

  const index = (
    (
      (state.galleryIndex[id] || 0) +
      direction
    ) % items.length +
    items.length
  ) % items.length;

  state.galleryIndex[id] = index;

  document.querySelectorAll(
    '[data-ggv5-post="' + id + '"]'
  ).forEach(holder => {
    const img = holder.querySelector(
      '.ggv5-cover'
    );

    if (img) {
      img.src = media(items[index].path);
    }

    const count = holder.querySelector(
      '.ggv5-count'
    );

    if (count) {
      count.textContent =
        (index + 1) +
        ' / ' +
        items.length;
    }
  });

  const light = $('ggv5Lightbox');

  if (light?.dataset.id === id) {
    ggV5Lightbox(id, index);
  }
}

function ggV5Lightbox(id, index) {
  const p = state.posts.find(
    p => p.id === id
  );

  const items = ggV5Photos(id);

  if (
    !p ||
    !items.length
  ) return;

  index = (
    (index % items.length) +
    items.length
  ) % items.length;

  let layer = $('ggv5Lightbox');

  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'ggv5Lightbox';

    document.body.append(layer);
  }

  layer.className = 'ggv5-lightbox';
  layer.dataset.id = id;
  layer.dataset.index = String(index);

  layer.innerHTML =
    '<div class="ggv5-light-shade" ' +
    'data-ggv5="light-close"></div>' +

    '<section class="ggv5-light-body" ' +
    'role="dialog" aria-modal="true" ' +
    'aria-label="Fotografía ampliada">' +

    '<button class="ggv5-light-close" ' +
    'type="button" data-ggv5="light-close">' +
    '× Cerrar</button>' +

    '<img src="' +
    esc(media(items[index].path)) +
    '" alt="' + esc(p.title) + '">' +

    (
      items.length > 1
        ? '<button class="ggv5-light-nav prev" ' +
          'type="button" data-ggv5="light-prev">' +
          '‹</button>' +

          '<button class="ggv5-light-nav next" ' +
          'type="button" data-ggv5="light-next">' +
          '›</button>'
        : ''
    ) +

    '<small>' +
    esc(p.title) +
    ' · ' +
    (index + 1) +
    ' de ' +
    items.length +
    '</small></section>';
}

// Eventos del V5, separados de los originales.

document.addEventListener(
  'click',
  async e => {
    const node = e.target.closest(
      '[data-ggv5], [data-social="post-delete"]'
    );

    if (!node) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const action = node.dataset.ggv5;

    // Eliminar post y limpiar sus adjuntos.
    if (node.dataset.social === 'post-delete') {
      if (!confirm(
        '¿Eliminar esta publicación, sus fotos, PDF y likes?'
      )) return;

      const id = node.dataset.id;

      const p = state.posts.find(
        x => x.id === id
      );

      const paths = [
        ...new Set(
          [
            ...ggV5MediaOf(p).map(x => x.path),
            p?.image_path
          ].filter(Boolean)
        )
      ];

      const ok = await change(
        'post_delete',
        {id}
      );

      if (
        ok &&
        paths.length
      ) {
        const {error} = await db.storage
          .from('gg-social-media')
          .remove(paths);

        if (error) {
          console.warn(
            '[GG Foro] Archivos no eliminados:',
            error.message
          );
        }
      }

      return;
    }

    const id = node.dataset.id;

    if (
      action === 'prev' ||
      action === 'next'
    ) {
      ggV5Go(
        id,
        action === 'prev' ? -1 : 1
      );

    } else if (action === 'open') {
      const gallery = node.closest(
        '.ggv5-gallery'
      );

      if (
        gallery &&
        Number(gallery.dataset.swipeAt || 0) >
          Date.now() - 500
      ) return;

      ggV5Lightbox(
        id,
        state.galleryIndex[id] || 0
      );

    } else if (action === 'light-close') {
      $('ggv5Lightbox')?.remove();

    } else if (
      action === 'light-prev' ||
      action === 'light-next'
    ) {
      const box = $('ggv5Lightbox');

      if (box) {
        ggV5Lightbox(
          box.dataset.id,
          Number(box.dataset.index) +
          (
            action === 'light-prev'
              ? -1
              : 1
          )
        );
      }

    } else if (
      (
        action === 'remove-existing' ||
        action === 'remove-pending'
      ) &&
      state.edit?.kind === 'post'
    ) {
      const key =
        action === 'remove-existing'
          ? 'existing'
          : 'pending';

      const index = Number(
        node.dataset.index
      );

      if (Number.isInteger(index)) {
        state.edit[key].splice(index, 1);
      }

      ggV5PaintFiles();
    }
  },
  true
);

// Teclado para navegar fotografías.

document.addEventListener(
  'keydown',
  e => {
    const box = $('ggv5Lightbox');

    if (!box) return;

    if (e.key === 'Escape') {
      e.stopImmediatePropagation();
      box.remove();

    } else if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();

      ggV5Lightbox(
        box.dataset.id,
        Number(box.dataset.index) +
        (
          e.key === 'ArrowLeft'
            ? -1
            : 1
        )
      );
    }
  },
  true
);

// No seleccionar nombres ni puestos al arrastrar.

document.addEventListener(
  'selectstart',
  e => {
    if (
      e.target.closest('.ggs-org-viewport')
    ) {
      e.preventDefault();
    }
  },
  true
);

// Desplazamiento horizontal entre fotos en móvil.

let swipe = null;

document.addEventListener(
  'pointerdown',
  e => {
    const g = e.target.closest(
      '.ggv5-gallery'
    );

    if (
      g &&
      e.pointerType === 'touch'
    ) {
      swipe = {
        g,
        id: g.dataset.ggv5Post,
        x: e.clientX
      };
    }
  },
  true
);

document.addEventListener(
  'pointerup',
  e => {
    if (
      !swipe ||
      e.pointerType !== 'touch'
    ) return;

    const v = swipe;
    swipe = null;

    if (!v.g.isConnected) return;

    const delta = e.clientX - v.x;

    if (Math.abs(delta) > 50) {
      v.g.dataset.swipeAt =
        String(Date.now());

      ggV5Go(
        v.id,
        delta < 0 ? 1 : -1
      );
    }
  },
  true
);

document.addEventListener("click",async e => {
  const btn = e.target.closest("[data-social]");
  if (!btn) return;

  e.preventDefault();

  const action = btn.dataset.social;
  const id = btn.dataset.id;

  if (action === "drawer") {
    openDrawer();

  } else if (action === "close-drawer") {
    state.drawer = false;
    renderDrawer();

  } else if (action === "child") {
    openDrawer(id);

  } else if (action === "sibling") {
    openDrawer(id,true);

  } else if (action === "choose-employee") {
    await move(id,state.pick);

  } else if (action === "remove") {
    if (confirm(
      "¿Quitar del organigrama? " +
      "Los subordinados pasarán a la raíz."
    )) {
      await change("org_remove",{
        employee_id:id
      });
    }

  } else if (action === "root-drop") {
    say(
      "Arrastra un empleado a un espacio vacío " +
      "del organigrama para dejarlo como raíz."
    );

  } else if (action === "zoom-in") {
    zoom(.15);

  } else if (action === "zoom-out") {
    zoom(-.15);

  } else if (action === "fit") {
    const viewport = $("ggsViewport");
    const stage = $("ggsStage");

    if (viewport && stage) {
      state.zoom = Math.max(
        .32,
        Math.min(
          1,
          (viewport.clientWidth-50) /
          stage.offsetWidth
        )
      );

      state.x = Math.max(
        10,
        (
          viewport.clientWidth -
          stage.offsetWidth*state.zoom
        )/2
      );

      state.y = 15;

      applyTransform();

      const label = document.querySelector(
        ".ggs-controls strong"
      );

      if (label) {
        label.textContent =
          Math.round(state.zoom*100)+"%";
      }
    }

  } else if (action === "person") {
    details(id);

  } else if (action === "badge-hint") {
    say(btn.dataset.hint || "Insignia");

  } else if (action === "badge-list") {
    badgeLibrary();

  } else if (action === "badge-new") {
    badgeWizard();

  } else if (action === "badge-edit") {
    badgeWizard(id);

  } else if (action === "badge-delete") {
    if (confirm(
      "¿Eliminar esta insignia? También " +
      "desaparecerá de los reconocimientos."
    )) {
      const storagePath = badge(id)?.image_path;

      const ok = await change(
        "badge_delete",
        {id}
      );

      if (ok) {
        if (storagePath) {
          db.storage
            .from("gg-social-media")
            .remove([storagePath])
            .catch(()=>{});
        }

        badgeLibrary();
      }
    }

  } else if (action === "badge-next-1") {
    state.edit.name =
      $("ggsBadgeName").value.trim();

    if (!state.edit.name) {
      say("Escribe el nombre de la insignia",true);
      return;
    }

    badgeWizard(state.edit.id,2);

  } else if (action === "badge-next-2") {
    badgeWizard(state.edit.id,3);

  } else if (action === "badge-step-1") {
    badgeWizard(state.edit.id,1);

  } else if (action === "badge-step-2") {
    badgeWizard(state.edit.id,2);

  } else if (action === "badge-save") {
    await saveBadge();

  } else if (action === "award-wizard") {
    awardWizard(id,1);

  } else if (action === "award-next-1") {
    awardWizard(state.edit.id,2);

  } else if (action === "award-next-2") {
    state.edit.month =
      $("ggsAwardMonth").value;

    if (
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(
        state.edit.month
      )
    ) {
      say("Selecciona un mes válido",true);
      return;
    }

    awardWizard(state.edit.id,3);

  } else if (action === "award-step-1") {
    awardWizard(state.edit.id,1);

  } else if (action === "award-step-2") {
    awardWizard(state.edit.id,2);

  } else if (action === "award-save") {
    const selected = document.querySelector(
      'input[name="ggsAwardBadge"]:checked'
    );

    if (!selected) {
      say("Elige una insignia",true);
      return;
    }

    const ok = await change("award_add",{
      employee_id:state.edit.id,
      badge_id:selected.value,
      award_month:state.edit.month+"-01"
    });

    if (ok) closeModal();

  } else if (action === "award-remove") {
    if (confirm(
      "¿Quitar este reconocimiento al empleado?"
    )) {
      const employeeId = state.edit.id;

      const ok = await change(
        "award_delete",
        {id}
      );

      if (ok) {
        awardWizard(employeeId,1);
      }
    }

  } else if (action === "post-new") {
    postEditor();

  } else if (action === "post-edit") {
    postEditor(id);

  } else if (action === "post-delete") {
    if (confirm(
      "¿Eliminar esta publicación y todos sus likes?"
    )) {
      const storagePath = state.posts.find(
        p=>p.id===id
      )?.image_path;

      const ok = await change(
        "post_delete",
        {id}
      );

      if (ok && storagePath) {
        db.storage
          .from("gg-social-media")
          .remove([storagePath])
          .catch(()=>{});
      }
    }

  } else if (action === "like") {
    await toggleLike(id);

  } else if (action === "likes") {
    await likeNames(id);

  } else if (action === "close-modal") {
    closeModal();

  } else if (action === "profile-all") {
    profileAll();

  } else if (action === "yo-org") {
    state.modal = "org";
    renderYoPanel();

  } else if (action === "yo-forum") {
    state.modal = "forum";
    renderYoPanel();

  } else if (action === "close-yo") {
    state.modal = null;
    renderYoPanel();

  } else if (action === "notice") {
    state.modal = "forum";

    await markSeen(id);
    renderYoPanel();

    document.getElementById(
      "ggsYoPanelContent"
    )?.querySelector(
      '[data-id="' + id + '"]'
    )?.closest(".ggs-post")
      ?.scrollIntoView({
        behavior:"smooth",
        block:"center"
      });
  }
});

document.addEventListener("submit",e => {
  if (e.target.id === "ggsPostForm") {
    e.preventDefault();
    void savePost();
  }
});

document.addEventListener("dragstart",e => {
  const node = e.target.closest(".ggs-node");

  if (node && mode === "rh") {
    e.dataTransfer.setData(
      "text/gg-employee",
      node.dataset.node
    );
  }
});

document.addEventListener("keydown",e => {
  if (
    (e.key === "Enter" || e.key === " ") &&
    e.target.matches(
      "[data-social=badge-hint]"
    )
  ) {
    e.preventDefault();
    say(e.target.dataset.hint);
    return;
  }

  if (e.key === "Escape") {
    closeModal();

    if (mode === "yo") {
      state.modal = null;
      renderYoPanel();
    }

    if (mode === "rh") {
      state.drawer = false;
      renderDrawer();
    }
  }
});

/* ============================================
   INICIO
============================================ */



  /* GG_SOCIAL_YO_SESSION_FIX_V3 */

  // Espera a que YO termine de validar
  // el usuario y contraseña asignados por RH.

  function ggSocialWaitYoReady() {

    return new Promise((resolve, reject) => {

      const area = $('yoContent');

      if (!area) {

        reject(
          Error(
            'No se encontró el contenido de YO.'
          )
        );

        return;
      }

      const ready = () =>
        area.classList.contains('ready') &&
        !!sessionStorage.getItem(
          'gg_intranet_token'
        );

      if (ready()) {
        resolve();
        return;
      }

      let finished = false;
      let observer;
      let timer;

      const finish = err => {

        if (finished) return;

        finished = true;

        if (observer) {
          observer.disconnect();
        }

        if (timer) {
          clearTimeout(timer);
        }

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      };

      observer = new MutationObserver(
        () => {

          if (ready()) {
            finish();
          }
        }
      );

      observer.observe(
        area,
        {
          attributes: true,
          attributeFilter: ['class']
        }
      );

      timer = setTimeout(
        () => finish(
          Error(
            'YO no terminó de validar la sesión. ' +
            'Revisa el acceso de intranet.'
          )
        ),
        20000
      );

      if (ready()) {
        finish();
      }

    });
  }

  // ==========================================
  // MENSAJE DE ERROR SIN OCULTAR BOTONES
  // ==========================================

  function ggSocialYoError(err) {

    const host = $('ggSocialYoMount');

    if (!host) return;

    let box = $('ggSocialYoErrorV3');

    if (!box) {

      box = document.createElement('div');

      box.id = 'ggSocialYoErrorV3';

      box.setAttribute(
        'role',
        'status'
      );

      box.style.cssText =
        'margin:12px 0;' +
        'padding:14px;' +
        'border:1px solid #45627a;' +
        'border-radius:13px;' +
        'background:#142435;' +
        'color:#e5f1fc;' +
        'font:12px/1.5 Manrope,system-ui,sans-serif';

      host.append(box);
    }

    box.replaceChildren();

    const info =
      document.createElement('span');

    info.textContent =
      'Organigrama y Foro: ' +
      (err?.message || String(err)) +
      '. Tu sesión principal de YO continúa activa.';

    const retry =
      document.createElement('button');

    retry.type = 'button';
    retry.textContent = 'Reintentar';

    retry.style.cssText =
      'display:block;' +
      'margin-top:9px;' +
      'padding:9px 14px;' +
      'border:1px solid #5381a6;' +
      'border-radius:10px;' +
      'background:#254e72;' +
      'color:#fff;' +
      'cursor:pointer';

    retry.onclick = async () => {

      retry.disabled = true;

      try {

        await ggSocialWaitYoReady();

        await load();

        box.remove();

      } catch (e) {

        info.textContent =
          'Organigrama y Foro: ' +
          (e?.message || String(e));

      } finally {

        retry.disabled = false;
      }
    };

    box.append(info, retry);
  }

  // ==========================================
  // INICIO PRINCIPAL
  // ==========================================

  async function start() {

    try {

      // RH, Mi Perfil y Sistema Central
      // usan autenticación administrativa.

      if (mode !== 'yo') {

        const {
          data,
          error: authError
        } = await db.auth.getUser();

        if (authError || !data?.user) {

          throw Error(
            'Inicia sesión con tu cuenta ' +
            'administrativa de Grupo Gutiérrez.'
          );
        }
      }

      // Crear los botones ANTES de pedir datos.
      // Así no desaparecen cuando falla
      // la conexión con Supabase.

      initShell();

      if (mode === 'yo') {

        if (
          $('yoEmployeeName') &&
          !$('ggsYoBadges')
        ) {

          $('yoEmployeeName')
            .insertAdjacentHTML(
              'afterend',
              '<div id="ggsYoBadges" ' +
              'class="ggs-profile-strip"></div>'
            );
        }

        $('yoNotificationButton')
          ?.addEventListener(
            'click',
            () => setTimeout(
              renderNotifications,
              100
            )
          );

        // YO NO usa auth.getUser().
        // Usa la sesión propia de intranet
        // que le proporcionó RH.

        await ggSocialWaitYoReady();
      }

      // Obtener organigrama, insignias
      // y publicaciones con la sesión correcta.

      await load();

      if (mode === 'yo') {

        $('ggSocialYoErrorV3')?.remove();

        setInterval(
          () => {

            if (
              !document.hidden &&
              $('yoContent')
                ?.classList.contains('ready')
            ) {

              load().catch(
                e => console.warn(
                  '[GG Social] Actualización:',
                  e?.message
                )
              );
            }

          },
          90000
        );
      }

    } catch (e) {

      console.error(
        '[GG Social]',
        e
      );

      if (mode === 'yo') {

        // Nunca borrar los botones de YO.
        ggSocialYoError(e);

      } else if (root) {

        root.textContent =
          'No fue posible cargar el contenido: ' +
          (e?.message || String(e));
      }
    }
  }
  if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    start,
    {once:true}
  );
} else {
  start();
}

})();
