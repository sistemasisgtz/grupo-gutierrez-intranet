(function browserApp() {

  'use strict';

  const db = window.ggSupabase;

  const $ = id =>
    document.getElementById(id);

  const set = (id, v) => {
    if ($(id)) {
      $(id).textContent = String(v ?? '');
    }
  };

  const esc = v =>
    String(v ?? '').replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c])
    );

  const fmt = v => {
    if (!v) return '—';

    const d = new Date(v);

    return Number.isNaN(+d)
      ? '—'
      : new Intl.DateTimeFormat(
          'es-MX',
          {
            dateStyle: 'medium',
            timeStyle: 'short'
          }
        ).format(d);
  };

  const initials = v => {
    const w = String(v || 'GG')
      .trim()
      .split(/\s+/);

    return (
      (w[0]?.[0] || 'G') +
      (
        w.length > 1
          ? w.at(-1)?.[0] || 'G'
          : w[0]?.[1] || 'G'
      )
    ).toUpperCase();
  };

  let filter = 'all';
  let page = 0;
  let busy = false;
  let requestVersion = 0;
  let debounce;

  // MENSAJES

  function note(v, error = false) {
    set('gmpMessage', v);

    $('gmpMessage').classList.toggle(
      'error',
      error
    );
  }

  // CAMBIO DE TEMA

  function theme(value) {

    const t =
      value === 'light' ? 'light' : 'dark';

    document.documentElement.dataset.gmpTheme = t;

    set(
      'gmpTheme',
      t === 'dark'
        ? '☀ Modo claro'
        : '☾ Modo oscuro'
    );

    try {
      localStorage.setItem(
        'gg-profile-theme',
        t
      );
    } catch (_) {
      // La preferencia es opcional.
    }
  }

  // ENLACES INTERNOS PERMITIDOS

  function safeRoute(value) {

    const s = String(value || '').trim();

    return /^[a-z0-9_-]+\.html(?:\?[a-zA-Z0-9_=&%+.-]{0,180})?(?:#[a-zA-Z0-9_-]{1,60})?$/i.test(s)
      ? s
      : null;
  }

  // RENDERIZADO DE NOTIFICACIONES

  function display(items, append = false) {

    const target = $('gmpList');

    if (!append) {
      target.replaceChildren();
    }

    if (!items.length && !append) {

      target.innerHTML = `
        <div class="gmp-empty">
          ✉

          <strong>
            Sin notificaciones
          </strong>

          Cuando otros módulos te envíen avisos,
          llegarán aquí.
        </div>
      `;

      return;
    }

    for (const item of items) {

      const route = safeRoute(item.action_url);

      const state =
        item.kind === 'approval'
          ? ' · ' +
            (
              item.decision_status === 'pending'
                ? 'Autorización pendiente'
                : item.decision_status || ''
            )
          : '';

      const node = document.createElement('article');

      node.className =
        'gmp-item' +
        (!item.read_at ? ' unread' : '');

      node.innerHTML = `
        <div class="gmp-item-icon" aria-hidden="true">
          ${
            item.kind === 'approval'
              ? '◈'
              : item.kind === 'alert'
                ? '!'
                : '✦'
          }
        </div>

        <div>

          <div class="gmp-item-meta">
            <b>${esc(item.source_module)}</b>

            · ${esc(fmt(item.created_at))}

            ${
              item.priority === 'high'
                ? ' · PRIORITARIA'
                : ''
            }
          </div>

          <h3>${esc(item.title)}</h3>

          <p>${esc(item.body)}</p>

          <div class="gmp-item-actions">

            ${
              route
                ? `
                  <a
                    href="${esc(route)}"
                    data-gmp-open="${esc(item.id)}"
                  >
                    ${
                      esc(
                        item.action_label ||
                        'Ver en el módulo'
                      )
                    }
                    ↗
                  </a>
                `
                : ''
            }

            <button
              type="button"
              data-gmp-mark="${esc(item.id)}"
              data-read="${!item.read_at ? 'yes' : 'no'}"
            >
              ${
                item.read_at
                  ? 'Marcar no leída'
                  : 'Marcar leída'
              }
            </button>

            <small>${esc(state)}</small>

          </div>
        </div>
      `;

      target.append(node);
    }
  }

  // CONSULTAR BANDEJA

  async function load(reset = true) {

    if (busy) return;

    if (reset) {
      page = 0;
    }

    busy = true;

    const current = ++requestVersion;

    $('gmpRefresh').disabled = true;
    $('gmpMore').disabled = true;

    note('Consultando tu bandeja…');

    try {

      const { data, error } = await db.rpc(
        'gg_my_notifications',
        {
          p_filter: filter,

          p_search:
            $('gmpSearch').value.trim(),

          p_from:
            $('gmpFrom').value || null,

          p_to:
            $('gmpTo').value || null,

          p_page: page
        }
      );

      if (error) {
        throw error;
      }

      if (current !== requestVersion) {
        return;
      }

      const items =
        Array.isArray(data?.items)
          ? data.items
          : [];

      const total =
        Number(data?.total) || 0;

      const unread =
        Number(data?.unread_count) || 0;

      display(items, !reset);

      set('gmpTotal', total);

      set('gmpUnreadCount', unread);

      set('gmpUnread', unread + ' sin leer');

      set(
        'gmpPending',
        Number(data?.pending_count) || 0
      );

      set(
        'gmpPagination',
        `${Math.min((page + 1) * 30, total)} de ${total}`
      );

      $('gmpMore').hidden =
        (page + 1) * 30 >= total;

      $('gmpReadAll').disabled =
        unread === 0;

      note(
        total
          ? 'Bandeja actualizada.'
          : 'Todavía no tienes notificaciones para este filtro.'
      );

    } catch (e) {

      console.error(
        '[GG Perfil / Notificaciones]',
        e
      );

      note(
        'No se pudo consultar la bandeja: ' +
        (e.message || e),
        true
      );

    } finally {

      busy = false;

      $('gmpRefresh').disabled = false;
      $('gmpMore').disabled = false;
    }
  }

  // PERFIL VINCULADO A RH

  async function profile() {

    const { data, error } =
      await db.auth.getUser();

    if (error || !data?.user) {

      window.location.replace('index.html');

      return false;
    }

    const email = data.user.email || '';

    set('gmpEmail', email);

    set(
      'gmpInitials',
      initials(email.split('@')[0])
    );

    try {

      const { data: hr, error: hrError } =
        await db.rpc('lo_my_hr_card');

      if (hrError) {
        throw hrError;
      }

      if (!hr) {

        set(
          'gmpName',
          'Sin empleado vinculado'
        );

        set(
          'gmpJob',
          'RH debe vincular este correo'
        );

        set(
          'gmpLinked',
          'Pendiente de Recursos Humanos'
        );

        return true;
      }

      const name =
        hr.full_name || 'Empleado';

      set('gmpName', name);

      set('gmpInitials', initials(name));

      set(
        'gmpJob',
        hr.position || 'Puesto por registrar'
      );

      set(
        'gmpLinked',
        '✓ Vinculado a Recursos Humanos'
      );

      const hire =
        hr.imss_entry_date ||
        hr.seniority_date;

      set(
        'gmpHire',
        hire
          ? String(hire)
              .slice(0, 10)
              .split('-')
              .reverse()
              .join('/')
          : 'Sin registrar'
      );

      if (hr.photo_path) {

        const { data: pic } = db.storage
          .from('employee-photos')
          .getPublicUrl(hr.photo_path);

        if (pic?.publicUrl) {

          const img = $('gmpPhoto');

          img.onload = () => {
            img.hidden = false;
          };

          img.onerror = () => {
            img.hidden = true;
          };

          img.src = pic.publicUrl;
        }
      }

    } catch (e) {

      console.error('[Perfil RH]', e);

      set(
        'gmpName',
        'Perfil RH no disponible'
      );

      set(
        'gmpJob',
        'La sesión sigue activa'
      );

      set(
        'gmpLinked',
        'Error de consulta a RH'
      );
    }

    return true;
  }

  // MARCAR NOTIFICACIÓN

  async function mark(id, read) {

    try {

      const { data, error } = await db.rpc(
        'gg_notification_mark_read',
        {
          p_notification_id: id,
          p_read: read
        }
      );

      if (error) {
        throw error;
      }

      if (!data) {
        throw Error(
          'Notificación no encontrada'
        );
      }

      await load(true);

    } catch (e) {

      note(
        'No se pudo cambiar la lectura: ' +
        e.message,
        true
      );
    }
  }

  // INICIALIZACIÓN

  async function init() {

    if (!db) {

      note(
        'Supabase no está disponible.',
        true
      );

      return;
    }

    let saved = 'dark';

    try {

      saved =
        localStorage.getItem(
          'gg-profile-theme'
        ) || 'dark';

    } catch (_) {
      // Usar tema oscuro por defecto.
    }

    theme(saved);

    $('gmpTheme').addEventListener(
      'click',
      () => theme(
        document.documentElement.dataset.gmpTheme === 'dark'
          ? 'light'
          : 'dark'
      )
    );

    if (!(await profile())) {
      return;
    }

    // PESTAÑAS

    document
      .querySelectorAll('[data-gmp-tab]')
      .forEach(btn => {

        btn.addEventListener(
          'click',
          () => {

            filter = btn.dataset.gmpTab;

            document
              .querySelectorAll('[data-gmp-tab]')
              .forEach(x => {

                x.classList.toggle(
                  'active',
                  x === btn
                );
              });

            load(true);
          }
        );
      });

    // ACTUALIZACIÓN

    $('gmpRefresh').addEventListener(
      'click',
      () => load(true)
    );

    // PAGINACIÓN

    $('gmpMore').addEventListener(
      'click',
      () => {

        page++;

        load(false);
      }
    );

    // BÚSQUEDA

    $('gmpSearch').addEventListener(
      'input',
      () => {

        clearTimeout(debounce);

        debounce = setTimeout(
          () => load(true),
          300
        );
      }
    );

    // FECHAS

    ['gmpFrom', 'gmpTo'].forEach(
      id => {

        $(id).addEventListener(
          'change',
          () => load(true)
        );
      }
    );

    // ACCIONES DE LOS AVISOS

    $('gmpList').addEventListener(
      'click',
      e => {

        const btn = e.target.closest(
          '[data-gmp-mark]'
        );

        if (btn) {

          mark(
            btn.dataset.gmpMark,
            btn.dataset.read === 'yes'
          );
        }

        const a = e.target.closest(
          '[data-gmp-open]'
        );

        if (a) {

          db.rpc(
            'gg_notification_mark_read',
            {
              p_notification_id:
                a.dataset.gmpOpen,

              p_read: true
            }
          ).then(() => {});
        }
      }
    );

    // MARCAR TODAS

    $('gmpReadAll').addEventListener(
      'click',
      async () => {

        $('gmpReadAll').disabled = true;

        try {

          const { error } = await db.rpc(
            'gg_notification_mark_all_read'
          );

          if (error) {
            throw error;
          }

          await load(true);

        } catch (e) {

          note(
            'No se pudieron marcar todas: ' +
            e.message,
            true
          );

        } finally {

          $('gmpReadAll').disabled = false;
        }
      }
    );

    // ACTUALIZAR AL REGRESAR

    document.addEventListener(
      'visibilitychange',
      () => {

        if (!document.hidden) {
          load(true);
        }
      }
    );

    db.auth.onAuthStateChange(
      event => {

        if (event === 'SIGNED_OUT') {
          location.replace('index.html');
        }
      }
    );

    await load(true);
  }

  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      () => init().catch(
        e => note(e.message, true)
      ),
      { once: true }
    );

  } else {

    init().catch(
      e => note(e.message, true)
    );
  }
})();
