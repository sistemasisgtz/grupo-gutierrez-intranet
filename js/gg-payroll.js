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

const state = {
  employees: [],
  rows: [],
  batchId: null,
  busy: false,
  sent: false
};

const MAX_BYTES = 15 * 1024 * 1024;

function note(message) {
  $("nStatus").textContent = message;
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function words(value) {
  return normalize(value)
    .split(/\s+/)
    .filter(Boolean);
}

function signature(tokens) {
  return tokens.slice().sort().join("|");
}

/*
  Coincidencia por las mismas palabras,
  independientemente del acomodo.

  Para evitar falsos positivos, el nombre
  debe aparecer completo en una línea
  o un campo de texto consecutivo.
*/
function match(lines) {
  const found = new Map();
  const signatures = new Map();

  for (const employee of state.employees) {
    const tokens = words(employee.full_name);

    if (tokens.length < 2 || tokens.length > 12)
      continue;

    const key = signature(tokens);

    if (!signatures.has(key))
      signatures.set(key, []);

    signatures.get(key).push(employee);
  }

  const segments = lines.concat(
    lines.slice(0, -1).map(
      (line, i) => line + " " + lines[i+1]
    )
  );

  for (const line of segments) {
    const tokens = words(line);

    if (tokens.length > 60) continue;

    for (const [key, employees] of signatures) {
      const size = key.split("|").length;

      if (tokens.length < size) continue;

      for (
        let i = 0;
        i <= tokens.length - size;
        i++
      ) {
        if (
          signature(tokens.slice(i, i+size))
          !== key
        ) continue;

        for (const employee of employees) {
          found.set(employee.id, {
            employee,
            line
          });
        }

        break;
      }
    }
  }

  const hits = [...found.values()];

  if (hits.length === 1) {
    return {
      status: "exact",
      employee: hits[0].employee,
      extracted: hits[0].line.slice(0,240),
      detail: "Nombre completo: mismas palabras sin importar orden."
    };
  }

  if (hits.length > 1) {
    return {
      status: "review",
      employee: null,
      extracted: hits.map(
        h => h.employee.full_name
      ).join(" / ").slice(0,240),
      detail: "Varios empleados posibles. Selecciona el destinatario."
    };
  }

  return {
    status: "missing",
    employee: null,
    extracted: "",
    detail: "No se encontró el nombre completo en el texto extraíble."
  };
}

async function readPdf(file) {
  const raw = new Uint8Array(
    await file.arrayBuffer()
  );

  const header = String.fromCharCode(
    ...raw.slice(0,5)
  );

  if (header !== "%PDF-")
    throw Error("El archivo no tiene cabecera PDF.");

  if (!window.pdfjsLib)
    throw Error("No cargó PDF.js.");

  const pdf = await pdfjsLib.getDocument({
    data: raw
  }).promise;

  const lines = [];

  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
  ) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const groups = new Map();

    for (const item of content.items) {
      const y = Math.round(
        (item.transform?.[5] || 0) / 3
      ) * 3;

      if (!groups.has(y)) groups.set(y, []);

      groups.get(y).push({
        x: item.transform?.[4] || 0,
        s: item.str || ""
      });
    }

    for (const group of groups.values()) {
      group.sort((a,b) => a.x - b.x);

      lines.push(
        group.map(item => item.s).join(" ")
      );
    }
  }

  return match(lines);
}

function label(status) {
  return {
    exact: "Encontrado",
    review: "Por revisar",
    missing: "No encontrado"
  }[status] || status;
}

function summary() {
  for (const [status, id] of [
    ["exact","nExact"],
    ["review","nReview"],
    ["missing","nMissing"]
  ]) {
    $(id).textContent = state.rows.filter(
      row => row.status === status
    ).length;
  }

  $("nCount").textContent =
    state.rows.length + " archivos";
}

function render() {
  summary();

  const root = $("nRows");
  root.replaceChildren();

  if (!state.rows.length) {
    root.innerHTML =
      '<p class="n-empty">Selecciona tus PDF para comenzar.</p>';
    return;
  }

  state.rows.forEach((row, index) => {
    const item = document.createElement("div");
    item.className = "n-row";

    const options = state.employees.map(
      employee => {
        const selected =
          row.employee?.id === employee.id
            ? "selected" : "";

        return '<option value="' +
          esc(employee.id) + '" ' +
          selected + ">" +
          esc(employee.full_name) +
          " · " +
          esc(employee.payroll_number || "s/n") +
          "</option>";
      }
    ).join("");

    item.innerHTML =
      '<div class="n-file"><strong>▤ ' +
      esc(row.file.name) +
      '</strong><small>' +
      esc(row.detail) +
      '</small></div>' +
      '<div><select aria-label="Empleado">' +
      '<option value="">— Sin asignar —</option>' +
      options +
      '</select></div>' +
      '<span class="n-state ' +
      esc(row.status) + '">' +
      esc(label(row.status)) +
      "</span>";

    item.querySelector("select").onchange =
      async event => {
        if (state.sent || state.busy) {
          render();
          return;
        }

        const oldEmployee = row.employee;
        const oldStatus = row.status;
        const oldDetail = row.detail;

        row.employee = state.employees.find(
          e => e.id === event.target.value
        ) || null;

        row.status = row.employee
          ? "review"
          : "missing";

        row.detail = row.employee
          ? "Asignación manual; revisa destinatario."
          : "Sin destinatario seleccionado.";

        if (row.docId) {
          const {error} = await db.rpc(
            "gg_payroll_assign",
            {
              p_document_id: row.docId,
              p_employee_id: row.employee?.id || null
            }
          );

          if (error) {
            row.employee = oldEmployee;
            row.status = oldStatus;
            row.detail = oldDetail;
            note("Error: " + error.message);
          }
        }

        render();
      };

    root.append(item);
  });
}

