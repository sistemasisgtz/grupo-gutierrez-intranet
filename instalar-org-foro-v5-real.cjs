
'use strict';

/*
 Grupo Gutiérrez — Organigrama y Foro V5 REAL
 Usa js/gg-social.js V4 con sesión YO V3.

 SQL V5 multimedia debe existir previamente.

 Ejecutar:
 node instalar-org-foro-v5-real.cjs

 Sin .bak, sin dependencias adicionales.
 Recuperación en memoria si falla la escritura.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = process.cwd();

const jsName = 'js/gg-social.js';
const cssName = 'css/gg-social-v5.css';

const pages = [
  'yo.html',
  'recursos-humanos.html',
  'organigrama-empleados.html',
  'mi-perfil-notificaciones.html'
];

const full = p => path.join(root, p);

const originals = new Map();

for (const name of [jsName, ...pages]) {
  if (!fs.existsSync(full(name))) {
    throw Error(
      'Falta ' + name +
      '. Ejecuta desde desarrollo grupo.'
    );
  }

  originals.set(
    name,
    fs.readFileSync(full(name))
  );
}

const previousCSS = fs.existsSync(full(cssName))
  ? fs.readFileSync(full(cssName))
  : null;

originals.set(cssName, previousCSS);

const MARK = 'GG_SOCIAL_V5_REAL_INTEGRATION';

let js = originals.get(jsName).toString('utf8');

if (
  !js.includes('GG_SOCIAL_YO_SESSION_FIX_V3') ||
  !js.includes('GG_SOCIAL_FOCUS_GESTURE_V4') ||
  !js.includes('gg_social_snapshot')
) {
  throw Error(
    'No coincide con el Organigrama V4 + ' +
    'sesión YO V3. No se modificó nada.'
  );
}

if (
  js.includes('GG_SOCIAL_FORUM_GALLERY_FULLSCREEN_V5') &&
  !js.includes(MARK)
) {
  throw Error(
    'Se detectó otro V5. ' +
    'No voy a mezclar implementaciones.'
  );
}

function onlyOne(source, re, label) {
  const found = [...source.matchAll(re)];

  if (found.length !== 1) {
    throw Error(
      label + ': se esperaba 1 coincidencia y hubo ' +
      found.length + '. Sin cambios.'
    );
  }

  return found[0];
}

function swap(source, name, next, replacement) {
  const a = onlyOne(
    source,
    new RegExp(
      '(?:^|\\n)\\s*(?:async\\s+)?function\\s+' +
      name + '\\s*\\(',
      'g'
    ),
    'Función ' + name
  );

  const searchAt = a.index + a[0].length;

  const b = onlyOne(
    source.slice(searchAt),
    new RegExp(
      '\\n\\s*(?:async\\s+)?function\\s+' +
      next + '\\s*\\(',
      'g'
    ),
    'Fin de ' + name
  );

  const cut = searchAt + b.index;

  return source.slice(0, a.index) +
    '\n' +
    replacement.trim() +
    '\n\n' +
    source.slice(cut);
}

// ==================================================
// NUEVA LÓGICA DEL FORO
// ==================================================

if (!js.includes(MARK)) {

  // Leer datos existentes y nuevos adjuntos,
  // sin modificar la autenticación de YO.

  js = swap(
    js,
    'load',
    'change',
    String.raw`
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
`
  );

  // ================================================
  // FORO CON CARRUSEL, FOTOS Y PDF
  // ================================================

  js = swap(
    js,
    'renderForum',
    'modal',
    String.raw`
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
`
  );

  // ================================================
  // EDITOR DE PUBLICACIONES MULTIMEDIA
  // ================================================

  js = swap(
    js,
    'postEditor',
    'savePost',
    String.raw`
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
`
  );

  // ================================================
  // GUARDAR POST Y SUS ARCHIVOS
  // ================================================

  js = swap(
    js,
    'savePost',
    'details',
    String.raw`
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
`
  );

  // ================================================
  // YO: ORGANIGRAMA FULLSCREEN
  // ================================================

  js = swap(
    js,
    'renderYoPanel',
    'renderNotifications',
    String.raw`
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
`
  );

  // ================================================
  // ACTIVAR PANTALLA COMPLETA EN MÓDULO
  // SIN REEMPLAZAR LA FUNCIÓN render()
  // ================================================

  const modeAnchor =
    /\bconst\s+token\s*=\s*\(\s*\)\s*=>/g;

  const tokenMatch = onlyOne(
    js,
    modeAnchor,
    'Declaración de sesión'
  );

  js =
    js.slice(0, tokenMatch.index) +

    'if(mode==="module")' +
    'document.body.classList.add("ggv5-module");\n\n' +

    js.slice(tokenMatch.index);

  // ================================================
  // NUEVAS FUNCIONES DEL CARRUSEL Y LOS ARCHIVOS
  // ================================================

  const extras = String.raw`

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
`;

  // Insertar antes del controlador real,
  // sin depender del comentario "// EVENTOS".

  const click =
    /\bdocument\s*\.\s*addEventListener\s*\(\s*["']click["']\s*,\s*async\b/g;

  const hit = onlyOne(
    js,
    click,
    'Controlador original de clics'
  );

  js =
    js.slice(0, hit.index) +
    extras +
    '\n' +
    js.slice(hit.index);
}

// ==================================================
// ESTILOS PROPIOS V5, SIN SOBRESCRIBIR LOS V4
// ==================================================

const css = String.raw`
/* GG_SOCIAL_V5_REAL_INTEGRATION */

