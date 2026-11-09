
"use strict";

/*
 GRUPO GUTIÉRREZ
 ORGANIGRAMA + INSIGNIAS + FORO V1

 Ejecutar después del SQL:
 node instalar-organigrama-insignias-foro.cjs

 Sin Base64, sin compresión y sin archivos .bak.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = process.cwd();
const writes = new Map();
const before = new Map();

const at = f => path.join(ROOT, f);

function read(f) {
  if (!fs.existsSync(at(f))) {
    throw Error(
      "Falta " + f +
      ". Ejecuta desde desarrollo grupo."
    );
  }
  return fs.readFileSync(at(f), "utf8");
}

function put(f, content) {
  if (
    fs.existsSync(at(f)) &&
    read(f) !== content
  ) {
    throw Error(
      "Ya existe " + f +
      " con cambios; no lo sobrescribo."
    );
  }

  writes.set(f, content);
}

function patch(f, fn) {
  const original = read(f);
  const result = fn(original);

  if (result !== original) {
    writes.set(f, result);
  }
}

function insertUnique(s, marker, anchor, add, label) {
  if (s.includes(marker)) return s;

  const i = s.indexOf(anchor);

  if (
    i < 0 ||
    s.indexOf(anchor, i + anchor.length) >= 0
  ) {
    throw Error(
      "No localicé el ancla única de " + label
    );
  }

  return s.slice(0, i) + add + s.slice(i);
}

/* ============================================
   JAVASCRIPT PRINCIPAL
============================================ */

