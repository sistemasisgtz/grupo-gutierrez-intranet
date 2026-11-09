
'use strict';

/*
 GG · ORGANIGRAMA PANTALLA COMPLETA
      Y FORO MULTIMEDIA V5

 Ejecutar desde desarrollo grupo:
 node instalar-org-foro-v5.cjs

 Requiere SQL V5 primero.
 Sin .bak, sin backups.
 No modifica credenciales, Nómina ni sesión YO.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = process.cwd();
const dest = p => path.join(ROOT, p);

const pages = [
  'yo.html',
  'recursos-humanos.html',
  'organigrama-empleados.html',
  'mi-perfil-notificaciones.html'
];

const names = [
  'js/gg-social.js',
  'css/gg-social.css',
  ...pages
];

const previous = new Map();
const edits = new Map();

for (const p of names) {
  if (!fs.existsSync(dest(p))) {
    throw Error(
      'Falta ' + p +
      '. Ejecuta desde desarrollo grupo.'
    );
  }

  previous.set(
    p,
    fs.readFileSync(dest(p))
  );
}

let js = previous
  .get('js/gg-social.js')
  .toString('utf8');

let css = previous
  .get('css/gg-social.css')
  .toString('utf8');

if (
  !js.includes('GG_SOCIAL_FOCUS_GESTURE_V4') ||
  !js.includes('GG_SOCIAL_YO_SESSION_FIX_V3') ||
  !js.includes('gg_social_snapshot')
) {
  throw Error(
    'Se requiere Organigrama V4 ' +
    'y sesión YO V3. Sin cambios.'
  );
}

const MARK =
  'GG_SOCIAL_FORUM_GALLERY_FULLSCREEN_V5';

const unique = (s, re, label) => {
  const all = [...s.matchAll(re)];

  if (all.length !== 1) {
    throw Error(
      'Referencia no única: ' +
      label + ' (' + all.length + ').'
    );
  }

  return all[0];
};

function replaceFunction(
  s,
  name,
  next,
  replacement
) {
  const a = unique(
    s,
    new RegExp(
      '(?:^|\\n)\\s*' +
      '(?:async\\s+)?function\\s+' +
      name + '\\s*\\(',
      'g'
    ),
    name
  );

  const tail = s.slice(
    a.index + a[0].length
  );

  const b = unique(
    tail,
    new RegExp(
      '\\n\\s*(?:async\\s+)?' +
      'function\\s+' + next +
      '\\s*\\(',
      'g'
    ),
    next + ' después de ' + name
  );

  const end =
    a.index + a[0].length + b.index;

  return (
    s.slice(0, a.index) +
    '\n' +
    replacement.trim() +
    '\n' +
    s.slice(end)
  );
}

// ===================================================
// 1. MODIFICAR SOLO EL MÓDULO SOCIAL
// ===================================================

if (!js.includes(MARK)) {

  // Mantener sesión YO y el snapshot original.
  // Los archivos se obtienen por RPC adicional.

  js = replaceFunction(
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

      const attachments = await rpc(
        'gg_social_post_media_list',
        {p_session_token:token()}
      );

      state.postMedia = attachments || {};

    } catch (e) {

      // No bloquear YO por un fallo del Foro.

      console.warn(
        '[GG Foro] Multimedia no disponible:',
        e.message
      );

      state.postMedia = {};
    }

    render();
  }
`
  );

  // =================================================
  // 2. NUEVA PRESENTACIÓN DEL FORO CON CARRUSEL
  // =================================================

  js = replaceFunction(
    js,
    'renderForum',
    'modal',
    String.raw`

  function renderForum(target, admin) {

    const dst = $(target);
    if (!dst) return;

    dst.innerHTML = heading(
      'COMUNIDAD · GRUPO GUTIÉRREZ',
      'Foro Gutiérrez',
      'Fotografías, comunicados y documentos de Recursos Humanos.'
    ) +

    (
      admin
        ? '<div class="ggs-bar">' +
          '<button class="ggs-primary" ' +
          'data-social="post-new" type="button">' +
          '＋ Nueva publicación</button></div>'
        : ''
    ) +

    '<div class="ggs-post-grid">' +

    state.posts.map(p => {

      const attachments =
        ggsPostAttachments(p);

      const photos = attachments.filter(
        a => a.kind === 'image'
      );

      const pdfs = attachments.filter(
        a => a.kind === 'pdf'
      );

      let index = Math.max(
        0,
        Math.min(
          photos.length - 1,
          Number(
            state.galleryIndex?.[p.id] || 0
          )
        )
      );

      const cover = photos[index];

      return (
        '<article class="ggs-post" ' +
        'data-forum-post="' + esc(p.id) + '">' +

        '<div class="ggs-post-image ggs-gallery" ' +
        'data-gallery-post="' + esc(p.id) + '">' +

        (
          cover
            ? '<button type="button" ' +
              'class="ggs-gallery-expand" ' +
              'data-ggs-v5="photo-open" ' +
              'data-post="' + esc(p.id) + '" ' +
              'aria-label="Ver foto ampliada">' +

              '<img class="ggs-post-photo ' +
              'ggs-gallery-current" src="' +
              esc(media(cover.path)) +
              '" alt="' + esc(p.title) +
              '" loading="lazy">' +

              '<span class="ggs-gallery-magnify">' +
              '⤢ Ver foto</span></button>'

            : '<div class="ggs-post-art">' +
              'GG ✳</div>'
        ) +

        (
          photos.length > 1
            ? '<button type="button" ' +
              'class="ggs-gallery-arrow previous" ' +
              'data-ggs-v5="photo-prev" ' +
              'data-post="' + esc(p.id) + '" ' +
              'aria-label="Foto anterior">‹</button>' +

              '<button type="button" ' +
              'class="ggs-gallery-arrow next" ' +
              'data-ggs-v5="photo-next" ' +
              'data-post="' + esc(p.id) + '" ' +
              'aria-label="Foto siguiente">›</button>' +

              '<span class="ggs-gallery-count">' +
              (index + 1) + ' / ' +
              photos.length + '</span>'
            : ''
        ) +

        '</div>' +

        '<div class="ggs-post-copy">' +

        '<small>' +
        new Date(p.created_at)
          .toLocaleDateString('es-MX') +
        ' · RECURSOS HUMANOS</small>' +

        '<h3>' + esc(p.title) + '</h3>' +

        '<p>' + esc(p.body) + '</p>' +

        (
          pdfs.length

            ? '<div class="ggs-post-docs">' +
              '<small>DOCUMENTOS ADJUNTOS</small>' +

              pdfs.map(a =>
                '<a class="ggs-post-pdf" href="' +
                esc(media(a.path)) +
                '" target="_blank" ' +
                'rel="noopener noreferrer">' +

                '<span>▤</span>' +

                '<strong>' +
                esc(a.name || 'Documento.pdf') +
                '</strong>' +

                '<em>Ver PDF ↗</em>' +

                '</a>'
              ).join('') +

              '</div>'

            : ''
        ) +

        '<div class="ggs-post-actions">' +

        '<button data-social="like" ' +
        'data-id="' + p.id + '" type="button">' +
        (p.liked ? '♥' : '♡') +
        ' Me gusta</button>' +

        '<button data-social="likes" ' +
        'data-id="' + p.id + '" type="button">' +
        p.likes +
        ' likes · ver personas</button>' +

        '</div>' +

        (
          admin
            ? '<div class="ggs-post-admin">' +

              '<button data-social="post-edit" ' +
              'data-id="' + p.id + '" type="button">' +
              'Editar</button>' +

              '<button data-social="post-delete" ' +
              'data-id="' + p.id + '" type="button">' +
              'Eliminar</button>' +

              '</div>'

            : ''
        ) +

        '</div></article>'
      );

    }).join('') +

    '</div>' +

    (
      state.posts.length
        ? ''
        : '<p class="ggs-empty">' +
          'Todavía no hay publicaciones.</p>'
    );
  }
`
  );

  // =================================================
  // 3. EDITOR DE PUBLICACIONES
  // =================================================

  js = replaceFunction(
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
        ? ggsPostAttachments(p).map(
            a => ({...a})
          )
        : [],

      original: p
        ? ggsPostAttachments(p).map(
            a => a.path
          )
        : [],

      pending: []
    };

    modal(
      id ? 'Editar publicación' : 'Nueva publicación',

      '<form id="ggsPostForm">' +

      '<label class="ggs-field">Título' +

      '<input id="ggsPostTitle" ' +
      'maxlength="200" required value="' +
      esc(state.edit.title) + '">' +

      '</label>' +

      '<label class="ggs-field">' +
      'Texto de la publicación' +

      '<textarea id="ggsPostBody" rows="8">' +
      esc(state.edit.body) +
      '</textarea>' +

      '</label>' +

      '<label class="ggs-field">' +
      'Fotografías y PDF (máximo 12 archivos)' +

      '<input id="ggsPostFile" type="file" ' +
      'multiple ' +
      'accept="image/png,image/jpeg,image/webp,' +
      'application/pdf,.pdf">' +

      '</label>' +

      '<p class="ggs-muted">' +
      'Fotos PNG/JPG/WEBP hasta 10 MB cada una; ' +
      'PDF hasta 20 MB. Puedes combinar ambos. ' +
      'Los archivos del Foro tienen enlace público: ' +
      'no subas documentos confidenciales.' +
      '</p>' +

      '<div id="ggsPostFilesV5" ' +
      'class="ggs-editor-media"></div>' +

      '<button class="ggs-primary" type="submit">' +
      (id ? 'Guardar cambios' : 'Publicar') +
      '</button>' +

      '</form>'
    );

    $('ggsPostFile').onchange = e => {

      const draft = state.edit;

      if (
        !draft ||
        draft.kind !== 'post'
      ) return;

      for (const f of [...(e.target.files || [])]) {

        const kind =
          f.type === 'application/pdf'
            ? 'pdf'
            : 'image';

        const valid =
          kind === 'pdf'
            ? f.size <= 20 * 1024 * 1024
            : (
                [
                  'image/png',
                  'image/jpeg',
                  'image/webp'
                ].includes(f.type) &&
                f.size <= 10 * 1024 * 1024
              );

        if (!valid) {

          say(
            'Archivo no admitido o demasiado grande: ' +
            f.name,
            true
          );

          continue;
        }

        if (
          draft.existing.length +
          draft.pending.length >= 12
        ) {

          say(
            'Máximo 12 archivos por publicación.',
            true
          );

          break;
        }

        draft.pending.push({
          key: crypto.randomUUID(),
          file: f,
          kind
        });
      }

      e.target.value = '';

      ggsPaintEditorMedia();
    };

    ggsPaintEditorMedia();
  }
`
  );

  // =================================================
  // 4. GUARDADO DE POSTS Y ARCHIVOS
  // =================================================

  js = replaceFunction(
    js,
    'savePost',
    'details',
    String.raw`

  async function savePost() {

    const d = state.edit;

    if (
      !d ||
      d.kind !== 'post' ||
      state.busy
    ) return;

    d.title =
      $('ggsPostTitle')?.value.trim() || '';

    d.body =
      $('ggsPostBody')?.value || '';

    if (!d.title) {
      say('Escribe un título.', true);
      return;
    }

    const btn = $('ggsPostForm')
      ?.querySelector('button[type=submit]');

    if (btn) btn.disabled = true;

    state.busy = true;

    let postSaved = false;

    try {

      const attachments = d.existing.map(
        a => ({...a})
      );

      // Subir archivos nuevos al bucket.

      for (const item of d.pending) {

        const f = item.file;

        const ext =
          item.kind === 'pdf'
            ? 'pdf'
            : f.type === 'image/png'
              ? 'png'
              : f.type === 'image/webp'
                ? 'webp'
                : 'jpg';

        const objectPath =
          'posts/' +
          crypto.randomUUID() +
          '.' + ext;

        const {error: upError} =
          await db.storage
            .from('gg-social-media')
            .upload(
              objectPath,
              f,
              {
                contentType: f.type,
                upsert: false
              }
            );

        if (upError) throw upError;

        attachments.push({

          path: objectPath,
          kind: item.kind,

          name:
            f.name.slice(0, 180) ||
            'Archivo'
        });
      }

      const cover = attachments.find(
        a => a.kind === 'image'
      )?.path || null;

      // Conserva el guardado original del post.

      const saved = await rpc(
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

      postSaved = true;

      const postId = saved?.id || d.id;

      if (!postId) {
        throw Error(
          'El servidor no devolvió ID de publicación'
        );
      }

      // Asociar todos los archivos a la
      // publicación ya guardada.

      await rpc(
        'gg_social_post_media_save',
        {
          p_post_id: postId,

          p_files: attachments.map(
            a => ({
              path: a.path,
              kind: a.kind,

              name:
                a.name ||
                'Foto de publicación'
            })
          )
        }
      );

      // Limpiar fotos o documentos retirados.

      const kept = new Set(
        attachments.map(a => a.path)
      );

      const removed = d.original.filter(
        p => !kept.has(p)
      );

      if (removed.length) {

        db.storage
          .from('gg-social-media')
          .remove(removed)
          .then(({error: e}) => {

            if (e) {
              console.warn(
                '[GG Foro] Sin limpiar:',
                e.message
              );
            }
          });
      }

      closeModal();

      await load();

      say(
        'Publicación y adjuntos guardados.'
      );

    } catch (e) {

      error(e);

      if (postSaved) {

        say(
          'La publicación se guardó, pero ' +
          'falló asociar los adjuntos. ' +
          'Edita la misma publicación ' +
          'y reintenta; NO la dupliques.',
          true
        );
      }

    } finally {

      state.busy = false;

      if (btn && btn.isConnected) {
        btn.disabled = false;
      }
    }
  }
`
  );

  // =================================================
  // 5. ORGANIGRAMA DE YO A PANTALLA COMPLETA
  // =================================================

  js = replaceFunction(
    js,
    'renderYoPanel',
    'renderNotifications',
    String.raw`

  function renderYoPanel() {

    const popup = $('ggsYoPopup');

    if (!popup) return;

    if (!state.modal) {

      popup.innerHTML = '';

      popup.classList.remove(
        'ggs-org-open'
      );

      return;
    }

    const isOrg =
      state.modal === 'org';

    popup.classList.toggle(
      'ggs-org-open',
      isOrg
    );

    popup.innerHTML = isOrg

      ? '<div class="ggs-modal-shade" ' +
        'data-social="close-yo"></div>' +

        '<section class="ggs-yo-window ' +
        'ggs-yo-org-full">' +

        '<button class="ggs-full-exit" ' +
        'type="button" data-social="close-yo">' +
        '← Volver a YO</button>' +

        '<div id="ggsYoPanelContent"></div>' +

        '</section>'

      : '<div class="ggs-modal-shade" ' +
        'data-social="close-yo"></div>' +

        '<section class="ggs-yo-window">' +

        '<header><strong>Foro Gutiérrez</strong>' +

        '<button data-social="close-yo">' +
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

  // =================================================
  // 6. FUNCIONES DEL CARRUSEL Y MODALES
  // =================================================

  const helper = String.raw`

  /* GG_SOCIAL_FORUM_GALLERY_FULLSCREEN_V5 */

  state.galleryIndex =
    state.galleryIndex || {};

  state.postMedia =
    state.postMedia || {};

  // Fotos anteriores + fotos y PDF nuevos.

  function ggsPostAttachments(post) {

    const items = state.postMedia?.[post.id];

    if (Array.isArray(items)) {
      return items;
    }

    return post.image_path

      ? [{
          path: post.image_path,
          kind: 'image',
          name: 'Foto de publicación'
        }]

      : [];
  }

  // Lista editable de archivos de RH.

  function ggsPaintEditorMedia() {

    const box = $('ggsPostFilesV5');
    const d = state.edit;

    if (
      !box ||
      !d ||
      d.kind !== 'post'
    ) return;

    const old = d.existing.map(
      (a, i) =>

        '<div class="ggs-editor-file">' +

        '<span>' +
        (a.kind === 'pdf' ? '▤' : '▧') +
        '</span>' +

        '<strong>' +
        esc(a.name || 'Foto de publicación') +
        '</strong>' +

        '<small>Guardado</small>' +

        '<button type="button" ' +
        'data-ggs-v5="media-remove-old" ' +
        'data-index="' + i + '">' +
        '× Quitar</button>' +

        '</div>'
    );

    const fresh = d.pending.map(
      (a, i) =>

        '<div class="ggs-editor-file">' +

        '<span>' +
        (a.kind === 'pdf' ? '▤' : '▧') +
        '</span>' +

        '<strong>' +
        esc(a.file.name) +
        '</strong>' +

        '<small>Por subir</small>' +

        '<button type="button" ' +
        'data-ggs-v5="media-remove-new" ' +
        'data-index="' + i + '">' +
        '× Quitar</button>' +

        '</div>'
    );

    box.innerHTML =
      old.concat(fresh).join('') ||

      '<p class="ggs-muted">' +
      'No hay archivos seleccionados.</p>';
  }

  // Cambiar foto sin recargar todo el foro.

  function ggsChangePhoto(id, delta) {

    const post = state.posts.find(
      p => p.id === id
    );

    if (!post) return;

    const photos =
      ggsPostAttachments(post).filter(
        a => a.kind === 'image'
      );

    if (!photos.length) return;

    const next = (
      (
        Number(
          state.galleryIndex[id] || 0
        ) + delta
      ) % photos.length +
      photos.length
    ) % photos.length;

    state.galleryIndex[id] = next;

    document.querySelectorAll(
      '[data-gallery-post="' + id + '"]'
    ).forEach(box => {

      const img = box.querySelector(
        '.ggs-gallery-current'
      );

      if (img) {

        img.src =
          media(photos[next].path);

        img.alt =
          post.title +
          ' — Foto ' + (next + 1);
      }

      const counter = box.querySelector(
        '.ggs-gallery-count'
      );

      if (counter) {

        counter.textContent =
          (next + 1) +
          ' / ' + photos.length;
      }
    });

    if (
      $('ggsPhotoLightbox')?.dataset.post === id
    ) {

      ggsShowLightbox(
        id,
        next
      );
    }
  }

  // Visor grande de imagen completa.

  function ggsShowLightbox(id, index) {

    const post = state.posts.find(
      p => p.id === id
    );

    if (!post) return;

    const photos =
      ggsPostAttachments(post).filter(
        a => a.kind === 'image'
      );

    if (!photos.length) return;

    index = (
      (index % photos.length) +
      photos.length
    ) % photos.length;

    let overlay = $('ggsPhotoLightbox');

    if (!overlay) {

      overlay =
        document.createElement('div');

      overlay.id =
        'ggsPhotoLightbox';

      document.body.append(overlay);
    }

    overlay.className =
      'ggs-photo-lightbox';

    overlay.dataset.post = id;

    overlay.dataset.index =
      String(index);

    overlay.innerHTML =
      '<div class="ggs-lightbox-shade" ' +
      'data-ggs-v5="lightbox-close"></div>' +

      '<div class="ggs-lightbox-content" ' +
      'role="dialog" aria-modal="true" ' +
      'aria-label="Foto ampliada">' +

      '<button class="ggs-lightbox-close" ' +
      'type="button" data-ggs-v5="lightbox-close">' +
      '× Cerrar</button>' +

      '<img src="' +
      esc(media(photos[index].path)) +
      '" alt="' + esc(post.title) +
      ' — Foto ' + (index + 1) + '">' +

      (
        photos.length > 1

          ? '<button class="ggs-lightbox-nav prev" ' +
            'type="button" data-ggs-v5="lightbox-prev" ' +
            'aria-label="Anterior">‹</button>' +

            '<button class="ggs-lightbox-nav next" ' +
            'type="button" data-ggs-v5="lightbox-next" ' +
            'aria-label="Siguiente">›</button>'

          : ''
      ) +

      '<small>' +
      esc(post.title) +
      ' · ' +
      (index + 1) +
      ' de ' +
      photos.length +
      '</small></div>';
  }

  function ggsCloseLightbox() {

    $('ggsPhotoLightbox')?.remove();
  }

  // Eventos nuevos, independientes de
  // las acciones originales de RH y YO.

  document.addEventListener(
    'click',
    e => {

      const button = e.target.closest(
        '[data-ggs-v5]'
      );

      if (!button) return;

      e.preventDefault();

      e.stopImmediatePropagation();

      const action =
        button.dataset.ggsV5;

      const id =
        button.dataset.post;

      const box =
        $('ggsPhotoLightbox');

      const gallery =
        button.closest('.ggs-gallery');

      if (
        gallery?.dataset.swipeConsumed === '1'
      ) {

        delete gallery.dataset.swipeConsumed;

        return;
      }

      if (action === 'photo-prev') {

        ggsChangePhoto(id, -1);

      } else if (action === 'photo-next') {

        ggsChangePhoto(id, 1);

      } else if (action === 'photo-open') {

        const source = state.posts.find(
          p => p.id === id
        );

        if (source) {

          ggsShowLightbox(
            id,
            Number(
              state.galleryIndex[id] || 0
            )
          );
        }

      } else if (action === 'lightbox-close') {

        ggsCloseLightbox();

      } else if (
        action === 'lightbox-prev' &&
        box
      ) {

        ggsShowLightbox(
          box.dataset.post,
          Number(box.dataset.index) - 1
        );

      } else if (
        action === 'lightbox-next' &&
        box
      ) {

        ggsShowLightbox(
          box.dataset.post,
          Number(box.dataset.index) + 1
        );

      } else if (
        (
          action === 'media-remove-old' ||
          action === 'media-remove-new'
        ) &&
        state.edit?.kind === 'post'
      ) {

        const n = Number(
          button.dataset.index
        );

        if (action === 'media-remove-old') {

          state.edit.existing.splice(
            n,
            1
          );

        } else {

          state.edit.pending.splice(
            n,
            1
          );
        }

        ggsPaintEditorMedia();
      }
    },
    true
  );

  // Teclado dentro del visor.

  document.addEventListener(
    'keydown',
    e => {

      const box =
        $('ggsPhotoLightbox');

      if (!box) return;

      if (e.key === 'Escape') {

        e.stopImmediatePropagation();

        ggsCloseLightbox();
      }

      if (e.key === 'ArrowLeft') {

        e.preventDefault();

        ggsShowLightbox(
          box.dataset.post,
          Number(box.dataset.index) - 1
        );
      }

      if (e.key === 'ArrowRight') {

        e.preventDefault();

        ggsShowLightbox(
          box.dataset.post,
          Number(box.dataset.index) + 1
        );
      }
    },
    true
  );

  // Deslizar las fotografías en celular.

  document.addEventListener(
    'pointerdown',
    e => {

      const box = e.target.closest(
        '.ggs-gallery'
      );

      if (
        box &&
        e.pointerType === 'touch'
      ) {

        box.dataset.swipeX =
          String(e.clientX);
      }
    },
    true
  );

  document.addEventListener(
    'pointerup',
    e => {

      const box = e.target.closest(
        '.ggs-gallery'
      );

      if (
        !box ||
        e.pointerType !== 'touch' ||
        !box.dataset.swipeX
      ) return;

      const dx =
        e.clientX -
        Number(box.dataset.swipeX);

      delete box.dataset.swipeX;

      if (Math.abs(dx) > 45) {

        e.preventDefault();

        box.dataset.swipeConsumed = '1';

        ggsChangePhoto(
          box.dataset.galleryPost,
          dx < 0 ? 1 : -1
        );
      }
    },
    true
  );

  // Impedir seleccionar texto al arrastrar
  // por el organigrama.

  document.addEventListener(
    'selectstart',
    e => {

      if (
        e.target.closest(
          '.ggs-org-viewport'
        )
      ) {

        e.preventDefault();
      }
    },
    true
  );