/* No seleccionar texto al mover el organigrama */

.ggs-org-viewport,
.ggs-org-viewport * {
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-touch-callout: none;
}

.ggs-org-viewport img {
  -webkit-user-drag: none;
  pointer-events: none;
}

/* Módulo independiente fullscreen */

body.ggv5-module {
  overflow: hidden;
}

.ggv5-module .ggs-site-top {
  display: none !important;
}

.ggv5-module .ggs-site-main {
  width: 100vw !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

.ggv5-module #ggsModuleOrg {
  position: relative;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
}

.ggv5-module #ggsModuleOrg > .ggs-heading,
.ggv5-module #ggsModuleOrg > .ggs-help {
  display: none !important;
}

/* Controles de zoom flotantes */

.ggv5-module #ggsModuleOrg > .ggs-bar,
#ggsYoPopup.ggv5-org-open
#ggsYoPanelContent > .ggs-bar {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 60;
  margin: 0 !important;
  padding: 6px;

  border: 1px solid #4b667f;
  border-radius: 13px;
  background: #122337e8;
  backdrop-filter: blur(14px);
}

.ggv5-module
#ggsModuleOrg > .ggs-bar > *:not(.ggs-controls),

#ggsYoPopup.ggv5-org-open
#ggsYoPanelContent > .ggs-bar > *:not(.ggs-controls) {
  display: none !important;
}

/* Lienzo completo */

.ggv5-module #ggsModuleOrg .ggs-org-viewport,
#ggsYoPopup.ggv5-org-open .ggs-org-viewport {
  height: 100dvh !important;
  min-height: 0 !important;
  width: 100vw !important;

  border: 0;
  border-radius: 0;
}

/* Volver */

.ggv5-back {
  position: fixed;
  left: 14px;
  top: 14px;
  z-index: 100;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 11px 15px;

  background: #122a3fe8;
  backdrop-filter: blur(13px);
  border: 1px solid #557995;
  color: #e7f7ff;
  border-radius: 13px;

  text-decoration: none;
  font: 800 12px Manrope, sans-serif;
  cursor: pointer;
}

.ggv5-back:hover {
  background: #295374;
}

/* Organigrama fullscreen dentro de YO */

#ggsYoPopup.ggv5-org-open .ggs-yo-window {
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  max-height: none !important;

  padding: 0 !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;

  overflow: hidden !important;
  background: #091523;
  animation: none !important;
}

#ggsYoPopup.ggv5-org-open #ggsYoPanelContent {
  width: 100vw;
  height: 100dvh;
  position: relative;
  overflow: hidden;
}

#ggsYoPopup.ggv5-org-open .ggs-heading,
#ggsYoPopup.ggv5-org-open .ggs-help {
  display: none !important;
}

/* Carrusel del Foro */