const NEW_JS = String.raw`
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
    "gg_social_snapshot",
    {p_session_token:token()}
  );

  state.people = data.people || [];
  state.org = data.org || [];
  state.badges = data.badges || [];
  state.awards = data.awards || [];
  state.posts = data.posts || [];
  state.me = data.me || null;

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

function renderOrg(target,editable) {
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

function applyTransform() {
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

function renderForum(target,admin) {
  const dst = $(target);
  if (!dst) return;

  dst.innerHTML =
    heading(
      "COMUNIDAD · GRUPO GUTIÉRREZ",
      "Foro Gutiérrez",
      "Publicaciones de Recursos Humanos, " +
      "de la más reciente a la más antigua."
    ) +

    (
      admin
        ? '<div class="ggs-bar">' +
          '<button class="ggs-primary"' +
          ' data-social="post-new"' +
          ' type="button">＋ Nueva publicación' +
          '</button></div>'
        : ''
    ) +

    '<div class="ggs-post-grid">' +

    state.posts.map(p =>
      '<article class="ggs-post">' +

      '<div class="ggs-post-image">' +
      (
        p.image_path
          ? image(
              media(p.image_path),
              p.title,
              "ggs-post-photo"
            )
          : '<div class="ggs-post-art">GG ✳</div>'
      ) +
      '</div>' +

      '<div class="ggs-post-copy">' +

      '<small>' +
      new Date(p.created_at)
        .toLocaleDateString("es-MX") +
      ' · RECURSOS HUMANOS</small>' +

      '<h3>' + esc(p.title) + '</h3>' +

      '<p>' + esc(p.body) + '</p>' +

      '<div class="ggs-post-actions">' +

      '<button data-social="like"' +
      ' data-id="' + p.id + '"' +
      ' type="button">' +
      (p.liked ? "♥" : "♡") +
      ' Me gusta</button>' +

      '<button data-social="likes"' +
      ' data-id="' + p.id + '"' +
      ' type="button">' +
      p.likes +
      ' likes · ver personas</button>' +

      '</div>' +

      (
        admin
          ? '<div class="ggs-post-admin">' +
            '<button data-social="post-edit"' +
            ' data-id="' + p.id + '"' +
            ' type="button">Editar</button>' +
            '<button data-social="post-delete"' +
            ' data-id="' + p.id + '"' +
            ' type="button">Eliminar</button>' +
            '</div>'
          : ''
      ) +

      '</div></article>'
    ).join("") +

    '</div>' +

    (
      state.posts.length
        ? ''
        : '<p class="ggs-empty">' +
          'Todavía no hay publicaciones.</p>'
    );
}

/* ============================================
   MODALES
============================================ */

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

function postEditor(id=null) {
  const p = state.posts.find(
    x => x.id === id
  );

  state.edit = {
    kind:"post",
    id,
    title:p?.title || "",
    body:p?.body || "",
    image_path:p?.image_path || "",
    file:null
  };

  modal(
    id ? "Editar publicación" : "Nueva publicación",

    '<form id="ggsPostForm">' +

    '<label class="ggs-field">Título' +
    '<input id="ggsPostTitle"' +
    ' maxlength="200" required' +
    ' value="' + esc(state.edit.title) + '">' +
    '</label>' +

    '<label class="ggs-field">' +
    'Texto de la publicación (sin límite ' +
    'de caracteres)' +
    '<textarea id="ggsPostBody" rows="8">' +
    esc(state.edit.body) +
    '</textarea></label>' +

    '<label class="ggs-field">' +
    'Foto cuadrada (PNG/JPG/WEBP, máximo 10 MB)' +
    '<input id="ggsPostFile" type="file"' +
    ' accept="image/png,image/jpeg,image/webp">' +
    '</label>' +

    '<p class="ggs-muted">' +
    'Preferible una fotografía cuadrada; ' +
    'se presentará visualmente en formato 1:1. ' +
    'No incluyas información confidencial ' +
    'en las imágenes.' +
    '</p>' +

    '<button class="ggs-primary"' +
    ' type="submit">' +
    'Publicar / Guardar</button>' +

    '</form>'
  );

  $("ggsPostFile").onchange = e => {
    state.edit.file =
      e.target.files?.[0] || null;
  };
}

async function savePost() {
  const draft = state.edit;
  if (!draft) return;

  draft.title =
    $("ggsPostTitle").value.trim();

  draft.body =
    $("ggsPostBody").value;

  if (!draft.title) {
    say("Escribe un título",true);
    return;
  }

  try {
    const storagePath = draft.file
      ? await upload(draft.file,"posts",10)
      : draft.image_path;

    const ok = await change("post_save",{
      id:draft.id,
      title:draft.title,
      body:draft.body,
      image_path:storagePath
    });

    if (ok) closeModal();

  } catch(e) {
    showError(e);
  }
}

/* ============================================
   EXPEDIENTE DE EMPLEADO E INSIGNIAS
============================================ */

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
  const popup = $("ggsYoPopup");
  if (!popup) return;

  if (!state.modal) {
    popup.innerHTML = "";
    return;
  }

  const title = state.modal === "org"
    ? "Organigrama y empleados"
    : "Foro Gutiérrez";

  popup.innerHTML =
    '<div class="ggs-modal-shade"' +
    ' data-social="close-yo"></div>' +

    '<section class="ggs-yo-window">' +

    '<header><strong>' +
    esc(title) +
    '</strong>' +

    '<button data-social="close-yo">' +
    '× Cerrar</button></header>' +

    '<div id="ggsYoPanelContent"></div>' +

    '</section>';

  if (state.modal === "org") {
    renderOrg(
      "ggsYoPanelContent",
      false
    );

  } else {
    renderForum(
      "ggsYoPanelContent",
      false
    );
  }
}

/* ============================================
   NUEVAS PUBLICACIONES EN CAMPANITA
============================================ */

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

async function start() {
  try {
    if (mode !== "yo") {
      const {data,error} =
        await db.auth.getUser();

      if (error || !data.user) {
        throw Error(
          "Inicia sesión con tu cuenta " +
          "de Grupo Gutiérrez."
        );
      }
    }

    initShell();

    if (mode === "yo") {
      $("yoEmployeeName")
        ?.insertAdjacentHTML(
          "afterend",
          '<div id="ggsYoBadges"' +
          ' class="ggs-profile-strip"></div>'
        );
    }

    await load();

    if (mode === "yo") {
      $("yoNotificationButton")
        ?.addEventListener(
          "click",
          () => setTimeout(
            renderNotifications,
            100
          )
        );

      setInterval(() => {
        if (!document.hidden) {
          load().catch(()=>{});
        }
      },90000);
    }

  } catch(e) {
    showError(e);

    root.textContent =
      "No fue posible cargar el contenido: " +
      e.message;
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
`;

/* ============================================
   CSS · APPLE / LIQUID GLASS
============================================ */