`;

  const insertion = unique(
    js,
    /\n\s*\/\/ EVENTOS\s*\n/gi,
    'bloque de eventos'
  );

  js =
    js.slice(0, insertion.index) +
    '\n' +
    helper +
    '\n' +
    js.slice(insertion.index);

  // =================================================
  // 7. PANTALLA COMPLETA EN MÓDULO INDEPENDIENTE
  // =================================================

  const moduleAnchor =
    "else if(mode==='module')" +
    "renderOrg('ggsModuleOrg',false);";

  if (
    js.split(moduleAnchor).length !== 2
  ) {
    throw Error(
      'No encontré el render del módulo independiente.'
    );
  }

  js = js.replace(
    moduleAnchor,

    "else if(mode==='module'){" +
    "renderOrg('ggsModuleOrg',false);" +

    "const host=$('ggsModuleOrg');" +

    "if(host&&!host.querySelector('.ggs-full-exit')){" +

    "const link=document.createElement('a');" +

    "link.className='ggs-full-exit';" +

    "link.href='sistema.html';" +

    "link.textContent='← Volver al sistema';" +

    "host.append(link);" +

    "}};"
  );

  js = js.replace(
    "host.append(link);}};\n else if(mode==='yo')",

    "host.append(link);}}\n else if(mode==='yo')"
  );

  const modeLine =
    "const token=()=>mode==='yo'?";

  if (!js.includes(modeLine)) {
    throw Error(
      'No encontré token() de sesión.'
    );
  }

  js = js.replace(
    modeLine,

    "if(mode==='module')" +
    "document.body.classList.add(" +
    "'ggs-fullscreen-module');\n " +

    modeLine
  );

  // =================================================
  // 8. ELIMINAR LOS ADJUNTOS CON SU PUBLICACIÓN
  // =================================================

  const oldDel =
    "else if(action==='post-delete'){" +
    "if(confirm('¿Eliminar esta publicación y todos sus likes?')){" +
    "const path=state.posts.find(p=>p.id===id)?.image_path;" +
    "const ok=await change('post_delete',{id});" +
    "if(ok&&path)db.storage.from('gg-social-media')" +
    ".remove([path]).catch(()=>{});}}";

  if (
    js.split(oldDel).length !== 2
  ) {
    throw Error(
      'La acción post-delete cambió. ' +
      'No se modificó nada.'
    );
  }

  js = js.replace(
    oldDel,

    "else if(action==='post-delete'){" +
    "if(confirm('¿Eliminar esta publicación y todos sus likes?')){" +

    "const post=state.posts.find(p=>p.id===id);" +

    "const paths=[...new Set(" +
    "ggsPostAttachments(post||{id})" +
    ".map(a=>a.path)" +
    ".concat(post?.image_path||[]))];" +

    "const ok=await change('post_delete',{id});" +

    "if(ok&&paths.length)" +

    "db.storage.from('gg-social-media')" +
    ".remove(paths).then(({error:e})=>{" +

    "if(e)console.warn(" +
    "'[GG Foro] Archivos sin limpiar:',e.message);" +

    "});}}"
  );
}

// ===================================================
// 9. ESTILOS FULLSCREEN Y CARRUSEL
// ===================================================

const CSS_EXTRA = String.raw`

