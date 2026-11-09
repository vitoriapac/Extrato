/**
 * Supabase Edge Function: admin-api
 *
 * Endpoints protegidos para o Backoffice e Painel Administrativo:
 * - GET  /v1/admin/dashboard
 * - POST /v1/admin/extend-subscription
 * - POST /v1/admin/change-role
 * - POST /v1/admin/refund-order
 * - GET  /v1/admin/user-snapshots
 * - POST /v1/admin/restore-snapshot
 */

import { corsFor } from '../_shared/cors.ts';
import { createClient } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  const CORS_HEADERS = corsFor(
    req,
    'GET, POST, OPTIONS',
    'authorization, x-client-info, apikey, content-type'
  );
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401, headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: 'Token inválido ou expirado.' }, { status: 401, headers: CORS_HEADERS });
  }

  // Verifica permissão de admin no banco
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return Response.json(
      { error: 'Acesso negado: privilégios de administrador requeridos.' },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  const url = new URL(req.url);

  // 1. Dashboard: lista perfis, pedidos e logs de auditoria
  if (url.pathname.endsWith('/dashboard') && req.method === 'GET') {
    const [{ data: profiles }, { data: orders }, { data: auditLogs }] = await Promise.all([
      adminClient.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
      adminClient.from('billing_orders').select('*').order('created_at', { ascending: false }).limit(200),
      adminClient.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    return Response.json(
      {
        profiles: profiles || [],
        orders: orders || [],
        auditLogs: auditLogs || [],
      },
      { headers: CORS_HEADERS }
    );
  }

  // 2. Extensão / Concessão manual de assinatura
  if (url.pathname.endsWith('/extend-subscription') && req.method === 'POST') {
    const { userId, days, reason } = await req.json();
    if (!userId || !days || !reason) {
      return Response.json({ error: 'Parâmetros incompletos.' }, { status: 400, headers: CORS_HEADERS });
    }

    const { error: rpcError } = await adminClient.rpc('admin_extend_subscription', {
      p_admin_id: user.id,
      p_target_user_id: userId,
      p_days: Number(days),
      p_reason: String(reason),
    });

    if (rpcError) {
      return Response.json({ error: rpcError.message }, { status: 400, headers: CORS_HEADERS });
    }

    return Response.json({ ok: true }, { headers: CORS_HEADERS });
  }

  // 3. Alteração de Role (Promoção para Mentor ou Admin)
  if (url.pathname.endsWith('/change-role') && req.method === 'POST') {
    const { userId, newRole, reason } = await req.json();
    if (!userId || !newRole || !reason) {
      return Response.json({ error: 'Parâmetros incompletos.' }, { status: 400, headers: CORS_HEADERS });
    }

    const { error: rpcError } = await adminClient.rpc('admin_change_role', {
      p_admin_id: user.id,
      p_target_user_id: userId,
      p_new_role: String(newRole),
      p_reason: String(reason),
    });

    if (rpcError) {
      return Response.json({ error: rpcError.message }, { status: 400, headers: CORS_HEADERS });
    }

    return Response.json({ ok: true }, { headers: CORS_HEADERS });
  }

  return Response.json({ error: 'Endpoint não encontrado.' }, { status: 404, headers: CORS_HEADERS });
});