const NEW_CSS = String.raw`
/* GRUPO GUTIÉRREZ · SOCIAL LIQUID GLASS */

.ggs-app {
  --ggs-text:#eef5ff;
  --ggs-muted:#9badc4;
  --ggs-border:#30445e;
  --ggs-panel:rgba(18,31,47,.94);
  --ggs-accent:#83cfff;
  color:var(--ggs-text);
  font-family:Manrope,Inter,system-ui,sans-serif;
  min-width:0;
}

.ggs-app * {box-sizing:border-box}
.ggs-app button,
.ggs-app input,
.ggs-app textarea,
.ggs-app select {font:inherit}
.ggs-app button {cursor:pointer}
.ggs-app button:focus-visible {
  outline:2px solid var(--ggs-accent);
  outline-offset:2px;
}

/* HEADERS ANIMADOS */

.ggs-app .ggs-heading {
  display:flex;
  align-items:end;
  justify-content:space-between;
  gap:15px;
  margin:4px 0 22px;
}

.ggs-app .ggs-heading small,
.ggs-modal header small {
  letter-spacing:.18em;
  color:var(--ggs-accent);
  font-size:10px;
  font-weight:800;
}

.ggs-app .ggs-heading h2 {
  font-size:clamp(31px,4vw,56px);
  letter-spacing:-.066em;
  margin:8px 0 5px;
  font-weight:850;
  background:linear-gradient(
    100deg,
    #f9fdff,
    #7ec9f4,
    #b4a8ff,
    #f9fdff
  );
  background-size:250% 100%;
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  animation:ggsInk 10s ease-in-out
    infinite alternate;
}

.ggs-app .ggs-heading p {
  color:var(--ggs-muted);
  font-size:13px;
  margin:0;
  line-height:1.7;
}

/* BARRAS Y BOTONES */

.ggs-app .ggs-bar {
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:9px;
  margin:12px 0 17px;
}

.ggs-app .ggs-bar>button,
.ggs-modal button,
.ggs-yo-window header button {
  color:var(--ggs-text);
  border:1px solid var(--ggs-border);
  background:#1c3048;
  border-radius:12px;
  padding:11px 14px;
  font-size:12px;
  font-weight:750;
  transition:.2s;
}

.ggs-app .ggs-bar>button:hover,
.ggs-modal button:hover {
  border-color:var(--ggs-accent);
  transform:translateY(-1px);
}

.ggs-app .ggs-bar>.ggs-primary,
.ggs-modal .ggs-primary {
  background:linear-gradient(
    105deg,#a0e3ff,#cad9ff
  );
  border:0;
  color:#102a3f;
  font-weight:850;
}

.ggs-app .ggs-controls {
  display:flex;
  align-items:center;
  margin-left:auto;
  border:1px solid var(--ggs-border);
  border-radius:12px;
  overflow:hidden;
  background:#0d1d2d;
}

.ggs-controls button {
  background:none!important;
  color:var(--ggs-text)!important;
  border:0!important;
  padding:8px 12px!important;
}

.ggs-controls strong {
  font-size:11px;
  min-width:45px;
  text-align:center;
}

/* CANVAS DEL ORGANIGRAMA */

.ggs-org-viewport {
  position:relative;
  height:min(69vh,680px);
  min-height:400px;
  overflow:hidden;
  border-radius:22px;
  border:1px solid var(--ggs-border);
  background:
    radial-gradient(
      circle at 15% 10%,
      #20456255,
      transparent 42%
    ),
    linear-gradient(
      90deg,#20344922 1px,transparent 1px
    ),
    linear-gradient(
      #20344922 1px,transparent 1px
    ),
    #0b1522;
  background-size:auto,36px 36px,36px 36px,auto;
  touch-action:none;
  cursor:grab;
}

.ggs-org-viewport:active {cursor:grabbing}

.ggs-stage {
  position:absolute;
  top:0;
  left:0;
  transform-origin:0 0;
  transition:transform .12s ease-out;
}

.ggs-links {
  position:absolute;
  top:0;
  left:0;
  pointer-events:none;
  overflow:visible;
}

.ggs-links path {
  fill:none;
  stroke:#78b6e2;
  stroke-width:1.8;
  opacity:.58;
}

/* NODOS */

.ggs-node {
  position:absolute;
  width:230px;
  min-height:100px;
  z-index:1;
  border:1px solid #507394;
  border-radius:15px;
  background:linear-gradient(
    135deg,#1b344b,#152337
  );
  box-shadow:0 14px 40px #0005;
  transition:box-shadow .2s,border-color .2s;
  animation:ggsRise .4s both;
  overflow:visible;
}

.ggs-node.ggs-target,
.ggs-node:hover {
  border-color:#9ae8ff;
  box-shadow:0 13px 32px #123859aa;
}

.ggs-node-main {
  width:100%;
  display:flex;
  align-items:center;
  gap:10px;
  text-align:left;
  border:0;
  background:transparent;
  color:var(--ggs-text);
  padding:10px;
  min-height:99px;
}

.ggs-node-avatar {
  width:57px;
  height:70px;
  flex:none;
  border-radius:10px;
  background:#24435a;
  display:grid;
  place-items:center;
  overflow:hidden;
}

.ggs-node-main>span:last-child {min-width:0}

.ggs-node-main strong {
  display:block;
  font-size:12px;
  line-height:1.3;
  overflow-wrap:anywhere;
}

.ggs-node-main small {
  display:block;
  font-size:10px;
  color:var(--ggs-muted);
  margin-top:4px;
}

.ggs-photo,
.ggs-award-photo {
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.ggs-initials {
  font-size:28px;
  color:#8bcef5;
}

.ggs-node-actions {
  display:flex;
  gap:2px;
  border-top:1px solid #36506a;
  padding:6px;
}

.ggs-node-actions button {
  flex:1;
  border:0;
  color:#9ecde9;
  background:#26405975;
  border-radius:7px;
  font-size:9px;
  padding:6px 3px;
}

/* INSIGNIAS PEQUEÑAS */

.ggs-badges {
  display:flex;
  flex-wrap:wrap;
  gap:5px;
  align-items:center;
  margin:7px 0;
}

.ggs-medal {
  display:grid;
  place-items:center;
  width:27px;
  height:27px;
  border-radius:9px;
  background:#5da7d51c;
  border:1px solid #79a4ca55;
  cursor:help;
  overflow:hidden;
  transition:transform .2s;
}

.ggs-medal:hover {
  transform:translateY(-3px) scale(1.07);
}

.ggs-medal-img {
  height:24px;
  width:24px;
  object-fit:contain;
}

.ggs-node .ggs-medal {
  width:21px;
  height:21px;
}

.ggs-node .ggs-medal-img {
  width:19px;
  height:19px;
}

.ggs-help,
.ggs-muted {
  font-size:12px;
  color:var(--ggs-muted);
  line-height:1.7;
}

.ggs-empty {
  border:1px dashed var(--ggs-border);
  border-radius:16px;
  padding:25px;
  color:var(--ggs-muted);
  font-size:13px;
  text-align:center;
}

/* DRAWER DE EMPLEADOS */

.ggs-drawer-backdrop {
  position:fixed;
  inset:0;
  background:#05111b30;
  z-index:400;
  pointer-events:none;
}

.ggs-drawer {
  position:fixed;
  z-index:410;
  right:0;
  top:0;
  height:100vh;
  width:min(460px,95vw);
  background:#101e2e;
  border-left:1px solid #44607a;
  box-shadow:-20px 0 85px #0007;
  padding:25px;
  overflow-y:auto;
  animation:ggsSide .3s both;
}

.ggs-drawer header {
  display:flex;
  justify-content:space-between;
  gap:12px;
}

.ggs-drawer header h3 {
  font-size:26px;
  margin:5px 0;
}

.ggs-drawer header small {
  font-size:10px;
  color:var(--ggs-accent);
}

.ggs-drawer header p {
  color:var(--ggs-muted);
  font-size:12px;
}

.ggs-drawer header button {
  align-self:start;
  background:#20394e;
  color:white;
  border:1px solid #48607b;
  border-radius:10px;
  padding:10px;
}

.ggs-drawer>input,
.ggs-search input {
  width:100%;
  background:#142c40;
  color:#eaf6ff;
  border:1px solid #3e5770;
  border-radius:11px;
  padding:13px;
  margin:10px 0 16px;
}

.ggs-drawer-grid,
.ggs-people-grid {
  display:grid;
  grid-template-columns:
    repeat(auto-fill,minmax(160px,1fr));
  gap:12px;
}

.ggs-people-grid {
  grid-template-columns:
    repeat(auto-fill,minmax(165px,1fr));
}

.ggs-person-wrap {
  background:#15283b;
  border:1px solid #39506a;
  border-radius:17px;
  padding:8px;
  min-width:0;
}

.ggs-person {
  width:100%;
  background:transparent;
  border:0;
  color:var(--ggs-text);
  text-align:left;
  display:flex;
  flex-direction:column;
  gap:5px;
  padding:8px;
}

.ggs-person-pic {
  height:105px;
  width:100%;
  display:grid;
  place-items:center;
  background:#223c52;
  border-radius:12px;
  overflow:hidden;
}

.ggs-person strong {
  font-size:12px;
  line-height:1.35;
  overflow-wrap:anywhere;
  margin-top:6px;
}

.ggs-person small,
.ggs-person span:last-child {
  font-size:10px;
  color:var(--ggs-muted);
}

.ggs-drawer-state {
  display:block;
  text-align:center;
  font-size:10px;
  color:#96bcd8;
  margin:5px;
}

.ggs-person-awards {padding:0 7px}

.ggs-search {
  display:block;
  color:var(--ggs-muted);
  font-size:12px;
  margin:20px 0 15px;
  max-width:550px;
}

/* FORO INSTAGRAM */

.ggs-post-grid {
  display:grid;
  grid-template-columns:
    repeat(auto-fill,minmax(290px,1fr));
  gap:19px;
}

.ggs-post {
  border:1px solid var(--ggs-border);
  border-radius:23px;
  overflow:hidden;
  background:rgba(25,41,58,.85);
  animation:ggsRise .5s both;
}

.ggs-post-image {
  aspect-ratio:1;
  overflow:hidden;
  display:grid;
  place-items:center;
  background:linear-gradient(
    135deg,#203e62,#3e6387,#1b2539
  );
}

.ggs-post-photo {
  width:100%;
  height:100%;
  object-fit:cover;
}

.ggs-post-art {
  font-size:54px;
  font-weight:900;
  letter-spacing:-.08em;
  color:#d9f2ff;
}

.ggs-post-copy {padding:19px}

.ggs-post-copy>small {
  color:#91b1c8;
  font-size:10px;
  letter-spacing:.05em;
}

.ggs-post-copy h3 {
  font-size:21px;
  letter-spacing:-.04em;
  margin:9px 0;
}

.ggs-post-copy>p {
  font-size:13px;
  color:#c5d1e0;
  line-height:1.7;
  white-space:pre-wrap;
  overflow-wrap:anywhere;
  max-height:260px;
  overflow:auto;
}

.ggs-post-actions,
.ggs-post-admin {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  padding-top:12px;
  border-top:1px solid #33485c;
}

.ggs-post-actions button,
.ggs-post-admin button {
  border:0;
  background:#22456155;
  color:#aee0fb;
  padding:8px 11px;
  border-radius:9px;
  font-size:12px;
}

.ggs-post-admin {margin-top:13px}

/* MODALES GRANDES */

#ggsDialogLayer {
  position:fixed;
  inset:0;
  z-index:10020;
  pointer-events:none;
}

.ggs-modal-shade {
  position:absolute;
  inset:0;
  background:#06111cc9;
  backdrop-filter:blur(10px);
  pointer-events:auto;
}

.ggs-modal {
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  width:min(840px,calc(100vw - 24px));
  max-height:92vh;
  overflow:auto;
  border-radius:24px;
  background:#111e2e;
  color:#e7f4ff;
  box-shadow:0 30px 100px #000b;
  border:1px solid #42617a;
  pointer-events:auto;
  animation:ggsModal .24s both;
}

.ggs-modal header {
  position:sticky;
  top:0;
  z-index:1;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:22px 25px;
  border-bottom:1px solid #324e65;
  background:#152539;
}

.ggs-modal header h2 {
  margin:4px 0 0;
  font-size:25px;
  letter-spacing:-.05em;
}

.ggs-modal header button {
  font-size:22px;
  padding:6px 13px;
}

.ggs-modal-body {padding:25px}

.ggs-steps {
  font-size:11px;
  color:#85c7f1;
  letter-spacing:.08em;
  margin:0 0 18px;
}

.ggs-field {
  display:grid;
  gap:9px;
  font-size:12px;
  font-weight:750;
  margin:15px 0;
}

.ggs-field input,
.ggs-field textarea {
  border-radius:12px;
  border:1px solid #48647c;
  padding:14px;
  background:#0c1826;
  color:#f1f9ff;
  width:100%;
  resize:vertical;
}

.ggs-preview {
  padding:25px;
  text-align:center;
}

.ggs-preview img {
  max-height:140px;
  object-fit:contain;
}

.ggs-library {
  display:grid;
  grid-template-columns:
    repeat(auto-fill,minmax(180px,1fr));
  gap:12px;
}

.ggs-library-item {
  display:grid;
  gap:9px;
  justify-items:center;
  text-align:center;
  background:#1b3144;
  border:1px solid #42617b;
  padding:17px;
  border-radius:14px;
}

.ggs-library-pic {
  height:76px;
  width:76px;
  object-fit:contain;
}

.ggs-library-item button {width:100%}

.ggs-award-person {
  display:flex;
  align-items:center;
  gap:17px;
  margin-bottom:20px;
}

.ggs-award-photo {
  height:115px;
  width:105px;
  border-radius:13px;
  object-fit:cover;
  background:#2e5472;
}

.ggs-award-person h3 {
  font-size:23px;
  margin:0 0 5px;
}

.ggs-award-person p {
  color:#a2bcd0;
  font-size:12px;
}

.ggs-awards-remove {
  display:grid;
  gap:7px;
  margin:13px 0 25px;
}

.ggs-award-choices {
  display:grid;
  grid-template-columns:
    repeat(auto-fill,minmax(170px,1fr));
  gap:12px;
  margin:20px 0;
}

.ggs-award-choice {
  border:1px solid #365d7b;
  border-radius:13px;
  display:grid;
  justify-items:center;
  padding:14px;
  gap:10px;
  font-size:12px;
  cursor:pointer;
}

.ggs-likes-list>div {
  border-bottom:1px solid #385066;
  padding:12px 0;
}

.ggs-likes-list strong {display:block}
.ggs-likes-list small {color:#a2b6ca}

/* YO */

.ggs-yo-buttons {
  display:flex;
  gap:12px;
  flex-wrap:wrap;
  margin:18px 0 30px;
}

.ggs-yo-buttons button {
  border:1px solid #38566c;
  background:#193248;
  color:#c6e8fa;
  padding:14px 22px;
  border-radius:14px;
  font-weight:800;
  transition:transform .2s;
}

.ggs-yo-buttons button:hover {
  transform:translateY(-2px);
  background:#254966;
}

.ggs-yo-window {
  position:fixed;
  inset:5vh 3vw;
  z-index:8000;
  border:1px solid #3a5d78;
  border-radius:26px;
  background:#101b2b;
  box-shadow:0 24px 110px #000b;
  overflow:auto;
  padding:25px;
  animation:ggsRise .3s both;
}

.ggs-yo-window>header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  border-bottom:1px solid #385067;
  padding-bottom:17px;
  margin-bottom:24px;
}

.ggs-yo-window>header button {cursor:pointer}

.ggs-profile-strip {margin:12px 0}

.ggs-profile-heading {
  font-size:11px;
  letter-spacing:.1em;
  color:#8eacc6;
  margin:13px 0;
}

.ggs-mini-link {
  background:none;
  border:0;
  color:#99d8fd;
  font-size:11px;
  margin:10px 0;
  cursor:pointer;
}

/* CAMPANITA DE FORO */

.ggs-forum-notices {
  padding:5px;
  display:grid;
  gap:7px;
}

.ggs-forum-notices>small {
  color:#80c4ee;
  font-size:10px;
  font-weight:800;
}

.ggs-forum-notices>button {
  border:1px solid #305772;
  border-radius:11px;
  background:#1a3346;
  color:#e9f7ff;
  text-align:left;
  padding:12px;
  cursor:pointer;
}

.ggs-forum-notices strong,
.ggs-forum-notices span {
  display:block;
  font-size:12px;
}

.ggs-forum-notices span {
  font-size:10px;
  color:#83b7d4;
  margin-top:5px;
}

.ggs-has-news {
  box-shadow:0 0 0 3px #58bbfc55!important;
}

/* MENSAJES */

.ggs-toast {
  position:fixed;
  z-index:30000;
  bottom:25px;
  left:50%;
  transform:translateX(-50%);
  border:1px solid #71bddf;
  background:#122a3c;
  color:#e8faff;
  border-radius:12px;
  padding:14px 20px;
  font:700 12px Manrope,sans-serif;
  box-shadow:0 20px 55px #0008;
}

.ggs-toast.error {
  border-color:#c77a7a;
  background:#391f2a;
}

/* ANIMACIONES */

@keyframes ggsInk {
  to {background-position:100% 0}
}

@keyframes ggsRise {
  from {
    opacity:0;
    transform:translateY(15px);
  }
  to {
    opacity:1;
    transform:translateY(0);
  }
}

@keyframes ggsSide {
  from {transform:translateX(100%)}
  to {transform:translateX(0)}
}

@keyframes ggsModal {
  from {
    opacity:0;
    transform:translate(-50%,-47%);
  }
  to {
    opacity:1;
    transform:translate(-50%,-50%);
  }
}

/* PANEL DE YO SOBRE TODAS LAS CAPAS */

#ggsYoPopup .ggs-modal-shade {
  position:fixed;
  inset:0;
  z-index:7900;
}

/* PESTAÑAS RH RESPONSIVE */

.module-browser .module-tabbar {
  overflow-x:auto;
  scrollbar-width:thin;
  flex-wrap:nowrap;
  gap:4px;
}

.module-browser .module-tabbar .module-tab {
  flex:0 0 auto;
  white-space:nowrap;
}

/* RESPONSIVE */

@media(max-width:780px) {
  .ggs-yo-window {
    inset:2vh 10px;
    padding:14px;
  }

  .ggs-app .ggs-heading h2 {
    font-size:32px;
  }

  .ggs-post-grid {
    grid-template-columns:1fr;
  }

  .ggs-people-grid {
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }

  .ggs-app .ggs-controls {
    margin-left:0;
  }
}

@media(prefers-reduced-motion:reduce) {
  .ggs-app *,
  .ggs-modal,
  .ggs-yo-window {
    animation:none!important;
    transition:none!important;
  }
}
`;