/* GG_SOCIAL_FORUM_GALLERY_FULLSCREEN_V5 */

/* NO SELECCIONAR TEXTO AL MOVER EL ORGANIGRAMA */

.ggs-org-viewport,
.ggs-org-viewport * {
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-touch-callout: none;
}

.ggs-org-viewport img {
  pointer-events: none;
  -webkit-user-drag: none;
}

/* PANTALLA COMPLETA · MÓDULO INDEPENDIENTE */

body.ggs-fullscreen-module {
  overflow: hidden;
}

.ggs-fullscreen-module .ggs-site-top {
  display: none !important;
}

.ggs-fullscreen-module .ggs-site-main {
  max-width: none !important;
  width: 100vw;
  padding: 0 !important;
  margin: 0 !important;
}

.ggs-fullscreen-module #ggsModuleOrg,
#ggsYoPopup.ggs-org-open #ggsYoPanelContent {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
}

.ggs-fullscreen-module #ggsModuleOrg > .ggs-heading,
.ggs-fullscreen-module #ggsModuleOrg > .ggs-help,
#ggsYoPopup.ggs-org-open .ggs-heading,
#ggsYoPopup.ggs-org-open .ggs-help {
  display: none !important;
}

/* CONTROLES FLOTANTES */

.ggs-fullscreen-module #ggsModuleOrg > .ggs-bar,
#ggsYoPopup.ggs-org-open
#ggsYoPanelContent > .ggs-bar {

  position: absolute;
  top: 12px;
  right: 15px;
  z-index: 50;

  margin: 0 !important;
  padding: 7px;

  border: 1px solid #45627d;
  border-radius: 15px;

  background: rgba(12,26,41,.86);
  backdrop-filter: blur(16px);
}

