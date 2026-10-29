
(() => {
  "use strict";

  window.ggSistemasNotificationRender =
    function(node,item) {
      if (
        item.kind !== "approval" ||
        item.decision_status !== "pending" ||
        !/^gg_sistemas_request:[0-9a-f-]{36}$/i
          .test(item.reference_key || "")
      ) return;

      const actions = node.querySelector(
        ".gmp-item-actions"
      );

      if (!actions) return;

      const id = item.reference_key.split(":")[1];

      for (const [label,decision] of [
        ["Aprobar","approved"],
        ["Rechazar","rejected"]
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gg-sistemas-approval";
        button.textContent = label;

        button.onclick = async () => {
          if (!confirm(label + " esta solicitud?")) {
            return;
          }

          button.disabled = true;

          const {error} = await window.ggSupabase.rpc(
            "gg_sistemas_resolve_request",
            {
              p_request_id:id,
              p_decision:decision
            }
          );

          if (error) {
            alert(error.message);
            button.disabled = false;
            return;
          }

          document.getElementById("gmpRefresh")?.click();
        };

        actions.append(button);
      }
    };
})();