/* ============================================
   NUEVO MÓDULO INDEPENDIENTE
============================================ */

const NEW_PAGE = String.raw`
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport"
 content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0b1420">
<title>
  Organigrama y Empleados · Grupo Gutiérrez
</title>
<link
 href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;700;800&display=swap"
 rel="stylesheet">
<link rel="stylesheet" href="css/gg-social.css">
<style>
*{box-sizing:border-box}
body{
 margin:0;
 min-height:100vh;
 color:#edf5ff;
 background:
 radial-gradient(ellipse at 9% 12%,#1b3d5d,transparent 42%),
 radial-gradient(ellipse at 91% 82%,#282b56,transparent 40%),
 #09121d;
 font-family:Manrope,system-ui,sans-serif;
}
.ggs-site-top{
 display:flex;
 justify-content:space-between;
 align-items:center;
 gap:12px;
 padding:22px max(20px,calc((100vw - 1480px)/2));
 border-bottom:1px solid #273e54;
 background:#111f2dcc;
}
.ggs-site-top a{
 color:#dff1ff;
 text-decoration:none;
 font-size:13px;
 font-weight:750;
}
.ggs-site-top strong{
 font-size:24px;
 letter-spacing:-.06em;
}
.ggs-site-main{
 max-width:1500px;
 margin:auto;
 padding:38px 22px 90px;
}
</style>
</head>
<body>
<header class="ggs-site-top">
 <a href="sistema.html">
  <strong>GG ✳</strong> Grupo Gutiérrez
 </a>
 <a href="sistema.html">← Sistema Central</a>
</header>
<main class="ggs-site-main">
 <div id="ggSocialStandalone" class="ggs-app">
  Cargando organigrama…
 </div>
</main>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
<script src="js/gg-social.js"></script>
</body>
</html>
`;

