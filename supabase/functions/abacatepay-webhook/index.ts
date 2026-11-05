/**
 * Supabase Edge Function: abacatepay-webhook
 *
 * Recebe confirmação de pagamento PIX (`billing.paid`) da AbacatePay,
 * valida o segredo do webhook (`?webhookSecret=...` ou header `x-webhook-secret`)
 * e libera instantaneamente o Plano Pro no perfil do estudante.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método não permitido.' }, { status: 405 });
  }

  const expectedSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET');
  const url = new URL(req.url);
  const providedSecret =
    url.searchParams.get('webhookSecret') || req.headers.get('x-webhook-secret');

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return Response.json({ error: 'Assinatura de webhook inválida.' }, { status: 401 });
  }

  const payload = await req.json();
  const eventType = payload?.event;
  const billing = payload?.data?.billing || payload?.data;
  const billingId = billing?.id;

  if (eventType !== 'billing.paid' || !billingId) {
    return Response.json({ received: true, ignored: true });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: order } = await supabaseAdmin
    .from('billing_orders')
    .select('id, user_id, plan_id, status')
    .eq('provider_billing_id', billingId)
    .maybeSingle();

  const userId = order?.user_id || billing?.metadata?.userId;
  const planId = order?.plan_id || billing?.metadata?.planId || 'pro_annual';

  if (!userId) {
    return Response.json({ error: 'Usuário não identificado na cobrança.' }, { status: 400 });
  }

  const durationDays = planId === 'pro_monthly' ? 31 : 366;
  const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from('profiles')
    .update({
      plan_tier: 'pro',
      subscription_status: 'active',
      subscription_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (order?.id) {
    await supabaseAdmin
      .from('billing_orders')
      .update({
        status: 'PAID',
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id);
  }

  return Response.json({ received: true, activatedUserId: userId, planId, periodEnd });
});