.ggs-fullscreen-module
#ggsModuleOrg > .ggs-bar > *:not(.ggs-controls),

#ggsYoPopup.ggs-org-open
#ggsYoPanelContent > .ggs-bar > *:not(.ggs-controls) {

  display: none !important;
}

/* LIENZO DE PANTALLA COMPLETA */

.ggs-fullscreen-module
#ggsModuleOrg .ggs-org-viewport,

#ggsYoPopup.ggs-org-open .ggs-org-viewport {

  width: 100vw;
  height: 100dvh;
  min-height: 0;

  border: 0;
  border-radius: 0;
}

/* BOTÓN REGRESAR */

.ggs-full-exit {
  position: absolute;

  top: 18px;
  left: 18px;

  z-index: 65;

  display: inline-flex;
  align-items: center;
  gap: 7px;

  text-decoration: none;

  border: 1px solid #527592;
  border-radius: 14px;

  padding: 11px 16px;

  background: rgba(13,31,47,.88);
  color: #e3f5ff;

  backdrop-filter: blur(16px);

  font: 800 12px Manrope,system-ui,sans-serif;

  cursor: pointer;

  box-shadow: 0 8px 30px #0005;
}

.ggs-full-exit:hover {
  background: #254c69;
}

/* ORGANIGRAMA DE YO */