/* ============================================
   CREACIÓN DE ARCHIVOS
============================================ */

put(
  "js/gg-social.js",
  NEW_JS.trimStart()
);

put(
  "css/gg-social.css",
  NEW_CSS.trimStart()
);

put(
  "organigrama-empleados.html",
  NEW_PAGE.trimStart()
);

/* ============================================
   RH: NUEVAS PESTAÑAS
============================================ */

patch("recursos-humanos.html",s => {
  if (!s.includes("GG_SOCIAL_RH_TABS_V1")) {
    const nav = s.indexOf(
      'class="module-tabbar"'
    );

    const end = s.indexOf("</nav>",nav);

    if (nav<0 || end<0) {
      throw Error(
        "No encontré la barra de pestañas de RH"
      );
    }

    const buttons =
      '<!-- GG_SOCIAL_RH_TABS_V1 -->\n' +

      '<button type="button" class="module-tab"' +
      ' data-module-tab="organigrama"' +
      ' aria-selected="false">' +
      '<span class="module-tab-dot"></span>' +
      'Organigrama</button>\n' +

      '<button type="button" class="module-tab"' +
      ' data-module-tab="insignias"' +
      ' aria-selected="false">' +
      '<span class="module-tab-dot"></span>' +
      'Insignias</button>\n' +

      '<button type="button" class="module-tab"' +
      ' data-module-tab="foro-gutierrez"' +
      ' aria-selected="false">' +
      '<span class="module-tab-dot"></span>' +
      'Foro Gutiérrez</button>\n';

    s = s.slice(0,end) +
        buttons +
        s.slice(end);
  }

  if (!s.includes("GG_SOCIAL_RH_PANELS_V1")) {
    const match = s.match(
      /\s*<\/div>\s*<!-- \/module-tab-content -->/
    );

    if (!match) {
      throw Error(
        "No encontré el cierre de pestañas RH"
      );
    }

    const panels =
      '<!-- GG_SOCIAL_RH_PANELS_V1 -->\n' +

      '<section class="module-tab-panel"' +
      ' data-module-panel="organigrama">' +
      '<div id="ggSocialRH" class="ggs-app">' +
      '</div></section>\n' +

      '<section class="module-tab-panel"' +
      ' data-module-panel="insignias">' +
      '<div id="ggSocialBadgesRH"' +
      ' class="ggs-app"></div></section>\n' +

      '<section class="module-tab-panel"' +
      ' data-module-panel="foro-gutierrez">' +
      '<div id="ggSocialForumRH"' +
      ' class="ggs-app"></div></section>\n';

    s = insertUnique(
      s,
      "GG_SOCIAL_RH_PANELS_V1",
      match[0],
      panels,
      "panel RH"
    );
  }

  s = insertUnique(
    s,
    "css/gg-social.css",
    "</head>",
    '<link rel="stylesheet"' +
    ' href="css/gg-social.css">\n',
    "CSS de RH"
  );

  s = insertUnique(
    s,
    'src="js/gg-social.js"',
    "</body>",
    '<script type="text/gg-protected"' +
    ' src="js/gg-social.js"></script>\n',
    "JS protegido de RH"
  );

  return s;
});

