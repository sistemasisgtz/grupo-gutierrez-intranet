// GRUPO GUTIÉRREZ
// Descarga privada de nómina desde YO.
// La RPC valida la sesión de intranet y el
// empleado propietario de cada documento.

import { createClient } from
  'npm:@supabase/supabase-js@2';

const base =
  Deno.env.get('SUPABASE_URL') || '';

const secret =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  || JSON.parse(
    Deno.env.get('SUPABASE_SECRET_KEYS') || '{}'
  ).default;

const admin = createClient(base,secret,{
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

Deno.serve(async request => {
  const origin =
    request.headers.get('origin') || '*';

  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers':
      'authorization,apikey,content-type,x-client-info',
    'Access-Control-Allow-Methods':
      'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null,{
      status: 204,headers
    });
  }

  if (request.method !== 'POST') {
    return Response.json(
      {error:'Solo POST'},
      {status:405,headers}
    );
  }

  try {
    const input = await request.json();

    if (
      typeof input.session_token !== 'string'
      || input.session_token.length < 16
      || typeof input.document_id !== 'string'
      || !/^[\da-f-]{36}$/i.test(input.document_id)
    ) {
      return Response.json(
        {error:'Datos inválidos'},
        {status:400,headers}
      );
    }

    const check = await admin.rpc(
      'gg_payroll_yo_open_path',
      {
        p_session_token: input.session_token,
        p_document_id: input.document_id
      }
    );

    if (check.error || !check.data) {
      return Response.json(
        {error:'No autorizado o sesión vencida'},
        {status:403,headers}
      );
    }

    const signed = await admin.storage
      .from('gg-payroll-private')
      .createSignedUrl(check.data,45);

    if (
      signed.error
      || !signed.data?.signedUrl
    ) {
      throw Error(
        'No se pudo crear enlace privado'
      );
    }

    return Response.json(
      {url:signed.data.signedUrl},
      {status:200,headers}
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {error:'Error de lectura privada'},
      {status:500,headers}
    );
  }
});