#ggsYoPopup.ggs-org-open .ggs-yo-window {

  position: fixed;
  inset: 0 !important;

  width: 100vw;
  height: 100dvh;
  max-height: none;

  padding: 0 !important;
  margin: 0 !important;

  border: 0;
  border-radius: 0;

  overflow: hidden;

  background: #091523;

  animation: none !important;

  z-index: 8000;
}

#ggsYoPopup.ggs-org-open
.ggs-yo-window > header {

  display: none !important;
}

/* CELULAR */

@media(max-width:620px) {

  .ggs-full-exit {
    top: 9px;
    left: 9px;

    padding: 10px 12px;
    font-size: 11px;
  }

  .ggs-fullscreen-module
  #ggsModuleOrg > .ggs-bar,

  #ggsYoPopup.ggs-org-open
  #ggsYoPanelContent > .ggs-bar {

    top: 9px;
    right: 9px;
    padding: 4px;
  }
}

/* ===============================================
   FORO GUTIÉRREZ · CARRUSEL
=============================================== */

.ggs-gallery {
  position: relative;
  isolation: isolate;
}

.ggs-gallery-expand {
  width: 100%;
  height: 100%;

  padding: 0;
  border: 0;

  background: transparent;

  cursor: zoom-in;

  position: absolute;
  inset: 0;
}