/* ============================================
   YO: BOTONES, FORO E INSIGNIAS
============================================ */

patch("yo.html",s => {
  s = insertUnique(
    s,
    'id="ggSocialYoMount"',
    '<section class="yo-vacations-section">',
    '<div id="ggSocialYoMount"' +
    ' class="ggs-app"></div>\n',
    "botones de YO"
  );

  s = insertUnique(
    s,
    "css/gg-social.css",
    "</head>",
    '<link rel="stylesheet"' +
    ' href="css/gg-social.css">\n',
    "CSS de YO"
  );

  s = insertUnique(
    s,
    'src="js/gg-social.js"',
    "</body>",
    '<script src="js/gg-social.js"></script>\n',
    "JS de YO"
  );

  return s;
});

/* ============================================
   MI PERFIL Y NOTIFICACIONES
============================================ */

patch("mi-perfil-notificaciones.html",s => {
  if (!s.includes('id="ggSocialProfileMount"')) {
    const anchor =
      /(<p class="gmp-job" id="gmpJob">[\s\S]*?<\/p>)/;

    if (!anchor.test(s)) {
      throw Error(
        "No encontré el puesto de Mi Perfil"
      );
    }

    s = s.replace(
      anchor,
      '$1\n' +
      '<div id="ggSocialProfileMount"' +
      ' class="ggs-app"></div>'
    );
  }

  s = insertUnique(
    s,
    "css/gg-social.css",
    "</head>",
    '<link rel="stylesheet"' +
    ' href="css/gg-social.css">\n',
    "CSS de Mi Perfil"
  );

  s = insertUnique(
    s,
    'src="js/gg-social.js"',
    "</body>",
    '<script type="text/gg-protected"' +
    ' src="js/gg-social.js"></script>\n',
    "JS protegido de Mi Perfil"
  );

  return s;
});