async function chosen(files) {
  if (state.busy || state.batchId || state.sent) {
    note("Para otro lote recarga la pantalla.");
    return;
  }

  state.busy = true;

  try {
    for (const file of files) {
      if (
        !file.name.toLowerCase().endsWith(".pdf")
        || file.size > MAX_BYTES
      ) {
        state.rows.push({
          file,
          status: "missing",
          employee: null,
          detail: "Formato inválido o más de 15 MB.",
          invalid: true
        });
        continue;
      }

      note("Analizando " + file.name + "...");

      let result;

      try {
        result = await readPdf(file);
      } catch (error) {
        result = {
          status: "missing",
          employee: null,
          extracted: "",
          detail: "Sin texto válido: " + error.message
        };
      }

      state.rows.push({file, ...result});
      render();
    }

    note(
      "Análisis listo. Verifica los empleados antes de enviar."
    );
  } finally {
    state.busy = false;
    render();
    $("nFiles").value = "";
  }
}

function setBusy(value) {
  state.busy = value;

  for (const id of [
    "nSendExact",
    "nSendReview",
    "nFiles"
  ]) {
    $(id).disabled = value;
  }
}

async function dispatch(includeReview) {
  if (state.busy || state.sent) return;

  const title = $("nTitle").value.trim();

  if (!title) {
    note("Escribe el título de notificación.");
    return;
  }

  if (!state.rows.length) {
    note("Primero agrega los PDF.");
    return;
  }

  const eligible = state.rows.filter(
    row =>
      row.employee &&
      !row.invalid &&
      (
        row.status === "exact"
        || (
          includeReview &&
          row.status === "review"
        )
      )
  );

  if (!eligible.length) {
    note("No hay PDF elegibles para este envío.");
    return;
  }

  const question =
    "¿Enviar " + eligible.length +
    " PDF privados a sus empleados?\n" +
    (
      includeReview
        ? "Incluye asignaciones por revisar."
        : "Solo coincidencias exactas."
    ) +
    "\nLa operación no se puede deshacer.";

  if (!confirm(question)) return;

  setBusy(true);

  try {
    if (!state.batchId) {
      const created = await db.rpc(
        "gg_payroll_new_batch",
        {p_title:title}
      );

      if (created.error) throw created.error;

      state.batchId = created.data;
      $("nTitle").disabled = true;
    }

    for (
      let i = 0;
      i < state.rows.length;
      i++
    ) {
      const row = state.rows[i];

      if (row.invalid || row.docId) continue;

      note(
        "Subiendo " + (i+1) + "/" +
        state.rows.length + ": " +
        row.file.name
      );

      const storagePath =
        state.batchId + "/" +
        crypto.randomUUID() + ".pdf";

      const uploaded = await db.storage
        .from("gg-payroll-private")
        .upload(storagePath, row.file, {
          upsert: false,
          contentType: "application/pdf"
        });

      if (uploaded.error) throw uploaded.error;

      const saved = await db.rpc(
        "gg_payroll_register_file",
        {
          p_batch_id: state.batchId,
          p_file_name: row.file.name,
          p_storage_path: storagePath,
          p_extracted_name: row.extracted || null,
          p_employee_id: row.employee?.id || null,
          p_match_status: row.status,
          p_diagnostic: row.detail || null
        }
      );

      if (saved.error) throw saved.error;

      row.docId = saved.data;
    }

    const result = await db.rpc(
      "gg_payroll_send_batch",
      {
        p_batch_id: state.batchId,
        p_include_review: includeReview
      }
    );

    if (result.error) throw result.error;

    state.sent = true;

    note(
      "✓ Enviados " + result.data +
      " PDF. Los demás quedaron registrados sin enviar."
    );

    await history();
  } catch (error) {
    note(
      "No se completó el envío: " +
      error.message +
      "\nEl lote permanece en borrador."
    );
  } finally {
    setBusy(false);

    if (state.sent) {
      $("nFiles").disabled = true;
      $("nSendExact").disabled = true;
      $("nSendReview").disabled = true;
    }
  }
}

function date(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString(
    "es-MX",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );
}

async function openAdminFile(storagePath) {
  const result = await db.storage
    .from("gg-payroll-private")
    .createSignedUrl(storagePath,60);

  if (result.error) {
    alert(result.error.message);
    return;
  }

  window.open(
    result.data.signedUrl,
    "_blank",
    "noopener,noreferrer"
  );
}

