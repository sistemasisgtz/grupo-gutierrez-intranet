(() => {

  "use strict";

  const db = window.ggSupabase;

  const holder =
    document.getElementById("ggProfileHolder");

  const button =
    document.getElementById("ggProfileButton");

  const panel =
    document.getElementById("ggProfilePanel");

  if (!db || !holder || !button || !panel) {
    return;
  }

  const el = id =>
    document.getElementById(id);

  const set = (id, text) => {
    const node = el(id);

    if (node) {
      node.textContent = text;
    }
  };

  // ========================================
  // INICIALES Y FOTOGRAFÍA
  // ========================================

  function initials(text) {

    const words = String(text || "GG")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return (
      words.length > 1

        ? words[0][0] +
          words[words.length - 1][0]

        : (words[0] || "GG").slice(0, 2)
    ).toUpperCase();
  }

  function setAvatar(name, photoPath) {

    const letters = initials(name);

    holder.querySelectorAll(
      "[data-gg-initials]"
    ).forEach(node => {
      node.textContent = letters;
    });

    if (!photoPath) {
      return;
    }

    const { data } = db.storage
      .from("employee-photos")
      .getPublicUrl(photoPath);

    if (!data?.publicUrl) {
      return;
    }

    holder.querySelectorAll(
      "[data-gg-avatar]"
    ).forEach(avatar => {

      const image =
        avatar.querySelector("img");

      if (!image) {
        return;
      }

      image.onload = () => {
        avatar.classList.add(
          "gg-profile-has-photo"
        );
      };

      image.onerror = () => {
        avatar.classList.remove(
          "gg-profile-has-photo"
        );
      };

      image.src = data.publicUrl;
    });
  }

  // ========================================
  // FECHAS
  // ========================================

  function dateUTC(value) {

    const found =
      /^(\d{4})-(\d{2})-(\d{2})/
        .exec(String(value || ""));

    if (!found) {
      return null;
    }

    const [, yy, mm, dd] = found;

    const d = new Date(
      Date.UTC(+yy, +mm - 1, +dd)
    );

    if (
      d.getUTCFullYear() !== +yy ||
      d.getUTCMonth() !== +mm - 1 ||
      d.getUTCDate() !== +dd
    ) {
      return null;
    }

    return d;
  }

  function readableDate(value) {

    const d = dateUTC(value);

    if (!d) {
      return "Sin registrar";
    }

    return new Intl.DateTimeFormat(
      "es-MX",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      }
    ).format(d);
  }

  // ========================================
  // ANTIGÜEDAD
  // ========================================

  function addMonths(date, count) {

    const first = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() + count,
        1
      )
    );

    const lastDay = new Date(
      Date.UTC(
        first.getUTCFullYear(),
        first.getUTCMonth() + 1,
        0
      )
    ).getUTCDate();

    return new Date(
      Date.UTC(
        first.getUTCFullYear(),
        first.getUTCMonth(),
        Math.min(
          date.getUTCDate(),
          lastDay
        )
      )
    );
  }

  function seniority(value) {

    const start = dateUTC(value);

    if (!start) {
      return "Sin fecha registrada";
    }

    const now = new Date();

    const today = new Date(
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
    );

    if (start > today) {
      return "Fecha futura";
    }

    let months =
      (
        today.getUTCFullYear() -
        start.getUTCFullYear()
      ) * 12 +
      today.getUTCMonth() -
      start.getUTCMonth();

    if (
      addMonths(start, months) > today
    ) {
      months--;
    }

    const cursor = addMonths(
      start,
      months
    );

    const days = Math.round(
      (today - cursor) / 86400000
    );

    const years = Math.floor(
      months / 12
    );

    const remaining = months % 12;

    const parts = [];

    if (years) {

      parts.push(
        years +
        (years === 1 ? " año" : " años")
      );
    }

    if (remaining) {

      parts.push(
        remaining +
        (
          remaining === 1
            ? " mes"
            : " meses"
        )
      );
    }

    if (days || !parts.length) {

      parts.push(
        days +
        (days === 1 ? " día" : " días")
      );
    }

    return parts.join(", ");
  }

  // ========================================
  // ABRIR Y CERRAR
  // ========================================

  function toggle(open) {

    panel.hidden = !open;

    button.setAttribute(
      "aria-expanded",
      String(open)
    );

    holder.classList.toggle(
      "gg-profile-open",
      open
    );
  }

  button.addEventListener(
    "click",
    () => toggle(panel.hidden)
  );

  document.addEventListener(
    "pointerdown",
    event => {

      if (!holder.contains(event.target)) {
        toggle(false);
      }
    }
  );

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        !panel.hidden
      ) {

        toggle(false);
        button.focus();
      }
    }
  );

  // ========================================
  // CARGAR SESIÓN Y DATOS DE RH
  // ========================================

  async function load() {

    const {
      data: auth,
      error: authError
    } = await db.auth.getSession();

    if (authError) {
      throw authError;
    }

    const account =
      auth?.session?.user;

    if (!account) {
      // sistema.js controla el acceso.
      return;
    }

    const email =
      account.email ||
      "Cuenta autenticada";

    set(
      "systemUserEmail",
      email
    );

    set(
      "ggProfileEmailPanel",
      email
    );

    setAvatar(
      email.split("@")[0],
      null
    );

    // La función SQL filtra mediante
    // auth.uid(), no por un ID enviado
    // desde el navegador.

    const {
      data: employee,
      error
    } = await db.rpc(
      "lo_my_hr_card"
    );

    if (error) {
      throw error;
    }

    // ====================================
    // EMPLEADO NO VINCULADO
    // ====================================

    if (!employee) {

      set(
        "ggProfileName",
        "Sin ficha vinculada"
      );

      set(
        "ggProfileRole",
        "Recursos Humanos"
      );

      set(
        "ggProfileNamePanel",
        "Sin empleado vinculado"
      );

      set(
        "ggProfileRolePanel",
        "RH debe vincular tu usuario"
      );

      set(
        "ggProfileHire",
        "Sin registrar"
      );

      set(
        "ggProfileSeniority",
        "Sin registrar"
      );

      set(
        "ggProfileNotice",
        "Tu sesión está activa, pero RH " +
        "aún no ha vinculado tu cuenta " +
        "a una ficha de empleado."
      );

      el("ggProfileNotice").hidden = false;

      return;
    }

    // ====================================
    // EMPLEADO ENCONTRADO
    // ====================================

    const name =
      employee.full_name ||
      "Empleado";

    const role =
      employee.position ||
      "Puesto sin asignar";

    set("ggProfileName", name);
    set("ggProfileRole", role);

    set(
      "ggProfileNamePanel",
      name
    );

    set(
      "ggProfileRolePanel",
      role
    );

    set(
      "ggProfileHire",
      readableDate(
        employee.imss_entry_date ||
        employee.seniority_date
      )
    );

    set(
      "ggProfileSeniority",
      seniority(
        employee.seniority_date ||
        employee.imss_entry_date
      )
    );

    // Aclarar diferencias entre fechas.

    if (
      employee.imss_entry_date &&
      employee.seniority_date &&
      employee.imss_entry_date !==
        employee.seniority_date
    ) {

      set(
        "ggProfileNotice",
        "Antigüedad calculada desde " +
        readableDate(
          employee.seniority_date
        ) +
        ". Fecha de ingreso según " +
        "registro IMSS."
      );

      el(
        "ggProfileNotice"
      ).hidden = false;
    }

    setAvatar(
      name,
      employee.photo_path
    );
  }

  // ========================================
  // ERRORES SIN BLOQUEAR SISTEMA
  // ========================================

  load().catch(error => {

    console.error(
      "[SISTEMA PERFIL RH]",
      error
    );

    set(
      "ggProfileName",
      "Perfil no disponible"
    );

    set(
      "ggProfileRole",
      "Consulta de RH fallida"
    );

    set(
      "ggProfileNamePanel",
      "No se pudo consultar RH"
    );

    set(
      "ggProfileRolePanel",
      "Tu sesión continúa activa"
    );

    set(
      "ggProfileHire",
      "No disponible"
    );

    set(
      "ggProfileSeniority",
      "No disponible"
    );

    set(
      "ggProfileNotice",
      "No se pudo leer el perfil. " +
      "Revisa la consola y los permisos " +
      "de la función lo_my_hr_card."
    );

    el("ggProfileNotice").hidden = false;
  });

})();