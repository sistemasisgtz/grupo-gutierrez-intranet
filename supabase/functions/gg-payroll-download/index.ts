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