async function history() {
  const root = $("nHistoryRows");

  const batches = await db
    .from("gg_payroll_batches")
    .select("*")
    .order("created_at",{ascending:false})
    .limit(80);

  if (batches.error) {
    root.textContent = batches.error.message;
    return;
  }

  root.replaceChildren();

  if (!batches.data.length) {
    root.innerHTML =
      '<p class="n-empty">Aún no hay lotes.</p>';
    return;
  }

  for (const batch of batches.data) {
    const header = document.createElement("div");
    header.className = "n-history-row";

    header.innerHTML =
      "<div><strong>" +
      esc(batch.title) +
      "</strong><small>" +
      esc(date(batch.sent_at || batch.created_at)) +
      " · " +
      esc(batch.created_by_email) +
      "</small></div><span>" +
      (batch.status === "sent"
        ? "Enviado" : "Borrador") +
      " ▾</span>";

    const details = document.createElement("div");
    details.className = "n-history-detail";
    details.hidden = true;

    header.onclick = async () => {
      details.hidden = !details.hidden;

      if (
        details.hidden ||
        details.dataset.loaded
      ) return;

      details.textContent = "Cargando documentos...";

      const docs = await db
        .from("gg_payroll_documents")
        .select("*")
        .eq("batch_id",batch.id)
        .order("created_at");

      if (docs.error) {
        details.textContent = docs.error.message;
        return;
      }

      details.replaceChildren();

      if (!docs.data.length) {
        details.textContent = "Sin archivos.";
        return;
      }

      for (const doc of docs.data) {
        const employee = state.employees.find(
          e => e.id === doc.employee_id
        );

        const row = document.createElement("div");
        row.className = "n-row";

        row.innerHTML =
          '<div class="n-file"><strong>' +
          esc(doc.file_name) +
          "</strong><small>" +
          esc(doc.diagnostic || "") +
          "</small></div><span>" +
          esc(employee?.full_name || "Sin empleado") +
          '</span><span class="n-state ' +
          esc(doc.match_status) + '">' +
          (doc.sent ? "✓ Enviado" : "No enviado") +
          (doc.read_at ? " · Leído" : "") +
          "</span>";

        const button = document.createElement(
          "button"
        );

        button.className = "n-btn";
        button.type = "button";
        button.textContent = "Abrir PDF";

        button.onclick = () =>
          openAdminFile(doc.storage_path);

        row.querySelector(".n-file").append(button);
        details.append(row);
      }

      details.dataset.loaded = "1";
    };

    root.append(header,details);
  }
}

async function init() {
  const theme = localStorage.getItem(
    "gg-payroll-theme"
  );

  if (theme === "light") {
    document.documentElement.dataset.theme =
      "light";
  }

  $("nTheme").onclick = () => {
    const next =
      document.documentElement.dataset.theme
        === "light" ? "dark" : "light";

    document.documentElement.dataset.theme =
      next;

    localStorage.setItem(
      "gg-payroll-theme",next
    );
  };

  if (!db) throw Error("Supabase no disponible.");

  const auth = await db.auth.getUser();

  if (auth.error || !auth.data?.user) {
    location.replace("index.html");
    return;
  }

  const permit = await db.rpc(
    "gg_payroll_can_manage"
  );

  if (permit.error || permit.data !== true) {
    $("nDenied").hidden = false;
    $("nDeniedText").textContent =
      permit.error?.message ||
      "Pide acceso desde Sistemas.";
    return;
  }

  const employees = await db.rpc(
    "gg_payroll_employee_catalog"
  );

  if (employees.error) {
    $("nDenied").hidden = false;
    $("nDeniedText").textContent =
      employees.error.message;
    return;
  }

  state.employees = employees.data || [];
  $("nApp").hidden = false;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  $("nFiles").onchange = event =>
    chosen([...event.target.files]);

  const drop = document.querySelector(".n-drop");

  drop.ondragover = event => {
    event.preventDefault();
    drop.style.borderStyle = "solid";
  };

  drop.ondragleave = () =>
    drop.style.borderStyle = "dashed";

  drop.ondrop = event => {
    event.preventDefault();
    drop.style.borderStyle = "dashed";
    chosen([...event.dataTransfer.files]);
  };

  $("nSendExact").onclick = () =>
    dispatch(false);

  $("nSendReview").onclick = () =>
    dispatch(true);

  $("nRefresh").onclick = history;

  for (
    const button of document.querySelectorAll(
      "[data-tab]"
    )
  ) {
    button.onclick = () => {
      for (
        const other of document.querySelectorAll(
          "[data-tab]"
        )
      ) {
        other.classList.toggle(
          "active",other === button
        );
      }

      $("nNew").hidden =
        button.dataset.tab !== "new";

      $("nHistory").hidden =
        button.dataset.tab !== "history";

      if (button.dataset.tab === "history") {
        history();
      }
    };
  }

  render();
}

document.addEventListener(
  "DOMContentLoaded",
  () => init().catch(error => {
    console.error(error);
    $("nDenied").hidden = false;
    $("nDeniedText").textContent =
      error.message;
  })
);

})();