.ggv5-gallery {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.ggv5-photo {
  display: block;
  position: absolute;
  inset: 0;

  width: 100%;
  height: 100%;

  border: 0;
  padding: 0;
  background: transparent;
  cursor: zoom-in;
}

.ggv5-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ggv5-magnify {
  position: absolute;
  bottom: 15px;
  left: 14px;

  border-radius: 999px;
  background: #071b2ad9;
  color: white;

  padding: 8px 11px;
  border: 1px solid #ffffff44;

  font: 650 11px Manrope, sans-serif;
  opacity: 0;
  transition: opacity .2s;
}

.ggv5-photo:hover .ggv5-magnify,
.ggv5-photo:focus-visible .ggv5-magnify {
  opacity: 1;
}

/* Flechas */

.ggv5-arrow {
  position: absolute;
  z-index: 5;
  top: 50%;

  transform: translateY(-50%);

  height: 39px;
  width: 39px;

  background: #091b29cc;
  color: white;

  border: 1px solid #ffffff75;
  border-radius: 50%;

  font: 500 29px/1 Manrope, sans-serif;

  cursor: pointer;
  backdrop-filter: blur(8px);
}

.ggv5-arrow.prev {
  left: 11px;
}

.ggv5-arrow.next {
  right: 11px;
}

/* Contador */

.ggv5-count {
  position: absolute;
  z-index: 4;

  right: 12px;
  bottom: 12px;

  padding: 7px 10px;
  border-radius: 999px;

  background: #091b29cc;
  color: white;

  font: 700 11px Manrope, sans-serif;
  pointer-events: none;
}

/* PDF adjuntos */

.ggv5-docs {
  display: grid;
  gap: 9px;
  margin: 16px 0;
}

.ggv5-docs > small {
  font-size: 9px;
  color: #91c9e8;
  font-weight: 800;
  letter-spacing: .12em;
}

.ggv5-pdf {
  display: flex;
  align-items: center;
  gap: 11px;

  padding: 12px;
  border: 1px solid #40647f;
  border-radius: 12px;

  color: #e6f5ff;
  text-decoration: none;
  background: #1c3951a1;
}

.ggv5-pdf span {
  font-size: 25px;
  color: #9cddff;
}

.ggv5-pdf strong {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.ggv5-pdf em {
  font-style: normal;
  font-size: 10px;
  white-space: nowrap;
  color: #99d8ff;
}

.ggv5-pdf:hover {
  background: #2b506b;
}

/* Lista de archivos en el editor de RH */

.ggv5-files {
  display: grid;
  gap: 8px;
  margin: 12px 0 18px;
}

.ggv5-file {
  display: flex;
  align-items: center;
  gap: 10px;

  background: #172d40;
  border: 1px solid #45637b;
  border-radius: 11px;
  padding: 9px;
}

.ggv5-file > span {
  font-size: 21px;
}

.ggv5-file strong {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.ggv5-file small {
  font-size: 10px;
  color: #a2c2d6;
}

.ggv5-file button {
  padding: 7px 9px !important;
  font-size: 10px !important;
}

/* Visor de fotografía grande */

.ggv5-lightbox {
  position: fixed;
  inset: 0;
  z-index: 30010;
  color: #f3faff;
}

.ggv5-light-shade {
  position: absolute;
  inset: 0;

  background: #02070bef;
  backdrop-filter: blur(15px);
}

.ggv5-light-body {
  position: absolute;
  inset: 12px;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  gap: 9px;
}

.ggv5-light-body img {
  max-height: 85dvh;
  max-width: 95vw;
  object-fit: contain;

  border-radius: 9px;
  box-shadow: 0 12px 70px #000b;
}

.ggv5-light-body small {
  font: 600 11px Manrope, sans-serif;
  color: #a9c8dc;
}

.ggv5-lightbox button {
  color: white;
  border: 1px solid #ffffff55;
  border-radius: 11px;

  background: #17334acd;
  padding: 9px 13px;
  cursor: pointer;
}

.ggv5-light-close {
  position: absolute;
  top: 8px;
  right: 9px;
  z-index: 3;
}

.ggv5-light-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);

  font-size: 32px !important;
  z-index: 2;
}

.ggv5-light-nav.prev {
  left: 8px;
}

.ggv5-light-nav.next {
  right: 8px;
}

@media(max-width: 620px) {
  .ggv5-back {
    top: 8px;
    left: 8px;
    padding: 9px 11px;
    font-size: 11px;
  }

  .ggv5-module #ggsModuleOrg > .ggs-bar,
  #ggsYoPopup.ggv5-org-open
  #ggsYoPanelContent > .ggs-bar {
    top: 8px;
    right: 8px;
    padding: 4px;
  }
}