/* ============================================
   SISTEMA CENTRAL: NUEVA TARJETA
============================================ */

patch("sistema.html",s => {
  if (s.includes("GG_SOCIAL_SYSTEM_TILE_V1")) {
    return s;
  }

  const tile =
    '<!-- GG_SOCIAL_SYSTEM_TILE_V1 -->\n' +

    '<div class="module-shell slot-gg-social"' +
    ' style="--delay:.82s">\n' +

    '<button class="module-card" type="button"' +
    ' data-module="organigrama-empleados">\n' +

    '<span class="card-top">' +
    '<span class="card-icon">◇</span>' +
    '<span class="card-serial">13 / 13</span>' +
    '</span>\n' +

    '<span class="card-content">' +
    '<span class="card-eyebrow">' +
    'CAPITAL HUMANO</span>' +

    '<strong class="card-title">' +
    'organigrama y empleados</strong>' +

    '<span class="card-description">' +
    'Personas, equipos e insignias</span>' +
    '</span>\n' +

    '<span class="card-footer">' +
    '<span class="card-meta">DIRECTORIO</span>' +
    '<span class="card-arrow">↗</span>' +
    '</span>\n' +

    '</button></div>\n';

  return insertUnique(
    s,
    "GG_SOCIAL_SYSTEM_TILE_V1",
    "<!-- GG_TEC_INSTALADO_V1 -->",
    tile,
    "tarjeta de Sistema Central"
  );
});

