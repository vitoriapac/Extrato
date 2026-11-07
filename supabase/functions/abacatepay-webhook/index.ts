/**
 * Supabase Edge Function: abacatepay-webhook
 *
 * Recebe `billing.paid` da AbacatePay. O segredo vem só do header `x-webhook-secret`
 * (comparação em tempo constante). Plano e valor vêm do pedido em `billing_orders`,
 * nunca do payload; a liquidação é atômica e idempotente (RPC `settle_billing_order`).
 */

import { createClient } from '../_shared/supabase.ts';
import { checkOrder, MAX_BODY_BYTES, parseBillingPaid, safeEqual } from '../_shared/webhook-logic.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método não permitido.' }, { status: 405 });
  }

  const expectedSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET');
  if (!expectedSecret || !(await safeEqual(req.headers.get('x-webhook-secret'), expectedSecret))) {
    return Response.json({ error: 'Assinatura de webhook inválida.' }, { status: 401 });
  }

  const tooBig = () => Response.json({ error: 'Corpo grande demais.' }, { status: 413 });
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return tooBig();
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return tooBig();

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const event = parseBillingPaid(payload);
  if (!event) return Response.json({ received: true, ignored: true });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: order, error: orderError } = await supabaseAdmin
    .from('billing_orders')
    .select('id, status, amount_cents')
    .eq('provider_billing_id', event.billingId)
    .maybeSingle();
  if (orderError) {
    console.error('webhook: falha ao buscar pedido', orderError.message);
    return Response.json({ error: 'Falha interna.' }, { status: 500 });
  }

  const check = checkOrder(order, event.paidCents);
  if (check !== 'ok') {
    // 200 para o provedor não reenviar; already_paid é replay idempotente.
    if (check !== 'already_paid') console.warn('webhook ignorado:', check, event.billingId);
    return Response.json({ received: true, ignored: true });
  }

  const { error: settleError } = await supabaseAdmin.rpc('settle_billing_order', {
    p_order_id: order!.id,
  });
  if (settleError) {
    console.error('webhook: falha ao liquidar pedido', settleError.message);
    return Response.json({ error: 'Falha interna.' }, { status: 500 });
  }

  return Response.json({ received: true });
});