.ggs-gallery-expand img {
  width: 100%;
  height: 100%;

  object-fit: cover;
  display: block;
}

.ggs-gallery-magnify {
  position: absolute;

  bottom: 14px;
  left: 14px;

  z-index: 2;

  background: #0a1928c9;
  color: #e5f5ff;

  border: 1px solid #ffffff3b;
  border-radius: 999px;

  padding: 8px 12px;

  font-size: 11px;

  opacity: 0;

  transition: opacity .2s;
}

.ggs-gallery-expand:hover .ggs-gallery-magnify,
.ggs-gallery-expand:focus-visible .ggs-gallery-magnify {
  opacity: 1;
}

/* FLECHAS DE CARRUSEL */

.ggs-gallery-arrow {
  position: absolute;

  top: 50%;
  z-index: 5;

  transform: translateY(-50%);

  width: 39px;
  height: 39px;

  border-radius: 50%;
  border: 1px solid #ffffff66;

  background: #081625aa;
  color: white;

  font-size: 29px;
  line-height: 1;

  cursor: pointer;

  backdrop-filter: blur(8px);
}

.ggs-gallery-arrow.previous {
  left: 11px;
}

.ggs-gallery-arrow.next {
  right: 11px;
}

/* CONTADOR DE FOTOS */

.ggs-gallery-count {
  position: absolute;

  z-index: 5;

  bottom: 13px;
  right: 12px;

  padding: 7px 10px;

  background: #0b1c2bcc;
  color: white;

  border-radius: 999px;

  font: 700 11px Manrope,sans-serif;

  pointer-events: none;
}