/* ============================================
   REGISTRAR RUTA DE NUEVO MÓDULO
============================================ */

patch("js/sistema.js",s => {
  const anchor =
    "const ROUTES = Object.freeze({";

  if (
    s.includes('"organigrama-empleados": {')
  ) return s;

  if (!s.includes(anchor)) {
    throw Error("No encontré ROUTES");
  }

  return s.replace(
    anchor,
    anchor + '\n' +
    '    "organigrama-empleados": {' +
    'name:"Organigrama y Empleados",' +
    'url:"organigrama-empleados.html"},'
  );
});

/* ============================================
   VITE
============================================ */

patch("vite.config.js",s => {
  if (s.includes("organigramaEmpleados:")) {
    return s;
  }

  const anchor = "input: {";

  if (!s.includes(anchor)) {
    throw Error(
      "No encontré input en vite.config.js"
    );
  }

  return s.replace(
    anchor,
    anchor + '\n' +
    '    organigramaEmpleados: resolve(' +
    '__dirname, "organigrama-empleados.html"),'
  );
});

/* ============================================
   VALIDACIONES ANTES DE ESCRIBIR
============================================ */

for (const [filename,content] of writes) {
  if (!content.trim()) {
    throw Error("Archivo vacío: " + filename);
  }

  if (
    filename.endsWith(".js") &&
    filename !== "vite.config.js"
  ) {
    new vm.Script(content,{
      filename
    });
  }

  if (
    filename.endsWith(".html") &&
    !content.includes("</html>")
  ) {
    throw Error(
      "HTML incompleto: " + filename
    );
  }

  before.set(
    filename,
    fs.existsSync(at(filename))
      ? fs.readFileSync(at(filename))
      : null
  );
}

/* ============================================
   GUARDADO CON RECUPERACIÓN
   SIN .BAK NI CARPETAS BACKUP
============================================ */

const written = [];

try {
  for (const [filename,content] of writes) {
    if (
      before.get(filename)?.toString("utf8")
      === content
    ) {
      continue;
    }

    fs.mkdirSync(
      path.dirname(at(filename)),
      {recursive:true}
    );

    written.push(filename);

    fs.writeFileSync(
      at(filename),
      content,
      "utf8"
    );
  }

} catch(error) {
  for (const filename of written.reverse()) {
    try {
      const original = before.get(filename);

      if (original === null) {
        fs.rmSync(
          at(filename),
          {force:true}
        );
      } else {
        fs.writeFileSync(
          at(filename),
          original
        );
      }

    } catch(e) {
      console.error(
        "No pude restaurar " +
        filename + ": " + e.message
      );
    }
  }

  throw error;
}

console.log(
  "\n✓ Organigrama, Insignias y Foro instalados."
);
console.log(
  "✓ RH: 3 nuevas pestañas."
);
console.log(
  "✓ YO: botones, avisos e insignias."
);
console.log(
  "✓ Mi Perfil: insignias."
);
console.log(
  "✓ Sistema Central: nuevo módulo."
);
console.log(
  "✓ Archivos escritos: " + written.length
);
console.log(
  "✓ Sin .bak ni carpetas de backup."
);