@media(prefers-reduced-motion: reduce) {
  .ggv5-magnify {
    transition: none;
  }
}
`;

// No pisar una hoja de estilos modificada.

if (
  previousCSS !== null &&
  previousCSS.toString('utf8') !== css
) {
  throw Error(
    cssName +
    ' ya existe con contenido propio. ' +
    'No se sobrescribe.'
  );
}

// ==================================================
// CONECTAR EL NUEVO CSS Y ACTUALIZAR CACHÉ
// ==================================================

const next = new Map([
  [jsName, js],
  [cssName, css]
]);

for (const page of pages) {
  let html = originals
    .get(page)
    .toString('utf8');

  const re =
    /(src\s*=\s*["']js\/gg-social\.js)(?:\?[^"']*)?(["'])/g;

  onlyOne(
    html,
    re,
    'Script social en ' + page
  );

  html = html.replace(
    re,
    '$1?v=5real$2'
  );

  if (!html.includes('gg-social-v5.css')) {
    if (!/<\/head\s*>/i.test(html)) {
      throw Error(
        'Falta </head> en ' + page
      );
    }

    html = html.replace(
      /<\/head\s*>/i,

      '<link rel="stylesheet" ' +
      'href="css/gg-social-v5.css?v=5real">\n' +
      '</head>'
    );
  }

  // Botón de regreso en el módulo independiente.

  if (
    page === 'organigrama-empleados.html' &&
    !html.includes('ggv5-module-back')
  ) {
    if (!/<\/body\s*>/i.test(html)) {
      throw Error(
        'Falta </body> en organigrama-empleados.html'
      );
    }

    html = html.replace(
      /<\/body\s*>/i,

      '<a class="ggv5-back ggv5-module-back" ' +
      'href="sistema.html">' +
      '← Volver al sistema</a>\n' +
      '</body>'
    );
  }

  next.set(page, html);
}

// ==================================================
// VALIDAR ANTES DE ESCRIBIR
// ==================================================

new vm.Script(
  js,
  {filename: jsName}
);

for (const page of pages) {
  if (!next.get(page).includes('</html>')) {
    throw Error(
      'HTML incompleto: ' + page
    );
  }
}

// ==================================================
// APLICAR CON RECUPERACIÓN EN MEMORIA
// ==================================================

const applied = [];

try {
  for (const [name, content] of next) {
    const bytes = Buffer.from(
      content,
      'utf8'
    );

    const before = originals.get(name);

    if (
      before !== null &&
      before.equals(bytes)
    ) {
      continue;
    }

    fs.mkdirSync(
      path.dirname(full(name)),
      {recursive: true}
    );

    applied.push(name);

    fs.writeFileSync(
      full(name),
      bytes
    );
  }

} catch (e) {
  for (const name of applied.reverse()) {
    try {
      const b = originals.get(name);

      if (b === null) {
        fs.rmSync(
          full(name),
          {force: true}
        );
      } else {
        fs.writeFileSync(
          full(name),
          b
        );
      }

    } catch (restore) {
      console.error(
        'No pude restaurar ' +
        name + ': ' +
        restore.message
      );
    }
  }

  throw e;
}

// ==================================================
// FINALIZADO
// ==================================================

console.log(
  '✓ V5 REAL instalado. ' +
  'Foro con fotos, carrusel y PDF.'
);

console.log(
  '✓ Organigrama fullscreen en YO y módulo, ' +
  'sin selección de texto.'
);

console.log(
  '✓ Sesión YO, RH, Nómina e insignias ' +
  'sin modificar.'
);

console.log(
  '✓ Archivos escritos: ' +
  applied.length +
  '; sin .bak.'
);

console.log(
  '✓ SQL de multimedia V5 debe estar ' +
  'instalado previamente.'
);