/* DOCUMENTOS PDF */

.ggs-post-docs {
  display: grid;
  gap: 8px;

  margin: 12px 0 16px;
}

.ggs-post-docs > small {
  color: #8cbddd;

  font-size: 9px;
  letter-spacing: .1em;
  font-weight: 800;
}

.ggs-post-pdf {
  display: flex;

  align-items: center;
  gap: 10px;

  min-width: 0;

  text-decoration: none;
  color: #e2f2ff;

  background: #203c527a;

  border: 1px solid #476d88;
  border-radius: 12px;

  padding: 12px;
}

.ggs-post-pdf > span {
  font-size: 24px;
  color: #a0d8fc;
}

.ggs-post-pdf strong {
  flex: 1;
  min-width: 0;

  overflow-wrap: anywhere;

  font-size: 11px;
}

.ggs-post-pdf em {
  font-style: normal;
  color: #9dd9ff;

  font-size: 10px;
  white-space: nowrap;
}

.ggs-post-pdf:hover {
  background: #2b5674;
}

/* ARCHIVOS EN EL EDITOR DE RH */

.ggs-editor-media {
  display: grid;
  gap: 8px;

  margin: 12px 0 18px;
}

.ggs-editor-file {
  display: flex;

  align-items: center;
  gap: 11px;

  padding: 10px;

  border: 1px solid #3c5a74;
  border-radius: 12px;

  background: #172b3f;
}

