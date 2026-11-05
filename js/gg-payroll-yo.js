/*
  Recibos privados en YO.
  No utiliza la identidad de auth.uid()
  porque YO tiene otra sesión.
*/
(() => {
"use strict";

const db = window.ggSupabase;
const token = () => sessionStorage.getItem(
  "gg_intranet_token"
);

const esc = value => String(value ?? "")
  .replace(/[&<>"']/g,c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c]));

let loading = false;
let items = [];

function render() {
  const box = document.getElementById(
    "yoNotificationsList"
  );

  if (!box) return;

  let holder = document.getElementById(
    "ggPayrollYoList"
  );

  if (!holder) {
    holder = document.createElement("section");
    holder.id = "ggPayrollYoList";
    holder.className = "gg-payroll-yo";
    box.append(holder);
  }

  holder.replaceChildren();

  if (!items.length) return;

  box.querySelector(
    ".yo-notifications-empty"
  )?.remove();

  const heading = document.createElement("p");
  heading.textContent = "RECIBOS DE NÓMINA";
  heading.className = "gg-payroll-yo-title";
  holder.append(heading);

  for (const item of items) {
    const button = document.createElement(
      "button"
    );

    button.type = "button";
    button.className = "gg-payroll-yo-item";

    button.innerHTML =
      "<strong>" +
      esc(item.title) +
      "</strong><small>" +
      esc(item.file_name) +
      " · " +
      new Date(item.sent_at).toLocaleDateString(
        "es-MX"
      ) +
      "</small><span>" +
      (
        item.read_at
          ? "Ver nuevamente ↗"
          : "● Nuevo · Abrir PDF ↗"
      ) +
      "</span>";

    button.onclick = async () => {
      button.disabled = true;

      button.querySelector("span").textContent =
        "Abriendo PDF privado...";

      try {
        const result = await db.functions.invoke(
          "gg-payroll-download",
          {
            body: {
              session_token: token(),
              document_id: item.id
            }
          }
        );

        if (result.error) throw result.error;

        if (!result.data?.url) {
          throw Error(
            "No se autorizó la lectura del PDF."
          );
        }

        window.open(
          result.data.url,
          "_blank",
          "noopener,noreferrer"
        );

        await refresh();
      } catch (error) {
        alert(
          "No se pudo abrir la nómina: " +
          error.message
        );
      } finally {
        button.disabled = false;
      }
    };

    holder.append(button);
  }

  const badge = document.getElementById(
    "yoNotificationBadge"
  );

  if (badge) {
    const unread = items.filter(
      item => !item.read_at
    ).length;

    badge.textContent = String(unread);

    badge.classList.toggle(
      "empty",unread === 0
    );
  }
}

async function refresh() {
  if (loading || !token()) return;

  loading = true;

  try {
    const result = await db.rpc(
      "gg_payroll_yo_list",
      {p_session_token:token()}
    );

    if (result.error) throw result.error;

    items = result.data || [];
    render();
  } catch (error) {
    console.warn(
      "[YO NÓMINA]",error.message
    );
  } finally {
    loading = false;
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const style = document.createElement(
      "style"
    );

    style.textContent =
      ".gg-payroll-yo{padding:6px}" +
      ".gg-payroll-yo-title{margin:8px 12px;" +
      "color:#66bce6;font-size:11px;" +
      "font-weight:800;letter-spacing:.12em}" +
      ".gg-payroll-yo-item{display:block;" +
      "width:100%;text-align:left;cursor:pointer;" +
      "border:1px solid #8ac7f033;" +
      "border-radius:14px;background:#568fbd12;" +
      "color:inherit;padding:13px;margin:8px 0}" +
      ".gg-payroll-yo-item strong," +
      ".gg-payroll-yo-item small," +
      ".gg-payroll-yo-item span{" +
      "display:block;margin:5px 0}" +
      ".gg-payroll-yo-item small{" +
      "font-size:11px;opacity:.75}" +
      ".gg-payroll-yo-item span{" +
      "font-size:11px;color:#70c8ff}" +
      ".gg-payroll-yo-item:disabled{" +
      "opacity:.55}";

    document.head.append(style);

    setTimeout(refresh,1200);

    document.getElementById(
      "yoNotificationButton"
    )?.addEventListener(
      "click",
      () => setTimeout(refresh,50)
    );

    setInterval(
      () => {
        if (!document.hidden) refresh();
      },
      90000
    );
  }
);

})();