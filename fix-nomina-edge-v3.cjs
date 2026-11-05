
"use strict";

/*
  GRUPO GUTIERREZ - FIX EDGE FUNCTION NOMINA V3
  Ejecuta: node fix-nomina-edge-v3.cjs
  No modifica PDF, SQL, YO, ni permisos.
  No genera archivos .bak ni backups.
*/

const fs = require("node:fs");
const path = require("node:path");

const target = path.join(
  process.cwd(),
  "supabase", "functions", "gg-payroll-download", "index.ts"
);

if (!fs.existsSync(target)) {
  throw new Error(
    "No existe supabase/functions/gg-payroll-download/index.ts. " +
    "Ejecuta el parche desde la raiz del proyecto."
  );
}

const original = fs.readFileSync(target, "utf8");

if (
  !original.includes("gg_payroll_yo_open_path") ||
  !original.includes("gg-payroll-private")
) {
  throw new Error(
    "La funcion actual no coincide con Nomina. " +
    "No se modifico nada."
  );
}

const replacement = String.raw`
// GRUPO GUTIERREZ - NOMINA EDGE V3
// Acceso privado a cada PDF de YO.
// La verificacion de destinatario ocurre en PostgreSQL.

import { createClient } from "npm:@supabase/supabase-js@2";

function cors(request) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      request.headers.get("access-control-request-headers") ||
      "authorization,apikey,content-type,x-client-info,x-retry-count,traceparent,tracestate,baggage",
    "Access-Control-Max-Age": "600",
    "Cache-Control": "no-store",
    "Vary": "Access-Control-Request-Headers",
  };
}

function result(request, payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...cors(request),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function getSecret() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (legacy) return legacy;

  try {
    const keys = JSON.parse(
      Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"
    );

    return keys.default || "";
  } catch {
    return "";
  }
}

Deno.serve(async (request) => {

  // Responder CORS antes de inicializar Supabase.
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: cors(request)
    });
  }

  if (request.method !== "POST") {
    return result(
      request,
      { error: "Metodo no permitido" },
      405
    );
  }

  try {
    const input = await request.json().catch(() => null);

    const session = input?.session_token;
    const doc = input?.document_id;

    if (
      typeof session !== "string" ||
      session.length < 16 ||
      typeof doc !== "string" ||
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(doc)
    ) {
      return result(
        request,
        { error: "Solicitud invalida" },
        400
      );
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") || "";

    const serviceKey = getSecret();

    if (!supabaseUrl || !serviceKey) {
      console.error(
        "[GG PAYROLL] Faltan variables del servidor"
      );

      return result(request, {
        error: "Funcion sin configuracion de Supabase. Revisar logs."
      }, 503);
    }

    const admin = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // PostgreSQL verifica que el PDF pertenezca
    // al empleado autenticado en YO.
    const checked = await admin.rpc(
      "gg_payroll_yo_open_path",
      {
        p_session_token: session,
        p_document_id: doc
      }
    );

    if (checked.error) {
      console.error(
        "[GG PAYROLL] Error en RPC",
        checked.error.code,
        checked.error.message
      );

      return result(request, {
        error: "No fue posible validar la sesion. Revisar logs."
      }, 500);
    }

    if (!checked.data) {
      return result(request, {
        error: "Documento no autorizado para esta sesion de YO"
      }, 403);
    }

    // URL temporal: 45 segundos.
    const signed = await admin.storage
      .from("gg-payroll-private")
      .createSignedUrl(checked.data, 45);

    if (
      signed.error ||
      !signed.data?.signedUrl
    ) {
      console.error(
        "[GG PAYROLL] Error Storage",
        signed.error?.message
      );

      return result(request, {
        error: "No se pudo generar el enlace privado"
      }, 500);
    }

    return result(request, {
      url: signed.data.signedUrl
    });

  } catch (error) {
    console.error(
      "[GG PAYROLL] Error inesperado",
      error
    );

    return result(request, {
      error: "Error interno de lectura privada. Revisar logs."
    }, 500);
  }
});
`.trim() + "\n";

if (original === replacement) {
  console.log(
    "OK: fix V3 ya estaba aplicado. No hay cambios."
  );

  process.exit(0);
}

try {
  fs.writeFileSync(
    target,
    replacement,
    "utf8"
  );

} catch (error) {
  try {
    fs.writeFileSync(
      target,
      original,
      "utf8"
    );
  } catch (restoreError) {
    console.error(
      "No fue posible restaurar el original:",
      restoreError.message
    );
  }

  throw error;
}

console.log(
  "OK: Edge Function de Nomina corregida localmente."
);

console.log(
  "Archivo actualizado:",
  path.relative(process.cwd(), target)
);

console.log(
  "No se crearon archivos de respaldo."
);

console.log(
  "IMPORTANTE: falta desplegarla a Supabase."
);