.ggs-editor-file > span {
  font-size: 21px;
}

.ggs-editor-file strong {
  flex: 1;

  overflow-wrap: anywhere;

  font-size: 11px;
}

.ggs-editor-file small {
  font-size: 10px;
  color: #9fbcd0;
}

.ggs-editor-file button {
  padding: 7px 10px !important;
  font-size: 10px !important;
}

/* ===============================================
   VISOR GRANDE DE FOTOGRAFÍAS
=============================================== */

#ggsPhotoLightbox {
  position: fixed;
  inset: 0;

  z-index: 30010;

  color: white;
}

.ggs-lightbox-shade {
  position: absolute;
  inset: 0;

  background: #03070bf2;

  backdrop-filter: blur(15px);
}

.ggs-lightbox-content {
  position: absolute;
  inset: 12px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 12px;
}

.ggs-lightbox-content > img {
  max-width: 94vw;
  max-height: 84dvh;

  object-fit: contain;

  border-radius: 10px;

  box-shadow: 0 15px 65px #000a;
}

.ggs-lightbox-content > small {
  font: 600 11px Manrope,system-ui,sans-serif;

  color: #c9dced;
}

.ggs-lightbox-content button {
  cursor: pointer;

  color: #fff;

  border: 1px solid #ffffff55;

  background: #1b334aaa;

  border-radius: 12px;

  padding: 9px 12px;
}

.ggs-lightbox-close {
  position: absolute;

  right: 10px;
  top: 8px;

  z-index: 2;
}

.ggs-lightbox-nav {
  position: absolute;

  top: 50%;

  transform: translateY(-50%);

  font-size: 34px !important;

  z-index: 2;
}

.ggs-lightbox-nav.prev {
  left: 10px;
}

.ggs-lightbox-nav.next {
  right: 10px;
}

@media(prefers-reduced-motion:reduce) {
  .ggs-gallery-magnify {
    transition: none;
  }
}
`;

// ===================================================
// 10. PREPARAR ESTILOS Y REFERENCIAS
// ===================================================

if (!css.includes(MARK)) {
  css += CSS_EXTRA;
}

edits.set(
  'js/gg-social.js',
  js
);

edits.set(
  'css/gg-social.css',
  css
);

// Actualizar versiones en las cuatro pantallas.

for (const p of pages) {

  let html = previous
    .get(p)
    .toString('utf8');

  for (
    const [type, asset] of [
      ['src', 'js/gg-social.js'],
      ['href', 'css/gg-social.css']
    ]
  ) {

    const re = new RegExp(
      '(' +
      type +
      '\\s*=\\s*["\\\']' +
      asset.replace(/\./g, '\\.') +
      ')(?:\\?[^"\\\']*)?(["\\\'])',
      'g'
    );

    unique(
      html,
      re,
      p + ': ' + asset
    );

    html = html.replace(
      re,
      '$1?v=5$2'
    );
  }

  if (!html.includes('</html>')) {
    throw Error(
      'HTML incompleto: ' + p
    );
  }

  edits.set(
    p,
    html
  );
}

// ===================================================
// 11. VALIDAR ANTES DE ESCRIBIR
// ===================================================

new vm.Script(
  js,
  {
    filename: 'js/gg-social.js'
  }
);

// ===================================================
// 12. GUARDADO CON RECUPERACIÓN EN MEMORIA
// ===================================================

const modified = [];

try {

  for (const [p, next] of edits) {

    const after =
      Buffer.from(next);

    const prior =
      previous.get(p);

    if (prior.equals(after)) {
      continue;
    }

    modified.push(p);

    fs.writeFileSync(
      dest(p),
      after
    );
  }

} catch (e) {

  for (const p of modified.reverse()) {

    try {

      fs.writeFileSync(
        dest(p),
        previous.get(p)
      );

    } catch (x) {

      console.error(
        'No se pudo restaurar ' +
        p + ': ' + x.message
      );
    }
  }

  throw e;
}

// ===================================================
// TERMINADO
// ===================================================

console.log(
  '✓ Organigrama en pantalla completa ' +
  'para YO y el módulo independiente.'
);

console.log(
  '✓ Sin seleccionar texto ' +
  'durante el desplazamiento.'
);

console.log(
  '✓ Foro: múltiples imágenes, PDF, ' +
  'carrusel y visor ampliado.'
);

console.log(
  '✓ RH, credenciales YO, Nómina ' +
  'y likes conservados.'
);

console.log(
  '✓ Archivos modificados: ' +
  modified.length +
  '. Sin .bak.'
);
