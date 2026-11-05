/**
 * Supabase Edge Function: state-sync
 *
 * Implementa os endpoints consumidos por src/storage/cloud-saas-provider.ts:
 * - POST /v1/state/push
 * - GET  /v1/state/pull
 * - GET  /v1/state/version
 * - GET  /health
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

async function computeSha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) {
    return Response.json({ ok: true }, { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401, headers: CORS_HEADERS });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: 'Token inválido.' }, { status: 401, headers: CORS_HEADERS });
  }

  // Verifica se o usuário possui assinatura Pro/Mentor ativa
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier, subscription_status, subscription_period_end')
    .eq('id', user.id)
    .single();

  const isPaidActive =
    profile &&
    (profile.plan_tier === 'pro' || profile.plan_tier === 'mentor') &&
    (profile.subscription_status === 'active' || profile.subscription_status === 'trialing') &&
    (!profile.subscription_period_end || Date.parse(profile.subscription_period_end) > Date.now());

  if (!isPaidActive) {
    return Response.json(
      { error: 'Sincronização na nuvem requer assinatura StudyTrack Pro ativa.' },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  if (req.method === 'GET' && url.pathname.endsWith('/version')) {
    const { data } = await supabase
      .from('user_study_states')
      .select('server_updated_at, checksum_sha256')
      .eq('user_id', user.id)
      .maybeSingle();

    return Response.json(
      {
        serverUpdatedAt: data?.server_updated_at ?? null,
        checksum: data?.checksum_sha256 ?? null,
      },
      { headers: CORS_HEADERS }
    );
  }

  if (req.method === 'GET' && url.pathname.endsWith('/pull')) {
    const { data } = await supabase
      .from('user_study_states')
      .select('state_json, server_updated_at, checksum_sha256')
      .eq('user_id', user.id)
      .maybeSingle();

    return Response.json(
      {
        stateJson: data?.state_json ?? null,
        serverUpdatedAt: data?.server_updated_at ?? null,
        checksum: data?.checksum_sha256 ?? null,
      },
      { headers: CORS_HEADERS }
    );
  }

  if (req.method === 'POST' && url.pathname.endsWith('/push')) {
    const body = await req.json();
    const stateJson = body?.stateJson;
    const schemaVersion = Number(body?.schemaVersion || stateJson?.schemaVersion || 1);
    const clientUpdatedAt = body?.clientUpdatedAt || new Date().toISOString();
    const deviceId = req.headers.get('X-Device-Id') || null;

    if (!stateJson || typeof stateJson !== 'object') {
      return Response.json(
        { error: 'Payload stateJson inválido.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const serialized = JSON.stringify(stateJson);
    const checksum = await computeSha256Hex(serialized);
    const serverUpdatedAt = new Date().toISOString();

    const { error: upsertError } = await supabase.from('user_study_states').upsert({
      user_id: user.id,
      schema_version: schemaVersion,
      state_json: stateJson,
      checksum_sha256: checksum,
      device_id: deviceId,
      client_updated_at: clientUpdatedAt,
      server_updated_at: serverUpdatedAt,
    });

    if (upsertError) {
      return Response.json(
        { error: upsertError.message },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return Response.json({ serverUpdatedAt, checksum }, { headers: CORS_HEADERS });
  }

  return Response.json({ error: 'Rota não encontrada.' }, { status: 404, headers: CORS_HEADERS });
});
