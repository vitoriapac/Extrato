/**
 * Supabase Edge Function: state-sync
 *
 * Implementa os endpoints consumidos por src/storage/cloud-saas-provider.ts:
 * - POST /v1/state/push
 * - GET  /v1/state/pull
 * - GET  /v1/state/version
 * - GET  /health
 */

import { corsFor } from '../_shared/cors.ts';
import { MAX_REQUEST_BYTES, MAX_STATE_BYTES, parsePushBody } from '../_shared/request-validation.ts';
import { createClient } from '../_shared/supabase.ts';

async function computeSha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  const CORS_HEADERS = corsFor(
    req,
    'GET, POST, OPTIONS',
    'authorization, x-client-info, apikey, content-type, x-device-id'
  );
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
      { error: 'Sincronização na nuvem requer assinatura Extrato de Estudos Pro ativa.' },
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
    const tooBig = () =>
      Response.json({ error: 'Corpo grande demais.' }, { status: 413, headers: CORS_HEADERS });
    if (Number(req.headers.get('content-length') ?? 0) > MAX_REQUEST_BYTES) return tooBig();

    let body: unknown;
    try {
      const raw = await req.text();
      if (raw.length > MAX_REQUEST_BYTES) return tooBig();
      body = JSON.parse(raw);
    } catch {
      return Response.json({ error: 'Payload inválido.' }, { status: 400, headers: CORS_HEADERS });
    }

    const parsed = parsePushBody(body);
    if ('error' in parsed) {
      return Response.json({ error: parsed.error }, { status: 400, headers: CORS_HEADERS });
    }
    const { stateJson, schemaVersion, clientUpdatedAt, baseServerUpdatedAt } = parsed;
    const deviceId = (req.headers.get('X-Device-Id') || '').slice(0, 128) || null;

    const serialized = JSON.stringify(stateJson);
    if (serialized.length > MAX_STATE_BYTES) return tooBig();
    const checksum = await computeSha256Hex(serialized);

    // Compare-and-set + snapshot do estado anterior, atômicos no banco (migration push_user_state_rpc).
    const { data: pushed, error: pushError } = await supabase.rpc('push_user_state', {
      p_schema_version: schemaVersion,
      p_state: stateJson,
      p_checksum: checksum,
      p_device_id: deviceId,
      p_client_updated_at: clientUpdatedAt,
      p_base_version: baseServerUpdatedAt,
    });

    if (pushError) {
      console.error('state-sync: falha no push', pushError.message);
      const denied = pushError.code === '42501';
      return Response.json(
        {
          error: denied
            ? 'Sincronização na nuvem requer assinatura Extrato de Estudos Pro ativa.'
            : 'Falha ao salvar.',
        },
        { status: denied ? 403 : 500, headers: CORS_HEADERS }
      );
    }

    if (pushed?.status === 'conflict') {
      return Response.json(
        {
          error: 'Conflito: o servidor tem uma versão mais nova.',
          serverUpdatedAt: pushed.serverUpdatedAt,
          checksum: pushed.checksum,
        },
        { status: 409, headers: CORS_HEADERS }
      );
    }

    return Response.json(
      { serverUpdatedAt: pushed.serverUpdatedAt, checksum: pushed.checksum },
      { headers: CORS_HEADERS }
    );
  }

  return Response.json({ error: 'Rota não encontrada.' }, { status: 404, headers: CORS_HEADERS });
});
