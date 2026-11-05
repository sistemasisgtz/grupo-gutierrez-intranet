
"use strict";

/*
  GRUPO GUTIERREZ · FIX NOMINA YO V4

  Corrige el formato enviado a la Edge Function
  y explica que validacion falla sin revelar
  sesiones ni datos privados.

  Ejecutar:
  node fix-nomina-solicitud-v4.cjs

  No genera .bak ni respaldos en disco.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = process.cwd();

const paths = {
  yo: "js/gg-payroll-yo.js",
  edge:
    "supabase/functions/gg-payroll-download/index.ts",
  html: "yo.html"
};

const locate = name => path.join(root, name);

const changes = new Map();
const previous = new Map();

// ==========================================
// VALIDAR ARCHIVOS EXISTENTES
// ==========================================

for (const file of Object.values(paths)) {
  if (!fs.existsSync(locate(file))) {
    throw Error(
      "Falta " + file +
      ". Ejecuta desde la raiz del proyecto."
    );
  }

  previous.set(
    file,
    fs.readFileSync(locate(file), "utf8")
  );
}

// ==========================================
// FIX JAVASCRIPT DE YO
// ==========================================

let yo = previous.get(paths.yo);

if (!yo.includes("GG_PAYROLL_INPUT_FIX_V4")) {

  const oldCall =
    /const\s*\{\s*data\s*,\s*error\s*\}\s*=\s*await\s+db\.functions\.invoke\(\s*["']gg-payroll-download["']\s*,\s*\{\s*body\s*:\s*\{\s*session_token\s*:\s*token\(\)\s*,\s*document_id\s*:\s*receipt\.id\s*\}\s*\}\s*\);/;

  if (!oldCall.test(yo)) {
    throw Error(
      "No encontre la llamada conocida " +
      "de descarga en js/gg-payroll-yo.js. " +
      "No se modifico nada."
    );
  }

  const replacement = `
      /* GG_PAYROLL_INPUT_FIX_V4 */

      const currentToken = token();

      const currentDocumentId = receipt?.id;

      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Verificar sesion antes de solicitar.
      if (
        typeof currentToken !== "string" ||
        currentToken.length < 16
      ) {
        throw Error(
          "La sesion de YO esta ausente o incompleta. " +
          "Cierra sesion y vuelve a entrar."
        );
      }

      // Verificar identificador del documento.
      if (
        typeof currentDocumentId !== "string" ||
        !uuidPattern.test(currentDocumentId)
      ) {
        throw Error(
          "La notificacion no contiene un ID " +
          "de PDF valido. Actualiza YO e intenta de nuevo."
        );
      }

      // Enviar JSON explicito a Supabase.
      const {data, error} =
        await db.functions.invoke(
          "gg-payroll-download",
          {
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              session_token: currentToken,
              document_id: currentDocumentId
            })
          }
        );
`;

  yo = yo.replace(
    oldCall,
    replacement
  );
}

changes.set(paths.yo, yo);

// ==========================================
// FIX VALIDACIONES EDGE FUNCTION
// ==========================================

let edge = previous.get(paths.edge);

if (
  !edge.includes(
    "GG_PAYROLL_EDGE_INPUT_FIX_V4"
  )
) {

  const start = edge.indexOf(
    "    const input = await request.json().catch(() => null);"
  );

const end = edge.indexOf(
  "    const supabaseUrl =",
  start
);

  if (
    start < 0 ||
    end < 0 ||
    end <= start ||
    !edge.includes("gg_payroll_yo_open_path") ||
    !edge.includes("gg-payroll-private")
  ) {
    throw Error(
      "La Edge Function no coincide " +
      "con la version V3. " +
      "No se modifico nada."
    );
  }

  const newValidation = `
    // GG_PAYROLL_EDGE_INPUT_FIX_V4

    // Nunca registrar ni devolver tokens.

    let input;

    try {
      input = await request.json();

      if (typeof input === "string") {
        input = JSON.parse(input);
      }

    } catch {
      return result(request, {
        error: "El cuerpo recibido no es JSON valido"
      }, 400);
    }

    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input)
    ) {
      return result(request, {
        error: "El cuerpo debe ser un objeto JSON"
      }, 400);
    }

    const session = input.session_token;
    const doc = input.document_id;

    // Validar sesion de intranet.
    if (
      typeof session !== "string" ||
      session.length < 16
    ) {
      return result(request, {
        error:
          "La sesion de YO esta ausente o incompleta"
      }, 400);
    }

    // Validar UUID del PDF.
    if (
      typeof doc !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doc)
    ) {
      return result(request, {
        error:
          "El identificador del documento no es un UUID valido"
      }, 400);
    }

`;

  edge =
    edge.slice(0, start) +
    newValidation +
    edge.slice(end);
}

changes.set(paths.edge, edge);

// ==========================================
// FORZAR ACTUALIZACION DEL SCRIPT
// ==========================================

let html = previous.get(paths.html);

const scriptTag =
  /(<script\s+src=["']js\/gg-payroll-yo\.js)(?:\?v=\d+)?(["']\s*><\/script>)/i;

if (!scriptTag.test(html)) {
  throw Error(
    "No encontre el script de Nomina " +
    "en yo.html. No se modifico nada."
  );
}

html = html.replace(
  scriptTag,
  "$1?v=4$2"
);

changes.set(paths.html, html);

// ==========================================
// VALIDACIONES PREVIAS
// ==========================================

new vm.Script(
  yo,
  {filename: paths.yo}
);

if (
  !edge.includes(
    "const checked = await admin.rpc"
  ) ||
  !edge.includes(
    "GG_PAYROLL_EDGE_INPUT_FIX_V4"
  )
) {
  throw Error(
    "Fallo la validacion del parche Edge."
  );
}

if (
  !html.includes(
    "gg-payroll-yo.js?v=4"
  )
) {
  throw Error(
    "No se pudo actualizar el script de YO."
  );
}

// ==========================================
// APLICAR Y RECUPERAR EN CASO DE ERROR
// ==========================================

const applied = [];

try {

  for (const [file, content] of changes) {

    if (
      content === previous.get(file)
    ) {
      continue;
    }

    applied.push(file);

    fs.writeFileSync(
      locate(file),
      content,
      "utf8"
    );
  }

} catch (error) {

  for (const file of applied.reverse()) {

    try {
      fs.writeFileSync(
        locate(file),
        previous.get(file),
        "utf8"
      );

    } catch (restoreError) {
      console.error(
        "No se pudo restaurar",
        file,
        restoreError.message
      );
    }
  }

  throw error;
}

// ==========================================
// RESULTADO
// ==========================================

console.log(
  "\n✓ Fix de Nomina V4 aplicado."
);

console.log(
  "✓ Archivos cambiados:",
  applied.length
);

console.log(
  "✓ Sin respaldo .bak."
);

console.log(
  "✓ Sin tocar SQL, PDFs o permisos."
);

console.log(
  "\nIMPORTANTE: vuelve a desplegar " +
  "gg-payroll-download."
);

console.log(
  "Despues recarga YO con Ctrl+F5."
);
